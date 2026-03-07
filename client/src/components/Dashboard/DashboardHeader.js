import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Settings, Calendar, Copy, Check } from 'lucide-react';
import { getUserAvatar, DEFAULT_FALLBACK_AVATAR } from '../../utils/avatarUtils';
import toast from 'react-hot-toast';

const DashboardHeader = ({ user }) => {
  const [copied, setCopied] = useState(false);

  if (!user) {
    return (
      <div
        className="rounded-2xl p-6 mb-8 animate-pulse"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
          <div className="space-y-2">
            <div className="h-6 rounded w-32" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
            <div className="h-4 rounded w-48" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
            <div className="h-3 rounded w-24" style={{ backgroundColor: 'var(--bg-tertiary)' }}></div>
          </div>
        </div>
      </div>
    );
  }

  const handleCopyInviteLink = () => {
    const link = `${window.location.origin}/register?invite=${user.inviteCode}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      toast.success('邀请链接已复制');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl p-6 mb-8"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
        {/* 用户信息 */}
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <img
            src={getUserAvatar(user)}
            alt={user?.username || 'Avatar'}
            className="w-20 h-20 rounded-full object-cover border-4 shadow-lg"
            style={{ borderColor: 'var(--accent-primary)' }}
            onError={(e) => { e.target.src = DEFAULT_FALLBACK_AVATAR; }}
          />
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              {user?.username}
            </h1>
            {user?.bio && (
              <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
                {user.bio}
              </p>
            )}
            <div className="flex items-center space-x-1 text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
              <Calendar className="w-4 h-4" />
              <span>Joined {new Date(user?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
            </div>
            {user?.inviteCode && (
              <div className="flex items-center gap-2 text-sm mt-1">
                <span style={{ color: 'var(--text-secondary)' }}>Invite code:</span>
                <code
                  className="px-1.5 py-0.5 rounded text-xs font-mono"
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                >
                  {user.inviteCode}
                </code>
                <button
                  onClick={handleCopyInviteLink}
                  className="flex items-center gap-1 text-xs px-2 py-0.5 rounded transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-tertiary)',
                    color: copied ? '#10b981' : 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {copied ? <Check size={10} /> : <Copy size={10} />}
                  {copied ? 'Copied!' : 'Copy link'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 设置按钮 */}
        <Link
          to="/settings"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
          }}
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
      </div>
    </motion.div>
  );
};

export default DashboardHeader;
