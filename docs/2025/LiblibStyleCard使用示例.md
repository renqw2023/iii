# LiblibStyleCard 使用示例

## 组件简介

`LiblibStyleCard` 是仿照 LiblibAI 网站设计的新卡片组件，具有以下特点：
- 图片占比90%，视觉冲击力强
- 覆盖层设计，信息层次清晰
- 现代化交互效果
- 响应式布局适配

## 基础使用

### 1. 导入组件

```jsx
import LiblibStyleCard from '../components/Post/LiblibStyleCard';
```

### 2. 基础用法

```jsx
// 单个卡片使用
<LiblibStyleCard post={post} />

// 网格布局使用
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
  {posts.map(post => (
    <LiblibStyleCard key={post._id} post={post} />
  ))}
</div>
```

## 在首页中集成

### 方案一：完全替换（推荐）

在 `Home.js` 中替换现有的 `PostCard`：

```jsx
// 1. 导入新组件
import LiblibStyleCard from '../components/Post/LiblibStyleCard';
// import PostCard from '../components/Post/PostCard'; // 注释掉旧组件

// 2. 在渲染部分替换
<motion.div
  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  {allPosts?.map((post, index) => {
    const shouldAnimate = index < 12;
    const delay = shouldAnimate ? Math.min(index * 0.05, 0.6) : 0;
    
    return (
      <motion.div
        key={`${post.contentType}-${post._id}`}
        initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay }}
      >
        {post.contentType === 'prompt' ? (
          <PromptCard prompt={post} />
        ) : (
          <LiblibStyleCard post={post} /> {/* 使用新组件 */}
        )}
      </motion.div>
    );
  })}
</motion.div>
```

### 方案二：配置开关（渐进式）

添加配置开关，支持两种卡片样式切换：

```jsx
// 1. 添加状态控制
const [useLiblibStyle, setUseLiblibStyle] = useState(true);

// 2. 条件渲染
{post.contentType === 'prompt' ? (
  <PromptCard prompt={post} />
) : (
  useLiblibStyle ? (
    <LiblibStyleCard post={post} />
  ) : (
    <PostCard post={post} />
  )
)}

// 3. 添加切换按钮（可选）
<div className="mb-4 flex justify-end">
  <button
    onClick={() => setUseLiblibStyle(!useLiblibStyle)}
    className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
  >
    {useLiblibStyle ? '经典视图' : 'LiblibAI视图'}
  </button>
</div>
```

## 网格布局优化

### 响应式网格配置

```jsx
// 推荐的响应式网格类名
const gridClasses = [
  'grid',
  'grid-cols-2',      // 手机：2列
  'sm:grid-cols-2',   // 小屏：2列
  'md:grid-cols-3',   // 中屏：3列
  'lg:grid-cols-4',   // 大屏：4列
  'xl:grid-cols-5',   // 超大屏：5列
  '2xl:grid-cols-6',  // 超超大屏：6列
  'gap-4',            // 间距
  'p-4'               // 内边距
].join(' ');

<div className={gridClasses}>
  {posts.map(post => <LiblibStyleCard key={post._id} post={post} />)}
</div>
```

### 自定义CSS网格（高级）

```css
/* 在全局CSS或组件CSS中添加 */
.liblib-cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding: 20px;
}

@media (max-width: 768px) {
  .liblib-cards-container {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
    padding: 12px;
  }
}
```

## 性能优化建议

### 1. 虚拟滚动（大量数据）

```jsx
import { FixedSizeGrid as Grid } from 'react-window';

const VirtualizedLiblibCards = ({ posts }) => {
  const Cell = ({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * 4 + columnIndex; // 假设4列
    const post = posts[index];
    
    if (!post) return <div style={style} />;
    
    return (
      <div style={style}>
        <div className="p-2">
          <LiblibStyleCard post={post} />
        </div>
      </div>
    );
  };
  
  return (
    <Grid
      columnCount={4}
      columnWidth={300}
      height={600}
      rowCount={Math.ceil(posts.length / 4)}
      rowHeight={430}
      width={1200}
    >
      {Cell}
    </Grid>
  );
};
```

### 2. 图片懒加载优化

```jsx
// 在LiblibStyleCard中已经使用了loading="lazy"
// 可以进一步优化为Intersection Observer

import { useInView } from 'react-intersection-observer';

const OptimizedLiblibStyleCard = ({ post }) => {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });
  
  return (
    <div ref={ref}>
      {inView ? (
        <LiblibStyleCard post={post} />
      ) : (
        <div className="w-full h-[410px] bg-slate-200 animate-pulse rounded-xl" />
      )}
    </div>
  );
};
```

## 自定义配置

### 1. 主题配置

```jsx
// 创建主题配置文件
const liblibTheme = {
  cardHeight: '410px',
  imageHeight: '356px',
  contentHeight: '54px',
  borderRadius: '12px',
  hoverScale: 1.1,
  animationDuration: '0.5s'
};

// 在组件中使用
<LiblibStyleCard 
  post={post} 
  theme={liblibTheme}
/>
```

### 2. 功能配置

```jsx
// 功能开关配置
const cardConfig = {
  showLikes: true,
  showViews: true,
  showComments: true,
  showShare: true,
  showStyleTag: true,
  enableHover: true,
  enableAnimation: true
};

<LiblibStyleCard 
  post={post} 
  config={cardConfig}
/>
```

## 完整集成示例

```jsx
// Home.js 完整示例
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useInfiniteQuery } from 'react-query';
import { motion } from 'framer-motion';
import LiblibStyleCard from '../components/Post/LiblibStyleCard';
import PromptCard from '../components/PromptCard';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Home = () => {
  // ... 其他状态和逻辑
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero区域 */}
      <Hero />
      
      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">最新内容</h2>
          <p className="text-slate-600">发现最新的AI艺术作品和创意灵感</p>
        </div>

        {/* 卡片网格 */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {allPosts?.map((post, index) => {
                const shouldAnimate = index < 12;
                const delay = shouldAnimate ? Math.min(index * 0.05, 0.6) : 0;
                
                return (
                  <motion.div
                    key={`${post.contentType}-${post._id}`}
                    initial={shouldAnimate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay }}
                  >
                    {post.contentType === 'prompt' ? (
                      <PromptCard prompt={post} />
                    ) : (
                      <LiblibStyleCard post={post} />
                    )}
                  </motion.div>
                );
              })}
            </motion.div>

            {/* 加载更多 */}
            {hasNextPage && (
              <div ref={ref} className="flex justify-center mt-12">
                {isFetchingNextPage ? (
                  <div className="flex items-center gap-2 text-slate-600">
                    <LoadingSpinner size="sm" />
                    <span>加载更多内容...</span>
                  </div>
                ) : (
                  <div className="text-slate-400 text-sm">
                    向下滚动加载更多
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
```

## 注意事项

1. **图片优化**: 确保图片有合适的尺寸和格式，建议使用WebP格式
2. **性能监控**: 大量卡片时注意性能，考虑使用虚拟滚动
3. **无障碍访问**: 确保所有交互元素都有合适的aria标签
4. **移动端适配**: 在小屏幕上测试卡片的显示效果
5. **加载状态**: 为图片加载失败提供降级方案

## 后续优化建议

1. **A/B测试**: 对比新旧卡片的用户参与度
2. **用户反馈**: 收集用户对新设计的反馈
3. **性能分析**: 监控页面加载速度和交互性能
4. **功能扩展**: 根据用户需求添加更多交互功能