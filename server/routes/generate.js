const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');

const MODELS = [
  {
    id: 'gemini-flash',
    name: 'Gemini Flash',
    provider: 'Google',
    apiModel: 'gemini-2.0-flash-preview-image-generation',
    creditCost: 5,
    available: () => !!process.env.GEMINI_API_KEY,
    description: 'Fast & creative',
  },
  {
    id: 'dall-e-3',
    name: 'DALL·E 3',
    provider: 'OpenAI',
    apiModel: 'dall-e-3',
    creditCost: 8,
    available: () => !!process.env.OPENAI_API_KEY,
    description: 'High quality',
    badge: 'HD',
  },
];

/**
 * GET /api/generate/models
 * 返回当前已配置 API Key 的可用模型列表（无需登录）
 */
router.get('/models', (req, res) => {
  const available = MODELS
    .filter(m => m.available())
    .map(({ available: _, ...m }) => m);
  res.json({ models: available });
});

/**
 * POST /api/generate/image
 * Body: { prompt, modelId, aspectRatio: '1:1'|'4:3'|'3:4'|'16:9' }
 * 需要登录，消耗积分
 */
router.post('/image', auth, async (req, res) => {
  try {
    const { prompt, modelId, aspectRatio = '1:1' } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ message: '请输入生成描述' });
    }
    if (!modelId) {
      return res.status(400).json({ message: '请选择生成模型' });
    }

    const model = MODELS.find(m => m.id === modelId);
    if (!model) {
      return res.status(400).json({ message: '无效的模型 ID' });
    }
    if (!model.available()) {
      return res.status(503).json({ message: `${model.name} API 未配置，请联系管理员` });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: '用户不存在' });
    if ((user.credits || 0) < model.creditCost) {
      return res.status(402).json({ message: `积分不足，需要 ${model.creditCost} 积分` });
    }

    // 确保保存目录存在
    const genDir = path.join(__dirname, '../../uploads/generated');
    fs.mkdirSync(genDir, { recursive: true });

    const filename = `gen_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.png`;
    const filePath = path.join(genDir, filename);
    const imageUrl = `/uploads/generated/${filename}`;

    if (modelId === 'gemini-flash') {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model.apiModel}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
          }),
        }
      );

      if (!geminiRes.ok) {
        const errBody = await geminiRes.json().catch(() => ({}));
        console.error('Gemini API 错误:', errBody);
        return res.status(502).json({ message: 'Gemini 服务暂时不可用，请稍后重试' });
      }

      const data = await geminiRes.json();
      const part = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (!part) {
        return res.status(502).json({ message: 'Gemini 未返回图片，请换一个描述试试' });
      }

      fs.writeFileSync(filePath, Buffer.from(part.inlineData.data, 'base64'));

    } else if (modelId === 'dall-e-3') {
      const sizeMap = {
        '1:1': '1024x1024',
        '4:3': '1792x1024',
        '3:4': '1024x1792',
        '16:9': '1792x1024',
      };

      const dallRes = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt,
          n: 1,
          size: sizeMap[aspectRatio] || '1024x1024',
        }),
      });

      if (!dallRes.ok) {
        const errBody = await dallRes.json().catch(() => ({}));
        console.error('DALL·E 3 API 错误:', errBody);
        return res.status(502).json({ message: 'DALL·E 服务暂时不可用，请稍后重试' });
      }

      const dallData = await dallRes.json();
      const imgUrl = dallData.data?.[0]?.url;
      if (!imgUrl) {
        return res.status(502).json({ message: 'DALL·E 未返回图片 URL' });
      }

      const imgRes = await fetch(imgUrl);
      if (!imgRes.ok) {
        return res.status(502).json({ message: '图片下载失败' });
      }
      const buffer = Buffer.from(await imgRes.arrayBuffer());
      fs.writeFileSync(filePath, buffer);
    }

    // 扣除积分
    user.credits -= model.creditCost;
    await user.save();
    await CreditTransaction.create({
      userId: user._id,
      type: 'spend',
      amount: model.creditCost,
      reason: 'generate_image',
      note: `${model.name} — ${prompt.slice(0, 50)}`,
      balanceAfter: user.credits,
    });

    res.json({ imageUrl, creditsLeft: user.credits, modelName: model.name });
  } catch (error) {
    console.error('generate/image 错误:', error);
    res.status(500).json({ message: '生成失败，请稍后重试' });
  }
});

module.exports = router;
