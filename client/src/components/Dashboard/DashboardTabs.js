import React from 'react';
import { motion } from 'framer-motion';
import { Grid, List } from 'lucide-react';

const DashboardTabs = ({ 
  activeTab, 
  onTabChange, 
  viewMode, 
  onViewModeChange, 
  tabs, 
  children 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="card"
    >
      {/* 标签页导航 */}
      <div className="border-b border-slate-200">
        <div className="flex items-center justify-between p-6 pb-0">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.label}
                <span className="ml-2 px-2 py-1 bg-slate-100 text-slate-600 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>

          {/* 视图切换 */}
          {(activeTab === 'posts' || activeTab === 'prompts') && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  viewMode === 'list'
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-6">
        {children}
      </div>
    </motion.div>
  );
};

export default DashboardTabs;