import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';

const today = new Date();
const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

const emptyWorkPlanForm = {
  title: `Monatsplan ${today.toLocaleDateString('de-CH', { month: 'long', year: 'numeric' })}`,
  startDate: currentMonthStart,
  endDate: currentMonthEnd,
  approvedHours: '1000',
};

const emptyShiftForm = {
  employeeId: '',
  orderId: '',
  shiftDate: today.toISOString().slice(0, 10),
  startTime: '08:00',
  endTime: '17:00',
  notes: '',
};

export default function PlanningPage() {
  const shiftLeadId = localStorage.getItem('userId');
  const [workPlans, setWorkPlans] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [orders, setOrders] = useState([]);
  const [workPlanForm, setWorkPlanForm] = useState(emptyWorkPlanForm);
  const [shiftForm, setShiftForm] = useState(emptyShiftForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const selectedWorkPlan = useMemo(
    () => workPlans.find(plan => plan.id === selectedId) || workPlans[0] || null,
    [workPlans, selectedId]
  );

  const loadWorkPlans = async () => {
    if (!shiftLeadId) {
      setError('Keine Schichtleiter-ID im Login gefunden. Bitte neu einloggen.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/api/planning/workplans', { params: { shiftLeadId } });
      setWorkPlans(data);
      setSelectedId(current => current ?? data[0]?.id ?? null);
    } catch (err) {
      setError(readError(err, 'Arbeitspläne konnten nicht geladen werden.'));
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data } = await api.get('/api/users', { params: { role: 'EMPLOYEE' } });
      setEmployees(data.filter(employee => employee.active));
    } catch {
      setEmployees([]);
    }
  };


  const loadOrders = async () => {
    if (!shiftLeadId) return;
    try {
      const { data } = await api.get('/api/orders', { params: { shiftLeadId } });
      setOrders(data.filter(order => order.status !== 'DONE'));
    } catch {
      setOrders([]);
    }
  };

  useEffect(() => {
    loadWorkPlans();
    loadEmployees();
    loadOrders();
  }, []);

  const createWorkPlan = async (event) => {
    event.preventDefault();
    if (!shiftLeadId) {
      setError('Keine Schichtleiter-ID im Login gefunden. Bitte neu einloggen.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        title: workPlanForm.title.trim(),
        shiftLeadId: Number(shiftLeadId),
        startDate: workPlanForm.startDate,
        endDate: workPlanForm.endDate,
        approvedHours: Number(workPlanForm.approvedHours || 0),
      };
      const { data } = await api.post('/api/planning/workplans', payload);
      setWorkPlans(previous => [data, ...previous]);
      setSelectedId(data.id);
      setSuccess('Arbeitsplan wurde erstellt.');
    } catch (err) {
      setError(readError(err, 'Arbeitsplan konnte nicht erstellt werden.'));
    } finally {
      setSaving(false);
    }
  };

  const addShift = async (event) => {
    event.preventDefault();
    if (!selectedWorkPlan) return;

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        employeeId: Number(shiftForm.employeeId),
        orderId: shiftForm.orderId ? Number(shiftForm.orderId) : null,
        shiftDate: shiftForm.shiftDate,
        startTime: shiftForm.startTime,
        endTime: shiftForm.endTime,
        notes: shiftForm.notes.trim() || null,
      };
      const { data } = await api.post(`/api/planning/workplans/${selectedWorkPlan.id}/shifts`, payload);
      replaceWorkPlan(data);
      setSelectedId(data.id);
      setShiftForm(previous => ({ ...previous, notes: '' }));
      setSuccess('Schicht wurde hinzugefügt.');
    } catch (err) {
      setError(readError(err, 'Schicht konnte nicht hinzugefügt werden.'));
    } finally {
      setSaving(false);
    }
  };

  const publishWorkPlan = async () => {
    if (!selectedWorkPlan) return;

    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await api.put(`/api/planning/workplans/${selectedWorkPlan.id}/publish`);
      replaceWorkPlan(data);
      setSuccess('Arbeitsplan wurde veröffentlicht. Mitarbeiter sehen die Schichten nun im Mobile-Kalender.');
    } catch (err) {
      setError(readError(err, 'Arbeitsplan konnte nicht veröffentlicht werden.'));
    } finally {
      setSaving(false);
    }
  };

  const replaceWorkPlan = (updated) => {
    setWorkPlans(previous => previous.map(plan => plan.id === updated.id ? updated : plan));
  };

  const isPublished = selectedWorkPlan?.status === 'PUBLISHED';

  return (
    <Layout>
    <div className="sl-page">
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0 }}>Arbeitsplanung</h1>
        <p style={{ color: '#64748b', marginTop: 8 }}>
          Erstelle Arbeitspläne, plane Mitarbeiter ein und veröffentliche fertige Pläne für die Mobile-App.
        </p>
      </header>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 380px) 1fr', gap: 24, alignItems: 'start' }}>
        <aside style={{ display: 'grid', gap: 20 }}>
          <section style={panelStyle}>
            <h2 style={sectionTitle}>Neuen Arbeitsplan erstellen</h2>
            <form onSubmit={createWorkPlan} style={{ display: 'grid', gap: 12 }}>
              <label style={labelStyle}>
                Titel
                <input
                  value={workPlanForm.title}
                  onChange={e => setWorkPlanForm({ ...workPlanForm, title: e.target.value })}
                  style={inputStyle}
                  required
                />
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={labelStyle}>
                  Von
                  <input
                    type="date"
                    value={workPlanForm.startDate}
                    onChange={e => setWorkPlanForm({ ...workPlanForm, startDate: e.target.value })}
                    style={inputStyle}
                    required
                  />
                </label>
                <label style={labelStyle}>
                  Bis
                  <input
                    type="date"
                    value={workPlanForm.endDate}
                    onChange={e => setWorkPlanForm({ ...workPlanForm, endDate: e.target.value })}
                    style={inputStyle}
                    required
                  />
                </label>
              </div>
              <label style={labelStyle}>
                HR-Stundenkontingent
                <input
                  type="number"
                  min="0"
                  step="0.25"
                  value={workPlanForm.approvedHours}
                  onChange={e => setWorkPlanForm({ ...workPlanForm, approvedHours: e.target.value })}
                  style={inputStyle}
                  required
                />
              </label>
              <button type="submit" disabled={saving} style={btnPrimary}>
                Arbeitsplan erstellen
              </button>
            </form>
          </section>

          <section style={panelStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <h2 style={sectionTitle}>Meine Arbeitspläne</h2>
              <button onClick={loadWorkPlans} disabled={loading} style={btnSmall}>Aktualisieren</button>
            </div>
            {loading && <p style={hintStyle}>Lade Arbeitspläne…</p>}
            {!loading && workPlans.length === 0 && <p style={hintStyle}>Noch keine Arbeitspläne vorhanden.</p>}
            <div style={{ display: 'grid', gap: 10 }}>
              {workPlans.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedId(plan.id)}
                  style={{
                    ...planButtonStyle,
                    borderColor: selectedWorkPlan?.id === plan.id ? '#2563eb' : '#e2e8f0',
                    background: selectedWorkPlan?.id === plan.id ? '#eff6ff' : '#fff',
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{plan.title}</span>
                  <span style={{ color: '#64748b', fontSize: 13 }}>{formatDate(plan.startDate)} – {formatDate(plan.endDate)}</span>
                  <span style={{ fontSize: 12, color: plan.status === 'PUBLISHED' ? '#047857' : '#92400e' }}>
                    {plan.status === 'PUBLISHED' ? 'Veröffentlicht' : 'Entwurf'}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <main>
          {!selectedWorkPlan ? (
            <section style={panelStyle}>
              <h2 style={sectionTitle}>Kein Arbeitsplan ausgewählt</h2>
              <p style={hintStyle}>Erstelle links einen Arbeitsplan oder wähle einen bestehenden aus.</p>
            </section>
          ) : (
            <>
              <section style={panelStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div>
                    <h2 style={{ margin: '0 0 6px' }}>{selectedWorkPlan.title}</h2>
                    <p style={{ margin: 0, color: '#64748b' }}>
                      {formatDate(selectedWorkPlan.startDate)} – {formatDate(selectedWorkPlan.endDate)} · Status: <b>{selectedWorkPlan.status}</b>
                    </p>
                  </div>
                  <button
                    onClick={publishWorkPlan}
                    disabled={saving || isPublished || selectedWorkPlan.shifts.length === 0}
                    style={isPublished ? btnDisabled : btnPrimary}
                  >
                    {isPublished ? 'Bereits veröffentlicht' : 'Veröffentlichen'}
                  </button>
                </div>

                <div style={statsGrid}>
                  <Stat label="Freigegeben" value={`${formatHours(selectedWorkPlan.approvedHours)} h`} />
                  <Stat label="Geplant" value={`${formatHours(selectedWorkPlan.plannedHours)} h`} />
                  <Stat label="Rest" value={`${formatHours(selectedWorkPlan.remainingHours)} h`} tone={Number(selectedWorkPlan.remainingHours) < 0 ? 'danger' : 'normal'} />
                  <Stat label="Schichten" value={selectedWorkPlan.shifts.length} />
                </div>

                {selectedWorkPlan.overLimit && (
                  <Alert type="warning">Das HR-Stundenkontingent wurde überschritten. Speichern ist erlaubt, aber der Plan sollte geprüft werden.</Alert>
                )}
                {selectedWorkPlan.underPlanned && !selectedWorkPlan.overLimit && (
                  <Alert type="warning">Es sind weniger als 95% des HR-Stundenkontingents geplant.</Alert>
                )}
              </section>

              {!isPublished && (
                <section style={{ ...panelStyle, marginTop: 20 }}>
                  <h2 style={sectionTitle}>Schicht hinzufügen</h2>
                  <form onSubmit={addShift} style={{ display: 'grid', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                      <label style={labelStyle}>
                        Mitarbeiter
                        {employees.length > 0 ? (
                          <select
                            value={shiftForm.employeeId}
                            onChange={e => setShiftForm({ ...shiftForm, employeeId: e.target.value })}
                            style={inputStyle}
                            required
                          >
                            <option value="">Bitte wählen</option>
                            {employees.map(employee => (
                              <option key={employee.id} value={employee.id}>
                                #{employee.id} {employee.firstName} {employee.lastName}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="number"
                            min="1"
                            placeholder="z.B. 4"
                            value={shiftForm.employeeId}
                            onChange={e => setShiftForm({ ...shiftForm, employeeId: e.target.value })}
                            style={inputStyle}
                            required
                          />
                        )}
                      </label>
                      <label style={labelStyle}>
                        Auftrag optional
                        {orders.length > 0 ? (
                          <select
                            value={shiftForm.orderId}
                            onChange={e => setShiftForm({ ...shiftForm, orderId: e.target.value })}
                            style={inputStyle}
                          >
                            <option value="">Kein Auftrag</option>
                            {orders.map(order => (
                              <option key={order.id} value={order.id}>#{order.id} {order.title}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="number"
                            min="1"
                            value={shiftForm.orderId}
                            onChange={e => setShiftForm({ ...shiftForm, orderId: e.target.value })}
                            style={inputStyle}
                            placeholder="z.B. 1"
                          />
                        )}
                      </label>
                      <label style={labelStyle}>
                        Datum
                        <input
                          type="date"
                          value={shiftForm.shiftDate}
                          onChange={e => setShiftForm({ ...shiftForm, shiftDate: e.target.value })}
                          style={inputStyle}
                          required
                        />
                      </label>
                      <label style={labelStyle}>
                        Start
                        <input
                          type="time"
                          value={shiftForm.startTime}
                          onChange={e => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                          style={inputStyle}
                          required
                        />
                      </label>
                      <label style={labelStyle}>
                        Ende
                        <input
                          type="time"
                          value={shiftForm.endTime}
                          onChange={e => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                          style={inputStyle}
                          required
                        />
                      </label>
                    </div>
                    <label style={labelStyle}>
                      Notiz optional
                      <textarea
                        value={shiftForm.notes}
                        onChange={e => setShiftForm({ ...shiftForm, notes: e.target.value })}
                        style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }}
                        placeholder="z.B. Frühschicht Eingang A"
                      />
                    </label>
                    <button type="submit" disabled={saving} style={btnPrimary}>Schicht hinzufügen</button>
                  </form>
                </section>
              )}

              <section style={{ ...panelStyle, marginTop: 20 }}>
                <h2 style={sectionTitle}>Geplante Schichten</h2>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      {['Datum', 'Zeit', 'Mitarbeiter', 'Auftrag', 'Stunden', 'Notiz'].map(header => (
                        <th key={header} style={th}>{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedWorkPlan.shifts.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ ...td, color: '#64748b', textAlign: 'center' }}>
                          Noch keine Schichten geplant.
                        </td>
                      </tr>
                    )}
                    {selectedWorkPlan.shifts.map(shift => (
                      <tr key={shift.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={td}>{formatDate(shift.shiftDate)}</td>
                        <td style={td}>{shift.startTime?.slice(0, 5)} – {shift.endTime?.slice(0, 5)}</td>
                        <td style={td}>{employeeName(shift.employeeId, employees)}</td>
                        <td style={td}>{orderTitle(shift.orderId, orders)}</td>
                        <td style={td}><b>{formatHours(shift.plannedHours)} h</b></td>
                        <td style={td}>{shift.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
    </Layout>
  );
}

function Alert({ type, children }) {
  const styleByType = {
    error: { borderColor: '#fecaca', background: '#fef2f2', color: '#991b1b' },
    success: { borderColor: '#bbf7d0', background: '#f0fdf4', color: '#166534' },
    warning: { borderColor: '#fde68a', background: '#fffbeb', color: '#92400e' },
  };
  return <div style={{ ...alertStyle, ...styleByType[type] }}>{children}</div>;
}

function Stat({ label, value, tone = 'normal' }) {
  return (
    <div style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 10, background: '#f8fafc' }}>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 22, color: tone === 'danger' ? '#b91c1c' : '#0f172a' }}>{value}</div>
    </div>
  );
}

function readError(err, fallback) {
  const message = err?.response?.data?.message || err?.response?.data?.error;
  return message || fallback;
}

function orderTitle(orderId, orders) {
  if (!orderId) return '—';
  const order = orders.find(item => Number(item.id) === Number(orderId));
  return order ? `#${order.id} ${order.title}` : `#${orderId}`;
}

function employeeName(employeeId, employees) {
  const employee = employees.find(item => Number(item.id) === Number(employeeId));
  return employee ? `#${employee.id} ${employee.firstName} ${employee.lastName}` : `#${employeeId}`;
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(`${value}T00:00:00`).toLocaleDateString('de-CH');
}

function formatHours(value) {
  return Number(value || 0).toFixed(2);
}

const panelStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 22, boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)' };
const sectionTitle = { margin: '0 0 16px', fontSize: 18 };
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 700, color: '#334155' };
const inputStyle = { display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 6, padding: '9px 10px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 14, background: '#fff' };
const btnPrimary = { padding: '9px 14px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 };
const btnSmall = { padding: '6px 10px', background: '#fff', color: '#334155', border: '1px solid #cbd5e1', borderRadius: 8, cursor: 'pointer', fontSize: 13 };
const btnDisabled = { ...btnPrimary, background: '#94a3b8', cursor: 'not-allowed' };
const hintStyle = { color: '#64748b', fontSize: 14, margin: 0 };
const planButtonStyle = { display: 'grid', gap: 4, textAlign: 'left', padding: 12, border: '1px solid #e2e8f0', borderRadius: 10, cursor: 'pointer' };
const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 22 };
const alertStyle = { padding: '10px 12px', border: '1px solid', borderRadius: 8, marginBottom: 14, fontSize: 14 };
const th = { padding: '10px 12px', textAlign: 'left', fontSize: 13, color: '#475569' };
const td = { padding: '11px 12px', fontSize: 14, verticalAlign: 'top' };
