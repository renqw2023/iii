import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { configurePageSEO, generateStructuredData } from '../utils/seo';
import config from '../config';

/**
 * SEO Hook — configure page meta for any route
 * @param {Object} options
 * @param {string}  options.title
 * @param {string}  options.description
 * @param {string}  options.keywords
 * @param {string}  options.image
 * @param {string}  options.type     - 'website' | 'article' | 'profile'
 * @param {Object}  options.structuredData
 * @param {Array}   options.breadcrumbs
 * @param {boolean} options.noIndex
 */
export const useSEO = (options = {}) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const currentLang = i18n.language;

  useEffect(() => {
    const {
      title = '',
      description = '',
      keywords = '',
      image = '',
      type = 'website',
      structuredData,
      breadcrumbs,
      noIndex = false
    } = options;

    // i18n key resolution (dot-notation key → translated string)
    const finalTitle       = title.includes('.')       ? t(title)       : title;
    const finalDescription = description.includes('.') ? t(description) : description;

    const fullUrl = `${config.app.baseUrl}${location.pathname}${location.search}`;

    configurePageSEO({
      title: finalTitle,
      description: finalDescription,
      keywords,
      image,
      url: fullUrl,
      type,
      lang: currentLang,
      structuredData,
      breadcrumbs,
      currentPath: location.pathname,
      noIndex
    });
  }, [options, t, i18n.language, location, currentLang]);
};

// ─────────────────────────────────────────────────────────────────────────────
// Page-level hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Home page
 */
export const useHomeSEO = () => {
  useSEO({
    title: 'III.PICS — AI Art Gallery & Midjourney Style Reference',
    description: 'Discover thousands of Midjourney sref style codes, AI-generated images, and creative prompts. Browse the best AI art gallery online — free inspiration for every artist.',
    keywords: 'midjourney sref, midjourney style reference, AI art gallery, AI image generator, midjourney prompts, AI art styles, text to image AI, AI art inspiration, midjourney style codes, III.PICS',
    type: 'website',
    structuredData: generateStructuredData({
      name: 'III.PICS',
      description: 'AI Art Gallery & Midjourney Style Reference — browse sref codes, AI images, and creative prompts',
      url: 'https://iii.pics',
      logo: 'https://iii.pics/logo.svg',
      sameAs: ['https://iii.pics']
    }, 'WebSite')
  });
};

/**
 * Explore — Midjourney sref browser
 */
export const useExploreSEO = () => {
  useSEO({
    title: 'Explore Midjourney Sref Styles — III.PICS Style Gallery',
    description: 'Browse 1,300+ Midjourney --sref style reference codes with visual previews. Find the perfect AI art style for your next prompt — updated daily.',
    keywords: 'midjourney sref, midjourney style reference, sref codes, midjourney --sref, AI art styles, midjourney style gallery, midjourney prompts, III.PICS explore',
    type: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Midjourney Sref Style Gallery — III.PICS',
      description: 'Browse 1,300+ Midjourney --sref style reference codes with visual previews.',
      url: 'https://iii.pics/explore',
      provider: { '@type': 'Organization', name: 'III.PICS', url: 'https://iii.pics' },
    }
  });
};

/**
 * Post detail
 */
export const usePostSEO = (post) => {
  const title       = post?.title       || 'AI Art — III.PICS';
  const description = post?.description || 'View this AI-generated artwork and discover more creative inspiration on III.PICS.';
  const image       = post?.imageUrl    || post?.thumbnailUrl;
  const keywords    = post?.tags ? post.tags.join(', ') : 'AI art, midjourney, AI image';

  useSEO({
    title,
    description,
    keywords,
    image,
    type: 'article',
    structuredData: post ? generateStructuredData(post, 'Article') : null,
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Explore', url: '/explore' },
      { name: title, url: post ? `/post/${post._id}` : '#' }
    ]
  });
};

/**
 * User profile
 */
