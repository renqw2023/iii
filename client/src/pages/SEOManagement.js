import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Search, 
  Globe, 
  FileText, 
  BarChart3, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Download,
  Upload
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { SEOHead } from '../components/SEO';

const SEOManagement = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // 获取sitemap状态
  const { data: sitemapStatus, isLoading: statusLoading } = useQuery(
    'sitemapStatus',
    () => axios.get('/api/seo/sitemap/status').then(res => res.data),
    {
      refetchInterval: 30000 // 每30秒刷新一次
    }
  );

  // 生成sitemap
  const generateSitemapMutation = useMutation(
    () => axios.get('/api/seo/sitemap/generate'),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('sitemapStatus');
      }
    }
  );

  // 提交sitemap到搜索引擎
  const submitSitemapMutation = useMutation(
    (engines) => axios.post('/api/seo/submit-sitemap', { engines }),
    {
      onSuccess: () => {
        console.log('Sitemap submitted successfully');
      }
    }
  );

  const handleGenerateSitemap = () => {
    generateSitemapMutation.mutate();
  };

  const handleSubmitSitemap = (engines = ['google', 'bing', 'baidu']) => {
    submitSitemapMutation.mutate(engines);
  };

  const tabs = [
    { id: 'overview', label: 'SEO概览', icon: BarChart3 },
    { id: 'sitemap', label: 'Sitemap管理', icon: FileText },
    { id: 'meta', label: '元数据管理', icon: Globe },
    { id: 'performance', label: '性能监控', icon: Search }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pages</p>
              <p className="text-2xl font-bold text-gray-900">1,234</p>
            </div>
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Indexed Pages</p>
              <p className="text-2xl font-bold text-gray-900">987</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Load Time</p>
              <p className="text-2xl font-bold text-gray-900">1.2s</p>
            </div>
            <BarChart3 className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">SEO Score</p>
              <p className="text-2xl font-bold text-gray-900">85/100</p>
            </div>
            <Globe className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleGenerateSitemap}
            disabled={generateSitemapMutation.isLoading}
            className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            {generateSitemapMutation.isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <RefreshCw className="h-5 w-5" />
            )}
            生成Sitemap
          </button>
          
          <button
            onClick={() => handleSubmitSitemap()}
            disabled={submitSitemapMutation.isLoading}
            className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
          >
            {submitSitemapMutation.isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Upload className="h-5 w-5" />
            )}
            提交到搜索引擎
          </button>
          
          <button className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <Download className="h-5 w-5" />
            导出SEO报告
          </button>
        </div>
      </div>
    </div>
  );

  const renderSitemapManagement = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Sitemap文件状态</h3>
          <button
            onClick={handleGenerateSitemap}
            disabled={generateSitemapMutation.isLoading}
            className="btn btn-primary"
          >
            {generateSitemapMutation.isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            重新生成
          </button>
        </div>
        
        {statusLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-3">
            {sitemapStatus?.sitemaps && Object.entries(sitemapStatus.sitemaps).map(([filename, info]) => (
              <div key={filename} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {info.exists ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-medium">{filename}</p>
                    {info.exists && (
                      <p className="text-sm text-gray-600">
                        大小: {(info.size / 1024).toFixed(2)} KB | 
                        更新时间: {new Date(info.lastModified).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                {info.exists && (
                  <a
                    href={`${sitemapStatus.baseUrl}/${filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    查看
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold mb-4">搜索引擎提交</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['google', 'bing', 'baidu'].map(engine => (
            <button
              key={engine}
              onClick={() => handleSubmitSitemap([engine])}
              disabled={submitSitemapMutation.isLoading}
              className="flex items-center justify-center gap-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Globe className="h-5 w-5" />
              提交到 {engine.charAt(0).toUpperCase() + engine.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMetaManagement = () => (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">元数据管理</h3>
      <p className="text-gray-600">元数据管理功能正在开发中...</p>
    </div>
  );

  const renderPerformanceMonitoring = () => (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <h3 className="text-lg font-semibold mb-4">性能监控</h3>
      <p className="text-gray-600">性能监控功能正在开发中...</p>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'sitemap':
        return renderSitemapManagement();
      case 'meta':
        return renderMetaManagement();
      case 'performance':
        return renderPerformanceMonitoring();
      default:
        return renderOverview();
    }
  };

  return (
    <>
      <SEOHead
        title="SEO管理 - III.PICS"
        description="管理网站SEO设置，包括sitemap生成、元数据管理和性能监控"
        noindex={true}
      />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">SEO管理</h1>
            <p className="text-gray-600">管理网站的搜索引擎优化设置</p>
          </div>

          {/* 标签导航 */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* 标签内容 */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderTabContent()}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default SEOManagement;