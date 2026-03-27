const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const { refreshFreeCreditsIfNeeded } = require('./credits');
const { deductCredits, recordDeductTransactions } = require('../utils/creditsUtils');

const CREDIT_COST = 2; // img2prompt 每次消耗积分
const DEFAULT_GEMINI_MODEL = 'gemini-3-flash-preview'; // Vision 默认模型
const FALLBACK_GEMINI_MODEL = 'gemini-2.5-flash';       // 503 时自动降级
const ALLOWED_VISION_MODELS = new Set(['gemini-3-flash-preview', 'gemini-2.5-flash']);

// 相对路径 → 服务器本地文件系统绝对路径
// 涵盖服务器已知的静态目录
const STATIC_ROOTS = [
  { prefix: '/uploads/',    dir: path.join(__dirname, '../../uploads') },
  { prefix: '/ImageFlow/',  dir: path.join(__dirname, '../../client/public/ImageFlow') },
  { prefix: '/Circle/',     dir: path.join(__dirname, '../../client/public/Circle') },
  { prefix: '/output/',     dir: path.join(__dirname, '../../output') },
];

function resolveLocalFile(relUrl) {
  for (const { prefix, dir } of STATIC_ROOTS) {
    if (relUrl.startsWith(prefix)) {
      return path.join(dir, relUrl.slice(prefix.length));
    }
  }
  // fallback: client/public
  return path.join(__dirname, '../../client/public', relUrl);
}

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
 * 支持两种模式：
 *   1. multipart/form-data: 上传图片文件（image 字段）
 *   2. JSON body: { imageUrl } — 拖拽 gallery 图片，直接传 URL
 * 使用 Gemini 2.5 Flash Vision，需要登录 + 扣除 2 积分
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
      const GEMINI_MODEL = ALLOWED_VISION_MODELS.has(modelId) ? modelId : DEFAULT_GEMINI_MODEL;

      if (!hasFile && !imageUrl) {
        return res.status(400).json({ message: '请上传图片或提供图片 URL' });
      }

      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
      if (!GEMINI_API_KEY) {
        return res.status(503).json({ message: 'Gemini API 未配置，请联系管理员' });
      }

      // 检查用户 + 刷新每日免费额度
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ message: '用户不存在' });
      await refreshFreeCreditsIfNeeded(user);

      const totalAvail = (user.freeCredits ?? 0) + (user.credits ?? 0);
      if (totalAvail < CREDIT_COST) {
        return res.status(402).json({ message: `积分不足，需要 ${CREDIT_COST} 积分` });
      }

      // 构建 inlineData：文件用 buffer base64，URL 需先 fetch 再转 base64
      let mimeType, base64Data;
      if (hasFile) {
        mimeType = req.file.mimetype;
        base64Data = req.file.buffer.toString('base64');
      } else if (imageUrl.startsWith('/')) {
        // 相对路径 → 直接读本地文件，避免 fetch 无效 URL 报错
        const localPath = resolveLocalFile(imageUrl);
        if (!fs.existsSync(localPath)) {
          return res.status(400).json({ message: '图片文件不存在' });
        }
        const ext = path.extname(localPath).toLowerCase();
        const mimeMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' };
        mimeType = mimeMap[ext] || 'image/jpeg';
        base64Data = fs.readFileSync(localPath).toString('base64');
      } else {
        // 绝对 URL → fetch 拉取
        const imgFetch = await fetch(imageUrl);
        if (!imgFetch.ok) {
          return res.status(400).json({ message: '图片 URL 无法访问' });
        }
        mimeType = imgFetch.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
        const arrayBuffer = await imgFetch.arrayBuffer();
        base64Data = Buffer.from(arrayBuffer).toString('base64');
      }

      // 调用 Gemini Vision API，503 时自动降级到 fallback 模型
      const callGeminiVision = async (modelName) => {
        return fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(60000),
            body: JSON.stringify({
              contents: [{
                parts: [
                  { inlineData: { mimeType, data: base64Data } },
                  { text: 'Describe this image as a detailed Midjourney/Stable Diffusion prompt in English. Focus on: subject, style, lighting, colors, composition, mood, and any notable visual elements. Output ONLY the prompt text, no explanation.' },
                ],
              }],
              generationConfig: { maxOutputTokens: 1024 },
            }),
          }
        );
      };

      let geminiRes = await callGeminiVision(GEMINI_MODEL);
      let usedModel = GEMINI_MODEL;

      // 503 过载时自动降级到稳定版模型重试一次
      if (geminiRes.status === 503 && GEMINI_MODEL !== FALLBACK_GEMINI_MODEL) {
        console.warn(`Gemini Vision 503，降级到 ${FALLBACK_GEMINI_MODEL} 重试`);
        geminiRes = await callGeminiVision(FALLBACK_GEMINI_MODEL);
        usedModel = FALLBACK_GEMINI_MODEL;
      }

      if (!geminiRes.ok) {
        const errBody = await geminiRes.json().catch(() => ({}));
        console.error('Gemini Vision API 错误:', errBody);
        return res.status(502).json({ message: 'AI 服务暂时不可用，请稍后重试' });
      }

      const data = await geminiRes.json();
      // Gemini 有时将文字拆成多个 parts，全部拼合确保完整
      const parts = data.candidates?.[0]?.content?.parts ?? [];
      const prompt = parts.map(p => p.text ?? '').join('').trim();

      if (!prompt) {
        return res.status(502).json({ message: 'AI 返回结果为空，请重试' });
      }

      // 扣除积分（先 freeCredits，再 credits）
      const { ok, freeDeducted, paidDeducted } = await deductCredits(user, CREDIT_COST);
      if (!ok) {
        return res.status(402).json({ message: `积分不足，需要 ${CREDIT_COST} 积分` });
      }

      const note = `图生文（反推 Prompt）— ${usedModel}`;
      await recordDeductTransactions(user._id, 'img2prompt', note, freeDeducted, paidDeducted, user.freeCredits, user.credits);

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

// Image proxy — lets html2canvas capture cross-origin images without CORS errors.
// Serves local /output/ files directly; fetches external URLs server-side.
// No auth required (images are already public); rate-limited by the global limiter.
router.get('/proxy-image', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('Missing url');

  // Block requests to private/internal addresses
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    if (/^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(hostname)) {
      return res.status(403).send('Forbidden');
    }
  } catch {
    return res.status(400).send('Invalid url');
  }

  // Try to serve from local filesystem first (same-origin /output/ etc.)
  const localPath = !url.startsWith('http') ? resolveLocalFile(url) : null;
  if (localPath && fs.existsSync(localPath)) {
    return res.sendFile(localPath);
  }

  // Fetch external URL and pipe through
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; iii-pics-proxy/1.0)' },
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) return res.status(response.status).send('Upstream error');

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) return res.status(400).send('Not an image');

    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400');
    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(502).send('Proxy fetch failed');
  }
});

module.exports = router;
