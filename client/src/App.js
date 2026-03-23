import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { GenerationProvider } from './contexts/GenerationContext';
import ErrorBoundary from './components/Error/ErrorBoundary';
import LoginModal from './components/Auth/LoginModal';
import SearchModal from './components/Search/SearchModal';
import Layout from './components/Layout/Layout';
import HomeLayout from './components/Layout/HomeLayout';
import DocsLayout from './components/Layout/DocsLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import EmailVerification from './pages/EmailVerification';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import PostDetail from './pages/PostDetail';
import CreatePost from './pages/CreatePost';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import NotFound from './pages/NotFound';
import Explore from './pages/Explore';
import SrefModal from './pages/SrefModal';
import Favorites from './pages/Favorites';
import Settings from './pages/Settings';
import DocsCenter from './pages/DocsCenter';
import Notifications from './pages/Notifications';
import Credits from './pages/Credits';
import History from './pages/History';
import GenerateHistory from './pages/GenerateHistory';
import Orders from './pages/Orders';
import Subscription from './pages/Subscription';
import MagicLinkVerify from './pages/MagicLinkVerify';
import Img2Prompt from './pages/Img2Prompt';
import GalleryList from './pages/Gallery/GalleryList';
import GalleryModal from './pages/Gallery/GalleryModal';
import SeedanceList from './pages/Seedance/SeedanceList';
import SeedanceModal from './pages/Seedance/SeedanceModal';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AdminRoute from './components/Auth/AdminRoute';
import ScrollToTop from './components/UI/ScrollToTop';
// 国际化配置
import './i18n';

// Google OAuth Client ID
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

// 全局 LoginModal 挂载（需要 AuthContext）
const GlobalLoginModal = () => {
  const { isLoginModalOpen, closeLoginModal } = useAuth();
  return <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />;
};

// 全局 SearchModal 挂载
const GlobalSearchModal = () => {
  const { isSearchOpen, closeSearch } = useAuth();
  return <SearchModal isOpen={isSearchOpen} onClose={closeSearch} />;
};

// 创建 React Query 客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5分钟
    },
  },
});

function App() {
  // 禁用浏览器原生滚动恢复，避免与自定义滚动恢复逻辑冲突
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          <ThemeProvider>
            <SidebarProvider>
            <GenerationProvider>
            <AuthProvider>
              <NotificationProvider>
                <Router future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true
                }}>
                  <ScrollToTop />
                  <div className="min-h-screen">
                    <Routes>
                      {/* 首页 + 认证页 — 无全局侧边栏，顶部 Header */}
                      <Route path="/" element={<HomeLayout />}>
                        <Route index element={<Home />} />
                        <Route path="login" element={<Login />} />
                        <Route path="register" element={<Register />} />
                        <Route path="verify-email" element={<EmailVerification />} />
                        <Route path="forgot-password" element={<ForgotPassword />} />
                        <Route path="reset-password" element={<ResetPassword />} />
                        <Route path="magic-link/verify" element={<MagicLinkVerify />} />
                      </Route>

                      {/* 内容页 — 带全局侧边栏（含 filter 集成页） */}
                      <Route path="/" element={<Layout />}>
                        <Route path="explore" element={<Explore />}>
                          <Route path=":id" element={<SrefModal />} />
                        </Route>
                        <Route path="gallery" element={<GalleryList />}>
                          <Route path=":id" element={<GalleryModal />} />
                        </Route>
                        <Route path="seedance" element={<SeedanceList />}>
                          <Route path=":id" element={<SeedanceModal />} />
                        </Route>
                        <Route path="post/:id" element={<PostDetail />} />
                        <Route path="user/:id" element={<Profile />} />
                      </Route>

                      <Route path="/" element={<DocsLayout />}>
                        <Route path="docs" element={<DocsCenter />} />
                      </Route>

                      <Route path="about" element={<Navigate to={{ pathname: '/docs', hash: '#about' }} replace />} />
                      <Route path="help" element={<Navigate to={{ pathname: '/docs', hash: '#help' }} replace />} />
                      <Route path="privacy" element={<Navigate to={{ pathname: '/docs', hash: '#privacy' }} replace />} />
                      <Route path="terms" element={<Navigate to={{ pathname: '/docs', hash: '#terms' }} replace />} />
                      <Route path="contact" element={<Navigate to={{ pathname: '/docs', hash: '#contact' }} replace />} />

                      {/* 需要登录的路由 */}
                      <Route path="/" element={
                        <ProtectedRoute>
                          <Layout />
                        </ProtectedRoute>
                      }>
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="create" element={<CreatePost />} />
                        <Route path="favorites" element={<Favorites />} />
                        <Route path="settings" element={<Settings />} />
                        <Route path="notifications" element={<Notifications />} />
                        <Route path="credits" element={<Credits />} />
                        <Route path="browse-history" element={<History />} />
                        <Route path="history" element={<Navigate to="/browse-history" replace />} />
                        <Route path="generate-history" element={<GenerateHistory />} />
                        <Route path="img2prompt" element={<Img2Prompt />} />
                        <Route path="orders" element={<Orders />} />
                        <Route path="subscription" element={<Subscription />} />
                      </Route>

                      {/* 管理员路由 — 独立布局，不套 Layout（避免 app 侧边栏与 admin 侧边栏冲突） */}
                      <Route path="/admin" element={
                        <AdminRoute>
                          <AdminPanel />
                        </AdminRoute>
                      } />

                      {/* 404页面 */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>

                    {/* 全局 LoginModal */}
                    <GlobalLoginModal />

                    {/* 全局 SearchModal */}
                    <GlobalSearchModal />

                    {/* 全局通知 */}
                    <Toaster
                      position="top-right"
                      toastOptions={{
                        duration: 4000,
                        style: {
                          background: 'rgba(255, 255, 255, 0.9)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '12px',
                          color: '#1e293b',
                          fontSize: '14px',
                          fontWeight: '500',
                        },
                        success: {
                          iconTheme: {
                            primary: '#10b981',
                            secondary: '#ffffff',
                          },
                        },
                        error: {
                          iconTheme: {
                            primary: '#ef4444',
                            secondary: '#ffffff',
                          },
                        },
                      }}
                    />
                  </div>
                </Router>
              </NotificationProvider>
            </AuthProvider>
            </GenerationProvider>
            </SidebarProvider>
          </ThemeProvider>
          </GoogleOAuthProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
