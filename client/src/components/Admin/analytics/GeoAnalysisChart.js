import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import './AnalyticsChart.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'];

const GeoAnalysisChart = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="analytics-chart-loading">
        <div className="loading-spinner"></div>
        <p>Loading geo analysis...</p>
      </div>
    );
  }

  if (!data || !data.geoAnalysis || data.geoAnalysis.length === 0) {
    return (
      <div className="analytics-chart-empty">
        <p>No geo analysis data</p>
      </div>
    );
  }

  const geoData = data.geoAnalysis.map(item => ({
    country: item._id || 'Unknown',
    userCount: item.userCount,
    cities: item.cities ? item.cities.length : 0
  }));

  const pieData = geoData.slice(0, 5).map((item, index) => ({
    name: item.country,
    value: item.userCount,
    color: COLORS[index % COLORS.length]
  }));

  return (
    <div className="geo-analysis-chart">
      <div className="chart-header">
        <h3>Geo Analysis</h3>
        <p className="chart-subtitle">User geographic distribution</p>
      </div>
      
      <div className="chart-content">
        <div className="chart-section">
          <h4>用户数量分布（柱状图）</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={geoData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="country" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'userCount') return [value, 'Users'];
                  if (name === 'cities') return [value, 'Cities'];
                  return [value, name];
                }}
                labelFormatter={(label) => `国家/地区: ${label}`}
              />
              <Bar dataKey="userCount" fill="#8884d8" name="用户数量" />
              <Bar dataKey="cities" fill="#82ca9d" name="城市数量" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-section">
          <h4>用户分布占比（饼图）</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Users']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-summary">
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-label">覆盖国家/地区:</span>
            <span className="stat-value">{geoData.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">总用户数:</span>
            <span className="stat-value">{geoData.reduce((sum, item) => sum + item.userCount, 0)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">主要地区:</span>
            <span className="stat-value">{geoData[0]?.country || '暂无'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeoAnalysisChart;