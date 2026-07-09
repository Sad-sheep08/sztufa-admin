import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Trophy, Calendar, BarChart3, Users, LogOut, ShieldAlert, Database } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import TeamInfoPage from './pages/TeamInfoPage';
import MatchSchedulePage from './pages/MatchSchedulePage';
import ScoreStatisticsPage from './pages/ScoreStatisticsPage';
import TeamManagementPage from './pages/TeamManagementPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AuditLogPage from './pages/AuditLogPage';
import SystemSettingsPage from './pages/SystemSettingsPage';

const navItems = [
  { path: '/', label: '球队信息录入', icon: Trophy },
  { path: '/teams', label: '比赛信息录入', icon: Calendar },
  { path: '/schedule', label: '球队信息管理', icon: Users },
  { path: '/statistics', label: '比赛信息管理', icon: BarChart3 },
  { path: '/audit-logs', label: '操作审计日志', icon: ShieldAlert },
  { path: '/settings', label: '数据安全备份', icon: Database },
];

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
            <div className="auth-logo" style={{ margin: '0 auto 20px' }}>
              <Trophy size={40} className="logo-icon" />
            </div>
            <p style={{ color: '#666' }}>加载中...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
            <div className="auth-logo" style={{ margin: '0 auto 20px' }}>
              <Trophy size={40} className="logo-icon" />
            </div>
            <p style={{ color: '#666' }}>加载中...</p>
          </div>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
};

const Navigation: React.FC = () => {
  const { user, logout } = useAuth();

  const filteredNavItems = navItems.filter((item) => {
    if (!user) return false;
    if (user.role === 'super_admin') {
      return true;
    }
    if (user.role === 'match_scorer') {
      return item.path === '/teams' || item.path === '/statistics';
    }
    if (user.role === 'coach') {
      return item.path === '/schedule';
    }
    // 普通用户 (user) 仅限只读访问球队信息管理
    return item.path === '/schedule';
  });
  
  return (
    <nav className="main-nav">
      <div className="nav-container">
        <div className="nav-logo">
          <Trophy size={24} />
          <span>校园足球赛事系统</span>
        </div>
        <ul className="nav-links">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <Link to={item.path}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="nav-user">
          <span className="user-name">
            {user?.username || '用户'} 
            <span style={{ fontSize: '11px', opacity: 0.7, marginLeft: '5px', padding: '2px 6px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px' }}>
              {user?.role === 'super_admin' ? '超管' : user?.role === 'match_scorer' ? '记录员' : user?.role === 'coach' ? '教练' : '普通用户'}
            </span>
          </span>
          <button className="logout-btn" onClick={logout}>
            <LogOut size={18} />
            退出
          </button>
        </div>
      </div>
    </nav>
  );
};

const RoleGuardRoute: React.FC<{ allowedRoles: string[]; children: React.ReactNode }> = ({ allowedRoles, children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        正在验证访问权限...
      </div>
    );
  }
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } />
        <Route path="/*" element={
          <ProtectedRoute>
            <div className="app">
              <Navigation />
              <Routes>
                 <Route path="/" element={<RoleGuardRoute allowedRoles={['super_admin']}><TeamInfoPage /></RoleGuardRoute>} />
                 <Route path="/teams" element={<RoleGuardRoute allowedRoles={['super_admin', 'match_scorer']}><TeamManagementPage /></RoleGuardRoute>} />
                 <Route path="/schedule" element={<MatchSchedulePage />} />
                 <Route path="/statistics" element={<RoleGuardRoute allowedRoles={['super_admin', 'match_scorer']}><ScoreStatisticsPage /></RoleGuardRoute>} />
                 <Route path="/audit-logs" element={<RoleGuardRoute allowedRoles={['super_admin']}><AuditLogPage /></RoleGuardRoute>} />
                 <Route path="/settings" element={<RoleGuardRoute allowedRoles={['super_admin']}><SystemSettingsPage /></RoleGuardRoute>} />
              </Routes>
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
