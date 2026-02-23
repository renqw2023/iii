import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  showInfo = true,
  totalItems = 0,
  itemsPerPage = 12,
  className = '' 
}) => {
  // 如果只有一页或没有数据，不显示分页
  if (totalPages <= 1) {
    return null;
  }

  // 生成页码数组
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 7; // 最多显示7个页码
    
    if (totalPages <= maxVisiblePages) {
      // 如果总页数小于等于最大显示页数，显示所有页码
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 复杂的分页逻辑
      if (currentPage <= 4) {
        // 当前页在前面
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // 当前页在后面
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // 当前页在中间
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = generatePageNumbers();
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePageClick = (page) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
      // 滚动到顶部
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}
    >
      {/* 分页信息 */}
      {showInfo && (
        <div className="text-sm text-slate-600">
          Showing <span className="font-medium text-slate-900">{startItem}</span> 到{' '}
          <span className="font-medium text-slate-900">{endItem}</span> items，共{' '}
          <span className="font-medium text-slate-900">{totalItems}</span> items
        </div>
      )}

      {/* 分页控件 */}
      <div className="flex items-center gap-1">
        {/* 上一页按钮 */}
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          className={`
            flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200
            ${
              currentPage === 1
                ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                : 'border-slate-300 text-slate-600 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50'
            }
          `}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* 页码按钮 */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <div
                  key={`ellipsis-${index}`}
                  className="flex items-center justify-center w-10 h-10 text-slate-400"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </div>
              );
            }

            const isActive = page === currentPage;
            return (
              <button
                key={page}
                onClick={() => handlePageClick(page)}
                className={`
                  flex items-center justify-center w-10 h-10 rounded-lg border text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? 'border-primary-500 bg-primary-500 text-white shadow-sm'
                      : 'border-slate-300 text-slate-600 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50'
                  }
                `}
                aria-label={`第 ${page} 页`}
                aria-current={isActive ? 'page' : undefined}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* 下一页按钮 */}
        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`
            flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200
            ${
              currentPage === totalPages
                ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                : 'border-slate-300 text-slate-600 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50'
            }
          `}
          aria-label="下一页"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 快速跳转（可选） */}
      {totalPages > 10 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-600">跳转到</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            className="w-16 px-2 py-1 text-center border border-slate-300 rounded focus:border-primary-500 focus:outline-none"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= totalPages) {
                  handlePageClick(page);
                  e.target.value = '';
                }
              }
            }}
            placeholder={currentPage}
          />
          <span className="text-slate-600">页</span>
        </div>
      )}
    </motion.div>
  );
};

export default Pagination;