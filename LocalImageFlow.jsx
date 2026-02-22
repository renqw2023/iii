import React, { useState, useRef } from 'react';

/**
 * 本地图片流动组件
 * 使用 ImageFlow 文件夹中的图片素材
 */
const LocalImageFlow = ({ 
  speed = 'slow', // 'slow', 'normal', 'fast'
  height = 'h-[460px]',
  pauseOnHover = true,
  className = ''
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(speed);
  const wrapperRef = useRef(null);

  // 使用 ImageFlow 文件夹中的图片（根据实际文件名）
  const localImages = [
    // 01 系列 (4张)
    { id: 1, src: '/ImageFlow/01 (1).webp', alt: '艺术图片 1' },
    { id: 2, src: '/ImageFlow/01 (2).webp', alt: '艺术图片 2' },
    { id: 3, src: '/ImageFlow/01 (3).webp', alt: '艺术图片 3' },
    { id: 4, src: '/ImageFlow/01 (4).webp', alt: '艺术图片 4' },
    
    // 02 系列 (4张)
    { id: 5, src: '/ImageFlow/02 (1).webp', alt: '艺术图片 5' },
    { id: 6, src: '/ImageFlow/02 (2).webp', alt: '艺术图片 6' },
    { id: 7, src: '/ImageFlow/02 (3).webp', alt: '艺术图片 7' },
    { id: 8, src: '/ImageFlow/02 (4).webp', alt: '艺术图片 8' },
    
    // 单张图片
    { id: 9, src: '/ImageFlow/03.webp', alt: '艺术图片 9' },
    { id: 10, src: '/ImageFlow/04.webp', alt: '艺术图片 10' },
    { id: 11, src: '/ImageFlow/05.webp', alt: '艺术图片 11' },
    { id: 12, src: '/ImageFlow/06.webp', alt: '艺术图片 12' },
    { id: 13, src: '/ImageFlow/08.webp', alt: '艺术图片 13' },
    { id: 14, src: '/ImageFlow/09.webp', alt: '艺术图片 14' },
    { id: 15, src: '/ImageFlow/10.webp', alt: '艺术图片 15' },
    { id: 16, src: '/ImageFlow/12.webp', alt: '艺术图片 16' },
    { id: 17, src: '/ImageFlow/13.webp', alt: '艺术图片 17' },
    { id: 18, src: '/ImageFlow/15.webp', alt: '艺术图片 18' },
    { id: 19, src: '/ImageFlow/18.webp', alt: '艺术图片 19' },
    { id: 20, src: '/ImageFlow/23.webp', alt: '艺术图片 20' },
    { id: 21, src: '/ImageFlow/24.webp', alt: '艺术图片 21' },
    { id: 22, src: '/ImageFlow/25.webp', alt: '艺术图片 22' },
    { id: 23, src: '/ImageFlow/27.webp', alt: '艺术图片 23' },
    { id: 24, src: '/ImageFlow/28.webp', alt: '艺术图片 24' },
    { id: 25, src: '/ImageFlow/29.webp', alt: '艺术图片 25' },
    { id: 26, src: '/ImageFlow/30.webp', alt: '艺术图片 26' },
    { id: 27, src: '/ImageFlow/32.webp', alt: '艺术图片 27' },
    { id: 28, src: '/ImageFlow/33.webp', alt: '艺术图片 28' },
    { id: 29, src: '/ImageFlow/34.webp', alt: '艺术图片 29' },
    { id: 30, src: '/ImageFlow/35.webp', alt: '艺术图片 30' },
    { id: 31, src: '/ImageFlow/39.webp', alt: '艺术图片 31' },
    { id: 32, src: '/ImageFlow/49.webp', alt: '艺术图片 32' },
    { id: 33, src: '/ImageFlow/52.webp', alt: '艺术图片 33' },
    { id: 34, src: '/ImageFlow/54.webp', alt: '艺术图片 34' },
    { id: 35, src: '/ImageFlow/55.webp', alt: '艺术图片 35' },
    { id: 36, src: '/ImageFlow/56.webp', alt: '艺术图片 36' },
    { id: 37, src: '/ImageFlow/57.webp', alt: '艺术图片 37' },
    
    // 07 系列 (3张)
    { id: 38, src: '/ImageFlow/07 (1).webp', alt: '艺术图片 38' },
    { id: 39, src: '/ImageFlow/07 (2).webp', alt: '艺术图片 39' },
    { id: 40, src: '/ImageFlow/07 (3).webp', alt: '艺术图片 40' },
    
    // 11 系列 (2张)
    { id: 41, src: '/ImageFlow/11 (1).webp', alt: '艺术图片 41' },
    { id: 42, src: '/ImageFlow/11 (2).webp', alt: '艺术图片 42' },
    
    // 16 系列 (2张)
    { id: 43, src: '/ImageFlow/16 (1).webp', alt: '艺术图片 43' },
    { id: 44, src: '/ImageFlow/16 (2).webp', alt: '艺术图片 44' },
    
    // 17 系列 (4张)
    { id: 45, src: '/ImageFlow/17 (1).webp', alt: '艺术图片 45' },
    { id: 46, src: '/ImageFlow/17 (2).webp', alt: '艺术图片 46' },
    { id: 47, src: '/ImageFlow/17 (3).webp', alt: '艺术图片 47' },
    { id: 48, src: '/ImageFlow/17 (4).webp', alt: '艺术图片 48' },
    
    // 19 系列 (2张)
    { id: 49, src: '/ImageFlow/19 (1).webp', alt: '艺术图片 49' },
    { id: 50, src: '/ImageFlow/19 (2).webp', alt: '艺术图片 50' },
    
    // 20 系列 (3张)
    { id: 51, src: '/ImageFlow/20 (1).webp', alt: '艺术图片 51' },
    { id: 52, src: '/ImageFlow/20 (2).webp', alt: '艺术图片 52' },
    { id: 53, src: '/ImageFlow/20 (3).webp', alt: '艺术图片 53' },
    
    // 21 系列 (2张)
    { id: 54, src: '/ImageFlow/21 (1).webp', alt: '艺术图片 54' },
    { id: 55, src: '/ImageFlow/21 (2).webp', alt: '艺术图片 55' },
    
    // 22 系列 (2张)
    { id: 56, src: '/ImageFlow/22 (1).webp', alt: '艺术图片 56' },
    { id: 57, src: '/ImageFlow/22 (2).webp', alt: '艺术图片 57' },
    
    // 26 系列 (2张)
    { id: 58, src: '/ImageFlow/26 (1).webp', alt: '艺术图片 58' },
    { id: 59, src: '/ImageFlow/26 (2).webp', alt: '艺术图片 59' },
    
    // 31 系列 (4张)
    { id: 60, src: '/ImageFlow/31 (1).webp', alt: '艺术图片 60' },
    { id: 61, src: '/ImageFlow/31 (2).webp', alt: '艺术图片 61' },
    { id: 62, src: '/ImageFlow/31 (3).webp', alt: '艺术图片 62' },
    { id: 63, src: '/ImageFlow/31 (4).webp', alt: '艺术图片 63' },
    
    // 36 系列 (2张)
    { id: 64, src: '/ImageFlow/36 (1).webp', alt: '艺术图片 64' },
    { id: 65, src: '/ImageFlow/36 (2).webp', alt: '艺术图片 65' },
    
    // 37 系列 (2张)
    { id: 66, src: '/ImageFlow/37 (1).webp', alt: '艺术图片 66' },
    { id: 67, src: '/ImageFlow/37 (2).webp', alt: '艺术图片 67' },
    
    // 38 系列 (2张)
    { id: 68, src: '/ImageFlow/38 (1).webp', alt: '艺术图片 68' },
    { id: 69, src: '/ImageFlow/38 (2).webp', alt: '艺术图片 69' },
    
    // 40 系列 (3张)
    { id: 70, src: '/ImageFlow/40 (1).webp', alt: '艺术图片 70' },
    { id: 71, src: '/ImageFlow/40 (2).webp', alt: '艺术图片 71' },
    { id: 72, src: '/ImageFlow/40 (3).webp', alt: '艺术图片 72' },
    
    // 41 系列 (2张)
    { id: 73, src: '/ImageFlow/41 (1).webp', alt: '艺术图片 73' },
    { id: 74, src: '/ImageFlow/41 (2).webp', alt: '艺术图片 74' },
    
    // 42 系列 (4张)
    { id: 75, src: '/ImageFlow/42 (1).webp', alt: '艺术图片 75' },
    { id: 76, src: '/ImageFlow/42 (2).webp', alt: '艺术图片 76' },
    { id: 77, src: '/ImageFlow/42 (3).webp', alt: '艺术图片 77' },
    { id: 78, src: '/ImageFlow/42 (4).webp', alt: '艺术图片 78' },
    
    // 43 系列 (3张)
    { id: 79, src: '/ImageFlow/43 (1).webp', alt: '艺术图片 79' },
    { id: 80, src: '/ImageFlow/43 (2).webp', alt: '艺术图片 80' },
    { id: 81, src: '/ImageFlow/43 (3).webp', alt: '艺术图片 81' },
    
    // 44 系列 (4张)
    { id: 82, src: '/ImageFlow/44 (1).webp', alt: '艺术图片 82' },
    { id: 83, src: '/ImageFlow/44 (2).webp', alt: '艺术图片 83' },
    { id: 84, src: '/ImageFlow/44 (3).webp', alt: '艺术图片 84' },
    { id: 85, src: '/ImageFlow/44 (4).webp', alt: '艺术图片 85' },
    
    // 45 系列 (4张)
    { id: 86, src: '/ImageFlow/45 (1).webp', alt: '艺术图片 86' },
    { id: 87, src: '/ImageFlow/45 (2).webp', alt: '艺术图片 87' },
    { id: 88, src: '/ImageFlow/45 (3).webp', alt: '艺术图片 88' },
    { id: 89, src: '/ImageFlow/45 (4).webp', alt: '艺术图片 89' },
    
    // 46 系列 (4张)
    { id: 90, src: '/ImageFlow/46 (1).webp', alt: '艺术图片 90' },
    { id: 91, src: '/ImageFlow/46 (2).webp', alt: '艺术图片 91' },
    { id: 92, src: '/ImageFlow/46 (3).webp', alt: '艺术图片 92' },
    { id: 93, src: '/ImageFlow/46 (4).webp', alt: '艺术图片 93' },
    
    // 47 系列 (4张)
    { id: 94, src: '/ImageFlow/47 (1).webp', alt: '艺术图片 94' },
    { id: 95, src: '/ImageFlow/47 (2).webp', alt: '艺术图片 95' },
    { id: 96, src: '/ImageFlow/47 (3).webp', alt: '艺术图片 96' },
    { id: 97, src: '/ImageFlow/47 (4).webp', alt: '艺术图片 97' },
    
    // 48 系列 (3张)
    { id: 98, src: '/ImageFlow/48 (1).webp', alt: '艺术图片 98' },
    { id: 99, src: '/ImageFlow/48 (2).webp', alt: '艺术图片 99' },
    { id: 100, src: '/ImageFlow/48 (3).webp', alt: '艺术图片 100' }
  ];

  // 将图片分组为列（每列2张图片）
  const createImageColumns = (imageArray) => {
    const columns = [];
    for (let i = 0; i < imageArray.length; i += 2) {
      columns.push(imageArray.slice(i, i + 2));
    }
    return columns;
  };

  const imageColumns = createImageColumns(localImages);
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
      animation: scroll-left 180s linear infinite;
    }
    
    .animate-scroll-normal {
      animation: scroll-left 90s linear infinite;
    }
    
    .animate-scroll-fast {
      animation: scroll-left 45s linear infinite;
    }
    
    .animate-paused {
      animation-play-state: paused;
    }
  `;

  return (
    <div className={className}>
      {/* 注入CSS动画 */}
      <style>{animations}</style>
      
      {/* 标题区域 */}
      <div className="text-center py-8 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <h1 className="text-3xl font-bold mb-2">本地图片流动展示</h1>
        <p className="text-lg opacity-90">使用 ImageFlow 文件夹中的精美图片素材</p>
      </div>
      
      {/* 图片流动容器 */}
      <div 
        className={`relative ${height} overflow-hidden bg-white shadow-lg`}
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
              className="w-[180px] h-full flex-shrink-0 flex flex-col mr-[5px]"
            >
              {column.map((image, imageIndex) => (
                <div 
                  key={`${columnIndex}-${imageIndex}`} 
                  className="w-[180px] h-[230px] p-1"
                >
                  <img 
                    src={image.src} 
                    alt={image.alt}
                    className="w-full h-full object-cover rounded-lg transition-transform duration-300 hover:scale-105 shadow-md"
                    loading="lazy"
                    onError={(e) => {
                      // 图片加载失败时的处理
                      e.target.style.display = 'none';
                      console.warn(`图片加载失败: ${image.src}`);
                    }}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* 控制按钮 */}
      <div className="text-center my-6 bg-gray-50 py-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">动画控制</h3>
        </div>
        
        <div className="flex justify-center flex-wrap gap-3">
          <button 
            onClick={togglePause}
            className={`px-6 py-2 rounded-md text-base font-medium transition-all duration-200 ${
              isPaused 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {isPaused ? '▶️ 继续' : '⏸️ 暂停'}
          </button>
          
          <div className="flex gap-2">
            <button 
              onClick={() => changeSpeed('slow')}
              className={`px-4 py-2 rounded-md text-base transition-all duration-200 ${
                currentSpeed === 'slow' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              🐌 慢速
            </button>
            <button 
              onClick={() => changeSpeed('normal')}
              className={`px-4 py-2 rounded-md text-base transition-all duration-200 ${
                currentSpeed === 'normal' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              🚶 正常
            </button>
            <button 
              onClick={() => changeSpeed('fast')}
              className={`px-4 py-2 rounded-md text-base transition-all duration-200 ${
                currentSpeed === 'fast' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              🏃 快速
            </button>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>💡 提示：鼠标悬停在图片区域可暂停滚动</p>
          <p>📁 图片来源：ImageFlow 文件夹（{localImages.length} 张图片）</p>
        </div>
      </div>
    </div>
  );
};

export default LocalImageFlow;

/**
 * 使用示例：
 * 
 * import LocalImageFlow from './LocalImageFlow';
 * 
 * function App() {
 *   return (
 *     <div>
 *       {/* 基本使用 */}
 *       <LocalImageFlow />
 *       
 *       {/* 自定义配置 */}
 *       <LocalImageFlow 
 *         speed="slow"
 *         height="h-96"
 *         pauseOnHover={true}
 *         className="my-8"
 *       />
 *     </div>
 *   );
 * }
 * 
 * 注意事项：
 * 1. 确保 ImageFlow 文件夹位于 public 目录下
 * 2. 图片路径以 /ImageFlow/ 开头
 * 3. 支持 WebP 和 JPG 格式
 * 4. 包含错误处理，加载失败的图片会被隐藏
 * 5. 使用懒加载优化性能
 */