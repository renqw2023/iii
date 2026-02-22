/**
 * 设置页面配置文件
 * 管理所有硬编码的选项和描述
 */

// 主题选项配置
export const THEME_OPTIONS = [
  { 
    id: 'light', 
    name: '浅色模式', 
    preview: 'bg-white border-2',
    description: '使用浅色主题界面'
  },
  { 
    id: 'dark', 
    name: '深色模式', 
    preview: 'bg-slate-900 border-2',
    description: '使用深色主题界面'
  },
  { 
    id: 'system', 
    name: '跟随系统', 
    preview: 'bg-gradient-to-r from-white to-slate-900 border-2',
    description: '根据系统设置自动切换主题'
  }
];

// 语言选项配置
export const LANGUAGE_OPTIONS = [
  { value: 'zh-CN', label: '简体中文', nativeName: '简体中文' },
  { value: 'zh-TW', label: '繁體中文', nativeName: '繁體中文' },
  { value: 'en', label: 'English', nativeName: 'English' },
  { value: 'ja', label: '日本語', nativeName: '日本語' }
];

// 时区选项配置
export const TIMEZONE_OPTIONS = [
  { value: 'Asia/Shanghai', label: '北京时间 (UTC+8)', offset: '+8' },
  { value: 'Asia/Tokyo', label: '东京时间 (UTC+9)', offset: '+9' },
  { value: 'America/New_York', label: '纽约时间 (UTC-5)', offset: '-5' },
  { value: 'Europe/London', label: '伦敦时间 (UTC+0)', offset: '+0' },
  { value: 'America/Los_Angeles', label: '洛杉矶时间 (UTC-8)', offset: '-8' },
  { value: 'Europe/Paris', label: '巴黎时间 (UTC+1)', offset: '+1' },
  { value: 'Asia/Seoul', label: '首尔时间 (UTC+9)', offset: '+9' },
  { value: 'Australia/Sydney', label: '悉尼时间 (UTC+10)', offset: '+10' }
];

// 隐私设置选项配置
export const PRIVACY_OPTIONS = {
  profilePublic: {
    label: '公开个人资料',
    description: '其他用户可以查看你的个人资料'
  },
  showEmail: {
    label: '显示邮箱地址',
    description: '在个人资料中显示邮箱地址'
  },
  showLocation: {
    label: '显示所在地区',
    description: '在个人资料中显示所在地区'
  },
  allowFollow: {
    label: '允许他人关注',
    description: '其他用户可以关注你'
  },
  allowComments: {
    label: '允许评论我的作品',
    description: '其他用户可以评论你的作品'
  }
};

// 通知设置选项配置
export const NOTIFICATION_OPTIONS = {
  emailNotifications: {
    label: '邮件通知',
    description: '通过邮件接收重要通知'
  },
  pushNotifications: {
    label: '推送通知',
    description: '接收浏览器推送通知'
  },
  likeNotifications: {
    label: '点赞通知',
    description: '有人点赞你的作品时通知'
  },
  commentNotifications: {
    label: '评论通知',
    description: '有人评论你的作品时通知'
  },
  followNotifications: {
    label: '关注通知',
    description: '有人关注你时通知'
  },
  weeklyDigest: {
    label: '每周摘要',
    description: '每周发送精选内容摘要'
  }
};

// 默认设置值
export const DEFAULT_SETTINGS = {
  privacy: {
    profilePublic: true,
    showEmail: false,
    showLocation: true,
    allowFollow: true,
    allowComments: true
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    likeNotifications: true,
    commentNotifications: true,
    followNotifications: true,
    weeklyDigest: false
  },
  appearance: {
    theme: 'system',
    language: 'zh-CN',
    timezone: 'Asia/Shanghai'
  }
};