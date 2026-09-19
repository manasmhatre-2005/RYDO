import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role, AuthResponse } from '../types';
import { apiClient } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: Role | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  demoLogin: (targetRole: Role) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('rydo_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await apiClient.get('/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error('Failed to load user profile', err);
      logout();
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('rydo_token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const res = await apiClient.get('/auth/me');
          setUser(res.data);
        } catch (err) {
          logout();
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const handleAuthSuccess = async (authData: AuthResponse) => {
    localStorage.setItem('rydo_token', authData.access_token);
    setToken(authData.access_token);
    const res = await apiClient.get('/auth/me', {
      headers: { Authorization: `Bearer ${authData.access_token}` }
    });
    setUser(res.data);
  };

  const login = async (email: string, pass: string) => {
    const res = await apiClient.post<AuthResponse>('/auth/login', {
      email,
      password: pass
    });
    await handleAuthSuccess(res.data);
  };

  const demoLogin = async (targetRole: Role) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post<AuthResponse>(`/auth/demo-login/${targetRole}`);
      await handleAuthSuccess(res.data);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any) => {
    const res = await apiClient.post<AuthResponse>('/auth/register', payload);
    await handleAuthSuccess(res.data);
  };

  const logout = () => {
    localStorage.removeItem('rydo_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isLoading,
        login,
        demoLogin,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
