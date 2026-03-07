import axios from 'axios';

/**
 * 使用 MyMemory 免费翻译 API（无需 key，en → zh）
 */
export const translateToZh = async (text) => {
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh`;
  const res = await axios.get(url);
  const translated = res.data?.responseData?.translatedText;
  if (!translated) throw new Error('翻译失败');
  return translated;
};
