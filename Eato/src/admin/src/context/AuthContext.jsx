import { createContext, useContext, useState, useEffect } from 'react';
import { auth as authApi } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('eato_token');
    if (!token) { setLoading(false); return; }
    authApi.me().then(setUser).catch(() => localStorage.removeItem('eato_token')).finally(() => setLoading(false));
  }, []);

  const login = async (email, password, role) => {
    const { user: u, token } = await authApi.login({ email, password, role });
    localStorage.setItem('eato_token', token);
    setUser(u);
    return u;
  };

  const logout = () => {
    localStorage.removeItem('eato_token');
    setUser(null);
  };

  const setUserFromRegister = (u, token) => {
    localStorage.setItem('eato_token', token);
    setUser(u);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUserFromRegister }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
