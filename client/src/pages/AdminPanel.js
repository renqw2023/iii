import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  FileText, 
  TrendingUp,
  Search,
  Filter,
  MoreHorizontal,
  Shield,
  Ban,
  CheckCircle,
  XCircle,
  Star,
  Megaphone,
  Send
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { enhancedAdminAPI } from '../services/enhancedApi';
import { adminAPI as apiAdminAPI } from '../services/api';
import AdminStatsPanel from '../components/Admin/AdminStatsPanel';
import { getUserAvatar, DEFAULT_FALLBACK_AVATAR } from '../utils/avatarUtils';

const AdminPanel = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);



  // 获取用户列表
  const fetchUsers = useCallback(async (page = 1) => {
    try {
      const params = {
        page,
        limit: 20,
        search: searchTerm || undefined,
        status: filterStatus === 'all' ? undefined : filterStatus
      };
      
      const response = await enhancedAdminAPI.getUsers(params);
      if (response.data && response.data.success && response.data.data) {
        setUsers(response.data.data.users || []);
        setPagination(response.data.data.pagination || { current: 1, pages: 1, total: 0 });
      } else {
        setUsers([]);
        setPagination({ current: 1, pages: 1, total: 0 });
        console.error('获取用户列表失败:', response.data?.message || '未知错误');
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
      setError('获取用户列表失败');
    }
  }, [searchTerm, filterStatus]);

  // 获取帖子列表
  const fetchPosts = useCallback(async (page = 1) => {
    try {
      const params = {
        page,
        limit: 20,
        search: searchTerm || undefined,
        status: filterStatus === 'all' ? undefined : filterStatus
      };
      
      const response = await enhancedAdminAPI.getPosts(params);
      if (response.data && response.data.success && response.data.data) {
        setPosts(response.data.data.posts || []);
        setPostPagination(response.data.data.pagination || { current: 1, pages: 1, total: 0 });
      } else {
        setPosts([]);
        setPostPagination({ current: 1, pages: 1, total: 0 });
        console.error('获取帖子列表失败:', response.data?.message || '未知错误');
      }
    } catch (error) {
      console.error('获取帖子列表失败:', error);
      setError('获取帖子列表失败');
    }
  }, [searchTerm, filterStatus]);

  // 获取提示词列表
  const fetchPrompts = useCallback(async (page = 1) => {
    try {
      const params = {
        page,
        limit: 20,
        search: searchTerm || undefined,
        status: filterStatus === 'all' ? undefined : filterStatus
      };
      
      const response = await apiAdminAPI.getPrompts(params);
      if (response.data && response.data.success && response.data.data) {
        setPrompts(response.data.data.prompts || []);
        setPromptPagination(response.data.data.pagination || { current: 1, pages: 1, total: 0 });
      } else {
        setPrompts([]);
        setPromptPagination({ current: 1, pages: 1, total: 0 });
        console.error('获取提示词列表失败:', response.data?.message || '未知错误');
      }
    } catch (error) {
      console.error('获取提示词列表失败:', error);
      setError('获取提示词列表失败');
    }
  }, [searchTerm, filterStatus]);

  // 状态管理
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [recentContent, setRecentContent] = useState([]); // 最新作品（包含帖子和提示词）
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [postPagination, setPostPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [promptPagination, setPromptPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [selectedPrompts, setSelectedPrompts] = useState([]);
  // const [showBatchActions, setShowBatchActions] = useState(false); // 暂未使用
  const [userDropdownOpen, setUserDropdownOpen] = useState(null);
  const [postDropdownOpen, setPostDropdownOpen] = useState(null);
  const [promptDropdownOpen, setPromptDropdownOpen] = useState(null);
  
  // 全局广播相关状态
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState('all'); // 'all' 或 'selected'
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastHistory, setBroadcastHistory] = useState([]);

  const tabs = [
    { id: 'overview', label: '概览', icon: TrendingUp },
    { id: 'users', label: '用户管理', icon: Users },
    { id: 'posts', label: '内容管理', icon: FileText },
    { id: 'prompts', label: '提示词管理', icon: FileText },
    { id: 'broadcast', label: '全局广播', icon: Megaphone }
  ];

  // 更新用户状态
  const handleUserStatusToggle = async (userId, currentStatus) => {
    try {
      const newStatus = currentStatus ? 'inactive' : 'active';
      await enhancedAdminAPI.updateUserStatus(userId, { status: newStatus });
      setUsers(prev => 
        prev.map(user => 
          user._id === userId ? { ...user, isActive: !currentStatus } : user
        )
      );
    } catch (error) {
      console.error('更新用户状态失败:', error);
      alert('Failed to update user status');
    }
  };

  // 切换帖子状态
  const handlePostToggle = async (postId, field, currentValue) => {
    try {
      if (field === 'isFeatured') {
        await enhancedAdminAPI.toggleFeatured(postId, !currentValue);
        setPosts(prev => 
          prev.map(post => 
            post._id === postId ? { ...post, isFeatured: !currentValue } : post
          )
        );
      } else if (field === 'isPublic') {
        await enhancedAdminAPI.updatePost(postId, { isPublic: !currentValue });
        setPosts(prev => 
          prev.map(post => 
            post._id === postId ? { ...post, isPublic: !currentValue } : post
          )
        );
      }
    } catch (error) {
      console.error('更新帖子状态失败:', error);
      alert('Failed to update post status');
    }
  };

  // 删除帖子
  const handleDeletePost = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await enhancedAdminAPI.deletePost(postId);
        setPosts(prev => prev.filter(post => post._id !== postId));
      } catch (error) {
        console.error('删除帖子失败:', error);
        alert('Failed to delete post');
      }
    }
  };

  // 切换提示词状态
  const handlePromptToggle = async (promptId, field, currentValue) => {
    try {
      if (field === 'isFeatured') {
        await apiAdminAPI.togglePromptFeatured(promptId, !currentValue);
        setPrompts(prev => 
          prev.map(prompt => 
            prompt._id === promptId ? { ...prompt, isFeatured: !currentValue } : prompt
          )
        );
      } else if (field === 'isPublic') {
        await apiAdminAPI.updatePrompt(promptId, { isPublic: !currentValue });
        setPrompts(prev => 
          prev.map(prompt => 
            prompt._id === promptId ? { ...prompt, isPublic: !currentValue } : prompt
          )
        );
      }
    } catch (error) {
      console.error('更新提示词状态失败:', error);
      alert('Failed to update prompt status');
    }
  };

  // 删除提示词
  const handleDeletePrompt = async (promptId) => {
    if (window.confirm('Are you sure you want to delete this prompt?')) {
      try {
        await apiAdminAPI.deletePrompt(promptId);
        setPrompts(prev => prev.filter(prompt => prompt._id !== promptId));
      } catch (error) {
        console.error('删除提示词失败:', error);
        alert('Failed to delete prompt');
      }
    }
  };

  // 发送全局广播
  const handleSendBroadcast = async () => {
    if (!broadcastMessage.trim()) {
      alert('Please enter broadcast message');
      return;
    }

    if (broadcastType === 'selected' && selectedRecipients.length === 0) {
      alert('Please select recipients');
      return;
    }

    setBroadcastLoading(true);
    try {
      const payload = {
        message: broadcastMessage.trim(),
        broadcast: broadcastType === 'all',
        recipients: broadcastType === 'selected' ? selectedRecipients : undefined
      };

      const response = await enhancedAdminAPI.sendSystemNotification(payload);
      
      // 添加到广播历史
      const newBroadcast = {
        id: Date.now(),
        message: broadcastMessage,
        type: broadcastType,
        recipientCount: response.data.recipientCount,
        timestamp: new Date().toISOString()
      };
      setBroadcastHistory(prev => [newBroadcast, ...prev]);
      
      // 重置表单
      setBroadcastMessage('');
      setSelectedRecipients([]);
      
      alert(`广播发送成功！已发送给 ${response.data.recipientCount} 位用户`);
    } catch (error) {
      console.error('发送广播失败:', error);
      alert('Failed to send broadcast, please try again later');
    } finally {
      setBroadcastLoading(false);
    }
  };

  // 切换接收者选择
  const handleRecipientToggle = (userId) => {
    setSelectedRecipients(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // 获取最新作品数据（合并帖子和提示词）
  const fetchRecentContent = useCallback(async () => {
    try {
      const response = await enhancedAdminAPI.getStats();
      const data = response.data;
      
      // 合并最新帖子和提示词，按时间排序
      const recentPosts = (data.recent?.posts || []).map(item => ({
        ...item,
        type: 'post',
        contentType: '风格参考'
      }));
      
      const recentPrompts = (data.recent?.prompts || []).map(item => ({
        ...item,
        type: 'prompt',
        contentType: '提示词'
      }));
      
      const allRecentContent = [...recentPosts, ...recentPrompts]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5); // 只显示最新的5个
      
      setRecentContent(allRecentContent);
    } catch (error) {
      console.error('获取最新作品失败:', error);
    }
  }, []);

  // 加载数据
  // 加载所有数据的函数
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchUsers(),
        fetchPosts(),
        fetchPrompts(),
        fetchRecentContent()
      ]);
    } catch (error) {
      console.error('加载管理面板数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchUsers, fetchPosts, fetchPrompts, fetchRecentContent]);

  useEffect(() => {
    if (user?.id && user.role === 'admin') {
      loadData();
    }
  }, [user?.id, user?.role, loadData]); // 添加loadData依赖

  // 点击外部Close下拉菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.relative')) {
        setUserDropdownOpen(null);
        setPostDropdownOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 搜索和Filter变化时重新加载数据
  useEffect(() => {
    if (user?.id && user.role === 'admin' && !loading) {
      if (activeTab === 'users') {
        fetchUsers(1);
      } else if (activeTab === 'posts') {
        fetchPosts(1);
      } else if (activeTab === 'prompts') {
        fetchPrompts(1);
      }
    }
  }, [searchTerm, filterStatus, activeTab, user?.id, user?.role, loading, fetchUsers, fetchPosts, fetchPrompts]); // 添加函数依赖

  // 分页处理函数
  const handleUserPageChange = (page) => {
    fetchUsers(page);
  };

  const handlePostPageChange = (page) => {
    fetchPosts(page);
  };

  const handlePromptPageChange = (page) => {
    fetchPrompts(page);
  };

  // 批量操作处理函数
  const handleBatchUserAction = async (action) => {
    if (selectedUsers.length === 0) {
      alert('Please select users to operate');
      return;
    }

    const confirmMessage = {
      activate: '确定要激活选中的用户吗？',
      deactivate: '确定要禁用选中的用户吗？',
      delete: '确定要删除选中的用户吗？此操作不可恢复！'
    };

    if (window.confirm(confirmMessage[action])) {
      try {
        await enhancedAdminAPI.batchUpdateUsers(selectedUsers, action);
        setSelectedUsers([]);
        fetchUsers(pagination.current);
        alert('Batch operation completed');
      } catch (error) {
        console.error('批量操作失败:', error);
        alert('Batch operation failed');
      }
    }
  };

  const handleBatchPostAction = async (action) => {
    if (selectedPosts.length === 0) {
      alert('Please select posts to operate');
      return;
    }

    const confirmMessage = {
      feature: '确定要将选中的帖子设为精选吗？',
      unfeature: '确定要取消选中帖子的精选状态吗？',
      hide: '确定要隐藏选中的帖子吗？',
      show: '确定要公开选中的帖子吗？',
      delete: '确定要删除选中的帖子吗？此操作不可恢复！'
    };

    if (window.confirm(confirmMessage[action])) {
      try {
        await enhancedAdminAPI.batchUpdatePosts(selectedPosts, action);
        setSelectedPosts([]);
        fetchPosts(postPagination.current);
        alert('Batch operation completed');
      } catch (error) {
        console.error('批量操作失败:', error);
        alert('Batch operation failed');
      }
    }
  };

  // 选择处理函数
  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handlePostSelect = (postId) => {
    setSelectedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const handleSelectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id));
    }
  };

  const handleSelectAllPosts = () => {
    if (selectedPosts.length === posts.length) {
      setSelectedPosts([]);
    } else {
      setSelectedPosts(posts.map(post => post._id));
    }
  };

  // 提示词选择处理函数
  const handlePromptSelect = (promptId) => {
    setSelectedPrompts(prev => 
      prev.includes(promptId) 
        ? prev.filter(id => id !== promptId)
        : [...prev, promptId]
    );
  };

  const handleSelectAllPrompts = () => {
    if (selectedPrompts.length === prompts.length) {
      setSelectedPrompts([]);
    } else {
      setSelectedPrompts(prompts.map(prompt => prompt._id));
    }
  };

  // 提示词批量操作
  const handleBatchPromptAction = async (action) => {
    if (selectedPrompts.length === 0) {
      alert('Please select prompts to operate');
      return;
    }

    const confirmMessage = {
      feature: '确定要将选中的提示词设为精选吗？',
      unfeature: '确定要取消选中提示词的精选状态吗？',
      hide: '确定要隐藏选中的提示词吗？',
      show: '确定要公开选中的提示词吗？',
      delete: '确定要删除选中的提示词吗？此操作不可恢复！'
    };

    if (window.confirm(confirmMessage[action])) {
      try {
        await apiAdminAPI.batchUpdatePrompts(selectedPrompts, action);
        setSelectedPrompts([]);
        fetchPrompts(promptPagination.current);
        alert('Batch operation completed');
      } catch (error) {
        console.error('批量操作失败:', error);
        alert('Batch operation failed');
      }
    }
  };

  // 数据导出功能
  // 导出数据
  const exportData = async (type, format = 'csv') => {
    try {
      const response = await enhancedAdminAPI.exportData(type, format);
      
      if (format === 'json') {
        // JSON格式直接下载
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${type}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        // CSV格式
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${type}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('导出失败:', error);
      alert('Export failed, please try again later');
    }
  };

  // 导入数据
  const importData = async (type, file, mode = 'create') => {
    try {
      const text = await file.text();
      let data;
      
      if (file.name.endsWith('.json')) {
        data = JSON.parse(text);
      } else if (file.name.endsWith('.csv')) {
        // 简单的CSV解析（实际项目中建议使用专业的CSV解析库）
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        data = [];
        
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
            const obj = {};
            headers.forEach((header, index) => {
              obj[header] = values[index] || '';
            });
            data.push(obj);
          }
        }
      } else {
        throw new Error('Unsupported file format, please use JSON or CSV files');
      }
      
      const response = await enhancedAdminAPI.importData(type, data, mode);
      alert(`导入完成！成功：${response.data.results.success}，失败：${response.data.results.failed}`);
      
      if (response.data.results.errors.length > 0) {
        console.log('Import errors:', response.data.results.errors);
      }
      
      // 刷新数据
      await loadData();
    } catch (error) {
      console.error('导入失败:', error);
      alert(`导入失败：${error.message}`);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">访问被拒绝</h1>
          <p className="text-slate-600">您没有权限访问管理员面板</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-slate-600">加载管理面板中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.isActive) ||
                         (filterStatus === 'inactive' && !user.isActive);
    return matchesSearch && matchesFilter;
  });

  const filteredPosts = posts.filter(post => {
    const matchesSearch = (post.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.author?.username || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'public' && post.isPublic) ||
                         (filterStatus === 'private' && !post.isPublic) ||
                         (filterStatus === 'featured' && post.isFeatured);
    return matchesSearch && matchesFilter;
  });

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = (prompt.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (prompt.author?.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (prompt.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'public' && prompt.isPublic) ||
                         (filterStatus === 'private' && !prompt.isPublic) ||
                         (filterStatus === 'featured' && prompt.isFeatured);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Shield className="w-8 h-8 text-primary-500 mr-3" />
            <h1 className="text-3xl font-bold text-slate-900">管理员面板</h1>
          </div>
          <p className="text-slate-600">管理网站用户、内容和系统设置</p>
        </div>

        {/* 标签页导航 */}
        <div className="card mb-8">
          <nav className="flex space-x-8 p-6 border-b border-slate-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* 概览页面 */}
          {activeTab === 'overview' && (
            <div className="p-6">
              {/* 管理员统计面板 */}
              <AdminStatsPanel />
              
              {/* 数据导出导入 */}
              <div className="bg-slate-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  数据管理
                </h3>
                
                {/* 导出功能 */}
                <div className="mb-6">
                  <h4 className="text-md font-medium text-slate-700 mb-3">数据导出</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* 用户数据导出 */}
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <h5 className="font-medium text-slate-900 mb-2">用户数据</h5>
                      <div className="flex gap-2">
                        <button
                          onClick={() => exportData('users', 'csv')}
                          className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          CSV
                        </button>
                        <button
                          onClick={() => exportData('users', 'json')}
                          className="btn btn-sm bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          JSON
                        </button>
                      </div>
                    </div>
                    
                    {/* 作品数据导出 */}
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <h5 className="font-medium text-slate-900 mb-2">作品数据</h5>
                      <div className="flex gap-2">
                        <button
                          onClick={() => exportData('posts', 'csv')}
                          className="btn btn-sm bg-green-600 hover:bg-green-700 text-white"
                        >
                          CSV
                        </button>
                        <button
                          onClick={() => exportData('posts', 'json')}
                          className="btn btn-sm bg-green-500 hover:bg-green-600 text-white"
                        >
                          JSON
                        </button>
                      </div>
                    </div>
                    
                    {/* 统计数据导出 */}
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <h5 className="font-medium text-slate-900 mb-2">统计数据</h5>
                      <div className="flex gap-2">
                        <button
                          onClick={() => exportData('stats', 'csv')}
                          className="btn btn-sm bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          CSV
                        </button>
                        <button
                          onClick={() => exportData('stats', 'json')}
                          className="btn btn-sm bg-purple-500 hover:bg-purple-600 text-white"
                        >
                          JSON
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 导入功能 */}
                <div>
                  <h4 className="text-md font-medium text-slate-700 mb-3">数据导入</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 用户数据导入 */}
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <h5 className="font-medium text-slate-900 mb-3">用户数据导入</h5>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">导入模式</label>
                          <select 
                            id="userImportMode"
                            className="select w-full px-3 py-2 text-sm"
                            defaultValue="create"
                          >
                            <option value="create">仅创建新用户</option>
                            <option value="update">仅更新现有用户</option>
                            <option value="upsert">创建或更新</option>
                          </select>
                        </div>
                        <div>
                          <input
                            type="file"
                            accept=".json,.csv"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const mode = document.getElementById('userImportMode').value;
                                importData('users', file, mode);
                              }
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                          />
                        </div>
                        <p className="text-xs text-slate-500">支持JSON和CSV格式</p>
                      </div>
                    </div>
                    
                    {/* 作品数据导入 */}
                    <div className="bg-white rounded-lg p-4 border border-slate-200">
                      <h5 className="font-medium text-slate-900 mb-3">作品数据导入</h5>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">导入模式</label>
                          <select 
                            id="postImportMode"
                            className="select w-full px-3 py-2 text-sm"
                            defaultValue="create"
                          >
                            <option value="create">仅创建新作品</option>
                            <option value="update">仅更新现有作品</option>
                            <option value="upsert">创建或更新</option>
                          </select>
                        </div>
                        <div>
                          <input
                            type="file"
                            accept=".json,.csv"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const mode = document.getElementById('postImportMode').value;
                                importData('posts', file, mode);
                              }
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                          />
                        </div>
                        <p className="text-xs text-slate-500">支持JSON和CSV格式</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* 导入说明 */}
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <h6 className="text-sm font-medium text-blue-900 mb-1">导入说明</h6>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• <strong>仅创建新用户/作品</strong>：只导入不存在的数据，跳过已存在的</li>
                      <li>• <strong>仅更新现有用户/作品</strong>：只更新已存在的数据，跳过不存在的</li>
                      <li>• <strong>创建或更新</strong>：不存在则创建，存在则更新</li>
                      <li>• JSON格式包含完整的数据库字段，CSV格式为简化版本</li>
                      <li>• 导入前建议先导出当前数据作为备份</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 最近活动 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">最新用户</h3>
                  <div className="space-y-3">
                    {users.slice(0, 5).map((user) => (
                      <div 
                        key={user._id} 
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => setActiveTab('users')}
                      >
                        <img 
                          src={getUserAvatar(user)} 
                          alt={user.username}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            e.target.src = DEFAULT_FALLBACK_AVATAR;
                          }}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{user.username || '未知用户'}</p>
                          <p className="text-sm text-slate-500">{user.email || '无邮箱'}</p>
                        </div>
                        <div className="text-sm text-slate-500">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '未知时间'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">最新作品</h3>
                  <div className="space-y-3">
                    {recentContent.map((item) => (
                      <div 
                        key={item._id} 
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => setActiveTab(item.type === 'post' ? 'posts' : 'prompts')}
                      >
                        <div className="w-10 h-10 bg-slate-200 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-medium text-slate-600">
                            {item.type === 'post' ? '图' : '词'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-slate-900">{item.title || '无标题'}</p>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              item.type === 'post' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {item.contentType}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500">by {item.author?.username || '未知作者'}</p>
                        </div>
                        <div className="text-sm text-slate-500">
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '未知时间'}
                        </div>
                      </div>
                    ))}
                    {recentContent.length === 0 && (
                      <div className="text-center text-slate-500 py-4">
                        暂无最新作品
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 提示词管理页面 */}
          {activeTab === 'prompts' && (
            <div className="p-6">
              {/* 搜索和Filter */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search prompts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="select py-2 px-3"
                  >
                    <option value="all">全部提示词</option>
                    <option value="public">公开</option>
                    <option value="private">私密</option>
                    <option value="featured">精选</option>
                  </select>
                </div>
              </div>

              {/* 批量操作 - 提示词 */}
              {selectedPrompts.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-800 font-medium">
                      已选择 {selectedPrompts.length} 个提示词
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBatchPromptAction('feature')}
                        className="btn btn-sm bg-yellow-600 hover:bg-yellow-700 text-white"
                      >
                        批量精选
                      </button>
                      <button
                        onClick={() => handleBatchPromptAction('unfeature')}
                        className="btn btn-sm bg-gray-600 hover:bg-gray-700 text-white"
                      >
                        取消精选
                      </button>
                      <button
                        onClick={() => handleBatchPromptAction('hide')}
                        className="btn btn-sm bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        批量隐藏
                      </button>
                      <button
                        onClick={() => handleBatchPromptAction('show')}
                        className="btn btn-sm bg-green-600 hover:bg-green-700 text-white"
                      >
                        批量公开
                      </button>
                      <button
                        onClick={() => handleBatchPromptAction('delete')}
                        className="btn btn-sm bg-red-600 hover:bg-red-700 text-white"
                      >
                        批量删除
                      </button>
                      <button
                        onClick={() => setSelectedPrompts([])}
                        className="btn btn-sm bg-slate-600 hover:bg-slate-700 text-white"
                      >
                        取消选择
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 提示词列表 */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedPrompts.length === prompts.length && prompts.length > 0}
                            onChange={handleSelectAllPrompts}
                            className="rounded border-slate-300"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          提示词
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          作者
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          分类
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          状态
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          使用/收藏
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          创建时间
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {filteredPrompts.map((prompt) => (
                        <tr key={prompt._id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedPrompts.includes(prompt._id)}
                              onChange={() => handlePromptSelect(prompt._id)}
                              className="rounded border-slate-300"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="ml-4">
                                <div className="text-sm font-medium text-slate-900">
                                  {prompt.title}
                                </div>
                                <div className="text-sm text-slate-500 truncate max-w-xs">
                                  {prompt.description}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {prompt.author?.username || '未知作者'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {prompt.category || '未分类'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                prompt.isPublic 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {prompt.isPublic ? '公开' : '私密'}
                              </span>
                              {prompt.isFeatured && (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  精选
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {prompt.usageCount || 0} / {prompt.favoritesCount || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {prompt.createdAt ? new Date(prompt.createdAt).toLocaleDateString() : '未知时间'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handlePromptToggle(prompt._id, 'isFeatured', prompt.isFeatured)}
                                className={`${
                                  prompt.isFeatured 
                                    ? 'text-yellow-600 hover:text-yellow-900' 
                                    : 'text-gray-400 hover:text-yellow-600'
                                }`}
                                title={prompt.isFeatured ? '取消精选' : '设为精选'}
                              >
                                <Star className={`w-4 h-4 ${prompt.isFeatured ? 'fill-current' : ''}`} />
                              </button>
                              <button
                                onClick={() => handlePromptToggle(prompt._id, 'isPublic', prompt.isPublic)}
                                className={`${
                                  prompt.isPublic 
                                    ? 'text-green-600 hover:text-green-900' 
                                    : 'text-red-600 hover:text-red-900'
                                }`}
                                title={prompt.isPublic ? '设为私密' : '设为公开'}
                              >
                                {prompt.isPublic ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : (
                                  <XCircle className="w-4 h-4" />
                                )}
                              </button>
                              <div className="relative">
                                <button 
                                  className="text-slate-400 hover:text-slate-600"
                                  onClick={() => setPromptDropdownOpen(promptDropdownOpen === prompt._id ? null : prompt._id)}
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                                {promptDropdownOpen === prompt._id && (
                                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-slate-200">
                                    <div className="py-1">
                                      <button
                                        onClick={() => {
                                          handlePromptToggle(prompt._id, 'isFeatured', prompt.isFeatured);
                                          setPromptDropdownOpen(null);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                      >
                                        {prompt.isFeatured ? '取消精选' : '设为精选'}
                                      </button>
                                      <button
                                        onClick={() => {
                                          handlePromptToggle(prompt._id, 'isPublic', prompt.isPublic);
                                          setPromptDropdownOpen(null);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                      >
                                        {prompt.isPublic ? '设为私密' : '设为公开'}
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleDeletePrompt(prompt._id);
                                          setPromptDropdownOpen(null);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                      >
                                        删除提示词
                                      </button>
                                      <button
                                        onClick={() => {
                                          navigate(`/prompt/${prompt._id}`);
                                          setPromptDropdownOpen(null);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                      >
                                        查看详情
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* 分页 */}
                {promptPagination.pages > 1 && (
                  <div className="bg-white px-4 py-3 border-t border-slate-200 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => handlePromptPageChange(promptPagination.current - 1)}
                          disabled={promptPagination.current === 1}
                          className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          上一页
                        </button>
                        <button
                          onClick={() => handlePromptPageChange(promptPagination.current + 1)}
                          disabled={promptPagination.current === promptPagination.pages}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          下一页
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-slate-700">
                            Showing <span className="font-medium">{((promptPagination.current - 1) * 20) + 1}</span> 到{' '}
                            <span className="font-medium">{Math.min(promptPagination.current * 20, promptPagination.total)}</span> 条，
                            共 <span className="font-medium">{promptPagination.total}</span> 条记录
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                            <button
                              onClick={() => handlePromptPageChange(promptPagination.current - 1)}
                              disabled={promptPagination.current === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              上一页
                            </button>
                            {Array.from({ length: Math.min(5, promptPagination.pages) }, (_, i) => {
                              const page = i + Math.max(1, promptPagination.current - 2);
                              if (page > promptPagination.pages) return null;
                              return (
                                <button
                                  key={page}
                                  onClick={() => handlePromptPageChange(page)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    page === promptPagination.current
                                      ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                      : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
                                  }`}
                                >
                                  {page}
                                </button>
                              );
                            })}
                            <button
                              onClick={() => handlePromptPageChange(promptPagination.current + 1)}
                              disabled={promptPagination.current === promptPagination.pages}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              下一页
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 用户管理页面 */}
          {activeTab === 'users' && (
            <div className="p-6">
              {/* 搜索和Filter */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder={t('admin.users.searchPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="select py-2 px-3"
                  >
                    <option value="all">全部用户</option>
                    <option value="active">活跃用户</option>
                    <option value="inactive">已禁用</option>
                  </select>
                </div>
              </div>

              {/* 批量操作 */}
              {selectedUsers.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-800 font-medium">
                      已选择 {selectedUsers.length} 个用户
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBatchUserAction('activate')}
                        className="btn btn-sm bg-green-600 hover:bg-green-700 text-white"
                      >
                        批量激活
                      </button>
                      <button
                        onClick={() => handleBatchUserAction('deactivate')}
                        className="btn btn-sm bg-yellow-600 hover:bg-yellow-700 text-white"
                      >
                        批量禁用
                      </button>
                      <button
                        onClick={() => handleBatchUserAction('delete')}
                        className="btn btn-sm bg-red-600 hover:bg-red-700 text-white"
                      >
                        批量删除
                      </button>
                      <button
                        onClick={() => setSelectedUsers([])}
                        className="btn btn-sm bg-slate-600 hover:bg-slate-700 text-white"
                      >
                        取消选择
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 批量操作 - 帖子 */}
              {selectedPosts.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-800 font-medium">
                      已选择 {selectedPosts.length} 个帖子
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBatchPostAction('feature')}
                        className="btn btn-sm bg-yellow-600 hover:bg-yellow-700 text-white"
                      >
                        批量精选
                      </button>
                      <button
                        onClick={() => handleBatchPostAction('unfeature')}
                        className="btn btn-sm bg-gray-600 hover:bg-gray-700 text-white"
                      >
                        取消精选
                      </button>
                      <button
                        onClick={() => handleBatchPostAction('hide')}
                        className="btn btn-sm bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        批量隐藏
                      </button>
                      <button
                        onClick={() => handleBatchPostAction('show')}
                        className="btn btn-sm bg-green-600 hover:bg-green-700 text-white"
                      >
                        批量公开
                      </button>
                      <button
                        onClick={() => handleBatchPostAction('delete')}
                        className="btn btn-sm bg-red-600 hover:bg-red-700 text-white"
                      >
                        批量删除
                      </button>
                      <button
                        onClick={() => setSelectedPosts([])}
                        className="btn btn-sm bg-slate-600 hover:bg-slate-700 text-white"
                      >
                        取消选择
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 用户列表 */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedUsers.length === users.length && users.length > 0}
                            onChange={handleSelectAllUsers}
                            className="rounded border-slate-300"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          用户
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          邮箱
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          状态
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          作品数
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          注册时间
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {filteredUsers.map((user) => (
                        <tr key={user._id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user._id)}
                              onChange={() => handleUserSelect(user._id)}
                              className="rounded border-slate-300"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img 
                                src={getUserAvatar(user)} 
                                alt={user.username}
                                className="w-10 h-10 rounded-full object-cover"
                                onError={(e) => {
                                  e.target.src = DEFAULT_FALLBACK_AVATAR;
                                }}
                              />
                              <div className="ml-4">
                                <div className="text-sm font-medium text-slate-900">
                                  {user.username || '未知用户'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {user.email || '无邮箱'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? '活跃' : '已禁用'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {user.postsCount || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '未知时间'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleUserStatusToggle(user._id, user.isActive)}
                              className={`mr-2 ${
                                user.isActive 
                                  ? 'text-red-600 hover:text-red-900' 
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                            >
                              {user.isActive ? (
                                <Ban className="w-4 h-4" />
                              ) : (
                                <CheckCircle className="w-4 h-4" />
                              )}
                            </button>
                            <div className="relative">
                              <button 
                                className="text-slate-400 hover:text-slate-600"
                                onClick={() => setUserDropdownOpen(userDropdownOpen === user._id ? null : user._id)}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                              {userDropdownOpen === user._id && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-slate-200">
                                  <div className="py-1">
                                    <button
                                      onClick={() => {
                                        handleUserStatusToggle(user._id, user.isActive);
                                        setUserDropdownOpen(null);
                                      }}
                                      className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                    >
                                      {user.isActive ? '禁用用户' : '激活用户'}
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (window.confirm('Are you sure you want to delete this user?')) {
                                          // 这里可以添加删除用户的逻辑
                                          console.log('Deleting user:', user._id);
                                        }
                                        setUserDropdownOpen(null);
                                      }}
                                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                      删除用户
                                    </button>
                                    <button
                                      onClick={() => {
                                        navigate(`/user/${user._id}`);
                                        setUserDropdownOpen(null);
                                      }}
                                      className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                    >
                                      查看详情
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* 分页 */}
                {pagination.pages > 1 && (
                  <div className="bg-white px-4 py-3 border-t border-slate-200 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => handleUserPageChange(pagination.current - 1)}
                          disabled={pagination.current === 1}
                          className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          上一页
                        </button>
                        <button
                          onClick={() => handleUserPageChange(pagination.current + 1)}
                          disabled={pagination.current === pagination.pages}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          下一页
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-slate-700">
                            Showing <span className="font-medium">{((pagination.current - 1) * 20) + 1}</span> 到{' '}
                            <span className="font-medium">{Math.min(pagination.current * 20, pagination.total)}</span> 条，
                            共 <span className="font-medium">{pagination.total}</span> 条记录
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                            <button
                              onClick={() => handleUserPageChange(pagination.current - 1)}
                              disabled={pagination.current === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              上一页
                            </button>
                            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                              const page = i + Math.max(1, pagination.current - 2);
                              if (page > pagination.pages) return null;
                              return (
                                <button
                                  key={page}
                                  onClick={() => handleUserPageChange(page)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    page === pagination.current
                                      ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                      : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
                                  }`}
                                >
                                  {page}
                                </button>
                              );
                            })}
                            <button
                              onClick={() => handleUserPageChange(pagination.current + 1)}
                              disabled={pagination.current === pagination.pages}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              下一页
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 内容管理页面 */}
          {activeTab === 'posts' && (
            <div className="p-6">
              {/* 搜索和Filter */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder={t('admin.posts.searchPlaceholder')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input pl-10"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-500" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="select py-2 px-3"
                  >
                    <option value="all">全部作品</option>
                    <option value="public">公开</option>
                    <option value="private">私密</option>
                    <option value="featured">精选</option>
                  </select>
                </div>
              </div>

              {/* 批量操作 - 帖子 */}
              {selectedPosts.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-800 font-medium">
                      已选择 {selectedPosts.length} 个作品
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleBatchPostAction('feature')}
                        className="btn btn-sm bg-yellow-600 hover:bg-yellow-700 text-white"
                      >
                        批量精选
                      </button>
                      <button
                        onClick={() => handleBatchPostAction('unfeature')}
                        className="btn btn-sm bg-gray-600 hover:bg-gray-700 text-white"
                      >
                        取消精选
                      </button>
                      <button
                        onClick={() => handleBatchPostAction('hide')}
                        className="btn btn-sm bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        批量隐藏
                      </button>
                      <button
                        onClick={() => handleBatchPostAction('show')}
                        className="btn btn-sm bg-green-600 hover:bg-green-700 text-white"
                      >
                        批量公开
                      </button>
                      <button
                        onClick={() => handleBatchPostAction('delete')}
                        className="btn btn-sm bg-red-600 hover:bg-red-700 text-white"
                      >
                        批量删除
                      </button>
                      <button
                        onClick={() => setSelectedPosts([])}
                        className="btn btn-sm bg-slate-600 hover:bg-slate-700 text-white"
                      >
                        取消选择
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 作品列表 */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectedPosts.length === posts.length && posts.length > 0}
                            onChange={handleSelectAllPosts}
                            className="rounded border-slate-300"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          作品
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          作者
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          状态
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          浏览/点赞
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          发布时间
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {filteredPosts.map((post) => (
                        <tr key={post._id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedPosts.includes(post._id)}
                              onChange={() => handlePostSelect(post._id)}
                              className="rounded border-slate-300"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-12 h-12 bg-slate-200 rounded-lg flex-shrink-0"></div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-slate-900">
                                  {post.title}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {post.author?.username || '未知作者'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                post.isPublic 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {post.isPublic ? '公开' : '私密'}
                              </span>
                              {post.isFeatured && (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                  精选
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {post.views || 0} / {post.likesCount || post.likes?.length || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : '未知时间'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handlePostToggle(post._id, 'isFeatured', post.isFeatured)}
                                className={`${
                                  post.isFeatured 
                                    ? 'text-yellow-600 hover:text-yellow-900' 
                                    : 'text-gray-400 hover:text-yellow-600'
                                }`}
                                title={post.isFeatured ? '取消精选' : '设为精选'}
                              >
                                <Star className={`w-4 h-4 ${post.isFeatured ? 'fill-current' : ''}`} />
                              </button>
                              <button
                                onClick={() => handlePostToggle(post._id, 'isPublic', post.isPublic)}
                                className={`${
                                  post.isPublic 
                                    ? 'text-green-600 hover:text-green-900' 
                                    : 'text-red-600 hover:text-red-900'
                                }`}
                                title={post.isPublic ? '设为私密' : '设为公开'}
                              >
                                {post.isPublic ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : (
                                  <XCircle className="w-4 h-4" />
                                )}
                              </button>
                              <div className="relative">
                                <button 
                                  className="text-slate-400 hover:text-slate-600"
                                  onClick={() => setPostDropdownOpen(postDropdownOpen === post._id ? null : post._id)}
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                                {postDropdownOpen === post._id && (
                                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-slate-200">
                                    <div className="py-1">
                                      <button
                                        onClick={() => {
                                          handlePostToggle(post._id, 'isFeatured', post.isFeatured);
                                          setPostDropdownOpen(null);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                      >
                                        {post.isFeatured ? '取消精选' : '设为精选'}
                                      </button>
                                      <button
                                        onClick={() => {
                                          handlePostToggle(post._id, 'isPublic', post.isPublic);
                                          setPostDropdownOpen(null);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                      >
                                        {post.isPublic ? '设为私密' : '设为公开'}
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleDeletePost(post._id);
                                          setPostDropdownOpen(null);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                      >
                                        删除作品
                                      </button>
                                      <button
                                        onClick={() => {
                                          navigate(`/post/${post._id}`);
                                          setPostDropdownOpen(null);
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                                      >
                                        查看详情
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* 分页 */}
                {postPagination.pages > 1 && (
                  <div className="bg-white px-4 py-3 border-t border-slate-200 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => handlePostPageChange(postPagination.current - 1)}
                          disabled={postPagination.current === 1}
                          className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          上一页
                        </button>
                        <button
                          onClick={() => handlePostPageChange(postPagination.current + 1)}
                          disabled={postPagination.current === postPagination.pages}
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          下一页
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-slate-700">
                            Showing <span className="font-medium">{((postPagination.current - 1) * 20) + 1}</span> 到{' '}
                            <span className="font-medium">{Math.min(postPagination.current * 20, postPagination.total)}</span> 条，
                            共 <span className="font-medium">{postPagination.total}</span> 条记录
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                            <button
                              onClick={() => handlePostPageChange(postPagination.current - 1)}
                              disabled={postPagination.current === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              上一页
                            </button>
                            {Array.from({ length: Math.min(5, postPagination.pages) }, (_, i) => {
                              const page = i + Math.max(1, postPagination.current - 2);
                              if (page > postPagination.pages) return null;
                              return (
                                <button
                                  key={page}
                                  onClick={() => handlePostPageChange(page)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    page === postPagination.current
                                      ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                      : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
                                  }`}
                                >
                                  {page}
                                </button>
                              );
                            })}
                            <button
                              onClick={() => handlePostPageChange(postPagination.current + 1)}
                              disabled={postPagination.current === postPagination.pages}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-slate-300 bg-white text-sm font-medium text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              下一页
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 全局广播页面 */}
          {activeTab === 'broadcast' && (
            <div className="p-6">
              <div className="max-w-4xl mx-auto">
                {/* 发送广播 */}
                <div className="bg-white rounded-xl p-6 border border-slate-200 mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                    <Megaphone className="w-5 h-5 mr-2" />
                    发送全局广播
                  </h3>
                  
                  <div className="space-y-4">
                    {/* 广播类型选择 */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        广播类型
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="broadcastType"
                            value="all"
                            checked={broadcastType === 'all'}
                            onChange={(e) => setBroadcastType(e.target.value)}
                            className="mr-2"
                          />
                          <span className="text-sm text-slate-700">全体用户</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="broadcastType"
                            value="selected"
                            checked={broadcastType === 'selected'}
                            onChange={(e) => setBroadcastType(e.target.value)}
                            className="mr-2"
                          />
                          <span className="text-sm text-slate-700">指定用户</span>
                        </label>
                      </div>
                    </div>

                    {/* 用户选择 */}
                    {broadcastType === 'selected' && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          选择接收用户
                        </label>
                        <div className="max-h-40 overflow-y-auto border border-slate-300 rounded-md p-3">
                          {users.map((user) => (
                            <label key={user._id} className="flex items-center py-1">
                              <input
                                type="checkbox"
                                checked={selectedRecipients.includes(user._id)}
                                onChange={() => handleRecipientToggle(user._id)}
                                className="mr-2"
                              />
                              <img 
                                src={getUserAvatar(user)} 
                                alt={user.username}
                                className="w-6 h-6 rounded-full object-cover mr-2"
                                onError={(e) => {
                                  e.target.src = DEFAULT_FALLBACK_AVATAR;
                                }}
                              />
                              <span className="text-sm text-slate-700">{user.username}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          已选择 {selectedRecipients.length} 个用户
                        </p>
                      </div>
                    )}

                    {/* 广播内容 */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        广播内容
                      </label>
                      <textarea
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        placeholder={t('admin.broadcast.messagePlaceholder')}
                        rows={4}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        {broadcastMessage.length}/500 字符
                      </p>
                    </div>

                    {/* 发送按钮 */}
                    <div className="flex justify-end">
                      <button
                        onClick={handleSendBroadcast}
                        disabled={broadcastLoading || !broadcastMessage.trim()}
                        className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {broadcastLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            发送中...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            发送广播
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 广播历史 */}
                <div className="bg-white rounded-xl p-6 border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    广播历史
                  </h3>
                  
                  {broadcastHistory.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Megaphone className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p>暂无广播记录</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {broadcastHistory.map((broadcast, index) => (
                        <div key={index} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                broadcast.type === 'all' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {broadcast.type === 'all' ? '全体用户' : `${broadcast.recipients} 个用户`}
                              </span>
                            </div>
                            <span className="text-sm text-slate-500">
                              {new Date(broadcast.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-slate-700">{broadcast.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;