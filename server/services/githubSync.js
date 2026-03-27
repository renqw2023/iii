/**
 * GitHub Sync Service
 *
 * Syncs NanoBanana Pro and Seedance GitHub README data to MongoDB.
 * Reuses parsing logic from importNanoBanana.js / importSeedance.js
 * but fetches from GitHub raw URLs instead of local files.
 */

const axios = require('axios');
const GalleryPrompt = require('../models/GalleryPrompt');
const SeedancePrompt = require('../models/SeedancePrompt');
const DataSyncLog = require('../models/DataSyncLog');

const RAW_NANOBANANA = 'https://raw.githubusercontent.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts/main/README.md';
const RAW_SEEDANCE_README = 'https://raw.githubusercontent.com/YouMind-OpenLab/awesome-seedance-2-prompts/main/README.md';
const RAW_SEEDANCE_VIDEOS = 'https://raw.githubusercontent.com/YouMind-OpenLab/awesome-seedance-2-prompts/main/video-urls.json';

// ─── NanoBanana parsing (extracted from importNanoBanana.js) ──

const USE_CASE_MAP = {
  'profile / avatar': 'profile-avatar', 'profile/avatar': 'profile-avatar',
  'social media post': 'social-media-post', 'social media': 'social-media-post',
  'infographic / edu visual': 'infographic-edu-visual', 'infographic/edu visual': 'infographic-edu-visual',
  'infographic': 'infographic-edu-visual',
  'youtube thumbnail': 'youtube-thumbnail',
  'comic / storyboard': 'comic-storyboard', 'comic/storyboard': 'comic-storyboard',
  'product marketing': 'product-marketing',
  'e-commerce main image': 'ecommerce-main-image', 'ecommerce main image': 'ecommerce-main-image',
  'e-commerce': 'ecommerce-main-image',
  'game asset': 'game-asset',
  'poster / flyer': 'poster-flyer', 'poster/flyer': 'poster-flyer',
  'app / web design': 'app-web-design', 'app/web design': 'app-web-design',
};

function extractUseCase(title) {
  const lower = title.toLowerCase();
  for (const [key, value] of Object.entries(USE_CASE_MAP)) {
    if (lower.includes(key)) return value;
  }
  return 'other';
}

function extractStyle(title, prompt) {
  const text = (title + ' ' + prompt).toLowerCase();
  if (text.includes('photograph') || text.includes('photo ') || text.includes('photoreal')) return 'photography';
  if (text.includes('cinematic') || text.includes('film still')) return 'cinematic-film-still';
  if (text.includes('anime') || text.includes('manga')) return 'anime-manga';
  if (text.includes('illustration') || text.includes('illustrated')) return 'illustration';
  if (text.includes('sketch') || text.includes('line art') || text.includes('line-art')) return 'sketch-line-art';
  if (text.includes('comic') || text.includes('graphic novel')) return 'comic-graphic-novel';
  if (text.includes('3d render') || text.includes('3d ') || text.includes('pixar')) return '3d-render';
  if (text.includes('chibi') || text.includes('q-style')) return 'chibi-q-style';
  if (text.includes('isometric')) return 'isometric';
  if (text.includes('pixel art') || text.includes('pixel-art')) return 'pixel-art';
  if (text.includes('oil painting')) return 'oil-painting';
  if (text.includes('watercolor')) return 'watercolor';
  if (text.includes('ink') || text.includes('chinese style') || text.includes('ukiyo-e')) return 'ink-chinese-style';
  if (text.includes('retro') || text.includes('vintage')) return 'retro-vintage';
  if (text.includes('cyberpunk') || text.includes('sci-fi') || text.includes('futuristic')) return 'cyberpunk-sci-fi';
  if (text.includes('minimalis')) return 'minimalism';
  return 'other';
}

