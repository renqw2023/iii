export const resetPassword = {
  'zh-CN': {
    title: '重置密码',
    description: '请输入您的新密码',
    newPassword: '新密码',
    newPasswordPlaceholder: '请输入新密码',
    confirmPassword: '确认新密码',
    confirmPasswordPlaceholder: '请再次输入新密码',
    resetButton: '重置密码',
    resetting: '重置中...',
    backToLogin: '返回登录',
    verifying: '验证重置链接...',
    
    validation: {
      minLength: '密码长度至少6个字符',
      lowercase: '密码必须包含至少一个小写字母',
      uppercase: '密码必须包含至少一个大写字母',
      number: '密码必须包含至少一个数字'
    },
    
    error: {
      passwordRequired: '请输入新密码',
      confirmRequired: '请确认新密码',
      passwordMismatch: '两次输入的密码不一致',
      resetFailed: '重置密码失败，请稍后重试'
    },
    
    success: {
      title: '密码重置成功',
      description: '您的密码已成功重置，即将跳转到登录页面...',
      message: '密码重置成功！',
      loginNow: '立即登录'
    },
    
    invalidToken: {
      title: '链接无效或已过期',
      description: '重置密码链接无效或已过期，请重新申请密码重置。',
      requestAgain: '重新申请重置密码',
      backToLogin: '返回登录'
    }
  },
  
  'en-US': {
    title: 'Reset Password',
    description: 'Please enter your new password',
    newPassword: 'New Password',
    newPasswordPlaceholder: 'Enter new password',
    confirmPassword: 'Confirm Password',
    confirmPasswordPlaceholder: 'Enter new password again',
    resetButton: 'Reset Password',
    resetting: 'Resetting...',
    backToLogin: 'Back to Login',
    verifying: 'Verifying reset link...',
    
    validation: {
      minLength: 'Password must be at least 6 characters',
      lowercase: 'Password must contain at least one lowercase letter',
      uppercase: 'Password must contain at least one uppercase letter',
      number: 'Password must contain at least one number'
    },
    
    error: {
      passwordRequired: 'Please enter new password',
      confirmRequired: 'Please confirm new password',
      passwordMismatch: 'Passwords do not match',
      resetFailed: 'Password reset failed, please try again later'
    },
    
    success: {
      title: 'Password Reset Successful',
      description: 'Your password has been successfully reset, redirecting to login page...',
      message: 'Password reset successful!',
      loginNow: 'Login Now'
    },
    
    invalidToken: {
      title: 'Invalid or Expired Link',
      description: 'The password reset link is invalid or expired, please request a new password reset.',
      requestAgain: 'Request Password Reset Again',
      backToLogin: 'Back to Login'
    }
  },
  
  'ja-JP': {
    title: 'パスワードリセット',
    description: '新しいパスワードを入力してください',
    newPassword: '新しいパスワード',
    newPasswordPlaceholder: '新しいパスワードを入力',
    confirmPassword: 'パスワード確認',
    confirmPasswordPlaceholder: '新しいパスワードを再入力',
    resetButton: 'パスワードリセット',
    resetting: 'リセット中...',
    backToLogin: 'ログインに戻る',
    verifying: 'リセットリンクを確認中...',
    
    validation: {
      minLength: 'パスワードは6文字以上である必要があります',
      lowercase: 'パスワードには小文字を1文字以上含める必要があります',
      uppercase: 'パスワードには大文字を1文字以上含める必要があります',
      number: 'パスワードには数字を1文字以上含める必要があります'
    },
    
    error: {
      passwordRequired: '新しいパスワードを入力してください',
      confirmRequired: '新しいパスワードを確認してください',
      passwordMismatch: 'パスワードが一致しません',
      resetFailed: 'パスワードリセットに失敗しました。後でもう一度お試しください'
    },
    
    success: {
      title: 'パスワードリセット成功',
      description: 'パスワードが正常にリセットされました。ログインページにリダイレクトしています...',
      message: 'パスワードリセット成功！',
      loginNow: '今すぐログイン'
    },
    
    invalidToken: {
      title: '無効または期限切れのリンク',
      description: 'パスワードリセットリンクが無効または期限切れです。新しいパスワードリセットを要求してください。',
      requestAgain: 'パスワードリセットを再要求',
      backToLogin: 'ログインに戻る'
    }
  }
};