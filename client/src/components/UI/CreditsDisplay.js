import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Coins, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { creditsAPI } from '../../services/creditsApi';
import { useAuth } from '../../contexts/AuthContext';

const CreditsDisplay = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useQuery(
    ['credits-balance'],
    () => creditsAPI.getBalance().then(r => r.data.data),
    { enabled: isAuthenticated, staleTime: 60 * 1000, refetchOnWindowFocus: false }
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
      }
    }
  );

  if (!isAuthenticated || !data) return null;

  return (
    <div className="flex items-center gap-2">
      {/* 每日签到按钮 */}
      {!data.checkedInToday && (
        <button
          onClick={() => checkinMutation.mutate()}
          disabled={checkinMutation.isLoading}
          className="text-xs px-2 py-1 rounded-lg transition-colors"
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: '#fff',
            opacity: checkinMutation.isLoading ? 0.7 : 1,
          }}
          title="每日签到领积分"
        >
          {checkinMutation.isLoading ? '...' : '签到'}
        </button>
      )}
      {data.checkedInToday && (
        <CheckCircle size={14} style={{ color: '#10b981' }} title="今日已签到" />
      )}

      {/* 积分显示 */}
      <Link
        to="/credits"
        className="flex items-center gap-1 text-sm font-medium transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        title="查看积分"
      >
        <Coins size={15} style={{ color: '#f59e0b' }} />
        <span>{data.credits ?? 0}</span>
      </Link>
    </div>
  );
};

export default CreditsDisplay;
