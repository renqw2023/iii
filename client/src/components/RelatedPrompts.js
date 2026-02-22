import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { promptAPI } from '../services/promptApi';
// import PromptCard from './PromptCard'; // 未使用的导入
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

// 获取分类图标的辅助函数
const getCategoryIcon = (category) => {
  switch (category) {
    case 'character': return '👤';
    case 'landscape': return '🏞️';
    case 'architecture': return '🏛️';
    case 'abstract': return '🎨';
    case 'fantasy': return '🧙‍♂️';
    case 'scifi': return '🚀';
    case 'portrait': return '📸';
    case 'animal': return '🐾';
    case 'object': return '📦';
    case 'style': return '✨';
    default: return '📝';
  }
};

const RelatedPrompts = ({ promptId, category, tags = [], limit = 6 }) => {
  const { t } = useTranslation();
  const [relatedPrompts, setRelatedPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 使用 useMemo 来稳定 tags 数组的引用，避免无限循环
  const stableTags = useMemo(() => tags, [tags]);

  useEffect(() => {
    const fetchRelatedPrompts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await promptAPI.getRelatedPrompts(promptId, {
          limit,
          category,
          tags: stableTags
        });
        
        setRelatedPrompts(response.data.prompts || []);
      } catch (err) {
        console.error('获取相关提示词失败:', err);
        setError('获取相关提示词失败');
      } finally {
        setLoading(false);
      }
    };

    if (promptId) {
      fetchRelatedPrompts();
    }
  }, [promptId, category, stableTags, limit]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          {t('promptDetail.relatedPrompts')}
        </h3>
        <LoadingSpinner className="py-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          {t('promptDetail.relatedPrompts')}
        </h3>
        <ErrorMessage 
          message={error} 
          onRetry={() => window.location.reload()}
          variant="card"
        />
      </div>
    );
  }

  if (!relatedPrompts.length) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              相关提示词
            </h3>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🎨</div>
          <p className="text-slate-500 mb-2">暂无相关风格参考</p>
          <p className="text-sm text-slate-400">当有相似风格的作品时，会在这里为您推荐</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center mb-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900">
            相关提示词
          </h3>
        </div>
        <div className="ml-auto text-sm text-slate-500">
          {relatedPrompts.length} 个相关作品
        </div>
      </div>
      
      {/* 风格参考竖排布局 */}
      <div className="space-y-3">
        {relatedPrompts.map((prompt, index) => (
          <div key={prompt._id} className="group relative flex bg-white rounded-lg border border-slate-200 hover:border-blue-300 transition-all duration-200 p-3">
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
              {prompt.media && prompt.media.length > 0 ? (
                <img
                  src={prompt.media[0].thumbnail || prompt.media[0].url}
                  alt={prompt.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                  <div className="text-center">
                    <div className="text-2xl mb-1">{getCategoryIcon(prompt.category)}</div>
                    <div className="text-xs text-slate-500 font-medium">{prompt.category}</div>
                  </div>
                </div>
              )}
              
              {/* 序号标签 */}
              <div className="absolute top-1 left-1 w-5 h-5 bg-white bg-opacity-90 rounded-full flex items-center justify-center text-xs font-bold text-slate-700">
                {index + 1}
              </div>
            </div>
            
            {/* 右侧内容区域 */}
            <div className="flex-1 ml-3 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-medium text-slate-900 line-clamp-2 mb-1">
                  {prompt.title}
                </h4>
                <div className="flex items-center text-xs text-slate-500 mb-2">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 rounded-full bg-slate-300"></div>
                    <span className="truncate max-w-20">{prompt.author.username}</span>
                  </div>
                  {prompt.difficulty && (
                    <div className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                      prompt.difficulty === 'beginner' ? 'bg-green-100 text-green-700' :
                      prompt.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {prompt.difficulty === 'beginner' ? '初级' :
                       prompt.difficulty === 'intermediate' ? '中级' : '高级'}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-xs text-slate-500">
                  <span className="flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    {prompt.likesCount || 0}
                  </span>
                </div>
                <button 
                  onClick={() => window.open(`/prompt/${prompt._id}`, '_blank')}
                  className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                >
                  查看详情
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* 底部提示 */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-center text-sm text-slate-500">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          点击任意作品可查看详细提示词，借鉴其创作风格和技巧
        </div>
      </div>
    </div>
  );
};

export default RelatedPrompts;