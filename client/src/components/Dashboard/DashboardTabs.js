import React from 'react';
import { motion } from 'framer-motion';

const DashboardTabs = ({ activeTab, onTabChange, tabs, children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
    >
      {/* Tab nav */}
      <div style={{ borderBottom: '1px solid var(--border-color)' }}>
        <nav className="flex px-6 pt-4 gap-6">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="pb-3 px-1 text-sm font-medium transition-colors duration-200"
                style={{
                  borderBottom: active ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span
                    className="ml-2 px-2 py-0.5 rounded-full text-xs"
                    style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {children}
      </div>
    </motion.div>
  );
};

export default DashboardTabs;
