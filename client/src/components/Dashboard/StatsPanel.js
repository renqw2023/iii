import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  Heart, 
  Users, 
  FileText,
  Calendar,
  BarChart3,

  Activity
} from 'lucide-react';
import { enhancedUserAPI, enhancedPostAPI } from '../../services/enhancedApi';

const StatsPanel = ({ user, stats: propStats }) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalViews: 0,
    totalFollowers: 0,
    totalFollowing: 0,
    formatReference: {
      posts: 0,
      likes: 0,
      views: 0
    },
    prompts: {
      posts: 0,
      likes: 0,
      views: 0
    },
    weeklyStats: [],
    monthlyGrowth: {
      posts: 0,
      likes: 0,
      views: 0,
      followers: 0
    },
    topPosts: []
  });
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState('overview');

  const fetchStatsData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 获取基础统计数据
      const [statsRes, postsRes] = await Promise.all([
        enhancedUserAPI.getUserStats(user.id).catch(() => ({ 
          data: { 
            stats: { 
              posts: 0, 
              likes: 0, 
              views: 0, 
              followers: 0, 
              following: 0 
            } 
          } 
        })),
        enhancedPostAPI.getPosts({ 
          author: user.id, 
          limit: 5, 
          sort: 'views' 
        }).catch(() => ({ data: { posts: [] } }))
      ]);

      // 模拟周统计数据（实际项目中应该从后端获取）
      const weeklyStats = generateWeeklyStats();
      const monthlyGrowth = generateMonthlyGrowth();

      // 映射后端返回的字段名到前端期望的格式
      const backendStats = statsRes.data.stats;
      setStats({
        totalPosts: backendStats.totalPosts || 0,
        totalLikes: backendStats.totalLikes || 0,
        totalViews: backendStats.totalViews || 0,
        totalFollowers: backendStats.totalFollowers || 0,
        totalFollowing: backendStats.totalFollowing || 0,
        formatReference: {
          posts: backendStats.formatReference?.posts || 0,
          likes: backendStats.formatReference?.likes || 0,
          views: backendStats.formatReference?.views || 0
        },
        prompts: {
          posts: backendStats.prompts?.posts || 0,
          likes: backendStats.prompts?.likes || 0,
          views: backendStats.prompts?.views || 0
        },
        weeklyStats,
        monthlyGrowth,
        topPosts: postsRes.data.posts || []
      });
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (propStats) {
      // 使用传入的统计数据
      const weeklyStats = generateWeeklyStats();
      const monthlyGrowth = generateMonthlyGrowth();
      
      setStats({
        totalPosts: propStats.totalPosts || 0,
        totalLikes: propStats.totalLikes || 0,
        totalViews: propStats.totalViews || 0,
        totalFollowers: propStats.totalFollowers || 0,
        totalFollowing: propStats.totalFollowing || 0,
        formatReference: propStats.formatReference || { posts: 0, likes: 0, views: 0 },
        prompts: propStats.prompts || { posts: 0, likes: 0, views: 0 },
        weeklyStats,
        monthlyGrowth,
        topPosts: []
      });
      setLoading(false);
    } else if (user?.id) {
      fetchStatsData();
    }
  }, [user?.id, propStats, fetchStatsData]);

  // 生成模拟的周统计数据
  const generateWeeklyStats = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day) => ({
      day,
      views: Math.floor(Math.random() * 100) + 20,
      likes: Math.floor(Math.random() * 30) + 5,
      posts: Math.floor(Math.random() * 3)
    }));
  };

  // 生成模拟的月增长数据
  const generateMonthlyGrowth = () => ({
    posts: Math.floor(Math.random() * 20) + 5,
    likes: Math.floor(Math.random() * 50) + 10,
    views: Math.floor(Math.random() * 200) + 50,
    followers: Math.floor(Math.random() * 15) + 2
  });

  // 简单的条形图组件
  const BarChart = ({ data, height = 120 }) => {
    const maxValue = Math.max(...data.map(d => d.views));
    
    return (
      <div className="flex items-end justify-between h-32 px-4">
        {data.map((item, index) => (
          <div key={index} className="flex flex-col items-center space-y-2">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(item.views / maxValue) * height}px` }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-sm min-h-[4px]"
              style={{ width: '24px' }}
            />
            <span className="text-xs text-slate-600 transform -rotate-45 origin-center">
              {item.day.slice(1)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // 环形进度条组件
  const CircularProgress = ({ percentage, size = 80, strokeWidth = 8, color = "#3B82F6" }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-slate-700">{percentage}%</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded mb-4 w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-200 rounded"></div>
            ))}
          </div>
          <div className="h-32 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Views',
      value: stats.totalViews,
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      growth: stats.monthlyGrowth.views,
      growthType: stats.monthlyGrowth.views > 0 ? 'up' : 'down',
      details: [
        { label: 'Format Ref', value: stats.formatReference.views },
        { label: 'Prompts', value: stats.prompts.views }
      ]
    },
    {
      title: 'Total Likes',
      value: stats.totalLikes,
      icon: Heart,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      growth: stats.monthlyGrowth.likes,
      growthType: stats.monthlyGrowth.likes > 0 ? 'up' : 'down',
      details: [
        { label: 'Format Ref', value: stats.formatReference.likes },
        { label: 'Prompts', value: stats.prompts.likes }
      ]
    },
    {
      title: 'Followers',
      value: stats.totalFollowers,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      growth: stats.monthlyGrowth.followers,
      growthType: stats.monthlyGrowth.followers > 0 ? 'up' : 'down'
    },
    {
      title: 'Works',
      value: stats.totalPosts,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      growth: stats.monthlyGrowth.posts,
      growthType: stats.monthlyGrowth.posts > 0 ? 'up' : 'down',
      details: [
        { label: 'Format Ref', value: stats.formatReference.posts },
        { label: 'Prompts', value: stats.prompts.posts }
      ]
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card p-6 mb-8"
    >
      {/* 标题 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <BarChart3 className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{t('dashboard.stats.title')}</h2>
            <p className="text-sm text-slate-600">{t('dashboard.stats.subtitle')}</p>
          </div>
        </div>
        
        {/* 图表切换 */}
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setActiveChart('overview')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeChart === 'overview'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('dashboard.stats.overview')}
          </button>
          <button
            onClick={() => setActiveChart('trends')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeChart === 'trends'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('dashboard.stats.trends')}
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const GrowthIcon = stat.growthType === 'up' ? TrendingUp : TrendingDown;
          
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-lg p-4 border border-slate-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <div className={`flex items-center space-x-1 text-xs ${
                  stat.growthType === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <GrowthIcon className="w-3 h-3" />
                  <span>+{Math.abs(stat.growth)}</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1">
                {(stat.value || 0).toLocaleString()}
              </div>
              <div className="text-sm text-slate-600 mb-2">{stat.title}</div>
              {stat.details && (
                <div className="space-y-1">
                  {stat.details.map((detail, detailIndex) => (
                    <div key={detailIndex} className="flex justify-between text-xs text-slate-500">
                      <span>{detail.label}:</span>
                      <span className="font-medium">{(detail.value || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 图表区域 */}
      {activeChart === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 周浏览量趋势 */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">{t('dashboard.stats.weeklyViews')}</h3>
              <Activity className="w-4 h-4 text-slate-500" />
            </div>
            <BarChart data={stats.weeklyStats} />
          </div>

          {/* 热门作品 */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">{t('dashboard.stats.popularPosts')}</h3>
              <TrendingUp className="w-4 h-4 text-slate-500" />
            </div>
            <div className="space-y-3">
              {stats.topPosts.slice(0, 3).map((post) => (
                <div key={post._id} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-slate-200 rounded flex-shrink-0">
                    {post.media?.[0] && (
                      <img
                        src={post.media[0].thumbnail || post.media[0].url}
                        alt={post.title}
                        className="w-full h-full object-cover rounded"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {post.title}
                    </p>
                    <div className="flex items-center space-x-3 text-xs text-slate-500">
                      <span className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>{post.views}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Heart className="w-3 h-3" />
                        <span>{post.likesCount}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {stats.topPosts.length === 0 && (
                <div className="text-center py-4 text-slate-500 text-sm">
                  暂无作品数据
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeChart === 'trends' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* 参与度指标 */}
          <div className="text-center">
            <h4 className="text-sm font-medium text-slate-900 mb-3">参与度</h4>
            <CircularProgress 
              percentage={Math.min(100, Math.round((stats.totalLikes / Math.max(stats.totalViews, 1)) * 100))}
              color="#EF4444"
            />
            <p className="text-xs text-slate-600 mt-2">点赞/浏览比</p>
          </div>
          
          <div className="text-center">
            <h4 className="text-sm font-medium text-slate-900 mb-3">活跃度</h4>
            <CircularProgress 
              percentage={Math.min(100, stats.totalPosts * 10)}
              color="#8B5CF6"
            />
            <p className="text-xs text-slate-600 mt-2">发布频率</p>
          </div>
          
          <div className="text-center">
            <h4 className="text-sm font-medium text-slate-900 mb-3">影响力</h4>
            <CircularProgress 
              percentage={Math.min(100, stats.totalFollowers * 2)}
              color="#10B981"
            />
            <p className="text-xs text-slate-600 mt-2">粉丝增长</p>
          </div>
          
          <div className="text-center">
            <h4 className="text-sm font-medium text-slate-900 mb-3">热度</h4>
            <CircularProgress 
              percentage={Math.min(100, Math.round(stats.totalViews / 10))}
              color="#3B82F6"
            />
            <p className="text-xs text-slate-600 mt-2">浏览热度</p>
          </div>
        </div>
      )}

      {/* 底部提示 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <div className="p-1 bg-blue-100 rounded">
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">数据更新</h4>
            <p className="text-xs text-blue-700">
              统计数据每小时更新一次，最后更新时间：{new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StatsPanel;