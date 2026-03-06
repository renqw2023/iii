import React from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Coins, CheckCircle, TrendingUp, TrendingDown, Clock, Gift, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { creditsAPI } from '../services/creditsApi';
import { useAuth } from '../contexts/AuthContext';

const REASON_LABELS = {
  daily_checkin:  '每日签到',
  register_bonus: '注册奖励',
  invite_reward:  '邀请奖励',
  invite_bonus:   '邀请好友奖励',
  admin_grant:    '管理员赠送',
  generate_image: '生成图片',
};

const Credits = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: balanceData } = useQuery(
    ['credits-balance'],
    () => creditsAPI.getBalance().then(r => r.data.data),
    { staleTime: 30 * 1000 }
  );

  const { data: historyData } = useQuery(
    ['credits-history'],
    () => creditsAPI.getHistory(1, 30).then(r => r.data.data),
    { staleTime: 60 * 1000 }
  );

  const checkinMutation = useMutation(
    () => creditsAPI.checkin().then(r => r.data),
    {
      onSuccess: (res) => {
        toast.success(res.message);
        queryClient.invalidateQueries(['credits-balance']);
        queryClient.invalidateQueries(['credits-history']);
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || '签到失败');
      }
    }
  );

  const balance = balanceData?.credits ?? 0;
  const checkedInToday = balanceData?.checkedInToday ?? false;
  const transactions = historyData?.transactions ?? [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>
        我的积分
      </h1>

      {/* 余额卡片 */}
      <div
        className="rounded-2xl p-6 mb-6 flex items-center justify-between"
        style={{
          background: 'linear-gradient(135deg, var(--accent-primary), #7c3aed)',
          color: '#fff',
        }}
      >
        <div>
          <p className="text-sm opacity-80 mb-1">当前积分</p>
          <div className="flex items-center gap-2">
            <Coins size={28} />
            <span className="text-4xl font-bold">{balance}</span>
          </div>
        </div>

        <button
          onClick={() => checkinMutation.mutate()}
          disabled={checkedInToday || checkinMutation.isLoading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all"
          style={{
            backgroundColor: checkedInToday ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.9)',
            color: checkedInToday ? 'rgba(255,255,255,0.6)' : 'var(--accent-primary)',
            cursor: checkedInToday ? 'default' : 'pointer',
          }}
        >
          {checkedInToday ? (
            <>
              <CheckCircle size={16} />
              今日已签到
            </>
          ) : (
            <>
              <Coins size={16} />
              {checkinMutation.isLoading ? '签到中...' : '每日签到 +10'}
            </>
          )}
        </button>
      </div>

      {/* 获取更多积分提示 */}
      <div
        className="rounded-xl p-4 mb-4 text-sm"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-secondary)',
        }}
      >
        <p className="font-medium mb-2" style={{ color: 'var(--text-primary)' }}>如何获得积分</p>
        <ul className="space-y-1">
          <li>• 每日签到 +10 积分</li>
          <li>• 注册账号 +50 积分</li>
          <li>• 邀请好友注册 +200 积分（双方均得）</li>
        </ul>
      </div>

      {/* 我的邀请码 */}
      {user?.inviteCode && (
        <div
          className="rounded-xl p-4 mb-6 flex items-center justify-between"
          style={{
            backgroundColor: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.25)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(99,102,241,0.15)' }}>
              <Gift size={16} style={{ color: '#6366f1' }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>我的邀请码</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>邀请好友注册，双方各得 200 积分</p>
            </div>
          </div>
          <button
            onClick={() => {
              const inviteUrl = `${window.location.origin}/register?ref=${user.inviteCode}`;
              navigator.clipboard.writeText(inviteUrl);
              toast.success('邀请链接已复制！');
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono font-bold transition-all"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: '#6366f1',
              letterSpacing: '0.1em',
            }}
          >
            {user.inviteCode}
            <Copy size={13} />
          </button>
        </div>
      )}

      {/* 积分流水 */}
      <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
        积分记录
      </h2>

      {transactions.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--text-tertiary)' }}>
          <Clock size={40} className="mx-auto mb-3 opacity-30" />
          <p>暂无积分记录</p>
        </div>
      ) : (
        <div className="space-y-2">
          {transactions.map(tx => (
            <div
              key={tx._id}
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: tx.type === 'earn' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  }}
                >
                  {tx.type === 'earn'
                    ? <TrendingUp size={15} style={{ color: '#10b981' }} />
                    : <TrendingDown size={15} style={{ color: '#ef4444' }} />
                  }
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {REASON_LABELS[tx.reason] || tx.reason}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {new Date(tx.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span
                  className="text-sm font-bold"
                  style={{ color: tx.type === 'earn' ? '#10b981' : '#ef4444' }}
                >
                  {tx.type === 'earn' ? '+' : '-'}{tx.amount}
                </span>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  余额 {tx.balanceAfter}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Credits;
