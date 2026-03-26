import React, { useState } from 'react';
import { Languages, Loader2 } from 'lucide-react';
import { translateToEn } from '../../services/translateApi';
import toast from 'react-hot-toast';

/**
 * TranslateButton — translates Chinese source text to English for EU/US users.
 * Props:
 *   text                     - source text (may be Chinese)
 *   onTranslated(translated) - callback with translated text, or null to restore original
 */
const TranslateButton = ({ text, onTranslated }) => {
  const [loading, setLoading] = useState(false);
  const [translated, setTranslated] = useState('');
  const [showTranslated, setShowTranslated] = useState(false);

  const handleClick = async () => {
    if (showTranslated) {
      setShowTranslated(false);
      onTranslated?.(null);
      return;
    }
    if (translated) {
      setShowTranslated(true);
      onTranslated?.(translated);
      return;
    }
    if (!text?.trim()) return;
    setLoading(true);
    try {
      const result = await translateToEn(text);
      setTranslated(result);
      setShowTranslated(true);
      onTranslated?.(result);
    } catch {
      toast.error('Translation failed, please try again');
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
      title={showTranslated ? 'Show original' : 'Translate to English'}
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Languages size={12} />}
      {showTranslated ? 'Original' : 'Translate'}
    </button>
  );
};

export default TranslateButton;
