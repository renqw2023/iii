import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ComposedChart, Bar } from 'recharts';
import './AnalyticsChart.css';

const TrendAnalysisChart = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="analytics-chart-loading">
        <div className="loading-spinner"></div>
        <p>Loading trend analysis...</p>
      </div>
    );
  }

  if (!data || !data.trendAnalysis) {
    return (
      <div className="analytics-chart-empty">
        <p>No trend analysis data</p>
      </div>
    );
  }

  const { trendAnalysis } = data;
  const { userTrend, postTrend, prediction } = trendAnalysis;

  // 合并用户和帖子趋势数据
  const combinedTrendData = userTrend.map(userItem => {
    const postItem = postTrend.find(p => p._id === userItem._id);
    return {
      date: userItem._id,
      newUsers: userItem.newUsers,
      newPosts: postItem ? postItem.newPosts : 0,
      totalViews: postItem ? postItem.totalViews : 0
    };
  });

  // 格式化日期显示
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 计算增长率
  const calculateGrowthRate = (data, key) => {
    if (data.length < 2) return 0;
    const latest = data[data.length - 1][key];
    const previous = data[data.length - 2][key];
    if (previous === 0) return latest > 0 ? 100 : 0;
    return ((latest - previous) / previous * 100).toFixed(1);
  };

  const userGrowthRate = calculateGrowthRate(combinedTrendData, 'newUsers');
  const postGrowthRate = calculateGrowthRate(combinedTrendData, 'newPosts');

  return (
    <div className="trend-analysis-chart">
      <div className="chart-header">
        <h3>Trend Analysis</h3>
        <p className="chart-subtitle">User growth and content trends</p>
      </div>
      
      <div className="chart-content">
        {/* User Growth Trend */}
        <div className="chart-section">
          <h4>User Growth Trend</h4>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={combinedTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                fontSize={12}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(label) => `日期: ${formatDate(label)}`}
                formatter={(value) => [value, 'New Users']}
              />
              <Area 
                type="monotone" 
                dataKey="newUsers" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.6}
                name="New Users"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 内容发布趋势 */}
        <div className="chart-section">
          <h4>内容发布趋势</h4>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={combinedTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                fontSize={12}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                labelFormatter={(label) => `日期: ${formatDate(label)}`}
                formatter={(value, name) => {
                  if (name === 'newPosts') return [value, '新增帖子'];
                  if (name === 'totalViews') return [value, '总浏览量'];
                  return [value, name];
                }}
              />
              <Bar yAxisId="left" dataKey="newPosts" fill="#82ca9d" name="新增帖子" />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="totalViews" 
                stroke="#ff7300" 
                strokeWidth={2}
                name="总浏览量"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 综合趋势对比 */}
        <div className="chart-section">
          <h4>综合趋势对比</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={combinedTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                fontSize={12}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(label) => `日期: ${formatDate(label)}`}
                formatter={(value, name) => {
                  if (name === 'newUsers') return [value, 'New Users'];
                  if (name === 'newPosts') return [value, '新增帖子'];
                  return [value, name];
                }}
              />
              <Line 
                type="monotone" 
                dataKey="newUsers" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="New Users"
              />
              <Line 
                type="monotone" 
                dataKey="newPosts" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="新增帖子"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 预测数据和统计摘要 */}
      <div className="chart-summary">
        <div className="prediction-section">
          <h4>趋势预测</h4>
          <div className="prediction-stats">
            <div className="prediction-item">
              <span className="prediction-label">预测下周New Users:</span>
              <span className="prediction-value positive">
                +{prediction.nextWeekUsers || 0} 人
              </span>
            </div>
            <div className="prediction-item">
              <span className="prediction-label">用户增长率:</span>
              <span className={`prediction-value ${prediction.growthRate >= 0 ? 'positive' : 'negative'}`}>
                {prediction.growthRate >= 0 ? '+' : ''}{prediction.growthRate}%
              </span>
            </div>
          </div>
        </div>
        
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-label">用户日增长率:</span>
            <span className={`stat-value ${userGrowthRate >= 0 ? 'positive' : 'negative'}`}>
              {userGrowthRate >= 0 ? '+' : ''}{userGrowthRate}%
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">内容日增长率:</span>
            <span className={`stat-value ${postGrowthRate >= 0 ? 'positive' : 'negative'}`}>
              {postGrowthRate >= 0 ? '+' : ''}{postGrowthRate}%
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">数据周期:</span>
            <span className="stat-value">{combinedTrendData.length} 天</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysisChart;