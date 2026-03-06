import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ErrorBoundary from './components/Error/ErrorBoundary';
import LoginModal from './components/Auth/LoginModal';
import Layout from './components/Layout/Layout';
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
import Health from './pages/Health';
import NotFound from './pages/NotFound';
import Explore from './pages/Explore';
import SrefModal from './pages/SrefModal';
import Favorites from './pages/Favorites';
import Settings from './pages/Settings';
import About from './pages/About';
import Help from './pages/Help';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Contact from './pages/Contact';
import Notifications from './pages/Notifications';
import Credits from './pages/Credits';
import History from './pages/History';
import ErrorDemo from './pages/ErrorDemo';
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
            <AuthProvider>
              <NotificationProvider>
                <Router future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true
                }}>
                  <ScrollToTop />
                  <div className="min-h-screen">
                    <Routes>
                      {/* 公开路由 */}
                      <Route path="/" element={<Layout />}>
                        <Route index element={<Home />} />
                        <Route path="login" element={<Login />} />
                        <Route path="register" element={<Register />} />
                        <Route path="verify-email" element={<EmailVerification />} />
                        <Route path="forgot-password" element={<ForgotPassword />} />
                        <Route path="reset-password" element={<ResetPassword />} />
                        <Route path="post/:id" element={<PostDetail />} />
                        <Route path="user/:id" element={<Profile />} />
                        <Route path="explore" element={<Explore />}>
                          <Route path=":id" element={<SrefModal />} />
                        </Route>
                        <Route path="health" element={<Health />} />
                        <Route path="about" element={<About />} />
                        <Route path="help" element={<Help />} />
                        <Route path="history" element={<History />} />
                        <Route path="privacy" element={<Privacy />} />
                        <Route path="terms" element={<Terms />} />
                        <Route path="contact" element={<Contact />} />
                        <Route path="error-demo" element={<ErrorDemo />} />
                        {/* 画廊与视频（嵌套路由 — Modal 方案） */}
                        <Route path="gallery" element={<GalleryList />}>
                          <Route path=":id" element={<GalleryModal />} />
                        </Route>
                        <Route path="seedance" element={<SeedanceList />}>
                          <Route path=":id" element={<SeedanceModal />} />
                        </Route>
                      </Route>

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
                      </Route>

                      {/* 管理员路由 */}
                      <Route path="/admin" element={
                        <AdminRoute>
                          <Layout />
                        </AdminRoute>
                      }>
                        <Route index element={<AdminPanel />} />
                      </Route>

                      {/* 404页面 */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>

                    {/* 全局 LoginModal */}
                    <GlobalLoginModal />

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
          </ThemeProvider>
          </GoogleOAuthProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;