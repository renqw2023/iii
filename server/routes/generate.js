const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const CreditTransaction = require('../models/CreditTransaction');
const { refreshFreeCreditsIfNeeded } = require('./credits');

const MODELS = [
  // ── Google Gemini / Imagen ── (排在最前，优先展示)
  {
    id: 'imagen-pro',
    name: 'Nanobanana Pro',
    provider: 'Google',
    apiModel: 'imagen-3.0-generate-001',
    creditCost: 8,
    available: () => !!process.env.GEMINI_API_KEY,
    description: 'Imagen 3 · Best quality',
    badge: 'Pro',
  },
  {
    id: 'gemini-flash',
    name: 'Nanobanana 2',
    provider: 'Google',
    apiModel: 'gemini-2.0-flash-exp',   // 正确模型 ID（支持图片输出）
    creditCost: 5,
    available: () => !!process.env.GEMINI_API_KEY,
    description: 'Gemini 2.0 Flash · Fast & creative',
  },
  {
    id: 'imagen-fast',
    name: 'Nanobanana 2 Fast',
    provider: 'Google',
    apiModel: 'imagen-3.0-fast-generate-001',
    creditCost: 4,
    available: () => !!process.env.GEMINI_API_KEY,
    description: 'Imagen 3 Fast · Economical',
  },
  // ── OpenAI ──
  {
    id: 'gpt-image-1',
    name: 'GPT Image 1.5',
    provider: 'OpenAI',
    apiModel: 'gpt-image-1',
    creditCost: 10,
    available: () => !!process.env.OPENAI_API_KEY,
    description: 'GPT Image · Ultra quality',
    badge: 'HD',
  },
  {
    id: 'dall-e-3',
    name: 'DALL·E 3',
    provider: 'OpenAI',
    apiModel: 'dall-e-3',
    creditCost: 8,
    available: () => !!process.env.OPENAI_API_KEY,
    description: 'DALL·E 3 · High quality',
    badge: 'HD',
  },
  // ── Zhipu ──
  {
    id: 'cogview-flash',
    name: 'Z Image Turbo',
    provider: 'Zhipu',
    apiModel: 'cogview-3-flash',
    creditCost: 4,
    available: () => !!process.env.ZHIPU_API_KEY,
    description: 'CogView-3 · Fast & free tier',
  },
  // ── Coming Soon ──
  {
    id: 'midjourney-niji',
    name: 'Midjourney Niji 7',
    provider: 'Midjourney',
    apiModel: null,
    creditCost: 15,
    available: () => false,
    description: 'Anime & illustration',
    badge: 'Soon',
    comingSoon: true,
  },
];

/**
 * 双积分扣除：先扣 freeCredits，再扣 credits
 * 合计不足 → 返回 false（调用方应返回 402）
 * @returns {{ ok: boolean, freeDeducted: number, paidDeducted: number }}
 */
async function deductCredits(user, cost) {
  const freeAvail = user.freeCredits ?? 0;
  const paidAvail = user.credits ?? 0;
  if (freeAvail + paidAvail < cost) return { ok: false, freeDeducted: 0, paidDeducted: 0 };

  let freeDeducted = Math.min(freeAvail, cost);
  let paidDeducted = cost - freeDeducted;

  user.freeCredits = freeAvail - freeDeducted;
  user.credits = paidAvail - paidDeducted;
  await user.save();
  return { ok: true, freeDeducted, paidDeducted };
}

/**
 * GET /api/generate/models
 * 返回当前已配置 API Key 的可用模型列表（无需登录）
 */
router.get('/models', (req, res) => {
  const available = MODELS
    .filter(m => m.available() || m.comingSoon)
    .map(({ available: _, ...m }) => m);
  res.json({ models: available });
});

/**
 * POST /api/generate/image
 * Body: { prompt, modelId, aspectRatio: '1:1'|'4:3'|'3:4'|'16:9' }
 * 需要登录，消耗积分（先 freeCredits，再 credits）
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
    if (model.comingSoon) {
      return res.status(503).json({ message: `${model.name} 即将上线，敬请期待` });
    }
    if (!model.available()) {
      return res.status(503).json({ message: `${model.name} API 未配置，请联系管理员` });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: '用户不存在' });

    // 刷新每日免费额度
    await refreshFreeCreditsIfNeeded(user);

    const totalAvail = (user.freeCredits ?? 0) + (user.credits ?? 0);
    if (totalAvail < model.creditCost) {
      return res.status(402).json({ message: `积分不足，需要 ${model.creditCost} 积分（当前 ${totalAvail}）` });
    }

    // 确保保存目录存在
    const genDir = path.join(__dirname, '../../uploads/generated');
    fs.mkdirSync(genDir, { recursive: true });

    const filename = `gen_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.png`;
    const filePath = path.join(genDir, filename);
    const imageUrl = `/uploads/generated/${filename}`;

    // ── Gemini 2.0 Flash Exp（文生图，支持 IMAGE 输出）──
    if (modelId === 'gemini-flash') {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model.apiModel}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
          }),
        }
      );

      if (!geminiRes.ok) {
        const errBody = await geminiRes.json().catch(() => ({}));
        console.error('Gemini Flash API 错误:', errBody);
        return res.status(502).json({ message: `Gemini 服务错误: ${errBody?.error?.message || geminiRes.status}` });
      }

      const data = await geminiRes.json();
      const part = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (!part) {
        console.error('Gemini 无图片 part:', JSON.stringify(data).slice(0, 400));
        return res.status(502).json({ message: 'Gemini 未返回图片，请换一个描述试试' });
      }

      fs.writeFileSync(filePath, Buffer.from(part.inlineData.data, 'base64'));

    // ── Google Imagen 3 (Fast / Pro) via Generative Language API ──
    } else if (modelId === 'imagen-fast' || modelId === 'imagen-pro') {
      const imagenRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model.apiModel}:predict?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [{ prompt }],
            parameters: {
              sampleCount: 1,
              aspectRatio: aspectRatio === '1:1' ? '1:1' : aspectRatio === '4:3' ? '4:3' : aspectRatio === '3:4' ? '3:4' : '16:9',
            },
          }),
        }
      );

      if (!imagenRes.ok) {
        const errBody = await imagenRes.json().catch(() => ({}));
        console.error('Imagen API 错误:', errBody);
        return res.status(502).json({ message: `Imagen 服务错误: ${errBody?.error?.message || imagenRes.status}` });
      }

      const imagenData = await imagenRes.json();
      const b64 = imagenData.predictions?.[0]?.bytesBase64Encoded;
      if (!b64) {
        console.error('Imagen 无 predictions:', JSON.stringify(imagenData).slice(0, 400));
        return res.status(502).json({ message: 'Imagen 未返回图片，请换一个描述试试' });
      }
      fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));

    // ── GPT Image 1.5 ──
    } else if (modelId === 'gpt-image-1') {
      const sizeMap = {
        '1:1': '1024x1024',
        '4:3': '1536x1024',
        '3:4': '1024x1536',
        '16:9': '1536x1024',
      };

      const gptRes = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-image-1',
          prompt,
          n: 1,
          size: sizeMap[aspectRatio] || '1024x1024',
        }),
      });

      if (!gptRes.ok) {
        const errBody = await gptRes.json().catch(() => ({}));
        console.error('GPT Image API 错误:', errBody);
        return res.status(502).json({ message: 'GPT Image 服务暂时不可用，请稍后重试' });
      }

      const gptData = await gptRes.json();
      const b64 = gptData.data?.[0]?.b64_json;
      if (!b64) {
        return res.status(502).json({ message: 'GPT Image 未返回图片数据' });
      }
      fs.writeFileSync(filePath, Buffer.from(b64, 'base64'));

    // ── DALL·E 3 ──
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

    // ── Zhipu CogView-3-flash ──
    } else if (modelId === 'cogview-flash') {
      const zhipuRes = await fetch('https://open.bigmodel.cn/api/paas/v4/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'cogview-3-flash',
          prompt,
        }),
      });

      if (!zhipuRes.ok) {
        const errBody = await zhipuRes.json().catch(() => ({}));
        console.error('Zhipu CogView API 错误:', errBody);
        return res.status(502).json({ message: 'Z Image 服务暂时不可用，请稍后重试' });
      }

      const zhipuData = await zhipuRes.json();
      const imgUrl = zhipuData.data?.[0]?.url;
      if (!imgUrl) {
        return res.status(502).json({ message: 'Z Image 未返回图片 URL' });
      }

      const imgFetch = await fetch(imgUrl);
      if (!imgFetch.ok) {
        return res.status(502).json({ message: 'Z Image 图片下载失败' });
      }
      const buffer = Buffer.from(await imgFetch.arrayBuffer());
      fs.writeFileSync(filePath, buffer);

    } else {
      return res.status(400).json({ message: '不支持的模型 ID' });
    }

    // 扣除积分（先 freeCredits，再 credits）
    const { ok, freeDeducted, paidDeducted } = await deductCredits(user, model.creditCost);
    if (!ok) {
      // 极端情况：生图成功但积分不足（并发场景），删除文件
      fs.unlinkSync(filePath);
      return res.status(402).json({ message: `积分不足，需要 ${model.creditCost} 积分` });
    }

    // 记录交易流水
    const note = `${model.name} — ${prompt.slice(0, 50)}`;
    if (freeDeducted > 0) {
      await CreditTransaction.create({
        userId: user._id,
        type: 'spend',
        amount: freeDeducted,
        reason: 'generate_image',
        note: `[免费] ${note}`,
        balanceAfter: user.freeCredits,
      });
    }
    if (paidDeducted > 0) {
      await CreditTransaction.create({
        userId: user._id,
        type: 'spend',
        amount: paidDeducted,
        reason: 'generate_image',
        note: `[付费] ${note}`,
        balanceAfter: user.credits,
      });
    }

    res.json({
      imageUrl,
      creditsLeft: user.credits,
      freeCreditsLeft: user.freeCredits,
      modelName: model.name,
    });
  } catch (error) {
    console.error('generate/image 错误:', error);
    res.status(500).json({ message: '生成失败，请稍后重试' });
  }
});

module.exports = router;
