/**
 * ImageGenPanel — 右侧滑出生成面板（阶段29）
 *
 * 特性：
 *   - 模型 Tabs（Gemini Flash / DALL·E 3），根据后端可用性动态渲染
 *   - Prompt 框支持 Gallery/Sref 卡片拖拽瞬时填入（读 application/json prompt 字段，无 API）
 *   - 宽高比选择器：1:1 / 4:3 / 3:4 / 16:9
 *   - 生成按钮含积分成本提示
 *   - 结果区：图片预览 + 下载 + 复制链接
 */
import React, { useState, useEffect, useCallback } from 'react';
import { X, Wand2, Loader2, Download, Link, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { generateAPI } from '../../services/generateApi';

const MUTED   = 'rgba(0,0,0,0.04)';
const MUTED_H = 'rgba(0,0,0,0.07)';
const ASPECT_RATIOS = ['1:1', '4:3', '3:4', '16:9'];

const ImageGenPanel = ({ open, onClose }) => {
  const { isAuthenticated, user, updateUser, openLoginModal } = useAuth();

  const [models, setModels]               = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [prompt, setPrompt]               = useState('');
  const [aspectRatio, setAspectRatio]     = useState('1:1');
  const [isLoading, setIsLoading]         = useState(false);
  const [result, setResult]               = useState(null); // { imageUrl, modelName }
  const [isDragging, setIsDragging]       = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);

  // 面板打开时拉取可用模型
  useEffect(() => {
    if (!open) return;
    setModelsLoading(true);
    generateAPI.getModels()
      .then(list => {
        setModels(list);
        if (list.length > 0 && !selectedModel) {
          setSelectedModel(list[0].id);
        }
      })
      .catch(() => toast.error('无法获取模型列表'))
      .finally(() => setModelsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 面板关闭时重置结果（保留模型/prompt 选择）
  useEffect(() => {
    if (!open) {
      setResult(null);
      setIsDragging(false);
    }
  }, [open]);

  const currentModel = models.find(m => m.id === selectedModel);

  /* ── 拖拽：读取 Gallery/Sref 卡片的 prompt 字段（无 API，瞬时填入）── */
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const jsonData = e.dataTransfer.getData('application/json');
    if (jsonData) {
      try {
        const parsed = JSON.parse(jsonData);
        if (parsed.prompt) {
          setPrompt(parsed.prompt);
          toast.success('Prompt 已填入');
          return;
        }
      } catch (_) { /* ignore */ }
    }
    toast.error('该卡片不包含 Prompt 信息');
  }, []);

  /* ── 生成 ── */
  const handleGenerate = async () => {
    if (!isAuthenticated) { openLoginModal(); return; }
    if (!prompt.trim()) { toast.error('请输入生成描述'); return; }
    if (!selectedModel) { toast.error('请选择生成模型'); return; }

    setIsLoading(true);
    setResult(null);
    try {
      const data = await generateAPI.generateImage({ prompt, modelId: selectedModel, aspectRatio });
      setResult(data);
      updateUser({ credits: data.creditsLeft });
      toast.success(`图片已生成！消耗 ${currentModel?.creditCost} 积分`);
    } catch (err) {
      toast.error(err.response?.data?.message || '生成失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── 下载 ── */
  const handleDownload = () => {
    if (!result?.imageUrl) return;
    const a = document.createElement('a');
    a.href = result.imageUrl;
    a.download = `generated_${Date.now()}.png`;
    a.click();
  };

  /* ── 复制链接 ── */
  const handleCopyUrl = async () => {
    if (!result?.imageUrl) return;
    const fullUrl = `${window.location.origin}${result.imageUrl}`;
    await navigator.clipboard.writeText(fullUrl);
    toast.success('链接已复制');
  };

  const credits = user?.credits ?? 0;
  const canGenerate = !isLoading && !!prompt.trim() && !!selectedModel;

  return (
    <div
      style={{
        position: 'fixed', top: 16, bottom: 16, right: 16,
        width: 340, zIndex: 100,
        transform: open ? 'translateX(0)' : 'translateX(calc(100% + 16px))',
        transition: 'transform 0.2s ease-out',
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      <div style={{
        display: 'flex', flexDirection: 'column', height: '100%',
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
        overflow: 'hidden', padding: 16, gap: 10,
      }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, paddingLeft: 4, paddingRight: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Wand2 size={15} style={{ color: '#6366f1' }} />
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>Generate Image</h2>
          </div>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 8, border: 'none', backgroundColor: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', transition: 'background-color 150ms' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = MUTED; e.currentTarget.style.color = '#6b7280'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9ca3af'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, scrollbarWidth: 'thin', paddingRight: 2 }}>

          {/* ── 模型 Tabs ── */}
          <div style={{ flexShrink: 0 }}>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 6px 2px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Model</p>
            {modelsLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9ca3af', fontSize: 12 }}>
                <Loader2 size={12} className="animate-spin" /> Loading models…
              </div>
            ) : models.length === 0 ? (
              <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>No models available. Please configure API keys.</p>
            ) : (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {models.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedModel(m.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '5px 11px', borderRadius: 99,
                      border: `1.5px solid ${selectedModel === m.id ? '#6366f1' : 'rgba(0,0,0,0.1)'}`,
                      backgroundColor: selectedModel === m.id ? 'rgba(99,102,241,0.08)' : 'transparent',
                      color: selectedModel === m.id ? '#6366f1' : '#374151',
                      fontSize: 12, fontWeight: selectedModel === m.id ? 600 : 400,
                      cursor: 'pointer', transition: 'all 150ms',
                    }}
                  >
                    <span>{m.name}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 2, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 6, padding: '1px 5px', fontSize: 11, color: '#6b7280' }}>
                      <Zap size={9} style={{ color: '#f59e0b' }} />
                      {m.creditCost}
                    </span>
                    {m.badge && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', borderRadius: 4, padding: '1px 4px' }}>{m.badge}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Prompt 框（支持拖拽）── */}
          <div
            style={{
              borderRadius: 14, padding: 12,
              backgroundColor: isDragging ? 'rgba(99,102,241,0.05)' : MUTED,
              border: `1.5px ${isDragging ? 'dashed rgba(99,102,241,0.5)' : 'solid transparent'}`,
              flexShrink: 0, transition: 'all 150ms',
            }}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
          >
            <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 6px 0', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isDragging ? '✦ Release to fill prompt' : 'Prompt'}
            </p>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to create… or drag a Gallery card here"
              style={{
                width: '100%', minHeight: 100, border: 'none', outline: 'none',
                backgroundColor: 'transparent', resize: 'none',
                fontSize: 13, lineHeight: 1.6, color: '#374151', fontFamily: 'inherit',
              }}
            />
          </div>

          {/* ── Aspect Ratio ── */}
          <div style={{ flexShrink: 0 }}>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: '0 0 6px 2px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aspect Ratio</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {ASPECT_RATIOS.map(r => (
                <button
                  key={r}
                  onClick={() => setAspectRatio(r)}
                  style={{
                    flex: 1, height: 30, borderRadius: 8,
                    border: `1.5px solid ${aspectRatio === r ? '#6366f1' : 'rgba(0,0,0,0.10)'}`,
                    backgroundColor: aspectRatio === r ? 'rgba(99,102,241,0.08)' : 'transparent',
                    color: aspectRatio === r ? '#6366f1' : '#6b7280',
                    fontSize: 12, fontWeight: aspectRatio === r ? 600 : 400,
                    cursor: 'pointer', transition: 'all 150ms',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* ── Divider ── */}
          <div style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', flexShrink: 0 }} />

          {/* ── Generate button ── */}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            style={{
              height: 44, borderRadius: 14, border: 'none',
              backgroundColor: '#1B1B1B', color: '#fff',
              fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: canGenerate ? 'pointer' : 'not-allowed',
              opacity: canGenerate ? 1 : 0.45,
              transition: 'transform 150ms, opacity 150ms',
              flexShrink: 0,
            }}
            onMouseEnter={e => { if (canGenerate) e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {isLoading ? (
              <><Loader2 size={14} className="animate-spin" />Generating…</>
            ) : (
              <>
                <Wand2 size={15} />
                <span>Generate</span>
                {currentModel && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 6, padding: '2px 7px' }}>
                    <Zap size={10} style={{ color: '#FFDBA4' }} />
                    <span style={{ fontSize: 12 }}>{currentModel.creditCost}</span>
                  </div>
                )}
              </>
            )}
          </button>

          {/* ── Auth / balance hint ── */}
          {!isAuthenticated ? (
            <p style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', margin: 0, flexShrink: 0 }}>
              <button onClick={openLoginModal} style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', fontSize: 12 }}>
                Sign in
              </button>{' '}to generate images
            </p>
          ) : (
            <p style={{ textAlign: 'center', fontSize: 11, color: '#9ca3af', margin: 0, flexShrink: 0 }}>
              Balance: <strong style={{ color: '#6b7280' }}>{credits}</strong> credits
            </p>
          )}

          {/* ── Result area ── */}
          {result && (
            <div
              style={{
                flexShrink: 0, borderRadius: 14, overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.08)',
                animation: 'fadeIn 0.3s ease-out',
              }}
            >
              <img
                src={result.imageUrl}
                alt="Generated"
                style={{ width: '100%', display: 'block', borderRadius: '14px 14px 0 0' }}
              />
              <div style={{ display: 'flex', gap: 6, padding: 8, backgroundColor: MUTED }}>
                <button
                  onClick={handleDownload}
                  style={{
                    flex: 1, height: 34, borderRadius: 8,
                    border: '1px solid rgba(0,0,0,0.10)',
                    backgroundColor: '#fff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    fontSize: 12, color: '#374151', fontWeight: 500,
                    transition: 'background-color 150ms',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = MUTED_H; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; }}
                >
                  <Download size={13} /> Download
                </button>
                <button
                  onClick={handleCopyUrl}
                  style={{
                    flex: 1, height: 34, borderRadius: 8,
                    border: '1px solid rgba(0,0,0,0.10)',
                    backgroundColor: '#fff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    fontSize: 12, color: '#374151', fontWeight: 500,
                    transition: 'background-color 150ms',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = MUTED_H; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#fff'; }}
                >
                  <Link size={13} /> Copy URL
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ImageGenPanel;
