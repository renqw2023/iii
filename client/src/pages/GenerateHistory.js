import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Wand2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { useGeneration } from '../contexts/GenerationContext';
import { generationHistoryAPI } from '../services/generationHistoryApi';
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
  return {
    id: rec._id,
    status: rec.status === 'error' ? 'error' : 'success',
    progress: 100,
    prompt: rec.prompt,
    modelId: rec.modelId,
    modelName: rec.modelName,
    aspectRatio: rec.aspectRatio || '1:1',
    result: { imageUrl: rec.imageUrl },
    imageUrl: rec.imageUrl,
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
const CardGrid = ({ children }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
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
  const { isAuthenticated, openLoginModal } = useAuth();
  const { activeGenerations, updateGeneration, removeGeneration, setPrefill } = useGeneration();
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await generationHistoryAPI.getHistory({ limit: 50 });
      setRecords(data.records || []);
    } catch {
      // silent — still show active generations
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Refresh history when an active generation succeeds
  useEffect(() => {
    const justFinished = activeGenerations.some(g => g.status === 'success' && g._fetched !== true);
    if (justFinished) {
      fetchHistory();
      activeGenerations.filter(g => g.status === 'success' && !g._fetched).forEach(g => {
        updateGeneration(g.id, { _fetched: true });
      });
    }
  }, [activeGenerations, fetchHistory, updateGeneration]);

  const handleDownload = (job) => {
    const url = job.result?.imageUrl || job.imageUrl;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated_${Date.now()}.png`;
    a.click();
  };

  const handleCopyUrl = async (job) => {
    const url = job.result?.imageUrl || job.imageUrl;
    if (!url) return;
    await navigator.clipboard.writeText(`${window.location.origin}${url}`);
    toast.success('URL copied');
  };

  const handleRetry = (job) => {
    removeGeneration(job.id);
    toast('Please go back to the Generate panel to retry', { icon: '💡' });
  };

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

  const groupedRecords = groupByDate(records);

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

  const isEmpty = !isLoading && activeGenerations.length === 0 && records.length === 0;

  return (
    <div style={{ minHeight: '100vh', padding: 0 }}>
      {/* Floating white card */}
      <div style={{
        margin: 16,
        marginRight: 'calc(320px + 32px)',
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
        </div>

        {/* Scroll content */}
        <div style={{ padding: '16px 16px 80px' }}>

          {/* Active generations (from GenerationContext) */}
          {activeGenerations.length > 0 && (
            <section>
              <GroupHeader label="Generating" />
              <CardGrid>
                {activeGenerations.map(job => (
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
              <CardGrid>
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
          {isLoading && activeGenerations.length === 0 && (
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
