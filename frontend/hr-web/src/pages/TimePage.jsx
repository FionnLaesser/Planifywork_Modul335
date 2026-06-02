import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function TimePage() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const todayStr     = today.toISOString().slice(0, 10);

  const [from, setFrom]                   = useState(firstOfMonth);
  const [to, setTo]                       = useState(todayStr);
  const [totalHours, setTotalHours]       = useState([]);
  const [employeeId, setEmployeeId]       = useState('');
  const [month, setMonth]                 = useState(today.getMonth() + 1);
  const [year, setYear]                   = useState(today.getFullYear());
  const [monthEntries, setMonthEntries]   = useState([]);
  const [error, setError]                 = useState('');

  const loadTotal = async () => {
    setError('');
    try {
      const { data } = await api.get('/api/time/total', { params: { from, to } });
      setTotalHours(data);
    } catch {
      setError('Fehler beim Laden der Stundenübersicht');
    }
  };

  const loadMonthly = async () => {
    if (!employeeId) return;
    setError('');
    try {
      const { data } = await api.get(`/api/time/month/${employeeId}`, { params: { month, year } });
      setMonthEntries(data);
    } catch {
      setError('Fehler beim Laden der Monatseinträge');
    }
  };

  useEffect(() => { loadTotal(); }, []);
  useEffect(() => { if (employeeId) loadMonthly(); }, []);

  return (
    <div className="hr-page">
      <Link to="/dashboard" className="back-link">Zurück zum Dashboard</Link>
      <h2 style={{ marginTop: 8 }}>Stundenübersicht</h2>
      {error && <p className="form-error">{error}</p>}

      {/* Gesamtstunden */}
      <section style={{ marginBottom: 48 }}>
        <h3>Gesamtstunden pro Mitarbeiter</h3>
        <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ fontSize: 14 }}>
            Von<br />
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ fontSize: 14 }}>
            Bis<br />
            <input type="date" value={to} onChange={e => setTo(e.target.value)} style={inputStyle} />
          </label>
          <button onClick={loadTotal} style={btnPrimary}>Laden</button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f4f4f4' }}>
              <th style={th}>Mitarbeiter-ID</th>
              <th style={th}>Gesamtstunden</th>
            </tr>
          </thead>
          <tbody>
            {totalHours.length === 0 && (
              <tr><td colSpan={2} style={{ ...td, color: '#888', textAlign: 'center' }}>Keine Einträge im gewählten Zeitraum</td></tr>
            )}
            {totalHours.map(row => (
              <tr key={row.employeeId} style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={td}>{row.employeeId}</td>
                <td style={td}><b>{Number(row.totalHours).toFixed(2)} h</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Monatsdetail */}
      <section>
        <h3>Monatsdetail pro Mitarbeiter</h3>
        <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <label style={{ fontSize: 14 }}>
            Mitarbeiter-ID<br />
            <input
              type="number"
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              placeholder="z.B. 3"
              style={{ ...inputStyle, width: 90 }}
            />
          </label>
          <label style={{ fontSize: 14 }}>
            Monat<br />
            <input type="number" min={1} max={12} value={month}
              onChange={e => setMonth(Number(e.target.value))} style={{ ...inputStyle, width: 70 }} />
          </label>
          <label style={{ fontSize: 14 }}>
            Jahr<br />
            <input type="number" value={year}
              onChange={e => setYear(Number(e.target.value))} style={{ ...inputStyle, width: 85 }} />
          </label>
          <button onClick={loadMonthly} style={btnPrimary}>Laden</button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f4f4f4' }}>
              {['Datum', 'Check-in', 'Check-out', 'Pause (min)', 'Netto-Stunden'].map(h => (
                <th key={h} style={th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthEntries.length === 0 && (
              <tr><td colSpan={5} style={{ ...td, color: '#888', textAlign: 'center' }}>
                {employeeId ? 'Keine Einträge' : 'Mitarbeiter-ID eingeben und Laden klicken'}
              </td></tr>
            )}
            {monthEntries.map(entry => (
              <tr key={entry.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={td}>{entry.entryDate}</td>
                <td style={td}>{entry.checkIn  ? new Date(entry.checkIn).toLocaleTimeString('de-CH',  { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                <td style={td}>{entry.checkOut ? new Date(entry.checkOut).toLocaleTimeString('de-CH', { hour: '2-digit', minute: '2-digit' }) : <span style={{ color: '#ff8c00' }}>Offen</span>}</td>
                <td style={td}>{entry.breakMinutes ?? 0}</td>
                <td style={td}>{entry.totalHours != null ? <b>{Number(entry.totalHours).toFixed(2)} h</b> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

const inputStyle = { padding: '9px 10px', border: '1px solid #c8d0d9', borderRadius: 6, fontSize: 14, minHeight: 38 };
const btnPrimary = { padding: '9px 12px', background: '#1f7a8c', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 650 };
const th = { padding: '12px', textAlign: 'left', fontWeight: 700, fontSize: 12 };
const td = { padding: '12px', fontSize: 14 };
