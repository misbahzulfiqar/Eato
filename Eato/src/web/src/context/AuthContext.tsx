import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { api, auth as authApi } from '../api';
import {
  readToken,
  writeToken,
  clearToken,
  clearLegacyToken,
  readLegacyToken,
  legacyTokenWasPersistent,
  selectSessionUserForPath,
  inferRoleToRefreshFromPath,
} from '../authTokens';
import type { ApiUserBase, Role } from '../types/eato';

type AuthRegisterUser = any;

export type SessionsState = {
  customer: ApiUserBase | null;
  restaurant: ApiUserBase | null;
};

export type AuthContextValue = {
  /** Best match for current route (header, public pages). Prefer `sessions` when role matters. */
  user: ApiUserBase | AuthRegisterUser | null;
  sessions: SessionsState;
  loading: boolean;
  login: (email: string, password: string, role: Role, opts?: { persist?: boolean }) => Promise<ApiUserBase>;
  logout: () => void;
  setUserFromRegister: (u: any, token: string) => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const emptySessions: SessionsState = { customer: null, restaurant: null };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<SessionsState>(emptySessions);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const user = useMemo(
    () => selectSessionUserForPath(location.pathname, sessions) as AuthContextValue['user'],
    [location.pathname, sessions],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const legacy = readLegacyToken();
      if (legacy) {
        try {
          const me = (await api('/auth/me', { _authToken: legacy })) as ApiUserBase;
          if (!cancelled && me?.role) {
            writeToken(me.role as Role, legacy, legacyTokenWasPersistent());
          }
        } catch {
          // invalid legacy session
        }
        clearLegacyToken();
      }

      const next: SessionsState = { ...emptySessions };
      const roles: Role[] = ['customer', 'restaurant'];
      await Promise.all(
        roles.map(async (role) => {
          const t = readToken(role);
          if (!t) return;
          try {
            const me = (await api('/auth/me', { _authToken: t })) as ApiUserBase;
            if (!cancelled && me?.role && (me.role === 'customer' || me.role === 'restaurant')) {
              next[me.role] = me;
            }
          } catch {
            clearToken(role);
          }
        }),
      );

      if (!cancelled) {
        setSessions(next);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string, role: Role, opts?: { persist?: boolean }) => {
    if (role === 'admin') throw new Error('Sign in via the admin console app (src/admin), not the storefront.');
    const persist = opts?.persist !== false;
    const { token } = await authApi.login({ email, password, role });
    writeToken(role, token, persist);
    const full = (await api('/auth/me', { _authToken: token })) as ApiUserBase;
    setSessions((s) => ({ ...s, [role]: full }));
    return full;
  }, []);

  const logout = useCallback(() => {
    setSessions((s) => {
      const path = typeof window !== 'undefined' ? window.location.pathname : '/';
      const u = selectSessionUserForPath(path, s);
      if (!u?.role) return s;
      const role = u.role as Role;
      clearToken(role);
      return { ...s, [role]: null };
    });
  }, []);

  const setUserFromRegister = useCallback((u: AuthRegisterUser, token: string) => {
    const role = (u?.role ?? 'customer') as Role;
    if (role === 'admin') return;
    writeToken(role, token, true);
    setSessions((prev) => ({ ...prev, [role]: u as ApiUserBase }));
    api('/auth/me', { _authToken: token })
      .then((full) => setSessions((prev) => ({ ...prev, [role]: full as ApiUserBase })))
      .catch(() => {});
  }, []);

  const refreshUser = useCallback(async () => {
    const path = typeof window !== 'undefined' ? window.location.pathname : '/';
    const role = inferRoleToRefreshFromPath(path);
    if (!role) return;
    const token = readToken(role);
    if (!token) return;
    const full = (await api('/auth/me', { _authToken: token })) as ApiUserBase;
    setSessions((s) => ({ ...s, [role]: full }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, sessions, loading, login, logout, setUserFromRegister, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
