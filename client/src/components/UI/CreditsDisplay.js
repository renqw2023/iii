import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Coins, CheckCircle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { creditsAPI } from '../../services/creditsApi';
import { useAuth } from '../../contexts/AuthContext';
import CreditsModal from './CreditsModal';

const DAILY_FREE = 40;

const CreditsDisplay = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [hovered, setHovered] = useState(false);
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);

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

  const freeCredits = data.freeCredits ?? DAILY_FREE;
  const paidCredits = data.credits ?? 0;
  const dailyFree = data.dailyFreeAmount ?? DAILY_FREE;

  // 进度条：freeCredits 已用部分（蓝色）+ 剩余（黄色）
  const freeUsed = dailyFree - freeCredits;
  const freeUsedPct = Math.round((freeUsed / dailyFree) * 100);
  const freeLeftPct = Math.round((freeCredits / dailyFree) * 100);

  return (
    <>
      <div
        className="relative flex items-center gap-2"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
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

        {/* 积分显示（hover 触发区） */}
        <Link
          to="/credits"
          className="flex items-center gap-1 text-sm font-medium transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          title="查看积分"
        >
          <Coins size={15} style={{ color: '#f59e0b' }} />
          <span>{freeCredits + paidCredits}</span>
        </Link>

        {/* Hover 积分明细卡片 */}
        {hovered && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: 0,
              zIndex: 50,
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: 14,
              boxShadow: '0 10px 40px rgba(0,0,0,0.13)',
              padding: '14px 16px',
              minWidth: 230,
              fontSize: 13,
            }}
          >
            {/* 顶行：Free 标题 + Add Credits 按钮 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontWeight: 600, color: '#111' }}>Free</span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setHovered(false);
                  setCreditsModalOpen(true);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#6366f1',
                  background: '#f0f0ff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '3px 10px',
                  cursor: 'pointer',
                }}
              >
                <Plus size={11} />
                Add Credits
              </button>
            </div>

            {/* Credits 行 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: '#374151' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ color: '#f59e0b', fontSize: 14 }}>✦</span>
                Credits
              </span>
              <strong style={{ color: '#111' }}>{paidCredits}</strong>
            </div>

            {/* Free Daily Credits 行 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#374151' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 14 }}>↺</span>
                Free Daily Credits
              </span>
              <strong style={{ color: '#111' }}>{freeCredits}/{dailyFree}</strong>
            </div>

            {/* 进度条 */}
            <div style={{
              height: 6,
              borderRadius: 99,
              background: '#f3f4f6',
              overflow: 'hidden',
              marginBottom: 8,
            }}>
              {/* 已用（蓝色） */}
              {freeUsedPct > 0 && (
                <div style={{
                  width: `${freeUsedPct}%`,
                  height: '100%',
                  background: '#6366f1',
                  float: 'left',
                  borderRadius: '99px 0 0 99px',
                }} />
              )}
              {/* 剩余（黄色） */}
              {freeLeftPct > 0 && (
                <div style={{
                  width: `${freeLeftPct}%`,
                  height: '100%',
                  background: '#fbbf24',
                  float: 'left',
                  borderRadius: freeUsedPct === 0 ? 99 : '0 99px 99px 0',
                }} />
              )}
            </div>

            {/* 提示文字 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#9ca3af', fontSize: 11 }}>
              <span style={{ fontSize: 9, color: '#fbbf24' }}>⬤</span>
              Daily credits used first
            </div>
          </div>
        )}
      </div>

      <CreditsModal open={creditsModalOpen} onClose={() => setCreditsModalOpen(false)} />
    </>
  );
};

export default CreditsDisplay;
