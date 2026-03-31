import React, { useEffect, Suspense, lazy } from 'react';
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
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AdminRoute from './components/Auth/AdminRoute';
import ScrollToTop from './components/UI/ScrollToTop';
// 国际化配置
import './i18n';

// 页面按需加载 — 减小首屏 JS bundle
const Home              = lazy(() => import('./pages/Home'));
const Register          = lazy(() => import('./pages/Register'));
const EmailVerification = lazy(() => import('./pages/EmailVerification'));
const ForgotPassword    = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword     = lazy(() => import('./pages/ResetPassword'));
const Profile           = lazy(() => import('./pages/Profile'));
const PostDetail        = lazy(() => import('./pages/PostDetail'));
const CreatePost        = lazy(() => import('./pages/CreatePost'));
const Dashboard         = lazy(() => import('./pages/Dashboard'));
const AdminPanel        = lazy(() => import('./pages/AdminPanel'));
const NotFound          = lazy(() => import('./pages/NotFound'));
const Explore           = lazy(() => import('./pages/Explore'));
const SrefModal         = lazy(() => import('./pages/SrefModal'));
const Favorites         = lazy(() => import('./pages/Favorites'));
const Settings          = lazy(() => import('./pages/Settings'));
const DocsCenter        = lazy(() => import('./pages/DocsCenter'));
const Notifications     = lazy(() => import('./pages/Notifications'));
const Credits           = lazy(() => import('./pages/Credits'));
const History           = lazy(() => import('./pages/History'));
const GenerateHistory   = lazy(() => import('./pages/GenerateHistory'));
const Orders            = lazy(() => import('./pages/Orders'));
const Subscription      = lazy(() => import('./pages/Subscription'));
const Invoice           = lazy(() => import('./pages/Invoice'));
const MagicLinkVerify   = lazy(() => import('./pages/MagicLinkVerify'));
const Img2Prompt        = lazy(() => import('./pages/Img2Prompt'));
const GalleryList       = lazy(() => import('./pages/Gallery/GalleryList'));
const GalleryModal      = lazy(() => import('./pages/Gallery/GalleryModal'));
const MePage            = lazy(() => import('./pages/MePage'));
const SeedanceList      = lazy(() => import('./pages/Seedance/SeedanceList'));
const SeedanceModal     = lazy(() => import('./pages/Seedance/SeedanceModal'));
const VideoFeed         = lazy(() => import('./pages/VideoFeed/VideoFeed'));
const AuthorPage        = lazy(() => import('./pages/VideoFeed/AuthorPage'));

// Google OAuth Client ID
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

// 全局 LoginModal 挂载（需要 AuthContext）
const GlobalLoginModal = () => {
  const { isLoginModalOpen, closeLoginModal } = useAuth();
  return <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />;
};

// /login 重定向组件：跳回首页并打开 LoginModal
const LoginRedirect = () => {
  const { openLoginModal } = useAuth();
  useEffect(() => { openLoginModal(); }, [openLoginModal]);
  return <Navigate to="/" replace />;
};

// 移动端主页重定向：手机访问 / 时直接进入 Gallery
const MobileHomeRedirect = () => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  if (isMobile) return <Navigate to="/gallery" replace />;
  return <Home />;
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
                  <Suspense fallback={<div className="min-h-screen" />}>
                    <Routes>
                      {/* 首页 + 认证页 — 无全局侧边栏，顶部 Header */}
                      <Route path="/" element={<HomeLayout />}>
                        <Route index element={<MobileHomeRedirect />} />
                        <Route path="login" element={<LoginRedirect />} />
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
                        <Route path="me" element={<MePage />} />
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
                        <Route path="invoice/:orderId" element={<Invoice />} />
                      </Route>

                      {/* 移动端 TikTok 视频流 — 独立布局，不套 Layout */}
                      <Route path="/video/author/:name" element={<AuthorPage />} />
                      <Route path="/video" element={<VideoFeed />} />

                      {/* 管理员路由 — 独立布局，不套 Layout（避免 app 侧边栏与 admin 侧边栏冲突） */}
                      <Route path="/admin" element={
                        <AdminRoute>
                          <AdminPanel />
                        </AdminRoute>
                      } />

                      {/* 404页面 */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>

                  </Suspense>
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
