import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User } from '../types/auth';
import {
  authApi,
  setAuthToken,
  getAuthToken,
  removeAuthToken,
  setTokenExpiry,
  getTokenExpiry,
  removeTokenExpiry,
  isTokenExpired,
} from '../api/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_EXPIRY_DAYS = 7;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkTokenExpiry = useCallback(() => {
    const token = getAuthToken();
    const expiry = getTokenExpiry();
    
    if (!token || !expiry) {
      return false;
    }
    
    if (Date.now() > expiry) {
      removeAuthToken();
      removeTokenExpiry();
      setUser(null);
      return false;
    }
    
    return true;
  }, []);

  useEffect(() => {
    const initAuth = () => {
      if (checkTokenExpiry()) {
        const token = getAuthToken();
        if (token) {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch {
              removeAuthToken();
              removeTokenExpiry();
            }
          }
        }
      }
      setIsLoading(false);
    };
    
    initAuth();
  }, [checkTokenExpiry]);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authApi.login({ username, password });
      
      if (response && response.token) {
        const { token, user: userData } = response;
        
        setAuthToken(token);
        const expiryTime = Date.now() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        setTokenExpiry(expiryTime);
        
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

  const register = async (username: string, password: string, role?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await authApi.register({
        username,
        password,
        role,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '注册失败';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeAuthToken();
    removeTokenExpiry();
    localStorage.removeItem('user');
    setUser(null);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && checkTokenExpiry(),
        isLoading,
        error,
        login,
        register,
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