import React from 'react';
import { useSEO } from '../hooks/useSEO';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Clock3, Heart, PenSquare, Coins, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import StatsPanel from '../components/Dashboard/StatsPanel';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import { PageShell, SectionCard, SectionGrid } from '../components/Page/PageShell';
import { favoritesAPI } from '../services/favoritesApi';
import { creditsAPI } from '../services/creditsApi';
import { useBrowsingHistory } from '../hooks/useBrowsingHistory';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const quickActions = [
  { to: '/create', title: 'Create post', note: 'Publish a new image or video set', icon: <PenSquare size={18} /> },
  { to: '/favorites', title: 'Manage favorites', note: 'Review saved references and clean them up', icon: <Heart size={18} /> },
  { to: '/history', title: 'Resume browsing', note: 'Jump back into recently visited items', icon: <Clock3 size={18} /> },
  { to: '/credits', title: 'Review credits', note: 'Check balance, transactions, and daily rewards', icon: <Coins size={18} /> },
];

const Dashboard = () => {
  useSEO({ noIndex: true, title: 'Dashboard - III.PICS' });
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getHistory } = useBrowsingHistory();
  const historyItems = getHistory().slice(0, 4);

  const { data: favoriteData, isLoading: favoritesLoading } = useQuery(
    ['dashboard-favorites-preview'],
    () => favoritesAPI.getList('all', 1, 4).then((response) => response.data.data?.favorites || []),
    { staleTime: 60 * 1000 },
  );

  const { data: creditsData, isLoading: creditsLoading } = useQuery(
    ['dashboard-credits-preview'],
    () => creditsAPI.getHistory(1, 4).then((response) => response.data.data?.transactions || []),
    { staleTime: 60 * 1000 },
  );

  const openFavorite = (item) => {
    if (!item?.target?._id) {
      return;
    }

    const path =
      item.targetType === 'sref'
        ? `/explore/${item.target._id}`
        : item.targetType === 'gallery'
          ? `/gallery/${item.target._id}`
          : `/seedance/${item.target._id}`;

    navigate(path, { state: { fromList: true } });
  };

  return (
    <PageShell
      showHeader={false}
      width="2xl"
      aside={
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-tertiary)' }}>
            Recommended flow
          </h2>
          <div className="space-y-2 text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
            <p>1. Check credits and recent history.</p>
            <p>2. Reopen saved references if you are iterating.</p>
            <p>3. Jump into Create when you are ready to publish.</p>
          </div>
        </div>
      }
    >
      <DashboardHeader user={user} />
      <StatsPanel user={user} />

      <SectionGrid columns="four">
        {quickActions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="rounded-[22px] border p-5 no-underline transition-transform hover:-translate-y-0.5"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'rgba(255,255,255,0.82)', color: 'var(--text-primary)' }}
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: 'rgba(99, 102, 241, 0.08)', color: 'var(--accent-primary)' }}
            >
              {action.icon}
            </div>
            <h3 className="mt-4 text-lg font-semibold">{action.title}</h3>
            <p className="mt-2 text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
              {action.note}
            </p>
          </Link>
        ))}
      </SectionGrid>

      <SectionGrid columns="three">
        <SectionCard icon={<Clock3 size={20} />} title="Resume browsing" description="Your recent local history stays visible here so you can jump back in without opening the full history page.">
          {historyItems.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              No recent history yet.
            </p>
          ) : (
            <div className="space-y-3">
              {historyItems.map((item) => (
                <button
                  key={`${item.type}-${item.id}`}
                  type="button"
                  onClick={() => navigate(item.url, { state: { fromList: true } })}
                  className="flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left"
                  style={{ borderColor: 'rgba(148,163,184,0.18)', backgroundColor: 'rgba(248,250,252,0.72)' }}
                >
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="h-12 w-12 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                      <Clock3 size={16} style={{ color: 'var(--text-tertiary)' }} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {item.title}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {item.type}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
          <Link to="/history" className="mt-4 inline-flex items-center gap-1 text-sm" style={{ color: 'var(--accent-primary)' }}>
            Open full history <ArrowRight size={14} />
          </Link>
        </SectionCard>

        <SectionCard icon={<Heart size={20} />} title="Recent favorites" description="This is a preview of your saved references, with the full library still handled by the dedicated page.">
          {favoritesLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="sm" />
            </div>
          ) : !favoriteData || favoriteData.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              No favorites yet.
            </p>
          ) : (
            <div className="space-y-3">
              {favoriteData.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => openFavorite(item)}
                  className="flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left"
                  style={{ borderColor: 'rgba(148,163,184,0.18)', backgroundColor: 'rgba(248,250,252,0.72)' }}
                >
                  {item.target?.previewImage || item.target?.thumbnailUrl ? (
                    <img
                      src={item.target.previewImage || item.target.thumbnailUrl}
                      alt={item.target?.title || item.target?.srefCode || 'Favorite'}
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
                      <Heart size={16} style={{ color: '#ef4444' }} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {item.target?.title || item.target?.srefCode || 'Untitled favorite'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {item.targetType}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
          <Link to="/favorites" className="mt-4 inline-flex items-center gap-1 text-sm" style={{ color: 'var(--accent-primary)' }}>
            Open favorites <ArrowRight size={14} />
          </Link>
        </SectionCard>

        <SectionCard icon={<Sparkles size={20} />} title="Credit activity" description="A compact balance summary is useful here so you do not need to open the full credits page every time.">
          {creditsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="sm" />
            </div>
          ) : !creditsData || creditsData.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              No transactions yet.
            </p>
          ) : (
            <div className="space-y-3">
              {creditsData.map((transaction) => (
                <div
                  key={transaction._id}
                  className="flex items-center justify-between rounded-2xl border px-4 py-3"
                  style={{ borderColor: 'rgba(148,163,184,0.18)', backgroundColor: 'rgba(248,250,252,0.72)' }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {transaction.reason}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {new Date(transaction.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span style={{ color: transaction.type === 'earn' ? '#10b981' : '#ef4444' }}>
                    {transaction.type === 'earn' ? '+' : '-'}
                    {transaction.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link to="/credits" className="mt-4 inline-flex items-center gap-1 text-sm" style={{ color: 'var(--accent-primary)' }}>
            Open credits <ArrowRight size={14} />
          </Link>
        </SectionCard>
      </SectionGrid>
    </PageShell>
  );
};

export default Dashboard;
