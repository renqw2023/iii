import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Github, Twitter, Mail, MessageCircle, Heart, Users, Target } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const About = () => {
  const { t } = useTranslation();
  
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
            <Sparkles className="w-10 h-10 text-primary-500" />
            <h1 className="text-4xl font-bold text-slate-800">{t('about.title')}</h1>
          </div>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            {t('about.subtitle')}
          </p>
        </motion.div>

        {/* 项目介绍 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Target className="w-6 h-6 text-primary-500" />
            <h2 className="text-2xl font-bold text-slate-800">{t('about.vision.title')}</h2>
          </div>
          <p className="text-slate-600 leading-relaxed mb-6">
            {t('about.vision.description')}
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <Users className="w-8 h-8 text-primary-500 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800 mb-2">{t('about.features.community.title')}</h3>
              <p className="text-sm text-slate-600">{t('about.features.community.description')}</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <Sparkles className="w-8 h-8 text-primary-500 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800 mb-2">{t('about.features.creativity.title')}</h3>
              <p className="text-sm text-slate-600">{t('about.features.creativity.description')}</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-xl">
              <Heart className="w-8 h-8 text-primary-500 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-800 mb-2">{t('about.features.service.title')}</h3>
              <p className="text-sm text-slate-600">{t('about.features.service.description')}</p>
            </div>
          </div>
        </motion.div>

        {/* 开发者信息 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Users className="w-6 h-6 text-primary-500" />
            <h2 className="text-2xl font-bold text-slate-800">{t('about.team.title')}</h2>
          </div>
          
          <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
            <div className="flex-shrink-0">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">COOLAI</span>
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-slate-800 mb-2">COOLAI (renqw)</h3>
              <p className="text-slate-600 mb-4">
                {t('about.team.description')}
              </p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <a 
                  href="https://github.com/renqw2023" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-200"
                >
                  <Github className="w-4 h-4" />
                  <span className="text-sm font-medium">GitHub</span>
                </a>
                
                <a 
                  href="https://x.com/renqw5271" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-200"
                >
                  <Twitter className="w-4 h-4" />
                  <span className="text-sm font-medium">Twitter</span>
                </a>
                
                <a 
                  href="mailto:i@mail.iii.pics"
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors duration-200"
                >
                  <Mail className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('about.team.email')}</span>
                </a>
                
                <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 rounded-lg">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">{t('about.team.wechat')}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 技术栈 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('about.tech.title')}</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-slate-700 mb-3">{t('about.tech.frontend')}</h3>
              <div className="flex flex-wrap gap-2">
                {['React', 'Tailwind CSS', 'Framer Motion', 'React Query', 'React Router'].map((tech) => (
                  <span key={tech} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-slate-700 mb-3">{t('about.tech.backend')}</h3>
              <div className="flex flex-wrap gap-2">
                {['Node.js', 'Express', 'MongoDB', 'JWT', 'Multer'].map((tech) => (
                  <span key={tech} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default About;