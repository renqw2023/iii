import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  Heart, 
  Eye, 
  MessageCircle,
  UserPlus,
  UserMinus,
  Calendar,
  MapPin,
  Link as LinkIcon,
  Grid,
  List,
  ArrowLeft
} from 'lucide-react';
import PostCard from '../components/Post/PostCard';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { enhancedUserAPI, enhancedPostAPI } from '../services/enhancedApi';
import { getUserAvatar, DEFAULT_FALLBACK_AVATAR } from '../utils/avatarUtils';
import toast from 'react-hot-toast';

const Profile = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [viewMode, setViewMode] = useState('grid');
  const [user, setUser] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 获取用户资料
  const fetchUserProfile = useCallback(async () => {
    if (!id) return;
    
    try {
      const response = await enhancedUserAPI.getProfile(id);
      const userData = response.data.user;
      setUser(userData);
      setIsFollowing(userData.isFollowing || false);
    } catch (error) {
      console.error('获取用户资料失败:', error);
      setError(t('profile.errors.loadProfileFailed'));
    }
  }, [id, t]);

  // 获取用户帖子
  const fetchUserPosts = useCallback(async () => {
    if (!id) return;
    
    try {
      const response = await enhancedPostAPI.getPosts({ 
        author: id,
        limit: 12,
        sort: 'createdAt'
      });
      setUserPosts(response.data.posts || []);
    } catch (error) {
      console.error('获取用户帖子失败:', error);
      setError(t('profile.errors.loadPostsFailed'));
    }
  }, [id, t]);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchUserProfile(),
        fetchUserPosts()
      ]);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile, fetchUserPosts]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 处理关注/取消关注
  const handleFollow = async () => {
    if (!currentUser || !user) return;
    
    try {
      const _response = await enhancedUserAPI.followUser(user._id);
      setIsFollowing(!isFollowing);
      // 更新关注者数量
      setUser(prev => ({
        ...prev,
        followersCount: isFollowing ? prev.followersCount - 1 : prev.followersCount + 1
      }));
      
      // 显示成功消息
      toast.success(isFollowing ? t('profile.messages.unfollowSuccess') : t('profile.messages.followSuccess'));
    } catch (error) {
      console.error('关注操作失败:', error);
      toast.error(t('profile.messages.followFailed'));
    }
  };
    
  const isOwnProfile = currentUser?._id === id;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('profile.errors.loadFailed')}</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button 
            onClick={loadData}
            className="btn btn-primary mr-4"
          >
            {t('profile.actions.reload')}
          </button>
          <Link to="/" className="btn btn-secondary">
            {t('profile.backToHome')}
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{t('profile.errors.userNotFound')}</h2>
          <p className="text-slate-600 mb-4">{t('profile.errors.userNotFoundDesc')}</p>
          <Link to="/" className="btn btn-primary">
            {t('profile.backToHome')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 返回按钮 */}
        <Link
          to="/"
          className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-6 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回首页
        </Link>

        {/* 用户信息卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="flex items-start space-x-6 mb-6 md:mb-0">
              <img 
                src={getUserAvatar(user)} 
                alt={user.username}
                className="w-24 h-24 rounded-full object-cover flex-shrink-0"
                onError={(e) => {
                  e.target.src = DEFAULT_FALLBACK_AVATAR;
                }}
              />
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  {user.username}
                </h1>
                
                {user.bio && (
                  <p className="text-slate-700 mb-4 max-w-2xl leading-relaxed">
                    {user.bio}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{t('profile.joinedOn')} {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  {user.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{user.location}</span>
                    </div>
                  )}
                  
                  {user.website && (
                    <a
                      href={user.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-primary-600 hover:text-primary-700 transition-colors duration-200"
                    >
                      <LinkIcon className="w-4 h-4" />
                      <span>{t('profile.personalWebsite')}</span>
                    </a>
                  )}
                </div>

                {/* 统计数据 */}
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-xl font-bold text-slate-900">
                      {user.stats?.totalPosts || userPosts.length}
                    </div>
                    <div className="text-sm text-slate-600">{t('profile.stats.posts')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-slate-900">
                      {user.followersCount || 0}
                    </div>
                    <div className="text-sm text-slate-600">{t('profile.stats.followers')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-slate-900">
                      {user.followingCount || 0}
                    </div>
                    <div className="text-sm text-slate-600">{t('profile.stats.following')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-slate-900">
                      {user.stats.totalLikes}
                    </div>
                    <div className="text-sm text-slate-600">{t('profile.stats.likes')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            {!isOwnProfile && (
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleFollow}
                  className={`btn ${
                    isFollowing 
                      ? 'btn-secondary' 
                      : 'btn-primary'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4 mr-2" />
                      {t('profile.actions.unfollow')}
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      {t('profile.actions.follow')}
                    </>
                  )}
                </button>
                

              </div>
            )}

            {isOwnProfile && (
              <Link to="/settings" className="btn btn-secondary">
                {t('profile.actions.editProfile')}
              </Link>
            )}
          </div>
        </motion.div>

        {/* 作品展示 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="card"
        >
          {/* 标题和视图切换 */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900">
              {t('profile.works.title')} ({user.stats.totalPosts})
            </h2>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  viewMode === 'list'
                    ? 'bg-primary-100 text-primary-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 作品列表 */}
          <div className="p-6">
            {userPosts.length > 0 ? (
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'space-y-4'
              }>
                {userPosts.map((post, index) => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    {viewMode === 'grid' ? (
                      <PostCard post={post} />
                    ) : (
                      <div className="flex space-x-4 p-4 bg-slate-50 rounded-lg">
                        <div className="w-24 h-24 bg-slate-200 rounded-lg flex-shrink-0">
                          <img
                            src={post.media[0]?.url}
                            alt={post.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-900 mb-1 truncate">
                            {post.title}
                          </h3>
                          <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                            {post.description}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-slate-500">
                            <div className="flex items-center space-x-1">
                              <Heart className="w-4 h-4" />
                              <span>{post.likesCount}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="w-4 h-4" />
                              <span>{post.commentsCount}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Eye className="w-4 h-4" />
                              <span>{post.views}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  {t('profile.works.noWorks')}
                </h3>
                <p className="text-slate-600">
                  {isOwnProfile ? t('profile.works.createFirst') : t('profile.works.userNoWorks')}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;