import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Trophy, Calendar, BarChart3, Users, LogOut, ShieldAlert, Database, Menu, X, FileText } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/ToastContainer';
import LoadingSpinner from './components/LoadingSpinner';

// P2-1: 使用 React.lazy 进行页面级代码拆分
const TeamInfoPage = lazy(() => import('./pages/TeamInfoPage'));
const MatchSchedulePage = lazy(() => import('./pages/MatchSchedulePage'));
const ScoreStatisticsPage = lazy(() => import('./pages/ScoreStatisticsPage'));
const TeamManagementPage = lazy(() => import('./pages/TeamManagementPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AuditLogPage = lazy(() => import('./pages/AuditLogPage'));
const SystemSettingsPage = lazy(() => import('./pages/SystemSettingsPage'));
const NewsManagementPage = lazy(() => import('./pages/NewsManagementPage'));
const ForbiddenPage = lazy(() => import('./pages/ForbiddenPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const navItems = [
  { path: '/', label: '球队信息录入', icon: Trophy },
  { path: '/teams', label: '比赛信息录入', icon: Calendar },
  { path: '/schedule', label: '球队与球员管理', icon: Users },
  { path: '/statistics', label: '比赛结果管理', icon: BarChart3 },
  { path: '/news', label: '活动资讯管理', icon: FileText },
  { path: '/audit-logs', label: '操作审计日志', icon: ShieldAlert },
  { path: '/settings', label: '系统设置与管理', icon: Database },
];

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner fullScreen text="加载中..." />;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner fullScreen text="加载中..." />;
  }
  
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
};

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const filteredNavItems = navItems.filter((item) => {
    if (!user) return false;
    if (user.role === 'super_admin') {
      return true;
    }
    if (user.role === 'match_scorer') {
      return item.path === '/teams' || item.path === '/statistics' || item.path === '/news';
    }
    if (user.role === 'coach') {
      return item.path === '/schedule';
    }
    // 普通用户 (user) 仅限只读访问球队信息管理
    return item.path === '/schedule';
  });
  
  return (
    <nav className="main-nav" role="navigation" aria-label="主导航">
      <div className="nav-container">
        <div className="nav-logo">
          <Trophy size={24} />
          <span>校园足球赛事系统</span>
        </div>
        
        {/* 移动端汉堡包切换按钮 */}
        <button 
          className="menu-toggle-btn" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="切换菜单"
          aria-expanded={isMenuOpen}
          aria-controls="nav-menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div 
          id="nav-menu"
          className={`nav-menu-wrapper ${isMenuOpen ? 'active' : ''}`}
          role="menu"
        >
          <ul className="nav-links" role="menubar">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path} role="none">
                  <Link 
                    to={item.path} 
                    onClick={() => setIsMenuOpen(false)}
                    role="menuitem"
                    aria-current={window.location.pathname === item.path ? 'page' : undefined}
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="nav-user" role="group" aria-label="用户信息">
            <span className="user-name">
              {user?.username || '用户'} 
              <span style={{ fontSize: '11px', opacity: 0.7, marginLeft: '5px', padding: '2px 6px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px' }}>
                {user?.role === 'super_admin' ? '超管' : user?.role === 'match_scorer' ? '记录员' : user?.role === 'coach' ? '教练' : '普通用户'}
              </span>
            </span>
            <button 
              className="logout-btn" 
              onClick={() => { logout(); setIsMenuOpen(false); }}
              aria-label="退出登录"
            >
              <LogOut size={18} aria-hidden="true" />
              退出
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const RoleGuardRoute: React.FC<{ allowedRoles: string[]; children: React.ReactNode }> = ({ allowedRoles, children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <LoadingSpinner text="正在验证访问权限..." />;
  }
  
  if (!user || !allowedRoles.includes(user.role)) {
    // P1-4: 权限不足时显示 403 页面，不再静默跳回首页
    return <ForbiddenPage />;
  }
  
  return <>{children}</>;
};

const HomeRedirect: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (user.role === 'super_admin') {
    return <TeamInfoPage />;
  }
  if (user.role === 'match_scorer') {
    return <Navigate to="/teams" replace />;
  }
  return <Navigate to="/schedule" replace />;
};

const AppContent: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner fullScreen text="加载页面中..." />}>
        <Routes>
          <Route path="/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />
          {/* P0-2: 移除公开注册路由 */}
          <Route path="/register" element={<Navigate to="/login" replace />} />
          {/* P1-4: 添加 403 和 404 页面 */}
          <Route path="/403" element={<ForbiddenPage />} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <div className="app">
                <Navigation />
                <main role="main" aria-label="主要内容">
                  <Suspense fallback={<LoadingSpinner text="加载页面中..." />}>
                    <Routes>
                       <Route path="/" element={<HomeRedirect />} />
                       <Route path="/teams" element={<RoleGuardRoute allowedRoles={['super_admin', 'match_scorer']}><TeamManagementPage /></RoleGuardRoute>} />
                       <Route path="/schedule" element={<MatchSchedulePage />} />
                       <Route path="/statistics" element={<RoleGuardRoute allowedRoles={['super_admin', 'match_scorer']}><ScoreStatisticsPage /></RoleGuardRoute>} />
                       <Route path="/news" element={<RoleGuardRoute allowedRoles={['super_admin', 'match_scorer']}><NewsManagementPage /></RoleGuardRoute>} />
                       <Route path="/audit-logs" element={<RoleGuardRoute allowedRoles={['super_admin']}><AuditLogPage /></RoleGuardRoute>} />
                       <Route path="/settings" element={<RoleGuardRoute allowedRoles={['super_admin']}><SystemSettingsPage /></RoleGuardRoute>} />
                       {/* P1-4: 添加通配路由，显示 404 页面 */}
                       <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </Suspense>
                </main>
              </div>
            </ProtectedRoute>
          } />
        </Routes>
      </Suspense>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
