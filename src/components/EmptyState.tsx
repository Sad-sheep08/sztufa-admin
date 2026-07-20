import React from 'react';
import { Inbox, Search, FileText, Users, Database } from 'lucide-react';

interface EmptyStateProps {
  icon?: 'inbox' | 'search' | 'file' | 'users' | 'database';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon = 'inbox', 
  title, 
  message, 
  action 
}) => {
  const getIcon = () => {
    switch (icon) {
      case 'inbox':
        return <Inbox size={48} />;
      case 'search':
        return <Search size={48} />;
      case 'file':
        return <FileText size={48} />;
      case 'users':
        return <Users size={48} />;
      case 'database':
        return <Database size={48} />;
    }
  };

  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {getIcon()}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-message">{message}</p>
      {action && (
        <button 
          className="empty-state-action"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
