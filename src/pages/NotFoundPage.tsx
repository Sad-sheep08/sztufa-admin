import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="error-page">
      <div className="error-container">
        <div className="error-icon">
          <FileQuestion size={64} />
        </div>
        <h1 className="error-code">404</h1>
        <h2 className="error-title">页面未找到</h2>
        <p className="error-message">
          抱歉，您访问的页面不存在或已被移除。请检查网址是否正确。
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

export default NotFoundPage;
