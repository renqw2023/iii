import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Home, ArrowLeft, Sparkles } from 'lucide-react';

const NotFound = () => {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md mx-auto"
      >
        {/* 装饰性背景 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary-200/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-secondary-200/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative">
          {/* 404图标 */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mb-8"
          >
            <div className="relative inline-block">
              <h1 className="text-8xl md:text-9xl font-bold gradient-text mb-4">404</h1>
              <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-primary-400 animate-pulse" />
            </div>
          </motion.div>

          {/* 错误信息 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-semibold text-slate-900 mb-3">
                {t('ui.notFound.title')}
              </h2>
              <p className="text-slate-600 leading-relaxed">
                {t('ui.notFound.message')}
                <br />
                {t('ui.notFound.suggestion')}
              </p>
          </motion.div>

          {/* 操作按钮 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="space-y-3"
          >
            <Link
              to="/"
              className="btn btn-primary w-full group"
            >
              <Home className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
              {t('ui.notFound.homeButton')}
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="btn btn-secondary w-full group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
              {t('ui.notFound.backButton')}
            </button>
          </motion.div>

          {/* 建议链接 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-8 pt-6 border-t border-slate-200"
          >
            <p className="text-sm text-slate-500 mb-3">{t('ui.notFound.suggestions')}：</p>
            <div className="flex flex-wrap justify-center gap-2 text-sm">
              <Link
                to="/create"
                className="text-primary-600 hover:text-primary-700 hover:underline transition-colors duration-200"
              >
                {t('ui.notFound.createWork')}
              </Link>
              <span className="text-slate-300">•</span>
              <Link
                to="/dashboard"
                className="text-primary-600 hover:text-primary-700 hover:underline transition-colors duration-200"
              >
                {t('ui.notFound.dashboard')}
              </Link>
              <span className="text-slate-300">•</span>
              <Link
                to="/health"
                className="text-primary-600 hover:text-primary-700 hover:underline transition-colors duration-200"
              >
                {t('ui.notFound.systemStatus')}
              </Link>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;