import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const navigate = useNavigate();

  const enterAdmin = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', 'ADMIN');
    localStorage.setItem('username', data.username || username);
    if (data.userId != null) localStorage.setItem('userId', String(data.userId));
    navigate('/dashboard');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/api/auth/login', { username, password });
      if (data.role !== 'ADMIN') {
        setError('Kein Admin-Zugang');
        return;
      }
      enterAdmin(data);
    } catch {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('userId');
      setError('Login fehlgeschlagen. Bitte admin / password verwenden und prüfen, ob der API-Gateway läuft.');
    }
  };

  return (
    <div className="login-shell">
      <form className="login-panel" onSubmit={handleLogin}>
        <p className="eyebrow">Planifywork Admin</p>
        <h1>Admin Login</h1>
        <label>
          Benutzername
          <input placeholder="admin" value={username} onChange={e => setUsername(e.target.value)} />
        </label>
        <label>
          Passwort
          <input type="password" placeholder="Passwort" value={password} onChange={e => setPassword(e.target.value)} />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-button" type="submit">Anmelden</button>
      </form>
    </div>
  );
}
