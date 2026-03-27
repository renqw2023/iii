import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useGeneration } from '../contexts/GenerationContext';
import { generationHistoryAPI } from '../services/generationHistoryApi';
import { generateAPI } from '../services/generateApi';
import GenerationCard from '../components/UI/GenerationCard';

/* ── Date grouping ── */
function groupByDate(records) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const groups = {};

  records.forEach(r => {
    const d = new Date(r.createdAt); d.setHours(0, 0, 0, 0);
    let label;
    if (d >= today) label = 'Today';
    else if (d >= yesterday) label = 'Yesterday';
    else label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!groups[label]) groups[label] = [];
    groups[label].push(r);
  });

  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

/* ── DB record → job shape ── */
function recordToJob(rec) {
  const isVideo = rec.mediaType === 'video';
  return {
    id: rec._id,
    status: rec.status === 'error' ? 'error' : 'success',
    progress: 100,
    prompt: rec.prompt,
    modelId: rec.modelId,
    modelName: rec.modelName,
    aspectRatio: rec.aspectRatio || (isVideo ? '16:9' : '1:1'),
    mediaType: rec.mediaType || 'image',
    generateAudio: rec.generateAudio || false,
    result: isVideo ? { videoUrl: rec.videoUrl } : { imageUrl: rec.imageUrl },
    imageUrl: rec.imageUrl,
    videoUrl: rec.videoUrl,
    errorMessage: rec.errorMsg || '',
    startedAt: new Date(rec.createdAt),
  };
}

/* ── Group header ── */
const GroupHeader = ({ label }) => (
  <p style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
    {label}
  </p>
);

