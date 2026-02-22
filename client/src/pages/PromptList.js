import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Plus, 
  TrendingUp, 
  Star, 
  Clock, 
  Heart, 
  Copy, 
  Tag,
  ChevronDown,
  X,
  Lightbulb,
  Sparkles
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { promptAPI } from '../services/promptApi';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import PromptCard from '../components/PromptCard';
import Pagination from '../components/UI/Pagination';
// import UserAvatar from '../components/UserAvatar';

const PromptList = () => {
  const { t: _t } = useTranslation(); // 重命名未使用的变量
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [prompts, setPrompts] = useState([]);
  const [featuredPrompts, setFeaturedPrompts] = useState([]);
  const [popularTags, setPopularTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 12
  });

  // 筛选状态
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    difficulty: searchParams.get('difficulty') || '',
    sortBy: searchParams.get('sortBy') || 'latest',
    tags: searchParams.get('tags') || ''
  });

  const fetchPrompts = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        ...filters
      };
      
      const response = await promptAPI.getPrompts(params);
      const { prompts: promptsData, pagination: paginationData } = response.data;
      
      setPrompts(promptsData);
      setPagination({
        currentPage: paginationData.current,
        totalPages: paginationData.pages,
        totalItems: paginationData.total,
        limit: pagination.limit
      });
    } catch (error) {
      console.error('Failed to fetch prompts:', error);
      setError(error.response?.data?.message || '获取提示词列表失败');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, filters]);

  const fetchFeaturedPrompts = useCallback(async () => {
    try {
      const response = await promptAPI.getFeaturedPrompts(6);
      setFeaturedPrompts(response.data.prompts);
    } catch (error) {
      console.error('Failed to fetch featured prompts:', error);
    }
  }, []);

  const fetchPopularTags = useCallback(async () => {
    try {
      const response = await promptAPI.getPopularTags(20);
      setPopularTags(response.data.tags);
    } catch (error) {
      console.error('Failed to fetch popular tags:', error);
    }
  }, []);

  useEffect(() => {
    fetchPrompts();
    fetchFeaturedPrompts();
    fetchPopularTags();
  }, [searchParams, fetchPrompts, fetchFeaturedPrompts, fetchPopularTags]);

  useEffect(() => {
    // 更新URL参数
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
  }, [filters, setSearchParams]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPrompts(1);
  };

  const handlePageChange = (page) => {
    fetchPrompts(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      difficulty: '',
      sortBy: 'latest',
      tags: ''
    });
  };

  const handleTagClick = (tag) => {
    setFilters(prev => ({ ...prev, tags: tag }));
  };

  // const getDifficultyColor = (difficulty) => {
  //   switch (difficulty) {
  //     case 'beginner': return 'bg-green-100 text-green-800';
  //     case 'intermediate': return 'bg-yellow-100 text-yellow-800';
  //     case 'advanced': return 'bg-red-100 text-red-800';
  //     default: return 'bg-gray-100 text-gray-800';
  //   }
  // };

  // const getCategoryIcon = (category) => {
  //   switch (category) {
  //     case 'character': return '👤';
  //     case 'landscape': return '🏞️';
  //     case 'architecture': return '🏛️';
  //     case 'abstract': return '🎨';
  //     case 'fantasy': return '🧙‍♂️';
  //     case 'scifi': return '🚀';
  //     case 'portrait': return '📸';
  //     case 'animal': return '🐾';
  //     case 'object': return '📦';
  //     case 'style': return '✨';
  //     default: return '📝';
  //   }
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* 页面头部 */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Lightbulb className="w-8 h-8 text-primary-500 mr-2" />
              <h1 className="text-3xl font-bold text-slate-900">Midjourney 提示词库</h1>
            </div>
            <p className="text-slate-600 max-w-2xl mx-auto">
              发现和分享优质的 Midjourney 提示词，让 AI 创作更加精彩
            </p>
          </div>

          {/* 搜索和筛选 */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="搜索提示词..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </form>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Filter className="w-4 h-4 mr-2" />
                筛选
                <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>

              <div className="flex items-center border border-slate-300 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'text-slate-600 hover:bg-slate-100'} transition-colors`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-slate-600 hover:bg-slate-100'} transition-colors`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {user && (
                <Link
                  to="/create-prompt"
                  className="btn btn-primary flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  创建提示词
                </Link>
              )}
            </div>
          </div>

          {/* 筛选面板 */}
          {showFilters && (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">分类</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">所有分类</option>
                    <option value="character">👤 人物角色</option>
                    <option value="landscape">🏞️ 风景景观</option>
                    <option value="architecture">🏛️ 建筑设计</option>
                    <option value="abstract">🎨 抽象艺术</option>
                    <option value="fantasy">🧙‍♂️ 奇幻魔法</option>
                    <option value="scifi">🚀 科幻未来</option>
                    <option value="portrait">📸 肖像写真</option>
                    <option value="animal">🐾 动物生物</option>
                    <option value="object">📦 物品静物</option>
                    <option value="style">✨ 风格技法</option>
                    <option value="other">📝 其他</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">难度</label>
                  <select
                    value={filters.difficulty}
                    onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">所有难度</option>
                    <option value="beginner">初级</option>
                    <option value="intermediate">中级</option>
                    <option value="advanced">高级</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">排序</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="latest">最新发布</option>
                    <option value="popular">最受欢迎</option>
                    <option value="mostLiked">最多点赞</option>
                    <option value="mostCopied">最多复制</option>
                    <option value="trending">热门趋势</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <X className="w-4 h-4 mr-2" />
                    清除筛选
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 主要内容 */}
          <div className="lg:col-span-3">
            {/* 精选提示词 */}
            {featuredPrompts.length > 0 && !filters.search && !filters.category && !filters.difficulty && filters.sortBy === 'latest' && (
              <div className="mb-8">
                <div className="flex items-center mb-4">
                  <Star className="w-5 h-5 text-yellow-500 mr-2" />
                  <h2 className="text-xl font-semibold text-slate-900">精选提示词</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featuredPrompts.map((prompt) => (
                    <div key={prompt._id} className="relative">
                      <PromptCard prompt={prompt} compact />
                      <div className="absolute top-2 right-2">
                        <div className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                          <Star className="w-3 h-3 mr-1" />
                          精选
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 提示词列表 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2" />
                  {filters.search ? `搜索结果: "${filters.search}"` : '所有提示词'}
                </h2>
                
                {pagination.totalItems > 0 && (
                  <p className="text-sm text-slate-600">
                    共 {pagination.totalItems} 个提示词
                  </p>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <LoadingSpinner size="large" />
                </div>
              ) : error ? (
                <ErrorMessage message={error} />
              ) : prompts.length === 0 ? (
                <div className="text-center py-12">
                  <Lightbulb className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">暂无提示词</h3>
                  <p className="text-slate-600 mb-4">没有找到符合条件的提示词</p>
                  {user && (
                    <Link to="/create-prompt" className="btn btn-primary">
                      创建第一个提示词
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  <div className={viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                    : 'space-y-4'
                  }>
                    {prompts.map((prompt) => (
                      <PromptCard 
                        key={prompt._id} 
                        prompt={prompt} 
                        viewMode={viewMode}
                      />
                    ))}
                  </div>

                  {/* 分页 */}
                  {pagination.totalPages > 1 && (
                    <div className="mt-8">
                      <Pagination
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        totalItems={pagination.totalItems}
                        itemsPerPage={pagination.limit}
                        onPageChange={handlePageChange}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 侧边栏 */}
          <div className="space-y-6">
            {/* 热门标签 */}
            {popularTags.length > 0 && (
              <div className="card p-6">
                <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
                  <Tag className="w-5 h-5 mr-2" />
                  热门标签
                </h3>
                
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <button
                      key={tag.tag}
                      onClick={() => handleTagClick(tag.tag)}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm transition-colors ${
                        filters.tags === tag.tag
                          ? 'bg-primary-500 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      #{tag.tag}
                      <span className="ml-1 text-xs opacity-75">({tag.count})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 快速筛选 */}
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center">
                <Filter className="w-5 h-5 mr-2" />
                快速筛选
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, sortBy: 'trending' }))}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center ${
                    filters.sortBy === 'trending'
                      ? 'bg-primary-100 text-primary-700'
                      : 'hover:bg-slate-100'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  热门趋势
                </button>
                
                <button
                  onClick={() => setFilters(prev => ({ ...prev, sortBy: 'mostLiked' }))}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center ${
                    filters.sortBy === 'mostLiked'
                      ? 'bg-primary-100 text-primary-700'
                      : 'hover:bg-slate-100'
                  }`}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  最多点赞
                </button>
                
                <button
                  onClick={() => setFilters(prev => ({ ...prev, sortBy: 'mostCopied' }))}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center ${
                    filters.sortBy === 'mostCopied'
                      ? 'bg-primary-100 text-primary-700'
                      : 'hover:bg-slate-100'
                  }`}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  最多复制
                </button>
                
                <button
                  onClick={() => setFilters(prev => ({ ...prev, sortBy: 'latest' }))}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center ${
                    filters.sortBy === 'latest'
                      ? 'bg-primary-100 text-primary-700'
                      : 'hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  最新发布
                </button>
              </div>
            </div>

            {/* 分类快速选择 */}
            <div className="card p-6">
              <h3 className="font-semibold text-slate-900 mb-4">分类浏览</h3>
              
              <div className="space-y-2">
                {[
                  { key: 'character', name: '人物角色', icon: '👤' },
                  { key: 'landscape', name: '风景景观', icon: '🏞️' },
                  { key: 'architecture', name: '建筑设计', icon: '🏛️' },
                  { key: 'abstract', name: '抽象艺术', icon: '🎨' },
                  { key: 'fantasy', name: '奇幻魔法', icon: '🧙‍♂️' },
                  { key: 'scifi', name: '科幻未来', icon: '🚀' },
                  { key: 'portrait', name: '肖像写真', icon: '📸' },
                  { key: 'animal', name: '动物生物', icon: '🐾' },
                  { key: 'object', name: '物品静物', icon: '📦' },
                  { key: 'style', name: '风格技法', icon: '✨' },
                  { key: 'other', name: '其他', icon: '🔮' }
                ].map((category) => (
                  <button
                    key={category.key}
                    onClick={() => setFilters(prev => ({ ...prev, category: category.key }))}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center ${
                      filters.category === category.key
                        ? 'bg-primary-100 text-primary-700'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <span className="mr-2">{category.icon}</span>
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptList;