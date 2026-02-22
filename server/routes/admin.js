const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Post = require('../models/Post');
const PromptPost = require('../models/PromptPost');
const { adminAuth } = require('../middleware/auth');
const adminCache = require('../services/adminCache');

const router = express.Router();

// 获取管理员统计数据
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const stats = await adminCache.getCachedStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ message: '获取统计数据失败' });
  }
});

// 获取深度分析数据
router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const { type = 'overview', timeRange = '7d' } = req.query;
    
    const analyticsData = await adminCache.getCachedAnalytics(type, timeRange);
    
    res.json({
      success: true,
      data: analyticsData,
      timeRange,
      type
    });
    
  } catch (error) {
    console.error('获取深度分析数据错误:', error);
    res.status(500).json({ 
      success: false,
      message: '获取分析数据失败',
      error: error.message 
    });
  }
});

// 获取用户列表
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      status = 'all',
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const result = await adminCache.getCachedUsers(
      parseInt(page), 
      parseInt(limit), 
      search, 
      status,
      sort, 
      order
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ message: '获取用户列表失败' });
  }
});

// 获取帖子列表
router.get('/posts', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      status = 'all',
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const result = await adminCache.getCachedPosts(
      parseInt(page), 
      parseInt(limit), 
      search, 
      status,
      sort, 
      order
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取帖子列表错误:', error);
    res.status(500).json({ message: '获取帖子列表失败' });
  }
});

// 更新用户状态
router.put('/users/:id/status', adminAuth, [
  body('isActive').isBoolean().withMessage('状态值必须为布尔类型')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 清除相关缓存
    adminCache.clearCache('lists');
    adminCache.clearCache('stats');
    
    res.json({
      message: `用户已${isActive ? '激活' : '禁用'}`,
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('更新用户状态错误:', error);
    res.status(500).json({ message: '更新用户状态失败' });
  }
});

// 删除帖子
router.delete('/posts/:id', adminAuth, async (req, res) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    // 更新作者统计
    await User.findByIdAndUpdate(post.author, {
      $inc: { 'stats.totalPosts': -1 }
    });

    // 清除相关缓存
    adminCache.clearCache('lists');
    adminCache.clearCache('stats');
    adminCache.clearCache('analytics');
    
    res.json({ message: '帖子删除成功' });
  } catch (error) {
    console.error('删除帖子错误:', error);
    res.status(500).json({ message: '删除帖子失败' });
  }
});

// 更新帖子信息
router.put('/posts/:id', adminAuth, [
  body('isPublic').optional().isBoolean().withMessage('公开状态必须为布尔类型'),
  body('isFeatured').optional().isBoolean().withMessage('精选状态必须为布尔类型'),
  body('title').optional().isLength({ min: 1 }).withMessage('标题不能为空'),
  body('description').optional().isLength({ min: 1 }).withMessage('描述不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const updateData = {};
    const { isPublic, isFeatured, title, description } = req.body;
    
    if (typeof isPublic === 'boolean') updateData.isPublic = isPublic;
    if (typeof isFeatured === 'boolean') updateData.isFeatured = isFeatured;
    if (title) updateData.title = title;
    if (description) updateData.description = description;

    const post = await Post.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('author', 'username avatar');

    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    // 清除相关缓存
    adminCache.clearCache('lists');
    adminCache.clearCache('stats');
    adminCache.clearCache('analytics');
    
    res.json({
      message: '帖子更新成功',
      post
    });
  } catch (error) {
    console.error('更新帖子错误:', error);
    res.status(500).json({ message: '更新帖子失败' });
  }
});

// 设置/取消精选帖子
router.put('/posts/:id/featured', adminAuth, [
  body('isFeatured').isBoolean().withMessage('精选状态必须为布尔类型')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { isFeatured } = req.body;
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { isFeatured },
      { new: true }
    ).populate('author', 'username avatar');

    if (!post) {
      return res.status(404).json({ message: '帖子不存在' });
    }

    // 清除相关缓存
    adminCache.clearCache('lists');
    adminCache.clearCache('stats');
    adminCache.clearCache('analytics');
    
    res.json({
      message: `帖子已${isFeatured ? '设为精选' : '取消精选'}`,
      post
    });
  } catch (error) {
    console.error('更新帖子精选状态错误:', error);
    res.status(500).json({ message: '更新帖子状态失败' });
  }
});

// 删除单个用户
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // 检查用户是否存在
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 防止删除管理员账户
    if (user.role === 'admin') {
      return res.status(403).json({ message: '不能删除管理员账户' });
    }
    
    // 硬删除：彻底删除用户及其相关数据
    // 1. 删除用户的所有帖子
    await Post.deleteMany({ author: userId });
    
    // 2. 从其他用户的关注列表中移除这个用户
    await User.updateMany(
      { following: userId },
      { $pull: { following: userId } }
    );
    
    // 3. 从其他用户的粉丝列表中移除这个用户
    await User.updateMany(
      { followers: userId },
      { $pull: { followers: userId } }
    );
    
    // 4. 从其他用户的收藏列表中移除这个用户的帖子
    const userPosts = await Post.find({ author: userId }).select('_id');
    const postIds = userPosts.map(post => post._id);
    await User.updateMany(
      { favorites: { $in: postIds } },
      { $pull: { favorites: { $in: postIds } } }
    );
    
    // 5. 最后删除用户
    await User.findByIdAndDelete(userId);
    
    // 清除相关缓存
    adminCache.clearCache('lists');
    adminCache.clearCache('stats');
    adminCache.clearCache('analytics');
    
    res.json({ message: '用户删除成功' });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({ message: '删除用户失败' });
  }
});

// 批量操作用户
router.post('/users/batch', adminAuth, [
  body('userIds').isArray().withMessage('用户ID列表必须为数组'),
  body('action').isIn(['activate', 'deactivate', 'delete']).withMessage('操作类型无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { userIds, action } = req.body;

    let result;
    switch (action) {
      case 'activate':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: true }
        );
        break;
      case 'deactivate':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: false }
        );
        break;
      case 'delete':
        // 硬删除：彻底删除用户及其相关数据
        // 1. 删除用户的所有帖子
        await Post.deleteMany({ author: { $in: userIds } });
        
        // 2. 从其他用户的关注列表中移除这些用户
        await User.updateMany(
          { following: { $in: userIds } },
          { $pull: { following: { $in: userIds } } }
        );
        
        // 3. 从其他用户的粉丝列表中移除这些用户
        await User.updateMany(
          { followers: { $in: userIds } },
          { $pull: { followers: { $in: userIds } } }
        );
        
        // 4. 从其他用户的收藏列表中移除这些用户的帖子
        const userPosts = await Post.find({ author: { $in: userIds } }).select('_id');
        const postIds = userPosts.map(post => post._id);
        await User.updateMany(
          { favorites: { $in: postIds } },
          { $pull: { favorites: { $in: postIds } } }
        );
        
        // 5. 最后删除用户
        result = await User.deleteMany({ _id: { $in: userIds } });
        break;
      default:
        return res.status(400).json({ message: '无效的操作类型' });
    }

    const count = action === 'delete' ? result.deletedCount : result.modifiedCount;
    const actionText = action === 'delete' ? '删除' : '修改';
    
    // 清除相关缓存
    adminCache.clearCache('lists');
    adminCache.clearCache('stats');
    adminCache.clearCache('analytics');
    
    res.json({
      message: `批量操作完成，${actionText}了 ${count} 个用户`,
      count: count
    });
  } catch (error) {
    console.error('批量操作用户错误:', error);
    res.status(500).json({ message: '批量操作失败' });
  }
});

// 批量操作帖子
router.post('/posts/batch', adminAuth, [
  body('postIds').isArray().withMessage('帖子ID列表必须为数组'),
  body('action').isIn(['feature', 'unfeature', 'hide', 'show', 'delete']).withMessage('操作类型无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { postIds, action } = req.body;

    let result;
    switch (action) {
      case 'feature':
        result = await Post.updateMany(
          { _id: { $in: postIds } },
          { isFeatured: true }
        );
        break;
      case 'unfeature':
        result = await Post.updateMany(
          { _id: { $in: postIds } },
          { isFeatured: false }
        );
        break;
      case 'hide':
        result = await Post.updateMany(
          { _id: { $in: postIds } },
          { isPublic: false }
        );
        break;
      case 'show':
        result = await Post.updateMany(
          { _id: { $in: postIds } },
          { isPublic: true }
        );
        break;
      case 'delete':
        result = await Post.deleteMany({ _id: { $in: postIds } });
        break;
      default:
        return res.status(400).json({ message: '无效的操作类型' });
    }

    // 清除相关缓存
    adminCache.clearCache('lists');
    adminCache.clearCache('stats');
    adminCache.clearCache('analytics');
    
    res.json({
      message: `批量操作完成，影响了 ${result.modifiedCount || result.deletedCount} 个帖子`,
      modifiedCount: result.modifiedCount || result.deletedCount
    });
  } catch (error) {
    console.error('批量操作帖子错误:', error);
    res.status(500).json({ message: '批量操作失败' });
  }
});

// 数据导出
// 数据导出接口 - 支持CSV和JSON格式
router.get('/export/:type', adminAuth, async (req, res) => {
  try {
    const { type } = req.params;
    const { format = 'csv' } = req.query; // 支持csv和json格式
    let data = [];
    let filename = '';
    let headers = [];
    let rawData = []; // 用于JSON导出的原始数据

    switch (type) {
      case 'users':
        const users = await User.find({})
          .sort({ createdAt: -1 })
          .lean(); // 使用lean()提高性能
        
        if (format === 'json') {
          rawData = users;
          filename = 'users_export';
        } else {
          headers = ['ID', '用户名', '邮箱', '状态', '角色', '注册时间', '最后登录', '作品数量', '粉丝数', '关注数', '头像URL', '个人简介'];
          data = users.map(user => [
            user._id,
            user.username,
            user.email,
            user.isActive ? '活跃' : '已禁用',
            user.role || 'user',
            new Date(user.createdAt).toISOString(),
            user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : '',
            user.postsCount || 0,
            user.followersCount || 0,
            user.followingCount || 0,
            user.avatar || '',
            user.bio || ''
          ]);
          filename = 'users_export';
        }
        break;

      case 'posts':
        const posts = await Post.find({})
          .populate('author', 'username email')
          .sort({ createdAt: -1 })
          .lean();
        
        if (format === 'json') {
          rawData = posts;
          filename = 'posts_export';
        } else {
          headers = ['ID', '标题', '描述', '作者ID', '作者用户名', '作者邮箱', '状态', '精选', '浏览量', '点赞数', '评论数', '发布时间', '更新时间', '标签', '图片URLs', '视频URLs'];
          data = posts.map(post => {
            const images = (post.media || []).filter(m => m.type === 'image').map(m => m.url);
            const videos = (post.media || []).filter(m => m.type === 'video').map(m => m.url);
            
            return [
              post._id,
              post.title,
              post.description || '',
              post.author?._id || '',
              post.author?.username || '未知作者',
              post.author?.email || '',
              post.isPublic ? '公开' : '私密',
              post.isFeatured ? '是' : '否',
              post.views || 0,
              post.likes?.length || 0,
              post.comments?.length || 0,
              new Date(post.createdAt).toISOString(),
              new Date(post.updatedAt).toISOString(),
              (post.tags || []).join(';'),
              images.join(';'),
              videos.join(';')
            ];
          });
          filename = 'posts_export';
        }
        break;

      case 'stats':
        const [totalUsers, totalPosts, activeUsers, featuredPosts, publicPosts, totalViews, totalLikes] = await Promise.all([
          User.countDocuments(),
          Post.countDocuments(),
          User.countDocuments({ isActive: true }),
          Post.countDocuments({ isFeatured: true }),
          Post.countDocuments({ isPublic: true }),
          Post.aggregate([{ $group: { _id: null, totalViews: { $sum: '$views' } } }]),
          Post.aggregate([{ $unwind: '$likes' }, { $group: { _id: null, totalLikes: { $sum: 1 } } }])
        ]);
        
        const statsData = {
          totalUsers,
          totalPosts,
          activeUsers,
          featuredPosts,
          publicPosts,
          totalViews: totalViews[0]?.totalViews || 0,
          totalLikes: totalLikes[0]?.totalLikes || 0,
          exportTime: new Date().toISOString()
        };
        
        if (format === 'json') {
          rawData = statsData;
          filename = 'stats_export';
        } else {
          headers = ['统计项', '数值'];
          data = [
            ['总用户数', totalUsers],
            ['总作品数', totalPosts],
            ['活跃用户数', activeUsers],
            ['精选作品数', featuredPosts],
            ['公开作品数', publicPosts],
            ['总浏览量', totalViews[0]?.totalViews || 0],
            ['总点赞数', totalLikes[0]?.totalLikes || 0],
            ['导出时间', new Date().toLocaleString('zh-CN')]
          ];
          filename = 'stats_export';
        }
        break;

      default:
        return res.status(400).json({ message: '不支持的导出类型' });
    }

    if (format === 'json') {
      // JSON格式导出
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}_${new Date().toISOString().split('T')[0]}.json"`);
      res.send(JSON.stringify(rawData, null, 2));
    } else {
      // CSV格式导出
      const csvContent = [headers, ...data]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      // 添加BOM以支持中文
      const csvWithBOM = '\uFEFF' + csvContent;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvWithBOM);
    }
  } catch (error) {
    console.error('数据导出失败:', error);
    res.status(500).json({ message: '数据导出失败' });
  }
});

// 数据导入接口
router.post('/import/:type', adminAuth, async (req, res) => {
  try {
    const { type } = req.params;
    const { data, mode = 'create' } = req.body; // mode: 'create', 'update', 'upsert'
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({ message: '导入数据格式错误，需要数组格式' });
    }

    let results = {
      success: 0,
      failed: 0,
      errors: []
    };

    switch (type) {
      case 'users':
        for (let i = 0; i < data.length; i++) {
          try {
            const userData = data[i];
            
            // 验证必需字段
            if (!userData.username || !userData.email) {
              results.failed++;
              results.errors.push(`第${i + 1}行：缺少必需字段（用户名或邮箱）`);
              continue;
            }

            if (mode === 'create') {
              // 检查用户是否已存在
              const existingUser = await User.findOne({
                $or: [{ username: userData.username }, { email: userData.email }]
              });
              
              if (existingUser) {
                results.failed++;
                results.errors.push(`第${i + 1}行：用户已存在（${userData.username}）`);
                continue;
              }
              
              // 创建新用户
              const newUser = new User({
                username: userData.username,
                email: userData.email,
                isActive: userData.isActive !== undefined ? userData.isActive : true,
                role: userData.role || 'user',
                avatar: userData.avatar || '',
                bio: userData.bio || '',
                postsCount: userData.postsCount || 0,
                followersCount: userData.followersCount || 0,
                followingCount: userData.followingCount || 0,
                // 注意：密码需要单独处理，这里设置默认密码
                password: 'defaultPassword123' // 实际应用中应该要求用户重置密码
              });
              
              await newUser.save();
              results.success++;
            } else if (mode === 'update' || mode === 'upsert') {
              const filter = userData._id ? { _id: userData._id } : 
                           { $or: [{ username: userData.username }, { email: userData.email }] };
              
              const updateData = {
                username: userData.username,
                email: userData.email,
                isActive: userData.isActive !== undefined ? userData.isActive : true,
                role: userData.role || 'user',
                avatar: userData.avatar || '',
                bio: userData.bio || ''
              };
              
              if (mode === 'upsert') {
                await User.findOneAndUpdate(filter, updateData, { upsert: true, new: true });
              } else {
                const updated = await User.findOneAndUpdate(filter, updateData, { new: true });
                if (!updated) {
                  results.failed++;
                  results.errors.push(`第${i + 1}行：用户不存在（${userData.username}）`);
                  continue;
                }
              }
              results.success++;
            }
          } catch (error) {
            results.failed++;
            results.errors.push(`第${i + 1}行：${error.message}`);
          }
        }
        break;

      case 'posts':
        for (let i = 0; i < data.length; i++) {
          try {
            const postData = data[i];
            
            // 验证必需字段
            if (!postData.title || !postData.author) {
              results.failed++;
              results.errors.push(`第${i + 1}行：缺少必需字段（标题或作者）`);
              continue;
            }

            // 查找作者
            let authorId = postData.author;
            if (typeof postData.author === 'string' && !postData.author.match(/^[0-9a-fA-F]{24}$/)) {
              // 如果不是ObjectId格式，尝试通过用户名查找
              const author = await User.findOne({ username: postData.author });
              if (!author) {
                results.failed++;
                results.errors.push(`第${i + 1}行：找不到作者（${postData.author}）`);
                continue;
              }
              authorId = author._id;
            }

            if (mode === 'create') {
              // 创建新帖子
              const newPost = new Post({
                title: postData.title,
                description: postData.description || '',
                author: authorId,
                isPublic: postData.isPublic !== undefined ? postData.isPublic : true,
                isFeatured: postData.isFeatured !== undefined ? postData.isFeatured : false,
                views: postData.views || 0,
                likesCount: postData.likesCount || 0,
                commentsCount: postData.commentsCount || 0,
                tags: Array.isArray(postData.tags) ? postData.tags : 
                      (typeof postData.tags === 'string' ? postData.tags.split(';').filter(t => t.trim()) : []),
                images: Array.isArray(postData.images) ? postData.images : 
                        (typeof postData.images === 'string' ? postData.images.split(';').filter(i => i.trim()) : []),
                videos: Array.isArray(postData.videos) ? postData.videos : 
                        (typeof postData.videos === 'string' ? postData.videos.split(';').filter(v => v.trim()) : [])
              });
              
              await newPost.save();
              results.success++;
            } else if (mode === 'update' || mode === 'upsert') {
              const filter = postData._id ? { _id: postData._id } : 
                           { title: postData.title, author: authorId };
              
              const updateData = {
                title: postData.title,
                description: postData.description || '',
                author: authorId,
                isPublic: postData.isPublic !== undefined ? postData.isPublic : true,
                isFeatured: postData.isFeatured !== undefined ? postData.isFeatured : false,
                tags: Array.isArray(postData.tags) ? postData.tags : 
                      (typeof postData.tags === 'string' ? postData.tags.split(';').filter(t => t.trim()) : []),
                images: Array.isArray(postData.images) ? postData.images : 
                        (typeof postData.images === 'string' ? postData.images.split(';').filter(i => i.trim()) : []),
                videos: Array.isArray(postData.videos) ? postData.videos : 
                        (typeof postData.videos === 'string' ? postData.videos.split(';').filter(v => v.trim()) : [])
              };
              
              if (mode === 'upsert') {
                await Post.findOneAndUpdate(filter, updateData, { upsert: true, new: true });
              } else {
                const updated = await Post.findOneAndUpdate(filter, updateData, { new: true });
                if (!updated) {
                  results.failed++;
                  results.errors.push(`第${i + 1}行：帖子不存在（${postData.title}）`);
                  continue;
                }
              }
              results.success++;
            }
          } catch (error) {
            results.failed++;
            results.errors.push(`第${i + 1}行：${error.message}`);
          }
        }
        break;

      default:
        return res.status(400).json({ message: '不支持的导入类型' });
    }

    res.json({
      message: '数据导入完成',
      results: {
        total: data.length,
        success: results.success,
        failed: results.failed,
        errors: results.errors.slice(0, 10) // 只返回前10个错误
      }
    });
  } catch (error) {
    console.error('数据导入失败:', error);
    res.status(500).json({ message: '数据导入失败', error: error.message });
  }
});

