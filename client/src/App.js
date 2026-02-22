import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ErrorBoundary from './components/Error/ErrorBoundary';

// 国际化配置
import './i18n';

// 页面组件
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
import CreatePrompt from './pages/CreatePrompt';
import PromptList from './pages/PromptList';
import PromptDetail from './pages/PromptDetail';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import Health from './pages/Health';
import NotFound from './pages/NotFound';
import Explore from './pages/Explore';
import Favorites from './pages/Favorites';
import Settings from './pages/Settings';
import About from './pages/About';
import Help from './pages/Help';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Contact from './pages/Contact';
import Notifications from './pages/Notifications';
import ErrorDemo from './pages/ErrorDemo';
import GalleryList from './pages/Gallery/GalleryList';
import GalleryDetail from './pages/Gallery/GalleryDetail';
import SeedanceList from './pages/Seedance/SeedanceList';
import SeedanceDetail from './pages/Seedance/SeedanceDetail';

// 路由保护组件
import ProtectedRoute from './components/Auth/ProtectedRoute';
import AdminRoute from './components/Auth/AdminRoute';
import ScrollToTop from './components/UI/ScrollToTop';

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
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
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
                        <Route path="prompts" element={<PromptList />} />
                        <Route path="prompt/:id" element={<PromptDetail />} />
                        <Route path="user/:id" element={<Profile />} />
                        <Route path="explore" element={<Explore />} />
                        <Route path="health" element={<Health />} />
                        <Route path="about" element={<About />} />
                        <Route path="help" element={<Help />} />
                        <Route path="privacy" element={<Privacy />} />
                        <Route path="terms" element={<Terms />} />
                        <Route path="contact" element={<Contact />} />
                        <Route path="error-demo" element={<ErrorDemo />} />
                        {/* 画廊与视频（公开路由） */}
                        <Route path="gallery" element={<GalleryList />} />
                        <Route path="gallery/:id" element={<GalleryDetail />} />
                        <Route path="seedance" element={<SeedanceList />} />
                        <Route path="seedance/:id" element={<SeedanceDetail />} />
                      </Route>

                      {/* 需要登录的路由 */}
                      <Route path="/" element={
                        <ProtectedRoute>
                          <Layout />
                        </ProtectedRoute>
                      }>
                        <Route path="dashboard" element={<Dashboard />} />
                        <Route path="create" element={<CreatePost />} />
                        <Route path="create-prompt" element={<CreatePrompt />} />
                        <Route path="favorites" element={<Favorites />} />
                        <Route path="settings" element={<Settings />} />
                        <Route path="notifications" element={<Notifications />} />
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
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;