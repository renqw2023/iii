import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, CreditCard, DollarSign, Gift, Database,
  ArrowLeft, Shield, RefreshCw, Circle, Globe, BarChart2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';
import OverviewTab from '../components/Admin/tabs/OverviewTab';
import UsersTab from '../components/Admin/tabs/UsersTab';
import TransactionsTab from '../components/Admin/tabs/TransactionsTab';
import RevenueTab from '../components/Admin/tabs/RevenueTab';
import GiftCodesTab from '../components/Admin/tabs/GiftCodesTab';
import DataSyncTab from '../components/Admin/tabs/DataSyncTab';
import SEOTab from '../components/Admin/tabs/SEOTab';
import TrafficTab from '../components/Admin/tabs/TrafficTab';

const NAV = [
  { id: 'overview',     label: 'Overview',      icon: LayoutDashboard, desc: 'Platform KPIs' },
  { id: 'users',        label: 'Users',         icon: Users,           desc: 'Manage members' },
  { id: 'transactions', label: 'Transactions',  icon: CreditCard,      desc: 'Credits ledger' },
  { id: 'revenue',      label: 'Revenue',       icon: DollarSign,      desc: 'USD income analytics' },
  { id: 'giftcodes',    label: 'Gift Codes',    icon: Gift,            desc: 'Generate & manage codes' },
  { id: 'datasync',     label: 'Data Sync',     icon: Database,        desc: 'Content sync scheduler' },
  { id: 'seo',          label: 'SEO',           icon: Globe,           desc: 'Sitemap & search engines' },
  { id: 'traffic',      label: 'Traffic',       icon: BarChart2,       desc: 'Visitor analytics' },
];

/* ─── Toast ─────────────────────────────────────────────────── */
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium"
      style={{
        background: type === 'error'
          ? 'linear-gradient(135deg,#ef4444,#dc2626)'
          : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
        color: '#fff',
        boxShadow: type === 'error'
          ? '0 8px 32px rgba(239,68,68,.35)'
          : '0 8px 32px rgba(99,102,241,.35)',
      }}
    >
      <Circle size={8} fill="currentColor" />
      {message}
    </div>
  );
}

/* ─── Sidebar ────────────────────────────────────────────────── */
function Sidebar({ active, onChange }) {
  const navigate = useNavigate();
  return (
    <aside
      className="fixed top-0 left-0 h-screen flex flex-col z-30"
      style={{
        width: 220,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
      }}
    >
      {/* Brand */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
          >
            <Shield size={17} color="#fff" />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Admin</p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>III.PICS</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
          Dashboard
        </p>
        {NAV.map(item => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 text-left"
              style={{
                background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 600 : 400,
              }}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid var(--border-color)' }}>
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all hover:bg-white/5"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <ArrowLeft size={15} />
          Back to App
        </button>
      </div>
    </aside>
  );
}

/* ─── Top Header ─────────────────────────────────────────────── */
function TopBar({ active, onRefresh, refreshing }) {
  const item = NAV.find(n => n.id === active);
  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-8 py-4"
      style={{
        background: 'var(--bg-primary)',
        borderBottom: '1px solid var(--border-color)',
      }}
    >
      <div>
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Admin</span>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>/</span>
          <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{item?.label}</span>
        </div>
        <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{item?.label}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>
          <Circle size={6} fill="currentColor" />
          Live
        </div>
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-80"
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>
    </header>
  );
}

/* ─── Main ───────────────────────────────────────────────────── */
export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const refreshKeyRef = useRef(0);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/');
  }, [user, navigate]);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const res = await adminAPI.getStats();
      setStats(res.data?.data || null);
    } catch (e) {
      console.error(e);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'overview') loadStats();
  }, [activeTab]);

  const handleRefresh = () => {
    refreshKeyRef.current += 1;
    setRefreshKey(refreshKeyRef.current);
    if (activeTab === 'overview') loadStats();
  };

  const showToast = (message, type = 'success') => setToast({ message, type });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <p style={{ color: 'var(--text-tertiary)' }}>Access denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      <Sidebar active={activeTab} onChange={setActiveTab} />

      {/* Main content pushed right of sidebar */}
      <div className="flex-1 flex flex-col" style={{ marginLeft: 220, minWidth: 0 }}>
        <TopBar active={activeTab} onRefresh={handleRefresh} refreshing={statsLoading} />

        <main className="flex-1 px-8 py-6">
          {activeTab === 'overview' && (
            <OverviewTab stats={stats} loading={statsLoading} />
          )}
          {activeTab === 'users' && (
            <UsersTab key={`users-${refreshKey}`} onToast={showToast} />
          )}
          {activeTab === 'transactions' && (
            <TransactionsTab key={`tx-${refreshKey}`} />
          )}
          {activeTab === 'revenue' && (
            <RevenueTab key={`rev-${refreshKey}`} />
          )}
          {activeTab === 'giftcodes' && (
            <GiftCodesTab key={`gc-${refreshKey}`} />
          )}
          {activeTab === 'datasync' && (
            <DataSyncTab key={`ds-${refreshKey}`} />
          )}
          {activeTab === 'seo' && (
            <SEOTab key={`seo-${refreshKey}`} />
          )}
          {activeTab === 'traffic' && (
            <TrafficTab key={`traffic-${refreshKey}`} />
          )}
        </main>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
