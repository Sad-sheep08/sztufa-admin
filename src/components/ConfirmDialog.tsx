import React, { useEffect, useRef } from 'react';
import { X, AlertTriangle, Info, CheckCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  type = 'danger',
  isLoading = false,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // 焦点进入弹窗
      confirmButtonRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' && !isLoading) {
        onConfirm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirm, isLoading]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <AlertTriangle size={24} />;
      case 'warning':
        return <AlertTriangle size={24} />;
      case 'info':
        return <Info size={24} />;
      default:
        return <AlertTriangle size={24} />;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'danger':
        return '#e53e3e';
      case 'warning':
        return '#dd6b20';
      case 'info':
        return '#3182ce';
      default:
        return '#e53e3e';
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'danger':
        return '#e53e3e';
      case 'warning':
        return '#dd6b20';
      case 'info':
        return '#3182ce';
      default:
        return '#e53e3e';
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div 
        ref={dialogRef}
        className="dialog-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
      >
        <div className="dialog-header">
          <div className="dialog-icon" style={{ color: getIconColor() }}>
            {getIcon()}
          </div>
          <h3 id="dialog-title" className="dialog-title">{title}</h3>
          <button className="dialog-close" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </div>
        
        <div className="dialog-body">
          <p id="dialog-message" className="dialog-message">{message}</p>
        </div>
        
        <div className="dialog-footer">
          <button 
            className="dialog-button dialog-button-cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button 
            ref={confirmButtonRef}
            className="dialog-button dialog-button-confirm"
            onClick={onConfirm}
            disabled={isLoading}
            style={{ backgroundColor: getButtonColor() }}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                处理中...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