// 获取提示词列表
router.get('/prompts', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      status = 'all',
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    const result = await adminCache.getCachedPrompts(
      parseInt(page), 
      parseInt(limit), 
      search, 
      status,
      sort, 
      order
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取提示词列表错误:', error);
    res.status(500).json({ message: '获取提示词列表失败' });
  }
});

// 更新提示词信息
router.put('/prompts/:id', adminAuth, [
  body('isPublic').optional().isBoolean().withMessage('公开状态必须为布尔类型'),
  body('isFeatured').optional().isBoolean().withMessage('精选状态必须为布尔类型'),
  body('title').optional().isLength({ min: 1 }).withMessage('标题不能为空'),
  body('prompt').optional().isLength({ min: 1 }).withMessage('提示词内容不能为空')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const updateData = {};
    const { isPublic, isFeatured, title, prompt, description, category } = req.body;
    
    if (typeof isPublic === 'boolean') updateData.isPublic = isPublic;
    if (typeof isFeatured === 'boolean') updateData.isFeatured = isFeatured;
    if (title) updateData.title = title;
    if (prompt) updateData.prompt = prompt;
    if (description) updateData.description = description;
    if (category) updateData.category = category;

    const promptPost = await PromptPost.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('author', 'username avatar');

    if (!promptPost) {
      return res.status(404).json({ message: '提示词不存在' });
    }

    // 清除相关缓存
    adminCache.clearCache('lists');
    adminCache.clearCache('stats');
    
    res.json({
      message: '提示词更新成功',
      prompt: promptPost
    });
  } catch (error) {
    console.error('更新提示词错误:', error);
    res.status(500).json({ message: '更新提示词失败' });
  }
});