function extractSubject(title, prompt) {
  const text = (title + ' ' + prompt).toLowerCase();
  if (text.includes('portrait') || text.includes('selfie') || text.includes('headshot')) return 'portrait-selfie';
  if (text.includes('influencer') || text.includes('model ') || text.includes('fashion shoot')) return 'influencer-model';
  if (text.includes('character') || text.includes('mascot')) return 'character';
  if (text.includes('group') || text.includes('couple') || text.includes('family')) return 'group-couple';
  if (text.includes('product') && !text.includes('product marketing')) return 'product';
  if (text.includes('food') || text.includes('drink') || text.includes('cake') || text.includes('cuisine')) return 'food-drink';
  if (text.includes('fashion') || text.includes('outfit') || text.includes('clothing')) return 'fashion-item';
  if (text.includes('animal') || text.includes('creature') || text.includes('dog') || text.includes('cat')) return 'animal-creature';
  if (text.includes('vehicle') || text.includes('car ') || text.includes('truck')) return 'vehicle';
  if (text.includes('architecture') || text.includes('interior') || text.includes('building')) return 'architecture-interior';
  if (text.includes('landscape') || text.includes('nature') || text.includes('mountain')) return 'landscape-nature';
  if (text.includes('cityscape') || text.includes('street') || text.includes('urban')) return 'cityscape-street';
  if (text.includes('diagram') || text.includes('chart') || text.includes('infographic')) return 'diagram-chart';
  if (text.includes('text') || text.includes('typography') || text.includes('calligraphy')) return 'text-typography';
  if (text.includes('abstract') || text.includes('background') || text.includes('pattern')) return 'abstract-background';
  return 'other';
}

function parseNanoBananaContent(content) {
  const prompts = [];
  const promptRegex = /^#{2,4}\s*No\.\s*(\d+):\s*(.+)$/gm;
  const positions = [];
  let globalIdx = 0;
  let match;

  while ((match = promptRegex.exec(content)) !== null) {
    const fullTitle = match[2].trim();
    const separatorIdx = fullTitle.indexOf(' - ');
    let categoryRaw = '';
    let title = fullTitle;
    if (separatorIdx !== -1) {
      categoryRaw = fullTitle.substring(0, separatorIdx).trim();
      title = fullTitle.substring(separatorIdx + 3).trim();
    }
    globalIdx++;
    positions.push({ index: match.index, globalIdx, categoryRaw, title, fullTitle });
  }

  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    const nextPos = positions[i + 1];
    const endIndex = nextPos ? nextPos.index : content.length;
    const section = content.substring(pos.index, endIndex);

    let promptText = '';
    const codeBlockMatch = section.match(/```(?:\w+)?\n([\s\S]*?)```/);
    if (codeBlockMatch) promptText = codeBlockMatch[1].trim();
    if (!promptText) {
      const m = section.match(/####\s*📝\s*Prompt\s*\n([\s\S]*?)(?=\n####|\n###|$)/);
      if (m) {
        promptText = m[1].split('\n')
          .filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('![') && !l.startsWith('<') && !l.startsWith('>') && !l.startsWith('|') && !l.startsWith('---'))
          .map(l => l.trim()).join('\n').trim();
      }
    }
    if (!promptText || promptText.length < 10) continue;

    let imageUrl = '';
    const htmlImg = section.match(/<img\s+src="(https?:\/\/[^"]+)"/i);
    if (htmlImg) imageUrl = htmlImg[1];
    if (!imageUrl) {
      const mdImg = section.match(/!\[(?!Language|Featured|Raycast)[^\]]*\]\((https?:\/\/(?!img\.shields)[^\s)]+)\)/);
      if (mdImg) imageUrl = mdImg[1];
    }

    let sourceAuthor = '';
    let sourceUrl = 'https://github.com/YouMind-OpenLab/awesome-nano-banana-pro-prompts';
    const authorM = section.match(/\*\*Author:\*\*\s*\[([^\]]+)\]\((https?:\/\/[^)]+)\)/i);
    if (authorM) { sourceAuthor = authorM[1].trim(); sourceUrl = authorM[2].trim(); }

    let description = '';
    const descM = section.match(/####\s*📖\s*Description\s*\n([\s\S]*?)(?=\n####|\n###|$)/);
    if (descM) {
      description = descM[1].split('\n')
        .filter(l => l.trim() && !l.startsWith('#') && !l.startsWith('![') && !l.startsWith('<') && !l.startsWith('>') && !l.startsWith('|'))
        .map(l => l.trim()).join(' ').trim().substring(0, 500);
    }
    if (!description) description = promptText.substring(0, 300);

    const isFeatured = section.includes('⭐-Featured') || section.includes('Featured-gold');
    const useCase = extractUseCase(pos.categoryRaw || pos.fullTitle);
    const style = extractStyle(pos.title, promptText);
    const subject = extractSubject(pos.title, promptText);
    const tags = new Set(['nanobanana-pro']);
    if (useCase !== 'other') tags.add(useCase);
    if (style !== 'other') tags.add(style);
    if (subject !== 'other') tags.add(subject);

    const displayTitle = pos.categoryRaw ? `${pos.categoryRaw} - ${pos.title}` : pos.title;
    prompts.push({
      title: displayTitle.substring(0, 200),
      prompt: promptText,
      description,
      model: 'nanobanana',
      useCase, style, subject,
      tags: Array.from(tags),
      previewImage: imageUrl,
      sourceAuthor,
      sourceUrl,
      sourcePlatform: sourceAuthor ? 'twitter' : 'github',
      dataSource: 'nano-banana-pro',
      sourceId: `nanobanana-g${pos.globalIdx}`,
      isFeatured,
    });
  }
  return prompts;
}

