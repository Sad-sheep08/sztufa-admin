import React, { useState, useCallback, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Trophy, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ValidationErrors } from '../types/auth';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error: authError, clearError } = useAuth();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = useCallback((name: string, value: string, allValues?: { password?: string }): string | undefined => {
    switch (name) {
      case 'username':
        if (!value.trim()) {
          return '用户名不能为空';
        }
        if (value.trim().length < 3) {
          return '用户名至少需要3个字符';
        }
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          return '用户名只能包含字母、数字和下划线';
        }
        break;
      case 'email':
        if (!value.trim()) {
          return '邮箱不能为空';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return '请输入有效的邮箱地址';
        }
        break;
      case 'password':
        if (!value) {
          return '密码不能为空';
        }
        if (value.length < 6) {
          return '密码至少需要6个字符';
        }
        break;
      case 'confirmPassword':
        if (!value) {
          return '请确认密码';
        }
        if (value !== allValues?.password) {
          return '两次输入的密码不一致';
        }
        break;
    }
    return undefined;
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value, { password });
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [password, validateField]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    switch (name) {
      case 'username':
        setUsername(value);
        break;
      case 'email':
        setEmail(value);
        break;
      case 'password':
        setPassword(value);
        if (confirmPassword && value !== confirmPassword) {
          setErrors(prev => ({ ...prev, confirmPassword: '两次输入的密码不一致' }));
        } else {
          setErrors(prev => ({ ...prev, confirmPassword: undefined }));
        }
        break;
      case 'confirmPassword':
        setConfirmPassword(value);
        if (password && value !== password) {
          setErrors(prev => ({ ...prev, confirmPassword: '两次输入的密码不一致' }));
        } else {
          setErrors(prev => ({ ...prev, confirmPassword: undefined }));
        }
        break;
    }
    
    if (errors[name as keyof ValidationErrors]) {
      const error = validateField(name, value, { password });
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [errors, password, validateField]);

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    
    const usernameError = validateField('username', username);
    const emailError = validateField('email', email);
    const passwordError = validateField('password', password);
    const confirmPasswordError = validateField('confirmPassword', confirmPassword, { password });
    
    if (usernameError) newErrors.username = usernameError;
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;
    if (confirmPasswordError) newErrors.confirmPassword = confirmPasswordError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [username, email, password, confirmPassword, validateField]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);
    clearError();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await register(username, email, password);
      setSubmitSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '注册失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="success-message-container">
              <div className="success-icon-wrapper">
                <CheckCircle size={64} className="success-icon" />
              </div>
              <h2>注册成功！</h2>
              <p>正在跳转到登录页面...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <Trophy size={40} className="logo-icon" />
            </div>
            <h1 className="auth-title">校园足球赛事系统</h1>
            <p className="auth-subtitle">创建新账户</p>
          </div>

          {submitError && (
            <div className="auth-alert auth-alert-error">
              <AlertCircle size={18} />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="username">用户名</label>
              <input
                type="text"
                id="username"
                name="username"
                value={username}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-input ${errors.username ? 'input-error' : ''}`}
                placeholder="请输入用户名"
                disabled={isSubmitting}
                autoComplete="username"
              />
              {errors.username && (
                <span className="error-message">{errors.username}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">邮箱</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-input ${errors.email ? 'input-error' : ''}`}
                placeholder="请输入邮箱地址"
                disabled={isSubmitting}
                autoComplete="email"
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">密码</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`form-input ${errors.password ? 'input-error' : ''}`}
                  placeholder="请输入密码（至少6个字符）"
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">确认密码</label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="请再次输入密码"
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? '隐藏密码' : '显示密码'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="error-message">{errors.confirmPassword}</span>
              )}
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  注册中...
                </>
              ) : (
                '注册'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              已有账户？{' '}
              <Link to="/login" className="auth-link">立即登录</Link>
            </p>
          </div>
        </div>

        <div className="auth-decoration">
          <div className="decoration-circle circle-1"></div>
          <div className="decoration-circle circle-2"></div>
          <div className="decoration-circle circle-3"></div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
