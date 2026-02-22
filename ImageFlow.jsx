import React, { useState, useEffect, useRef } from 'react';

/**
 * 图片横向流动组件
 * 类似 midjourneysref.com 的图片展示效果
 */
const ImageFlow = ({ 
  images = [], 
  speed = 90, 
  height = 460, 
  columnWidth = 180, 
  gap = 5,
  pauseOnHover = true,
  className = ''
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(speed);
  const wrapperRef = useRef(null);

  // 默认示例图片
  const defaultImages = [
    { id: 1, src: 'https://picsum.photos/180/230?random=1', alt: '示例图片 1' },
    { id: 2, src: 'https://picsum.photos/180/230?random=2', alt: '示例图片 2' },
    { id: 3, src: 'https://picsum.photos/180/230?random=3', alt: '示例图片 3' },
    { id: 4, src: 'https://picsum.photos/180/230?random=4', alt: '示例图片 4' },
    { id: 5, src: 'https://picsum.photos/180/230?random=5', alt: '示例图片 5' },
    { id: 6, src: 'https://picsum.photos/180/230?random=6', alt: '示例图片 6' },
    { id: 7, src: 'https://picsum.photos/180/230?random=7', alt: '示例图片 7' },
    { id: 8, src: 'https://picsum.photos/180/230?random=8', alt: '示例图片 8' },
    { id: 9, src: 'https://picsum.photos/180/230?random=9', alt: '示例图片 9' },
    { id: 10, src: 'https://picsum.photos/180/230?random=10', alt: '示例图片 10' },
    { id: 11, src: 'https://picsum.photos/180/230?random=11', alt: '示例图片 11' },
    { id: 12, src: 'https://picsum.photos/180/230?random=12', alt: '示例图片 12' },
    { id: 13, src: 'https://picsum.photos/180/230?random=13', alt: '示例图片 13' },
    { id: 14, src: 'https://picsum.photos/180/230?random=14', alt: '示例图片 14' },
    { id: 15, src: 'https://picsum.photos/180/230?random=15', alt: '示例图片 15' },
    { id: 16, src: 'https://picsum.photos/180/230?random=16', alt: '示例图片 16' }
  ];

  const imageList = images.length > 0 ? images : defaultImages;

  // 将图片分组为列
  const createImageColumns = (imageArray) => {
    const columns = [];
    for (let i = 0; i < imageArray.length; i += 2) {
      columns.push(imageArray.slice(i, i + 2));
    }
    return columns;
  };

  const imageColumns = createImageColumns(imageList);
  // 复制一份用于无缝循环
  const duplicatedColumns = [...imageColumns, ...imageColumns];

  // 处理鼠标悬停
  const handleMouseEnter = () => {
    if (pauseOnHover) {
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) {
      setIsPaused(false);
    }
  };

  // 控制动画速度
  const changeSpeed = (newSpeed) => {
    setAnimationSpeed(newSpeed);
  };

  // 暂停/继续动画
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const containerStyle = {
    position: 'relative',
    height: `${height}px`,
    overflow: 'hidden',
    background: '#fff'
  };

  const wrapperStyle = {
    display: 'flex',
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    animation: `scrollLeft ${animationSpeed}s linear infinite`,
    animationPlayState: isPaused ? 'paused' : 'running'
  };

  const columnStyle = {
    width: `${columnWidth}px`,
    height: `${height}px`,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    marginRight: `${gap}px`
  };

  const imageItemStyle = {
    width: `${columnWidth}px`,
    height: `${height / 2}px`,
    padding: '4px'
  };

  const imageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '8px',
    transition: 'transform 0.3s ease'
  };

  // CSS动画定义
  const keyframes = `
    @keyframes scrollLeft {
      0% {
        transform: translateX(0);
      }
      100% {
        transform: translateX(-50%);
      }
    }
  `;

  return (
    <div className={className}>
      {/* 注入CSS动画 */}
      <style>{keyframes}</style>
      
      {/* 图片流动容器 */}
      <div 
        style={containerStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div ref={wrapperRef} style={wrapperStyle}>
          {duplicatedColumns.map((column, columnIndex) => (
            <div key={columnIndex} style={columnStyle}>
              {column.map((image, imageIndex) => (
                <div key={`${columnIndex}-${imageIndex}`} style={imageItemStyle}>
                  <img 
                    src={image.src} 
                    alt={image.alt || `图片 ${image.id}`}
                    style={imageStyle}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* 控制按钮（可选） */}
      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <button 
          onClick={togglePause}
          style={{
            background: '#667eea',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            margin: '0 10px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {isPaused ? '继续' : '暂停'}
        </button>
        <button 
          onClick={() => changeSpeed(120)}
          style={{
            background: '#667eea',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            margin: '0 10px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          慢速
        </button>
        <button 
          onClick={() => changeSpeed(60)}
          style={{
            background: '#667eea',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            margin: '0 10px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          正常
        </button>
        <button 
          onClick={() => changeSpeed(30)}
          style={{
            background: '#667eea',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            margin: '0 10px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          快速
        </button>
      </div>
    </div>
  );
};

export default ImageFlow;

/**
 * 使用示例：
 * 
 * import ImageFlow from './ImageFlow';
 * 
 * // 基本使用
 * <ImageFlow />
 * 
 * // 自定义图片
 * const myImages = [
 *   { id: 1, src: '/path/to/image1.jpg', alt: '图片1' },
 *   { id: 2, src: '/path/to/image2.jpg', alt: '图片2' },
 *   // ... 更多图片
 * ];
 * 
 * <ImageFlow 
 *   images={myImages}
 *   speed={90}
 *   height={400}
 *   columnWidth={200}
 *   gap={15}
 *   pauseOnHover={true}
 *   className="my-custom-class"
 * />
 */