import React, { useRef, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Sparkles, ArrowRight, Wand2, Banana, ImageIcon, Shuffle, X, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { galleryAPI } from '../../services/galleryApi';
import { srefAPI } from '../../services/srefApi';

const STATS_CACHE_KEY = 'heroStatsCache';
const STATS_TTL = 24 * 60 * 60 * 1000;

async function fetchStats() {
  const cached = localStorage.getItem(STATS_CACHE_KEY);
  if (cached) {
    try {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < STATS_TTL) return data;
    } catch (_) {}
  }
  const { data } = await axios.get('/api/seo/stats');
  localStorage.setItem(STATS_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  return data;
}

// Count-up hook with ease-out cubic
const useCountUp = (target, duration = 1800) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return count;
};

const formatCount = (val) => val >= 1000 ? Math.round(val / 1000) + 'K+' : val + '+';

const Hero = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);
  const [randomWork, setRandomWork] = useState(null);
  const [isRandomLoading, setIsRandomLoading] = useState(false);
  const [statTargets, setStatTargets] = useState({ srefCount: 1300, galleryCount: 13000, seedanceCount: 1000, generationCount: 0 });

  useEffect(() => {
    fetchStats().then(setStatTargets).catch(() => {});
  }, []);

  const mjCount = useCountUp(statTargets.srefCount);
  const nbCount = useCountUp(statTargets.galleryCount);
  const sdCount = useCountUp(statTargets.seedanceCount);
  const gpCount = useCountUp(statTargets.generationCount);

  // 页面可见性API处理
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleOpenRandomWork = async () => {
    if (isRandomLoading) return;

    try {
      setIsRandomLoading(true);
      const [galleryResponse, srefResponse] = await Promise.allSettled([
        galleryAPI.getRandom(),
        srefAPI.getRandom(),
      ]);

      const candidates = [];

      const galleryPrompt = galleryResponse.status === 'fulfilled'
        ? galleryResponse.value?.data?.prompt
        : null;
      if (galleryPrompt?._id && galleryPrompt?.previewImage) {
        candidates.push({
          type: 'gallery',
          id: galleryPrompt._id,
          previewImage: galleryPrompt.previewImage,
          title: galleryPrompt.title,
        });
      }

      const srefPost = srefResponse.status === 'fulfilled'
        ? srefResponse.value?.data?.post
        : null;
      if (srefPost?._id && srefPost?.previewImage) {
        candidates.push({
          type: 'explore',
          id: srefPost._id,
          previewImage: srefPost.previewImage,
          title: srefPost.title || `--sref ${srefPost.srefCode || ''}`.trim(),
        });
      }

      if (candidates.length === 0) {
        throw new Error('No random work candidates available');
      }

      const nextWork = candidates[Math.floor(Math.random() * candidates.length)];
      setRandomWork(nextWork);
    } catch (error) {
      console.error('Failed to load random work:', error);
      toast.error('Failed to load a random work. Please try again.');
    } finally {
      setIsRandomLoading(false);
    }
  };

  const handleCloseRandomWork = () => {
    setRandomWork(null);
  };

  const handleBrowseRandomWork = () => {
    if (!randomWork?.id) return;
    const returnTo = `${location.pathname}${location.search}${location.hash}` || '/';
    const targetPath = randomWork.type === 'explore'
      ? `/explore/${randomWork.id}`
      : `/gallery/${randomWork.id}`;
    const targetUrl = `${targetPath}?returnTo=${encodeURIComponent(returnTo)}`;

    setRandomWork(null);
    navigate(targetUrl, {
      state: {
        fromHomeSurprise: true,
        returnTo,
      },
    });
  };

  // 支持多种格式的背景图片集合（包括WEBP、JPG格式）- 总计330张图片
  // 使用重命名后的正确文件路径，解决图片空白问题
  const backgroundImages = [
    { id: 1, src: '/ImageFlow/01-(1).webp', alt: 'Art 1' },
    { id: 2, src: '/ImageFlow/01-(2).webp', alt: 'Art' },
    { id: 3, src: '/ImageFlow/01-(3).webp', alt: 'Art' },
    { id: 4, src: '/ImageFlow/01-(4).webp', alt: 'Art' },
    { id: 5, src: '/ImageFlow/02-(1).webp', alt: 'Art' },
    { id: 6, src: '/ImageFlow/02-(2).webp', alt: 'Art' },
    { id: 7, src: '/ImageFlow/02-(3).webp', alt: 'Art' },
    { id: 8, src: '/ImageFlow/02-(4).webp', alt: 'Art' },
    { id: 9, src: '/ImageFlow/03.webp', alt: 'Art' },
    { id: 10, src: '/ImageFlow/04.webp', alt: 'Art' },
    { id: 11, src: '/ImageFlow/05.webp', alt: 'Art' },
    { id: 12, src: '/ImageFlow/06.webp', alt: 'Art' },
    { id: 13, src: '/ImageFlow/07-(1).webp', alt: 'Art' },
    { id: 14, src: '/ImageFlow/07-(2).webp', alt: 'Art' },
    { id: 15, src: '/ImageFlow/07-(3).webp', alt: 'Art' },
    { id: 16, src: '/ImageFlow/08.webp', alt: 'Art' },
    { id: 17, src: '/ImageFlow/09.webp', alt: 'Art' },
    { id: 18, src: '/ImageFlow/10.webp', alt: 'Art' },
    { id: 19, src: '/ImageFlow/11-(1).webp', alt: 'Art' },
    { id: 20, src: '/ImageFlow/11-(2).webp', alt: 'Art' },
    { id: 21, src: '/ImageFlow/12.webp', alt: 'Art' },
    { id: 22, src: '/ImageFlow/13.webp', alt: 'Art' },
    { id: 23, src: '/ImageFlow/15.webp', alt: 'Art' },
    { id: 24, src: '/ImageFlow/16-(1).webp', alt: 'Art' },
    { id: 25, src: '/ImageFlow/16-(2).webp', alt: 'Art' },
    { id: 26, src: '/ImageFlow/17-(1).webp', alt: 'Art' },
    { id: 27, src: '/ImageFlow/17-(2).webp', alt: 'Art' },
    { id: 28, src: '/ImageFlow/17-(3).webp', alt: 'Art' },
    { id: 29, src: '/ImageFlow/17-(4).webp', alt: 'Art' },
    { id: 30, src: '/ImageFlow/18.webp', alt: 'Art' },
    { id: 31, src: '/ImageFlow/19-(1).webp', alt: 'Art' },
    { id: 32, src: '/ImageFlow/19-(2).webp', alt: 'Art' },
    { id: 33, src: '/ImageFlow/20-(1).webp', alt: 'Art' },
    { id: 34, src: '/ImageFlow/20-(2).webp', alt: 'Art' },
    { id: 35, src: '/ImageFlow/20-(3).webp', alt: 'Art' },
    { id: 36, src: '/ImageFlow/21-(1).webp', alt: 'Art' },
    { id: 37, src: '/ImageFlow/21-(2).webp', alt: 'Art' },
    { id: 38, src: '/ImageFlow/22-(1).webp', alt: 'Art' },
    { id: 39, src: '/ImageFlow/22-(2).webp', alt: 'Art' },
    { id: 40, src: '/ImageFlow/23.webp', alt: 'Art' },
    { id: 41, src: '/ImageFlow/24.webp', alt: 'Art' },
    { id: 42, src: '/ImageFlow/25.webp', alt: 'Art' },
    { id: 43, src: '/ImageFlow/26-(1).webp', alt: 'Art' },
    { id: 44, src: '/ImageFlow/26-(2).webp', alt: 'Art' },
    { id: 45, src: '/ImageFlow/27.webp', alt: 'Art' },
    { id: 46, src: '/ImageFlow/28.webp', alt: 'Art' },
    { id: 47, src: '/ImageFlow/29.webp', alt: 'Art' },
    { id: 48, src: '/ImageFlow/30.webp', alt: 'Art' },
    { id: 49, src: '/ImageFlow/31-(1).webp', alt: 'Art' },
    { id: 50, src: '/ImageFlow/31-(2).webp', alt: 'Art' },
    { id: 51, src: '/ImageFlow/31-(3).webp', alt: 'Art' },
    { id: 52, src: '/ImageFlow/31-(4).webp', alt: 'Art' },
    { id: 53, src: '/ImageFlow/32.webp', alt: 'Art' },
    { id: 54, src: '/ImageFlow/33.webp', alt: 'Art' },
    { id: 55, src: '/ImageFlow/34.webp', alt: 'Art' },
    { id: 56, src: '/ImageFlow/35.webp', alt: 'Art' },
    { id: 57, src: '/ImageFlow/36-(1).webp', alt: 'Art' },
    { id: 58, src: '/ImageFlow/36-(2).webp', alt: 'Art' },
    { id: 59, src: '/ImageFlow/37-(1).webp', alt: 'Art' },
    { id: 60, src: '/ImageFlow/37-(2).webp', alt: 'Art' },
    { id: 61, src: '/ImageFlow/38-(1).webp', alt: 'Art' },
    { id: 62, src: '/ImageFlow/38-(2).webp', alt: 'Art' },
    { id: 63, src: '/ImageFlow/39.webp', alt: 'Art' },
    { id: 64, src: '/ImageFlow/40-(1).webp', alt: 'Art' },
    { id: 65, src: '/ImageFlow/40-(2).webp', alt: 'Art' },
    { id: 66, src: '/ImageFlow/40-(3).webp', alt: 'Art' },
    { id: 67, src: '/ImageFlow/41-(1).webp', alt: 'Art' },
    { id: 68, src: '/ImageFlow/41-(2).webp', alt: 'Art' },
    { id: 69, src: '/ImageFlow/42-(1).webp', alt: 'Art' },
    { id: 70, src: '/ImageFlow/42-(2).webp', alt: 'Art' },
    { id: 71, src: '/ImageFlow/42-(3).webp', alt: 'Art' },
    { id: 72, src: '/ImageFlow/42-(4).webp', alt: 'Art' },
    { id: 73, src: '/ImageFlow/43-(1).webp', alt: 'Art' },
    { id: 74, src: '/ImageFlow/43-(2).webp', alt: 'Art' },
    { id: 75, src: '/ImageFlow/43-(3).webp', alt: 'Art' },
    { id: 76, src: '/ImageFlow/44-(1).webp', alt: 'Art' },
    { id: 77, src: '/ImageFlow/44-(2).webp', alt: 'Art' },
    { id: 78, src: '/ImageFlow/44-(3).webp', alt: 'Art' },
    { id: 79, src: '/ImageFlow/44-(4).webp', alt: 'Art' },
    { id: 80, src: '/ImageFlow/45-(1).webp', alt: 'Art' },
    { id: 81, src: '/ImageFlow/45-(2).webp', alt: 'Art' },
    { id: 82, src: '/ImageFlow/45-(3).webp', alt: 'Art' },
    { id: 83, src: '/ImageFlow/45-(4).webp', alt: 'Art' },
    { id: 84, src: '/ImageFlow/46-(1).webp', alt: 'Art' },
    { id: 85, src: '/ImageFlow/46-(2).webp', alt: 'Art' },
    { id: 86, src: '/ImageFlow/46-(3).webp', alt: 'Art' },
    { id: 87, src: '/ImageFlow/46-(4).webp', alt: 'Art' },
    { id: 88, src: '/ImageFlow/47-(1).webp', alt: 'Art' },
    { id: 89, src: '/ImageFlow/47-(2).webp', alt: 'Art' },
    { id: 90, src: '/ImageFlow/47-(3).webp', alt: 'Art' },
    { id: 91, src: '/ImageFlow/47-(4).webp', alt: 'Art' },
    { id: 92, src: '/ImageFlow/48-(1).webp', alt: 'Art' },
    { id: 93, src: '/ImageFlow/48-(2).webp', alt: 'Art' },
    { id: 94, src: '/ImageFlow/48-(3).webp', alt: 'Art' },
    { id: 95, src: '/ImageFlow/48-(4).webp', alt: 'Art' },
    { id: 96, src: '/ImageFlow/49-(2).webp', alt: 'Art' },
    { id: 97, src: '/ImageFlow/49-(3).webp', alt: 'Art' },
    { id: 98, src: '/ImageFlow/49-(4).webp', alt: 'Art' },
    { id: 99, src: '/ImageFlow/49.webp', alt: 'Art' },
    { id: 100, src: '/ImageFlow/50-(1).webp', alt: 'Art' },
    { id: 101, src: '/ImageFlow/50-(2).webp', alt: 'Art' },
    { id: 102, src: '/ImageFlow/51-(1).webp', alt: 'Art' },
    { id: 103, src: '/ImageFlow/51-(2).webp', alt: 'Art' },
    { id: 104, src: '/ImageFlow/51-(3).webp', alt: 'Art' },
    { id: 105, src: '/ImageFlow/51-(4).webp', alt: 'Art' },
    { id: 106, src: '/ImageFlow/52-(1).webp', alt: 'Art' },
    { id: 107, src: '/ImageFlow/52-(2).webp', alt: 'Art' },
    { id: 108, src: '/ImageFlow/52-(3).webp', alt: 'Art' },
    { id: 109, src: '/ImageFlow/52-(4).webp', alt: 'Art' },
    { id: 110, src: '/ImageFlow/53-(1).webp', alt: 'Art' },
    { id: 111, src: '/ImageFlow/53-(2).webp', alt: 'Art' },
    { id: 112, src: '/ImageFlow/53-(3).webp', alt: 'Art' },
    { id: 113, src: '/ImageFlow/58-(1).webp', alt: 'Art' },
    { id: 114, src: '/ImageFlow/58-(2).webp', alt: 'Art' },
    { id: 115, src: '/ImageFlow/58-(3).webp', alt: 'Art' },
    { id: 116, src: '/ImageFlow/58-(4).webp', alt: 'Art' },
    { id: 117, src: '/ImageFlow/59-(1).webp', alt: 'Art' },
    { id: 118, src: '/ImageFlow/59-(2).webp', alt: 'Art' },
    { id: 119, src: '/ImageFlow/59-(3).webp', alt: 'Art' },
    { id: 120, src: '/ImageFlow/59-(4).webp', alt: 'Art' },
    { id: 121, src: '/ImageFlow/60-(1).webp', alt: 'Art' },
    { id: 122, src: '/ImageFlow/60-(2).webp', alt: 'Art' },
    { id: 123, src: '/ImageFlow/60-(3).webp', alt: 'Art' },
    { id: 124, src: '/ImageFlow/60-(4).webp', alt: 'Art' },
    { id: 125, src: '/ImageFlow/61-(1).webp', alt: 'Art' },
    { id: 126, src: '/ImageFlow/61-(2).webp', alt: 'Art' },
    { id: 127, src: '/ImageFlow/61-(3).webp', alt: 'Art' },
    { id: 128, src: '/ImageFlow/61-(4).webp', alt: 'Art' },
    { id: 129, src: '/ImageFlow/62-(1).webp', alt: 'Art' },
    { id: 130, src: '/ImageFlow/62-(2).webp', alt: 'Art' },
    { id: 131, src: '/ImageFlow/62-(3).webp', alt: 'Art' },
    { id: 132, src: '/ImageFlow/62-(4).webp', alt: 'Art' },
    { id: 133, src: '/ImageFlow/63-(1).webp', alt: 'Art' },
    { id: 134, src: '/ImageFlow/63-(2).webp', alt: 'Art' },
    { id: 135, src: '/ImageFlow/63-(3).webp', alt: 'Art' },
    { id: 136, src: '/ImageFlow/63-(4).webp', alt: 'Art' },
    { id: 137, src: '/ImageFlow/64-(1).webp', alt: 'Art' },
    { id: 138, src: '/ImageFlow/64-(2).webp', alt: 'Art' },
    { id: 139, src: '/ImageFlow/64-(3).webp', alt: 'Art' },
    { id: 140, src: '/ImageFlow/64-(4).webp', alt: 'Art' },
    { id: 141, src: '/ImageFlow/65-(1).webp', alt: 'Art' },
    { id: 142, src: '/ImageFlow/65-(2).webp', alt: 'Art' },
    { id: 143, src: '/ImageFlow/65-(3).webp', alt: 'Art' },
    { id: 144, src: '/ImageFlow/65-(4).webp', alt: 'Art' },
    { id: 145, src: '/ImageFlow/66-(1).webp', alt: 'Art' },
    { id: 146, src: '/ImageFlow/66-(2).webp', alt: 'Art' },
    { id: 147, src: '/ImageFlow/66-(3).webp', alt: 'Art' },
    { id: 148, src: '/ImageFlow/66-(4).webp', alt: 'Art' },
    { id: 149, src: '/ImageFlow/67-(1).webp', alt: 'Art' },
    { id: 150, src: '/ImageFlow/67-(2).webp', alt: 'Art' },
    { id: 151, src: '/ImageFlow/67-(3).webp', alt: 'Art' },
    { id: 152, src: '/ImageFlow/67-(4).webp', alt: 'Art' },
    { id: 153, src: '/ImageFlow/68-(1).webp', alt: 'Art' },
    { id: 154, src: '/ImageFlow/68-(2).webp', alt: 'Art' },
    { id: 155, src: '/ImageFlow/68-(3).webp', alt: 'Art' },
    { id: 156, src: '/ImageFlow/68-(4).webp', alt: 'Art' },
    { id: 157, src: '/ImageFlow/69-(1).webp', alt: 'Art' },
    { id: 158, src: '/ImageFlow/69-(2).webp', alt: 'Art' },
    { id: 159, src: '/ImageFlow/69-(3).webp', alt: 'Art' },
    { id: 160, src: '/ImageFlow/69-(4).webp', alt: 'Art' },
    { id: 161, src: '/ImageFlow/70-(1).webp', alt: 'Art' },
    { id: 162, src: '/ImageFlow/70-(2).webp', alt: 'Art' },
    { id: 163, src: '/ImageFlow/70-(3).webp', alt: 'Art' },
    { id: 164, src: '/ImageFlow/70-(4).webp', alt: 'Art' },
    { id: 165, src: '/ImageFlow/71-(1).webp', alt: 'Art' },
    { id: 166, src: '/ImageFlow/71-(2).webp', alt: 'Art' },
    { id: 167, src: '/ImageFlow/71-(3).webp', alt: 'Art' },
    { id: 168, src: '/ImageFlow/71-(4).webp', alt: 'Art' },
    { id: 169, src: '/ImageFlow/72-(1).webp', alt: 'Art' },
    { id: 170, src: '/ImageFlow/72-(2).webp', alt: 'Art' },
    { id: 171, src: '/ImageFlow/72-(3).webp', alt: 'Art' },
    { id: 172, src: '/ImageFlow/72-(4).webp', alt: 'Art' },
    { id: 173, src: '/ImageFlow/73-(1).webp', alt: 'Art' },
    { id: 174, src: '/ImageFlow/73-(2).webp', alt: 'Art' },
    { id: 175, src: '/ImageFlow/73-(3).webp', alt: 'Art' },
    { id: 176, src: '/ImageFlow/73-(4).webp', alt: 'Art' },
    { id: 177, src: '/ImageFlow/74-(1).webp', alt: 'Art' },
    { id: 178, src: '/ImageFlow/74-(2).webp', alt: 'Art' },
    { id: 179, src: '/ImageFlow/74-(3).webp', alt: 'Art' },
    { id: 180, src: '/ImageFlow/74-(4).webp', alt: 'Art' },
    { id: 181, src: '/ImageFlow/75-(1).webp', alt: 'Art' },
    { id: 182, src: '/ImageFlow/75-(2).webp', alt: 'Art' },
    { id: 183, src: '/ImageFlow/75-(3).webp', alt: 'Art' },
    { id: 184, src: '/ImageFlow/75-(4).webp', alt: 'Art' },
    { id: 185, src: '/ImageFlow/76-(1).webp', alt: 'Art' },
    { id: 186, src: '/ImageFlow/76-(2).webp', alt: 'Art' },
    { id: 187, src: '/ImageFlow/76-(3).webp', alt: 'Art' },
    { id: 188, src: '/ImageFlow/76-(4).webp', alt: 'Art' },
    { id: 189, src: '/ImageFlow/77-(1).webp', alt: 'Art' },
    { id: 190, src: '/ImageFlow/77-(2).webp', alt: 'Art' },
    { id: 191, src: '/ImageFlow/77-(3).webp', alt: 'Art' },
    { id: 192, src: '/ImageFlow/77-(4).webp', alt: 'Art' },
    { id: 193, src: '/ImageFlow/78-(1).webp', alt: 'Art' },
    { id: 194, src: '/ImageFlow/78-(2).webp', alt: 'Art' },
    { id: 195, src: '/ImageFlow/78-(3).webp', alt: 'Art' },
    { id: 196, src: '/ImageFlow/78-(4).webp', alt: 'Art' },
    { id: 197, src: '/ImageFlow/79-(1).webp', alt: 'Art' },
    { id: 198, src: '/ImageFlow/79-(2).webp', alt: 'Art' },
    { id: 199, src: '/ImageFlow/79-(3).webp', alt: 'Art' },
    { id: 200, src: '/ImageFlow/79-(4).webp', alt: 'Art' },
    { id: 201, src: '/ImageFlow/80-(1).webp', alt: 'Art' },
    { id: 202, src: '/ImageFlow/80-(2).webp', alt: 'Art' },
    { id: 203, src: '/ImageFlow/80-(3).webp', alt: 'Art' },
    { id: 204, src: '/ImageFlow/80-(4).webp', alt: 'Art' },
    { id: 205, src: '/ImageFlow/81-(1).webp', alt: 'Art' },
    { id: 206, src: '/ImageFlow/81-(2).webp', alt: 'Art' },
    { id: 207, src: '/ImageFlow/81-(3).webp', alt: 'Art' },
    { id: 208, src: '/ImageFlow/81-(4).webp', alt: 'Art' },
    { id: 209, src: '/ImageFlow/82-(1).webp', alt: 'Art' },
    { id: 210, src: '/ImageFlow/82-(2).webp', alt: 'Art' },
    { id: 211, src: '/ImageFlow/82-(3).webp', alt: 'Art' },
    { id: 212, src: '/ImageFlow/82-(4).webp', alt: 'Art' },
    { id: 213, src: '/ImageFlow/83-(1).webp', alt: 'Art' },
    { id: 214, src: '/ImageFlow/83-(2).webp', alt: 'Art' },
    { id: 215, src: '/ImageFlow/83-(3).webp', alt: 'Art' },
    { id: 216, src: '/ImageFlow/83-(4).webp', alt: 'Art' },
    { id: 217, src: '/ImageFlow/84-(1).webp', alt: 'Art' },
    { id: 218, src: '/ImageFlow/84-(2).webp', alt: 'Art' },
    { id: 219, src: '/ImageFlow/84-(3).webp', alt: 'Art' },
    { id: 220, src: '/ImageFlow/84-(4).webp', alt: 'Art' },
    { id: 221, src: '/ImageFlow/85-(1).webp', alt: 'Art' },
    { id: 222, src: '/ImageFlow/85-(2).webp', alt: 'Art' },
    { id: 223, src: '/ImageFlow/85-(3).webp', alt: 'Art' },
    { id: 224, src: '/ImageFlow/85-(4).webp', alt: 'Art' },
    { id: 225, src: '/ImageFlow/86-(1).webp', alt: 'Art' },
    { id: 226, src: '/ImageFlow/86-(2).webp', alt: 'Art' },
    { id: 227, src: '/ImageFlow/86-(3).webp', alt: 'Art' },
    { id: 228, src: '/ImageFlow/86-(4).webp', alt: 'Art' },
    { id: 229, src: '/ImageFlow/87-(1).webp', alt: 'Art' },
    { id: 230, src: '/ImageFlow/87-(2).webp', alt: 'Art' },
    { id: 231, src: '/ImageFlow/87-(3).webp', alt: 'Art' },
    { id: 232, src: '/ImageFlow/87-(4).webp', alt: 'Art' },
    { id: 233, src: '/ImageFlow/0001111.webp', alt: 'Art' },
    { id: 234, src: '/ImageFlow/Gq6_erGXsAAHFYP.jpg', alt: 'Art' },
    { id: 235, src: '/ImageFlow/Gq6_erYW8AAIoqH.jpg', alt: 'Art' },
    { id: 236, src: '/ImageFlow/Gqcdbu2W0AAjH8a.jpg', alt: 'Art' },
    { id: 237, src: '/ImageFlow/GqcdjxOXYAAF-6k.jpg', alt: 'Art' },
    { id: 238, src: '/ImageFlow/GqceNngXgAAcY5h.jpg', alt: 'Art' },
    { id: 239, src: '/ImageFlow/GqcfMbIWQAAwv0_.jpg', alt: 'Art' },
    { id: 240, src: '/ImageFlow/GqxX6iPXMAAVdpR.jpg', alt: 'Art' },
    { id: 241, src: '/ImageFlow/GqxXfJtXcAEX5u0.jpg', alt: 'Art' },
    { id: 242, src: '/ImageFlow/GqxXwMLWIAAZ4Nz.jpg', alt: 'Art' },
    { id: 243, src: '/ImageFlow/GqxZBPQWYAAKNKB.jpg', alt: 'Art' },
    { id: 244, src: '/ImageFlow/Gu2QB3la4AAf8N5.jpg', alt: 'Art' },
    { id: 245, src: '/ImageFlow/Gu2QBi7bkAAuapw.jpg', alt: 'Art' },
    { id: 246, src: '/ImageFlow/Gu7aESnbAAAjJe1.jpg', alt: 'Art' },
    { id: 247, src: '/ImageFlow/GucgS5kbgAAZNAn.jpg', alt: 'Art' },
    { id: 248, src: '/ImageFlow/GucgSkPbEAAe1sZ.jpg', alt: 'Art' },
    { id: 249, src: '/ImageFlow/GuH57djbYAAmctE.jpg', alt: 'Art' },
    { id: 250, src: '/ImageFlow/GuH57E3bAAAqTa_.jpg', alt: 'Art' },
    { id: 251, src: '/ImageFlow/GuH57oEb0AETQib.jpg', alt: 'Art' },
    { id: 252, src: '/ImageFlow/GuH57RIbMAAUpw3.jpg', alt: 'Art' },
    { id: 253, src: '/ImageFlow/GuhqG3yaoAIgFPi.jpg', alt: 'Art' },
    { id: 254, src: '/ImageFlow/GuhqGhyaoAUHMli.jpg', alt: 'Art' },
    { id: 255, src: '/ImageFlow/GumzC2laYAAYF43.jpg', alt: 'Art' },
    { id: 256, src: '/ImageFlow/Gur7e_kaQAA4ck7.jpg', alt: 'Art' },
    { id: 257, src: '/ImageFlow/Gur7fdka4AAiSbs.jpg', alt: 'Art' },
    { id: 258, src: '/ImageFlow/Gur7fJ7aAAAYQue.jpg', alt: 'Art' },
    { id: 259, src: '/ImageFlow/Gur7fTTaIAAmTHd.jpg', alt: 'Art' },
    { id: 260, src: '/ImageFlow/Gv0Djd6aQAEH3S9.jpg', alt: 'Art' },
    { id: 261, src: '/ImageFlow/Gv1Ktm9WMAApFiw.jpg', alt: 'Art' },
    { id: 262, src: '/ImageFlow/Gv1KtYIWMAUsrLV.jpg', alt: 'Art' },
    { id: 263, src: '/ImageFlow/Gv2BpbkWoAAb3aE.jpg', alt: 'Art' },
    { id: 264, src: '/ImageFlow/Gv4Hl5NXsAAKySz.jpg', alt: 'Art' },
    { id: 265, src: '/ImageFlow/Gv4HlczXkAA4Fad.jpg', alt: 'Art' },
    { id: 266, src: '/ImageFlow/Gv4HlLXXkAAijLW.jpg', alt: 'Art' },
    { id: 267, src: '/ImageFlow/Gv4HlrFXoAAxwri.jpg', alt: 'Art' },
    { id: 268, src: '/ImageFlow/Gv4p3s3XMAEemEi.jpg', alt: 'Art' },
    { id: 269, src: '/ImageFlow/Gv4p4ITWEAAUA0m.jpg', alt: 'Art' },
    { id: 270, src: '/ImageFlow/Gv4p4T7XQAAFFhv.jpg', alt: 'Art' },
    { id: 271, src: '/ImageFlow/Gv7LO78WkAASVvN.jpg', alt: 'Art' },
    { id: 272, src: '/ImageFlow/Gv51s9BbQAAVo-D.jpg', alt: 'Art' },
    { id: 273, src: '/ImageFlow/Gv51tIpbUAAbTcd.jpg', alt: 'Art' },
    { id: 274, src: '/ImageFlow/GvAjbNIaMAAlgPs.jpg', alt: 'Art' },
    { id: 275, src: '/ImageFlow/GvaSO7WbcAAqK1.jpg', alt: 'Art' },
    { id: 276, src: '/ImageFlow/GvjhLhxXcAEdBIg.jpg', alt: 'Art' },
    { id: 277, src: '/ImageFlow/GvjhLUwW4AAZ76p.jpg', alt: 'Art' },
    { id: 278, src: '/ImageFlow/GvjhLvUWcAAS0oT.jpg', alt: 'Art' },
    { id: 279, src: '/ImageFlow/GvmJaXRXcAA_tge.jpg', alt: 'Art' },
    { id: 280, src: '/ImageFlow/GvmJZ7IWQAAkXyf.jpg', alt: 'Art' },
    { id: 281, src: '/ImageFlow/GvurY1BbEAAYMrZ.jpg', alt: 'Art' },
    { id: 282, src: '/ImageFlow/GvVJyFsbMAAFqO_.jpg', alt: 'Art' },
    { id: 283, src: '/ImageFlow/GvVJyhuaYAMG94a.jpg', alt: 'Art' },
    { id: 284, src: '/ImageFlow/GvwBH3JXMAAZ1fw.jpg', alt: 'Art' },
    { id: 285, src: '/ImageFlow/GvwBIIfWYAAvcXs.jpg', alt: 'Art' },
    { id: 286, src: '/ImageFlow/GvwBIYbWcAA7ofr.jpg', alt: 'Art' },
    { id: 287, src: '/ImageFlow/GvWoI6FXEAAEGz3.jpg', alt: 'Art' },
    { id: 288, src: '/ImageFlow/GvWoI7AWsAApcLa.jpg', alt: 'Art' },
    { id: 289, src: '/ImageFlow/GvWVgNOXAA0ytGq.jpg', alt: 'Art' },
    { id: 290, src: '/ImageFlow/Gvy98oYWMAAh-Sl.jpg', alt: 'Art' },
    { id: 291, src: '/ImageFlow/Gw4K0b4WAAAYPbH.jpg', alt: 'Art' },
    { id: 292, src: '/ImageFlow/Gw4K0CbXoAAb-Ar.jpg', alt: 'Art' },
    { id: 293, src: '/ImageFlow/Gw4K0OCXUAAa8o9.jpg', alt: 'Art' },
    { id: 294, src: '/ImageFlow/Gw4Kz1CXcAAls62.jpg', alt: 'Art' },
    { id: 295, src: '/ImageFlow/Gw7EO3FXMAAAJd1.jpg', alt: 'Art' },
    { id: 296, src: '/ImageFlow/Gw7EObaXAAAUhT9.jpg', alt: 'Art' },
    { id: 297, src: '/ImageFlow/Gw7EOLoXUAAhilH.jpg', alt: 'Art' },
    { id: 298, src: '/ImageFlow/Gw7EOoHXQAABmXh.jpg', alt: 'Art' },
    { id: 299, src: '/ImageFlow/Gw-rO6hWQAAKnwS.jpg', alt: 'Art' },
    { id: 300, src: '/ImageFlow/GwDfjbEaIAAAM8Y.jpg', alt: 'Art' },
    { id: 301, src: '/ImageFlow/GwDfjRAawAAdWAe.jpg', alt: 'Art' },
    { id: 302, src: '/ImageFlow/GwEJdZvXMAAPFwO.jpg', alt: 'Art' },
    { id: 303, src: '/ImageFlow/GwEJemrXYAAUgJ_.jpg', alt: 'Art' },
    { id: 304, src: '/ImageFlow/Gwh-1-GXoAAJjki.jpg', alt: 'Art' },
    { id: 305, src: '/ImageFlow/GwINamzW4AAwgd_.jpg', alt: 'Art' },
    { id: 306, src: '/ImageFlow/GwIRG_vWAAAq9G0.jpg', alt: 'Art' },
    { id: 307, src: '/ImageFlow/GwIRGQiWwAAHCf1.jpg', alt: 'Art' },
    { id: 308, src: '/ImageFlow/GwIRH2aXIAAJPn9.jpg', alt: 'Art' },
    { id: 309, src: '/ImageFlow/GwIRIisXsAAJTQu.jpg', alt: 'Art' },
    { id: 310, src: '/ImageFlow/GwNxqavbsAAPIWv.jpg', alt: 'Art' },
    { id: 311, src: '/ImageFlow/GwNxqnQbcAAXPKU.jpg', alt: 'Art' },
    { id: 312, src: '/ImageFlow/GwOAVyLWUAMoXD9.jpg', alt: 'Art' },
    { id: 313, src: '/ImageFlow/GwsszbTbgAIYPzX.jpg', alt: 'Art' },
    { id: 314, src: '/ImageFlow/GwsszPNbgAEword.jpg', alt: 'Art' },
    { id: 315, src: '/ImageFlow/GwsszwSbgAE8pcK.jpg', alt: 'Art' },
    { id: 316, src: '/ImageFlow/GxBV_VPWsAE8uRV.jpg', alt: 'Art' },
    { id: 317, src: '/ImageFlow/GxBWAUAXwAAyrCT.jpg', alt: 'Art' },
    { id: 318, src: '/ImageFlow/GxBWBZsWsAAFAgk.jpg', alt: 'Art' },
    { id: 319, src: '/ImageFlow/GxGcjHTa0AEWD5u.jpg', alt: 'Art' },
    { id: 320, src: '/ImageFlow/GZ8pBUEWkAAn5Z0.jpg', alt: 'Art' },
    { id: 321, src: '/ImageFlow/GZ8pBUFWMAAu4GE.jpg', alt: 'Art' },
    { id: 322, src: '/ImageFlow/GZ8pBUHW4AA2gxN.jpg', alt: 'Art' },
    { id: 323, src: '/ImageFlow/GZ8ptTwW0AAMUiC.jpg', alt: 'Art' },
    { id: 324, src: '/ImageFlow/image_001.webp', alt: 'Art' },
    { id: 325, src: '/ImageFlow/image_002.webp', alt: 'Art' },
    { id: 326, src: '/ImageFlow/image_003.webp', alt: 'Art' },
    { id: 327, src: '/ImageFlow/image_004.webp', alt: 'Art' },
    { id: 328, src: '/ImageFlow/image_005.webp', alt: 'Art' },
    { id: 329, src: '/ImageFlow/image_006.webp', alt: 'Art' },
    { id: 330, src: '/ImageFlow/image_007.webp', alt: 'Art' }
  ];

  // 将图片分组为列（每列3张图片，填满背景高度）
  const createImageColumns = (imageArray) => {
    const columns = [];
    for (let i = 0; i < imageArray.length; i += 3) {
      const columnImages = imageArray.slice(i, i + 3);
      // 如果最后一列图片不足3张，用前面的图片补齐
      while (columnImages.length < 3) {
        const fillIndex = columnImages.length % imageArray.length;
        columnImages.push(imageArray[fillIndex]);
      }
      columns.push(columnImages);
    }
    console.log(`Created ${columns.length} columns, ${columns[0]?.length || 0} images per column`);
    return columns;
  };

  const imageColumns = createImageColumns(backgroundImages);
  const duplicatedColumns = [...imageColumns, ...imageColumns];



  // CSS动画定义（参考指南文档优化参数）
  const animations = `
    @keyframes scroll-left {
      0% {
        transform: translateX(0);
      }
      100% {
        transform: translateX(-50%);
      }
    }
    
    .animate-scroll-hero {
      animation: scroll-left 180s linear infinite;
    }
    
    .animate-paused {
      animation-play-state: paused;
    }
    
    .animate-force-running {
      animation-play-state: running !important;
    }
  `;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20 sm:py-32">
      {/* 注入CSS动画 */}
      <style>{animations}</style>

      {/* 流动图片背景 */}
      <div
        className="absolute inset-0 opacity-40"
      >
        <div
          ref={wrapperRef}
          className={`flex absolute top-0 left-0 h-full w-[200%] animate-scroll-hero ${isVisible ? 'animate-force-running' : ''}`}
        >
          {duplicatedColumns.map((column, columnIndex) => (
            <div
              key={columnIndex}
              className="w-[180px] h-full flex-shrink-0 flex flex-col mr-[1px]"
            >
              {column.map((image, imageIndex) => (
                <div
                  key={`${columnIndex}-${imageIndex}`}
                  className="w-[180px] flex-1 p-0.5"
                  style={{ minHeight: '33.33%' }}
                >
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover rounded-lg shadow-md"
                    loading="lazy"
                    style={{ imageRendering: 'crisp-edges' }}
                    onError={(e) => {
                      // 图片加载失败时显示占位符，而不是隐藏
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTgwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDE4MCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxODAiIGhlaWdodD0iMTIwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik05MCA2MEM5NCA2MCA5NyA1NyA5NyA1M0M5NyA0OSA5NCA0NiA5MCA0NkM4NiA0NiA4MyA0OSA4MyA1M0M4MyA1NyA4NiA2MCA5MCA2MFoiIGZpbGw9IiNkMWQ1ZGIiLz4KPHBhdGggZD0iTTcwIDgwTDkwIDYwTDExMCA4MEgxNDBWMTAwSDQwVjgwSDcwWiIgZmlsbD0iI2QxZDVkYiIvPgo8L3N2Zz4K';
                      e.target.style.opacity = '0.3';
                      console.warn(`Background image load failed: ${image.src}`);
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 渐变遮罩层 */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/50 via-transparent to-white/50 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-white/30 pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Sparkles className="w-16 h-16 text-primary-500" />
                <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-xl animate-pulse-slow"></div>
              </div>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-6">
              <span className="gradient-text">III.PICS</span>
              <br />
              <span className="text-3xl sm:text-4xl lg:text-5xl font-medium text-slate-700">
                {t('home.hero.title')}
              </span>
            </h1>

            <div className="mb-4">
              <p className="text-lg sm:text-xl font-semibold text-primary-600 mb-2">
                {t('home.hero.slogan')}
              </p>
              <p className="text-base sm:text-lg text-slate-500">
                {t('home.hero.subtitle')}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <button
              onClick={handleOpenRandomWork}
              className="btn btn-ghost text-lg px-8 py-4 flex items-center gap-2"
              style={{ border: '1.5px solid rgba(100,116,139,0.35)', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.7)', color: '#475569', backdropFilter: 'blur(4px)' }}
              disabled={isRandomLoading}
            >
              <Shuffle className="w-5 h-5" />
              {isRandomLoading ? 'Loading...' : t('home.hero.randomBtn')}
            </button>
          </motion.div>

          {/* Random image lightbox */}
          {randomWork && (
            <div
              className="hero-lightbox"
              onClick={handleCloseRandomWork}
            >
              <div
                className="hero-lightbox-inner"
                onClick={e => e.stopPropagation()}
              >
                <button
                  className="hero-lightbox-close"
                  onClick={handleCloseRandomWork}
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
                <img
                  src={randomWork.previewImage}
                  alt={randomWork.title || 'Random work preview'}
                  className="hero-lightbox-img"
                />
                <div className="hero-lightbox-footer">
                  <button
                    type="button"
                    className="hero-lightbox-link"
                    onClick={handleBrowseRandomWork}
                  >
                    {t('home.hero.exploreButton')} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 特色数据 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto"
          >
            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                  <Wand2 className="w-6 h-6 text-primary-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-2">{formatCount(mjCount)}</div>
              <div className="text-slate-600">{t('home.hero.stats.midjourney')}</div>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Banana className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-2">{formatCount(nbCount)}</div>
              <div className="text-slate-600">{t('home.hero.stats.nanobanana')}</div>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Video className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-2">{formatCount(sdCount)}</div>
              <div className="text-slate-600">{t('home.hero.stats.seedance')}</div>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="text-3xl font-bold text-slate-900 mb-2">{formatCount(gpCount)}</div>
              <div className="text-slate-600">{t('home.hero.stats.gptimage')}</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
