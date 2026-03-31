import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import {
  RefreshCw, CheckCircle, AlertCircle, ExternalLink,
  Globe, FileText, Loader, Send, Image, Video, Tag
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

function fmtSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// ─── Card wrapper ─────────────────────────────────────────────

function Card({ children, style }) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── Bot Crawl Simulator ──────────────────────────────────────

function BotSimulator() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const handleSimulate = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await axios.post('/api/seo/simulate-crawl', { url: url.trim() });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
        Bot Crawl Simulator
      </h2>
      <p className="text-xs mb-4" style={{ color: 'var(--text-tertiary)' }}>
        Paste any item path to see the HTML Googlebot receives from the dynamic rendering middleware.
      </p>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="/gallery/69cb2aabcdf7554e1635409f"
          onKeyDown={e => e.key === 'Enter' && handleSimulate()}
          className="flex-1 px-3 py-2 rounded-xl text-xs"
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
        <button
          onClick={handleSimulate}
          disabled={loading || !url.trim()}
          className="px-4 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80 flex items-center gap-2"
          style={{
            background: 'rgba(99,102,241,0.15)',
            color: '#818cf8',
            border: '1px solid rgba(99,102,241,0.25)',
          }}
        >
          {loading ? <Loader size={12} className="animate-spin" /> : <Globe size={12} />}
          {loading ? 'Fetching…' : 'Simulate'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-3 text-xs" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle size={12} /> {error}
        </div>
      )}

      {result && (
        <div>
          <div className="flex items-center gap-2 mb-3 text-xs" style={{ color: result.found ? '#22c55e' : '#f59e0b' }}>
            {result.found ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
            {result.found ? 'Bot renderer responded with full HTML' : result.message}
          </div>
          {result.found && result.html && (
            <div
              className="rounded-xl overflow-auto text-xs font-mono p-4"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                maxHeight: 320,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {result.html}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ─── SEOTab ───────────────────────────────────────────────────

export default function SEOTab() {
  const queryClient = useQueryClient();
  const [submitResults, setSubmitResults] = useState(null);

  // ── Sitemap status ──
  const { data: statusData, isLoading: statusLoading } = useQuery(
    'admin-sitemap-status',
    () => axios.get('/api/seo/sitemap/status').then(r => r.data),
    { refetchInterval: 30000 }
  );

  // ── SEO health ──
  const { data: healthData } = useQuery(
    'admin-seo-health',
    () => axios.get('/api/seo/health').then(r => r.data),
    { staleTime: 60 * 60 * 1000 }
  );

  // ── SEO coverage ──
  const { data: coverageData } = useQuery(
    'admin-seo-coverage',
    () => axios.get('/api/seo/coverage').then(r => r.data),
    { staleTime: 60 * 60 * 1000 }
  );

  // ── Generate mutation ──
  const generateMutation = useMutation(
    () => axios.get('/api/seo/sitemap/generate'),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('admin-sitemap-status');
      },
    }
  );

  // ── Submit mutation ──
  const submitMutation = useMutation(
    (engines) => axios.post('/api/seo/submit-sitemap', { engines }).then(r => r.data),
    {
      onSuccess: (data) => {
        setSubmitResults(data.results);
        setTimeout(() => setSubmitResults(null), 8000);
      },
    }
  );

  const sitemaps = statusData?.sitemaps || {};
  const baseUrl = statusData?.baseUrl || 'https://iii.pics';

  // Sort: exists first, then alphabetical
  const sitemapEntries = Object.entries(sitemaps).sort(([, a], [, b]) => {
    if (a.exists && !b.exists) return -1;
    if (!a.exists && b.exists) return 1;
    return 0;
  });

  const existCount = Object.values(sitemaps).filter(s => s.exists).length;
  const totalCount = Object.keys(sitemaps).length;

  return (
    <div className="space-y-6">

      {/* ── KPI row ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Sitemap Files',
            value: statusLoading ? '—' : `${existCount} / ${totalCount}`,
            icon: FileText,
            color: '#6366f1',
          },
          {
            label: 'Coverage Status',
            value: statusLoading ? '—' : existCount === totalCount ? 'All Present' : 'Incomplete',
            icon: CheckCircle,
            color: existCount === totalCount ? '#22c55e' : '#f59e0b',
          },
          {
            label: 'Base URL',
            value: baseUrl.replace('https://', ''),
            icon: Globe,
            color: '#8b5cf6',
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
                <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
              </div>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${color}22` }}
              >
                <Icon size={17} style={{ color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── SEO Health KPI row ── */}
      {healthData && (
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'Gallery Alt Coverage',
              value: `${healthData.gallery?.altCoverage ?? '—'}%`,
              sub: `${healthData.gallery?.withTitle ?? 0} / ${healthData.gallery?.total ?? 0} have title`,
              icon: Tag,
              color: healthData.gallery?.altCoverage >= 80 ? '#22c55e' : '#f59e0b',
            },
            {
              label: 'Gallery Image Coverage',
              value: `${healthData.gallery?.imageCoverage ?? '—'}%`,
              sub: `${healthData.gallery?.withImage ?? 0} / ${healthData.gallery?.total ?? 0} have image`,
              icon: Image,
              color: healthData.gallery?.imageCoverage >= 95 ? '#22c55e' : '#f59e0b',
            },
            {
              label: 'Seedance Video Coverage',
              value: `${healthData.seedance?.videoCoverage ?? '—'}%`,
              sub: `${healthData.seedance?.withVideo ?? 0} / ${healthData.seedance?.total ?? 0} have video`,
              icon: Video,
              color: healthData.seedance?.videoCoverage >= 90 ? '#22c55e' : '#f59e0b',
            },
          ].map(({ label, value, sub, icon: Icon, color }) => (
            <Card key={label}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>{sub}</p>
                </div>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}22` }}
                >
                  <Icon size={17} style={{ color }} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Sitemap file list ── */}
      <Card>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Sitemap Files
          </h2>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
            style={{
              background: 'rgba(99,102,241,0.15)',
              color: '#818cf8',
              border: '1px solid rgba(99,102,241,0.25)',
            }}
          >
            {generateMutation.isLoading
              ? <Loader size={13} className="animate-spin" />
              : <RefreshCw size={13} />}
            {generateMutation.isLoading ? 'Generating…' : 'Generate All'}
          </button>
        </div>

        {generateMutation.isSuccess && (
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-4 text-xs font-medium"
            style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}
          >
            <CheckCircle size={13} />
            All sitemaps generated successfully
          </div>
        )}

        {generateMutation.isError && (
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-4 text-xs font-medium"
            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <AlertCircle size={13} />
            Generation failed — check server logs
          </div>
        )}

        {statusLoading ? (
          <div className="flex items-center justify-center py-8" style={{ color: 'var(--text-tertiary)' }}>
            <Loader size={20} className="animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {sitemapEntries.map(([filename, info]) => (
              <div
                key={filename}
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {info.exists
                    ? <CheckCircle size={15} style={{ color: '#22c55e', flexShrink: 0 }} />
                    : <AlertCircle size={15} style={{ color: '#f59e0b', flexShrink: 0 }} />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {filename}
                    </p>
                    {info.exists && (
                      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {fmtSize(info.size)} · Updated {fmtDate(info.lastModified)}
                      </p>
                    )}
                    {!info.exists && (
                      <p className="text-xs" style={{ color: '#f59e0b' }}>
                        Not generated yet — click "Generate All"
                      </p>
                    )}
                  </div>
                </div>
                {info.exists && (
                  <a
                    href={`${baseUrl}/${filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs ml-4 flex-shrink-0 hover:opacity-70 transition-opacity"
                    style={{ color: '#818cf8' }}
                  >
                    View
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Structured Data Coverage ── */}
      {coverageData && (
        <Card>
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Structured Data Coverage
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Gallery (ImageObject)', key: 'gallery', color: '#6366f1' },
              { label: 'Sref Styles (ImageObject)', key: 'sref', color: '#8b5cf6' },
              { label: 'Seedance (VideoObject)', key: 'seedance', color: '#f97316' },
            ].map(({ label, key, color }) => {
              const d = coverageData[key] || {};
              const pct = d.pct ?? 0;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    <span className="text-xs font-medium" style={{ color: pct >= 95 ? '#22c55e' : pct >= 70 ? '#f59e0b' : '#f87171' }}>
                      {d.sitemap ?? '—'} / {d.db ?? '—'} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(pct, 100)}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--text-tertiary)' }}>
            Sitemap entries vs DB records. Regenerate sitemaps to refresh coverage. Cached 1h.
          </p>
        </Card>
      )}

      {/* ── Search engine submission ── */}
      <Card>
        <h2 className="text-sm font-semibold mb-5" style={{ color: 'var(--text-primary)' }}>
          Submit to Search Engines
        </h2>

        {submitResults && (
          <div className="mb-4 space-y-2">
            {Object.entries(submitResults).map(([engine, result]) => (
              <div
                key={engine}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs"
                style={{
                  background: result.success ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                  color: result.success ? '#22c55e' : '#f87171',
                  border: `1px solid ${result.success ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}
              >
                {result.success ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                <span className="font-medium capitalize">{engine}</span>
                {result.success ? ' — Ping sent' : ` — ${result.error}`}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'google', label: 'Google', color: '#4285f4' },
            { id: 'bing',   label: 'Bing',   color: '#00a4ef' },
            { id: 'baidu',  label: 'Baidu',  color: '#2932e1' },
          ].map(({ id, label, color }) => (
            <button
              key={id}
              onClick={() => submitMutation.mutate([id])}
              disabled={submitMutation.isLoading}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-medium transition-all hover:opacity-80"
              style={{
                background: `${color}18`,
                color,
                border: `1px solid ${color}33`,
              }}
            >
              {submitMutation.isLoading
                ? <Loader size={12} className="animate-spin" />
                : <Send size={12} />}
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => submitMutation.mutate(['google', 'bing', 'baidu'])}
          disabled={submitMutation.isLoading}
          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-medium transition-all hover:opacity-80"
          style={{
            background: 'rgba(99,102,241,0.12)',
            color: '#818cf8',
            border: '1px solid rgba(99,102,241,0.25)',
          }}
        >
          {submitMutation.isLoading
            ? <Loader size={12} className="animate-spin" />
            : <Globe size={12} />}
          Submit to All Engines
        </button>

        <p className="mt-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>
          Sends a ping to each search engine's sitemap indexing endpoint. Google / Bing / Baidu may take days to process.
        </p>
      </Card>

      {/* ── Bot Crawl Simulator ── */}
      <BotSimulator />

      {/* ── Sitemap index links ── */}
      <Card>
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
          Sitemap Index
        </h2>
        <div className="space-y-2">
          {[
            { label: 'sitemap.xml (index)', path: '/sitemap.xml', desc: 'Master sitemap index' },
            { label: 'sitemap-main.xml', path: '/sitemap-main.xml', desc: '6 static pages' },
            { label: 'sitemap-sref.xml', path: '/sitemap-sref.xml', desc: '1,300+ sref style codes' },
            { label: 'sitemap-gallery.xml', path: '/sitemap-gallery.xml', desc: '11,795 gallery prompts' },
            { label: 'sitemap-seedance.xml', path: '/sitemap-seedance.xml', desc: '1,223 Seedance videos (video:video)' },
            { label: 'sitemap-images.xml', path: '/sitemap-images.xml', desc: 'Image sitemap' },
          ].map(({ label, path, desc }) => (
            <a
              key={path}
              href={`${baseUrl}${path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 rounded-xl group transition-all hover:opacity-80"
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
            >
              <div>
                <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{desc}</p>
              </div>
              <ExternalLink size={13} style={{ color: 'var(--text-tertiary)' }} />
            </a>
          ))}
        </div>
      </Card>

    </div>
  );
}
