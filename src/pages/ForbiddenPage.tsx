import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

const ForbiddenPage: React.FC = () => {
  return (
    <div className="error-page">
      <div className="error-container">
        <div className="error-icon">
          <ShieldAlert size={64} />
        </div>
        <h1 className="error-code">403</h1>
        <h2 className="error-title">访问被拒绝</h2>
        <p className="error-message">
          抱歉，您没有权限访问此页面。请联系管理员获取相应权限。
        </p>
        <div className="error-actions">
          <Link to="/" className="error-button error-button-primary">
            <Home size={18} />
            返回首页
          </Link>
          <button 
            onClick={() => window.history.back()} 
            className="error-button error-button-secondary"
          >
            <ArrowLeft size={18} />
            返回上一页
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForbiddenPage;
