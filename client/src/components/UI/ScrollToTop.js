import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop 组件
 * 在路由变化时自动滚动到页面顶部
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // 路由变化时滚动到顶部
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth' // 平滑滚动
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;