import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      <form onSubmit={handleSubmit} style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        width: '100%',
        maxSize: '400px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        <h2 style={{ textAlign: 'center', margin: '0 0 10px 0' }}>Accés Hidrants</h2>
        <p style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem' }}>
          Municipi: <strong>{window.location.hostname.split('.')[0]}</strong>
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label htmlFor="username">Usuari</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label htmlFor="password">Contrasenya</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px',
            backgroundColor: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            marginTop: '10px'
          }}
        >
          {loading ? 'Entrant...' : 'Inicia sessió'}
        </button>
      </form>
    </div>
  );
};
