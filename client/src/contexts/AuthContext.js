import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { enhancedAuthAPI } from '../services/enhancedApi';
import toast from 'react-hot-toast';

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
      
      toast.success('登录成功！欢迎回来！', {
        icon: '🎉',
        duration: 3000
      });
      return { success: true };
    } catch (error) {
      let message = '登录失败';
      let errorType = 'UNKNOWN';
      
      if (error.response?.status === 400) {
        message = '邮箱或密码错误，请检查后重试';
        errorType = 'INVALID_CREDENTIALS';
      } else if (error.response?.status === 423) {
        message = '账户已被锁定，请联系管理员';
        errorType = 'ACCOUNT_LOCKED';
      } else if (error.response?.status === 403) {
        message = '邮箱尚未验证，请先验证邮箱';
        errorType = 'EMAIL_NOT_VERIFIED';
        // 返回特殊标识，让组件处理跳转
        dispatch({ type: 'LOGIN_FAILURE', payload: message });
        toast.error(message, {
          duration: 5000,
          action: {
            label: '重新发送验证邮件',
            onClick: () => {
              // 这里可以调用重新发送验证邮件的API
            }
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
        message = '网络连接失败，请检查网络后重试';
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
            label: '重试',
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
        toast.success(response.data.message || '注册成功，请查收邮箱验证码');
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
      
      toast.success('注册成功！');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || '注册失败';
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
    toast.success('已退出登录');
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

  // 直接设置认证数据（用于邮箱验证后的自动登录）
  const setAuthData = (token, user) => {
    localStorage.setItem('token', token);
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: { user, token }
    });
    toast.success('验证成功，欢迎使用！');
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    clearError,
    checkAuthStatus,
    setAuthData
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