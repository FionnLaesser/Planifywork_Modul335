import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const ROLES = ['ADMIN', 'HR', 'SHIFT_LEAD', 'EMPLOYEE'];

export default function UsersPage() {
  const [users, setUsers]       = useState([]);
  const [role, setRole]         = useState('');
  const [search, setSearch]     = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm]         = useState(emptyForm());
  const [error, setError]       = useState('');

  function emptyForm() {
    return { username: '', email: '', password: '', firstName: '', lastName: '', roleName: 'EMPLOYEE' };
  }

  const load = async () => {
    setError('');
    try {
      const params = {};
      if (role)   params.role   = role;
      if (search) params.search = search;
      const { data } = await api.get('/api/users', { params });
      setUsers(data);
    } catch {
      setError('Fehler beim Laden der Benutzer');
    }
  };

  useEffect(() => { load(); }, [role, search]);

  const openCreate = () => {
    setEditUser(null);
    setForm(emptyForm());
    setError('');
    setShowForm(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({ firstName: user.firstName, lastName: user.lastName, email: user.email, active: user.active });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editUser) {
        await api.put(`/api/users/${editUser.id}`, form);
      } else {
        await api.post('/api/users', form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Fehler beim Speichern');
    }
  };

  const deactivate = async (id) => {
    if (!confirm('Benutzer wirklich deaktivieren?')) return;
    try {
      await api.delete(`/api/users/${id}`);
      load();
    } catch {
      setError('Fehler beim Deaktivieren');
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <Link to="/dashboard" style={{ color: '#555', fontSize: 14 }}>← Dashboard</Link>
      <h2 style={{ marginTop: 8 }}>Benutzerverwaltung</h2>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <select value={role} onChange={e => setRole(e.target.value)} style={inputStyle}>
          <option value="">Alle Rollen</option>
          {ROLES.map(r => <option key={r}>{r}</option>)}
        </select>
        <input
          placeholder="Suche nach Name oder E-Mail"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1 }}
        />
        <button onClick={openCreate} style={btnPrimary}>+ Benutzer erstellen</button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f4f4f4' }}>
            {['Name', 'Benutzername', 'E-Mail', 'Rolle', 'Status', 'Aktionen'].map(h => (
              <th key={h} style={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && (
            <tr><td colSpan={6} style={{ ...td, color: '#888', textAlign: 'center' }}>Keine Benutzer gefunden</td></tr>
          )}
          {users.map(u => (
            <tr key={u.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
              <td style={td}>{u.firstName} {u.lastName}</td>
              <td style={td}>{u.username}</td>
              <td style={td}>{u.email}</td>
              <td style={td}>{u.roleName}</td>
              <td style={td}>
                <span style={{ color: u.active ? 'green' : '#aaa', fontWeight: 'bold' }}>
                  {u.active ? 'Aktiv' : 'Inaktiv'}
                </span>
              </td>
              <td style={td}>
                <button onClick={() => openEdit(u)} style={{ marginRight: 8 }}>Bearbeiten</button>
                {u.active && (
                  <button onClick={() => deactivate(u.id)} style={{ color: 'red' }}>Deaktivieren</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showForm && (
        <div style={overlay}>
          <div style={modal}>
            <h3>{editUser ? 'Benutzer bearbeiten' : 'Neuer Benutzer'}</h3>
            <form onSubmit={handleSubmit}>
              {!editUser && (
                <>
                  <Field label="Benutzername" value={form.username}
                    onChange={v => setForm({ ...form, username: v })} required />
                  <Field label="Passwort" type="password" value={form.password}
                    onChange={v => setForm({ ...form, password: v })} required />
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', marginBottom: 4 }}>Rolle</label>
                    <select value={form.roleName}
                      onChange={e => setForm({ ...form, roleName: e.target.value })}
                      style={{ ...inputStyle, width: '100%' }}>
                      {ROLES.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                </>
              )}
              <Field label="Vorname" value={form.firstName}
                onChange={v => setForm({ ...form, firstName: v })} required />
              <Field label="Nachname" value={form.lastName}
                onChange={v => setForm({ ...form, lastName: v })} required />
              <Field label="E-Mail" type="email" value={form.email}
                onChange={v => setForm({ ...form, email: v })} required />
              {editUser && (
                <div style={{ marginBottom: 12 }}>
                  <label>
                    <input type="checkbox"
                      checked={form.active ?? true}
                      onChange={e => setForm({ ...form, active: e.target.checked })}
                      style={{ marginRight: 8 }}
                    />
                    Aktiv
                  </label>
                </div>
              )}
              {error && <p style={{ color: 'red', marginBottom: 8 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" onClick={() => setShowForm(false)}>Abbrechen</button>
                <button type="submit" style={btnPrimary}>Speichern</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', marginBottom: 4 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        style={{ ...inputStyle, width: '100%' }}
      />
    </div>
  );
}

const inputStyle = { padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14 };
const btnPrimary = { padding: '6px 14px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 };
const th = { padding: '10px 12px', textAlign: 'left', fontWeight: 'bold', fontSize: 14 };
const td = { padding: '10px 12px', fontSize: 14 };
const overlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 };
const modal = { background: '#fff', padding: 32, borderRadius: 8, width: 460, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 24px rgba(0,0,0,0.18)' };
