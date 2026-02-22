// 设置页面翻译模块
export const settings = {
  'zh-CN': {
    title: '设置',
    subtitle: '管理你的账户设置和偏好',
    tabs: {
      profile: '个人资料',
      privacy: '隐私设置',
      notifications: '通知设置',
      security: '安全设置',
      appearance: '外观设置'
    },
    profile: {
      title: '个人资料',
      avatar: {
        change: '更换头像',
        description: '从精美的头像库中选择你喜欢的头像'
      },
      username: '用户名',
      usernamePlaceholder: '输入用户名',
      email: '邮箱地址',
      emailPlaceholder: '输入邮箱地址',
      location: '所在地区',
      locationPlaceholder: '如：北京',
      website: '个人网站',
      websitePlaceholder: 'https://example.com',
      bio: '个人简介',
      bioPlaceholder: '介绍一下你自己...',
      bioCounter: '字符',
      save: '保存更改',
      saving: '保存中...'
    },
    security: {
      title: '安全设置',
      changePassword: '修改密码',
      currentPassword: '当前密码',
      currentPasswordPlaceholder: '输入当前密码',
      newPassword: '新密码',
      newPasswordPlaceholder: '输入新密码',
      confirmPassword: '确认新密码',
      confirmPasswordPlaceholder: '再次输入新密码',
      updatePassword: '修改密码',
      updating: '修改中...',
      dangerZone: '危险操作',
      deleteAccountButton: '删除账户',
      deleteAccountWarning: '此操作将永久删除你的账户和所有数据，且无法恢复。请谨慎操作。',
      deleteMyAccount: '删除我的账户',
      confirmDeletePassword: '输入密码确认删除',
      passwordPlaceholder: '输入密码确认',
      deleting: '删除中...',
      confirmDelete: '确认删除',
      cancel: '取消',
      password: {
        title: '修改密码',
        current: '当前密码',
        currentPlaceholder: '输入当前密码',
        new: '新密码',
        newPlaceholder: '输入新密码',
        confirm: '确认新密码',
        confirmPlaceholder: '再次输入新密码',
        change: '修改密码',
        changing: '修改中...'
      },
      deleteAccount: {
        title: '删除账户',
        description: '永久删除你的账户和所有数据',
        button: '删除账户',
        confirm: '确认删除',
        password: '输入密码确认',
        passwordPlaceholder: '输入密码确认删除'
      }
    },
    appearance: {
      title: '外观偏好',
      theme: '主题模式',
      language: '语言设置',
      timezone: '时区设置',
      save: '保存设置'
    },
    messages: {
      profileUpdated: '个人资料已更新',
      updateFailed: '更新失败，请重试',
      passwordMismatch: '新密码确认不匹配',
      passwordChanged: '密码修改成功',
      passwordChangeFailed: '密码修改失败',
      deletePasswordRequired: '请输入密码确认删除',
      accountDeleted: '账户删除成功',
      deleteAccountFailed: '删除账户失败',
      settingsSaved: '设置已保存',
      settingsSaveFailed: '设置保存失败',
      loadFailed: '加载设置失败，使用默认设置'
    },
    theme: {
      light: {
        name: '浅色模式',
        description: '使用浅色主题界面'
      },
      dark: {
        name: '深色模式',
        description: '使用深色主题界面'
      },
      system: {
        name: '跟随系统',
        description: '根据系统设置自动切换主题'
      }
    },
    language: {
      'zh-CN': '简体中文',
      'zh-TW': '繁體中文',
      'en': 'English',
      'ja': '日本語'
    },
    timezone: {
      'Asia/Shanghai': '北京时间 (UTC+8)',
      'Asia/Tokyo': '东京时间 (UTC+9)',
      'America/New_York': '纽约时间 (UTC-5)',
      'Europe/London': '伦敦时间 (UTC+0)',
      'America/Los_Angeles': '洛杉矶时间 (UTC-8)',
      'Europe/Paris': '巴黎时间 (UTC+1)',
      'Asia/Seoul': '首尔时间 (UTC+9)',
      'Australia/Sydney': '悉尼时间 (UTC+10)'
    },
    privacy: {
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
    },
    notifications: {
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
    }
  },
  'en-US': {
    title: 'Settings',
    subtitle: 'Manage your account settings and preferences',
    tabs: {
      profile: 'Profile',
      privacy: 'Privacy',
      notifications: 'Notifications',
      security: 'Security',
      appearance: 'Appearance'
    },
    profile: {
      title: 'Profile',
      avatar: {
        change: 'Change Avatar',
        description: 'Choose your favorite avatar from our beautiful collection'
      },
      username: 'Username',
      usernamePlaceholder: 'Enter username',
      email: 'Email Address',
      emailPlaceholder: 'Enter email address',
      location: 'Location',
      locationPlaceholder: 'e.g., Beijing',
      website: 'Website',
      websitePlaceholder: 'https://example.com',
      bio: 'Bio',
      bioPlaceholder: 'Tell us about yourself...',
      bioCounter: 'characters',
      save: 'Save Changes',
      saving: 'Saving...'
    },
    security: {
      title: 'Security Settings',
      changePassword: 'Change Password',
      currentPassword: 'Current Password',
      currentPasswordPlaceholder: 'Enter current password',
      newPassword: 'New Password',
      newPasswordPlaceholder: 'Enter new password',
      confirmPassword: 'Confirm New Password',
      confirmPasswordPlaceholder: 'Enter new password again',
      updatePassword: 'Update Password',
      updating: 'Updating...',
      dangerZone: 'Danger Zone',
      deleteAccountButton: 'Delete Account',
      deleteAccountWarning: 'This action will permanently delete your account and all data. This cannot be undone.',
      deleteMyAccount: 'Delete My Account',
      confirmDeletePassword: 'Enter password to confirm deletion',
      passwordPlaceholder: 'Enter password to confirm',
      deleting: 'Deleting...',
      confirmDelete: 'Confirm Delete',
      cancel: 'Cancel',
      password: {
        title: 'Change Password',
        current: 'Current Password',
        currentPlaceholder: 'Enter current password',
        new: 'New Password',
        newPlaceholder: 'Enter new password',
        confirm: 'Confirm New Password',
        confirmPlaceholder: 'Enter new password again',
        change: 'Change Password',
        changing: 'Changing...'
      },
      deleteAccount: {
        title: 'Delete Account',
        description: 'Permanently delete your account and all data',
        button: 'Delete Account',
        confirm: 'Confirm Delete',
        password: 'Enter password to confirm',
        passwordPlaceholder: 'Enter password to confirm deletion'
      }
    },
    appearance: {
      title: 'Appearance Preferences',
      theme: 'Theme Mode',
      language: 'Language Settings',
      timezone: 'Timezone Settings',
      save: 'Save Settings'
    },
    messages: {
      profileUpdated: 'Profile updated successfully',
      updateFailed: 'Update failed, please try again',
      passwordMismatch: 'New password confirmation does not match',
      passwordChanged: 'Password changed successfully',
      passwordChangeFailed: 'Password change failed',
      deletePasswordRequired: 'Please enter password to confirm deletion',
      accountDeleted: 'Account deleted successfully',
      deleteAccountFailed: 'Account deletion failed',
      settingsSaved: 'Settings saved successfully',
      settingsSaveFailed: 'Settings save failed',
      loadFailed: 'Failed to load settings, using defaults'
    },
    theme: {
      light: {
        name: 'Light Mode',
        description: 'Use light theme interface'
      },
      dark: {
        name: 'Dark Mode',
        description: 'Use dark theme interface'
      },
      system: {
        name: 'Follow System',
        description: 'Automatically switch theme based on system settings'
      }
    },
    language: {
      'zh-CN': 'Simplified Chinese',
      'zh-TW': 'Traditional Chinese',
      'en': 'English',
      'ja': 'Japanese'
    },
    timezone: {
      'Asia/Shanghai': 'Beijing Time (UTC+8)',
      'Asia/Tokyo': 'Tokyo Time (UTC+9)',
      'America/New_York': 'New York Time (UTC-5)',
      'Europe/London': 'London Time (UTC+0)',
      'America/Los_Angeles': 'Los Angeles Time (UTC-8)',
      'Europe/Paris': 'Paris Time (UTC+1)',
      'Asia/Seoul': 'Seoul Time (UTC+9)',
      'Australia/Sydney': 'Sydney Time (UTC+10)'
    },
    privacy: {
      profilePublic: {
        label: 'Public Profile',
        description: 'Other users can view your profile'
      },
      showEmail: {
        label: 'Show Email Address',
        description: 'Display email address in profile'
      },
      showLocation: {
        label: 'Show Location',
        description: 'Display location in profile'
      },
      allowFollow: {
        label: 'Allow Others to Follow',
        description: 'Other users can follow you'
      },
      allowComments: {
        label: 'Allow Comments on My Works',
        description: 'Other users can comment on your works'
      }
    },
    notifications: {
      emailNotifications: {
        label: 'Email Notifications',
        description: 'Receive important notifications via email'
      },
      pushNotifications: {
        label: 'Push Notifications',
        description: 'Receive browser push notifications'
      },
      likeNotifications: {
        label: 'Like Notifications',
        description: 'Notify when someone likes your work'
      },
      commentNotifications: {
        label: 'Comment Notifications',
        description: 'Notify when someone comments on your work'
      },
      followNotifications: {
        label: 'Follow Notifications',
        description: 'Notify when someone follows you'
      },
      weeklyDigest: {
        label: 'Weekly Digest',
        description: 'Send weekly curated content summary'
      }
    }
  },
  'ja-JP': {
    title: '設定',
    subtitle: 'アカウント設定と環境設定を管理',
    tabs: {
      profile: 'プロフィール',
      privacy: 'プライバシー',
      notifications: '通知',
      security: 'セキュリティ',
      appearance: '外観'
    },
    profile: {
      title: 'プロフィール',
      avatar: {
        change: 'アバター変更',
        description: '美しいアバターコレクションからお気に入りを選択'
      },
      username: 'ユーザー名',
      usernamePlaceholder: 'ユーザー名を入力',
      email: 'メールアドレス',
      emailPlaceholder: 'メールアドレスを入力',
      location: '所在地',
      locationPlaceholder: '例：東京',
      website: 'ウェブサイト',
      websitePlaceholder: 'https://example.com',
      bio: '自己紹介',
      bioPlaceholder: '自己紹介を入力してください...',
      bioCounter: '文字',
      save: '変更を保存',
      saving: '保存中...'
    },
    security: {
      title: 'セキュリティ設定',
      changePassword: 'パスワード変更',
      currentPassword: '現在のパスワード',
      currentPasswordPlaceholder: '現在のパスワードを入力',
      newPassword: '新しいパスワード',
      newPasswordPlaceholder: '新しいパスワードを入力',
      confirmPassword: '新しいパスワード確認',
      confirmPasswordPlaceholder: '新しいパスワードを再入力',
      updatePassword: 'パスワード更新',
      updating: '更新中...',
      dangerZone: '危険な操作',
      deleteAccountButton: 'アカウント削除',
      deleteAccountWarning: 'この操作はアカウントとすべてのデータを永久に削除します。元に戻すことはできません。',
      deleteMyAccount: 'アカウントを削除',
      confirmDeletePassword: '削除確認のためパスワードを入力',
      passwordPlaceholder: 'パスワードを入力して確認',
      deleting: '削除中...',
      confirmDelete: '削除確認',
      cancel: 'キャンセル',
      password: {
        title: 'パスワード変更',
        current: '現在のパスワード',
        currentPlaceholder: '現在のパスワードを入力',
        new: '新しいパスワード',
        newPlaceholder: '新しいパスワードを入力',
        confirm: '新しいパスワード確認',
        confirmPlaceholder: '新しいパスワードを再入力',
        change: 'パスワード変更',
        changing: '変更中...'
      },
      deleteAccount: {
        title: 'アカウント削除',
        description: 'アカウントとすべてのデータを永久に削除',
        button: 'アカウント削除',
        confirm: '削除確認',
        password: 'パスワードを入力して確認',
        passwordPlaceholder: '削除確認のためパスワードを入力'
      }
    },
    appearance: {
      title: '外観設定',
      theme: 'テーマモード',
      language: '言語設定',
      timezone: 'タイムゾーン設定',
      save: '設定を保存'
    },
    messages: {
      profileUpdated: 'プロフィールが更新されました',
      updateFailed: '更新に失敗しました。再試行してください',
      passwordMismatch: '新しいパスワードの確認が一致しません',
      passwordChanged: 'パスワードが正常に変更されました',
      passwordChangeFailed: 'パスワード変更に失敗しました',
      deletePasswordRequired: '削除確認のためパスワードを入力してください',
      accountDeleted: 'アカウントが正常に削除されました',
      deleteAccountFailed: 'アカウント削除に失敗しました',
      settingsSaved: '設定が正常に保存されました',
      settingsSaveFailed: '設定の保存に失敗しました',
      loadFailed: '設定の読み込みに失敗しました。デフォルト設定を使用します'
    },
    theme: {
      light: {
        name: 'ライトモード',
        description: 'ライトテーマインターフェースを使用'
      },
      dark: {
        name: 'ダークモード',
        description: 'ダークテーマインターフェースを使用'
      },
      system: {
        name: 'システムに従う',
        description: 'システム設定に基づいてテーマを自動切り替え'
      }
    },
    language: {
      'zh-CN': '簡体字中国語',
      'zh-TW': '繁体字中国語',
      'en': '英語',
      'ja': '日本語'
    },
    timezone: {
      'Asia/Shanghai': '北京時間 (UTC+8)',
      'Asia/Tokyo': '東京時間 (UTC+9)',
      'America/New_York': 'ニューヨーク時間 (UTC-5)',
      'Europe/London': 'ロンドン時間 (UTC+0)',
      'America/Los_Angeles': 'ロサンゼルス時間 (UTC-8)',
      'Europe/Paris': 'パリ時間 (UTC+1)',
      'Asia/Seoul': 'ソウル時間 (UTC+9)',
      'Australia/Sydney': 'シドニー時間 (UTC+10)'
    },
    privacy: {
      profilePublic: {
        label: '公開プロフィール',
        description: '他のユーザーがあなたのプロフィールを閲覧できます'
      },
      showEmail: {
        label: 'メールアドレスを表示',
        description: 'プロフィールにメールアドレスを表示'
      },
      showLocation: {
        label: '所在地を表示',
        description: 'プロフィールに所在地を表示'
      },
      allowFollow: {
        label: '他者のフォローを許可',
        description: '他のユーザーがあなたをフォローできます'
      },
      allowComments: {
        label: '作品へのコメントを許可',
        description: '他のユーザーがあなたの作品にコメントできます'
      }
    },
    notifications: {
      emailNotifications: {
        label: 'メール通知',
        description: '重要な通知をメールで受信'
      },
      pushNotifications: {
        label: 'プッシュ通知',
        description: 'ブラウザプッシュ通知を受信'
      },
      likeNotifications: {
        label: 'いいね通知',
        description: '誰かがあなたの作品にいいねした時に通知'
      },
      commentNotifications: {
        label: 'コメント通知',
        description: '誰かがあなたの作品にコメントした時に通知'
      },
      followNotifications: {
        label: 'フォロー通知',
        description: '誰かがあなたをフォローした時に通知'
      },
      weeklyDigest: {
        label: '週間ダイジェスト',
        description: '週間厳選コンテンツサマリーを送信'
      }
    }
  }
};