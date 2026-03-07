import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Heart, Clock, Palette, Image, Film, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { creditsAPI } from '../services/creditsApi';
import { favoritesAPI } from '../services/favoritesApi';
import { useBrowsingHistory } from '../hooks/useBrowsingHistory';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import StatsPanel from '../components/Dashboard/StatsPanel';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import DashboardTabs from '../components/Dashboard/DashboardTabs';

// ── Reuse FavCard display logic ──────────────────────────────────────────────
const FAV_TABS = [
  { key: 'sref',     label: 'Sref',    icon: Palette, color: '#a855f7' },
  { key: 'gallery',  label: 'Gallery', icon: Image,   color: '#3b82f6' },
  { key: 'seedance', label: 'Video',   icon: Film,    color: '#10b981' },
];

const FavCard = ({ item, navigate }) => {
  const { targetType, target } = item;
  if (!target) return null;
  const image = target.previewImage || target.thumbnailUrl || '';
  const title = target.title || target.srefCode || target.prompt?.substring(0, 40) || '';
  const url =
    targetType === 'sref'    ? `/explore/${target._id}` :
    targetType === 'gallery' ? `/gallery/${target._id}` :
    `/seedance/${target._id}`;

  return (
    <div
      className="group relative rounded-xl overflow-hidden cursor-pointer"
      style={{ border: '1px solid var(--border-color)' }}
      onClick={() => navigate(url, { state: { fromList: true } })}
    >
      <div className="aspect-square" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-20">
            <Heart size={28} />
          </div>
        )}
      </div>
      <div className="p-2" style={{ backgroundColor: 'var(--bg-card)' }}>
        <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{title}</p>
      </div>
    </div>
  );
};

// ── Favorites tab ─────────────────────────────────────────────────────────────
const FavoritesSection = () => {
  const navigate = useNavigate();
  const [activeType, setActiveType] = useState('sref');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchFavs = useCallback(async (type) => {
    setLoading(true);
    try {
      const res = await favoritesAPI.getList(type, 1, 24);
      setItems(res.data.data?.favorites || []);
    } catch {
      toast.error('获取收藏失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFavs(activeType); }, [activeType, fetchFavs]);

  const tabInfo = FAV_TABS.find(t => t.key === activeType);

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-2 mb-5">
        {FAV_TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeType === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveType(tab.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: active ? tab.color : 'var(--bg-tertiary)',
                color: active ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${active ? tab.color : 'var(--border-color)'}`,
              }}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
        <Link
          to="/favorites"
          className="ml-auto flex items-center gap-1 text-sm transition-opacity opacity-60 hover:opacity-100"
          style={{ color: 'var(--accent-primary)' }}
        >
          View all <ArrowRight size={13} />
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner size="md" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
          {tabInfo && <tabInfo.icon size={40} className="mx-auto mb-3 opacity-20" />}
          <p className="text-sm">No {tabInfo?.label} saved yet</p>
          <p className="text-xs mt-1 opacity-60">Tap the heart icon on any card to save it</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {items.map(item => (
            <FavCard key={item._id} item={item} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  );
};

// ── History tab ───────────────────────────────────────────────────────────────
const TYPE_META = {
  sref:     { icon: Palette, label: 'Sref',    color: '#a855f7' },
  gallery:  { icon: Image,   label: 'Gallery', color: '#3b82f6' },
  seedance: { icon: Film,    label: 'Video',   color: '#10b981' },
};

const formatTime = (iso) => {
  const diff = Date.now() - new Date(iso);
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(iso).toLocaleDateString();
};

const HistorySection = () => {
  const navigate = useNavigate();
  const { getHistory } = useBrowsingHistory();
  const items = getHistory().slice(0, 12);

  if (items.length === 0) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
        <Clock size={40} className="mx-auto mb-3 opacity-20" />
        <p className="text-sm">No browsing history yet</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Link
          to="/history"
          className="flex items-center gap-1 text-sm opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: 'var(--accent-primary)' }}
        >
          View all <ArrowRight size={13} />
        </Link>
      </div>
      <div className="space-y-2">
        {items.map((item) => {
          const meta = TYPE_META[item.type] || {};
          const Icon = meta.icon || Clock;
          return (
            <div
              key={`${item.type}-${item.id}`}
              className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors group"
              style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
              onClick={() => navigate(item.url)}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${meta.color}20` }}
              >
                <Icon size={14} style={{ color: meta.color }} />
              </div>
              {item.image && (
                <img src={item.image} alt={item.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                  {item.title || `${meta.label} item`}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {meta.label} · {formatTime(item.visitedAt)}
                </p>
              </div>
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-40 transition-opacity flex-shrink-0" style={{ color: 'var(--text-secondary)' }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Credits tab ───────────────────────────────────────────────────────────────
const REASON_LABELS = {
  daily_checkin:  'Daily check-in',
  register_bonus: 'Register bonus',
  invite_reward:  'Invite reward',
  invite_bonus:   'Invited friend bonus',
  admin_grant:    'Admin grant',
  generate_image: 'Image generation',
};

const CreditsSection = () => {
  const { data: historyData, isLoading } = useQuery(
    ['credits-history'],
    () => creditsAPI.getHistory(1, 20).then(r => r.data.data),
    { staleTime: 60 * 1000 }
  );

  const transactions = historyData?.transactions ?? [];

  if (isLoading) {
    return <div className="flex justify-center py-12"><LoadingSpinner size="md" /></div>;
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
        <TrendingUp size={40} className="mx-auto mb-3 opacity-20" />
        <p className="text-sm">No transactions yet</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Link
          to="/credits"
          className="flex items-center gap-1 text-sm opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: 'var(--accent-primary)' }}
        >
          View all <ArrowRight size={13} />
        </Link>
      </div>
      <div className="space-y-2">
        {transactions.map(tx => (
          <div
            key={tx._id}
            className="flex items-center justify-between rounded-xl px-4 py-3"
            style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: tx.type === 'earn' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }}
              >
                {tx.type === 'earn'
                  ? <TrendingUp size={14} style={{ color: '#10b981' }} />
                  : <TrendingDown size={14} style={{ color: '#ef4444' }} />
                }
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {REASON_LABELS[tx.reason] || tx.reason}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {new Date(tx.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold" style={{ color: tx.type === 'earn' ? '#10b981' : '#ef4444' }}>
                {tx.type === 'earn' ? '+' : '-'}{tx.amount}
              </span>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>bal. {tx.balanceAfter}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
const TABS = [
  { id: 'favorites', label: 'Saved' },
  { id: 'history',   label: 'History' },
  { id: 'credits',   label: 'Credits' },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('favorites');

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh', padding: '2rem 0' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <DashboardHeader user={user} />
        <StatsPanel user={user} />
        <DashboardTabs
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          {activeTab === 'favorites' && <FavoritesSection />}
          {activeTab === 'history'   && <HistorySection />}
          {activeTab === 'credits'   && <CreditsSection />}
        </DashboardTabs>
      </div>
    </div>
  );
};

export default Dashboard;
