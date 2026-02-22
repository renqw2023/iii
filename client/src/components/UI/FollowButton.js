import React, { useState } from 'react';
import { UserPlus, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { enhancedUserAPI } from '../../services/enhancedApi';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const FollowButton = ({ 
  userId, 
  isFollowing: initialIsFollowing = false, 
  followersCount: initialFollowersCount = 0,
  size = 'md',
  variant = 'primary'
}) => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [isLoading, setIsLoading] = useState(false);

  // 如果是自己，不显示关注按钮
  if (user?._id === userId) {
    return null;
  }

  const handleFollow = async () => {
    if (!isAuthenticated) {
      toast.error(t('followButton.errors.loginRequired'));
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    const wasFollowing = isFollowing;
    
    // 乐观更新UI
    setIsFollowing(!isFollowing);
    setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
    
    try {
      const response = await enhancedUserAPI.followUser(userId);
      toast.success(response.data.message);
    } catch (error) {
      // 回滚UI状态
      setIsFollowing(wasFollowing);
      setFollowersCount(prev => wasFollowing ? prev + 1 : prev - 1);
      toast.error(error.response?.data?.message || t('followButton.errors.operationFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2';
    }
  };

  const getVariantClasses = () => {
    if (isFollowing) {
      return 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300';
    }
    
    switch (variant) {
      case 'secondary':
        return 'btn btn-secondary';
      case 'outline':
        return 'btn btn-outline';
      default:
        return 'btn btn-primary';
    }
  };

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`${getSizeClasses()} ${getVariantClasses()} flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 w-full rounded-full`}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isFollowing ? (
        <UserCheck className="w-4 h-4" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      <span>
        {isFollowing ? t('followButton.following') : t('followButton.follow')}
        {followersCount > 0 && ` (${followersCount})`}
      </span>
    </button>
  );
};

export default FollowButton;