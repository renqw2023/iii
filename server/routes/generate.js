const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Generation = require('../models/Generation');
const { refreshFreeCreditsIfNeeded } = require('./credits');
const { deductCredits, recordDeductTransactions } = require('../utils/creditsUtils');
const {
  INVITER_BONUS,
  INVITEE_BONUS,
  grantReferralRewardsAfterFirstGeneration,
  markFirstGeneration,
} = require('../utils/referralUtils');

const MODELS = [
  // ── Google Gemini 3 / Imagen ── (排在最前，优先展示)
  {
    id: 'gemini3-pro',
    name: 'Nanobanana Pro',
    provider: 'Google',
    apiModel: 'gemini-3-pro-image-preview',
    creditCost: 10,
    available: () => !!process.env.GEMINI_API_KEY,
    description: 'Nanobanana Pro · Professional quality',
    badge: 'Pro',
  },
  {
    id: 'gemini3-flash',
    name: 'Nanobanana 2',
    provider: 'Google',
    apiModel: 'gemini-3.1-flash-image-preview',
    creditCost: 6,
    available: () => !!process.env.GEMINI_API_KEY,
    description: 'Nanobanana 2 · Fast generation',
  },
  {
    id: 'gemini25-flash',
    name: 'Nanobanana',
    provider: 'Google',
    apiModel: 'gemini-2.5-flash-image',
    creditCost: 4,
    available: () => !!process.env.GEMINI_API_KEY,
    description: 'Nanobanana · Fast & stable',
  },
  {
    id: 'imagen4-pro',
    name: 'Imagen 4 Pro',
    provider: 'Google',
    apiModel: 'imagen-4.0-generate-001',
    creditCost: 8,
    available: () => !!process.env.GEMINI_API_KEY,
    description: 'Imagen 4 · Best quality',
  },
  {
    id: 'imagen4-fast',
    name: 'Imagen 4 Fast',
    provider: 'Google',
    apiModel: 'imagen-4.0-fast-generate-001',
    creditCost: 4,
    available: () => !!process.env.GEMINI_API_KEY,
    description: 'Imagen 4 Fast · Economical',
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
    const { prompt, modelId, aspectRatio = '1:1', referenceImageData, referenceImageMime } = req.body;
    let resolution = req.body.resolution === '4K' ? '4K' : '2K';

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

    // 4K 鉴权：需要付费过至少一次
    if (resolution === '4K' && !user.hasPurchasedBefore) {
      return res.status(403).json({ message: '4K 画质需要付费套餐，请先购买积分' });
    }

    // 刷新每日免费额度
    await refreshFreeCreditsIfNeeded(user);

    const totalCreditCost = model.creditCost + (resolution === '4K' ? 5 : 0);
    const totalAvail = (user.freeCredits ?? 0) + (user.credits ?? 0);
    if (totalAvail < totalCreditCost) {
      return res.status(402).json({ message: `积分不足，需要 ${totalCreditCost} 积分（当前 ${totalAvail}）` });
    }

    // 确保保存目录存在
    const genDir = path.join(__dirname, '../../uploads/generated');
    fs.mkdirSync(genDir, { recursive: true });

    const filename = `gen_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.png`;
    const filePath = path.join(genDir, filename);
    const imageUrl = `/uploads/generated/${filename}`;

    // ── Gemini 3 Pro / 3.1 Flash（generateContent，IMAGE 输出）──
    if (modelId === 'gemini3-pro' || modelId === 'gemini3-flash' || modelId === 'gemini25-flash') {
      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model.apiModel}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(90000), // 90 秒超时
          body: JSON.stringify({
            contents: [{
              parts: [
                ...(referenceImageData ? [{ inlineData: { mimeType: referenceImageMime || 'image/jpeg', data: referenceImageData } }] : []),
                { text: prompt },
              ],
            }],
            generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
          }),
        }
      );

      if (!geminiRes.ok) {
        const errBody = await geminiRes.json().catch(() => ({}));
        console.error('Gemini API 错误:', errBody);
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
    } else if (modelId === 'imagen4-fast' || modelId === 'imagen4-pro') {
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

    // 4K upscaling（在积分扣除前完成，避免扣费但 upscale 失败）
    let finalImageUrl = imageUrl;
    let originalImageUrl;
    if (resolution === '4K') {
      try {
        const { upscaleImage } = require('../services/upscaleService');
        originalImageUrl = imageUrl;

        // 1. 调用 Replicate 超分，返回临时 CDN URL
        const replicateUrl = await upscaleImage(filePath, 2);

        // 2. 立即下载到本地磁盘，避免 CDN URL (~1h) 过期
        const filename4k = `gen_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_4k.png`;
        const filePath4k = path.join(genDir, filename4k);
        const cdnRes = await fetch(replicateUrl, { signal: AbortSignal.timeout(60000) });
        if (!cdnRes.ok) throw new Error(`4K download failed: ${cdnRes.status}`);
        fs.writeFileSync(filePath4k, Buffer.from(await cdnRes.arrayBuffer()));

        finalImageUrl = `/uploads/generated/${filename4k}`;
      } catch (upscaleErr) {
        console.error('Upscale failed, falling back to original:', upscaleErr.message);
        resolution = '2K';
      }
    }

    // 扣除积分（先 freeCredits，再 credits）
    const { ok, freeDeducted, paidDeducted } = await deductCredits(user, totalCreditCost);
    if (!ok) {
      // 极端情况：生图成功但积分不足（并发场景），删除文件
      fs.unlinkSync(filePath);
      return res.status(402).json({ message: `积分不足，需要 ${totalCreditCost} 积分` });
    }

    // 记录交易流水
    const note = `${model.name} — ${prompt.slice(0, 50)}`;
    await recordDeductTransactions(user._id, 'generate_image', note, freeDeducted, paidDeducted, user.freeCredits, user.credits);

    const now = new Date();
    await markFirstGeneration(user._id, now);
    const referralReward = await grantReferralRewardsAfterFirstGeneration(user._id, now);

    const updatedCreditsLeft = referralReward?.invitee?.credits ?? user.credits;
    const updatedFreeCreditsLeft = referralReward?.invitee?.freeCredits ?? user.freeCredits;

    // 保存生成记录（失败不影响返回）
    try {
      await Generation.create({
        user: req.userId,
        prompt: prompt.slice(0, 500),
        modelId,
        modelName: model.name,
        imageUrl: finalImageUrl,
        originalImageUrl,
        aspectRatio,
        creditCost: totalCreditCost,
        resolution,
        status: 'success',
      });
    } catch (e) {
      console.error('Generation save error:', e);
    }

    res.json({
      imageUrl: finalImageUrl,
      resolution,
      creditsLeft: updatedCreditsLeft,
      freeCreditsLeft: updatedFreeCreditsLeft,
      modelName: model.name,
      referralRewardUnlocked: Boolean(referralReward),
      inviteeBonusGranted: referralReward?.inviteeBonus ?? 0,
      inviterBonusGranted: referralReward?.inviterBonus ?? 0,
      referralRewardMessage: referralReward
        ? `Referral rewards unlocked: you received ${INVITEE_BONUS} credits and your inviter received ${INVITER_BONUS} credits.`
        : null,
    });
  } catch (error) {
    console.error('generate/image 错误:', error);
    res.status(500).json({ message: '生成失败，请稍后重试' });
  }
});