export const useUserSEO = (user) => {
  const username    = user?.username || 'Artist';
  const title       = `${username} — AI Art Portfolio on III.PICS`;
  const description = user?.bio
    ? `${user.bio} — Browse ${username}'s AI artwork and style collections on III.PICS.`
    : `View ${username}'s AI-generated art portfolio, Midjourney prompts, and style references on III.PICS.`;
  const image = user?.avatar;

  useSEO({
    title,
    description,
    keywords: `${username}, AI art portfolio, midjourney artist, AI artwork, III.PICS`,
    image,
    type: 'profile',
    structuredData: user ? generateStructuredData({
      '@type': 'Person',
      name: user.username,
      description: user.bio,
      image: user.avatar,
      url: `/user/${user._id}`
    }, 'Person') : null,
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: username, url: user ? `/user/${user._id}` : '#' }
    ]
  });
};

/**
 * Create / upload (noindex)
 */
export const useCreateSEO = () => {
  useSEO({
    title: 'Upload AI Art — III.PICS',
    description: 'Share your AI-generated artwork with the III.PICS community.',
    noIndex: true
  });
};

/**
 * Settings (noindex)
 */
export const useSettingsSEO = () => {
  useSEO({
    title: 'Settings — III.PICS',
    description: 'Manage your III.PICS account preferences and settings.',
    noIndex: true
  });
};

/**
 * Login (noindex)
 */
export const useLoginSEO = () => {
  useSEO({
    title: 'Sign In — III.PICS',
    description: 'Sign in to III.PICS to save favorites, collect sref styles, and generate AI images.',
    noIndex: true
  });
};

/**
 * Register (noindex)
 */
export const useRegisterSEO = () => {
  useSEO({
    title: 'Join III.PICS — Free AI Art Community',
    description: 'Create your free III.PICS account to explore Midjourney sref styles, save favorites, and generate AI images.',
    noIndex: true
  });
};

/**
 * About (public)
 */
export const useAboutSEO = () => {
  useSEO({
    title: 'About III.PICS — AI Art Gallery Platform',
    description: 'Learn about III.PICS, the AI art gallery and Midjourney style reference platform built for artists and creators worldwide.',
    keywords: 'about III.PICS, AI art platform, midjourney community, AI image gallery',
    type: 'website'
  });
};

/**
 * Help / Docs
 */
export const useHelpSEO = () => {
  useSEO({
    title: 'Help & Docs — III.PICS',
    description: 'How to use III.PICS: browse sref styles, generate AI images, collect favorites, and more.',
    keywords: 'III.PICS help, how to use midjourney sref, AI art tutorial, getting started',
    type: 'website'
  });
};

/**
 * Gallery — AI prompt gallery (NanoBanana / GPT Image)
 */
export const useGallerySEO = () => {
  useSEO({
    title: 'AI Prompt Gallery — III.PICS | Trending AI Image Prompts',
    description: 'Browse the best AI image prompts for NanoBanana Pro, GPT Image, and more. One-click copy — no prompt engineering needed. Updated daily with trending AI art.',
    keywords: 'AI image prompts, AI art prompts, GPT image prompts, NanoBanana prompts, text to image prompts, AI art generator, best AI prompts, III.PICS gallery',
    type: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'AI Prompt Gallery — III.PICS',
      description: 'Browse the best AI image prompts for NanoBanana Pro, GPT Image, and more.',
      url: 'https://iii.pics/gallery',
      provider: { '@type': 'Organization', name: 'III.PICS', url: 'https://iii.pics' },
    }
  });
};

/**
 * Seedance — AI video gallery
 */
export const useSeedanceSEO = () => {
  useSEO({
    title: 'AI Video Gallery — III.PICS | Seedance & Kling Video Prompts',
    description: 'Explore AI-generated video clips made with Seedance 2.0, Kling, and Wan. Browse text-to-video and image-to-video prompts with playable previews.',
    keywords: 'AI video generator, Seedance prompts, Kling AI video, text to video AI, image to video AI, AI video prompts, AI animation, Wan video, III.PICS video',
    type: 'website'
  });
};

/**
 * Img2Prompt / AI Generation tool
 */
