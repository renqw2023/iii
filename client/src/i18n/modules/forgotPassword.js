export const forgotPassword = {
  'zh-CN': {
    title: '忘记密码',
    description: '请输入您的邮箱地址，我们将向您发送重置密码的链接。',
    emailLabel: '邮箱地址',
    emailPlaceholder: '请输入您的邮箱地址',
    sendButton: '发送重置邮件',
    sending: '发送中...',
    backToLogin: '返回登录',
    
    error: {
      emailRequired: '请输入邮箱地址',
      emailInvalid: '请输入有效的邮箱地址',
      sendFailed: '发送失败，请稍后重试',
      resendFailed: '重新发送失败，请稍后重试'
    },
    
    success: {
      emailSent: '重置密码邮件已发送，请查收邮箱',
      emailResent: '重置密码邮件已重新发送'
    },
    
    emailSent: {
      title: '邮件已发送',
      description: '我们已向 <1>{{email}}</1> 发送了重置密码的邮件。请查收邮箱并点击邮件中的链接来重置您的密码。',
      resendButton: '重新发送邮件',
      sending: '发送中...',
      backToLogin: '返回登录'
    }
  },
  
  'en-US': {
    title: 'Forgot Password',
    description: 'Please enter your email address and we will send you a password reset link.',
    emailLabel: 'Email Address',
    emailPlaceholder: 'Enter your email address',
    sendButton: 'Send Reset Email',
    sending: 'Sending...',
    backToLogin: 'Back to Login',
    
    error: {
      emailRequired: 'Please enter email address',
      emailInvalid: 'Please enter a valid email address',
      sendFailed: 'Send failed, please try again later',
      resendFailed: 'Resend failed, please try again later'
    },
    
    success: {
      emailSent: 'Password reset email has been sent, please check your inbox',
      emailResent: 'Password reset email has been resent'
    },
    
    emailSent: {
      title: 'Email Sent',
      description: 'We have sent a password reset email to <1>{{email}}</1>. Please check your inbox and click the link in the email to reset your password.',
      resendButton: 'Resend Email',
      sending: 'Sending...',
      backToLogin: 'Back to Login'
    }
  },
  
  'ja-JP': {
    title: 'パスワードを忘れた',
    description: 'メールアドレスを入力してください。パスワードリセットリンクをお送りします。',
    emailLabel: 'メールアドレス',
    emailPlaceholder: 'メールアドレスを入力',
    sendButton: 'リセットメールを送信',
    sending: '送信中...',
    backToLogin: 'ログインに戻る',
    
    error: {
      emailRequired: 'メールアドレスを入力してください',
      emailInvalid: '有効なメールアドレスを入力してください',
      sendFailed: '送信に失敗しました。後でもう一度お試しください',
      resendFailed: '再送信に失敗しました。後でもう一度お試しください'
    },
    
    success: {
      emailSent: 'パスワードリセットメールが送信されました。受信箱をご確認ください',
      emailResent: 'パスワードリセットメールが再送信されました'
    },
    
    emailSent: {
      title: 'メール送信完了',
      description: '<1>{{email}}</1> にパスワードリセットメールを送信しました。受信箱をご確認の上、メール内のリンクをクリックしてパスワードをリセットしてください。',
      resendButton: 'メールを再送信',
      sending: '送信中...',
      backToLogin: 'ログインに戻る'
    }
  }
};