// ─── Seedance README parsing (extracted from importSeedance.js) ─

function guessCategory(title, content) {
  const text = (title + ' ' + content).toLowerCase();
  if (text.includes('fight') || text.includes('battle') || text.includes('combat') || text.includes('warrior') || text.includes('duel')) return 'fight';
  if (text.includes('anime') || text.includes('manga') || text.includes('guoman')) return 'anime';
  if (text.includes('dance') || text.includes('dancing') || text.includes('k-pop') || text.includes('hip-hop')) return 'dance';
  if (text.includes('horror') || text.includes('scary') || text.includes('zombie')) return 'horror';
  if (text.includes('chase') || text.includes('pursuit') || text.includes('speeder')) return 'chase';
  if (text.includes('transform') || text.includes('morph') || text.includes('optimus')) return 'transformation';
  if (text.includes('commercial') || text.includes('ad ') || text.includes('product') || text.includes('promotional')) return 'commercial';
  if (text.includes('meme') || text.includes('comedy') || text.includes('funny') || text.includes('humorous')) return 'comedy';
  if (text.includes('sci-fi') || text.includes('robot') || text.includes('futuristic') || text.includes('cyberpunk') || text.includes('mecha')) return 'sci-fi';
  if (text.includes('fantasy') || text.includes('dragon') || text.includes('magic') || text.includes('wuxia') || text.includes('mythology')) return 'fantasy';
  if (text.includes('cinematic') || text.includes('film') || text.includes('movie') || text.includes('noir')) return 'cinematic';
  if (text.includes('vlog') || text.includes('selfie') || text.includes('pov') || text.includes('girlfriend')) return 'vlog';
  if (text.includes('music') || text.includes('mv ') || text.includes('ktv')) return 'music-video';
  if (text.includes('action') || text.includes('ronin') || text.includes('samurai')) return 'action';
  return 'other';
}

function extractSeedanceTags(title, content) {
  const tags = new Set();
  const text = (title + ' ' + content).toLowerCase();
  const keywords = [
    'cinematic', 'anime', 'action', 'fight', 'dance', 'horror', 'sci-fi',
    'fantasy', 'comedy', 'transformation', 'chase', 'commercial',
    'realistic', 'cgi', 'vfx', '3d', 'live-action', 'martial-arts',
    'romance', 'dramatic', 'emotional', 'epic', 'thriller',
    'fpv', 'drone', 'pov', 'ink-wash', 'paper-cut', 'cyberpunk',
    'superhero', 'samurai', 'wuxia', 'mecha', 'car', 'travel',
  ];
  for (const kw of keywords) { if (text.includes(kw)) tags.add(kw); }
  tags.add('seedance-2.0');
  return Array.from(tags).slice(0, 10);
}