export const useImg2PromptSEO = () => {
  useSEO({
    title: 'AI Image Generator & Reverse Prompt Tool — III.PICS',
    description: 'Generate AI images from text prompts, or upload any image to instantly extract its prompt. Free AI art generator powered by Gemini, DALL·E, and more.',
    keywords: 'AI image generator, image to prompt, reverse prompt, img2prompt, text to image AI, AI art generator free, Gemini image, DALL-E prompts, AI prompt extractor, III.PICS generate',
    type: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'III.PICS AI Image Generator',
      'description': 'Free AI image generator and reverse prompt tool. Generate images from text with Gemini, DALL·E, and more. Upload any image to extract its AI prompt.',
      'url': 'https://iii.pics/create',
      'applicationCategory': 'MultimediaApplication',
      'operatingSystem': 'Web',
      'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
      'provider': { '@type': 'Organization', 'name': 'III.PICS', 'url': 'https://iii.pics' }
    }
  });
};

/**
 * Docs center
 */
export const useDocsSEO = () => {
  useSEO({
    title: 'Docs & Help — III.PICS',
    description: 'III.PICS documentation: user guide, privacy policy, terms of service, and everything you need to get started with AI art creation.',
    keywords: 'III.PICS docs, user guide, privacy policy, terms of service, AI art help',
    type: 'website'
  });
};

/**
 * Gallery item detail (modal)
 */
export const useGalleryItemSEO = (item) => {
  const prompt = item?.prompt || '';
  const title = prompt
    ? `${prompt.substring(0, 55)}… — III.PICS Gallery`
    : 'AI Image Prompt — III.PICS Gallery';
  const description = prompt
    ? `${prompt.substring(0, 150)} — Browse more AI image prompts on III.PICS.`
    : 'View this AI-generated image prompt and discover more creative ideas on III.PICS Gallery.';
  const image = item?.imageUrl || item?.thumbnailUrl;

  useSEO({
    title,
    description,
    keywords: 'AI image prompt, AI art, midjourney prompt, text to image, III.PICS gallery',
    image,
    type: 'article'
  });
};

/**
 * Sref detail (modal)
 */
export const useSrefSEO = (sref) => {
  const code = sref?.srefCode || '';
  const title = code
    ? `Midjourney --sref ${code} Style Reference — III.PICS`
    : 'Midjourney Sref Style Reference — III.PICS';
  const description = sref?.description || sref?.prompt
    ? `${(sref.description || sref.prompt).substring(0, 150)} — Midjourney style code --sref ${code}.`
    : `Explore Midjourney --sref ${code || 'style codes'} with visual previews. Find your perfect style reference on III.PICS.`;
  const image = sref?.imageUrl || sref?.thumbnailUrl;

  useSEO({
    title,
    description,
    keywords: `midjourney sref ${code}, midjourney style reference, sref codes, midjourney --sref, AI art styles, III.PICS`,
    image,
    type: 'article'
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Landing page hooks — keyword-targeted long-tail pages
// ─────────────────────────────────────────────────────────────────────────────

/**
 * /midjourney-sref — Midjourney Style Reference Hub
 */
export const useMidjourneySrefSEO = () => {
  useSEO({
    title: 'Midjourney Style Reference Codes (--sref) — Complete Gallery | III.PICS',
    description: 'Browse 1,300+ Midjourney --sref style reference codes with visual previews. Copy any sref code instantly and use it in your Midjourney prompts. The most complete free sref gallery, updated daily.',
    keywords: 'midjourney sref codes, midjourney sref, sref midjourney, midjourney style reference, how to use midjourney sref, best midjourney sref codes 2025, midjourney --sref guide, sref code list, III.PICS',
    type: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': 'How to Use Midjourney --sref Style Reference Codes',
      'description': 'A complete guide to using Midjourney --sref style reference codes to control the artistic style of your AI-generated images.',
      'url': 'https://iii.pics/midjourney-sref',
      'author': { '@type': 'Organization', 'name': 'III.PICS', 'url': 'https://iii.pics' },
      'publisher': { '@type': 'Organization', 'name': 'III.PICS', 'url': 'https://iii.pics', 'logo': { '@type': 'ImageObject', 'url': 'https://iii.pics/logo192.png' } },
      'image': 'https://iii.pics/og-default.jpg',
      'datePublished': '2025-01-01',
      'dateModified': '2026-04-07'
    }
  });
};

/**
 * /nanobanana — NanoBanana Pro AI Image Prompts
 */
export const useNanobananaSEO = () => {
  useSEO({
    title: 'NanoBanana Pro AI Image Prompts — Browse & Copy Free | III.PICS',
    description: 'Explore thousands of NanoBanana Pro AI image prompts with stunning visual results. One-click copy, no prompt engineering required. Free AI art inspiration updated daily.',
    keywords: 'nanobanana pro prompts, nanobanana ai, nanobanana pro image, nanobanana ai art generator, nanobanana prompt examples, nanobanana pro guide, ai image prompts nanobanana, III.PICS nanobanana',
    type: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      'name': 'NanoBanana Pro AI Image Prompts — III.PICS',
      'description': 'A curated gallery of NanoBanana Pro AI image prompts with visual previews and one-click copy.',
      'url': 'https://iii.pics/nanobanana',
      'provider': { '@type': 'Organization', 'name': 'III.PICS', 'url': 'https://iii.pics' }
    }
  });
};

/**
 * /gpt-image — GPT Image 1.5 Prompts Gallery
 */
export const useGptImageSEO = () => {
  useSEO({
    title: 'GPT Image 1.5 Prompts & AI Art Gallery — III.PICS',
    description: 'Browse GPT Image 1.5 prompts with visual examples. Discover how to write effective ChatGPT image generation prompts. Free gallery of OpenAI image generator results, updated daily.',
    keywords: 'gpt image prompts, gpt image 1.5, chatgpt image generation, openai image generator prompts, gpt image prompt examples, dall-e prompts, ai image generator prompts, III.PICS gpt image',
    type: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      'name': 'GPT Image 1.5 Prompts Gallery — III.PICS',
      'description': 'A curated gallery of GPT Image 1.5 AI-generated images with their prompts for inspiration.',
      'url': 'https://iii.pics/gpt-image',
      'provider': { '@type': 'Organization', 'name': 'III.PICS', 'url': 'https://iii.pics' }
    }
  });
};

