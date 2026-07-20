import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  text = '加载中...', 
  fullScreen = false 
}) => {
  const getSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'medium':
        return 24;
      case 'large':
        return 32;
    }
  };

  const content = (
    <div className={`loading-spinner ${fullScreen ? 'loading-fullscreen' : ''}`}>
      <Loader2 size={getSize()} className="spinner-icon" />
      {text && <p className="loading-text">{text}</p>}
    </div>
  );

  return content;
};

export default LoadingSpinner;