function parseSeedanceReadme(content) {
  const promptMap = {};
  const sections = content.split(/^### /gm);

  for (const section of sections) {
    if (!section.trim()) continue;
    const lines = section.trim().split('\n');
    const title = lines[0].trim();

    if (['📖', '🌐', '🤔', '📊', '🤝', '📄', '🙏', '⭐', '🎬', '📚'].some(e => title.startsWith(e))) continue;
    if (title.length < 5) continue;

    const idMatch = section.match(/youmind\.com[^\)]*[?&]id=(\d+)/);
    if (!idMatch) continue;
    const youmindId = idMatch[1];

    const descriptionLines = [];
    const promptContent = [];
    let inCodeBlock = false;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('```')) { inCodeBlock = !inCodeBlock; continue; }
      if (inCodeBlock) { promptContent.push(line); continue; }
      if (line.startsWith('![') || line.startsWith('<img') || line.startsWith('---')) continue;
      if (line.startsWith('####') || line.includes('youmind.com') || line.includes('Click image to download')) continue;
      if (line.startsWith('Author:') || line.startsWith('Source:') || line.startsWith('Published:')) continue;
      if (line.trim() && !line.startsWith('#') && !line.startsWith('|') && !line.startsWith('>')) {
        descriptionLines.push(line.trim());
      }
    }

    const authorMatch = section.match(/Author:\s*\[([^\]]+)\]/);
    const sourceMatch = section.match(/Source:\s*\[Link\]\(([^\)]+)\)/);
    const uniquePrompt = [...new Set(promptContent)].join('\n');
    const fullText = title + ' ' + uniquePrompt + ' ' + descriptionLines.join(' ');

    promptMap[youmindId] = {
      youmindId,
      title: title.substring(0, 300),
      prompt: uniquePrompt || descriptionLines.join('\n'),
      description: descriptionLines.slice(0, 3).join(' ').substring(0, 3000),
      category: guessCategory(title, fullText),
      tags: extractSeedanceTags(title, fullText),
      author: authorMatch ? authorMatch[1] : '',
      sourceUrl: sourceMatch ? sourceMatch[1] : '',
    };
  }
  return promptMap;
}

// ─── YouMind API helpers ───────────────────────────────────────

const YOUMIND_API_URL = 'https://youmind.com/youhome-api/video-prompts';

/**
 * Fetch all Seedance prompts from YouMind API (paginated, 12 per page).
 * Returns a map of { [id]: { title, prompt, description, videoUrl, thumbnailUrl, authorName, authorLink, sourceUrl } }
 */
async function fetchYouMindCSVMap() {
  try {
    const map = {};
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const { data } = await axios.post(YOUMIND_API_URL,
        { model: 'seedance-2.0', page },
        {
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://youmind.com/zh-CN/seedance-2-0-prompts',
          },
        }
      );
      const prompts = data.prompts || [];
      if (prompts.length === 0) break;

      for (const item of prompts) {
        const id = String(item.id);
        const video = item.videos?.[0];

        // Extract original Twitter MP4 URL from caption (preferred: has audio, works with proxy)
        // Caption format: "Imported from URL: https://video.twimg.com/.../file.mp4?tag=21"
        let videoUrl = '';
        if (video?.caption) {
          const m = video.caption.match(/https?:\/\/video\.twimg\.com[^\s]+\.mp4[^\s]*/);
          if (m) videoUrl = m[0];
        }
        if (!videoUrl) videoUrl = video?.sourceUrl || '';

        map[id] = {
          title: item.title || '',
          prompt: item.content || item.description || '',
          description: item.description || '',
          videoUrl,
          thumbnailUrl: video?.thumbnail || '',
          authorName: item.author?.name || '',
          authorLink: item.author?.link || '',
          sourceUrl: item.sourceLink || `https://youmind.com/en-US/seedance-2-0-prompts?id=${id}`,
        };
      }

      hasMore = data.hasMore === true;
      page++;

      // Polite delay between pages
      if (hasMore) await new Promise(r => setTimeout(r, 300));
    }

    console.log(`[github-sync] YouMind API fetched: ${Object.keys(map).length} entries`);
    return map;
  } catch (err) {
    console.warn(`[github-sync] YouMind API fetch failed (${err.message}), will use README-only prompts`);
    return {};
  }
}

