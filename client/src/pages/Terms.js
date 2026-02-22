import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Scale, AlertTriangle, Shield, Users, Gavel } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Terms = () => {
  const { t } = useTranslation();
  
  const sections = [
    {
      id: 'acceptance',
      title: t('terms.sections.acceptance.title'),
      icon: <FileText className="w-6 h-6" />,
      content: t('terms.sections.acceptance.content', { returnObjects: true })
    },
    {
      id: 'description',
      title: t('terms.sections.description.title'),
      icon: <Users className="w-6 h-6" />,
      content: t('terms.sections.description.content', { returnObjects: true })
    },
    {
      id: 'eligibility',
      title: t('terms.sections.eligibility.title'),
      icon: <Shield className="w-6 h-6" />,
      content: t('terms.sections.eligibility.content', { returnObjects: true })
    },
    {
      id: 'content',
      title: t('terms.sections.content.title'),
      icon: <FileText className="w-6 h-6" />,
      content: t('terms.sections.content.content', { returnObjects: true })
    },
    {
      id: 'conduct',
      title: t('terms.sections.conduct.title'),
      icon: <Scale className="w-6 h-6" />,
      content: t('terms.sections.conduct.content', { returnObjects: true })
    },
    {
      id: 'intellectual',
      title: t('terms.sections.intellectual.title'),
      icon: <Shield className="w-6 h-6" />,
      content: t('terms.sections.intellectual.content', { returnObjects: true })
    },
    {
      id: 'privacy',
      title: t('terms.sections.privacy.title'),
      icon: <Shield className="w-6 h-6" />,
      content: t('terms.sections.privacy.content', { returnObjects: true })
    },
    {
      id: 'termination',
      title: t('terms.sections.termination.title'),
      icon: <AlertTriangle className="w-6 h-6" />,
      content: t('terms.sections.termination.content', { returnObjects: true })
    },
    {
      id: 'disclaimers',
      title: t('terms.sections.disclaimer.title'),
      icon: <AlertTriangle className="w-6 h-6" />,
      content: t('terms.sections.disclaimer.content', { returnObjects: true })
    },
    {
      id: 'liability',
      title: t('terms.sections.limitation.title'),
      icon: <Scale className="w-6 h-6" />,
      content: t('terms.sections.limitation.content', { returnObjects: true })
    },
    {
      id: 'governing',
      title: t('terms.sections.governing.title'),
      icon: <Gavel className="w-6 h-6" />,
      content: t('terms.sections.governing.content', { returnObjects: true })
    },
    {
      id: 'contact',
      title: t('terms.sections.contact.title'),
      icon: <Users className="w-6 h-6" />,
      content: t('terms.sections.contact.content', { returnObjects: true })
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <FileText className="w-10 h-10 text-primary-500" />
            <h1 className="text-4xl font-bold text-slate-800">{t('terms.title')}</h1>
          </div>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            {t('terms.subtitle')}
          </p>
          <p className="text-sm text-slate-500 mt-4">
            {t('terms.lastUpdated')}
          </p>
        </motion.div>

        {/* 重要提示 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800 mb-2">{t('terms.importantNotice.title')}</h3>
              <p className="text-amber-700 text-sm leading-relaxed">
                {t('terms.importantNotice.content')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* 条款内容 */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
                  {section.icon}
                </div>
                <h2 className="text-2xl font-bold text-slate-800">{section.title}</h2>
              </div>
              
              <div className="space-y-4">
                {section.content.map((paragraph, pIndex) => (
                  <p key={pIndex} className="text-slate-600 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* 联系信息 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.5 }}
          className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl shadow-lg p-8 mt-12 text-white text-center"
        >
          <h2 className="text-2xl font-bold mb-4">{t('terms.needHelp.title')}</h2>
          <p className="mb-6 opacity-90">
            {t('terms.needHelp.content')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:i@mail.iii.pics"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary-600 rounded-lg font-medium hover:bg-slate-50 transition-colors duration-200"
            >
              {t('terms.needHelp.email')}
            </a>
            <div className="inline-flex items-center justify-center px-6 py-3 bg-white/20 backdrop-blur-sm rounded-lg font-medium">
              {t('terms.needHelp.wechat')}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Terms;