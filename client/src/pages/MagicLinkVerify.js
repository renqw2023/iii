import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const MagicLinkVerify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthData } = useAuth();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('无效的链接，缺少 token 参数');
      return;
    }

    axios.get(`/api/auth/magic-link/verify?token=${token}`)
      .then(res => {
        const { token: jwt, user } = res.data;
        setAuthData(jwt, user);
        setStatus('success');
        toast.success('登录成功！', { icon: '✨', duration: 3000 });
        setTimeout(() => navigate('/'), 1200);
      })
      .catch(err => {
        const msg = err.response?.data?.message || '链接已失效，请重新发送';
        setStatus('error');
        setMessage(msg);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="text-center max-w-sm">
        {status === 'verifying' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)' }} />
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>正在验证登录链接...</h2>
            <p style={{ color: 'var(--text-secondary)' }}>请稍候</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center text-3xl" style={{ backgroundColor: 'rgba(99,102,241,0.15)' }}>
              ✨
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>登录成功！</h2>
            <p style={{ color: 'var(--text-secondary)' }}>正在跳转...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center text-3xl" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
              ⚠️
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>链接已失效</h2>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>{message}</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 rounded-xl text-sm font-medium"
              style={{ backgroundColor: 'var(--accent-primary)', color: '#fff' }}
            >
              返回首页
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default MagicLinkVerify;