// 设置/取消精选提示词
router.put('/prompts/:id/featured', adminAuth, [
  body('isFeatured').isBoolean().withMessage('精选状态必须为布尔类型')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { isFeatured } = req.body;
    const promptPost = await PromptPost.findByIdAndUpdate(
      req.params.id,
      { isFeatured },
      { new: true }
    ).populate('author', 'username avatar');

    if (!promptPost) {
      return res.status(404).json({ message: '提示词不存在' });
    }

    // 清除相关缓存
    adminCache.clearCache('lists');
    adminCache.clearCache('stats');
    
    res.json({
      message: `提示词已${isFeatured ? '设为精选' : '取消精选'}`,
      prompt: promptPost
    });
  } catch (error) {
    console.error('更新提示词精选状态错误:', error);
    res.status(500).json({ message: '更新提示词状态失败' });
  }
});

// 硬删除提示词
router.delete('/prompts/:id', adminAuth, async (req, res) => {
  try {
    const promptPost = await PromptPost.findByIdAndDelete(req.params.id);
    
    if (!promptPost) {
      return res.status(404).json({ message: '提示词不存在' });
    }

    // 更新作者统计（如果有相关统计字段）
    await User.findByIdAndUpdate(promptPost.author, {
      $inc: { 'stats.totalPrompts': -1 }
    });

    // 从其他用户的收藏列表中移除这个提示词
    await User.updateMany(
      { 'favorites.prompts': promptPost._id },
      { $pull: { 'favorites.prompts': promptPost._id } }
    );

    // 清除相关缓存
    adminCache.clearCache('lists');
    adminCache.clearCache('stats');
    
    res.json({ message: '提示词删除成功' });
  } catch (error) {
    console.error('删除提示词错误:', error);
    res.status(500).json({ message: '删除提示词失败' });
  }
});

// 批量操作提示词
router.post('/prompts/batch', adminAuth, [
  body('promptIds').isArray().withMessage('提示词ID列表必须为数组'),
  body('action').isIn(['feature', 'unfeature', 'hide', 'show', 'delete']).withMessage('操作类型无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: '输入验证失败',
        errors: errors.array()
      });
    }

    const { promptIds, action } = req.body;

    let result;
    switch (action) {
      case 'feature':
        result = await PromptPost.updateMany(
          { _id: { $in: promptIds } },
          { isFeatured: true }
        );
        break;
      case 'unfeature':
        result = await PromptPost.updateMany(
          { _id: { $in: promptIds } },
          { isFeatured: false }
        );
        break;
      case 'hide':
        result = await PromptPost.updateMany(
          { _id: { $in: promptIds } },
          { isPublic: false }
        );
        break;
      case 'show':
        result = await PromptPost.updateMany(
          { _id: { $in: promptIds } },
          { isPublic: true }
        );
        break;
      case 'delete':
        // 硬删除：彻底删除提示词及其相关数据
        const promptsToDelete = await PromptPost.find({ _id: { $in: promptIds } });
        
        // 更新作者统计
        for (const prompt of promptsToDelete) {
          await User.findByIdAndUpdate(prompt.author, {
            $inc: { 'stats.totalPrompts': -1 }
          });
        }
        
        // 从其他用户的收藏列表中移除这些提示词
        await User.updateMany(
          { 'favorites.prompts': { $in: promptIds } },
          { $pull: { 'favorites.prompts': { $in: promptIds } } }
        );
        
        result = await PromptPost.deleteMany({ _id: { $in: promptIds } });
        break;
      default:
        return res.status(400).json({ message: '无效的操作类型' });
    }

    // 清除相关缓存
    adminCache.clearCache('lists');
    adminCache.clearCache('stats');
    
    res.json({
      message: `批量操作完成，影响了 ${result.modifiedCount || result.deletedCount} 个提示词`,
      modifiedCount: result.modifiedCount || result.deletedCount
    });
  } catch (error) {
    console.error('批量操作提示词错误:', error);
    res.status(500).json({ message: '批量操作失败' });
  }
});

module.exports = router;