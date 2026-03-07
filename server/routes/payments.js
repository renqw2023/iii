const express = require('express');
const Stripe = require('stripe');
const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const { auth } = require('../middleware/auth');
const config = require('../config');
const creditPlans = require('../config/creditPlans');

const router = express.Router();

// GET /api/payments/plans — 公开，返回套餐列表
router.get('/plans', (req, res) => {
  res.json({ plans: creditPlans });
});

// POST /api/payments/create-checkout — 需登录，创建 Stripe Checkout Session
router.post('/create-checkout', auth, async (req, res) => {
  const { planId } = req.body;
  const plan = creditPlans.find(p => p.id === planId);
  if (!plan) {
    return res.status(400).json({ message: 'Invalid plan' });
  }

  const stripeKey = config.services.stripe.secretKey;
  if (!stripeKey) {
    return res.status(503).json({ message: 'Payment service not configured' });
  }

  const stripe = Stripe(stripeKey);
  const clientUrl = config.server.clientUrl;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: config.services.stripe.currency,
            product_data: { name: `${plan.name} — ${plan.credits.toLocaleString()} Credits` },
            unit_amount: Math.round(plan.price * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${clientUrl}/credits?payment=success`,
      cancel_url: `${clientUrl}/credits?payment=cancelled`,
      metadata: {
        userId: req.userId,
        planId: plan.id,
        credits: String(plan.credits),
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ message: 'Failed to create checkout session' });
  }
});

// POST /api/payments/webhook — Stripe webhook，无 auth，需 raw body
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = config.services.stripe.webhookSecret;
  const stripeKey = config.services.stripe.secretKey;

  if (!stripeKey || !webhookSecret) {
    return res.status(503).json({ message: 'Payment service not configured' });
  }

  const stripe = Stripe(stripeKey);
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature error:', err.message);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, planId, credits } = session.metadata;
    const creditsNum = parseInt(credits, 10);

    if (!userId || !creditsNum) {
      return res.json({ received: true });
    }

    try {
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { credits: creditsNum } },
        { new: true }
      );

      if (updatedUser) {
        await CreditTransaction.create({
          userId,
          type: 'earn',
          amount: creditsNum,
          reason: 'purchase',
          note: `${creditPlans.find(p => p.id === planId)?.name || planId} pack`,
          balanceAfter: updatedUser.credits,
        });
      }
    } catch (err) {
      console.error('Webhook credit update error:', err);
    }
  }

  res.json({ received: true });
});

module.exports = router;
