import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Coins, Heart, Clock, Calendar, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { creditsAPI } from '../../services/creditsApi';
import { favoritesAPI } from '../../services/favoritesApi';
import { useBrowsingHistory } from '../../hooks/useBrowsingHistory';

const StatsPanel = ({ user }) => {
  const queryClient = useQueryClient();
  const { getHistory } = useBrowsingHistory();

  const { data: balanceData } = useQuery(
    ['credits-balance'],
    () => creditsAPI.getBalance().then(r => r.data.data),
    { staleTime: 60 * 1000 }
  );

  const { data: favsData } = useQuery(
    ['favorites-count'],
    async () => {
      const res = await favoritesAPI.getList('all', 1, 1);
      return res.data.data?.pagination?.total ?? 0;
    },
    { staleTime: 60 * 1000 }
  );

  const checkinMutation = useMutation(
    () => creditsAPI.checkin().then(r => r.data),
    {
      onSuccess: (res) => {
        toast.success(res.message);
        queryClient.invalidateQueries(['credits-balance']);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || '签到失败');
      },
    }
  );

  const balance = balanceData?.credits ?? '—';
  const checkedInToday = balanceData?.checkedInToday ?? false;
  const savedCount = favsData ?? '—';
  const historyCount = getHistory().length;
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '—';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Credits card — spans 2 cols on sm+ */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="sm:col-span-2 rounded-2xl p-5 flex items-center justify-between"
        style={{
          background: 'linear-gradient(135deg, var(--accent-primary, #6366f1), #7c3aed)',
          color: '#fff',
        }}
      >
        <div>
          <p className="text-sm opacity-75 mb-0.5">Credits</p>
          <div className="flex items-center gap-2">
            <Coins size={22} />
            <span className="text-3xl font-bold">{balance}</span>
          </div>
        </div>
        <button
          onClick={() => checkinMutation.mutate()}
          disabled={checkedInToday || checkinMutation.isLoading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            backgroundColor: checkedInToday ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.92)',
            color: checkedInToday ? 'rgba(255,255,255,0.55)' : '#6366f1',
            cursor: checkedInToday ? 'default' : 'pointer',
          }}
        >
          {checkedInToday ? (
            <><CheckCircle size={14} /> Checked in</>
          ) : (
            <><Coins size={14} /> {checkinMutation.isLoading ? 'Checking...' : 'Daily check-in +10'}</>
          )}
        </button>
      </motion.div>

      {/* Saved */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}
        >
          <Heart size={18} style={{ color: '#ef4444' }} />
        </div>
        <div>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{savedCount}</p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Saved</p>
        </div>
      </motion.div>

      {/* History */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'rgba(99,102,241,0.12)' }}
        >
          <Clock size={18} style={{ color: '#6366f1' }} />
        </div>
        <div>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{historyCount}</p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Viewed</p>
        </div>
      </motion.div>

      {/* Member Since — hidden on sm (only 4 cols on lg) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="hidden lg:flex rounded-2xl p-5 items-center gap-4"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'rgba(16,185,129,0.12)' }}
        >
          <Calendar size={18} style={{ color: '#10b981' }} />
        </div>
        <div>
          <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{memberSince}</p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Member since</p>
        </div>
      </motion.div>
    </div>
  );
};

export default StatsPanel;
