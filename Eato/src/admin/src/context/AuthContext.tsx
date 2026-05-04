import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { auth as authApi } from '../api';

export type AuthRole = 'customer' | 'restaurant' | 'admin';

export type AuthUser = {
  _id?: string;
  id?: string;
  email?: string;
  role?: AuthRole;
  name?: string;
  restaurantName?: string;
  [key: string]: unknown;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, role: AuthRole) => Promise<AuthUser>;
  logout: () => void;
  setUserFromRegister: (u: AuthUser, token: string) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('eato_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((u) => setUser(u as AuthUser))
      .catch(() => localStorage.removeItem('eato_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string, role: AuthRole) => {
    const res = (await authApi.login({ email, password, role })) as { user: AuthUser; token: string };
    const { user: u, token } = res;
    localStorage.setItem('eato_token', token);
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('eato_token');
    setUser(null);
  };

  const setUserFromRegister = (u: AuthUser, token: string) => {
    localStorage.setItem('eato_token', token);
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUserFromRegister }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
