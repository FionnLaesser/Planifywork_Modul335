import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const STATUS_LABEL = { DRAFT: 'Entwurf', SENT: 'Versendet', PAID: 'Bezahlt' };
const STATUS_COLOR = { DRAFT: '#888', SENT: '#0070f3', PAID: 'green' };

export default function InvoicesPage() {
  const [invoices, setInvoices]       = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm]       = useState(false);
  const [detail, setDetail]           = useState(null);
  const [form, setForm]               = useState(emptyForm());
  const [error, setError]             = useState('');

  function emptyForm() {
    return { orderId: '', createdBy: '', positions: [{ description: '', hours: '', rate: '' }] };
  }

  const load = async () => {
    setError('');
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const { data } = await api.get('/api/billing/invoices', { params });
      setInvoices(data);
    } catch {
      setError('Fehler beim Laden der Rechnungen');
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/api/billing/invoices', {
        orderId:   Number(form.orderId),
        createdBy: Number(form.createdBy),
        positions: form.positions.map(p => ({
          description: p.description,
          hours:       Number(p.hours),
          rate:        Number(p.rate),
        })),
      });
      setShowForm(false);
      setForm(emptyForm());
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Fehler beim Erstellen');
    }
  };

  const updatePosition = (i, field, value) => {
    const positions = [...form.positions];
    positions[i] = { ...positions[i], [field]: value };
    setForm({ ...form, positions });
  };

  const addPosition    = () => setForm({ ...form, positions: [...form.positions, { description: '', hours: '', rate: '' }] });
  const removePosition = (i) => setForm({ ...form, positions: form.positions.filter((_, idx) => idx !== i) });

  const send = async (id) => {
    try { await api.put(`/api/billing/invoices/${id}/send`); load(); }
    catch (err) { setError(err.response?.data?.message || 'Fehler beim Versenden'); }
  };

  const pay = async (id) => {
    try { await api.put(`/api/billing/invoices/${id}/pay`); load(); }
    catch (err) { setError(err.response?.data?.message || 'Fehler beim Bezahlen'); }
  };

  const openDetail = async (inv) => {
    try {
      const { data } = await api.get(`/api/billing/invoices/${inv.id}`);
      setDetail(data);
    } catch {
      setDetail(inv);
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <Link to="/dashboard" style={{ color: '#555', fontSize: 14 }}>← Dashboard</Link>
      <h2 style={{ marginTop: 8 }}>Rechnungen</h2>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inputStyle}>
          <option value="">Alle Status</option>
          <option value="DRAFT">Entwurf</option>
          <option value="SENT">Versendet</option>
          <option value="PAID">Bezahlt</option>
        </select>
        <button onClick={() => { setError(''); setForm(emptyForm()); setShowForm(true); }} style={btnPrimary}>
          + Rechnung erstellen
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f4f4f4' }}>
            {['ID', 'Auftrag-ID', 'Erstellt von', 'Stunden', 'Betrag (CHF)', 'Status', 'Aktionen'].map(h => (
              <th key={h} style={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {invoices.length === 0 && (
            <tr><td colSpan={7} style={{ ...td, color: '#888', textAlign: 'center' }}>Keine Rechnungen</td></tr>
          )}
          {invoices.map(inv => (
            <tr key={inv.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
              <td style={td}>{inv.id}</td>
              <td style={td}>{inv.orderId}</td>
              <td style={td}>{inv.createdBy}</td>
              <td style={td}>{Number(inv.totalHours).toFixed(2)}</td>
              <td style={td}>{Number(inv.amount).toFixed(2)}</td>
              <td style={td}>
                <span style={{ color: STATUS_COLOR[inv.status], fontWeight: 'bold' }}>
                  {STATUS_LABEL[inv.status]}
                </span>
              </td>
              <td style={td}>
                <button onClick={() => openDetail(inv)} style={{ marginRight: 6 }}>Details</button>
                {inv.status === 'DRAFT' && (
                  <button onClick={() => send(inv.id)} style={{ marginRight: 6, color: '#0070f3' }}>Versenden</button>
                )}
                {inv.status === 'SENT' && (
                  <button onClick={() => pay(inv.id)} style={{ color: 'green' }}>Als bezahlt</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Erstellen-Modal */}
      {showForm && (
        <div style={overlay}>
          <div style={{ ...modal, width: 580 }}>
            <h3>Neue Rechnung erstellen</h3>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Auftrag-ID</label>
                  <input type="number" value={form.orderId}
                    onChange={e => setForm({ ...form, orderId: e.target.value })}
                    required style={{ ...inputStyle, width: '100%' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Erstellt von (User-ID)</label>
                  <input type="number" value={form.createdBy}
                    onChange={e => setForm({ ...form, createdBy: e.target.value })}
                    required style={{ ...inputStyle, width: '100%' }} />
                </div>
              </div>

              <h4 style={{ marginBottom: 8 }}>Positionen</h4>
              {form.positions.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <input placeholder="Beschreibung" value={p.description}
                    onChange={e => updatePosition(i, 'description', e.target.value)}
                    required style={{ ...inputStyle, flex: 2 }} />
                  <input type="number" step="0.01" placeholder="Stunden" value={p.hours}
                    onChange={e => updatePosition(i, 'hours', e.target.value)}
                    required style={{ ...inputStyle, flex: 1 }} />
                  <input type="number" step="0.01" placeholder="CHF/h" value={p.rate}
                    onChange={e => updatePosition(i, 'rate', e.target.value)}
                    required style={{ ...inputStyle, flex: 1 }} />
                  {form.positions.length > 1 && (
                    <button type="button" onClick={() => removePosition(i)}
                      style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer', fontSize: 18 }}>×</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addPosition}
                style={{ marginBottom: 16, color: '#0070f3', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
                + Position hinzufügen
              </button>

              {error && <p style={{ color: 'red' }}>{error}</p>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" onClick={() => setShowForm(false)}>Abbrechen</button>
                <button type="submit" style={btnPrimary}>Erstellen</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail-Modal */}
      {detail && (
        <div style={overlay}>
          <div style={{ ...modal, width: 520 }}>
            <h3>Rechnung #{detail.id}</h3>
            <p style={{ fontSize: 14 }}>
              <b>Auftrag:</b> {detail.orderId} &nbsp;|&nbsp;
              <b>Erstellt von:</b> {detail.createdBy} &nbsp;|&nbsp;
              <b>Status:</b> <span style={{ color: STATUS_COLOR[detail.status] }}>{STATUS_LABEL[detail.status]}</span>
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
              <thead>
                <tr style={{ background: '#f4f4f4' }}>
                  {['Beschreibung', 'Stunden', 'CHF/h', 'Subtotal CHF'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(detail.positions || []).map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #e0e0e0' }}>
                    <td style={td}>{p.description}</td>
                    <td style={td}>{Number(p.hours).toFixed(2)}</td>
                    <td style={td}>{Number(p.rate).toFixed(2)}</td>
                    <td style={td}>{Number(p.subtotal).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 'bold', borderTop: '2px solid #ccc' }}>
                  <td style={td}>Total</td>
                  <td style={td}>{Number(detail.totalHours).toFixed(2)} h</td>
                  <td style={td}></td>
                  <td style={td}>CHF {Number(detail.amount).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setDetail(null)}>Schliessen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = { padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14 };
const btnPrimary = { padding: '6px 14px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 };
const th = { padding: '10px 12px', textAlign: 'left', fontWeight: 'bold', fontSize: 14 };
const td = { padding: '10px 12px', fontSize: 14 };
const overlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 };
const modal = { background: '#fff', padding: 32, borderRadius: 8, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 24px rgba(0,0,0,0.18)' };
