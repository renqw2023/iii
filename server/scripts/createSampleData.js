const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');

const User = require('../models/User');
const Post = require('../models/Post');

// 示例用户数据
const sampleUsers = [
  {
    username: 'artist_alice',
    email: 'alice@example.com',
    password: 'password123',
    bio: '专注于AI艺术创作的设计师，喜欢探索各种风格参数的可能性',
    avatar: '',
    role: 'user'
  },
  {
    username: 'designer_bob',
    email: 'bob@example.com',
    password: 'password123',
    bio: '数字艺术爱好者，擅长创造未来主义风格的作品',
    avatar: '',
    role: 'user'
  },
  {
    username: 'creator_charlie',
    email: 'charlie@example.com',
    password: 'password123',
    bio: '抽象艺术创作者，致力于用AI探索艺术的边界',
    avatar: '',
    role: 'user'
  }
];

// 示例帖子数据
const samplePosts = [
  {
    title: '梦幻森林场景',
    description: '使用Midjourney创建的梦幻森林场景，结合了多种风格参数来达到理想的视觉效果。这个作品展示了如何通过精确的参数控制来创造出富有想象力的艺术作品。',
    styleParams: {
      sref: '3311400918',
      style: 'raw',
      aspect: '16:9',
      stylize: 750,
      version: '6'
    },
    media: [{
      type: 'image',
      url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
      size: 1024000
    }],
    tags: ['fantasy', 'forest', 'nature', 'midjourney'],
    views: 1250,
    featured: true
  },
  {
    title: '未来城市概念',
    description: '科幻风格的未来城市设计，展现了技术与自然的完美融合',
    styleParams: {
      sref: '2847593021',
      stylize: 750,
      chaos: 25,
      aspect: '16:9'
    },
    media: [{
      type: 'image',
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop',
      size: 956000
    }],
    tags: ['cyberpunk', 'city', 'futuristic', 'scifi'],
    views: 890,
    featured: true
  },
  {
    title: '抽象艺术风格',
    description: '现代抽象艺术表现，探索色彩与形状的无限可能',
    styleParams: {
      sref: '1928374650',
      style: 'expressive',
      version: '6',
      stylize: 500
    },
    media: [{
      type: 'image',
      url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop',
      size: 834000
    }],
    tags: ['abstract', 'modern', 'art', 'colorful'],
    views: 670
  },
  {
    title: '赛博朋克街景',
    description: '霓虹灯闪烁的未来街道，充满了科技感和神秘色彩',
    styleParams: {
      sref: '4567891234',
      style: 'raw',
      chaos: 40,
      stylize: 800,
      aspect: '9:16'
    },
    media: [{
      type: 'image',
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=800&fit=crop',
      size: 1156000
    }],
    tags: ['cyberpunk', 'neon', 'street', 'night'],
    views: 1420
  },
  {
    title: '宇宙星云',
    description: '深邃的宇宙空间，星云与星辰交相辉映',
    styleParams: {
      sref: '7890123456',
      style: 'scenic',
      stylize: 600,
      quality: '2'
    },
    media: [{
      type: 'image',
      url: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=800&h=600&fit=crop',
      size: 1200000
    }],
    tags: ['space', 'nebula', 'cosmic', 'stars'],
    views: 980
  },
  {
    title: '古典肖像风格',
    description: '结合古典绘画技法的现代肖像创作',
    styleParams: {
      sref: '5432167890',
      style: 'expressive',
      stylize: 400,
      aspect: '3:4'
    },
    media: [{
      type: 'image',
      url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop',
      size: 890000
    }],
    tags: ['portrait', 'classical', 'art', 'painting'],
    views: 756
  }
];

async function createSampleData() {
  try {
    // 连接数据库
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('✅ 数据库连接成功');

    // 清除现有数据
    await User.deleteMany({});
    await Post.deleteMany({});
    console.log('🗑️ 清除现有数据');

    // 创建示例用户
    const users = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      users.push(user);
      console.log(`👤 创建用户: ${user.username}`);
    }

    // 创建示例帖子
    for (let i = 0; i < samplePosts.length; i++) {
      const postData = samplePosts[i];
      const author = users[i % users.length]; // 循环分配作者
      
      const post = new Post({
        ...postData,
        author: author._id
      });

      // 添加一些随机的点赞和评论
      const likeCount = Math.floor(Math.random() * 50) + 10;
      for (let j = 0; j < likeCount; j++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        if (!post.likes.some(like => like.user.toString() === randomUser._id.toString())) {
          post.likes.push({ user: randomUser._id });
        }
      }

      // 添加评论
      const commentCount = Math.floor(Math.random() * 10) + 2;
      const sampleComments = [
        '太棒了！这个风格参数效果很好',
        '请问这个sref参数是怎么找到的？',
        '非常有创意的作品！',
        '色彩搭配很棒',
        '这个风格我很喜欢',
        '能分享更多类似的参数吗？',
        '效果惊艳！',
        '学到了很多，谢谢分享'
      ];

      for (let j = 0; j < commentCount; j++) {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        const randomComment = sampleComments[Math.floor(Math.random() * sampleComments.length)];
        post.comments.push({
          user: randomUser._id,
          content: randomComment
        });
      }

      await post.save();
      
      // 更新作者统计
      await User.findByIdAndUpdate(author._id, {
        $inc: { 'stats.totalPosts': 1 }
      });

      console.log(`📝 创建帖子: ${post.title}`);
    }

    // 创建一些关注关系
    for (let i = 0; i < users.length; i++) {
      for (let j = 0; j < users.length; j++) {
        if (i !== j && Math.random() > 0.5) {
          const user = users[i];
          const targetUser = users[j];
          
          if (!user.following.includes(targetUser._id)) {
            user.following.push(targetUser._id);
            targetUser.followers.push(user._id);
            
            await user.save();
            await targetUser.save();
          }
        }
      }
    }

    // 创建一些收藏关系
    const posts = await Post.find({});
    for (const user of users) {
      const favoriteCount = Math.floor(Math.random() * 3) + 1;
      const shuffledPosts = posts.sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < favoriteCount && i < shuffledPosts.length; i++) {
        const post = shuffledPosts[i];
        if (!user.favorites.includes(post._id)) {
          user.favorites.push(post._id);
        }
      }
      
      await user.save();
    }

    console.log('✅ 示例数据创建完成！');
    console.log(`👥 创建了 ${users.length} 个用户`);
    console.log(`📝 创建了 ${samplePosts.length} 个帖子`);
    console.log('🔗 创建了关注和收藏关系');

  } catch (error) {
    console.error('❌ 创建示例数据失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📡 数据库连接已断开');
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createSampleData();
}

module.exports = createSampleData;