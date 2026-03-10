const express = require('express');
const multer = require('multer');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const { refreshFreeCreditsIfNeeded } = require('./credits');

const CREDIT_COST = 2; // img2prompt 每次消耗积分

// multer memoryStorage — no disk write needed
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('只支持图片文件'));
  },
});

// 允许的 Vision 模型映射
const ALLOWED_MODELS = {
  'gpt-4o':      'gpt-4o',
  'gpt-4o-mini': 'gpt-4o-mini',
};
const DEFAULT_MODEL = 'gpt-4o';

/**
 * 双积分扣除（先 freeCredits，再 credits）
 */
async function deductCredits(user, cost) {
  const freeAvail = user.freeCredits ?? 0;
  const paidAvail = user.credits ?? 0;
  if (freeAvail + paidAvail < cost) return { ok: false, freeDeducted: 0, paidDeducted: 0 };

  const freeDeducted = Math.min(freeAvail, cost);
  const paidDeducted = cost - freeDeducted;
  user.freeCredits = freeAvail - freeDeducted;
  user.credits = paidAvail - paidDeducted;
  await user.save();
  return { ok: true, freeDeducted, paidDeducted };
}

/**
 * POST /api/tools/img2prompt
 * 支持两种模式：
 *   1. multipart/form-data: 上传图片文件（image 字段）+ 可选 model 字段
 *   2. JSON body: { imageUrl, model? } — 拖拽 gallery 图片，直接传 URL
 * 需要登录 + 扣除 2 积分（先 freeCredits，再 credits）
 */
router.post(
  '/img2prompt',
  auth,
  (req, res, next) => {
    // JSON 请求（URL 模式）跳过 multer
    if (req.headers['content-type']?.includes('application/json')) return next();
    upload.single('image')(req, res, next);
  },
  async (req, res) => {
    try {
      const hasFile = !!req.file;
      const imageUrl = req.body?.imageUrl;
      const modelId = req.body?.model;

      if (!hasFile && !imageUrl) {
        return res.status(400).json({ message: '请上传图片或提供图片 URL' });
      }

      const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
      if (!OPENAI_API_KEY) {
        return res.status(503).json({ message: 'OpenAI API 未配置，请联系管理员' });
      }

      // 校验并解析模型
      const openaiModel = ALLOWED_MODELS[modelId] ?? DEFAULT_MODEL;

      // 检查用户 + 刷新每日免费额度
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ message: '用户不存在' });
      await refreshFreeCreditsIfNeeded(user);

      const totalAvail = (user.freeCredits ?? 0) + (user.credits ?? 0);
      if (totalAvail < CREDIT_COST) {
        return res.status(402).json({ message: `积分不足，需要 ${CREDIT_COST} 积分` });
      }

      // 构建 OpenAI image_url — 文件用 base64，URL 直接传
      const imagePayload = hasFile
        ? { url: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`, detail: 'high' }
        : { url: imageUrl, detail: 'high' };

      // 调用 OpenAI Vision
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: openaiModel,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Describe this image as a detailed Midjourney/Stable Diffusion prompt in English. Focus on: subject, style, lighting, colors, composition, mood, and any notable visual elements. Output ONLY the prompt text, no explanation.',
                },
                { type: 'image_url', image_url: imagePayload },
              ],
            },
          ],
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        console.error('OpenAI API 错误:', errBody);
        return res.status(502).json({ message: 'AI 服务暂时不可用，请稍后重试' });
      }

      const data = await response.json();
      const prompt = data.choices?.[0]?.message?.content?.trim();

      if (!prompt) {
        return res.status(502).json({ message: 'AI 返回结果为空，请重试' });
      }

      // 扣除积分（先 freeCredits，再 credits）
      const { ok, freeDeducted, paidDeducted } = await deductCredits(user, CREDIT_COST);
      if (!ok) {
        return res.status(402).json({ message: `积分不足，需要 ${CREDIT_COST} 积分` });
      }

      const note = `图生文（反推 Prompt）— ${openaiModel}`;
      if (freeDeducted > 0) {
        await CreditTransaction.create({
          userId: user._id, type: 'spend', amount: freeDeducted,
          reason: 'img2prompt', note: `[免费] ${note}`, balanceAfter: user.freeCredits,
        });
      }
      if (paidDeducted > 0) {
        await CreditTransaction.create({
          userId: user._id, type: 'spend', amount: paidDeducted,
          reason: 'img2prompt', note: `[付费] ${note}`, balanceAfter: user.credits,
        });
      }

      res.json({ prompt, creditsLeft: user.credits, freeCreditsLeft: user.freeCredits });
    } catch (error) {
      console.error('img2prompt 错误:', error);
      if (error.message === '只支持图片文件') {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: '处理失败，请稍后重试' });
    }
  }
);

module.exports = router;
