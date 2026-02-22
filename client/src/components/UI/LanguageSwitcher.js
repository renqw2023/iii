import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown, Check } from 'lucide-react';

const languages = [
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'ja-JP', name: '日本語', flag: '🇯🇵' }
];

const LanguageSwitcher = ({ className = '' }) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];
  
  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };
  
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/80 backdrop-blur-sm border border-slate-200 hover:bg-white hover:border-slate-300 transition-all duration-200 shadow-sm"
        aria-label={t('language.select')}
      >
        <Globe className="w-4 h-4 text-slate-600" />
        <span className="text-sm font-medium text-slate-700">
          {currentLanguage.flag} {currentLanguage.name}
        </span>
        <ChevronDown 
          className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            {/* 背景遮罩 */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            
            {/* 下拉菜单 */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-lg border border-slate-200 py-2 min-w-[160px] z-50"
            >
              {languages.map((language) => {
                const isSelected = language.code === i18n.language;
                
                return (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageChange(language.code)}
                    className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-slate-50 transition-colors duration-150 ${
                      isSelected ? 'text-primary-600 bg-primary-50' : 'text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-base">{language.flag}</span>
                      <span className="font-medium">{language.name}</span>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-primary-600" />
                    )}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;