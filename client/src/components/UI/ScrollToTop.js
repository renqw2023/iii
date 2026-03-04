import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * ScrollToTop 组件
 * 在路由变化时自动滚动到页面顶部
 * 但浏览器后退/前进（POP）时不滚动，让浏览器恢复此前的滚动位置
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    // POP = 浏览器后退 / 前进 → 保持原有滚动位置
    if (navigationType === 'POP') return;

    // PUSH / REPLACE → 正常滚到顶部
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, [pathname, navigationType]);

  return null;
};

export default ScrollToTop;