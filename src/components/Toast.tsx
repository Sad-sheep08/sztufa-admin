import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  type: ToastType;
  message: string;
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ type, message, duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // 等待淡出动画完成
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <XCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'info':
        return <Info size={20} />;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success':
        return '#38a169';
      case 'error':
        return '#e53e3e';
      case 'warning':
        return '#dd6b20';
      case 'info':
        return '#3182ce';
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#f0fff4';
      case 'error':
        return '#fff5f5';
      case 'warning':
        return '#fffaf0';
      case 'info':
        return '#ebf8ff';
    }
  };

  return (
    <div 
      className={`toast ${isVisible ? 'toast-enter' : 'toast-exit'}`}
      style={{ 
        backgroundColor: getBackgroundColor(),
        borderLeft: `4px solid ${getColor()}`,
        color: getColor(),
      }}
    >
      <div className="toast-icon">
        {getIcon()}
      </div>
      <div className="toast-content">
        <p className="toast-message">{message}</p>
      </div>
      <button 
        className="toast-close" 
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        aria-label="关闭"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
