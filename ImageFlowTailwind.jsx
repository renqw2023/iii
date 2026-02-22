import React, { useState, useRef } from 'react';

/**
 * 图片横向流动组件 - Tailwind CSS版本
 * 类似 midjourneysref.com 的图片展示效果
 */
const ImageFlowTailwind = ({ 
  images = [], 
  speed = 'normal', // 'slow', 'normal', 'fast'
  height = 'h-[460px]',
  pauseOnHover = true,
  className = ''
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(speed);
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
    setCurrentSpeed(newSpeed);
  };

  // 暂停/继续动画
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // 获取动画速度类名
  const getSpeedClass = () => {
    const speedMap = {
      slow: 'animate-scroll-slow',
      normal: 'animate-scroll-normal', 
      fast: 'animate-scroll-fast'
    };
    return speedMap[currentSpeed] || 'animate-scroll-normal';
  };

  // CSS动画定义
  const animations = `
    @keyframes scroll-left {
      0% {
        transform: translateX(0);
      }
      100% {
        transform: translateX(-50%);
      }
    }
    
    .animate-scroll-slow {
      animation: scroll-left 120s linear infinite;
    }
    
    .animate-scroll-normal {
      animation: scroll-left 60s linear infinite;
    }
    
    .animate-scroll-fast {
      animation: scroll-left 30s linear infinite;
    }
    
    .animate-paused {
      animation-play-state: paused;
    }
  `;

  return (
    <div className={className}>
      {/* 注入CSS动画 */}
      <style>{animations}</style>
      
      {/* 图片流动容器 */}
      <div 
        className={`relative ${height} overflow-hidden bg-white`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div 
          ref={wrapperRef} 
          className={`
            flex absolute top-0 left-0 h-full
            ${getSpeedClass()}
            ${isPaused ? 'animate-paused' : ''}
          `}
        >
          {duplicatedColumns.map((column, columnIndex) => (
            <div 
              key={columnIndex} 
              className="w-[180px] h-full flex-shrink-0 flex flex-col mr-[10px]"
            >
              {column.map((image, imageIndex) => (
                <div 
                  key={`${columnIndex}-${imageIndex}`} 
                  className="w-[180px] h-[230px] p-1"
                >
                  <img 
                    src={image.src} 
                    alt={image.alt || `图片 ${image.id}`}
                    className="w-full h-full object-cover rounded-lg transition-transform duration-300 hover:scale-105"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* 控制按钮（可选） */}
      <div className="text-center my-5">
        <button 
          onClick={togglePause}
          className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 mx-2 rounded-md text-base transition-colors duration-200"
        >
          {isPaused ? '继续' : '暂停'}
        </button>
        <button 
          onClick={() => changeSpeed('slow')}
          className={`px-5 py-2 mx-2 rounded-md text-base transition-colors duration-200 ${
            currentSpeed === 'slow' 
              ? 'bg-blue-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          慢速
        </button>
        <button 
          onClick={() => changeSpeed('normal')}
          className={`px-5 py-2 mx-2 rounded-md text-base transition-colors duration-200 ${
            currentSpeed === 'normal' 
              ? 'bg-blue-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          正常
        </button>
        <button 
          onClick={() => changeSpeed('fast')}
          className={`px-5 py-2 mx-2 rounded-md text-base transition-colors duration-200 ${
            currentSpeed === 'fast' 
              ? 'bg-blue-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          快速
        </button>
      </div>
    </div>
  );
};

export default ImageFlowTailwind;

/**
 * 使用示例：
 * 
 * import ImageFlowTailwind from './ImageFlowTailwind';
 * 
 * // 基本使用
 * <ImageFlowTailwind />
 * 
 * // 自定义配置
 * const myImages = [
 *   { id: 1, src: '/path/to/image1.jpg', alt: '图片1' },
 *   { id: 2, src: '/path/to/image2.jpg', alt: '图片2' },
 *   // ... 更多图片
 * ];
 * 
 * <ImageFlowTailwind 
 *   images={myImages}
 *   speed="slow"
 *   height="h-96"
 *   pauseOnHover={true}
 *   className="my-4 shadow-lg"
 * />
 * 
 * 注意：如果您的项目中没有配置相应的 Tailwind 类，
 * 可能需要在 tailwind.config.js 中添加自定义配置：
 * 
 * module.exports = {
 *   theme: {
 *     extend: {
 *       height: {
 *         '460': '460px',
 *       },
 *       width: {
 *         '180': '180px',
 *       },
 *       spacing: {
 *         '230': '230px',
 *       }
 *     }
 *   }
 * }
 */