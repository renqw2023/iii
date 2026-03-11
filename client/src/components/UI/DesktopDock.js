/**
 * DesktopDock — 桌面端底部浮动导航胶囊（阶段31精装版）
 *
 * 特性：
 *   - 半透明毛玻璃背景（backdrop-filter blur + saturate）
 *   - macOS Dock 风格：图标按鼠标到中心距离动态放大
 *     实现方式：useMotionValue（鼠标X）→ useTransform（距离→scale）→ useSpring（弹性）
 *     transform-origin: bottom center，图标向上生长
 *   - 入场：从下方 spring 弹出
 *   - Tooltip：hover 时从下向上淡入
 *   - 激活项底部圆点 + 辉光
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  motion, AnimatePresence,
  useMotionValue, useSpring, useTransform,
} from 'framer-motion';
import { Home, Layers, Image, Clapperboard, ArrowUp } from 'lucide-react';

const SparklesIcon = ({ size = 20, color = 'currentColor', strokeWidth = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      d="M11.8525 4.21651L11.7221 3.2387C11.6906 3.00226 11.4889 2.82568 11.2504 2.82568C11.0118 2.82568 10.8102 3.00226 10.7786 3.23869L10.6483 4.21651C10.2658 7.0847 8.00939 9.34115 5.14119 9.72358L4.16338 9.85396C3.92694 9.88549 3.75037 10.0872 3.75037 10.3257C3.75037 10.5642 3.92694 10.7659 4.16338 10.7974L5.14119 10.9278C8.00938 11.3102 10.2658 13.5667 10.6483 16.4349L10.7786 17.4127C10.8102 17.6491 11.0118 17.8257 11.2504 17.8257C11.4889 17.8257 11.6906 17.6491 11.7221 17.4127L11.8525 16.4349C12.2349 13.5667 14.4913 11.3102 17.3595 10.9278L18.3374 10.7974C18.5738 10.7659 18.7504 10.5642 18.7504 10.3257C18.7504 10.0872 18.5738 9.88549 18.3374 9.85396L17.3595 9.72358C14.4913 9.34115 12.2349 7.0847 11.8525 4.21651Z"
      stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round"
    />
    <path
      d="M4.6519 14.7568L4.82063 14.2084C4.84491 14.1295 4.91781 14.0757 5.00037 14.0757C5.08292 14.0757 5.15582 14.1295 5.1801 14.2084L5.34883 14.7568C5.56525 15.4602 6.11587 16.0108 6.81925 16.2272L7.36762 16.3959C7.44652 16.4202 7.50037 16.4931 7.50037 16.5757C7.50037 16.6582 7.44652 16.7311 7.36762 16.7554L6.81926 16.9241C6.11587 17.1406 5.56525 17.6912 5.34883 18.3946L5.1801 18.9429C5.15582 19.0218 5.08292 19.0757 5.00037 19.0757C4.91781 19.0757 4.84491 19.0218 4.82063 18.9429L4.65191 18.3946C4.43548 17.6912 3.88486 17.1406 3.18147 16.9241L2.63311 16.7554C2.55421 16.7311 2.50037 16.6582 2.50037 16.5757C2.50037 16.4931 2.55421 16.4202 2.63311 16.3959L3.18148 16.2272C3.88486 16.0108 4.43548 15.4602 4.6519 14.7568Z"
      stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round"
    />
  </svg>
);

const ROUTE_ITEMS = [
  { to: '/',         icon: Home,         label: 'Home',            exact: true  },
  { to: '/explore',  icon: Layers,       label: 'Sref Styles',     exact: false },
  { to: '/gallery',  icon: Image,        label: 'AI Gallery',      exact: false },
  { to: '/seedance', icon: Clapperboard, label: 'Seedance Videos', exact: false },
];

/* 放大参数 */
const MAG_RADIUS  = 116;   // px — 鼠标影响半径
const SCALE_MAX   = 1.34;  // 最大放大倍率
const SPRING_CFG  = { mass: 0.14, stiffness: 320, damping: 24 };
const MIN_SCROLL_TOP_THRESHOLD = 1800;
const VIEWPORT_SCROLL_MULTIPLIER = 3.6;

