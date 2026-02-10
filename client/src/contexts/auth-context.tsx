'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken, clearToken, type User } from '@/lib/api';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('bidnest_token') : null;
    if (!token) {
      setLoading(false);
      return;
    }
    api.users
      .me()
      .then((profile) => {
        setUser(profile as User);
        if (profile.darkMode) {
          document.documentElement.classList.add('dark');
          localStorage.setItem('bidnest_dark', '1');
        }
      })
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const { user: u, token } = await api.auth.login({ email, password });
    setToken(token);
    const userData = u as User;
    setUser(userData);
    if (userData.darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('bidnest_dark', '1');
    }
    return userData;
  };

  const signup = async (email: string, password: string, name?: string) => {
    const { user: u, token } = await api.auth.signup({ email, password, name });
    setToken(token);
    const userData = u as User;
    setUser(userData);
    if (userData.darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('bidnest_dark', '1');
    }
  };

  const refreshUser = async () => {
    const profile = await api.users.me();
    setUser(profile as User);
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
