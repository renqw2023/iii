import axios from 'axios';

const CHUNK_SIZE = 480; // MyMemory free limit is 500 chars

async function translateChunk(text, langpair) {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`;
  const res = await axios.get(url);
  const translated = res.data?.responseData?.translatedText;
  if (!translated || translated.startsWith('QUERY LENGTH LIMIT')) throw new Error('Translation failed');
  return translated;
}

/**
 * MyMemory free translation API (no key required)
 * zh → en: for displaying Chinese source prompts to EU/US users
 * Handles long texts by chunking at sentence boundaries.
 */
export const translateToEn = async (text) => {
  if (!text) throw new Error('Translation failed');
  if (text.length <= CHUNK_SIZE) return translateChunk(text, 'zh|en');

  // Split into ~480-char chunks at whitespace boundaries
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = start + CHUNK_SIZE;
    if (end < text.length) {
      // Find last space before end to avoid cutting mid-word
      const lastSpace = text.lastIndexOf(' ', end);
      if (lastSpace > start) end = lastSpace;
    }
    chunks.push(text.slice(start, end).trim());
    start = end + 1;
  }

  const results = [];
  for (const chunk of chunks) {
    results.push(await translateChunk(chunk, 'zh|en'));
  }
  return results.join(' ');
};

/**
 * en → zh: kept for potential future use
 */
export const translateToZh = async (text) => {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh`;
  const res = await axios.get(url);
  const translated = res.data?.responseData?.translatedText;
  if (!translated) throw new Error('Translation failed');
  return translated;
};
