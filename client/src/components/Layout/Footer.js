import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Github, Twitter, Mail } from 'lucide-react';
import Logo from '../UI/Logo';

const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="w-full bg-slate-900 text-white">
      <div className="w-full">
        <div className="py-12 px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo和描述 */}
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4">
              <Logo size="lg" showText={true} className="text-white" />
            </div>
            <p className="text-slate-300 mb-6 max-w-md">
              {t('footer.description')}
            </p>
            <div className="flex space-x-4">
              <a href="https://github.com/renqw2023" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors duration-200">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://x.com/renqw5271" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors duration-200">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="mailto:i@mail.iii.pics" className="text-slate-400 hover:text-white transition-colors duration-200">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* 快速链接 */}
          <div>
            <h3 className="font-semibold mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-slate-300 hover:text-white transition-colors duration-200">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link to="/explore" className="text-slate-300 hover:text-white transition-colors duration-200">
                  {t('nav.explore')}
                </Link>
              </li>
              <li>
                <Link to="/create" className="text-slate-300 hover:text-white transition-colors duration-200">
                  {t('nav.create')}
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-slate-300 hover:text-white transition-colors duration-200">
                  {t('nav.about')}
                </Link>
              </li>
            </ul>
          </div>

          {/* 帮助支持 */}
          <div>
            <h3 className="font-semibold mb-4">{t('footer.support')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-slate-300 hover:text-white transition-colors duration-200">
                  {t('nav.help')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-slate-300 hover:text-white transition-colors duration-200">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-slate-300 hover:text-white transition-colors duration-200">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-300 hover:text-white transition-colors duration-200">
                  {t('nav.contact')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 版权信息 */}
        <div className="border-t border-slate-800 pt-8 mt-8 px-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-slate-400 text-sm">
              © 2025 III.PICS. 保留所有权利。
            </p>
            <div className="flex space-x-6 text-sm text-slate-400">
              <Link to="/privacy" className="hover:text-white transition-colors">
                隐私政策
              </Link>
              <Link to="/terms" className="hover:text-white transition-colors">
                服务条款
              </Link>
              <Link to="/contact" className="hover:text-white transition-colors">
                联系我们
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;