const mongoose = require('mongoose');
const User = require('../models/User');
const Post = require('../models/Post');
const config = require('../config');

const sampleUsers = [
  {
    username: 'artist_alice',
    email: 'alice@example.com',
    password: 'password123',
    bio: '专注于幻想风格的AI艺术创作者',
    role: 'user',
    analytics: {
      ipAddress: '192.168.1.100',
      country: '中国',
      region: '北京市',
      city: '北京',
      loginCount: 15,
      totalSessionTime: 7200000,
      averageSessionTime: 480000,
      lastActiveAt: new Date(),
      activeDays: 12,
      likesGiven: 45,
      commentsGiven: 23,
      sharesGiven: 8,
      deviceType: 'desktop',
      browser: 'Chrome',
      os: 'Windows'
    }
  },
  {
    username: 'designer_bob',
    email: 'bob@example.com',
    password: 'password123',
    bio: '科幻和未来主义设计师',
    role: 'user',
    analytics: {
      ipAddress: '192.168.1.101',
      country: '美国',
      region: '加利福尼亚州',
      city: '旧金山',
      loginCount: 28,
      totalSessionTime: 12600000,
      averageSessionTime: 450000,
      lastActiveAt: new Date(),
      activeDays: 20,
      likesGiven: 67,
      commentsGiven: 34,
      sharesGiven: 12,
      deviceType: 'desktop',
      browser: 'Firefox',
      os: 'macOS'
    }
  },
  {
    username: 'creator_carol',
    email: 'carol@example.com',
    password: 'password123',
    bio: '抽象艺术爱好者',
    role: 'user',
    analytics: {
      ipAddress: '192.168.1.102',
      country: '日本',
      region: '东京都',
      city: '东京',
      loginCount: 22,
      totalSessionTime: 9800000,
      averageSessionTime: 445000,
      lastActiveAt: new Date(),
      activeDays: 18,
      likesGiven: 52,
      commentsGiven: 29,
      sharesGiven: 15,
      deviceType: 'mobile',
      browser: 'Safari',
      os: 'iOS'
    }
  }
];

const samplePosts = [
  {
    title: '梦幻森林精灵',
    description: '使用特定的风格参数创造出充满魔幻色彩的森林精灵场景，展现了Midjourney在幻想题材上的强大表现力。',
    styleParams: {
      sref: '3311400918',
      style: 'raw',
      aspect: '16:9',
      stylize: 750,
      version: '6'
    },
    tags: ['fantasy', 'forest', 'elf', 'magic', 'nature'],
    media: [{
      type: 'image',
      url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop'
    }],
    isPublic: true,
    isFeatured: true
  },
  {
    title: '赛博朋克都市夜景',
    description: '结合高混沌值和特定风格化参数，创造出充满未来感的赛博朋克城市景观。',
    styleParams: {
      sref: '2847593021',
      stylize: 1000,
      chaos: 75,
      aspect: '21:9',
      version: '6'
    },
    tags: ['cyberpunk', 'city', 'neon', 'futuristic', 'night'],
    media: [{
      type: 'image',
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=600&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop'
    }],
    isPublic: true,
    isFeatured: true
  },
  {
    title: '抽象几何艺术',
    description: '探索抽象艺术的可能性，使用expressive风格创造出富有表现力的几何图案。',
    styleParams: {
      sref: '1928374650',
      style: 'expressive',
      version: '6',
      quality: '2',
      aspect: '1:1'
    },
    tags: ['abstract', 'geometric', 'modern', 'art', 'colorful'],
    media: [{
      type: 'image',
      url: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop'
    }],
    isPublic: true,
    isFeatured: false
  },
  {
    title: '古典肖像风格',
    description: '使用低混沌值和特定种子值，创造出具有古典绘画风格的人物肖像。',
    styleParams: {
      sref: '4567891234',
      chaos: 10,
      stylize: 500,
      seed: 123456,
      aspect: '3:4',
      version: '6'
    },
    tags: ['portrait', 'classical', 'painting', 'elegant', 'traditional'],
    media: [{
      type: 'image',
      url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&h=600&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=300&fit=crop'
    }],
    isPublic: true,
    isFeatured: false
  },
  {
    title: '可爱卡通风格',
    description: '使用cute风格参数创造出温馨可爱的卡通角色，适合儿童插画和品牌设计。',
    styleParams: {
      style: 'cute',
      stylize: 300,
      aspect: '1:1',
      version: '6',
      other: '--niji 5'
    },
    tags: ['cute', 'cartoon', 'character', 'kawaii', 'illustration'],
    media: [{
      type: 'image',
      url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&h=600&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop'
    }],
    isPublic: true,
    isFeatured: false
  },
  {
    title: '风景摄影风格',
    description: '使用scenic风格参数模拟专业风景摄影的效果，展现自然之美。',
    styleParams: {
      style: 'scenic',
      stylize: 200,
      aspect: '16:9',
      quality: '2',
      version: '6'
    },
    tags: ['landscape', 'scenic', 'nature', 'photography', 'mountains'],
    media: [{
      type: 'image',
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop'
    }],
    isPublic: true,
    isFeatured: true
  }
];

