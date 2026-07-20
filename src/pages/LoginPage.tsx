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
      await login(username, password, rememberMe);
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
            <div className="auth-alert auth-alert-error" role="alert">
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
                aria-describedby={errors.username ? 'username-error' : undefined}
                aria-invalid={!!errors.username}
              />
              {errors.username && (
                <span id="username-error" className="error-message" role="alert">{errors.username}</span>
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
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <span id="password-error" className="error-message" role="alert">{errors.password}</span>
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
              {/* P0-3: 移除死链接，改为提示文本 */}
              <span className="forgot-password-hint" style={{ color: '#888', fontSize: '0.85em' }}>
                密码重置请联系超级管理员
              </span>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isSubmitting || isLoading}
              aria-busy={isSubmitting || isLoading}
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

          {/* API 联调诊断面板 (仅在局域网/本地环境展示) */}
          {!window.location.hostname.endsWith('sztufa.xyz') && (
            <div style={{ marginTop: '24px', padding: '16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', fontSize: '12px' }}>
              <div style={{ fontWeight: 600, color: '#495057', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                🔧 局域网 API 联调诊断面板
              </div>
              <div style={{ color: '#6c757d', marginBottom: '4px' }}>
                当前 Host: <code style={{ background: '#e9ecef', padding: '2px 4px', borderRadius: '3px' }}>{window.location.host}</code>
              </div>
              <div style={{ color: '#6c757d', marginBottom: '8px' }}>
                API BASE_URL: <code style={{ background: '#e9ecef', padding: '2px 4px', borderRadius: '3px' }}>/api/v1</code>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const btn = document.getElementById('diagnose-btn');
                  const resultDiv = document.getElementById('diagnose-result');
                  if (btn && resultDiv) {
                    btn.innerText = '诊断中...';
                    resultDiv.innerText = '';
                    try {
                      const start = Date.now();
                      const res = await fetch('/api/v1/seasons/active');
                      const responseText = await res.text();

                      if (!res.ok) {
                        if (res.status === 502 || res.status === 504) {
                          throw new Error(`本地后端未启动或无法连接（HTTP ${res.status}，请检查 localhost:3001）`);
                        }
                        throw new Error(`API 请求失败（HTTP ${res.status}）${responseText ? `：${responseText.slice(0, 120)}` : ''}`);
                      }

                      let data: { name?: string };
                      try {
                        data = JSON.parse(responseText) as { name?: string };
                      } catch {
                        throw new Error('API 已响应，但返回内容不是有效的 JSON');
                      }

                      const latency = Date.now() - start;
                      resultDiv.style.color = '#2b8a3e';
                      resultDiv.innerText = `✅ 连通成功! 响应时长: ${latency}ms\n当前活动赛季: ${data.name || '未命名'}`;
                    } catch (e) {
                      resultDiv.style.color = '#c92a2a';
                      resultDiv.innerText = `❌ 连通失败! 错误: ${e instanceof Error ? e.message : String(e)}`;
                    }
                    btn.innerText = '一键测试 API 连通性';
                  }
                }}
                id="diagnose-btn"
                style={{ width: '100%', padding: '8px', background: '#667eea', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}
              >
                一键测试 API 连通性
              </button>
              <div id="diagnose-result" style={{ marginTop: '8px', padding: '6px', borderRadius: '4px', background: '#fff', border: '1px dashed #ced4da', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}></div>
            </div>
          )}
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
