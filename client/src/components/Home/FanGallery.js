import React, { useRef, useEffect, useState, useCallback } from 'react';

// 11 levels of sizes, index 5 = largest (center)
const FAN_SIZES = [
  { w: 56,  h: 80  },
  { w: 86,  h: 115 },
  { w: 116, h: 155 },
  { w: 150, h: 200 },
  { w: 188, h: 250 },
  { w: 225, h: 300 }, // max (index 5)
  { w: 188, h: 250 },
  { w: 150, h: 200 },
  { w: 116, h: 155 },
  { w: 86,  h: 115 },
  { w: 56,  h: 80  },
];

const PARALLAX_X_STEP = 22;
const PARALLAX_Y_AMP  = 10;
const LERP_FACTOR     = 0.08;

function lerp(a, b, t) { return a + (b - a) * t; }

// Compute size for item at position i when hoveredIdx is h (-1 = default)
function getSize(i, count, hoveredIdx) {
  const centerPos = Math.floor(count / 2);
  if (hoveredIdx < 0) {
    // default: symmetric around center
    const offset = Math.abs(i - centerPos);
    return FAN_SIZES[Math.max(0, 5 - offset)];
  }
  const dist = Math.abs(i - hoveredIdx);
  return FAN_SIZES[Math.max(0, 5 - dist)];
}

const FanGallery = ({ items, getImage, getAlt, onItemClick }) => {
  const containerRef = useRef(null);
  const itemRefs     = useRef([]);
  const mouseTarget  = useRef({ x: 0, y: 0 });
  const mouseCurrent = useRef({ x: 0, y: 0 });
  const rafId        = useRef(null);

  const [hoveredIdx, setHoveredIdx] = useState(-1);
  const hoveredIdxRef = useRef(-1);

  // keep ref in sync for RAF
  useEffect(() => { hoveredIdxRef.current = hoveredIdx; }, [hoveredIdx]);

  const visibleItems = items.filter(item => getImage(item)).slice(0, 11);
  const count = visibleItems.length;
  const centerPos = Math.floor(count / 2);

  const handleMouseMove = useCallback((e) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseTarget.current.x = (e.clientX - rect.left) / rect.width - 0.5;
    mouseTarget.current.y = (e.clientY - rect.top)  / rect.height - 0.5;
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseTarget.current = { x: 0, y: 0 };
    setHoveredIdx(-1);
  }, []);

  // RAF loop: parallax only (no scale — sizes handle hierarchy)
  useEffect(() => {
    const tick = () => {
      mouseCurrent.current.x = lerp(mouseCurrent.current.x, mouseTarget.current.x, LERP_FACTOR);
      mouseCurrent.current.y = lerp(mouseCurrent.current.y, mouseTarget.current.y, LERP_FACTOR);

      const mx = mouseCurrent.current.x;
      const my = mouseCurrent.current.y;
      const hIdx = hoveredIdxRef.current;

      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const offset = i - centerPos;
        const px = mx * offset * PARALLAX_X_STEP;
        const py = my * -PARALLAX_Y_AMP;

        // z-index: hovered item on top, others by distance from hovered (or center)
        const refPos = hIdx >= 0 ? hIdx : centerPos;
        const zDist  = Math.abs(i - refPos);
        el.style.zIndex   = String(20 - zDist);
        el.style.transform = `translateX(${px.toFixed(2)}px) translateY(${py.toFixed(2)}px)`;
      });

      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId.current);
  }, [centerPos]);

  if (count === 0) return null;

  return (
    <div
      ref={containerRef}
      className="fan-container"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {visibleItems.map((item, i) => {
        const { w, h } = getSize(i, count, hoveredIdx);
        return (
          <div
            key={item._id || i}
            ref={el => { itemRefs.current[i] = el; }}
            className="fan-item"
            style={{ width: w, height: h }}
            onMouseEnter={() => setHoveredIdx(i)}
            onClick={() => onItemClick(item)}
          >
            <img
              src={getImage(item)}
              alt={getAlt(item)}
              className="fan-img"
              loading="lazy"
              draggable={false}
            />
          </div>
        );
      })}
    </div>
  );
};

export default FanGallery;
