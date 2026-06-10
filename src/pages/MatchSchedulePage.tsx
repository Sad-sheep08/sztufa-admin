import React from 'react';
import { Calendar } from 'lucide-react';

const MatchSchedulePage: React.FC = () => {
  return (
    <div className="match-schedule-page">
      <header className="page-header">
        <div className="header-content">
          <h1>
            <Calendar className="trophy-icon" />
            比赛日程管理
          </h1>
          <p>管理校园足球比赛的赛程安排</p>
        </div>
      </header>

      <main className="page-content">
        <div className="content-section">
          <h2>比赛日程</h2>
          <p>这里将显示比赛日程管理功能</p>
        </div>
      </main>
    </div>
  );
};

export default MatchSchedulePage;
