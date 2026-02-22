import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, Download, Copy } from 'lucide-react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import { getUserAvatar, DEFAULT_FALLBACK_AVATAR } from '../../utils/avatarUtils';

const ShareCard = ({ isOpen, onClose, post }) => {
  const { t } = useTranslation();
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef(null);
  const currentUrl = window.location.href;

  // 生成二维码
  useEffect(() => {
    if (isOpen && currentUrl) {
      QRCode.toDataURL(currentUrl, {
        width: 120,
        margin: 1,
        color: {
          dark: '#1e293b',
          light: '#ffffff'
        }
      })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error('Failed to generate QR code:', err));
    }
  }, [isOpen, currentUrl]);

  // 生成卡片图片
  const generateCardImage = async () => {
    if (!cardRef.current) return;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      });
      
      // 转换为blob并下载
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${post?.title || 'share-card'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(t('shareCard.messages.cardSaved'));
      }, 'image/png');
    } catch (error) {
      console.error('Failed to generate card image:', error);
      toast.error(t('shareCard.messages.generateFailed'));
    } finally {
      setIsGenerating(false);
    }
  };

  // 复制链接
  const copyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    toast.success(t('shareCard.messages.linkCopied'));
  };

  if (!isOpen || !post) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h3 className="text-xl font-bold text-slate-800">{t('shareCard.title')}</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* 卡片预览 */}
          <div className="p-6">
            <div
              ref={cardRef}
              className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-3 border border-slate-200 shadow-lg"
            >
              {/* 作品图片 - 占据上半部分全部空间 */}
              <div className="relative mb-3 rounded-xl overflow-hidden shadow-md">
                {post.media && post.media[0] ? (
                  post.media[0].type === 'video' ? (
                    <video
                      src={post.media[0].url}
                      className="w-full h-[28rem] object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={post.media[0].url}
                      alt={post.title}
                      className="w-full h-[28rem] object-cover"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        console.error(t('shareCard.errors.imageLoadFailed'), e.target.src);
                        e.target.style.display = 'none';
                      }}
                    />
                  )
                ) : (
                  <div className="w-full h-[28rem] bg-slate-200 flex items-center justify-center">
                    <span className="text-slate-500">{t('shareCard.noImage')}</span>
                  </div>
                )}
                
                {/* 顶部半透明覆盖层 - 用户信息 */}
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/50 to-transparent p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <img
                        src={getUserAvatar(post.author)}
                        alt={post.author?.username || t('shareCard.user')}
                        className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                        onError={(e) => {
                          e.target.src = DEFAULT_FALLBACK_AVATAR;
                        }}
                      />
                      <div>
                        <p className="font-medium text-white text-xs drop-shadow-lg">
                          {post.author?.username || t('shareCard.anonymousUser')}
                        </p>
                        <p className="text-xs text-white/80 drop-shadow-lg">III.PICS</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/80 drop-shadow-lg">{t('shareCard.scanToView')}</p>
                      {qrCodeUrl && (
                        <img
                          src={qrCodeUrl}
                          alt={t('shareCard.qrCode')}
                          className="w-16 h-16 mt-1 rounded-lg border border-white/30 shadow-lg"
                        />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 底部半透明覆盖层 - 标题 */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                  <h4 className="font-bold text-white text-lg leading-tight drop-shadow-lg">
                    {post.title}
                  </h4>
                </div>
              </div>



              {/* 底部信息 */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 px-3">
                <div className="flex items-center space-x-4 text-xs text-slate-500">
                  <span>❤️ {post.likesCount || 0}</span>
                  <span>👁️ {post.viewsCount || 0}</span>
                </div>
                <div className="text-xs text-slate-400">
                  iii.pics
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={generateCardImage}
                disabled={isGenerating}
                className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span>{isGenerating ? t('shareCard.generating') : t('shareCard.saveCard')}</span>
              </button>
              
              <button
                onClick={copyLink}
                className="flex-1 flex items-center justify-center space-x-2 bg-slate-100 text-slate-700 px-4 py-3 rounded-xl font-medium hover:bg-slate-200 transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>{t('shareCard.copyLink')}</span>
              </button>
            </div>

            {/* 提示文字 */}
            <p className="text-center text-xs text-slate-500 mt-4">
              {t('shareCard.description')}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ShareCard;