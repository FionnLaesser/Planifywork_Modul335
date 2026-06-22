import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const now = new Date();

const emptyForm = {
  shiftLeadId: '',
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  approvedHours: '1000',
  notes: '',
};

export default function HourBudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [shiftLeads, setShiftLeads] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const retried = useRef(false);

  const shiftLeadNameById = useMemo(() => {
    const map = new Map();
    shiftLeads.forEach(user => map.set(Number(user.id), `${user.firstName} ${user.lastName}`));
    return map;
  }, [shiftLeads]);

  const loadData = async (isRetry = false) => {
    setLoading(true);
    if (!isRetry) setError('');

    const [budgetsResult, leadsResult] = await Promise.allSettled([
      api.get('/api/planning/hour-budgets'),
      api.get('/api/users', { params: { role: 'SHIFT_LEAD' } }),
    ]);

    if (budgetsResult.status === 'fulfilled') {
      setBudgets(budgetsResult.value.data || []);
    }

    if (leadsResult.status === 'fulfilled') {
      const activeLeads = (leadsResult.value.data || []).filter(user => user.active);
      setShiftLeads(activeLeads);
      setForm(current => current.shiftLeadId || activeLeads.length === 0
        ? current
        : { ...current, shiftLeadId: String(activeLeads[0].id) });
    }

    const failed = budgetsResult.status === 'rejected' || leadsResult.status === 'rejected';
    if (failed) {
      const msg = budgetsResult.reason?.response?.data?.message
        || leadsResult.reason?.response?.data?.message
        || 'Daten konnten nicht geladen werden.';
      if (!isRetry && !retried.current) {
        retried.current = true;
        setError(msg + ' Erneuter Versuch in 5 Sekunden…');
        setTimeout(() => loadData(true), 5000);
      } else {
        setError(msg + ' Bitte "Aktualisieren" klicken.');
      }
    } else {
      setError('');
      retried.current = false;
    }

    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        shiftLeadId: Number(form.shiftLeadId),
        year: Number(form.year),
        month: Number(form.month),
        approvedHours: Number(form.approvedHours),
        createdBy: Number(localStorage.getItem('userId') || 0) || null,
        notes: form.notes.trim() || null,
      };
      await api.post('/api/planning/hour-budgets', payload);
      setSuccess('Stundenfreigabe wurde gespeichert.');
      setForm(previous => ({ ...previous, notes: '' }));
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Stundenfreigabe konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="hr-page">
      <Link to="/dashboard" className="back-link">Zurück zum Dashboard</Link>
      <h2 style={{ marginTop: 8 }}>HR-Stundenfreigabe</h2>
      <p style={{ color: '#607080', marginTop: 0 }}>
        Lege pro Schichtleiter und Monat fest, wie viele Arbeitsstunden geplant werden dürfen.
      </p>

      {error && <p className="form-error">{error}</p>}
      {success && <p style={{ color: '#166534', fontWeight: 650 }}>{success}</p>}

      <section style={panel}>
        <h3 style={{ marginTop: 0 }}>Kontingent speichern</h3>
        <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12 }}>
            <label style={label}>
              Schichtleiter
              <select value={form.shiftLeadId} onChange={e => setForm({ ...form, shiftLeadId: e.target.value })} style={input} required>
                <option value="">Bitte wählen</option>
                {shiftLeads.map(user => (
                  <option key={user.id} value={user.id}>#{user.id} {user.firstName} {user.lastName}</option>
                ))}
              </select>
            </label>
            <label style={label}>
              Jahr
              <input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} style={input} required />
            </label>
            <label style={label}>
              Monat
              <input type="number" min="1" max="12" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} style={input} required />
            </label>
            <label style={label}>
              Stunden
              <input type="number" min="0" step="0.25" value={form.approvedHours} onChange={e => setForm({ ...form, approvedHours: e.target.value })} style={input} required />
            </label>
          </div>
          <label style={label}>
            Notiz optional
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...input, minHeight: 70 }} placeholder="z.B. Ferienzeit, reduziertes Kontingent" />
          </label>
          <div>
            <button type="submit" disabled={saving || shiftLeads.length === 0} style={btnPrimary}>
              {saving ? 'Speichert…' : 'Stunden freigeben'}
            </button>
          </div>
        </form>
      </section>

      <section style={{ ...panel, marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Bestehende Freigaben</h3>
          <button onClick={() => { retried.current = false; loadData(); }} disabled={loading} style={btnSecondary}>{loading ? 'Lädt…' : 'Aktualisieren'}</button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f4f4f4' }}>
              {['Schichtleiter', 'Monat', 'Freigegebene Stunden', 'Notiz', 'Aktualisiert'].map(h => <th key={h} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {budgets.length === 0 && (
              <tr><td colSpan={5} style={{ ...td, color: '#888', textAlign: 'center' }}>Noch keine Stundenfreigaben vorhanden</td></tr>
            )}
            {budgets.map(budget => (
              <tr key={budget.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={td}>#{budget.shiftLeadId} {shiftLeadNameById.get(Number(budget.shiftLeadId)) || ''}</td>
                <td style={td}>{String(budget.month).padStart(2, '0')}.{budget.year}</td>
                <td style={td}><b>{Number(budget.approvedHours || 0).toFixed(2)} h</b></td>
                <td style={td}>{budget.notes || '—'}</td>
                <td style={td}>{budget.updatedAt ? new Date(budget.updatedAt).toLocaleString('de-CH') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

const panel = { background: '#fff', border: '1px solid #e0e6ed', borderRadius: 8, padding: 20, boxShadow: '0 3px 14px rgba(15, 23, 42, 0.04)' };
const label = { display: 'block', fontSize: 14, fontWeight: 650, color: '#334155' };
const input = { display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 6, padding: '9px 10px', border: '1px solid #c8d0d9', borderRadius: 6, fontSize: 14 };
const btnPrimary = { padding: '9px 12px', background: '#1f7a8c', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 650 };
const btnSecondary = { padding: '8px 10px', background: '#fff', color: '#1f2937', border: '1px solid #c8d0d9', borderRadius: 6, cursor: 'pointer', fontSize: 14 };
const th = { padding: '12px', textAlign: 'left', fontWeight: 700, fontSize: 12 };
const td = { padding: '12px', fontSize: 14, verticalAlign: 'top' };
