import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  Eye, 
  Heart, 
  Users, 
  FileText,
  BarChart3,
  Activity,
  Server,
  MapPin,
  MousePointer
} from 'lucide-react';
import { enhancedAdminAPI } from '../../services/enhancedApi';
import GeoAnalysisChart from './analytics/GeoAnalysisChart';
import BehaviorAnalysisChart from './analytics/BehaviorAnalysisChart';
import TrendAnalysisChart from './analytics/TrendAnalysisChart';
import ContentAnalysisChart from './analytics/ContentAnalysisChart';

const AdminStatsPanel = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalPrompts: 0,
    totalViews: 0,
    totalLikes: 0,
    totalPromptViews: 0,
    totalPromptLikes: 0,
    activeUsers: 0,
    newUsersToday: 0,
    newPostsToday: 0,
    newPromptsToday: 0,
    dailyViews: 0,
    weeklyStats: [],
    userGrowthData: [],
    postGrowthData: [],
    promptGrowthData: []
  });
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState('overview');
  const [error, setError] = useState(null);
  
  // 深度分析相关状态
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [activeAnalysisType] = useState('geo');
  const [timeRange, setTimeRange] = useState('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 获取深度分析数据
  const fetchAnalyticsData = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      const response = await enhancedAdminAPI.getAnalytics({
        type: activeAnalysisType,
        timeRange: timeRange
      });
      
      // response是axios响应对象，实际数据在response.data中
      if (response.data && response.data.success) {
        setAnalyticsData(response.data.data);
      } else {
        const errorMsg = response.data?.message || response.data?.error || '未知错误';
        console.error('获取分析数据失败:', errorMsg);
        console.error('完整响应:', response);
      }
    } catch (error) {
      console.error('获取分析数据时出错:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [activeAnalysisType, timeRange]);

  // 处理真实的周统计数据
  const processWeeklyStats = useCallback((chartsData) => {
    if (!chartsData) return [];
    
    const days = [
      t('admin.stats.days.monday'),
      t('admin.stats.days.tuesday'),
      t('admin.stats.days.wednesday'),
      t('admin.stats.days.thursday'),
      t('admin.stats.days.friday'),
      t('admin.stats.days.saturday'),
      t('admin.stats.days.sunday')
    ];
    
    // 获取最近7天的数据
    const dailyUsers = chartsData.dailyUsers || [];
    const dailyPosts = chartsData.dailyPosts || [];
    const dailyPrompts = chartsData.dailyPrompts || [];
    
    // 创建日期到数据的映射
    const userMap = {};
    const postMap = {};
    const promptMap = {};
    
    dailyUsers.forEach(item => {
      if (item.date) {
        userMap[item.date] = item.count || 0;
      }
    });
    
    dailyPosts.forEach(item => {
      if (item.date) {
        postMap[item.date] = item.count || 0;
      }
    });
    
    dailyPrompts.forEach(item => {
      if (item.date) {
        promptMap[item.date] = item.count || 0;
      }
    });
    
    // 生成最近7天的数据
    const result = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayIndex = date.getDay();
      const adjustedDayIndex = dayIndex === 0 ? 6 : dayIndex - 1; // 调整周日为6
      
      result.push({
        day: days[adjustedDayIndex],
        date: dateStr,
        users: userMap[dateStr] || 0,
        posts: postMap[dateStr] || 0,
        prompts: promptMap[dateStr] || 0
      });
    }
    
    return result;
  }, [t]);

  const fetchAdminStats = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await enhancedAdminAPI.getStats();
      
      // response是axios响应对象，实际数据在response.data中
      if (response.data && response.data.success && response.data.data) {
        const data = response.data.data;
        
        // 处理周统计数据
        const weeklyStats = processWeeklyStats(data.charts);
        
        setStats({
          totalUsers: data.totalUsers || 0,
          totalPosts: data.totalPosts || 0,
          totalPrompts: data.totalPrompts || 0,
          totalViews: data.totalViews || 0,
          totalLikes: data.totalLikes || 0,
          totalPromptViews: data.totalPromptViews || 0,
          totalPromptLikes: data.totalPromptLikes || 0,
          activeUsers: data.activeUsers || 0,
          newUsersToday: data.newUsersToday || 0,
          newPostsToday: data.newPostsToday || 0,
          newPromptsToday: data.newPromptsToday || 0,
          dailyViews: data.dailyViews || 0,
          weeklyStats: weeklyStats,
          userGrowthData: data.charts?.userGrowth || [],
          postGrowthData: data.charts?.postGrowth || [],
          promptGrowthData: data.charts?.promptGrowth || []
        });
      } else {
        setError(response.data?.message || t('admin.stats.error.fetchFailed'));
      }
    } catch (error) {
      console.error('获取管理员统计数据失败:', error);
      setError(t('admin.stats.error.networkError'));
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [t, processWeeklyStats]);

  // 手动刷新
  const handleManualRefresh = () => {
    fetchAdminStats(true);
  };

  useEffect(() => {
    fetchAdminStats();
  }, [fetchAdminStats]);

  useEffect(() => {
    fetchAnalyticsData();
    
    // 设置定时刷新分析数据
    if (activeChart !== 'overview') {
      const analyticsInterval = setInterval(() => {
        fetchAnalyticsData();
      }, 60000); // 每分钟刷新一次
      
      return () => {
        clearInterval(analyticsInterval);
      };
    }
  }, [activeChart, activeAnalysisType, timeRange, fetchAnalyticsData]);

  // 多维条形图组件
  const MultiBarChart = ({ data, height = 120, keys = ['users', 'posts'] }) => {
    const maxValue = Math.max(...data.flatMap(d => keys.map(key => d[key] || 0)));
    const colors = {
      users: '#3B82F6',
      posts: '#10B981',
      views: '#8B5CF6',
      likes: '#EF4444',
      active: '#F59E0B',
      prompts: '#F97316'
    };

    return (
      <div className="relative" style={{ height: `${height}px` }}>
        <div className="flex items-end justify-between h-full px-2">
          {data.map((item, index) => {
            const barHeight = maxValue > 0 ? (height - 20) : 0;
            
            return (
              <div key={index} className="flex flex-col items-center flex-1 mx-1">
                <div className="flex flex-col items-center justify-end" style={{ height: `${barHeight}px` }}>
                  {keys.map((key, keyIndex) => {
                    const value = item[key] || 0;
                    const segmentHeight = maxValue > 0 ? (value / maxValue) * (barHeight - 10) : 0;
                    
                    return (
                      <motion.div
                        key={key}
                        className="w-8 rounded-sm mb-1"
                        style={{ 
                          height: `${segmentHeight}px`,
                          backgroundColor: colors[key] || '#6B7280',
                          minHeight: value > 0 ? '2px' : '0px'
                        }}
                        initial={{ height: 0 }}
                        animate={{ height: `${segmentHeight}px` }}
                        transition={{ duration: 0.5, delay: keyIndex * 0.1 }}
                        title={`${key}: ${value}`}
                      />
                    );
                  })}
                </div>
                <span className="text-xs text-gray-600 mt-1 text-center">
                  {item.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">{t('common.loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-600 mr-2">⚠️</div>
          <div>
            <h3 className="text-red-800 font-medium">{t('admin.stats.error.title')}</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button 
              onClick={handleManualRefresh}
              className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              {t('admin.stats.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 顶部统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 用户统计 */}
        <motion.div 
          className="bg-white rounded-lg shadow-sm border p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.stats.totalUsers')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-1">
                +{stats.newUsersToday} {t('admin.stats.today')}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        {/* 帖子统计 */}
        <motion.div 
          className="bg-white rounded-lg shadow-sm border p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.stats.totalPosts')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPosts.toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-1">
                +{stats.newPostsToday} {t('admin.stats.today')}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        {/* 提示词统计 */}
        <motion.div 
          className="bg-white rounded-lg shadow-sm border p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.stats.totalPrompts')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPrompts.toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-1">
                +{stats.newPromptsToday} {t('admin.stats.today')}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </motion.div>

        {/* 活跃用户 */}
        <motion.div 
          className="bg-white rounded-lg shadow-sm border p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('admin.stats.activeUsers')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeUsers.toLocaleString()}</p>
              <p className="text-xs text-blue-600 mt-1">
                {t('admin.stats.last24h')}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* 图表选择器 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveChart('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeChart === 'overview'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <BarChart3 className="inline-block w-4 h-4 mr-2" />
            {t('admin.stats.overview')}
          </button>
          <button
            onClick={() => setActiveChart('geo')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeChart === 'geo'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MapPin className="inline-block w-4 h-4 mr-2" />
            {t('admin.analytics.geo')}
          </button>
          <button
            onClick={() => setActiveChart('behavior')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeChart === 'behavior'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MousePointer className="inline-block w-4 h-4 mr-2" />
            {t('admin.analytics.behavior')}
          </button>
          <button
            onClick={() => setActiveChart('trend')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeChart === 'trend'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <TrendingUp className="inline-block w-4 h-4 mr-2" />
            {t('admin.analytics.trend')}
          </button>
          <button
            onClick={() => setActiveChart('content')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeChart === 'content'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FileText className="inline-block w-4 h-4 mr-2" />
            {t('admin.analytics.content')}
          </button>
        </div>

        {/* 图表内容 */}
        <div className="min-h-[400px]">
          {activeChart === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('admin.stats.weeklyOverview')}
                </h3>
                <MultiBarChart 
                  data={stats.weeklyStats} 
                  height={200}
                  keys={['users', 'posts', 'prompts']}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">{t('admin.stats.totalViews')}</span>
                    <Eye className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t('admin.stats.dailyViews')}: {stats.dailyViews.toLocaleString()}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">{t('admin.stats.totalLikes')}</span>
                    <Heart className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalLikes.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t('admin.stats.promptLikes')}: {stats.totalPromptLikes.toLocaleString()}
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">{t('admin.stats.promptViews')}</span>
                    <Activity className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.totalPromptViews.toLocaleString()}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {t('admin.stats.avgViewsPerPrompt')}: {Math.round(stats.totalPromptViews / Math.max(stats.totalPrompts, 1))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeChart === 'geo' && (
            <GeoAnalysisChart 
              data={analyticsData} 
              loading={analyticsLoading}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          )}
          
          {activeChart === 'behavior' && (
            <BehaviorAnalysisChart 
              data={analyticsData} 
              loading={analyticsLoading}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          )}
          
          {activeChart === 'trend' && (
            <TrendAnalysisChart 
              data={analyticsData} 
              loading={analyticsLoading}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          )}
          
          {activeChart === 'content' && (
            <ContentAnalysisChart 
              data={analyticsData} 
              loading={analyticsLoading}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
            />
          )}
        </div>
      </div>

      {/* 刷新按钮 */}
      <div className="flex justify-end">
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          {isRefreshing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {t('admin.stats.refreshing')}
            </>
          ) : (
            <>
              <Server className="h-4 w-4 mr-2" />
              {t('admin.stats.refresh')}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminStatsPanel;