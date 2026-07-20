import React, { useState, useEffect, useRef } from 'react';
import { X, Lock, Eye, EyeOff } from 'lucide-react';

interface PasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => Promise<void>;
  username: string;
  isLoading?: boolean;
}

const PasswordDialog: React.FC<PasswordDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  username,
  isLoading = false,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setConfirmPassword('');
      setError(null);
      setShowPassword(false);
      setIsSubmitting(false);
      // 焦点进入输入框
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  const handleSubmit = async () => {
    if (!password.trim()) {
      setError('密码不能为空');
      return;
    }
    if (password.length < 6) {
      setError('密码长度不能少于6个字符');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(password);
    } catch {
      // 页面会展示接口返回的具体错误；保留输入供管理员修正后重试。
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && !isSubmitting) {
      void handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="dialog-overlay" onClick={() => !isSubmitting && onClose()}>
      <div 
        className="dialog-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-dialog-title"
      >
        <div className="dialog-header">
          <div className="dialog-icon" style={{ color: '#3182ce' }}>
            <Lock size={24} />
          </div>
          <h3 id="password-dialog-title" className="dialog-title">重置密码</h3>
          <button className="dialog-close" onClick={onClose} aria-label="关闭" disabled={isLoading || isSubmitting}>
            <X size={20} />
          </button>
        </div>
        
        <div className="dialog-body">
          <p className="dialog-message">
            为用户 <strong>{username}</strong> 设置新密码
          </p>
          
          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              新密码
            </label>
            <div style={{ position: 'relative' }}>
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="请输入新密码（至少6个字符）"
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 12px',
                  border: '1px solid #ced4da',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
                disabled={isLoading || isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  color: '#666',
                }}
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', fontSize: '14px' }}>
              确认密码
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="请再次输入新密码"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #ced4da',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              disabled={isLoading || isSubmitting}
            />
          </div>

          {error && (
            <div style={{ 
              marginTop: '12px', 
              padding: '8px 12px', 
              background: '#fff5f5', 
              border: '1px solid #fed7d7',
              borderRadius: '6px',
              color: '#e53e3e',
              fontSize: '13px',
            }}>
              {error}
            </div>
          )}
        </div>
        
        <div className="dialog-footer">
          <button 
            className="dialog-button dialog-button-cancel"
            onClick={onClose}
            disabled={isLoading || isSubmitting}
          >
            取消
          </button>
          <button 
            className="dialog-button dialog-button-confirm"
            onClick={() => void handleSubmit()}
            disabled={isLoading || isSubmitting}
            style={{ backgroundColor: '#3182ce' }}
          >
            {isLoading || isSubmitting ? (
              <>
                <span className="spinner"></span>
                重置中...
              </>
            ) : (
              '确认重置'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasswordDialog;
