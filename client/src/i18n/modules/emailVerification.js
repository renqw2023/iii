export const emailVerification = {
  'zh-CN': {
    title: '验证邮箱',
    description: '我们已向 <1>{{email}}</1> 发送了验证码',
    backToRegister: '返回注册',
    codeLabel: '验证码',
    codePlaceholder: '请输入6位验证码',
    verifyButton: '验证邮箱',
    verifying: '验证中...',
    noCodeReceived: '没有收到验证码？',
    resendButton: '重新发送验证码',
    resendCountdown: '{{seconds}}秒后可重新发送',
    success: {
      verified: '邮箱验证成功！正在跳转...',
      resent: '验证码已重新发送，请查收邮箱'
    },
    error: {
      sendFailed: '验证码发送失败，请点击重新发送按钮',
      codeRequired: '请输入验证码',
      codeLength: '验证码必须是6位数字',
      verifyFailed: '验证失败，请重试',
      resendFailed: '发送失败，请重试'
    },
    tips: {
      title: '温馨提示：',
      validity: '验证码有效期为10分钟',
      checkSpam: '请检查邮箱的垃圾邮件文件夹',
      contactSupport: '如果仍未收到，请联系客服'
    }
  },
  'en-US': {
    title: 'Verify Email',
    description: 'We have sent a verification code to <1>{{email}}</1>',
    backToRegister: 'Back to Register',
    codeLabel: 'Verification Code',
    codePlaceholder: 'Enter 6-digit code',
    verifyButton: 'Verify Email',
    verifying: 'Verifying...',
    noCodeReceived: 'Didn\'t receive the code?',
    resendButton: 'Resend Code',
    resendCountdown: 'Resend in {{seconds}}s',
    success: {
      verified: 'Email verified successfully! Redirecting...',
      resent: 'Verification code has been resent, please check your email'
    },
    error: {
      sendFailed: 'Failed to send verification code, please click resend',
      codeRequired: 'Please enter verification code',
      codeLength: 'Verification code must be 6 digits',
      verifyFailed: 'Verification failed, please try again',
      resendFailed: 'Failed to send, please try again'
    },
    tips: {
      title: 'Tips:',
      validity: 'Verification code is valid for 10 minutes',
      checkSpam: 'Please check your spam folder',
      contactSupport: 'If you still don\'t receive it, please contact support'
    }
  },
  'ja-JP': {
    title: 'メール認証',
    description: '<1>{{email}}</1> に認証コードを送信しました',
    backToRegister: '登録に戻る',
    codeLabel: '認証コード',
    codePlaceholder: '6桁のコードを入力',
    verifyButton: 'メール認証',
    verifying: '認証中...',
    noCodeReceived: 'コードが届きませんか？',
    resendButton: 'コードを再送信',
    resendCountdown: '{{seconds}}秒後に再送信可能',
    success: {
      verified: 'メール認証が成功しました！リダイレクト中...',
      resent: '認証コードを再送信しました。メールをご確認ください'
    },
    error: {
      sendFailed: '認証コードの送信に失敗しました。再送信ボタンをクリックしてください',
      codeRequired: '認証コードを入力してください',
      codeLength: '認証コードは6桁の数字である必要があります',
      verifyFailed: '認証に失敗しました。再試行してください',
      resendFailed: '送信に失敗しました。再試行してください'
    },
    tips: {
      title: 'ヒント：',
      validity: '認証コードの有効期限は10分です',
      checkSpam: 'スパムフォルダをご確認ください',
      contactSupport: 'それでも届かない場合は、サポートにお問い合わせください'
    }
  }
};