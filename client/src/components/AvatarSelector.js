import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, Check } from 'lucide-react';
import { getAllAvatars, getUserAvatar, DEFAULT_FALLBACK_AVATAR } from '../utils/avatarUtils';

const AvatarSelector = ({ isOpen, onClose, onSelect, currentUser }) => {
  const { t } = useTranslation();
  const [selectedAvatar, setSelectedAvatar] = useState(getUserAvatar(currentUser));
  const availableAvatars = getAllAvatars();

  const handleSelect = (avatar) => {
    setSelectedAvatar(avatar);
  };

  const handleConfirm = () => {
    onSelect(selectedAvatar);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{t('ui.avatarSelector.title')}</h2>
              <p className="text-sm text-slate-500 mt-1">{t('ui.avatarSelector.subtitle')}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* 当前选择预览 */}
          <div className="p-6 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={selectedAvatar}
                  alt="选中的头像"
                  className="w-16 h-16 rounded-full object-cover border-3 border-primary-500 shadow-lg"
                  onError={(e) => {
                    e.target.src = DEFAULT_FALLBACK_AVATAR;
                  }}
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <p className="font-medium text-slate-900">当前选择</p>
                <p className="text-sm text-slate-500">这将成为你的新头像</p>
              </div>
            </div>
          </div>

          {/* 头像网格 */}
          <div className="p-6 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {availableAvatars.map((avatar, index) => {
                const isSelected = selectedAvatar === avatar;
                return (
                  <motion.button
                    key={avatar}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02 }}
                    onClick={() => handleSelect(avatar)}
                    className={`
                      relative w-16 h-16 rounded-full overflow-hidden border-2 transition-all duration-200
                      hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                      ${
                        isSelected
                          ? 'border-primary-500 shadow-lg scale-105'
                          : 'border-slate-200 hover:border-primary-300'
                      }
                    `}
                  >
                    <img
                      src={avatar}
                      alt={`头像选项 ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = DEFAULT_FALLBACK_AVATAR;
                      }}
                    />
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute inset-0 bg-primary-500 bg-opacity-20 flex items-center justify-center"
                      >
                        <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* 底部按钮 */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium transition-colors"
            >
              {t('ui.avatarSelector.cancel')}
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
            >
              {t('ui.avatarSelector.confirm')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AvatarSelector;