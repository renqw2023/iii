import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, Send, Heart, Reply } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { promptAPI } from '../services/promptApi';
import { useAuth } from '../contexts/AuthContext';
import UserAvatar from './UserAvatar';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import toast from 'react-hot-toast';

const CommentSection = ({ promptId }) => {
  const { isAuthenticated, user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await promptAPI.getPromptById(promptId);
      setComments(response.data.prompt.comments || []);
    } catch (err) {
      console.error('获取评论失败:', err);
      setError('获取评论失败');
    } finally {
      setLoading(false);
    }
  }, [promptId]);

  useEffect(() => {
    if (promptId) {
      fetchComments();
    }
  }, [promptId, fetchComments]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;

    try {
      setSubmitting(true);
      await promptAPI.addComment(promptId, { content: newComment });
      setNewComment('');
      toast.success('Comment posted');
      fetchComments();
    } catch (err) {
      console.error('发布评论失败:', err);
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || !isAuthenticated || !replyTo) return;

    try {
      setSubmitting(true);
      await promptAPI.replyToComment(promptId, replyTo, { content: replyContent });
      setReplyContent('');
      setReplyTo(null);
      toast.success('Reply posted');
      fetchComments();
    } catch (err) {
      console.error('发布回复失败:', err);
      toast.error('Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async () => {
    if (!isAuthenticated) {
      toast.error('Please login first');
      return;
    }

    try {
      // 这里应该调用点赞评论的API
      toast.success('Liked!');
    } catch (err) {
      console.error('点赞失败:', err);
      toast.error('点赞失败');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <MessageCircle className="w-5 h-5 mr-2" />
          评论区
        </h3>
        <LoadingSpinner className="py-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
          <MessageCircle className="w-5 h-5 mr-2" />
          评论区
        </h3>
        <ErrorMessage 
          message={error} 
          onRetry={fetchComments}
          variant="card"
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
        <MessageCircle className="w-5 h-5 mr-2" />
        评论区 ({comments.length})
      </h3>

      {/* 发表评论 */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="flex gap-3">
            <UserAvatar user={user} size="sm" />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="写下你的评论..."
                className="w-full p-3 border border-slate-300 rounded-lg resize-none focus:border-primary-500 focus:outline-none"
                rows={3}
                maxLength={500}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-slate-500">
                  {newComment.length}/500
                </span>
                <button
                  type="submit"
                  disabled={!newComment.trim() || submitting}
                  className="btn btn-primary btn-sm flex items-center gap-2"
                >
                  {submitting ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  发布评论
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-slate-50 rounded-lg text-center">
          <p className="text-slate-600 mb-2">登录后可以发表评论</p>
          <button className="btn btn-primary btn-sm">
            立即登录
          </button>
        </div>
      )}

      {/* 评论列表 */}
      <div className="space-y-4">
        <AnimatePresence>
          {comments.length > 0 ? (
            comments.map((comment) => (
              <motion.div
                key={comment._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="border border-slate-200 rounded-lg p-4"
              >
                <div className="flex gap-3">
                  <UserAvatar user={comment.user} size="sm" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-slate-900">
                        {comment.user.username}
                      </span>
                      <span className="text-sm text-slate-500">
                        {new Date(comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-700 mb-3">{comment.content}</p>
                    
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLikeComment(comment._id)}
                        className="flex items-center gap-1 text-sm text-slate-500 hover:text-red-600 transition-colors"
                      >
                        <Heart className="w-4 h-4" />
                        {comment.likesCount || 0}
                      </button>
                      
                      {isAuthenticated && (
                        <button
                          onClick={() => setReplyTo(comment._id)}
                          className="flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600 transition-colors"
                        >
                          <Reply className="w-4 h-4" />
                          回复
                        </button>
                      )}
                    </div>

                    {/* 回复表单 */}
                    {replyTo === comment._id && (
                      <motion.form
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleSubmitReply}
                        className="mt-3 pl-4 border-l-2 border-primary-200"
                      >
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder={`回复 @${comment.user.username}...`}
                          className="w-full p-2 border border-slate-300 rounded resize-none focus:border-primary-500 focus:outline-none"
                          rows={2}
                          maxLength={300}
                        />
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-slate-500">
                            {replyContent.length}/300
                          </span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setReplyTo(null);
                                setReplyContent('');
                              }}
                              className="btn btn-ghost btn-sm"
                            >
                              取消
                            </button>
                            <button
                              type="submit"
                              disabled={!replyContent.trim() || submitting}
                              className="btn btn-primary btn-sm"
                            >
                              {submitting ? <LoadingSpinner size="sm" /> : '回复'}
                            </button>
                          </div>
                        </div>
                      </motion.form>
                    )}

                    {/* 回复列表 */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-3 pl-4 border-l-2 border-slate-200 space-y-3">
                        {comment.replies.map((reply) => (
                          <div key={reply._id} className="flex gap-3">
                            <UserAvatar user={reply.user} size="xs" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-slate-900 text-sm">
                                  {reply.user.username}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {new Date(reply.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-slate-700 text-sm">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-slate-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>还没有评论，来发表第一条评论吧！</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CommentSection;