import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const TYPE_LABEL   = { VACATION: 'Ferien', SICK: 'Krankheit', OTHER: 'Sonstiges' };
const STATUS_LABEL = { PENDING: 'Ausstehend', APPROVED: 'Genehmigt', REJECTED: 'Abgelehnt' };
const STATUS_COLOR = { PENDING: '#ff8c00', APPROVED: 'green', REJECTED: 'red' };

export default function AbsencesPage() {
  const [tab, setTab]                   = useState('pending');
  const [absences, setAbsences]         = useState([]);
  const [typeFilter, setTypeFilter]     = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError]               = useState('');

  const load = async () => {
    setError('');
    try {
      if (tab === 'pending') {
        const { data } = await api.get('/api/absences/pending');
        setAbsences(data);
      } else {
        const params = typeFilter ? { type: typeFilter } : {};
        const { data } = await api.get('/api/absences', { params });
        setAbsences(data);
      }
    } catch {
      setError('Fehler beim Laden der Absenzen');
    }
  };

  useEffect(() => { load(); }, [tab, typeFilter]);

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
        reviewerId:      null,
        rejectionReason: rejectReason || null,
      });
      setRejectTarget(null);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Fehler beim Ablehnen');
    }
  };

  const deleteAbsence = async (id) => {
    if (!confirm('Absenz wirklich löschen?')) return;
    try {
      await api.delete(`/api/absences/${id}`);
      load();
    } catch {
      setError('Fehler beim Löschen');
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <Link to="/dashboard" style={{ color: '#555', fontSize: 14 }}>← Dashboard</Link>
      <h2 style={{ marginTop: 8 }}>Absenzen & Ferien</h2>
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

      {tab === 'all' && (
        <div style={{ marginBottom: 12 }}>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={inputStyle}>
            <option value="">Alle Typen</option>
            <option value="VACATION">Ferien</option>
            <option value="SICK">Krankheit</option>
            <option value="OTHER">Sonstiges</option>
          </select>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f4f4f4' }}>
            {['Mitarbeiter-ID', 'Typ', 'Von', 'Bis', 'Grund', 'Status', 'Aktionen'].map(h => (
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
              <td style={td}>
                {a.status === 'PENDING' && (
                  <>
                    <button onClick={() => approve(a.id)}
                      style={{ color: 'green', marginRight: 6, border: '1px solid green', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', background: 'none' }}>
                      Genehmigen
                    </button>
                    <button onClick={() => { setRejectTarget(a); setRejectReason(''); }}
                      style={{ color: 'red', marginRight: 6, border: '1px solid red', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', background: 'none' }}>
                      Ablehnen
                    </button>
                  </>
                )}
                <button onClick={() => deleteAbsence(a.id)}
                  style={{ color: '#888', border: '1px solid #ccc', borderRadius: 4, padding: '2px 8px', cursor: 'pointer', background: 'none' }}>
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
    </div>
  );
}

const inputStyle = { padding: '6px 10px', border: '1px solid #ccc', borderRadius: 4, fontSize: 14 };
const th = { padding: '10px 12px', textAlign: 'left', fontWeight: 'bold', fontSize: 14 };
const td = { padding: '10px 12px', fontSize: 14 };
const overlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 };
const modal = { background: '#fff', padding: 32, borderRadius: 8, width: 460, boxShadow: '0 4px 24px rgba(0,0,0,0.18)' };
