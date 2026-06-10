import React from 'react';
import { BarChart3 } from 'lucide-react';

const ScoreStatisticsPage: React.FC = () => {
  return (
    <div className="score-statistics-page">
      <header className="page-header">
        <div className="header-content">
          <h1>
            <BarChart3 className="trophy-icon" />
            成绩统计
          </h1>
          <p>查看比赛成绩和统计数据</p>
        </div>
      </header>

      <main className="page-content">
        <div className="content-section">
          <h2>成绩统计</h2>
          <p>这里将显示比赛成绩统计功能</p>
        </div>
      </main>
    </div>
  );
};

export default ScoreStatisticsPage;
