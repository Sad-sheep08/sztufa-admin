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
  
  return (
    <nav className="main-nav">
      <div className="nav-container">
        <div className="nav-logo">
          <Trophy size={24} />
          <span>校园足球赛事系统</span>
        </div>
        <ul className="nav-links">
          {navItems.map((item) => {
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
          <span className="user-name">{user?.username || '用户'}</span>
          <button className="logout-btn" onClick={logout}>
            <LogOut size={18} />
            退出
          </button>
        </div>
      </div>
    </nav>
  );
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
                 <Route path="/" element={<TeamInfoPage />} />
                 <Route path="/teams" element={<TeamManagementPage />} />
                 <Route path="/schedule" element={<MatchSchedulePage />} />
                 <Route path="/statistics" element={<ScoreStatisticsPage />} />
                 <Route path="/audit-logs" element={<AuditLogPage />} />
                 <Route path="/settings" element={<SystemSettingsPage />} />
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