// ─── YouMind NanoBanana API ────────────────────────────────────

const YOUMIND_NB_API_URL = 'https://youmind.com/youhome-api/prompts';

/**
 * Fetch all NanoBanana prompts from YouMind API (paginated, 30 per page).
 * Returns array of mapped GalleryPrompt records.
 */
// ─── Sync functions ───────────────────────────────────────────

async function syncNanoBanana() {
  const log = await DataSyncLog.create({ source: 'nanobanana', status: 'running', startedAt: new Date() });
  const errors = [];
  let newCount = 0, updatedCount = 0, skippedCount = 0, errorCount = 0;
  let page = 1, hasMore = true, totalFetched = 0;

  console.log('[github-sync] Fetching NanoBanana from YouMind API...');

  try {
    while (hasMore) {
      // Fetch one page with retry
      let data;
      for (let attempt = 1; attempt <= 5; attempt++) {
        try {
          const res = await axios.post(YOUMIND_NB_API_URL,
            { model: 'nano-banana-pro', page, limit: 18, locale: 'en-US', campaign: 'nano-banana-pro-prompts', filterMode: 'imageCategories' },
            {
              timeout: 60000,
              headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
                'Origin': 'https://youmind.com',
                'Referer': 'https://youmind.com/en-US/nano-banana-pro-prompts',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
              },
            }
          );
          data = res.data;
          break;
        } catch (err) {
          if (attempt === 5) throw err;
          console.warn(`[github-sync] NanoBanana page ${page} attempt ${attempt} failed (${err.message}), retrying...`);
          await new Promise(r => setTimeout(r, 3000 * attempt));
        }
      }

      const prompts = data.prompts || [];
      if (prompts.length === 0) break;

      totalFetched += prompts.length;
      if (page % 50 === 1) console.log(`[github-sync] NanoBanana page ${page}, fetched so far: ${totalFetched}`);

      // Upsert this page immediately — no data lost on mid-sync failure
      for (const item of prompts) {
        const id = String(item.id);
        // Prefer whichever is longer: original content usually beats truncated AI translation
        const promptText = (item.content && item.translatedContent && item.content.length >= item.translatedContent.length)
          ? item.content
          : (item.translatedContent || item.content || '');
        const previewImage = item.media?.[0] || item.mediaThumbnails?.[0] || '';
        const record = {
          title: (item.title || '').substring(0, 200),
          prompt: promptText,
          description: (item.description || promptText.substring(0, 300)).substring(0, 500),
          model: 'nanobanana',
          useCase: extractUseCase(item.title || ''),
          style: extractStyle(item.title || '', promptText),
          subject: extractSubject(item.title || '', promptText),
          tags: (() => {
            const t = new Set(['nanobanana-pro']);
            const uc = extractUseCase(item.title || '');
            const st = extractStyle(item.title || '', promptText);
            const sb = extractSubject(item.title || '', promptText);
            if (uc !== 'other') t.add(uc);
            if (st !== 'other') t.add(st);
            if (sb !== 'other') t.add(sb);
            return Array.from(t);
          })(),
          previewImage,
          sourceAuthor: item.author?.name || '',
          sourceUrl: item.sourceLink || item.author?.link || `https://youmind.com/en-US/nano-banana-pro-prompts?id=${id}`,
          sourcePlatform: item.sourcePlatform || 'twitter',
          dataSource: 'nano-banana-pro',
          sourceId: `nanobanana-ym-${id}`,
          isFeatured: item.featured === true,
        };
        try {
          const result = await GalleryPrompt.findOneAndUpdate(
            { sourceId: record.sourceId },
            { $set: record },
            { upsert: true, new: true, rawResult: true }
          );
          if (result.lastErrorObject?.updatedExisting) updatedCount++;
          else newCount++;
        } catch (err) {
          if (err.code === 11000) skippedCount++;
          else { errorCount++; errors.push(err.message.substring(0, 200)); }
        }
      }

      hasMore = data.hasMore === true;
      page++;
      if (hasMore) await new Promise(r => setTimeout(r, 300));
    }

    const totalAfter = await GalleryPrompt.countDocuments({ dataSource: 'nano-banana-pro' });
    await DataSyncLog.findByIdAndUpdate(log._id, {
      status: errorCount > 0 ? 'partial' : 'success',
      completedAt: new Date(), newCount, updatedCount, skippedCount, errorCount, totalAfter, errorMessages: errors,
      meta: { apiUrl: YOUMIND_NB_API_URL, fetched: totalFetched },
    });
    console.log(`[github-sync] NanoBanana done: +${newCount} ~${updatedCount} skip${skippedCount} err${errorCount} total${totalAfter}`);
    return { newCount, updatedCount, skippedCount, errorCount };
  } catch (err) {
    // Save partial progress to log
    const totalAfter = await GalleryPrompt.countDocuments({ dataSource: 'nano-banana-pro' });
    errors.push(err.message.substring(0, 500));
    await DataSyncLog.findByIdAndUpdate(log._id, {
      status: newCount + updatedCount > 0 ? 'partial' : 'error',
      completedAt: new Date(), newCount, updatedCount, skippedCount, errorCount: errorCount + 1,
      totalAfter, errorMessages: errors,
    });
    console.error(`[github-sync] NanoBanana failed at page ${page}: ${err.message}. Saved ${newCount + updatedCount} records.`);
    throw err;
  }
}

