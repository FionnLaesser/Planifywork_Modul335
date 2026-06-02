import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/api/auth/login', { username, password });
      if (data.role !== 'HR') {
        setError('Kein HR-Zugang');
        return;
      }
      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    } catch {
      setError('Login fehlgeschlagen');
    }
  };

  return (
    <div className="login-shell">
      <form className="login-panel" onSubmit={handleLogin}>
        <p className="eyebrow">Planifywork HR</p>
        <h1>HR Login</h1>
        <label>
          Benutzername
          <input placeholder="hr.mueller" value={username}
            onChange={e => setUsername(e.target.value)} />
        </label>
        <label>
          Passwort
          <input type="password" placeholder="Passwort" value={password}
            onChange={e => setPassword(e.target.value)} />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-button" type="submit">Anmelden</button>
      </form>
    </div>
  );
}