/**
 * /seedance-guide — Seedance 2.0 AI Video Prompts
 */
export const useSeedanceGuideSEO = () => {
  useSEO({
    title: 'Seedance 2.0 AI Video Prompts — Text-to-Video Gallery | III.PICS',
    description: 'Explore Seedance 2.0 text-to-video and image-to-video prompts with playable previews. The best Seedance AI video prompt gallery — free inspiration for AI video creators.',
    keywords: 'seedance 2.0 prompts, seedance ai video, seedance video prompts examples, seedance 2.0 text to video, ai video generator prompts 2025, seedance prompt guide, kling ai video, text to video prompts, III.PICS seedance',
    type: 'website',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': 'How to Use Seedance 2.0 for AI Video Generation',
      'description': 'A guide to creating AI videos with Seedance 2.0, including text-to-video and image-to-video prompts.',
      'url': 'https://iii.pics/seedance-guide',
      'author': { '@type': 'Organization', 'name': 'III.PICS', 'url': 'https://iii.pics' },
      'publisher': { '@type': 'Organization', 'name': 'III.PICS', 'url': 'https://iii.pics', 'logo': { '@type': 'ImageObject', 'url': 'https://iii.pics/logo192.png' } },
      'image': 'https://iii.pics/og-default.jpg',
      'datePublished': '2025-01-01',
      'dateModified': '2026-04-07'
    }
  });
};

export default {
  useSEO,
  useHomeSEO,
  useExploreSEO,
  usePostSEO,
  useUserSEO,
  useCreateSEO,
  useSettingsSEO,
  useLoginSEO,
  useRegisterSEO,
  useAboutSEO,
  useHelpSEO,
  useGallerySEO,
  useSeedanceSEO,
  useImg2PromptSEO,
  useDocsSEO,
  useGalleryItemSEO,
  useSrefSEO,
  useMidjourneySrefSEO,
  useNanobananaSEO,
  useGptImageSEO,
  useSeedanceGuideSEO
};
