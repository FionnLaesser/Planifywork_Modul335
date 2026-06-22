import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const TYPE_LABEL   = { VACATION: 'Ferien', SICK: 'Krankheit', OTHER: 'Sonstiges' };
const STATUS_LABEL = { PENDING: 'Ausstehend', APPROVED: 'Genehmigt', REJECTED: 'Abgelehnt' };
const STATUS_COLOR = { PENDING: '#ff8c00', APPROVED: 'green', REJECTED: 'red' };

const TYPE_COLOR = {
  VACATION: { bg: '#dbeafe', text: '#1e40af' },
  SICK:     { bg: '#fee2e2', text: '#991b1b' },
  OTHER:    { bg: '#f3f4f6', text: '#4b5563' },
};

const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function emptyForm() {
  return { employeeId: '', type: 'VACATION', startDate: '', endDate: '', reason: '' };
}

function buildCalendarDays(year, month) {
  const firstDay  = new Date(year, month - 1, 1);
  const lastDay   = new Date(year, month, 0);
  const startDow  = (firstDay.getDay() + 6) % 7; // Mon = 0
  const days      = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month - 1, d));
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function toDateStr(date) {
  return date.toISOString().slice(0, 10);
}

function AbsenceCalendarView({ absences, year, month, onYearChange, onMonthChange, onLoad }) {
  const days = buildCalendarDays(year, month);
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const absencesOnDay = (day) => {
    if (!day) return [];
    const ds = toDateStr(day);
    return absences.filter(a => a.startDate <= ds && ds <= a.endDate);
  };

  const prevMonth = () => {
    if (month === 1) { onYearChange(year - 1); onMonthChange(12); }
    else onMonthChange(month - 1);
  };
  const nextMonth = () => {
    if (month === 12) { onYearChange(year + 1); onMonthChange(1); }
    else onMonthChange(month + 1);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={prevMonth} style={btnNav}>&lt;</button>
        <span style={{ fontWeight: 700, fontSize: 16, minWidth: 160, textAlign: 'center' }}>
          {new Date(year, month - 1).toLocaleString('de-CH', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={nextMonth} style={btnNav}>&gt;</button>
        <button onClick={onLoad} style={{ ...btnNav, marginLeft: 8, fontSize: 12, padding: '4px 10px' }}>Aktualisieren</button>
      </div>

      <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap', fontSize: 13 }}>
        {Object.entries(TYPE_LABEL).map(([k, v]) => (
          <span key={k} style={{ background: TYPE_COLOR[k].bg, color: TYPE_COLOR[k].text, padding: '2px 10px', borderRadius: 12, fontWeight: 600 }}>{v}</span>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
          <thead>
            <tr>
              {WEEKDAYS.map(d => (
                <th key={d} style={{ padding: '8px 4px', fontSize: 12, fontWeight: 700, color: '#607080', textAlign: 'center', borderBottom: '2px solid #e0e6ed', width: '14.28%' }}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, wi) => (
              <tr key={wi}>
                {week.map((day, di) => {
                  const entries = absencesOnDay(day);
                  const isToday = day && toDateStr(day) === toDateStr(new Date());
                  return (
                    <td key={di} style={{ verticalAlign: 'top', padding: 4, border: '1px solid #e0e6ed', minHeight: 60, background: day ? '#fff' : '#f9fafb' }}>
                      {day && (
                        <>
                          <div style={{ fontSize: 12, fontWeight: isToday ? 800 : 500, color: isToday ? '#1f7a8c' : '#333', marginBottom: 2 }}>
                            {day.getDate()}
                          </div>
                          {entries.map(a => (
                            <div key={a.id} style={{ fontSize: 11, background: (TYPE_COLOR[a.type] || TYPE_COLOR.OTHER).bg, color: (TYPE_COLOR[a.type] || TYPE_COLOR.OTHER).text, borderRadius: 4, padding: '1px 5px', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              MA {a.employeeId} – {TYPE_LABEL[a.type] || a.type}
                            </div>
                          ))}
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AbsencesPage() {
  const now = new Date();
  const [tab, setTab]                   = useState('pending');
  const [absences, setAbsences]         = useState([]);
  const [typeFilter, setTypeFilter]     = useState('');
  const [empFilter, setEmpFilter]       = useState('');

  const [calAbsences, setCalAbsences]   = useState([]);
  const [calYear, setCalYear]           = useState(now.getFullYear());
  const [calMonth, setCalMonth]         = useState(now.getMonth() + 1);

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
      } else if (tab === 'all') {
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

  const loadCalendar = async () => {
    setError('');
    try {
      const { data } = await api.get('/api/absences');
      setCalAbsences(data);
    } catch {
      setError('Fehler beim Laden des Kalenders');
    }
  };

  useEffect(() => {
    if (tab === 'calendar') loadCalendar();
    else load();
  }, [tab, typeFilter, empFilter]);

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
    <div className="hr-page">
      <Link to="/dashboard" className="back-link">Zurück zum Dashboard</Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Absenzen &amp; Ferien</h2>
        <button onClick={openCreate} style={btnPrimary}>+ Absenz erfassen</button>
      </div>

      {error && <p className="form-error">{error}</p>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '2px solid #e0e0e0' }}>
        {[['pending', 'Ausstehende Anträge'], ['all', 'Alle Absenzen'], ['calendar', 'Kalender']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '8px 18px', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: tab === key ? 'bold' : 'normal',
            borderBottom: tab === key ? '2px solid #1f7a8c' : '2px solid transparent',
            marginBottom: -2, color: tab === key ? '#176171' : '#333', fontSize: 14,
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Calendar tab */}
      {tab === 'calendar' && (
        <AbsenceCalendarView
          absences={calAbsences}
          year={calYear}
          month={calMonth}
          onYearChange={setCalYear}
          onMonthChange={setCalMonth}
          onLoad={loadCalendar}
        />
      )}

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
              style={{ fontSize: 13, color: '#435161', background: '#fff', border: '1px solid #c8d0d9', borderRadius: 6, padding: '5px 10px', cursor: 'pointer' }}>
              Filter zurücksetzen
            </button>
          )}
        </div>
      )}

      {/* Tabelle (nicht im Kalender-Tab) */}
      {tab !== 'calendar' && (
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
      )}

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
              style={{ width: '100%', height: 90, padding: 10, border: '1px solid #c8d0d9', borderRadius: 6, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setRejectTarget(null)}>Abbrechen</button>
              <button onClick={confirmReject}
                style={{ padding: '9px 12px', background: '#8a1f11', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 650 }}>
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
                  style={{ width: '100%', height: 80, padding: 10, border: '1px solid #c8d0d9', borderRadius: 6, fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
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

const inputStyle = { padding: '9px 10px', border: '1px solid #c8d0d9', borderRadius: 6, fontSize: 14, minHeight: 38 };
const btnPrimary = { padding: '9px 12px', background: '#1f7a8c', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 650 };
const btnSmall   = { background: '#fff', border: '1px solid #c8d0d9', borderRadius: 6, padding: '5px 9px', cursor: 'pointer', fontSize: 13 };
const btnNav     = { background: '#fff', border: '1px solid #c8d0d9', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 14, fontWeight: 700 };
const th = { padding: '12px', textAlign: 'left', fontWeight: 700, fontSize: 12 };
const td = { padding: '12px', fontSize: 14 };
const overlay = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.48)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 };
const modal = { background: '#fff', padding: 28, borderRadius: 8, width: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 12px 36px rgba(18, 32, 42, 0.18)' };
