import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types/auth';
import { authApi } from '../api/auth.service';
import {
  setAuthToken,
  getAuthToken,
  removeAuthToken,
  setTokenExpiry,
  getTokenExpiry,
  removeTokenExpiry,
  isTokenExpired,
} from '../api/http';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // P1-2: 将 checkTokenExpiry 改为纯判断函数，不在其中调用 setUser
  const checkTokenExpiry = useCallback((): boolean => {
    const token = getAuthToken();
    const expiry = getTokenExpiry();
    
    if (!token || !expiry) {
      return false;
    }
    
    return Date.now() <= expiry;
  }, []);

  // P1-2: 统一的退出逻辑
  const performLogout = useCallback(() => {
    removeAuthToken();
    removeTokenExpiry();
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('tokenExpiry');
    setUser(null);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      // P1-2: 使用纯判断函数检查 token
      if (checkTokenExpiry()) {
        const token = getAuthToken();
        if (token) {
          // P0-4: 使用服务端接口恢复会话，而不是从 localStorage 读取
          try {
            const currentUser = await authApi.getCurrentUser();
            setUser({
              id: currentUser.id,
              username: currentUser.username,
              role: currentUser.role,
              teamId: currentUser.teamId,
            });
            // 更新 localStorage 中的用户信息
            localStorage.setItem('user', JSON.stringify(currentUser));
          } catch (err) {
            console.error('获取当前用户信息失败:', err);
            // P1-2: 如果获取失败，清理会话
            performLogout();
          }
        }
      } else {
        // P1-2: token 已过期或不存在，清理会话
        performLogout();
      }
      setIsLoading(false);
    };
    
    initAuth();
  }, [checkTokenExpiry, performLogout]);

  const login = async (username: string, password: string, rememberMe: boolean = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authApi.login({ username, password });
      
      if (response && response.token) {
        const { token, user: userData } = response;
        
        // 解析 JWT 获取过期时间
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const expiryTime = payload.exp ? payload.exp * 1000 : Date.now() + 7 * 24 * 60 * 60 * 1000;
          
          // P1-1: 根据"记住我"选项选择存储位置
          if (rememberMe) {
            // 勾选"记住我"：存入 localStorage，关闭浏览器后仍可恢复
            setAuthToken(token);
            setTokenExpiry(expiryTime);
          } else {
            // 未勾选"记住我"：存入 sessionStorage，关闭标签页或浏览器后失效
            sessionStorage.setItem('token', token);
            sessionStorage.setItem('tokenExpiry', expiryTime.toString());
          }
        } catch (e) {
          // JWT 解析失败，使用默认过期时间
          const expiryTime = Date.now() + 7 * 24 * 60 * 60 * 1000;
          if (rememberMe) {
            setAuthToken(token);
            setTokenExpiry(expiryTime);
          } else {
            sessionStorage.setItem('token', token);
            sessionStorage.setItem('tokenExpiry', expiryTime.toString());
          }
        }
        
        const userInfo: User = {
          id: (userData as { id: string })?.id || '',
          username: (userData as { username: string })?.username || username,
          role: (userData as { role: string })?.role || 'user',
          teamId: (userData as { teamId?: string })?.teamId,
        };
        
        localStorage.setItem('user', JSON.stringify(userInfo));
        setUser(userInfo);
      } else {
        throw new Error('登录失败');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // P1-2: 使用统一的退出逻辑
    performLogout();
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        // P1-2: 使用纯判断函数，避免在渲染期间修改状态
        isAuthenticated: !!user && checkTokenExpiry(),
        isLoading,
        error,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
