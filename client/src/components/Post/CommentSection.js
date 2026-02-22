import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Heart, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { enhancedPostAPI } from '../../services/enhancedApi';
import toast from 'react-hot-toast';
import { getUserAvatar, DEFAULT_FALLBACK_AVATAR } from '../../utils/avatarUtils';
import { useTranslation } from 'react-i18next';

const CommentSection = ({ postId, comments: initialComments = [], onCommentAdded }) => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [showAllComments, setShowAllComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error(t('comments.errors.loginRequired'));
      return;
    }

    if (!newComment.trim()) {
      toast.error(t('comments.errors.contentRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await enhancedPostAPI.addComment(postId, { content: newComment.trim() });
      const newCommentData = response.data.comment;
      
      setComments(prev => [...prev, newCommentData]);
      setNewComment('');
      toast.success(t('comments.success.published'));
      
      if (onCommentAdded) {
        onCommentAdded(newCommentData);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t('comments.errors.publishFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm(t('comments.confirmDelete'))) {
      return;
    }

    try {
      await enhancedPostAPI.deleteComment(postId, commentId);
      setComments(prev => prev.filter(comment => comment._id !== commentId));
      toast.success(t('comments.success.deleted'));
    } catch (error) {
      toast.error(error.response?.data?.message || t('comments.errors.deleteFailed'));
    }
  };

  const handleReplySubmit = async (commentId) => {
    if (!isAuthenticated) {
      toast.error(t('comments.errors.loginRequired'));
      return;
    }

    if (!replyText.trim()) {
      toast.error(t('comments.errors.replyContentRequired'));
      return;
    }

    setIsSubmittingReply(true);
    try {
      const response = await enhancedPostAPI.replyToComment(postId, commentId, { content: replyText.trim() });
      const newReply = response.data.reply;
      
      setComments(prev => prev.map(comment => {
        if (comment._id === commentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newReply]
          };
        }
        return comment;
      }));
      
      setReplyText('');
      setReplyingTo(null);
      toast.success(t('comments.success.replyPublished'));
    } catch (error) {
      toast.error(error.response?.data?.message || t('comments.errors.replyPublishFailed'));
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDeleteReply = async (commentId, replyId) => {
    if (!window.confirm(t('comments.confirmDeleteReply'))) {
      return;
    }

    try {
      await enhancedPostAPI.deleteReply(postId, commentId, replyId);
      setComments(prev => prev.map(comment => {
        if (comment._id === commentId) {
          return {
            ...comment,
            replies: comment.replies.filter(reply => reply._id !== replyId)
          };
        }
        return comment;
      }));
      toast.success(t('comments.success.replyDeleted'));
    } catch (error) {
      toast.error(error.response?.data?.message || t('comments.errors.deleteFailed'));
    }
  };

  const formatTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return t('comments.time.justNow');
    if (diffInMinutes < 60) return t('comments.time.minutesAgo', { count: diffInMinutes });
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return t('comments.time.hoursAgo', { count: diffInHours });
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return t('comments.time.daysAgo', { count: diffInDays });
    
    return date.toLocaleDateString();
  };

  return (
    <div className="border-t border-slate-200 pt-4">
      {/* 评论统计和切换按钮 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors duration-200"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">
            {t('comments.count', { count: comments.length })}
          </span>
        </button>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* 评论输入框 */}
            {isAuthenticated && (
              <form onSubmit={handleSubmitComment} className="mb-6">
                <div className="flex gap-3">
                  <img 
                    src={getUserAvatar(user)} 
                    alt={user?.username}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      e.target.src = DEFAULT_FALLBACK_AVATAR;
                    }}
                  />
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={t('comments.placeholder')}
                      className="w-full p-3 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      rows={3}
                      maxLength={500}
                    />
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-slate-500">
                        {newComment.length}/500
                      </span>
                      <button
                        type="submit"
                        disabled={isSubmitting || !newComment.trim()}
                        className="btn btn-primary btn-sm flex items-center gap-2"
                      >
                        {isSubmitting ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        {t('comments.publish')}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* 评论列表 */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>{t('comments.noComments')}</p>
                </div>
              ) : (
                (showAllComments ? comments : comments.slice(0, 10)).map((comment) => (
                  <motion.div
                    key={comment._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex gap-3 group"
                  >
                    {/* 用户头像 */}
                    <img 
                      src={getUserAvatar(comment.user)} 
                      alt={comment.user?.username}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        e.target.src = DEFAULT_FALLBACK_AVATAR;
                      }}
                    />

                    {/* 评论内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-slate-900 text-sm">
                            {comment.user?.username || t('comments.anonymousUser')}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">
                              {formatTime(comment.createdAt)}
                            </span>
                            {/* 删除按钮 - 只有作者或评论者可以删除 */}
                            {(user?._id === comment.user?._id || user?.role === 'admin') && (
                              <button
                                onClick={() => handleDeleteComment(comment._id)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition-all duration-200"
                                title={t('comments.deleteComment')}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-slate-700 text-sm leading-relaxed">
                          {comment.content}
                        </p>
                      </div>

                      {/* 评论操作 */}
                      <div className="flex items-center gap-4 mt-2 ml-3">
                        <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors duration-200">
                          <Heart className="w-3 h-3" />
                          <span>{t('comments.like')}</span>
                        </button>
                        <button 
                          onClick={() => {
                            if (!isAuthenticated) {
                              toast.error(t('comments.errors.loginRequired'));
                              return;
                            }
                            setReplyingTo(replyingTo === comment._id ? null : comment._id);
                            setReplyText('');
                          }}
                          className="text-xs text-slate-500 hover:text-slate-700 transition-colors duration-200"
                        >
                          {replyingTo === comment._id ? t('comments.cancelReply') : t('comments.reply')}
                        </button>
                      </div>

                      {/* 回复输入框 */}
                      {replyingTo === comment._id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 ml-3"
                        >
                          <div className="flex gap-2">
                            <img 
                              src={getUserAvatar(user)} 
                              alt={user?.username}
                              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                              onError={(e) => {
                                e.target.src = DEFAULT_FALLBACK_AVATAR;
                              }}
                            />
                            <div className="flex-1">
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={t('comments.replyPlaceholder', { username: comment.user?.username || t('comments.anonymousUser') })}
                                className="w-full p-2 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                                rows={2}
                                maxLength={300}
                              />
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-slate-500">
                                  {replyText.length}/300
                                </span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setReplyText('');
                                    }}
                                    className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
                                  >
                                    {t('comments.cancel')}
                                  </button>
                                  <button
                                    onClick={() => handleReplySubmit(comment._id)}
                                    disabled={isSubmittingReply || !replyText.trim()}
                                    className="btn btn-primary btn-xs flex items-center gap-1"
                                  >
                                    {isSubmittingReply ? (
                                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <Send className="w-3 h-3" />
                                    )}
                                    {t('comments.publish')}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* 回复列表 */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 ml-6 space-y-2">
                          {comment.replies.map((reply) => (
                            <motion.div
                              key={reply._id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex gap-2 group"
                            >
                              <img 
                                src={getUserAvatar(reply.user)} 
                                alt={reply.user?.username}
                                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                onError={(e) => {
                                  e.target.src = DEFAULT_FALLBACK_AVATAR;
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="bg-slate-100 rounded-lg p-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-slate-900 text-xs">
                                      {reply.user?.username || t('comments.anonymousUser')}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs text-slate-500">
                                        {formatTime(reply.createdAt)}
                                      </span>
                                      {(user?._id === reply.user?._id || user?.role === 'admin') && (
                                        <button
                                          onClick={() => handleDeleteReply(comment._id, reply._id)}
                                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-600 transition-all duration-200"
                                          title={t('comments.deleteReply')}
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-slate-700 text-xs leading-relaxed">
                                    {reply.content}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* 查看更多按钮 */}
            {comments.length > 10 && !showAllComments && (
              <div className="text-center pt-4">
                <button
                  onClick={() => setShowAllComments(true)}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors duration-200"
                >
                  {t('comments.viewMore', { count: comments.length - 10 })}
                </button>
              </div>
            )}

            {/* 收起按钮 */}
            {comments.length > 10 && showAllComments && (
              <div className="text-center pt-4">
                <button
                  onClick={() => setShowAllComments(false)}
                  className="text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors duration-200"
                >
                  {t('comments.collapse')}
                </button>
              </div>
            )}

            {/* 登录提示 */}
            {!isAuthenticated && (
              <div className="text-center py-6 bg-slate-50 rounded-lg">
                <p className="text-slate-600 mb-3">{t('comments.loginPrompt')}</p>
                <div className="flex gap-3 justify-center">
                  <a href="/login" className="btn btn-primary btn-sm">
                    {t('navigation.login')}
                  </a>
                  <a href="/register" className="btn btn-secondary btn-sm">
                    {t('navigation.register')}
                  </a>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommentSection;