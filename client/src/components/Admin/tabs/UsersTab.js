import React, { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, MoreHorizontal, Ban, CheckCircle, Coins, Trash2, Mail, Chrome, Crown } from 'lucide-react';
import { adminAPI } from '../../../services/api';
import { creditsAPI } from '../../../services/creditsApi';
import { getUserAvatar, DEFAULT_FALLBACK_AVATAR } from '../../../utils/avatarUtils';

/* ─── Skeleton Row ───────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr style={{ borderTop: '1px solid var(--border-color)' }}>
      {[140, 180, 80, 120, 80, 60, 70, 32].map((w, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded animate-pulse" style={{ width: w, background: 'var(--bg-tertiary)' }} />
        </td>
      ))}
    </tr>
  );
}

/* ─── Credits Modal ──────────────────────────────────────────── */
function CreditsModal({ user, mode, onClose, onDone }) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const n = parseInt(amount);
    if (!n || n <= 0) { setErr('Enter a valid amount'); return; }
    setLoading(true);
    try {
      if (mode === 'grant') await creditsAPI.adminGrant(user._id, n, note);
      else await creditsAPI.adminDeduct(user._id, n, note);
      onDone(`${mode === 'grant' ? 'Granted' : 'Deducted'} ${n} credits`);
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="rounded-2xl p-6 w-80 shadow-2xl"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: mode === 'grant' ? '#3b82f620' : '#ef444420' }}>
            <Coins size={16} style={{ color: mode === 'grant' ? '#3b82f6' : '#ef4444' }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {mode === 'grant' ? 'Grant Credits' : 'Deduct Credits'}
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{user.username}</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="number" min="1" placeholder="Amount"
            value={amount} onChange={e => setAmount(e.target.value)} autoFocus
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          />
          <input
            type="text" placeholder="Note (optional)"
            value={note} onChange={e => setNote(e.target.value)}
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          />
          {err && <p className="text-xs text-red-400">{err}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-opacity hover:opacity-70"
              style={{ background: 'var(--bg-primary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 rounded-xl py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: mode === 'grant' ? '#3b82f6' : '#ef4444', color: '#fff', opacity: loading ? 0.6 : 1 }}>
              {loading ? '…' : 'Confirm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Actions Dropdown ───────────────────────────────────────── */
function ActionsMenu({ user, onAction, onClose: _onClose }) {
  return (
    <div className="absolute right-0 top-9 z-20 rounded-2xl shadow-2xl py-1.5 w-44"
      style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      {user.isActive
        ? <button onClick={() => onAction('ban')} className="w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 hover:bg-white/5 transition-colors" style={{ color: 'var(--text-secondary)' }}>
            <Ban size={13} /> Ban User
          </button>
        : <button onClick={() => onAction('unban')} className="w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 hover:bg-white/5 transition-colors" style={{ color: 'var(--text-secondary)' }}>
            <CheckCircle size={13} /> Unban User
          </button>
      }
      <button onClick={() => onAction('grant')} className="w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 hover:bg-white/5 transition-colors" style={{ color: 'var(--text-secondary)' }}>
        <Coins size={13} /> Grant Credits
      </button>
      <button onClick={() => onAction('deduct')} className="w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 hover:bg-white/5 transition-colors" style={{ color: 'var(--text-secondary)' }}>
        <Coins size={13} /> Deduct Credits
      </button>
      <div className="mx-3 my-1" style={{ height: 1, background: 'var(--border-color)' }} />
      <button onClick={() => onAction('delete')} className="w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 hover:bg-red-500/10 transition-colors text-red-400">
        <Trash2 size={13} /> Delete User
      </button>
    </div>
  );
}

function formatLastSeen(ts) {
  if (!ts) return '—';
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  if (diff < 7 * 86400_000) return `${Math.floor(diff / 86400_000)}d ago`;
  return new Date(ts).toLocaleDateString();
}

/* ─── Main ───────────────────────────────────────────────────── */
export default function UsersTab({ onToast }) {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState(null);
  const [creditsModal, setCreditsModal] = useState(null);
  const totalPages = Math.ceil(total / 20);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({ page, limit: 20, search: search || undefined, status, sort: 'createdAt', order: 'desc' });
      const d = res.data?.data;
      setUsers(d?.users || []);
      setTotal(d?.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput); setPage(1); };

  const handleAction = async (action, user) => {
    setOpenMenu(null);
    if (action === 'grant' || action === 'deduct') { setCreditsModal({ user, mode: action }); return; }
    if (action === 'delete') {
      if (!window.confirm(`Delete "${user.username}"? This cannot be undone.`)) return;
      try {
        await adminAPI.deleteUser(user._id);
        onToast('User deleted');
        fetchUsers();
      } catch (e) { onToast(e.response?.data?.message || 'Delete failed', 'error'); }
      return;
    }
    try {
      await adminAPI.updateUserStatus(user._id, { isActive: action === 'unban' });
      onToast(`User ${action === 'ban' ? 'banned' : 'unbanned'}`);
      fetchUsers();
    } catch (e) { onToast('Operation failed', 'error'); }
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div
        className="flex flex-wrap gap-3 p-4 rounded-2xl"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
      >
        <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-0">
          <div className="relative flex-1 min-w-0">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
            <input
              value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Search username or email…"
              className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
            />
          </div>
          <button type="submit" className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: 'var(--accent-primary)', color: '#fff' }}>
            Search
          </button>
        </form>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="rounded-xl px-3 py-2 text-sm outline-none"
          style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
          <option value="all">All Users</option>
          <option value="paid">💎 Paid</option>
          <option value="free">🆓 Free</option>
          <option value="active">Active</option>
          <option value="inactive">Banned</option>
        </select>
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs"
          style={{ background: 'var(--bg-primary)', color: 'var(--text-tertiary)', border: '1px solid var(--border-color)' }}>
          {loading ? '…' : <><span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{total.toLocaleString()}</span>&nbsp;users</>}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border-color)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                {['User', 'Plan', 'Auth', 'Credits', 'Last Seen', 'Invites', 'Status', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody style={{ background: 'var(--bg-primary)' }}>
              {loading
                ? [...Array(8)].map((_, i) => <SkeletonRow key={i} />)
                : users.length === 0
                  ? <tr><td colSpan={8} className="text-center py-16 text-sm" style={{ color: 'var(--text-tertiary)' }}>No users found</td></tr>
                  : users.map(u => (
                    <tr
                      key={u._id}
                      className="transition-colors"
                      style={{ borderTop: '1px solid var(--border-color)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* User */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <img src={getUserAvatar(u)} onError={e => { e.target.src = DEFAULT_FALLBACK_AVATAR; }}
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-1" style={{ '--tw-ring-color': 'var(--border-color)' }} alt="" />
                          <span className="font-medium text-sm truncate max-w-[110px]" style={{ color: 'var(--text-primary)' }}>
                            {u.username}
                          </span>
                        </div>
                      </td>
                      {/* Plan */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {u.hasPurchasedBefore
                          ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background: '#f59e0b18', color: '#f59e0b', border: '1px solid #f59e0b30' }}>
                              <Crown size={9} /> Paid
                            </span>
                          : <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs"
                              style={{ background: 'var(--bg-secondary)', color: 'var(--text-tertiary)', border: '1px solid var(--border-color)' }}>
                              Free
                            </span>
                        }
                      </td>
                      {/* Auth */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {u.authProvider === 'google'
                          ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs"
                              style={{ background: '#4285f418', color: '#4285f4', border: '1px solid #4285f430' }}>
                              <Chrome size={9} /> Google
                            </span>
                          : <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs"
                              style={{ background: '#6366f118', color: '#6366f1', border: '1px solid #6366f130' }}>
                              <Mail size={9} /> Local
                            </span>
                        }
                      </td>
                      {/* Credits */}
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-medium"
                            style={{ background: '#3b82f612', color: '#3b82f6' }}>
                            💎 {(u.credits ?? 0).toLocaleString()}
                          </span>
                          <span className="px-2 py-0.5 rounded-lg text-xs font-mono"
                            style={{ background: '#22c55e12', color: '#22c55e' }}>
                            🎁 {(u.freeCredits ?? 0).toLocaleString()}
                          </span>
                        </div>
                      </td>
                      {/* Last Seen */}
                      <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: 'var(--text-tertiary)' }}>
                        {formatLastSeen(u.analytics?.lastActiveAt)}
                      </td>
                      {/* Invites */}
                      <td className="px-4 py-3 text-center text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {u.inviteUsedCount ?? 0}
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {u.isActive
                          ? <span className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                              style={{ background: '#22c55e18', color: '#22c55e', border: '1px solid #22c55e30' }}>Active</span>
                          : <span className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                              style={{ background: '#ef444418', color: '#ef4444', border: '1px solid #ef444430' }}>Banned</span>
                        }
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3 relative">
                        <button onClick={() => setOpenMenu(openMenu === u._id ? null : u._id)}
                          className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                          style={{ color: 'var(--text-tertiary)' }}>
                          <MoreHorizontal size={15} />
                        </button>
                        {openMenu === u._id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                            <ActionsMenu user={u} onAction={a => handleAction(a, u)} onClose={() => setOpenMenu(null)} />
                          </>
                        )}
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
            Page {page} of {totalPages} · {total.toLocaleString()} users
          </span>
          <div className="flex gap-1">
            {[...Array(Math.min(totalPages, 7))].map((_, i) => {
              const p = i + 1;
              return (
                <button key={p} onClick={() => setPage(p)}
                  className="w-8 h-8 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: page === p ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    color: page === p ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                  }}>
                  {p}
                </button>
              );
            })}
            {totalPages > 7 && (
              <>
                <span className="w-8 h-8 flex items-center justify-center text-xs" style={{ color: 'var(--text-tertiary)' }}>…</span>
                <button onClick={() => setPage(totalPages)}
                  className="w-8 h-8 rounded-lg text-xs font-medium transition-all"
                  style={{ background: page === totalPages ? 'var(--accent-primary)' : 'var(--bg-secondary)', color: page === totalPages ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                  {totalPages}
                </button>
              </>
            )}
          </div>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs disabled:opacity-40 transition-all"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
              <ChevronLeft size={13} /> Prev
            </button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs disabled:opacity-40 transition-all"
              style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      {creditsModal && (
        <CreditsModal user={creditsModal.user} mode={creditsModal.mode}
          onClose={() => setCreditsModal(null)}
          onDone={msg => { setCreditsModal(null); onToast(msg); fetchUsers(); }} />
      )}
    </div>
  );
}
