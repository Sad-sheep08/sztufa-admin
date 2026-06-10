import React, { useState, useCallback, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Trophy, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ValidationErrors } from '../types/auth';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isLoading, error: authError, clearError } = useAuth();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tokenExpired = searchParams.get('expired') === 'true';

  const validateField = useCallback((name: string, value: string): string | undefined => {
    switch (name) {
      case 'username':
        if (!value.trim()) {
          return '用户名不能为空';
        }
        if (value.trim().length < 3) {
          return '用户名至少需要3个字符';
        }
        break;
      case 'password':
        if (!value) {
          return '密码不能为空';
        }
        break;
    }
    return undefined;
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }, [validateField]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'username') {
      setUsername(value);
    } else if (name === 'password') {
      setPassword(value);
    }
    
    if (errors[name as keyof ValidationErrors]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [errors, validateField]);

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};
    
    const usernameError = validateField('username', username);
    const passwordError = validateField('password', password);
    
    if (usernameError) newErrors.username = usernameError;
    if (passwordError) newErrors.password = passwordError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [username, password, validateField]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    clearError();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '登录失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <Trophy size={40} className="logo-icon" />
            </div>
            <h1 className="auth-title">校园足球赛事系统</h1>
            <p className="auth-subtitle">登录您的账户</p>
          </div>

          {(submitError || authError || tokenExpired) && (
            <div className="auth-alert auth-alert-error">
              <AlertCircle size={18} />
              <span>{tokenExpired ? '登录已过期，请重新登录' : (submitError || authError)}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="username">用户名 / 邮箱</label>
              <input
                type="text"
                id="username"
                name="username"
                value={username}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`form-input ${errors.username ? 'input-error' : ''}`}
                placeholder="请输入用户名或邮箱"
                disabled={isSubmitting}
                autoComplete="username"
              />
              {errors.username && (
                <span className="error-message">{errors.username}</span>
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
                  placeholder="请输入密码"
                  disabled={isSubmitting}
                  autoComplete="current-password"
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

            <div className="form-row-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isSubmitting}
                />
                <span className="checkbox-custom"></span>
                记住我
              </label>
              <Link to="/forgot-password" className="forgot-password-link">
                忘记密码？
              </Link>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isSubmitting || isLoading}
            >
              {isSubmitting || isLoading ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              还没有账户？{' '}
              <Link to="/register" className="auth-link">立即注册</Link>
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

export default LoginPage;
