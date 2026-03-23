const express = require('express');
const Stripe = require('stripe');
const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');
const config = require('../config');
const creditPlans = require('../config/creditPlans');

const router = express.Router();

router.get('/plans', (req, res) => {
  res.json({ plans: creditPlans });
});

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
    const user = await User.findById(req.userId).select('email');
    const session = await stripe.checkout.sessions.create({
      customer_email: user?.email || undefined,
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: config.services.stripe.currency,
            product_data: { name: `${plan.name} - ${plan.credits.toLocaleString()} Credits` },
            unit_amount: Math.round(plan.price * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${clientUrl}/credits?payment=success`,
      cancel_url: `${clientUrl}/credits?payment=cancelled`,
      metadata: {
        userId: String(req.userId),
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
      // Idempotency: skip if this session was already processed
      const existingOrder = await Order.findOne({ stripeSessionId: session.id });
      if (existingOrder) {
        return res.json({ received: true });
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { credits: creditsNum }, $set: { hasPurchasedBefore: true } },
        { new: true }
      );

      if (updatedUser) {
        const plan = creditPlans.find(p => p.id === planId);
        await CreditTransaction.create({
          userId,
          type: 'earn',
          amount: creditsNum,
          reason: 'purchase',
          note: `${plan?.name || planId} pack`,
          walletType: 'paid',
          balanceAfter: updatedUser.credits,
          freeBalanceAfter: updatedUser.freeCredits ?? null,
          paidBalanceAfter: updatedUser.credits,
          totalBalanceAfter: (updatedUser.freeCredits ?? 0) + updatedUser.credits,
        });
        await Order.create({
          userId,
          planId,
          planName: plan?.name || planId,
          amountUSD: (session.amount_total || 0) / 100,
          credits: creditsNum,
          currency: session.currency || 'usd',
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent || null,
          status: 'completed',
        });
      }
    } catch (err) {
      console.error('Webhook credit update error:', err);
    }
  }

  res.json({ received: true });
});

const PLAN_ORDER = ['free', 'starter', 'pro', 'ultimate'];

router.get('/orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('planId planName amountUSD currency credits status createdAt stripeSessionId');
    res.json({ orders });
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

router.get('/current-plan', auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId, status: 'completed' })
      .select('planId planName credits createdAt');
    const totalPurchased = orders.reduce((sum, o) => sum + (o.credits || 0), 0);
    const best = orders.reduce((prev, cur) =>
      PLAN_ORDER.indexOf(cur.planId) > PLAN_ORDER.indexOf(prev.planId) ? cur : prev,
      { planId: 'free', planName: 'Free', credits: 0, createdAt: null }
    );
    res.json({
      planId: best.planId,
      planName: best.planName,
      purchasedAt: best.createdAt || null,
      totalPurchased,
      ordersCount: orders.length,
    });
  } catch (err) {
    console.error('Get current plan error:', err);
    res.status(500).json({ message: 'Failed to fetch current plan' });
  }
});

module.exports = router;
