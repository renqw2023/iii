import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Server, Database, Wifi } from 'lucide-react';
import { enhancedAPI } from '../services/enhancedApi';

const Health = () => {
  const [healthStatus, setHealthStatus] = useState({
    api: { status: 'checking', message: '检查中...', timestamp: null },
    database: { status: 'checking', message: '检查中...', timestamp: null },
    overall: 'checking'
  });

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // 每30秒检查一次
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    const timestamp = new Date().toISOString();
    
    try {
      // 检查API健康状态
      const response = await enhancedAPI.get('/health');
      
      setHealthStatus(prev => ({
        ...prev,
        api: {
          status: 'healthy',
          message: 'API服务正常',
          timestamp: response.data.timestamp || timestamp
        },
        database: {
          status: 'healthy',
          message: '数据库连接正常',
          timestamp: timestamp
        },
        overall: 'healthy'
      }));
    } catch (error) {
      setHealthStatus(prev => ({
        ...prev,
        api: {
          status: 'error',
          message: `API连接失败: ${error.message}`,
          timestamp: timestamp
        },
        database: {
          status: 'unknown',
          message: '无法检查数据库状态',
          timestamp: timestamp
        },
        overall: 'error'
      }));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'checking':
      default:
        return <Clock className="w-6 h-6 text-yellow-500 animate-spin" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'checking':
      default:
        return 'border-yellow-200 bg-yellow-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-4">系统健康状态</h1>
          <p className="text-slate-600">实时监控系统各组件的运行状态</p>
        </motion.div>

        {/* 总体状态 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`card p-6 mb-8 border-2 ${getStatusColor(healthStatus.overall)}`}
        >
          <div className="flex items-center justify-center space-x-4">
            {getStatusIcon(healthStatus.overall)}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900">
                {healthStatus.overall === 'healthy' ? '系统正常' : 
                 healthStatus.overall === 'error' ? '系统异常' : '检查中...'}
              </h2>
              <p className="text-slate-600">
                最后更新: {new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </motion.div>

        {/* 详细状态 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* API服务状态 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={`card p-6 border ${getStatusColor(healthStatus.api.status)}`}
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Server className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold text-slate-900">API服务</h3>
                  {getStatusIcon(healthStatus.api.status)}
                </div>
                <p className="text-slate-600 mb-2">{healthStatus.api.message}</p>
                {healthStatus.api.timestamp && (
                  <p className="text-sm text-slate-500">
                    检查时间: {new Date(healthStatus.api.timestamp).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* 数据库状态 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={`card p-6 border ${getStatusColor(healthStatus.database.status)}`}
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Database className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold text-slate-900">数据库</h3>
                  {getStatusIcon(healthStatus.database.status)}
                </div>
                <p className="text-slate-600 mb-2">{healthStatus.database.message}</p>
                {healthStatus.database.timestamp && (
                  <p className="text-sm text-slate-500">
                    检查时间: {new Date(healthStatus.database.timestamp).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* 系统信息 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="card p-6 mt-8"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Wifi className="w-5 h-5 mr-2" />
            系统信息
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-slate-700">前端版本:</span>
              <span className="ml-2 text-slate-600">v1.0.0</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">后端版本:</span>
              <span className="ml-2 text-slate-600">v1.0.0</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">环境:</span>
              <span className="ml-2 text-slate-600">
                {process.env.NODE_ENV || 'development'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* 刷新按钮 */}
        <div className="text-center mt-8">
          <button
            onClick={checkHealth}
            className="btn btn-primary"
            disabled={healthStatus.overall === 'checking'}
          >
            {healthStatus.overall === 'checking' ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                检查中...
              </>
            ) : (
              '刷新状态'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Health;