async function syncSeedanceGithub() {
  const log = await DataSyncLog.create({ source: 'seedance-github', status: 'running', startedAt: new Date() });
  const errors = [];
  let newCount = 0, updatedCount = 0, skippedCount = 0, errorCount = 0;

  try {
    console.log('[github-sync] Fetching Seedance README + video-urls + YouMind CSV...');
    const [readmeResp, videosResp, csvMap] = await Promise.all([
      axios.get(RAW_SEEDANCE_README, { timeout: 30000, responseType: 'text' }),
      axios.get(RAW_SEEDANCE_VIDEOS, { timeout: 30000 }).catch(() => ({ data: { prompts: {} } })),
      fetchYouMindCSVMap(),
    ]);

    const promptMap = parseSeedanceReadme(readmeResp.data);
    const videoUrls = videosResp.data?.prompts || {};
    console.log(`[github-sync] README: ${Object.keys(promptMap).length} prompts | GH videos: ${Object.keys(videoUrls).length} | CSV: ${Object.keys(csvMap).length}`);

    // Three-way merge: README (curated) > YouMind CSV (complete) > placeholder
    const allIds = new Set([...Object.keys(promptMap), ...Object.keys(videoUrls), ...Object.keys(csvMap)]);
    for (const id of allIds) {
      const readme = promptMap[id];   // curated README data (rich but sparse)
      const csv = csvMap[id];         // YouMind CSV data (complete prompts for all entries)
      const ghVideo = videoUrls[id] || '';

      // Priority: README title > CSV title > placeholder
      const title = readme?.title || csv?.title || `Seedance Prompt #${id}`;
      // Priority: README prompt > CSV prompt > empty
      const prompt = (readme?.prompt?.length > 10 ? readme.prompt : null) || csv?.prompt || '';
      const description = readme?.description || csv?.description || '';
      // Priority: CSV Twitter video (has audio) > GitHub CDN video
      const videoUrl = csv?.videoUrl || ghVideo;
      const thumbnailUrl = csv?.thumbnailUrl || '';
      const fullText = title + ' ' + prompt;
      const category = readme?.category || guessCategory(title, fullText);
      const tags = readme?.tags || extractSeedanceTags(title, fullText);
      const sourceUrl = readme?.sourceUrl || csv?.sourceUrl || `https://youmind.com/en-US/seedance-2-0-prompts?id=${id}`;

      const record = {
        title: title.substring(0, 300),
        prompt: prompt,
        description: description.substring(0, 3000),
        videoUrl,
        thumbnailUrl,
        category,
        tags,
        sourceUrl,
        authorName: csv?.authorName || '',
        authorLink: csv?.authorLink || '',
        sourceId: `seedance-${id}`,
        isFeatured: !!readme || (prompt.length > 100),
        isActive: true,
        isPublic: true,
      };

      try {
        const result = await SeedancePrompt.findOneAndUpdate(
          { sourceId: record.sourceId },
          { $set: record },
          { upsert: true, new: true, rawResult: true }
        );
        if (result.lastErrorObject?.updatedExisting) updatedCount++;
        else newCount++;
      } catch (err) {
        if (err.code === 11000) skippedCount++;
        else { errorCount++; errors.push(err.message.substring(0, 200)); }
      }
    }

    const totalAfter = await SeedancePrompt.countDocuments({ isActive: true });
    await DataSyncLog.findByIdAndUpdate(log._id, {
      status: errorCount > 0 ? 'partial' : 'success',
      completedAt: new Date(), newCount, updatedCount, skippedCount, errorCount, totalAfter, errorMessages: errors,
      meta: { readmeUrl: RAW_SEEDANCE_README, videosUrl: RAW_SEEDANCE_VIDEOS, apiUrl: YOUMIND_API_URL },
    });
    console.log(`[github-sync] Seedance GitHub done: +${newCount} ~${updatedCount} err${errorCount}`);
    return { newCount, updatedCount, skippedCount, errorCount };
  } catch (err) {
    errors.push(err.message.substring(0, 500));
    await DataSyncLog.findByIdAndUpdate(log._id, {
      status: 'error', completedAt: new Date(), errorCount: 1, errorMessages: errors,
    });
    throw err;
  }
}

// ─── GitHub Trending Prompts sync ─────────────────────────────

const fs   = require('fs');
const path = require('path');
const https = require('https');

const RAW_GITHUB_TRENDING = 'https://raw.githubusercontent.com/jau123/nanobanana-trending-prompts/main/prompts/prompts.json';

// Map GitHub repo categories → our GalleryPrompt taxonomy
// Multiple categories: highest-priority non-Other wins; 'JSON' only adds a tag
const TRENDING_CATEGORY_RULES = [
  { match: 'photography',      style: 'photography' },
  { match: 'illustration & 3d', style: 'illustration' },
  { match: 'product & brand',  subject: 'product',          useCase: 'product-marketing' },
  { match: 'food & drink',     subject: 'food-drink' },
  { match: 'girl',             subject: 'influencer-model' },
  { match: 'app',              useCase: 'app-web-design' },
];

function mapTrendingCategories(categories) {
  const lc = (categories || []).map(c => c.toLowerCase());
  let style = 'other', subject = 'other', useCase = 'other';
  for (const rule of TRENDING_CATEGORY_RULES) {
    if (lc.includes(rule.match)) {
      if (rule.style)   style   = rule.style;
      if (rule.subject) subject = rule.subject;
      if (rule.useCase) useCase = rule.useCase;
    }
  }
  return { style, subject, useCase };
}

function buildTrendingTitle(prompt) {
  if (!prompt) return 'Trending Prompt';
  const trimmed = prompt.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= 60) return trimmed;
  const cut = trimmed.substring(0, 60);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 30 ? cut.substring(0, lastSpace) : cut) + '…';
}

function buildTrendingTags(item) {
  const cats = (item.categories || [])
    .map(c => c.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    .filter(c => c && c !== 'other');
  return [...new Set([...cats, 'trending', 'curated'])];
}

// Download a single image URL to localPath; resolves true on success, false on skip/error
function downloadImage(url, localPath) {
  return new Promise((resolve) => {
    if (fs.existsSync(localPath)) return resolve(true); // already cached
    const dir = path.dirname(localPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmp = localPath + '.tmp';
    const file = fs.createWriteStream(tmp);
    const req = https.get(url, { timeout: 20000 }, (res) => {
      if (res.statusCode !== 200) {
        file.destroy();
        fs.unlink(tmp, () => {});
        return resolve(false);
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          fs.rename(tmp, localPath, (err) => resolve(!err));
        });
      });
    });
    req.on('error', () => { file.destroy(); fs.unlink(tmp, () => {}); resolve(false); });
    req.on('timeout', () => { req.destroy(); file.destroy(); fs.unlink(tmp, () => {}); resolve(false); });
  });
}

