import React, { createContext, useContext, useReducer, useEffect, useCallback, useState } from 'react';
import { enhancedAuthAPI } from '../services/enhancedApi';
import axios from 'axios';
import toast from 'react-hot-toast';
import i18n from '../i18n';

const AuthContext = createContext();

// 认证状态管理
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const openLoginModal  = useCallback(() => setIsLoginModalOpen(true), []);
  const closeLoginModal = useCallback(() => setIsLoginModalOpen(false), []);
  const openSearch  = useCallback(() => setIsSearchOpen(true), []);
  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

  // 检查认证状态
  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await enhancedAuthAPI.getMe();
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.data.user,
          token: localStorage.getItem('token')
        }
      });
    } catch (error) {
      localStorage.removeItem('token');
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  // 初始化时检查token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      checkAuthStatus();
    }
  }, [checkAuthStatus]);

  // 登录
  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await enhancedAuthAPI.login(credentials);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token }
      });
      
      toast.success(i18n.t('auth.toast.loginSuccess'), {
        icon: '🎉',
        duration: 3000
      });
      return { success: true };
    } catch (error) {
      let message = i18n.t('auth.toast.loginFailed');
      let errorType = 'UNKNOWN';

      if (error.response?.status === 400) {
        message = i18n.t('auth.toast.invalidCredentials');
        errorType = 'INVALID_CREDENTIALS';
      } else if (error.response?.status === 423) {
        message = i18n.t('auth.toast.accountLocked');
        errorType = 'ACCOUNT_LOCKED';
      } else if (error.response?.status === 403) {
        message = i18n.t('auth.toast.emailNotVerified');
        errorType = 'EMAIL_NOT_VERIFIED';
        dispatch({ type: 'LOGIN_FAILURE', payload: message });
        toast.error(message, {
          duration: 5000,
          action: {
            label: i18n.t('auth.toast.resendVerification'),
            onClick: () => {}
          }
        });
        return {
          success: false,
          error: errorType,
          data: error.response?.data
        };
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.code === 'NETWORK_ERROR') {
        message = i18n.t('auth.toast.networkError');
        errorType = 'NETWORK_ERROR';
      }
      
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: message
      });
      
      // 显示友好的错误提示
      if (errorType === 'NETWORK_ERROR') {
        toast.error(message, {
          icon: '🌐',
          duration: 6000,
          action: {
            label: i18n.t('auth.toast.retry'),
            onClick: () => login(credentials)
          }
        });
      } else {
        toast.error(message, {
          icon: '❌',
          duration: 5000
        });
      }
      
      return { success: false, error: errorType, message };
    }
  };

  // 注册
  const register = async (userData) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const response = await enhancedAuthAPI.register(userData);
      
      // 检查是否需要邮箱验证
      if (response.data.data?.needVerification) {
        dispatch({ type: 'LOGIN_FAILURE', payload: null }); // 清除loading状态
        toast.success(response.data.message || i18n.t('auth.toast.registerSuccessVerify'));
        return { 
          success: true, 
          data: response.data.data // 包含needVerification, userId, email等信息
        };
      }
      
      // 如果不需要验证，直接登录
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token }
      });
      
      toast.success(i18n.t('auth.toast.registerSuccess'));
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || i18n.t('auth.toast.registerFailed');
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: message
      });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // 登出
  const logout = () => {
    localStorage.removeItem('token');
    dispatch({ type: 'LOGOUT' });
    toast.success(i18n.t('auth.toast.logoutSuccess'));
  };

  // 更新用户信息
  const updateUser = (userData) => {
    dispatch({
      type: 'UPDATE_USER',
      payload: userData
    });
  };

  // 清除错误
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Google OAuth 登录
  const loginWithGoogle = async (credential, inviteCode = '') => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const payload = inviteCode ? { credential, inviteCode } : { credential };
      const response = await axios.post('/api/auth/google', payload);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
      toast.success(i18n.t('auth.toast.googleLoginSuccess'), { icon: '🎉', duration: 3000 });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || i18n.t('auth.toast.googleLoginFailed');
      dispatch({ type: 'LOGIN_FAILURE', payload: message });
      toast.error(message);
      return { success: false, message };
    }
  };

  // 直接设置认证数据（用于邮箱验证后的自动登录）
  const setAuthData = (token, user) => {
    localStorage.setItem('token', token);
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: { user, token }
    });
    toast.success(i18n.t('auth.toast.verifySuccess'));
  };

  const value = {
    ...state,
    login,
    loginWithGoogle,
    register,
    logout,
    updateUser,
    clearError,
    checkAuthStatus,
    setAuthData,
    isLoginModalOpen,
    openLoginModal,
    closeLoginModal,
    isSearchOpen,
    openSearch,
    closeSearch,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
