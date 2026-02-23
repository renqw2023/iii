import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Github, Twitter, Mail } from 'lucide-react';
import Logo from '../UI/Logo';

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer
      className="w-full"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        borderTop: '1px solid var(--border-color)',
      }}
    >
      <div className="w-full">
        <div className="py-12 px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo & description */}
            <div className="col-span-1 md:col-span-2">
              <div className="mb-4">
                <Logo size="lg" showText={true} />
              </div>
              <p style={{ color: 'var(--text-secondary)' }} className="mb-6 max-w-md">
                {t('footer.description')}
              </p>
              <div className="flex space-x-4">
                <a href="https://github.com/renqw2023" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-tertiary)' }} className="hover:opacity-80 transition-opacity duration-200">
                  <Github className="w-5 h-5" />
                </a>
                <a href="https://x.com/renqw5271" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-tertiary)' }} className="hover:opacity-80 transition-opacity duration-200">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="mailto:i@mail.iii.pics" style={{ color: 'var(--text-tertiary)' }} className="hover:opacity-80 transition-opacity duration-200">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h3 className="font-semibold mb-4">{t('footer.quickLinks')}</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/" style={{ color: 'var(--text-secondary)' }} className="hover:opacity-80 transition-opacity duration-200">
                    {t('nav.home')}
                  </Link>
                </li>
                <li>
                  <Link to="/gallery" style={{ color: 'var(--text-secondary)' }} className="hover:opacity-80 transition-opacity duration-200">
                    {t('nav.gallery', 'Gallery')}
                  </Link>
                </li>
                <li>
                  <Link to="/seedance" style={{ color: 'var(--text-secondary)' }} className="hover:opacity-80 transition-opacity duration-200">
                    {t('nav.seedance', 'Seedance')}
                  </Link>
                </li>
                <li>
                  <Link to="/explore" style={{ color: 'var(--text-secondary)' }} className="hover:opacity-80 transition-opacity duration-200">
                    {t('nav.explore')}
                  </Link>
                </li>
                <li>
                  <Link to="/about" style={{ color: 'var(--text-secondary)' }} className="hover:opacity-80 transition-opacity duration-200">
                    {t('nav.about')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold mb-4">{t('footer.support')}</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/help" style={{ color: 'var(--text-secondary)' }} className="hover:opacity-80 transition-opacity duration-200">
                    {t('nav.help')}
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" style={{ color: 'var(--text-secondary)' }} className="hover:opacity-80 transition-opacity duration-200">
                    {t('footer.privacy')}
                  </Link>
                </li>
                <li>
                  <Link to="/terms" style={{ color: 'var(--text-secondary)' }} className="hover:opacity-80 transition-opacity duration-200">
                    {t('footer.terms')}
                  </Link>
                </li>
                <li>
                  <Link to="/contact" style={{ color: 'var(--text-secondary)' }} className="hover:opacity-80 transition-opacity duration-200">
                    {t('nav.contact')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 mt-8 px-4" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p style={{ color: 'var(--text-tertiary)' }} className="text-sm">
              {t('footer.copyright')}
            </p>
            <div className="flex space-x-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
              <Link to="/privacy" className="hover:opacity-80 transition-opacity">
                {t('footer.privacy')}
              </Link>
              <Link to="/terms" className="hover:opacity-80 transition-opacity">
                {t('footer.terms')}
              </Link>
              <Link to="/contact" className="hover:opacity-80 transition-opacity">
                {t('nav.contact')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;