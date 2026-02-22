import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './AnalyticsChart.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const BehaviorAnalysisChart = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="analytics-chart-loading">
        <div className="loading-spinner"></div>
        <p>加载行为分析数据中...</p>
      </div>
    );
  }

  if (!data || !data.behaviorAnalysis) {
    return (
      <div className="analytics-chart-empty">
        <p>暂无行为分析数据</p>
      </div>
    );
  }

  const { behaviorAnalysis, deviceAnalysis } = data;
  
  // 格式化会话时间（秒转换为分钟）
  const formatSessionTime = (seconds) => {
    if (!seconds) return '0分钟';
    const minutes = Math.round(seconds / 60);
    return `${minutes}分钟`;
  };

  // 设备类型数据
  const deviceData = deviceAnalysis ? deviceAnalysis.map((item, index) => ({
    name: item._id || '未知设备',
    value: item.count,
    color: COLORS[index % COLORS.length]
  })) : [];

  // 用户活跃度数据
  const activityData = [
    {
      name: '平均会话时长',
      value: behaviorAnalysis.avgSessionTime || 0,
      unit: '秒',
      displayValue: formatSessionTime(behaviorAnalysis.avgSessionTime)
    },
    {
      name: '总登录次数',
      value: behaviorAnalysis.totalLogins || 0,
      unit: '次',
      displayValue: behaviorAnalysis.totalLogins || 0
    },
    {
      name: '活跃用户数',
      value: behaviorAnalysis.activeUsers || 0,
      unit: '人',
      displayValue: behaviorAnalysis.activeUsers || 0
    }
  ];

  // 互动数据
  const interactionData = [
    {
      name: '点赞数',
      value: behaviorAnalysis.totalLikesGiven || 0,
      color: '#FF6B6B'
    },
    {
      name: '评论数',
      value: behaviorAnalysis.totalCommentsGiven || 0,
      color: '#4ECDC4'
    }
  ];

  return (
    <div className="behavior-analysis-chart">
      <div className="chart-header">
        <h3>用户行为分析</h3>
        <p className="chart-subtitle">用户活跃度与互动行为统计</p>
      </div>
      
      <div className="chart-content">
        {/* 用户活跃度指标 */}
        <div className="chart-section">
          <h4>用户活跃度指标</h4>
          <div className="activity-metrics">
            {activityData.map((metric, index) => (
              <div key={index} className="metric-card">
                <div className="metric-value">{metric.displayValue}</div>
                <div className="metric-label">{metric.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 设备类型分布 */}
        <div className="chart-section">
          <h4>设备类型分布</h4>
          {deviceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, '用户数量']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">暂无设备数据</div>
          )}
        </div>

        {/* 用户互动统计 */}
        <div className="chart-section">
          <h4>用户互动统计</h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={interactionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [value, '数量']} />
              <Bar dataKey="value" fill={(entry) => entry.color}>
                {interactionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-summary">
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-label">平均会话时长:</span>
            <span className="stat-value">{formatSessionTime(behaviorAnalysis.avgSessionTime)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">用户互动率:</span>
            <span className="stat-value">
              {behaviorAnalysis.activeUsers > 0 
                ? ((behaviorAnalysis.totalLikesGiven + behaviorAnalysis.totalCommentsGiven) / behaviorAnalysis.activeUsers).toFixed(1)
                : '0'
              }
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">主要设备类型:</span>
            <span className="stat-value">{deviceData[0]?.name || '暂无数据'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BehaviorAnalysisChart;