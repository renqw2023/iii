import React from 'react';
import { User } from 'lucide-react';
import { getUserAvatar } from '../utils/avatarUtils';

const UserAvatar = ({ 
  user, 
  size = 'md', 
  className = '',
  showName = false,
  onClick = null 
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const handleClick = () => {
    if (onClick) {
      onClick(user);
    }
  };

  if (!user) {
    return (
      <div className={`${sizeClasses[size]} bg-slate-200 rounded-full flex items-center justify-center ${className}`}>
        <User className="w-1/2 h-1/2 text-slate-400" />
      </div>
    );
  }

  const avatarElement = (
    <img
      src={getUserAvatar(user)}
      alt={user.username || '用户头像'}
      className={`${sizeClasses[size]} rounded-full object-cover border-2 border-white shadow-sm ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${className}`}
      onClick={handleClick}
      onError={(e) => {
        e.target.src = '/Circle/01.png';
      }}
    />
  );

  if (showName) {
    return (
      <div className="flex items-center gap-2">
        {avatarElement}
        <span className={`font-medium text-slate-700 ${textSizeClasses[size]} ${onClick ? 'cursor-pointer hover:text-primary-600 transition-colors' : ''}`} onClick={handleClick}>
          {user.username}
        </span>
      </div>
    );
  }

  return avatarElement;
};

export default UserAvatar;