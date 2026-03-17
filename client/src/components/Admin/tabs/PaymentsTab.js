import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { adminAPI } from '../../../services/api';

function SkeletonRow() {
  return (
    <tr style={{ borderTop: '1px solid var(--border-color)' }}>
      {[90, 140, 80, 70, 90, 160].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded animate-pulse" style={{ width: w, background: 'var(--bg-tertiary)' }} />
        </td>
      ))}
    </tr>
  );
}

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('default', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function PaymentsTab() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const totalPages = Math.ceil(total / 30);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getTransactions({ page, limit: 30, reason: 'purchase', sort: 'createdAt', order: 'desc' });
      const d = res.data?.data;
      setItems(d?.transactions || []);
      setTotal(d?.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Summary
  const totalCredits = items.reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary Banner */}
      <div className="flex items-center gap-4 p-5 rounded-2xl"
        style={{ background: 'linear-gradient(135deg,rgba(99,102,241,.08),rgba(139,92,246,.08))', border: '1px solid rgba(99,102,241,.2)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(99,102,241,.15)' }}>
          <ShoppingBag size={18} style={{ color: 'var(--accent-primary)' }} />
        </div>
        <div>
          <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Credits Sold (current page)
          </p>
          <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {totalCredits.toLocaleString()} <span className="text-sm font-normal" style={{ color: 'var(--text-tertiary)' }}>credits · {total} transactions</span>
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Revenue tracking</p>
          <p className="text-xs font-medium mt-0.5" style={{ color: '#f59e0b' }}>Stripe USD amount pending</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                {['Time', 'User', 'Credits Sold', 'Wallet', 'Balance After', 'Note'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-color)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ background: 'var(--bg-primary)' }}>
              {loading
                ? [...Array(8)].map((_, i) => <SkeletonRow key={i} />)
                : items.length === 0
                  ? <tr><td colSpan={6} className="text-center py-16 text-sm" style={{ color: 'var(--text-tertiary)' }}>No purchase records</td></tr>
                  : items.map(tx => (
                    <tr key={tx._id} className="transition-colors"
                      style={{ borderTop: '1px solid var(--border-color)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td className="px-4 py-3 font-mono text-xs whitespace-nowrap" style={{ color: 'var(--text-tertiary)' }}>
                        {formatDate(tx.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{tx.userId?.username || '—'}</p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{tx.userId?.email || ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold font-mono text-sm" style={{ color: '#22c55e' }}>
                          +{tx.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {tx.walletType
                          ? <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
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
                      <td className="px-4 py-3 max-w-[180px]">
                        <span className="text-xs truncate block" style={{ color: 'var(--text-tertiary)' }}>
                          {tx.note || '—'}
                        </span>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Page {page} of {totalPages}</span>
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
