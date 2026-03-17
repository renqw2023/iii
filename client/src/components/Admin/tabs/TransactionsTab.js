import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminAPI } from '../../../services/api';

const REASONS = [
  'all', 'daily_checkin', 'register_bonus', 'invite_reward', 'invite_bonus',
  'admin_grant', 'admin_deduct', 'generate_image', 'generate_video',
  'img2prompt', 'purchase'
];

const REASON_COLORS = {
  daily_checkin:   { bg: '#22c55e18', color: '#22c55e' },
  register_bonus:  { bg: '#6366f118', color: '#6366f1' },
  invite_reward:   { bg: '#8b5cf618', color: '#8b5cf6' },
  invite_bonus:    { bg: '#8b5cf618', color: '#8b5cf6' },
  admin_grant:     { bg: '#3b82f618', color: '#3b82f6' },
  admin_deduct:    { bg: '#ef444418', color: '#ef4444' },
  generate_image:  { bg: '#f59e0b18', color: '#f59e0b' },
  generate_video:  { bg: '#ec489918', color: '#ec4899' },
  img2prompt:      { bg: '#06b6d418', color: '#06b6d4' },
  purchase:        { bg: '#22c55e18', color: '#22c55e' },
};

function TypeBadge({ type }) {
  return type === 'earn'
    ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide"
        style={{ background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e30' }}>EARN</span>
    : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide"
        style={{ background: '#ef444418', color: '#ef4444', border: '1px solid #ef444430' }}>SPEND</span>;
}

function ReasonBadge({ reason }) {
  const c = REASON_COLORS[reason] || { bg: 'var(--bg-secondary)', color: 'var(--text-tertiary)' };
  return (
    <span className="px-2 py-0.5 rounded-lg text-xs font-mono"
      style={{ background: c.bg, color: c.color }}>
      {reason}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr style={{ borderTop: '1px solid var(--border-color)' }}>
      {[90, 140, 70, 60, 120, 70, 80].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded animate-pulse" style={{ width: w, background: 'var(--bg-tertiary)' }} />
        </td>
      ))}
    </tr>
  );
}

function formatDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('default', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function TransactionsTab() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [type, setType] = useState('all');
  const [reason, setReason] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const totalPages = Math.ceil(total / 30);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page, limit: 30,
        type: type !== 'all' ? type : undefined,
        reason: reason !== 'all' ? reason : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        search: search || undefined,
        sort: 'createdAt', order: 'desc'
      };
      const res = await adminAPI.getTransactions(params);
      const d = res.data?.data;
      setItems(d?.transactions || []);
      setTotal(d?.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, type, reason, dateFrom, dateTo, search]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [type, reason, dateFrom, dateTo, search]);

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput); };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 rounded-2xl"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-0">
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by user email or username…"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
          </div>
          <button type="submit" className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: 'var(--accent-primary)', color: '#fff' }}>Search</button>
        </form>
        <select value={type} onChange={e => setType(e.target.value)} className="rounded-xl px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
          <option value="all">All Types</option>
          <option value="earn">Earn</option>
          <option value="spend">Spend</option>
        </select>
        <select value={reason} onChange={e => setReason(e.target.value)} className="rounded-xl px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
          {REASONS.map(r => <option key={r} value={r}>{r === 'all' ? 'All Reasons' : r}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
          className="rounded-xl px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
          className="rounded-xl px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }} />
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs"
          style={{ background: 'var(--bg-primary)', color: 'var(--text-tertiary)', border: '1px solid var(--border-color)' }}>
          {loading ? '…' : <><span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{total.toLocaleString()}</span>&nbsp;records</>}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                {['Time', 'User', 'Type', 'Amount', 'Reason', 'Wallet', 'Balance After'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-color)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ background: 'var(--bg-primary)' }}>
              {loading
                ? [...Array(10)].map((_, i) => <SkeletonRow key={i} />)
                : items.length === 0
                  ? <tr><td colSpan={7} className="text-center py-16 text-sm" style={{ color: 'var(--text-tertiary)' }}>No transactions found</td></tr>
                  : items.map(tx => (
                    <tr key={tx._id} className="transition-colors"
                      style={{ borderTop: '1px solid var(--border-color)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap" style={{ color: 'var(--text-tertiary)' }}>
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{tx.userId?.username || '—'}</p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{tx.userId?.email || ''}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap"><TypeBadge type={tx.type} /></td>
                      <td className="px-4 py-3 font-mono font-bold text-sm whitespace-nowrap"
                        style={{ color: tx.type === 'earn' ? '#22c55e' : '#ef4444' }}>
                        {tx.type === 'earn' ? '+' : '-'}{tx.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap"><ReasonBadge reason={tx.reason} /></td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {tx.walletType
                          ? <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
                              {tx.walletType}
                            </span>
                          : <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                        }
                      </td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {(tx.totalBalanceAfter ?? tx.balanceAfter) !== undefined
                          ? (tx.totalBalanceAfter ?? tx.balanceAfter).toLocaleString()
                          : '—'}
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs disabled:opacity-40"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
              <ChevronLeft size={13} /> Prev
            </button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs disabled:opacity-40"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
