// Context d'autenticació: gestor de sessió via cookie httpOnly, exposa user/login/logout.
import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  username: string;
  adf_id: number | null;
  role: string;
  mqtt_enabled: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Verifica la sessió al mount (la cookie auth_token la gestiona el servidor).
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await fetch('/api/auth/me', { credentials: 'same-origin' });
        if (response.ok) { const data = await response.json(); setUser(data.user); }
        else { setUser(null); }
      } catch { setUser(null); }
      finally { setLoading(false); }
    };
    void verifyToken();
  }, []);

  const login = (_newToken: string, newUser: User) => setUser(newUser);
  const logout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) }); }
    catch { /* ignore */ }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token: null, login, logout: () => { void logout(); }, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components -- el hook ha de viure amb el context (patró canònic React)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {throw new Error('useAuth must be used within an AuthProvider');}
  return context;
};