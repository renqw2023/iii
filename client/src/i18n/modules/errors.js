// 错误和验证翻译模块
export const errors = {
  'zh-CN': {
    404: {
      title: "页面未找到",
      message: "抱歉，您访问的页面不存在",
      home: "返回首页"
    },
    500: {
      title: "服务器错误",
      message: "服务器出现了一些问题，请稍后再试"
    },
    network: {
      title: "网络错误",
      message: "请检查您的网络连接"
    },
    unauthorized: {
      title: "未授权",
      message: "您没有权限访问此页面"
    },
    rateLimitExceeded: "请求过于频繁，请稍后再试",
    loadPostFailed: "获取帖子详情失败",
    loadFailed: "加载失败",
    refreshPage: "请刷新页面重试"
  },
  'en-US': {
    404: {
      title: "Page Not Found",
      message: "Sorry, the page you are looking for does not exist",
      home: "Back to Home"
    },
    500: {
      title: "Server Error",
      message: "The server encountered some problems, please try again later"
    },
    network: {
      title: "Network Error",
      message: "Please check your network connection"
    },
    unauthorized: {
      title: "Unauthorized",
      message: "You do not have permission to access this page"
    },
    rateLimitExceeded: "Too many requests, please try again later",
    loadPostFailed: "Failed to load post details",
    loadFailed: "Loading failed",
    refreshPage: "Please refresh the page and try again"
  },
  'ja-JP': {
    404: {
      title: "ページが見つかりません",
      message: "申し訳ございませんが、お探しのページは存在しません",
      home: "ホームに戻る"
    },
    500: {
      title: "サーバーエラー",
      message: "サーバーに問題が発生しました。しばらくしてから再試行してください"
    },
    network: {
      title: "ネットワークエラー",
      message: "ネットワーク接続を確認してください"
    },
    unauthorized: {
      title: "未認証",
      message: "このページにアクセスする権限がありません"
    },
    rateLimitExceeded: "リクエストが多すぎます。しばらくしてから再試行してください",
    loadPostFailed: "投稿の詳細の読み込みに失敗しました",
    loadFailed: "読み込みに失敗しました",
    refreshPage: "ページを更新して再試行してください"
  }
};

export const validation = {
  'zh-CN': {
    required: "此字段为必填项",
    checking: "检查中...",
    emailRequired: "请输入邮箱地址",
    emailInvalid: "请输入有效的邮箱地址",
    passwordRequired: "请输入密码",
    passwordMinLength: "密码长度至少6个字符",
    email: {
      required: "请输入邮箱地址",
      invalid: "请输入有效的邮箱地址",
      checkFailed: "检查邮箱失败"
    },
    password: {
      required: "请输入密码",
      minLength: "密码长度至少6个字符",
      invalid: "请输入有效的密码",
      valid: "密码格式正确"
    },
    username: {
      minLength: "用户名长度至少3个字符",
      maxLength: "用户名长度不能超过20个字符",
      format: "用户名只能包含字母、数字和下划线",
      invalid: "请输入有效的用户名",
      checkFailed: "检查用户名失败"
    },
    confirmPassword: {
      required: "请确认密码",
      mismatch: "两次输入的密码不一致",
      valid: "密码确认正确"
    },
    minLength: "至少需要{{min}}个字符",
    maxLength: "最多{{max}}个字符",
    fileSize: "文件大小不能超过{{size}}MB",
    fileType: "不支持的文件类型"
  },
  'en-US': {
    required: "This field is required",
    checking: "Checking...",
    emailRequired: "Please enter email address",
    emailInvalid: "Please enter a valid email address",
    passwordRequired: "Please enter password",
    passwordMinLength: "Password must be at least 6 characters",
    email: {
      required: "Please enter email address",
      invalid: "Please enter a valid email address",
      checkFailed: "Email check failed"
    },
    password: {
      required: "Please enter password",
      minLength: "Password must be at least 6 characters",
      invalid: "Please enter a valid password",
      valid: "Password format is correct"
    },
    username: {
      minLength: "Username must be at least 3 characters",
      maxLength: "Username cannot exceed 20 characters",
      format: "Username can only contain letters, numbers and underscores",
      invalid: "Please enter a valid username",
      checkFailed: "Username check failed"
    },
    confirmPassword: {
      required: "Please confirm password",
      mismatch: "Passwords do not match",
      valid: "Password confirmation is correct"
    },
    minLength: "At least {{min}} characters required",
    maxLength: "Maximum {{max}} characters",
    fileSize: "File size cannot exceed {{size}}MB",
    fileType: "Unsupported file type"
  },
  'ja-JP': {
    required: "この項目は必須です",
    checking: "確認中...",
    emailRequired: "メールアドレスを入力してください",
    emailInvalid: "有効なメールアドレスを入力してください",
    passwordRequired: "パスワードを入力してください",
    passwordMinLength: "パスワードは6文字以上である必要があります",
    email: {
      required: "メールアドレスを入力してください",
      invalid: "有効なメールアドレスを入力してください",
      checkFailed: "メールアドレスの確認に失敗しました"
    },
    password: {
      required: "パスワードを入力してください",
      minLength: "パスワードは6文字以上である必要があります",
      invalid: "有効なパスワードを入力してください",
      valid: "パスワード形式が正しいです"
    },
    username: {
      minLength: "ユーザー名は3文字以上である必要があります",
      maxLength: "ユーザー名は20文字以下である必要があります",
      format: "ユーザー名には文字、数字、アンダースコアのみ使用できます",
      invalid: "有効なユーザー名を入力してください",
      checkFailed: "ユーザー名の確認に失敗しました"
    },
    confirmPassword: {
      required: "パスワードを確認してください",
      mismatch: "パスワードが一致しません",
      valid: "パスワード確認が正しいです"
    },
    minLength: "最低{{min}}文字必要です",
    maxLength: "最大{{max}}文字",
    fileSize: "ファイルサイズは{{size}}MBを超えることはできません",
    fileType: "サポートされていないファイルタイプ"
  }
};