/**
 * POST /api/generate/video/upload-frame
 * Uploads a frame image (first/last frame for i2v) and returns its public URL.
 * Body: multipart/form-data with field "frame" (single image file)
 */
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const frameStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/video-frames');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  },
});
const frameUpload = multer({
  storage: frameStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

router.post('/video/upload-frame', auth, frameUpload.single('frame'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image file received' });
  const config = require('../config');
  const publicUrl = `${config.app.baseUrl}/uploads/video-frames/${req.file.filename}`;
  res.json({ url: publicUrl });
});

/**
 * POST /api/generate/video
 * Body: { prompt, modelKey, duration, resolution, ratio, generateAudio, firstFrameUrl, lastFrameUrl }
 * 需要登录，积分按规格动态扣除
 */
router.post('/video', auth, async (req, res) => {
  try {
    const { generateVideo, getCreditCost, MODELS } = require('../services/videoService');
    const config = require('../config');

    if (!config.services.seedance.apiKey) {
      return res.status(503).json({ message: 'Video generation is not configured. Add SEEDANCE_API_KEY to server.' });
    }

    const {
      prompt,
      modelKey      = config.services.seedance.modelKey || 'seedance-1-5-pro',
      duration      = 5,
      resolution    = '720p',
      ratio         = '16:9',
      generateAudio = false,
      firstFrameUrl = null,
      lastFrameUrl  = null,
    } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ message: '请输入视频描述' });
    }

    // Validate model
    const model = MODELS[modelKey];
    if (!model) return res.status(400).json({ message: `无效的模型 ID: ${modelKey}` });
    if (model.comingSoon) return res.status(503).json({ message: `${model.name} 即将上线，敬请期待` });

    // Validate & sanitise params
    const dur = Number(duration);
    const validDuration   = (dur >= 4 && dur <= 12) ? dur : 5;
    const validResolution = ['480p', '720p', '1080p'].includes(resolution) ? resolution : '720p';
    const validRatios     = ['16:9', '4:3', '1:1', '3:4', '9:16', '21:9', 'adaptive'];
    const validRatio      = validRatios.includes(ratio) ? ratio : '16:9';

    // Compute credit cost dynamically (includes audio surcharge if enabled)
    const creditCost = getCreditCost(validResolution, validDuration, Boolean(generateAudio));

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: '用户不存在' });

    await refreshFreeCreditsIfNeeded(user);

    const totalAvail = (user.freeCredits ?? 0) + (user.credits ?? 0);
    if (totalAvail < creditCost) {
      return res.status(402).json({ message: `积分不足，需要 ${creditCost} 积分（当前 ${totalAvail}）` });
    }

    // ── Call Seedance API ──
    const { videoUrl, taskId } = await generateVideo({
      prompt:        prompt.trim(),
      modelKey,
      duration:      validDuration,
      resolution:    validResolution,
      ratio:         validRatio,
      generateAudio: Boolean(generateAudio),
      firstFrameUrl: firstFrameUrl || null,
      lastFrameUrl:  lastFrameUrl  || null,
    });

    // ── Deduct credits ──
    const { ok, freeDeducted, paidDeducted } = await deductCredits(user, creditCost);
    if (!ok) {
      return res.status(402).json({ message: `积分不足，需要 ${creditCost} 积分` });
    }

    await recordDeductTransactions(
      user._id, 'generate_video',
      `${model.name} ${validResolution} ${validDuration}s${generateAudio ? ' +audio' : ''} — ${prompt.slice(0, 40)}`,
      freeDeducted, paidDeducted, user.freeCredits, user.credits
    );

    // ── Save to Generation ──
    try {
      await Generation.create({
        user: req.userId,
        prompt:     prompt.slice(0, 500),
        modelId:    modelKey,
        modelName:  model.name,
        videoUrl,
        mediaType:  'video',
        generateAudio: Boolean(generateAudio),
        aspectRatio: validRatio,
        resolution:  validResolution,
        creditCost,
        status: 'success',
      });
    } catch (e) {
      console.error('Generation (video) save error:', e);
    }

    res.json({
      videoUrl,
      taskId,
      creditCost,
      creditsLeft:     user.credits,
      freeCreditsLeft: user.freeCredits,
    });
  } catch (error) {
    console.error('generate/video 错误:', error);
    const isKnown = error.message?.includes('not configured') || error.message?.includes('即将上线');
    res.status(isKnown ? 503 : 500).json({ message: isKnown ? error.message : '视频生成失败，请稍后重试' });
  }
});

/**
 * DELETE /api/generate/history/:id
 * 删除单条生成记录（只能删自己的）
 */
router.delete('/history/:id', auth, async (req, res) => {
  try {
    const doc = await Generation.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!doc) return res.status(404).json({ message: '记录不存在' });
    res.json({ message: 'deleted' });
  } catch (e) {
    res.status(500).json({ message: '删除失败' });
  }
});

/**
 * GET /api/generate/history
 * 返回当前用户的生成历史
 */
router.get('/history', auth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = parseInt(req.query.offset) || 0;
    const query = { user: req.userId };
    if (req.query.mediaType === 'video') query.mediaType = 'video';
    else if (req.query.mediaType === 'image') query.$or = [{ mediaType: 'image' }, { mediaType: { $exists: false } }];
    const [records, total] = await Promise.all([
      Generation.find(query).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
      Generation.countDocuments(query),
    ]);
    res.json({ records, total });
  } catch (e) {
    res.status(500).json({ message: '获取历史失败' });
  }
});

module.exports = router;
