// Dashboard标签页配置
export const DASHBOARD_TABS = {
  POSTS: 'posts',
  PROMPTS: 'prompts',
  FAVORITES: 'favorites',
  FOLLOWING: 'following',
  FOLLOWERS: 'followers',
  SOCIAL: 'social'
};

// 视图模式
export const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list'
};

// 默认表单数据
export const DEFAULT_POST_FORM = {
  title: '',
  description: '',
  styleParams: {
    sref: '',
    style: '',
    stylize: '',
    chaos: '',
    aspect: '',
    version: '',
    quality: '',
    seed: '',
    other: ''
  },
  tags: [],
  isPublic: true
};

export const DEFAULT_PROMPT_FORM = {
  title: '',
  description: '',
  prompt: '',
  category: 'other',
  difficulty: 'beginner',
  tags: [],
  isPublic: true
};

// 默认统计数据
export const DEFAULT_USER_STATS = {
  totalPosts: 0,
  totalLikes: 0,
  totalViews: 0,
  totalFollowers: 0,
  totalFollowing: 0
};

// 分页配置
export const PAGINATION_CONFIG = {
  DEFAULT_LIMIT: 12,
  SOCIAL_LIMIT: 20
};

// 动画配置
export const ANIMATION_CONFIG = {
  INITIAL: { opacity: 0, y: 20 },
  ANIMATE: { opacity: 1, y: 0 },
  TRANSITION: { duration: 0.5 },
  STAGGER_DELAY: 0.1
};