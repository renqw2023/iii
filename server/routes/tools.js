const express = require('express');
const multer = require('multer');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');

// multer memoryStorage — no disk write needed
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('只支持图片文件'));
  },
});

/**
 * POST /api/tools/img2prompt
 * 上传图片 → OpenAI gpt-4o Vision → 返回英文 Prompt
 * 需要登录 + 扣除 1 积分
 */
router.post('/img2prompt', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请上传图片' });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return res.status(503).json({ message: 'OpenAI API 未配置，请联系管理员' });
    }

    // 检查积分
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: '用户不存在' });
    if ((user.credits || 0) < 1) {
      return res.status(402).json({ message: '积分不足，请先获取积分' });
    }

    // 图片转 base64
    const base64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // 调用 OpenAI Vision
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Describe this image as a detailed Midjourney/Stable Diffusion prompt in English. Focus on: subject, style, lighting, colors, composition, mood, and any notable visual elements. Output ONLY the prompt text, no explanation.',
              },
              {
                type: 'image_url',
                image_url: { url: dataUrl, detail: 'high' },
              },
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

    // 扣除积分
    user.credits -= 1;
    await user.save();
    await CreditTransaction.create({
      userId: user._id,
      type: 'spend',
      amount: 1,
      reason: 'img2prompt',
      note: '图生文（反推 Prompt）',
      balanceAfter: user.credits,
    });

    res.json({ prompt, creditsLeft: user.credits });
  } catch (error) {
    console.error('img2prompt 错误:', error);
    if (error.message === '只支持图片文件') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: '处理失败，请稍后重试' });
  }
});

module.exports = router;
