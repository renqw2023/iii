/**
 * Img2PromptPanel — 右侧滑出面板（阶段28）
 *
 * 对标 MeiGen.ai 右侧生成面板：
 * - fixed top-4 bottom-4 right-4，w-[380px]，rounded-3xl
 * - translateX 滑入动画 200ms ease-out
 * - 反推提示词卡（叠层图片预览）+ 拖拽上传区 + 生成 + 结果
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, Copy, Check, Loader2, Image as ImageIcon, Coins } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const Img2PromptPanel = ({ open, onClose }) => {
  const { isAuthenticated, user, updateUser, openLoginModal } = useAuth();
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  // Reset state when closed
  useEffect(() => {
    if (!open) {
      setPreview(null);
      setFile(null);
      setResult('');
      setCopied(false);
      setIsDragging(false);
    }
  }, [open]);

  const handleFile = (f) => {
    if (!f || !f.type.startsWith('image/')) {
      toast.error('请选择图片文件');
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
    if (!isAuthenticated) { openLoginModal(); return; }
    if (!file) { toast.error('请先上传图片'); return; }

    setIsLoading(true);
    setResult('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/tools/img2prompt', formData, {
        headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
      });
      setResult(res.data.prompt);
      updateUser({ credits: res.data.creditsLeft });
      toast.success('Prompt 生成成功！消耗 1 积分');
    } catch (err) {
      const msg = err.response?.data?.message || '生成失败，请重试';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    toast.success('已复制到剪贴板');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed z-[100]"
      style={{
        top: 16, bottom: 16, right: 16,
        width: 380,
        transform: open ? 'translateX(0)' : 'translateX(calc(100% + 16px))',
        transition: 'transform 0.2s ease-out',
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      <div
        className="flex flex-col h-full"
        style={{
          borderRadius: 24,
          backgroundColor: 'var(--bg-secondary)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: '16px 20px 12px' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            图生提示词
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-lg transition-colors duration-150"
            style={{ width: 30, height: 30, border: 'none', cursor: 'pointer',
                     backgroundColor: 'transparent', color: 'var(--text-tertiary)' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--gallery-filter-hover-bg, rgba(0,0,0,0.06))'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto" style={{ padding: '0 12px 16px', scrollbarWidth: 'thin' }}>

          {/* 功能入口卡 */}
          <div
            className="flex items-center justify-between rounded-xl cursor-pointer transition-colors duration-150"
            style={{ height: 64, padding: '0 12px', marginBottom: 8,
                     backgroundColor: 'rgba(0,0,0,0.04)' }}
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.07)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.04)'; }}
          >
            <div className="flex items-center gap-2">
              <ImageIcon size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>反推提示词</p>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>拖拽图片反推画面描述</p>
              </div>
            </div>
            {/* 叠层图预览 */}
            {preview ? (
              <div style={{ position: 'relative', width: 48, height: 32, overflow: 'visible' }}>
                <img src={preview} alt="" style={{
                  position: 'absolute', width: 32, height: 32, borderRadius: 6,
                  objectFit: 'cover', right: 4, bottom: -2, zIndex: 0,
                  transform: 'rotate(-12deg)', transition: 'transform 0.2s ease-out',
                }} />
                <img src={preview} alt="" style={{
                  position: 'absolute', width: 32, height: 32, borderRadius: 6,
                  objectFit: 'cover', right: -2, bottom: -4, zIndex: 1,
                  transition: 'transform 0.2s ease-out',
                }} />
              </div>
            ) : (
              <div style={{ position: 'relative', width: 48, height: 32, overflow: 'visible' }}>
                <div style={{
                  position: 'absolute', width: 32, height: 32, borderRadius: 6,
                  backgroundColor: 'var(--border-color)', right: 4, bottom: -2, zIndex: 0,
                  transform: 'rotate(-12deg)',
                }} />
                <div style={{
                  position: 'absolute', width: 32, height: 32, borderRadius: 6,
                  backgroundColor: 'var(--bg-tertiary, #e5e7eb)', right: -2, bottom: -4, zIndex: 1,
                }} />
              </div>
            )}
          </div>

          {/* 拖拽上传区 */}
          <div
            className="flex items-center justify-between rounded-xl transition-colors duration-150"
            style={{
              height: 64, padding: '0 12px', marginBottom: 12,
              border: `1px dashed ${isDragging ? 'var(--accent-primary)' : 'rgba(0,0,0,0.15)'}`,
              backgroundColor: isDragging ? 'rgba(99,102,241,0.05)' : 'transparent',
              cursor: 'pointer',
            }}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
            />
            <div className="flex items-center gap-2">
              <Upload size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
                  拖拽或上传图片
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>JPG / PNG / WebP</p>
              </div>
            </div>
            {file && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 32, height: 32, borderRadius: 8,
                backgroundColor: 'rgba(0,0,0,0.05)',
                fontSize: 11, color: 'var(--text-tertiary)',
              }}>
                ✓
              </div>
            )}
          </div>

          {/* 积分提示 */}
          {isAuthenticated && (
            <div className="flex items-center gap-1.5 rounded-xl" style={{
              padding: '10px 12px', marginBottom: 12,
              backgroundColor: 'rgba(0,0,0,0.03)',
              fontSize: 12, color: 'var(--text-tertiary)',
            }}>
              <Coins size={13} />
              <span>每次消耗 1 积分 · 余额 {user?.credits ?? 0} 积分</span>
            </div>
          )}

          {/* 生成按钮 */}
          <button
            onClick={handleSubmit}
            disabled={isLoading || !file}
            className="w-full flex items-center justify-center gap-2 rounded-xl font-semibold transition-opacity"
            style={{
              height: 44, fontSize: 14,
              backgroundColor: 'var(--accent-primary, #6366f1)',
              color: '#fff',
              border: 'none', cursor: isLoading || !file ? 'default' : 'pointer',
              opacity: isLoading || !file ? 0.55 : 1,
              marginBottom: 12,
            }}
          >
            {isLoading ? (
              <><Loader2 size={15} className="animate-spin" />正在生成...</>
            ) : (
              <><Upload size={15} />生成 Prompt</>
            )}
          </button>

          {/* Result */}
          {result && (
            <div style={{
              borderRadius: 12, padding: 14,
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
            }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>生成结果</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 rounded-lg transition-colors duration-150"
                  style={{
                    padding: '4px 10px', fontSize: 12, border: 'none', cursor: 'pointer',
                    backgroundColor: copied ? 'rgba(16,185,129,0.12)' : 'var(--bg-tertiary, rgba(0,0,0,0.05))',
                    color: copied ? '#10b981' : 'var(--text-secondary)',
                  }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
              <p style={{
                fontSize: 12, lineHeight: 1.7,
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-wrap', userSelect: 'text', margin: 0,
              }}>
                {result}
              </p>
            </div>
          )}

          {!isAuthenticated && (
            <div className="text-center" style={{ padding: '12px 0' }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                请{' '}
                <button onClick={openLoginModal} style={{ color: 'var(--accent-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                  登录
                </button>
                {' '}后使用（每次消耗 1 积分）
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Img2PromptPanel;
