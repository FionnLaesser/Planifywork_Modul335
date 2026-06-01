import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const TYPE_LABEL   = { VACATION: 'Ferien', SICK: 'Krankheit', OTHER: 'Sonstiges' };
const STATUS_LABEL = { PENDING: 'Ausstehend', APPROVED: 'Genehmigt', REJECTED: 'Abgelehnt' };
const STATUS_COLOR = { PENDING: '#ff8c00', APPROVED: 'green', REJECTED: 'red' };

function emptyForm() {
  return { employeeId: '', type: 'VACATION', startDate: '', endDate: '', reason: '' };
}

export default function AbsencesPage() {
  const [tab, setTab]                   = useState('pending');
  const [absences, setAbsences]         = useState([]);
  const [typeFilter, setTypeFilter]     = useState('');
  const [empFilter, setEmpFilter]       = useState('');

  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const [showForm, setShowForm]         = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [form, setForm]                 = useState(emptyForm());

  const [error, setError]               = useState('');

  const load = async () => {
    setError('');
    try {
      if (tab === 'pending') {
        const { data } = await api.get('/api/absences/pending');
        setAbsences(data);
      } else {
        const params = {};
        if (typeFilter) params.type = typeFilter;
        if (empFilter)  params.employeeId = Number(empFilter);
        const { data } = await api.get('/api/absences', { params });
        setAbsences(data);
      }
    } catch {
      setError('Fehler beim Laden der Absenzen');
    }
  };

  useEffect(() => { load(); }, [tab, typeFilter, empFilter]);

  /* ── Approve / Reject ─────────────────────────────────────────────────── */
  const approve = async (id) => {
    try {
      await api.put(`/api/absences/${id}/approve`, { reviewerId: null });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Fehler beim Genehmigen');
    }
  };

  const confirmReject = async () => {
    try {
      await api.put(`/api/absences/${rejectTarget.id}/reject`, {
        reviewerId: null,
        rejectionReason: rejectReason || null,
      });
      setRejectTarget(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Fehler beim Ablehnen');
    }
  };

  /* ── Delete ───────────────────────────────────────────────────────────── */
  const deleteAbsence = async (id) => {
    if (!confirm('Absenz wirklich löschen?')) return;
    try {
      await api.delete(`/api/absences/${id}`);
      load();
    } catch {
      setError('Fehler beim Löschen');
    }
  };

  /* ── Create / Edit form ───────────────────────────────────────────────── */
  const openCreate = () => {
    setEditTarget(null);
    setForm(emptyForm());
    setError('');
    setShowForm(true);
  };

  const openEdit = (a) => {
    setEditTarget(a);
    setForm({
      employeeId: String(a.employeeId),
      type:       a.type,
      startDate:  a.startDate,
      endDate:    a.endDate,
      reason:     a.reason || '',
    });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editTarget) {
        await api.put(`/api/absences/${editTarget.id}`, {
          type:      form.type,
          startDate: form.startDate,
          endDate:   form.endDate,
          reason:    form.reason || null,
        });
      } else {
        await api.post('/api/absences', {
          employeeId: Number(form.employeeId),
          type:       form.type,
          startDate:  form.startDate,
          endDate:    form.endDate,
          reason:     form.reason || null,
        });
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Fehler beim Speichern');
    }
  };

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <div style={{ padding: 32 }}>
      <Link to="/dashboard" style={{ color: '#555', fontSize: 14 }}>← Dashboard</Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Absenzen &amp; Ferien</h2>
        <button onClick={openCreate} style={btnPrimary}>+ Absenz erfassen</button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '2px solid #e0e0e0' }}>
        {[['pending', 'Ausstehende Anträge'], ['all', 'Alle Absenzen']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '8px 18px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: tab === key ? 'bold' : 'normal',
            borderBottom: tab === key ? '2px solid #0070f3' : '2px solid transparent',
            marginBottom: -2, color: tab === key ? '#0070f3' : '#333', fontSize: 14,
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Filter (nur Tab "Alle") */}
      {tab === 'all' && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <input
            type="number"
            placeholder="Mitarbeiter-ID"
            value={empFilter}
            onChange={e => setEmpFilter(e.target.value)}
            style={{ ...inputStyle, width: 140 }}
          />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={inputStyle}>
            <option value="">Alle Typen</option>
            <option value="VACATION">Ferien</option>
            <option value="SICK">Krankheit</option>
            <option value="OTHER">Sonstiges</option>
          </select>
          {(empFilter || typeFilter) && (
            <button onClick={() => { setEmpFilter(''); setTypeFilter(''); }}
              style={{ fontSize: 13, color: '#888', background: 'none', border: '1px solid #ccc', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>
              Filter zurücksetzen
            </button>
          )}
        </div>
      )}

      {/* Tabelle */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f4f4f4' }}>
            {['Mitarb.-ID', 'Typ', 'Von', 'Bis', 'Grund', 'Status', 'Aktionen'].map(h => (
              <th key={h} style={th}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {absences.length === 0 && (
            <tr><td colSpan={7} style={{ ...td, color: '#888', textAlign: 'center' }}>Keine Einträge</td></tr>
          )}
          {absences.map(a => (
            <tr key={a.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
              <td style={td}>{a.employeeId}</td>
              <td style={td}>{TYPE_LABEL[a.type] || a.type}</td>
              <td style={td}>{a.startDate}</td>
              <td style={td}>{a.endDate}</td>
              <td style={td}>{a.reason || <span style={{ color: '#aaa' }}>—</span>}</td>
              <td style={td}>
                <span style={{ color: STATUS_COLOR[a.status], fontWeight: 'bold' }}>
                  {STATUS_LABEL[a.status]}
                </span>
              </td>
              <td style={{ ...td, whiteSpace: 'nowrap' }}>
                {a.status === 'PENDING' && (
                  <>
                    <button onClick={() => approve(a.id)}
                      style={{ ...btnSmall, color: 'green', borderColor: 'green', marginRight: 4 }}>
                      Genehmigen
                    </button>
                    <button onClick={() => { setRejectTarget(a); setRejectReason(''); }}
                      style={{ ...btnSmall, color: 'red', borderColor: 'red', marginRight: 4 }}>
                      Ablehnen
                    </button>
                  </>
                )}
                <button onClick={() => openEdit(a)}
                  style={{ ...btnSmall, marginRight: 4 }}>
                  Bearbeiten
                </button>
                <button onClick={() => deleteAbsence(a.id)}
                  style={{ ...btnSmall, color: '#888', borderColor: '#ccc' }}>
                  Löschen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Ablehnen-Modal */}
      {rejectTarget && (
        <div style={overlay}>
          <div style={modal}>
            <h3>Absenz ablehnen</h3>
            <p style={{ fontSize: 14, marginBottom: 16 }}>
              <b>Mitarbeiter {rejectTarget.employeeId}</b> — {TYPE_LABEL[rejectTarget.type]}<br />
              {rejectTarget.startDate} bis {rejectTarget.endDate}
            </p>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Ablehnungsgrund (optional)</label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Begründung eingeben..."
              style={{ width: '100%', height: 90, padding: 8, border: '1px solid #ccc', borderRadius: 4, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setRejectTarget(null)}>Abbrechen</button>
              <button onClick={confirmReject}
                style={{ padding: '6px 14px', background: 'red', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                Ablehnen bestätigen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Erstellen / Bearbeiten Modal */}
      {showForm && (
        <div style={overlay}>
          <div style={modal}>
            <h3>{editTarget ? 'Absenz bearbeiten' : 'Absenz erfassen'}</h3>
            <form onSubmit={handleSubmit}>
              {!editTarget && (
                <Field label="Mitarbeiter-ID" type="number" value={form.employeeId}
                  onChange={v => setForm({ ...form, employeeId: v })} required />
              )}
              {editTarget && (
                <p style={{ fontSize: 14, color: '#555', marginBottom: 12 }}>
                  Mitarbeiter-ID: <b>{editTarget.employeeId}</b>
                </p>
              )}

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Typ</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  style={{ ...inputStyle, width: '100%' }}>
                  <option value="VACATION">Ferien</option>
                  <option value="SICK">Krankheit</option>
                  <option value="OTHER">Sonstiges</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Von</label>
                  <input type="date" value={form.startDate} required
                    onChange={e => setForm({ ...form, startDate: e.target.value })}
                    style={{ ...inputStyle, width: '100%' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Bis</label>
                  <input type="date" value={form.endDate} required
                    min={form.startDate}
                    onChange={e => setForm({ ...form, endDate: e.target.value })}
                    style={{ ...inputStyle, width: '100%' }} />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Begründung (optional)</label>
                <textarea value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  placeholder="z.B. Familienurlaub"
                  style={{ width: '100%', height: 80, padding: 8, border: '1px solid #ccc', borderRadius: 4, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
                />
              </div>

              {error && <p style={{ color: 'red', marginBottom: 8, fontSize: 14 }}>{error}</p>}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
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
      <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        required={required} style={{ ...inputStyle, width: '100%' }} />
    </div>
  );
}

const inputStyle = { padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14 };
const btnPrimary = { padding: '6px 14px', background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 };
const btnSmall   = { background: 'none', border: '1px solid #ccc', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: 13 };
const th = { padding: '10px 12px', textAlign: 'left', fontWeight: 'bold', fontSize: 14 };
const td = { padding: '10px 12px', fontSize: 14 };
const overlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 };
const modal = { background: '#fff', padding: 32, borderRadius: 8, width: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 4px 24px rgba(0,0,0,0.18)' };
