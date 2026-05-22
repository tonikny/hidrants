import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

interface User {
  id: string;
  username: string;
  municipi: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(Cookies.get('auth_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      // Si ja tenim l'usuari (acabem de fer login), no cal verificar
      if (user) {
        setLoading(false);
        return;
      }

      const currentToken = Cookies.get('auth_token');
      
      if (!currentToken) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setToken(currentToken);
        } else {
          // Token invàlid o caducat
          logout();
        }
      } catch (err) {
        console.error('Error verificant token:', err);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    // La cookie ja la planta el servidor amb el domini correcte, 
    // però per si de cas la sincronitzem aquí també si el servidor no ho fes.
    // Cookies.set('auth_token', newToken, { expires: 30 }); 
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Error in logout request:', err);
    }
    setToken(null);
    setUser(null);
    Cookies.remove('auth_token', { path: '/' });
    // Per si s'ha posat amb domini, l'intentem esborrar també
    const host = window.location.hostname;
    if (host.includes('.')) {
      const parts = host.split('.');
      if (parts.length > 2) {
        // .hidrants.cat o .127.0.0.1.nip.io
        let domain = '';
        if (host.endsWith('.nip.io')) {
          if (parts.length >= 6) {
             domain = parts.slice(-6).join('.');
          }
        } else {
           domain = parts.slice(-2).join('.');
        }
        Cookies.remove('auth_token', { path: '/', domain: domain || undefined });
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