const seedDatabase = async () => {
  try {
    // 连接数据库
    await mongoose.connect(config.database.uri, config.database.options);
    console.log('✅ 数据库连接成功');

    // 检查是否已有数据
    const existingUsers = await User.countDocuments({ role: 'user' });
    const existingPosts = await Post.countDocuments();

    if (existingUsers > 0 || existingPosts > 0) {
      console.log('⚠️  数据库中已存在数据，检查并更新analytics字段...');
      
      // 为现有用户添加缺失的analytics字段
      const usersWithoutAnalytics = await User.find({ 
        role: 'user', 
        $or: [
          { analytics: { $exists: false } },
          { 'analytics.ipAddress': { $exists: false } }
        ]
      });
      
      if (usersWithoutAnalytics.length > 0) {
        console.log(`🔧 发现 ${usersWithoutAnalytics.length} 个用户缺少analytics数据，正在更新...`);
        
        const sampleAnalytics = [
          {
            ipAddress: '192.168.1.100',
            country: '中国',
            region: '北京市',
            city: '北京',
            loginCount: Math.floor(Math.random() * 30) + 10,
            totalSessionTime: Math.floor(Math.random() * 10000000) + 5000000,
            averageSessionTime: Math.floor(Math.random() * 200000) + 300000,
            lastActiveAt: new Date(),
            activeDays: Math.floor(Math.random() * 25) + 5,
            likesGiven: Math.floor(Math.random() * 50) + 20,
            commentsGiven: Math.floor(Math.random() * 30) + 10,
            sharesGiven: Math.floor(Math.random() * 15) + 5,
            deviceType: 'desktop',
            browser: 'Chrome',
            os: 'Windows'
          },
          {
            ipAddress: '192.168.1.101',
            country: '美国',
            region: '加利福尼亚州',
            city: '旧金山',
            loginCount: Math.floor(Math.random() * 30) + 10,
            totalSessionTime: Math.floor(Math.random() * 10000000) + 5000000,
            averageSessionTime: Math.floor(Math.random() * 200000) + 300000,
            lastActiveAt: new Date(),
            activeDays: Math.floor(Math.random() * 25) + 5,
            likesGiven: Math.floor(Math.random() * 50) + 20,
            commentsGiven: Math.floor(Math.random() * 30) + 10,
            sharesGiven: Math.floor(Math.random() * 15) + 5,
            deviceType: 'desktop',
            browser: 'Firefox',
            os: 'macOS'
          },
          {
            ipAddress: '192.168.1.102',
            country: '日本',
            region: '东京都',
            city: '东京',
            loginCount: Math.floor(Math.random() * 30) + 10,
            totalSessionTime: Math.floor(Math.random() * 10000000) + 5000000,
            averageSessionTime: Math.floor(Math.random() * 200000) + 300000,
            lastActiveAt: new Date(),
            activeDays: Math.floor(Math.random() * 25) + 5,
            likesGiven: Math.floor(Math.random() * 50) + 20,
            commentsGiven: Math.floor(Math.random() * 30) + 10,
            sharesGiven: Math.floor(Math.random() * 15) + 5,
            deviceType: 'mobile',
            browser: 'Safari',
            os: 'iOS'
          }
        ];
        
        for (let i = 0; i < usersWithoutAnalytics.length; i++) {
          const user = usersWithoutAnalytics[i];
          const analyticsData = sampleAnalytics[i % sampleAnalytics.length];
          
          await User.findByIdAndUpdate(user._id, {
            $set: { analytics: analyticsData }
          });
          
          console.log(`✅ 更新用户 ${user.username} 的analytics数据`);
        }
        
        console.log('✅ analytics字段更新完成！');
      } else {
        console.log('✅ 所有用户都已有analytics数据');
      }
      
      return;
    }

    console.log('🌱 开始创建种子数据...');

    // 创建示例用户
    const users = [];
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      users.push(user);
      console.log(`✅ 创建用户: ${user.username}`);
    }

    // 创建示例帖子
    for (let i = 0; i < samplePosts.length; i++) {
      const postData = {
        ...samplePosts[i],
        author: users[i % users.length]._id
      };
      
      const post = new Post(postData);
      await post.save();
      
      // 更新用户统计
      await User.findByIdAndUpdate(post.author, {
        $inc: { 'stats.totalPosts': 1 }
      });
      
      console.log(`✅ 创建帖子: ${post.title}`);
    }

    // 添加一些互动数据
    const posts = await Post.find();
    for (const post of posts) {
      // 随机添加点赞
      const likeCount = Math.floor(Math.random() * 50) + 10;
      const likers = users.slice(0, Math.min(likeCount, users.length));
      
      post.likes = likers.map(user => ({
        user: user._id,
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      }));
      
      // 随机添加评论
      const commentCount = Math.floor(Math.random() * 10) + 1;
      const comments = [
        '太棒了！这个风格参数效果很好',
        '请问这个sref参数是怎么找到的？',
        '非常有创意的作品！',
        '风格很独特，学到了',
        '参数组合很有意思',
        '效果超出预期！',
        '感谢分享这么好的参数',
        '色彩搭配很棒',
        '构图很有感觉',
        '期待更多作品'
      ];
      
      for (let i = 0; i < Math.min(commentCount, comments.length); i++) {
        post.comments.push({
          user: users[Math.floor(Math.random() * users.length)]._id,
          content: comments[i],
          createdAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000)
        });
      }
      
      // 随机浏览量
      post.views = Math.floor(Math.random() * 500) + 50;
      
      await post.save();
    }

    console.log('✅ 种子数据创建完成！');
    console.log(`📊 创建了 ${users.length} 个用户和 ${posts.length} 个帖子`);

  } catch (error) {
    console.error('❌ 创建种子数据失败:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedDatabase();