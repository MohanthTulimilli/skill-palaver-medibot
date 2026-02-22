import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthState, User, UserRole } from '@/types';
import { api, setToken, clearToken } from '@/lib/api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, hospitalId?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const loadUser = useCallback(async (token: string) => {
    try {
      const user = await api<{
        id: string;
        email: string;
        name: string;
        role: string;
        avatar?: string;
        hospitalId?: string;
        hospitalName?: string;
      }>('/api/auth/me');
      setState({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role as UserRole,
          avatar: user.avatar,
          hospitalId: user.hospitalId,
          hospitalName: user.hospitalName,
        },
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      clearToken();
      setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      loadUser(token);
    } else {
      setState((s) => ({ ...s, isLoading: false }));
    }
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ token: string; user: { id: string; email: string; name: string; role: string; avatar?: string; hospitalId?: string; hospitalName?: string } }>(
      '/api/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) }
    );
    setToken(res.token);
    setState({
      user: {
        id: res.user.id,
        email: res.user.email,
        name: res.user.name,
        role: res.user.role as UserRole,
        avatar: res.user.avatar,
        hospitalId: res.user.hospitalId,
        hospitalName: res.user.hospitalName,
      },
      token: res.token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string, hospitalId?: string) => {
    const res = await api<{ token: string; user: { id: string; email: string; name: string; role: string; avatar?: string; hospitalId?: string; hospitalName?: string } }>(
      '/api/auth/signup',
      { method: 'POST', body: JSON.stringify({ email, password, name, hospitalId: hospitalId || null }) }
    );
    setToken(res.token);
    setState({
      user: {
        id: res.user.id,
        email: res.user.email,
        name: res.user.name,
        role: res.user.role as UserRole,
        avatar: res.user.avatar,
        hospitalId: res.user.hospitalId,
        hospitalName: res.user.hospitalName,
      },
      token: res.token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(async () => {
    clearToken();
    setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
