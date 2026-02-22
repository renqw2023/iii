import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  HelpCircle, 
  Search, 
  Plus, 
  Heart, 
  User, 
  ChevronDown, 
  ChevronRight,
  Sparkles,
  MessageCircle,
  Palette
} from 'lucide-react';
// 移除未使用的导入: Upload, Settings, Image, Tag, Sliders

const Help = () => {
  const { t } = useTranslation();
  const [openSection, setOpenSection] = useState(null);

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const faqData = [
    {
      id: 'getting-started',
      title: t('help.sections.gettingStarted.title'),
      icon: <Sparkles className="w-5 h-5" />,
      items: [
        {
          question: t('help.sections.gettingStarted.questions.howToRegister.question'),
          answer: t('help.sections.gettingStarted.questions.howToRegister.answer')
        },
        {
          question: t('help.sections.gettingStarted.questions.howToLogin.question'),
          answer: t('help.sections.gettingStarted.questions.howToLogin.answer')
        },
        {
          question: t('help.sections.gettingStarted.questions.firstSteps.question'),
          answer: t('help.sections.gettingStarted.questions.firstSteps.answer')
        }
      ]
    },
    {
      id: 'creating-posts',
      title: t('help.sections.creatingPosts.title'),
      icon: <Plus className="w-5 h-5" />,
      items: [
        {
          question: t('help.sections.creatingPosts.questions.howToPost.question'),
          answer: t('help.sections.creatingPosts.questions.howToPost.answer')
        },
        {
          question: t('help.sections.creatingPosts.questions.supportedFormats.question'),
          answer: t('help.sections.creatingPosts.questions.supportedFormats.answer')
        },
        {
          question: t('help.sections.creatingPosts.questions.addingParams.question'),
          answer: t('help.sections.creatingPosts.questions.addingParams.answer')
        },
        {
          question: t('help.sections.creatingPosts.questions.editPosts.question'),
          answer: t('help.sections.creatingPosts.questions.editPosts.answer')
        }
      ]
    },
    {
      id: 'browsing',
      title: t('help.sections.browsing.title'),
      icon: <Search className="w-5 h-5" />,
      items: [
        {
          question: t('help.sections.browsing.questions.howToSearch.question'),
          answer: t('help.sections.browsing.questions.howToSearch.answer')
        },
        {
          question: t('help.sections.browsing.questions.usingTags.question'),
          answer: t('help.sections.browsing.questions.usingTags.answer')
        },
        {
          question: t('help.sections.browsing.questions.featuredWorks.question'),
          answer: t('help.sections.browsing.questions.featuredWorks.answer')
        }
      ]
    },
    {
      id: 'interaction',
      title: t('help.sections.interaction.title'),
      icon: <Heart className="w-5 h-5" />,
      items: [
        {
          question: t('help.sections.interaction.questions.howToFavorite.question'),
          answer: t('help.sections.interaction.questions.howToFavorite.answer')
        },
        {
          question: t('help.sections.interaction.questions.howToFollow.question'),
          answer: t('help.sections.interaction.questions.howToFollow.answer')
        },
        {
          question: t('help.sections.interaction.questions.howToComment.question'),
          answer: t('help.sections.interaction.questions.howToComment.answer')
        },
        {
          question: t('help.sections.interaction.questions.howToShare.question'),
          answer: t('help.sections.interaction.questions.howToShare.answer')
        }
      ]
    },
    {
      id: 'profile',
      title: t('help.sections.profile.title'),
      icon: <User className="w-5 h-5" />,
      items: [
        {
          question: t('help.sections.profile.questions.editProfile.question'),
          answer: t('help.sections.profile.questions.editProfile.answer')
        },
        {
          question: t('help.sections.profile.questions.changePassword.question'),
          answer: t('help.sections.profile.questions.changePassword.answer')
        },
        {
          question: t('help.sections.profile.questions.viewStats.question'),
          answer: t('help.sections.profile.questions.viewStats.answer')
        }
      ]
    },
    {
      id: 'midjourney-params',
      title: t('help.sections.midjourneyParams.title'),
      icon: <Palette className="w-5 h-5" />,
      items: [
        {
          question: t('help.sections.midjourneyParams.questions.whatAreParams.question'),
          answer: t('help.sections.midjourneyParams.questions.whatAreParams.answer')
        },
        {
          question: t('help.sections.midjourneyParams.questions.basicFormat.question'),
          answer: t('help.sections.midjourneyParams.questions.basicFormat.answer')
        },
        {
          question: t('help.sections.midjourneyParams.questions.versionParam.question'),
          answer: t('help.sections.midjourneyParams.questions.versionParam.answer')
        },
        {
          question: t('help.sections.midjourneyParams.questions.aspectRatio.question'),
          answer: t('help.sections.midjourneyParams.questions.aspectRatio.answer')
        }
      ]
    },
    {
      id: 'prompt-library',
      title: t('help.sections.promptLibrary.title'),
      icon: <Sparkles className="w-5 h-5" />,
      items: [
        {
          question: t('help.sections.promptLibrary.questions.whatIsPromptLibrary.question'),
          answer: t('help.sections.promptLibrary.questions.whatIsPromptLibrary.answer')
        },
        {
          question: t('help.sections.promptLibrary.questions.howToCreatePrompt.question'),
          answer: t('help.sections.promptLibrary.questions.howToCreatePrompt.answer')
        },
        {
          question: t('help.sections.promptLibrary.questions.promptCategories.question'),
          answer: t('help.sections.promptLibrary.questions.promptCategories.answer')
        },
        {
          question: t('help.sections.promptLibrary.questions.difficultyLevels.question'),
          answer: t('help.sections.promptLibrary.questions.difficultyLevels.answer')
        },
        {
          question: t('help.sections.promptLibrary.questions.howToUsePrompts.question'),
          answer: t('help.sections.promptLibrary.questions.howToUsePrompts.answer')
        },
        {
          question: t('help.sections.promptLibrary.questions.promptTips.question'),
          answer: t('help.sections.promptLibrary.questions.promptTips.answer')
        }
      ]
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
            <HelpCircle className="w-10 h-10 text-primary-500" />
            <h1 className="text-4xl font-bold text-slate-800">{t('help.title')}</h1>
          </div>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            {t('help.subtitle')}
          </p>
        </motion.div>

        {/* 快速导航 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-8"
        >
          <h2 className="text-xl font-bold text-slate-800 mb-4">{t('help.quickNavigation')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {faqData.map((section) => (
              <button
                key={section.id}
                onClick={() => toggleSection(section.id)}
                className="flex items-center space-x-2 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors duration-200 text-left"
              >
                {section.icon}
                <span className="font-medium text-slate-700">{section.title}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* FAQ 内容 */}
        <div className="space-y-4">
          {faqData.map((section, sectionIndex) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 + sectionIndex * 0.1 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-slate-50 transition-colors duration-200"
              >
                <div className="flex items-center space-x-3">
                  {section.icon}
                  <h2 className="text-xl font-bold text-slate-800">{section.title}</h2>
                </div>
                {openSection === section.id ? (
                  <ChevronDown className="w-5 h-5 text-slate-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-500" />
                )}
              </button>
              
              {openSection === section.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-slate-100"
                >
                  <div className="p-6 space-y-6">
                    {section.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="border-l-4 border-primary-200 pl-4">
                        <h3 className="font-semibold text-slate-800 mb-2">{item.question}</h3>
                        <p className="text-slate-600 leading-relaxed">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* 联系支持 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl shadow-lg p-8 mt-12 text-white text-center"
        >
          <h2 className="text-2xl font-bold mb-4">{t('help.contact.title')}</h2>
          <p className="mb-6 opacity-90">
            {t('help.contact.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:i@mail.iii.pics"
              className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary-600 rounded-lg font-medium hover:bg-slate-50 transition-colors duration-200"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              {t('help.contact.emailButton')}
            </a>
            <div className="inline-flex items-center justify-center px-6 py-3 bg-white/20 backdrop-blur-sm rounded-lg font-medium">
              <MessageCircle className="w-4 h-4 mr-2" />
              {t('help.contact.wechat')}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Help;