async function syncGithubTrending() {
  const log = await DataSyncLog.create({ source: 'github-trending', status: 'running', startedAt: new Date() });
  const errors = [];
  let newCount = 0, updatedCount = 0, skippedCount = 0, errorCount = 0;

  const outputDir = process.env.GITHUB_TRENDING_OUTPUT_DIR
    || path.join(__dirname, '../../output/gallery-trending');
  const serverBase = (process.env.SERVER_PUBLIC_URL || 'http://localhost:5500').replace(/\/$/, '');

  try {
    console.log('[github-trending] Fetching prompts.json from GitHub...');
    const res = await axios.get(RAW_GITHUB_TRENDING, {
      timeout: 30000,
      responseType: 'json',
      headers: { 'User-Agent': 'pm01-server/1.0' },
    });
    const entries = Array.isArray(res.data) ? res.data : [];
    console.log(`[github-trending] Got ${entries.length} entries, starting image mirror + upsert...`);

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    for (const item of entries) {
      try {
        const id = String(item.id || '');
        if (!id || !item.prompt) { skippedCount++; continue; }

        // Mirror images — collect all local URLs
        const imageUrls = Array.isArray(item.images) ? item.images : (item.image ? [item.image] : []);
        let localPreview = '';
        const localImages = [];
        for (let i = 0; i < imageUrls.length; i++) {
          const src = imageUrls[i];
          if (!src) continue;
          const filename = `${id}_${i}.jpg`;
          const localPath = path.join(outputDir, filename);
          const ok = await downloadImage(src, localPath);
          if (ok) {
            const url = `${serverBase}/output/gallery-trending/${filename}`;
            localImages.push(url);
            if (!localPreview) localPreview = url;
          } else {
            errorCount++;
          }
        }

        const { style, subject, useCase } = mapTrendingCategories(item.categories);
        const modelVal = item.model === 'gptimage' ? 'gptimage' : 'nanobanana';

        const record = {
          title:          buildTrendingTitle(item.prompt),
          prompt:         item.prompt,
          description:    '',
          model:          modelVal,
          style,
          subject,
          useCase,
          tags:           buildTrendingTags(item),
          previewImage:   localPreview,
          images:         localImages,
          sourceAuthor:   (item.author_name || item.author || '').substring(0, 100),
          sourceUrl:      item.source_url || '',
          sourcePlatform: 'twitter',
          dataSource:     modelVal === 'nanobanana' ? 'nano-banana-pro' : 'other',
          sourceId:       `github-trending-${id}`,
          isFeatured:     (item.likes || 0) >= 1000,
          isPublic:       true,
          isActive:       true,
        };

        const existing = await GalleryPrompt.findOne({ sourceId: record.sourceId }).lean();
        await GalleryPrompt.findOneAndUpdate(
          { sourceId: record.sourceId },
          { $set: record },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        if (existing) updatedCount++; else newCount++;

      } catch (err) {
        errorCount++;
        errors.push(`id=${item.id}: ${err.message.substring(0, 200)}`);
      }
    }

    const totalAfter = await GalleryPrompt.countDocuments({ sourceId: /^github-trending-/ });
    await DataSyncLog.findByIdAndUpdate(log._id, {
      status: errorCount > 0 && newCount + updatedCount === 0 ? 'error' : errorCount > 0 ? 'partial' : 'success',
      completedAt: new Date(), newCount, updatedCount, skippedCount, errorCount, totalAfter,
      errorMessages: errors.slice(0, 50),
      meta: { rawUrl: RAW_GITHUB_TRENDING, outputDir },
    });
    console.log(`[github-trending] Done: +${newCount} ~${updatedCount} skip${skippedCount} err${errorCount} total${totalAfter}`);
    return { newCount, updatedCount, skippedCount, errorCount };

  } catch (err) {
    errors.push(err.message.substring(0, 500));
    await DataSyncLog.findByIdAndUpdate(log._id, {
      status: newCount + updatedCount > 0 ? 'partial' : 'error',
      completedAt: new Date(), newCount, updatedCount, skippedCount,
      errorCount: errorCount + 1, errorMessages: errors,
    });
    console.error(`[github-trending] Failed: ${err.message}`);
    throw err;
  }
}

module.exports = { syncNanoBanana, syncSeedanceGithub, syncGithubTrending };
