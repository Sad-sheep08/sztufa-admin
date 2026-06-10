import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Trophy, Calendar, BarChart3, Users } from 'lucide-react';
import TeamInfoPage from './pages/TeamInfoPage';
import MatchSchedulePage from './pages/MatchSchedulePage';
import ScoreStatisticsPage from './pages/ScoreStatisticsPage';
import TeamManagementPage from './pages/TeamManagementPage';

const navItems = [
  { path: '/', label: '球队信息录入', icon: Trophy },
  { path: '/teams', label: '比赛信息录入', icon: Calendar },
  { path: '/schedule', label: '比赛日程', icon: Calendar },
  { path: '/statistics', label: '成绩统计', icon: BarChart3 },
];

const App: React.FC = () => {
  return (
    <Router>
      <div className="app">
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
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<TeamInfoPage />} />
          <Route path="/teams" element={<TeamManagementPage />} />
          <Route path="/schedule" element={<MatchSchedulePage />} />
          <Route path="/statistics" element={<ScoreStatisticsPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
