import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const now = new Date();
const STATUS_LABEL = { DRAFT: 'Entwurf', APPROVED: 'Freigegeben', PAID: 'Bezahlt' };
const STATUS_COLOR = { DRAFT: '#607080', APPROVED: '#1f7a8c', PAID: '#14532d' };

const emptyForm = {
  employeeId: '',
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  hourlyRate: '28',
  bonusAmount: '0',
  deductionAmount: '0',
};

export default function PayrollPage() {
  const [statements, setStatements] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const employeeNameById = useMemo(() => {
    const map = new Map();
    employees.forEach(user => map.set(Number(user.id), `${user.firstName} ${user.lastName}`));
    return map;
  }, [employees]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [payrollRes, employeeRes] = await Promise.all([
        api.get('/api/billing/payroll-statements', { params: statusFilter ? { status: statusFilter } : {} }),
        api.get('/api/users', { params: { role: 'EMPLOYEE' } }),
      ]);
      setStatements(payrollRes.data || []);
      const activeEmployees = (employeeRes.data || []).filter(user => user.active);
      setEmployees(activeEmployees);
      setForm(current => current.employeeId || activeEmployees.length === 0
        ? current
        : { ...current, employeeId: String(activeEmployees[0].id) });
    } catch (err) {
      setError(err.response?.data?.message || 'Lohnauszüge konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        employeeId: Number(form.employeeId),
        year: Number(form.year),
        month: Number(form.month),
        hourlyRate: Number(form.hourlyRate),
        bonusAmount: Number(form.bonusAmount || 0),
        deductionAmount: Number(form.deductionAmount || 0),
        createdBy: Number(localStorage.getItem('userId') || 0) || null,
      };
      await api.post('/api/billing/payroll-statements', payload);
      setSuccess('Lohnauszug wurde erstellt oder neu berechnet.');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Lohnauszug konnte nicht erstellt werden.');
    } finally {
      setSaving(false);
    }
  };

  const approve = async (id) => {
    setError('');
    try {
      await api.put(`/api/billing/payroll-statements/${id}/approve`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Lohnauszug konnte nicht freigegeben werden.');
    }
  };

  const pay = async (id) => {
    setError('');
    try {
      await api.put(`/api/billing/payroll-statements/${id}/pay`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Lohnauszug konnte nicht bezahlt werden.');
    }
  };

  return (
    <div className="hr-page">
      <Link to="/dashboard" className="back-link">Zurück zum Dashboard</Link>
      <h2 style={{ marginTop: 8 }}>Lohnauszüge</h2>
      <p style={{ color: '#607080', marginTop: 0 }}>
        Erstelle monatliche Lohnauszüge aus den erfassten Arbeitsstunden, Stundenrate, Zuschlägen und Abzügen.
      </p>

      {error && <p className="form-error">{error}</p>}
      {success && <p style={{ color: '#166534', fontWeight: 650 }}>{success}</p>}

      <section style={panel}>
        <h3 style={{ marginTop: 0 }}>Lohnauszug erstellen</h3>
        <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(5, 1fr)', gap: 12 }}>
            <label style={label}>
              Mitarbeiter
              <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} style={input} required>
                <option value="">Bitte wählen</option>
                {employees.map(user => (
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
              CHF/h
              <input type="number" min="0" step="0.05" value={form.hourlyRate} onChange={e => setForm({ ...form, hourlyRate: e.target.value })} style={input} required />
            </label>
            <label style={label}>
              Zuschläge
              <input type="number" min="0" step="0.05" value={form.bonusAmount} onChange={e => setForm({ ...form, bonusAmount: e.target.value })} style={input} />
            </label>
            <label style={label}>
              Abzüge
              <input type="number" min="0" step="0.05" value={form.deductionAmount} onChange={e => setForm({ ...form, deductionAmount: e.target.value })} style={input} />
            </label>
          </div>
          <div>
            <button type="submit" disabled={saving || employees.length === 0} style={btnPrimary}>
              {saving ? 'Berechnet…' : 'Lohnauszug erstellen'}
            </button>
          </div>
        </form>
      </section>

      <section style={{ ...panel, marginTop: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Lohnauszüge</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={input}>
              <option value="">Alle Status</option>
              <option value="DRAFT">Entwurf</option>
              <option value="APPROVED">Freigegeben</option>
              <option value="PAID">Bezahlt</option>
            </select>
            <button onClick={load} disabled={loading} style={btnSecondary}>{loading ? 'Lädt…' : 'Aktualisieren'}</button>
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f4f4f4' }}>
              {['Mitarbeiter', 'Monat', 'Stunden', 'CHF/h', 'Brutto', 'Zuschläge', 'Abzüge', 'Netto', 'Status', 'Aktion'].map(h => <th key={h} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {statements.length === 0 && (
              <tr><td colSpan={10} style={{ ...td, color: '#888', textAlign: 'center' }}>Keine Lohnauszüge vorhanden</td></tr>
            )}
            {statements.map(statement => (
              <tr key={statement.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={td}>#{statement.employeeId} {employeeNameById.get(Number(statement.employeeId)) || ''}</td>
                <td style={td}>{String(statement.month).padStart(2, '0')}.{statement.year}</td>
                <td style={td}>{money(statement.totalHours)} h</td>
                <td style={td}>CHF {money(statement.hourlyRate)}</td>
                <td style={td}>CHF {money(statement.grossAmount)}</td>
                <td style={td}>CHF {money(statement.bonusAmount)}</td>
                <td style={td}>CHF {money(statement.deductionAmount)}</td>
                <td style={td}><b>CHF {money(statement.netAmount)}</b></td>
                <td style={td}><span style={{ color: STATUS_COLOR[statement.status], fontWeight: 700 }}>{STATUS_LABEL[statement.status]}</span></td>
                <td style={td}>
                  {statement.status === 'DRAFT' && <button onClick={() => approve(statement.id)} style={btnText}>Freigeben</button>}
                  {statement.status === 'APPROVED' && <button onClick={() => pay(statement.id)} style={btnText}>Bezahlt</button>}
                  {statement.status === 'PAID' && <span style={{ color: '#607080' }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function money(value) { return Number(value || 0).toFixed(2); }

const panel = { background: '#fff', border: '1px solid #e0e6ed', borderRadius: 8, padding: 20, boxShadow: '0 3px 14px rgba(15, 23, 42, 0.04)' };
const label = { display: 'block', fontSize: 14, fontWeight: 650, color: '#334155' };
const input = { display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 6, padding: '9px 10px', border: '1px solid #c8d0d9', borderRadius: 6, fontSize: 14 };
const btnPrimary = { padding: '9px 12px', background: '#1f7a8c', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 650 };
const btnSecondary = { padding: '8px 10px', background: '#fff', color: '#1f2937', border: '1px solid #c8d0d9', borderRadius: 6, cursor: 'pointer', fontSize: 14 };
const btnText = { color: '#176171', border: 'none', background: 'none', cursor: 'pointer', padding: 0, fontWeight: 650 };
const th = { padding: '12px', textAlign: 'left', fontWeight: 700, fontSize: 12 };
const td = { padding: '12px', fontSize: 14, verticalAlign: 'top' };
