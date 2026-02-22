import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const ErrorMessage = ({ 
  message = '出现了一些问题', 
  onRetry = null, 
  className = '',
  variant = 'default' // default, inline, card
}) => {
  const baseClasses = 'flex items-center gap-3';
  
  const variantClasses = {
    default: 'p-4 bg-red-50 border border-red-200 rounded-lg text-red-700',
    inline: 'text-red-600',
    card: 'p-6 bg-white border border-red-200 rounded-xl shadow-sm text-red-700'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <div className="flex-1">
        <p className="font-medium">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded-md transition-colors duration-200 text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          重试
        </button>
      )}
    </motion.div>
  );
};

export default ErrorMessage;