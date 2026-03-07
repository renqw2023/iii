import React, { useState } from 'react';
import { Languages, Loader2 } from 'lucide-react';
import { translateToZh } from '../../services/translateApi';
import toast from 'react-hot-toast';

/**
 * TranslateButton
 * Props:
 *   text       - 原始英文文本
 *   onTranslated(translated) - 翻译完成回调（可选）
 */
const TranslateButton = ({ text, onTranslated }) => {
  const [loading, setLoading] = useState(false);
  const [translated, setTranslated] = useState('');
  const [showTranslated, setShowTranslated] = useState(false);

  const handleClick = async () => {
    if (showTranslated) {
      // 切换回原文
      setShowTranslated(false);
      onTranslated?.(null);
      return;
    }
    if (translated) {
      // 已有译文，直接显示
      setShowTranslated(true);
      onTranslated?.(translated);
      return;
    }
    if (!text?.trim()) return;
    setLoading(true);
    try {
      const result = await translateToZh(text);
      setTranslated(result);
      setShowTranslated(true);
      onTranslated?.(result);
    } catch {
      toast.error('翻译失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
      style={{
        backgroundColor: showTranslated ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
        color: showTranslated ? '#fff' : 'var(--text-secondary)',
        border: '1px solid var(--border-color)',
        opacity: loading ? 0.7 : 1,
      }}
      title={showTranslated ? '显示原文' : '翻译为中文'}
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Languages size={12} />}
      {showTranslated ? '原文' : '翻译'}
    </button>
  );
};

export default TranslateButton;
