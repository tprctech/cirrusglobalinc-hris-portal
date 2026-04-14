import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  type AuthUser,
  clearStoredToken,
  fetchMe,
  getStoredToken,
  loginApi,
  setStoredToken,
} from '../api/auth';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  token: string;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  token: '',
  login: async () => {},
  logout: () => {},
  hasRole: () => false,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    fetchMe(token)
      .then((u) => setUser(u))
      .catch(() => {
        clearStoredToken();
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await loginApi(email, password);
    setStoredToken(res.token);
    setUser(res.user);
  }

  function logout() {
    clearStoredToken();
    setUser(null);
  }

  function hasRole(...roles: string[]) {
    if (!user) return false;
    return roles.some((r) => r.toLowerCase() === user.portalRole.toLowerCase());
  }

  return (
    <AuthContext.Provider value={{ user, loading, token: getStoredToken() || '', login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}
