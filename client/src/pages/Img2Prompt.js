import React, { useState, useRef, useCallback } from 'react';
import { useImg2PromptSEO } from '../hooks/useSEO';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Upload, Copy, Check, Loader2, ImageOff, Coins } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Img2Prompt = () => {
  useImg2PromptSEO();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated, user, updateUser, openLoginModal } = useAuth();
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  const handleFile = (f) => {
    if (!f || !f.type.startsWith('image/')) {
      toast.error(t('img2prompt.toast.imageOnly'));
      return;
    }
    setFile(f);
    setResult('');
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    if (!file) {
      toast.error(t('img2prompt.toast.uploadFirst'));
      return;
    }

    setIsLoading(true);
    setResult('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/tools/img2prompt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      setResult(res.data.prompt);
      updateUser({ credits: res.data.creditsLeft });
      toast.success(t('img2prompt.toast.success'));
    } catch (err) {
      const msg = err.response?.data?.message || t('img2prompt.toast.failed');
      toast.error(msg);
      if (err.response?.status === 402) {
        setTimeout(() => navigate('/credits'), 1500);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success(t('img2prompt.toast.copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen py-12 px-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            {t('img2prompt.title')}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {t('img2prompt.subtitle')}
          </p>
          {isAuthenticated && (
            <p className="text-sm mt-2 flex items-center justify-center gap-1" style={{ color: 'var(--text-tertiary)' }}>
              <Coins size={14} /> {t('img2prompt.credits', { credits: user?.credits ?? 0 })}
            </p>
          )}
        </div>

        {/* Upload zone */}
        <div
          className="relative rounded-2xl border-2 border-dashed transition-colors cursor-pointer mb-6 overflow-hidden"
          style={{
            borderColor: isDragging ? 'var(--accent-primary)' : 'var(--border-color)',
            backgroundColor: isDragging ? 'rgba(99,102,241,0.05)' : 'var(--bg-card)',
            minHeight: preview ? 'auto' : 240,
          }}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
          />

          {preview ? (
            <img
              src={preview}
              alt="preview"
              className="w-full max-h-80 object-contain"
              style={{ display: 'block' }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-60 gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <Upload size={28} style={{ color: 'var(--text-tertiary)' }} />
              </div>
              <div className="text-center">
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{t('img2prompt.upload.label')}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>{t('img2prompt.upload.hint')}</p>
              </div>
            </div>
          )}

          {preview && (
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            >
              <div className="flex flex-col items-center gap-2 text-white">
                <ImageOff size={24} />
                <span className="text-sm">{t('img2prompt.upload.change')}</span>
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isLoading || !file}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity flex items-center justify-center gap-2 mb-8"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: '#fff',
            opacity: isLoading || !file ? 0.6 : 1,
          }}
        >
          {isLoading ? (
            <><Loader2 size={16} className="animate-spin" /> {t('img2prompt.generating')}</>
          ) : (
            <><Upload size={16} /> {t('img2prompt.generate')}</>
          )}
        </button>

        {/* Result */}
        {result && (
          <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{t('img2prompt.result')}</h2>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                style={{
                  backgroundColor: copied ? 'rgba(16,185,129,0.15)' : 'var(--bg-tertiary)',
                  color: copied ? '#10b981' : 'var(--text-secondary)',
                }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? t('common.copied') : t('common.copy')}
              </button>
            </div>
            <p
              className="text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: 'var(--text-primary)', userSelect: 'text' }}
            >
              {result}
            </p>
          </div>
        )}

        {!isAuthenticated && (
          <div className="text-center mt-6">
            <p style={{ color: 'var(--text-secondary)' }}>
              <button
                onClick={openLoginModal}
                className="underline"
                style={{ color: 'var(--accent-primary)' }}
              >
                {t('img2prompt.login')}
              </button>
              {' '}{t('img2prompt.loginPrompt', { loginLink: '' }).replace('<1></1>', '').trim()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Img2Prompt;