/* ── Card grid ── */
const CardGrid = ({ children, minCardWidth = 220 }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))`,
    gap: 12,
    marginBottom: 24,
  }}>
    {children}
  </div>
);

/* ── Skeleton loader ── */
const SkeletonCard = () => (
  <div style={{
    borderRadius: 14, backgroundColor: '#f3f4f6',
    paddingBottom: '100%', position: 'relative',
    animation: 'pulse 1.5s ease infinite',
  }} />
);

const GenerateHistory = () => {
  const { isAuthenticated, openLoginModal, updateUser } = useAuth();
  const { activeGenerations, addGeneration, updateGeneration, removeGeneration, setPrefill } = useGeneration();
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaFilter, setMediaFilter] = useState('all'); // 'all' | 'image' | 'video'

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Fetch history; if completedJobs provided, remove those that are now confirmed in DB.
  // This prevents duplication: once a job is saved to DB it moves from active→history section.
  const fetchHistory = useCallback(async (completedJobs) => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await generationHistoryAPI.getHistory({ limit: 50 });
      const newRecords = data.records || [];
      setRecords(newRecords);

      if (completedJobs?.length) {
        // Build a set of all URLs now in DB
        const dbUrls = new Set(
          newRecords.flatMap(r => [r.videoUrl, r.imageUrl].filter(Boolean))
        );
        // Remove active jobs confirmed in DB — they'll display in the date-grouped section
        completedJobs.forEach(g => {
          const url = g.result?.videoUrl || g.result?.imageUrl || g.videoUrl || g.imageUrl;
          if (url && dbUrls.has(url)) removeGeneration(g.id);
        });
      }
    } catch {
      // silent — still show active generations
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, removeGeneration]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Refresh history when an active generation succeeds
  useEffect(() => {
    const justFinished = activeGenerations.filter(g => g.status === 'success' && g._fetched !== true);
    if (justFinished.length > 0) {
      justFinished.forEach(g => updateGeneration(g.id, { _fetched: true }));
      fetchHistory(justFinished);
    }
  }, [activeGenerations, fetchHistory, updateGeneration]);

  const handleDownload = async (job) => {
    const isVideo = job.mediaType === 'video';
    const url = isVideo
      ? (job.result?.videoUrl || job.videoUrl)
      : (job.result?.imageUrl || job.imageUrl);
    if (!url) return;

    if (isVideo) {
      // External CDN URL — open in new tab (CORS prevents direct blob download)
      window.open(url, '_blank', 'noopener');
      toast.success('Video opened in new tab — right-click to save');
      return;
    }

    // Use fetch → blob → objectURL for reliable download across all browsers
    try {
      const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
      const res = await fetch(fullUrl);
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `iii_generated_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: direct anchor download
      const a = document.createElement('a');
      a.href = url;
      a.download = `iii_generated_${Date.now()}.png`;
      a.click();
    }
  };

  const handleCopyUrl = async (job) => {
    const isVideo = job.mediaType === 'video';
    const url = isVideo
      ? (job.result?.videoUrl || job.videoUrl)
      : (job.result?.imageUrl || job.imageUrl);
    if (!url) return;
    // External CDN URLs are already absolute; local image paths need origin prefix
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    await navigator.clipboard.writeText(fullUrl);
    toast.success('URL copied');
  };

  const handleRetry = useCallback((job) => {
    // Remove failed card
    removeGeneration(job.id);

    const newJobId = Date.now().toString();
    const isVideo = job.mediaType === 'video';

    if (isVideo) {
      addGeneration({
        id: newJobId, status: 'loading', progress: 8,
        prompt: job.prompt, modelId: job.modelId, modelName: job.modelName,
        aspectRatio: job.aspectRatio || '16:9', mediaType: 'video',
        generateAudio: job.generateAudio || false,
        result: null, errorMessage: '', startedAt: new Date(),
      });
      generateAPI.generateVideo({
        prompt: job.prompt,
        modelKey: job.modelId,
        duration: job.duration || 5,
        resolution: job.resolution || '720p',
        ratio: job.aspectRatio || '16:9',
        generateAudio: job.generateAudio || false,
      }).then(data => {
        updateGeneration(newJobId, { status: 'success', progress: 100, result: { videoUrl: data.videoUrl }, videoUrl: data.videoUrl });
        if (data.creditsLeft !== undefined) updateUser({ credits: data.creditsLeft, freeCredits: data.freeCreditsLeft });
      }).catch(err => {
        updateGeneration(newJobId, { status: 'error', errorMessage: err.response?.data?.message || 'Video generation failed' });
      });
      return;
    }

    // Image retry
    addGeneration({
      id: newJobId, status: 'loading', progress: 8,
      prompt: job.prompt, modelId: job.modelId, modelName: job.modelName,
      aspectRatio: job.aspectRatio || '1:1', resolution: job.resolution || '2K',
      mediaType: 'image', result: null, errorMessage: '', startedAt: new Date(),
    });
    generateAPI.generateImage({
      modelId: job.modelId,
      prompt: job.prompt,
      aspectRatio: job.aspectRatio || '1:1',
      resolution: job.resolution || '2K',
      ...(job.referenceImageUrl ? { referenceImageUrl: job.referenceImageUrl } : {}),
    }).then(data => {
      updateGeneration(newJobId, { status: 'success', progress: 100, result: data });
      if (data.creditsLeft !== undefined) updateUser({ credits: data.creditsLeft, freeCredits: data.freeCreditsLeft });
    }).catch(err => {
      updateGeneration(newJobId, { status: 'error', errorMessage: err.response?.data?.message || 'Generation failed. Please try again.' });
    });
  }, [addGeneration, updateGeneration, removeGeneration, updateUser]);

  const handleUseIdea = (rec) => {
    setPrefill({
      prompt: rec.prompt,
      modelId: rec.modelId,
      aspectRatio: rec.aspectRatio || '1:1',
    });
    toast.success('Prompt filled — check the Generate panel');
  };

  const handleDelete = async (recId) => {
    try {
      await generationHistoryAPI.deleteRecord(recId);
      setRecords(prev => prev.filter(r => r._id !== recId));
      toast.success('Deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const filteredRecords = mediaFilter === 'all' ? records
    : records.filter(r => (r.mediaType || 'image') === mediaFilter);
  const filteredActive = mediaFilter === 'all' ? activeGenerations
    : activeGenerations.filter(g => (g.mediaType || 'image') === mediaFilter);
  const groupedRecords = groupByDate(filteredRecords);

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
        <Wand2 size={32} style={{ color: '#d1d5db' }} />
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Please sign in to view your generation history</p>
        <button
          onClick={openLoginModal}
          style={{ padding: '8px 20px', borderRadius: 10, backgroundColor: '#111827', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
        >
          Sign In
        </button>
      </div>
    );
  }

  const isEmpty = !isLoading && filteredActive.length === 0 && filteredRecords.length === 0;

  return (
    <div style={{ minHeight: '100vh', padding: 0, background: 'var(--page-bg)' }}>
      {/* Floating white card */}
      <div style={{
        margin: 16,
        marginRight: isMobile ? 16 : 'calc(320px + 32px)',
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(48px)',
        WebkitBackdropFilter: 'blur(48px)',
        border: '1px solid rgba(0,0,0,0.07)',
        boxShadow: '0 2px 24px rgba(0,0,0,0.07)',
        overflow: 'hidden',
        minHeight: 'calc(100vh - 32px)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 16px 12px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#6b7280', fontSize: 13, padding: '4px 8px 4px 2px',
                borderRadius: 8,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#111827'; e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <ArrowLeft size={15} />
              <span>Back</span>
            </button>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Generation History</span>
          </div>

          {/* Media type filter */}
          <div style={{ display: 'flex', gap: 4, padding: '3px', backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 9 }}>
            {[
              { key: 'all',   label: 'All' },
              { key: 'image', label: 'Images' },
              { key: 'video', label: 'Videos' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setMediaFilter(key)}
                style={{
                  padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: mediaFilter === key ? 600 : 400,
                  backgroundColor: mediaFilter === key ? '#fff' : 'transparent',
                  color: mediaFilter === key ? '#111827' : '#9ca3af',
                  boxShadow: mediaFilter === key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 150ms',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Scroll content */}
        <div style={{ padding: '16px 16px 80px' }}>

          {/* Active generations (from GenerationContext) */}
          {filteredActive.length > 0 && (
            <section>
              <GroupHeader label="Generating" />
              <CardGrid minCardWidth={filteredActive.every(j => j.mediaType === 'video') ? (isMobile ? 320 : 340) : (isMobile ? 160 : 220)}>
                {filteredActive.map(job => (
                  <GenerationCard
                    key={job.id}
                    job={job}
                    isActive
                    onRetry={() => handleRetry(job)}
                    onDownload={() => handleDownload(job)}
                    onCopyUrl={() => handleCopyUrl(job)}
                    onDismiss={() => removeGeneration(job.id)}
                  />
                ))}
              </CardGrid>
            </section>
          )}

          {/* DB history grouped by date */}
          {groupedRecords.map(({ label, items }) => (
            <section key={label}>
              <GroupHeader label={label} />
              <CardGrid minCardWidth={items.every(r => r.mediaType === 'video') ? (isMobile ? 320 : 340) : (isMobile ? 160 : 220)}>
                {items.map(rec => (
                  <GenerationCard
                    key={rec._id}
                    job={recordToJob(rec)}
                    isActive={false}
                    onUseIdea={() => handleUseIdea(rec)}
                    onDelete={() => handleDelete(rec._id)}
                    onDownload={() => handleDownload(recordToJob(rec))}
                    onCopyUrl={() => handleCopyUrl(recordToJob(rec))}
                  />
                ))}
              </CardGrid>
            </section>
          ))}

          {/* Loading skeletons */}
          {isLoading && filteredActive.length === 0 && (
            <section>
              <GroupHeader label="Loading…" />
              <CardGrid>
                {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
              </CardGrid>
            </section>
          )}

          {/* Empty state */}
          {isEmpty && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '60px 0' }}>
              <Wand2 size={40} style={{ color: '#e5e7eb' }} />
              <p style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: 0 }}>No generations yet</p>
              <p style={{ fontSize: 13, color: '#9ca3af', margin: 0, textAlign: 'center' }}>
                Use the Generate panel to create your first image
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GenerateHistory;
