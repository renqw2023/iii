/**
 * 头像工具函数
 * 用于处理用户头像显示逻辑
 */

// 默认回退头像路径（当图片加载失败时使用）
export const DEFAULT_FALLBACK_AVATAR = '/Circle/01.png';

// Circle目录中可用的头像文件列表
const AVATAR_FILES = [
  '01.png',
  '3DDD-1.png',
  '3DDD-2.png',
  '3DDD-3.png',
  '3DDD-4.png',
  '3DDD.png',
  'Afterclap-1.png',
  'Afterclap-2.png',
  'Afterclap-3.png',
  'Afterclap-4.png',
  'Afterclap-5.png',
  'Afterclap-6.png',
  'Afterclap-7.png',
  'Afterclap-8.png',
  'Afterclap-9.png',
  'Afterclap.png',
  'Cranks-1.png',
  'Cranks-2.png',
  'Cranks.png',
  'Delivery boy-1.png',
  'Delivery boy-2.png',
  'Delivery boy-3.png',
  'Delivery boy-4.png',
  'Delivery boy-5.png',
  'Delivery boy.png',
  'E-commerce-1.png',
  'E-commerce-2.png',
  'E-commerce.png',
  'Funny Bunny-1.png',
  'Funny Bunny-2.png',
  'Funny Bunny-3.png',
  'Funny Bunny-4.png',
  'Funny Bunny-5.png',
  'Funny Bunny-6.png',
  'Funny Bunny-7.png',
  'Funny Bunny-8.png',
  'Funny Bunny.png',
  'Guacamole-1.png',
  'Guacamole-2.png',
  'Guacamole-3.png',
  'Guacamole.png',
  'Juicy-1.png',
  'Juicy.png',
  'No Comments-1.png',
  'No Comments-2.png',
  'No Comments-3.png',
  'No Comments.png',
  'No comments 3.png',
  'No comments 4.png',
  'No comments 5.png',
  'No comments 6.png',
  'No comments 7.png',
  'No comments 8.png',
  'No comments 9.png',
  'No gravity-1.png',
  'No gravity-2.png',
  'No gravity-3.png',
  'No gravity.png',
  'OSLO-1.png',
  'OSLO-10.png',
  'OSLO-11.png',
  'OSLO-12.png',
  'OSLO-13.png',
  'OSLO-14.png',
  'OSLO-2.png',
  'OSLO-3.png',
  'OSLO-4.png',
  'OSLO-5.png',
  'OSLO-6.png',
  'OSLO-7.png',
  'OSLO-8.png',
  'OSLO-9.png',
  'OSLO.png',
  'Teamwork-1.png',
  'Teamwork-2.png',
  'Teamwork-3.png',
  'Teamwork-4.png',
  'Teamwork-5.png',
  'Teamwork-6.png',
  'Teamwork-7.png',
  'Teamwork-8.png',
  'Teamwork.png',
  'Upstream-1.png',
  'Upstream-10.png',
  'Upstream-11.png',
  'Upstream-12.png',
  'Upstream-13.png',
  'Upstream-14.png',
  'Upstream-15.png',
  'Upstream-16.png',
  'Upstream-17.png',
  'Upstream-2.png',
  'Upstream-3.png',
  'Upstream-4.png',
  'Upstream-5.png',
  'Upstream-6.png',
  'Upstream-7.png',
  'Upstream-8.png',
  'Upstream-9.png',
  'Upstream.png'
];

/**
 * 根据用户ID生成一个固定的头像
 * 确保同一用户总是显示相同的头像
 * @param {string} userId - 用户ID
 * @returns {string} 头像文件路径
 */
export const getDefaultAvatar = (userId) => {
  if (!userId) {
    return DEFAULT_FALLBACK_AVATAR;
  }
  
  // 使用用户ID的哈希值来选择头像，确保同一用户总是得到相同的头像
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  
  const index = Math.abs(hash) % AVATAR_FILES.length;
  return `/Circle/${encodeURIComponent(AVATAR_FILES[index])}`;
};

/**
 * 获取用户头像URL
 * 优先使用用户设置的头像，否则使用默认头像
 * @param {Object} user - 用户对象
 * @returns {string} 头像URL
 */
export const getUserAvatar = (user) => {
  if (!user) {
    return DEFAULT_FALLBACK_AVATAR;
  }
  
  // 如果用户有自定义头像且不是默认路径，使用自定义头像
  if (user.avatar && user.avatar !== '/default-avatar.png' && !user.avatar.includes('default-avatar')) {
    return user.avatar;
  }
  
  // 否则使用基于用户ID的默认头像
  return getDefaultAvatar(user._id || user.id);
};

/**
 * 随机获取一个头像（用于新用户注册等场景）
 * @returns {string} 随机头像文件路径
 */
export const getRandomAvatar = () => {
  const randomIndex = Math.floor(Math.random() * AVATAR_FILES.length);
  return `/Circle/${encodeURIComponent(AVATAR_FILES[randomIndex])}`;
};

/**
 * 获取所有可用的头像列表
 * @returns {Array} 头像文件路径数组
 */
export const getAllAvatars = () => {
  return AVATAR_FILES.map(file => `/Circle/${encodeURIComponent(file)}`);
};