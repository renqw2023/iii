import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Wand2, Clock, ExternalLink, RefreshCw, Trash2, ArrowDownToLine } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useGeneration } from '../../contexts/GenerationContext';
import { generateAPI } from '../../services/generateApi';
import { generationHistoryAPI } from '../../services/generationHistoryApi';
import GenerationCard from '../UI/GenerationCard';

function recordToJob(rec) {
  const isVideo = rec.mediaType === 'video';
  return {
    id: rec._id, status: rec.status === 'error' ? 'error' : 'success', progress: 100,
    prompt: rec.prompt, modelId: rec.modelId, modelName: rec.modelName,
    aspectRatio: rec.aspectRatio || (isVideo ? '16:9' : '1:1'),
    mediaType: rec.mediaType || 'image', generateAudio: rec.generateAudio || false,
    result: isVideo ? { videoUrl: rec.videoUrl } : { imageUrl: rec.imageUrl },
    imageUrl: rec.imageUrl, videoUrl: rec.videoUrl,
    errorMessage: rec.errorMsg || '', startedAt: new Date(rec.createdAt),
  };
}

const ResultsPanel = ({ triggerRefresh }) => {
  const { isAuthenticated, updateUser } = useAuth();
  const { activeGenerations, addGeneration, updateGeneration, removeGeneration } = useGeneration();
  const navigate = useNavigate();

  const [records, setRecords]     = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistory = useCallback(async (completedJobs) => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await generationHistoryAPI.getHistory({ limit: 20 });
      const newRecords = data.records || [];
      setRecords(newRecords);
      if (completedJobs?.length) {
        const dbUrls = new Set(newRecords.flatMap(r => [r.videoUrl, r.imageUrl].filter(Boolean)));
        completedJobs.forEach(g => {
          const url = g.result?.videoUrl || g.result?.imageUrl || g.videoUrl || g.imageUrl;
          if (url && dbUrls.has(url)) removeGeneration(g.id);
        });
      }
    } catch { /* silent */ } finally { setIsLoading(false); }
  }, [isAuthenticated, removeGeneration]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  useEffect(() => { if (triggerRefresh > 0) fetchHistory(); }, [triggerRefresh, fetchHistory]);

  useEffect(() => {
    const justFinished = activeGenerations.filter(g => g.status === 'success' && g._fetched !== true);
    if (justFinished.length > 0) {
      justFinished.forEach(g => updateGeneration(g.id, { _fetched: true }));
      fetchHistory(justFinished);
    }
  }, [activeGenerations, fetchHistory, updateGeneration]);

  const handleDownload = async (job) => {
    const isVideo = job.mediaType === 'video';
    const url = isVideo ? (job.result?.videoUrl || job.videoUrl) : (job.result?.imageUrl || job.imageUrl);
    if (!url) return;
    if (isVideo) { window.open(url, '_blank', 'noopener'); toast.success('Video opened in new tab — right-click to save'); return; }
    try {
      const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
      const res = await fetch(fullUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = blobUrl; a.download = `iii_${Date.now()}.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch { const a = document.createElement('a'); a.href = url; a.download = `iii_${Date.now()}.png`; a.click(); }
  };

  const handleCopyUrl = async (job) => {
    const isVideo = job.mediaType === 'video';
    const url = isVideo ? (job.result?.videoUrl || job.videoUrl) : (job.result?.imageUrl || job.imageUrl);
    if (!url) return;
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    await navigator.clipboard.writeText(fullUrl);
    toast.success('URL copied');
  };

  const handleRetry = useCallback((job) => {
    removeGeneration(job.id);
    const newJobId = Date.now().toString();
    const isVideo = job.mediaType === 'video';
    if (isVideo) {
      addGeneration({ id: newJobId, status: 'loading', progress: 8, prompt: job.prompt, modelId: job.modelId, modelName: job.modelName, aspectRatio: job.aspectRatio || '16:9', mediaType: 'video', generateAudio: job.generateAudio || false, result: null, errorMessage: '', startedAt: new Date() });
      generateAPI.generateVideo({ prompt: job.prompt, modelKey: job.modelId, duration: job.duration || 5, resolution: job.resolution || '720p', ratio: job.aspectRatio || '16:9', generateAudio: job.generateAudio || false })
        .then(data => { updateGeneration(newJobId, { status: 'success', progress: 100, result: { videoUrl: data.videoUrl }, videoUrl: data.videoUrl }); if (data.creditsLeft !== undefined) updateUser({ credits: data.creditsLeft, freeCredits: data.freeCreditsLeft }); })
        .catch(err => { updateGeneration(newJobId, { status: 'error', errorMessage: err.response?.data?.message || 'Video generation failed' }); });
      return;
    }
    addGeneration({ id: newJobId, status: 'loading', progress: 8, prompt: job.prompt, modelId: job.modelId, modelName: job.modelName, aspectRatio: job.aspectRatio || '1:1', resolution: job.resolution || '2K', mediaType: 'image', result: null, errorMessage: '', startedAt: new Date() });
    generateAPI.generateImage({ modelId: job.modelId, prompt: job.prompt, aspectRatio: job.aspectRatio || '1:1', resolution: job.resolution || '2K', ...(job.referenceImageUrl ? { referenceImageUrl: job.referenceImageUrl } : {}) })
      .then(data => { updateGeneration(newJobId, { status: 'success', progress: 100, result: data }); if (data.creditsLeft !== undefined) updateUser({ credits: data.creditsLeft, freeCredits: data.freeCreditsLeft }); })
      .catch(err => { updateGeneration(newJobId, { status: 'error', errorMessage: err.response?.data?.message || 'Generation failed' }); });
  }, [addGeneration, updateGeneration, removeGeneration, updateUser]);

  const handleDelete = async (recId) => {
    try { await generationHistoryAPI.deleteRecord(recId); setRecords(prev => prev.filter(r => r._id !== recId)); toast.success('Deleted'); }
    catch { toast.error('Delete failed'); }
  };

  const isEmpty = !isLoading && activeGenerations.length === 0 && records.length === 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Clock size={14} style={{ color: '#9ca3af' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Results</span>
          {activeGenerations.length > 0 && (
            <span style={{ fontSize: 11, backgroundColor: '#6366f1', color: '#fff', borderRadius: 99, padding: '1px 7px', fontWeight: 600 }}>
              {activeGenerations.length} running
            </span>
          )}
        </div>
        <button onClick={() => navigate('/generate-history')}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontSize: 12, fontWeight: 500 }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.75'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
          <ExternalLink size={12} /> All History
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin' }}>
        {isEmpty && !isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 10, color: '#d1d5db' }}>
            <Wand2 size={36} style={{ opacity: 0.4 }} />
            <p style={{ fontSize: 13, color: '#9ca3af', margin: 0, textAlign: 'center' }}>
              Your generated images & videos will appear here
            </p>
            <p style={{ fontSize: 11, color: '#d1d5db', margin: 0 }}>
              {isAuthenticated ? 'Fill in a prompt and click Generate to start' : 'Sign in to start generating'}
            </p>
          </div>
        )}

        {isLoading && records.length === 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ borderRadius: 14, backgroundColor: '#f3f4f6', paddingBottom: '100%', position: 'relative', animation: 'pulse 1.5s ease infinite' }} />
            ))}
          </div>
        )}

        {activeGenerations.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>In Progress</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
              {activeGenerations.map(g => (
                <GenerationCard
                  key={g.id} job={g} isActive
                  onRetry={handleRetry}
                  onDownload={handleDownload}
                  onCopyUrl={handleCopyUrl}
                  onDismiss={() => removeGeneration(g.id)}
                />
              ))}
            </div>
          </div>
        )}

        {records.length > 0 && (
          <div>
            {activeGenerations.length > 0 && <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent</p>}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
              {records.map(rec => (
                <GenerationCard
                  key={rec._id} job={recordToJob(rec)} isActive={false}
                  onRetry={handleRetry}
                  onDownload={handleDownload}
                  onCopyUrl={handleCopyUrl}
                  onDelete={() => handleDelete(rec._id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsPanel;
