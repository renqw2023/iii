import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Mail, 
  MessageCircle, 
  Github, 
  Twitter, 
  Send, 
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const Contact = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 模拟发送邮件
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 实际项目中这里应该调用后端API发送邮件
      toast.success(t('contact.sendSuccess'));
      
      // 重置表单
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      toast.error('发送失败，请稍后重试或直接发送邮件至 i@mail.iii.pics');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactMethods = [
    {
      icon: <Mail className="w-6 h-6" />,
      title: t('contact.methods.email.title'),
      description: t('contact.methods.email.description'),
      contact: t('contact.methods.email.contact'),
      action: 'mailto:i@mail.iii.pics',
      color: 'bg-blue-500'
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: t('contact.methods.wechat.title'),
      description: t('contact.methods.wechat.description'),
      contact: t('contact.methods.wechat.contact'),
      action: null,
      color: 'bg-green-500'
    },
    {
      icon: <Github className="w-6 h-6" />,
      title: t('contact.methods.github.title'),
      description: t('contact.methods.github.description'),
      contact: t('contact.methods.github.contact'),
      action: 'https://github.com/renqw2023',
      color: 'bg-gray-800'
    },
    {
      icon: <Twitter className="w-6 h-6" />,
      title: t('contact.methods.twitter.title'),
      description: t('contact.methods.twitter.description'),
      contact: t('contact.methods.twitter.contact'),
      action: 'https://x.com/renqw5271',
      color: 'bg-blue-400'
    }
  ];

  const faqItems = [
    {
      question: t('contact.faq.items.help.question'),
      answer: t('contact.faq.items.help.answer')
    },
    {
      question: t('contact.faq.items.response.question'),
      answer: t('contact.faq.items.response.answer')
    },
    {
      question: t('contact.faq.items.feature.question'),
      answer: t('contact.faq.items.feature.answer')
    },
    {
      question: t('contact.faq.items.bug.question'),
      answer: t('contact.faq.items.bug.answer')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center space-x-3 mb-4">
            <MessageCircle className="w-10 h-10 text-primary-500" />
            <h1 className="text-4xl font-bold text-slate-800">{t('contact.title')}</h1>
          </div>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            {t('contact.subtitle')}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* 联系表单 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('contact.form.title')}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                    {t('contact.form.name')} *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
                    placeholder={t('contact.form.namePlaceholder')}
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    {t('contact.form.email')} *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-2">
                  {t('contact.form.subject')} *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200"
                  placeholder={t('contact.form.subjectPlaceholder')}
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
                  {t('contact.form.message')} *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors duration-200 resize-none"
                  placeholder={t('contact.form.messagePlaceholder')}
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t('contact.form.sending')}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{t('contact.form.sendButton')}</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* 联系方式和信息 */}
          <div className="space-y-8">
            {/* 联系方式 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('contact.methods.title')}</h2>
              
              <div className="space-y-4">
                {contactMethods.map((method, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors duration-200">
                    <div className={`p-3 ${method.color} text-white rounded-lg`}>
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800">{method.title}</h3>
                      <p className="text-sm text-slate-600">{method.description}</p>
                      {method.action ? (
                        <a
                          href={method.action}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          {method.contact}
                        </a>
                      ) : (
                        <span className="text-slate-800 font-medium">{method.contact}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* 常见问题 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <h2 className="text-2xl font-bold text-slate-800 mb-6">{t('contact.faq.title')}</h2>
              
              <div className="space-y-6">
                {faqItems.map((item, index) => (
                  <div key={index} className="border-l-4 border-primary-200 pl-4">
                    <h3 className="font-semibold text-slate-800 mb-2">{item.question}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{item.answer}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Response Time */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl shadow-lg p-6 text-white"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Clock className="w-6 h-6" />
                <h3 className="text-lg font-semibold">Response Time</h3>
              </div>
              <div className="space-y-2 text-sm opacity-90">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Email: Reply within 24 hours</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>微信：工作时间内快速回复</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>紧急问题：请优先使用邮件联系</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;