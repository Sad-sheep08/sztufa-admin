import React from 'react';
import { AlertCircle, WifiOff, Server, ShieldAlert, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  type?: 'network' | 'server' | 'permission' | 'generic';
  title: string;
  message: string;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ 
  type = 'generic', 
  title, 
  message, 
  onRetry 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'network':
        return <WifiOff size={48} />;
      case 'server':
        return <Server size={48} />;
      case 'permission':
        return <ShieldAlert size={48} />;
      case 'generic':
        return <AlertCircle size={48} />;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'network':
        return '#dd6b20';
      case 'server':
        return '#e53e3e';
      case 'permission':
        return '#805ad5';
      case 'generic':
        return '#e53e3e';
    }
  };

  return (
    <div className="error-state">
      <div className="error-state-icon" style={{ color: getIconColor() }}>
        {getIcon()}
      </div>
      <h3 className="error-state-title">{title}</h3>
      <p className="error-state-message">{message}</p>
      {onRetry && (
        <button 
          className="error-state-retry"
          onClick={onRetry}
        >
          <RefreshCw size={16} />
          重试
        </button>
      )}
    </div>
  );
};

export default ErrorState;
