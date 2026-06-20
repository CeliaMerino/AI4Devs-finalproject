import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { devLogin, setOnUnauthorized } from '../api/client';

interface AuthState {
  token: string | null;
  email: string | null;
  login: (email: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem('access_token'),
  );
  const [email, setEmail] = useState<string | null>(() =>
    localStorage.getItem('user_email'),
  );

  const login = useCallback(async (userEmail: string) => {
    const res = await devLogin(userEmail);
    localStorage.setItem('access_token', res.access_token);
    localStorage.setItem('user_email', res.user.email);
    setToken(res.access_token);
    setEmail(res.user.email);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_email');
    setToken(null);
    setEmail(null);
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => {
      logout();
      window.location.assign('/login');
    });
    return () => setOnUnauthorized(null);
  }, [logout]);

  const value = useMemo(
    () => ({
      token,
      email,
      login,
      logout,
      isAuthenticated: !!token,
    }),
    [token, email, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