/* ── 单个 Dock 图标 ── */
const DockItem = ({ mouseX, active, label, onClick, isButton, to, children }) => {
  const ref = useRef(null);
  const [hovered, setHovered] = useState(false);

  /* 鼠标 X → 与本图标中心的距离 → scale */
  const distance = useTransform(mouseX, (val) => {
    const el = ref.current;
    if (!el || val === Infinity) return Infinity;
    const rect = el.getBoundingClientRect();
    return val - (rect.left + rect.width / 2);
  });

  const scaleRaw = useTransform(
    distance,
    [-MAG_RADIUS, 0, MAG_RADIUS],
    [1, SCALE_MAX, 1],
    { clamp: true },
  );
  const scale = useSpring(scaleRaw, SPRING_CFG);

  const content = (
    <div
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 图标容器 — scale 驱动整体，transform-origin bottom 向上生长 */}
      <motion.div
        ref={ref}
        onClick={isButton ? onClick : undefined}
        style={{
          scale,
          transformOrigin: 'bottom center',
          width: 40,
          height: 40,
          borderRadius: 11,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          backgroundColor: active
            ? 'rgba(255,255,255,0.16)'
            : hovered ? 'rgba(255,255,255,0.1)' : 'transparent',
          color: active ? '#6366f1' : 'var(--text-secondary)',
          border: hovered || active ? '1px solid rgba(255,255,255,0.22)' : '1px solid transparent',
          padding: 0,
          position: 'relative',
          boxShadow: active ? 'inset 0 1px 0 rgba(255,255,255,0.18)' : 'none',
          transition: 'background-color 0.12s ease, border-color 0.12s ease, box-shadow 0.12s ease',
        }}
      >
        {children}

        {/* 激活圆点 */}
        <AnimatePresence>
          {active && (
            <motion.div
              key="dot"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              style={{
                position: 'absolute',
                bottom: 4,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 4,
                height: 4,
                borderRadius: '50%',
                backgroundColor: '#6366f1',
                boxShadow: '0 0 6px rgba(99,102,241,0.8)',
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            key="tooltip"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.14 }}
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 14px)',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(12,12,12,0.85)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 500,
              padding: '4px 10px',
              borderRadius: 7,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 10,
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            {label}
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '4px solid rgba(12,12,12,0.85)',
            }} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (isButton) return content;
  return <Link to={to} style={{ textDecoration: 'none' }}>{content}</Link>;
};

/* ── 主组件 ── */
const DesktopDock = ({ onImg2PromptClick }) => {
  const location = useLocation();
  const isImg2PromptActive = location.pathname.startsWith('/img2prompt');
  const mouseX = useMotionValue(Infinity);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const getThreshold = () => Math.max(
      MIN_SCROLL_TOP_THRESHOLD,
      Math.round(window.innerHeight * VIEWPORT_SCROLL_MULTIPLIER),
    );

    const updateVisibility = () => {
      setShowScrollTop(window.scrollY >= getThreshold());
    };

    updateVisibility();
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility);

    return () => {
      window.removeEventListener('scroll', updateVisibility);
      window.removeEventListener('resize', updateVisibility);
    };
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className="fixed hidden md:block"
      style={{ bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 50 }}
    >
      <motion.nav
        className="flex items-end"
        initial={{ opacity: 0, y: 32, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26, delay: 0.08 }}
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
      >
        {/* 毛玻璃胶囊 */}
        <motion.div
          layout
          transition={{ layout: { type: 'spring', stiffness: 360, damping: 28 } }}
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 4,
            padding: '10px 14px 12px',
            borderRadius: 22,
            backgroundColor: 'rgba(255, 255, 255, 0.62)',
            backdropFilter: 'blur(28px) saturate(200%)',
            WebkitBackdropFilter: 'blur(28px) saturate(200%)',
            border: '1px solid transparent',
            boxShadow:
              '0 20px 60px -8px rgba(0,0,0,0.16),' +
              '0 4px 16px rgba(0,0,0,0.07),' +
              'inset 0 1px 0 rgba(255,255,255,0.95)',
          }}
        >
          {ROUTE_ITEMS.map(({ to, icon: Icon, label, exact }) => {
            const active = exact
              ? location.pathname === to
              : location.pathname.startsWith(to);
            return (
              <DockItem key={to} to={to} active={active} label={label} mouseX={mouseX}>
                <Icon size={20} strokeWidth={active ? 2.2 : 1.8} />
              </DockItem>
            );
          })}

          {/* 分隔线 */}
          <div style={{
            width: 1,
            height: 26,
            backgroundColor: 'rgba(0,0,0,0.12)',
            margin: '0 2px 4px',
            alignSelf: 'center',
          }} />

          {/* img2prompt */}
          <DockItem
            isButton
            mouseX={mouseX}
            active={isImg2PromptActive}
            label="Image Generation"
            onClick={onImg2PromptClick}
          >
            <SparklesIcon
              size={20}
              color={isImg2PromptActive ? '#6366f1' : 'var(--text-secondary)'}
              strokeWidth={isImg2PromptActive ? 1.8 : 1.5}
            />
          </DockItem>

          <AnimatePresence initial={false}>
            {showScrollTop && (
              <motion.div
                key="scroll-top"
                layout
                initial={{ opacity: 0, scale: 0.82, x: 16 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.82, x: 16 }}
                transition={{ type: 'spring', stiffness: 360, damping: 26 }}
                style={{ display: 'flex', alignItems: 'flex-end' }}
              >
                <div style={{
                  width: 1,
                  height: 26,
                  backgroundColor: 'rgba(0,0,0,0.12)',
                  margin: '0 2px 4px',
                  alignSelf: 'center',
                }} />

                <DockItem
                  isButton
                  mouseX={mouseX}
                  active={false}
                  label="Back to Top"
                  onClick={handleScrollToTop}
                >
                  <ArrowUp size={20} strokeWidth={1.9} />
                </DockItem>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.nav>
    </div>
  );
};

export default DesktopDock;
