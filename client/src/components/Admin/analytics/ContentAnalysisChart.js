import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter } from 'recharts';
import './AnalyticsChart.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'];

const ContentAnalysisChart = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="analytics-chart-loading">
        <div className="loading-spinner"></div>
        <p>Loading content analysis...</p>
      </div>
    );
  }

  if (!data || !data.contentAnalysis) {
    return (
      <div className="analytics-chart-empty">
        <p>No content analysis data</p>
      </div>
    );
  }

  const { contentAnalysis, tagAnalysis } = data;

  // 内容质量指标数据
  const qualityMetrics = [
    {
      name: '平均浏览量',
      value: Math.round(contentAnalysis.avgViews || 0),
      color: '#8884d8',
      unit: '次'
    },
    {
      name: '平均点赞数',
      value: Math.round(contentAnalysis.avgLikes || 0),
      color: '#82ca9d',
      unit: '个'
    },
    {
      name: '平均评论数',
      value: Math.round(contentAnalysis.avgComments || 0),
      color: '#ffc658',
      unit: '条'
    }
  ];

  // 热门标签数据
  const tagData = tagAnalysis ? tagAnalysis.map((item, index) => ({
    name: item._id,
    count: item.count,
    avgViews: Math.round(item.avgViews || 0),
    color: COLORS[index % COLORS.length]
  })) : [];

  // 标签使用频率饼图数据
  const tagPieData = tagData.slice(0, 8).map(item => ({
    name: item.name,
    value: item.count,
    color: item.color
  }));

  // 标签效果散点图数据（标签使用次数 vs 平均浏览量）
  const tagEffectData = tagData.map(item => ({
    x: item.count,
    y: item.avgViews,
    name: item.name
  }));

  // 计算互动率
  const calculateEngagementRate = () => {
    const avgViews = contentAnalysis.avgViews || 0;
    const avgLikes = contentAnalysis.avgLikes || 0;
    const avgComments = contentAnalysis.avgComments || 0;
    
    if (avgViews === 0) return 0;
    return (((avgLikes + avgComments) / avgViews) * 100).toFixed(2);
  };

  return (
    <div className="content-analysis-chart">
      <div className="chart-header">
        <h3>Content Analysis</h3>
        <p className="chart-subtitle">Content quality and tag analysis</p>
      </div>
      
      <div className="chart-content">
        {/* 内容质量指标 */}
        <div className="chart-section">
          <h4>内容质量指标</h4>
          <div className="quality-metrics">
            {qualityMetrics.map((metric, index) => (
              <div key={index} className="metric-card">
                <div className="metric-icon" style={{ backgroundColor: metric.color }}></div>
                <div className="metric-info">
                  <div className="metric-value">{metric.value}{metric.unit}</div>
                  <div className="metric-label">{metric.name}</div>
                </div>
              </div>
            ))}
          </div>
          
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={qualityMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis />
              <Tooltip formatter={(value) => [value, '数值']} />
              <Bar dataKey="value">
                {qualityMetrics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 热门标签分析 */}
        <div className="chart-section">
          <h4>热门标签使用频率</h4>
          {tagData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={tagData.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={11}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'count') return [value, '使用次数'];
                      if (name === 'avgViews') return [value, '平均浏览量'];
                      return [value, name];
                    }}
                    labelFormatter={(label) => `标签: ${label}`}
                  />
                  <Bar dataKey="count" fill="#8884d8" name="使用次数" />
                </BarChart>
              </ResponsiveContainer>
            </>
          ) : (
            <div className="no-data">暂无标签数据</div>
          )}
        </div>

        {/* 标签分布饼图 */}
        <div className="chart-section">
          <h4>标签使用分布</h4>
          {tagPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={tagPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tagPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, '使用次数']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">暂无标签分布数据</div>
          )}
        </div>

        {/* 标签效果分析 */}
        <div className="chart-section">
          <h4>标签效果分析（使用频率 vs 平均浏览量）</h4>
          {tagEffectData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart data={tagEffectData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="使用次数"
                  fontSize={12}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="平均浏览量"
                  fontSize={12}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  formatter={(value, name) => {
                    if (name === 'y') return [value, '平均浏览量'];
                    return [value, name];
                  }}
                  labelFormatter={(label, payload) => {
                    if (payload && payload[0]) {
                      return `标签: ${payload[0].payload.name}`;
                    }
                    return label;
                  }}
                />
                <Scatter dataKey="y" fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">暂无标签效果数据</div>
          )}
        </div>
      </div>

      <div className="chart-summary">
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-label">总内容数:</span>
            <span className="stat-value">{contentAnalysis.totalPosts || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">内容互动率:</span>
            <span className="stat-value">{calculateEngagementRate()}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">热门标签:</span>
            <span className="stat-value">{tagData[0]?.name || '暂无'}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">标签总数:</span>
            <span className="stat-value">{tagData.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentAnalysisChart;