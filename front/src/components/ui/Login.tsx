import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { inputStyle, primaryButtonStyle } from '../../styles/uiStyles';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token, data.user);
        toast.success(`Benvingut, ${data.user.username}`);
      } else {
        toast.error(data.error || 'Error en el login');
      }
    } catch (err) {
      toast.error('No es pot connectar amb el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '10px' }}>
      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        <h2 style={{ textAlign: 'center', margin: '0 0 10px 0', fontSize: '1.2rem' }}>Accés Hidrants</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label htmlFor="username" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Usuari</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ ...inputStyle, padding: '8px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label htmlFor="password" style={{ fontSize: '0.9rem', fontWeight: 600 }}>Contrasenya</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ ...inputStyle, padding: '8px' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            ...primaryButtonStyle,
            marginTop: '10px'
          }}
        >
          {loading ? 'Entrant...' : 'Inicia sessió'}
        </button>
      </form>
    </div>
  );
};
