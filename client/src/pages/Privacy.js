import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, Lock, Database, UserCheck, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Privacy = () => {
  const { t } = useTranslation();
  
  const sections = [
    {
      id: 'overview',
      title: t('privacy.sections.overview.title'),
      icon: <Shield className="w-6 h-6" />,
      content: t('privacy.sections.overview.content', { returnObjects: true })
    },
    {
      id: 'collection',
      title: t('privacy.sections.collection.title'),
      icon: <Database className="w-6 h-6" />,
      content: t('privacy.sections.collection.content', { returnObjects: true })
    },
    {
      id: 'usage',
      title: t('privacy.sections.usage.title'),
      icon: <Eye className="w-6 h-6" />,
      content: t('privacy.sections.usage.content', { returnObjects: true })
    },
    {
      id: 'sharing',
      title: t('privacy.sections.sharing.title'),
      icon: <UserCheck className="w-6 h-6" />,
      content: t('privacy.sections.sharing.content', { returnObjects: true })
    },
    {
      id: 'security',
      title: t('privacy.sections.security.title'),
      icon: <Lock className="w-6 h-6" />,
      content: t('privacy.sections.security.content', { returnObjects: true })
    },
    {
      id: 'rights',
      title: t('privacy.sections.rights.title'),
      icon: <UserCheck className="w-6 h-6" />,
      content: t('privacy.sections.rights.content', { returnObjects: true })
    },
    {
      id: 'retention',
      title: t('privacy.sections.retention.title'),
      icon: <Database className="w-6 h-6" />,
      content: t('privacy.sections.retention.content', { returnObjects: true })
    },
    {
      id: 'international',
      title: t('privacy.sections.international.title'),
      icon: <AlertTriangle className="w-6 h-6" />,
      content: t('privacy.sections.international.content', { returnObjects: true })
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
            <Shield className="w-10 h-10 text-primary-500" />
            <h1 className="text-4xl font-bold text-slate-800">{t('privacy.title')}</h1>
          </div>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            {t('privacy.subtitle')}
          </p>
          <p className="text-sm text-slate-500 mt-4">
            {t('privacy.lastUpdated')}
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
              <h3 className="font-semibold text-amber-800 mb-2">{t('privacy.importantNotice.title')}</h3>
              <p className="text-amber-700 text-sm leading-relaxed">
                {t('privacy.importantNotice.content')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* 政策内容 */}
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
          transition={{ duration: 0.6, delay: 1.0 }}
          className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl shadow-lg p-8 mt-12 text-white text-center"
        >
          <h2 className="text-2xl font-bold mb-4">{t('privacy.contact.title')}</h2>
          <p className="mb-6 opacity-90">
            {t('privacy.contact.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:i@mail.iii.pics"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary-600 rounded-lg font-medium hover:bg-slate-50 transition-colors duration-200"
            >
{t('privacy.contact.email')}
            </a>
            <div className="inline-flex items-center justify-center px-6 py-3 bg-white/20 backdrop-blur-sm rounded-lg font-medium">
{t('privacy.contact.wechat')}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Privacy;