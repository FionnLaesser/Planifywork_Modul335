import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DEFAULT_ADMIN_STATE,
  DEFAULT_ROLE_PERMISSIONS,
  PERMISSIONS,
  RESPONSIBILITIES,
} from '../data/adminSeed';
import api from '../services/api';

const STORAGE_KEY = 'planifywork-admin-state-v1';

const NAV_ITEMS = [
  ['overview', 'Übersicht'],
  ['orders', 'Aufträge'],
  ['hr', 'HR'],
  ['concepts', 'Firmenkonzepte'],
  ['salary', 'Lohn und Stunden'],
  ['employees', 'Mitarbeiter'],
  ['roles', 'Rollen'],
  ['reports', 'Berichte'],
  ['search', 'Suche'],
  ['audit', 'Audit-Log'],
];

const ORDER_STATUSES = ['offen', 'geplant', 'aktiv', 'abgeschlossen', 'storniert'];
const ROLES = ['ADMIN', 'HR', 'SHIFT_LEAD', 'EMPLOYEE'];

const ROLE_LABELS = {
  ADMIN: 'Admin',
  HR: 'HR',
  SHIFT_LEAD: 'Schichtleiter',
  EMPLOYEE: 'Mitarbeiter',
};

const emptyOrder = {
  title: '',
  company: '',
  location: '',
  startDate: '',
  endDate: '',
  role: '',
  shiftLead: '',
  status: 'offen',
  conceptId: '',
};

const emptyHr = {
  name: '',
  email: '',
  status: 'aktiv',
  responsibilities: [],
};

const emptyConcept = {
  name: '',
  description: '',
  breakRule: '',
  reportRequired: true,
  timeRuleId: '',
  wageRuleId: '',
  status: 'aktiv',
};

const emptyTimeRule = {
  name: '',
  targetHours: 8,
  breakMinutes: 30,
  overtimeRule: '',
  conceptId: '',
  status: 'aktiv',
};

const emptyWageRule = {
  name: '',
  hourlyRate: 28,
  bonus: 0,
  validFrom: '',
  validTo: '',
  assignment: '',
  status: 'aktiv',
};

const emptyEmployee = {
  name: '',
  email: '',
  personnelNo: '',
  status: 'aktiv',
  mobileAccess: true,
  conceptId: '',
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  const fallback = clone(DEFAULT_ADMIN_STATE);
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved) return fallback;
    return {
      ...fallback,
      ...saved,
      rolePermissions: {
        ...DEFAULT_ROLE_PERMISSIONS,
        ...(saved.rolePermissions || {}),
      },
    };
  } catch {
    return fallback;
  }
}

function makeId(prefix) {
  if (window.crypto?.randomUUID) return `${prefix}-${window.crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function normalize(value) {
  return String(value || '').toLowerCase();
}

function matchesSearch(row, search) {
  if (!search.trim()) return true;
  const text = Object.values(row).join(' ');
  return normalize(text).includes(normalize(search));
}

function statusClass(value) {
  const status = normalize(value);
  if (['aktiv', 'plausibel', 'vollständig', 'abgeschlossen', 'geplant'].includes(status)) return 'ok';
  if (['warnung', 'offen', 'unvollständig'].includes(status)) return 'warn';
  if (['storniert', 'inaktiv', 'deaktiviert'].includes(status)) return 'bad';
  return 'neutral';
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat('de-CH', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function findName(collection, id, fallback = 'Nicht zugewiesen') {
  return collection.find(item => item.id === id)?.name || fallback;
}

function downloadCsv(filename, rows) {
  const csv = rows.map(row => row.map(cell => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(';')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildNotices(state) {
  const notices = [];
  state.timeEntries
    .filter(entry => entry.status !== 'plausibel')
    .forEach(entry => notices.push({
      id: `time-${entry.id}`,
      title: 'Unvollständige Stunden',
      detail: `${findName(state.employees, entry.employeeId)} hat einen auffälligen Stundeneintrag.`,
      target: 'salary',
    }));

  state.reports
    .filter(report => report.status !== 'vollständig' || report.imageCount === 0)
    .forEach(report => notices.push({
      id: `report-${report.id}`,
      title: 'Rapportnachweis fehlt',
      detail: `${findName(state.employees, report.employeeId)} hat einen unvollständigen Rapport.`,
      target: 'reports',
    }));

  state.absences
    .filter(absence => absence.status === 'offen')
    .forEach(absence => notices.push({
      id: `absence-${absence.id}`,
      title: 'Offene Ferienanfrage',
      detail: `${findName(state.employees, absence.employeeId)} wartet auf eine Prüfung.`,
      target: 'reports',
    }));

  return notices.filter(notice => !state.hiddenNoticeIds.includes(notice.id));
}

function Field({ label, children, full = false }) {
  return (
    <div className={`field${full ? ' full' : ''}`}>
      <label>
        {label}
        {children}
      </label>
    </div>
  );
}

function StatusBadge({ value }) {
  return <span className={`status ${statusClass(value)}`}>{value}</span>;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [state, setState] = useState(loadState);
  const [active, setActive] = useState('overview');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState(null);
  const [filters, setFilters] = useState({
    orderStatus: 'alle',
    timePeriod: '',
    auditArea: 'alle',
    reportType: 'Aufträge',
    reportPeriod: '',
    searchType: 'alle',
  });
  const [editing, setEditing] = useState({});
  const [apiUsers, setApiUsers] = useState([]);
  const [orderForm, setOrderForm] = useState(emptyOrder);
  const [hrForm, setHrForm] = useState(emptyHr);
  const [conceptForm, setConceptForm] = useState(emptyConcept);
  const [timeRuleForm, setTimeRuleForm] = useState(emptyTimeRule);
  const [wageRuleForm, setWageRuleForm] = useState(emptyWageRule);
  const [employeeForm, setEmployeeForm] = useState(emptyEmployee);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const fetchApiUsers = async () => {
    try {
      const { data } = await api.get('/api/users');
      setApiUsers(data);
    } catch {
      showMessage('error', 'Benutzer konnten nicht geladen werden.');
    }
  };

  useEffect(() => {
    if (active === 'roles') fetchApiUsers();
  }, [active]);

  const notices = useMemo(() => buildNotices(state), [state]);

  const stats = useMemo(() => ({
    openOrders: state.orders.filter(order => !['abgeschlossen', 'storniert'].includes(order.status)).length,
    activeEmployees: state.employees.filter(employee => employee.status === 'aktiv').length,
    timeWarnings: state.timeEntries.filter(entry => entry.status !== 'plausibel').length,
    openAbsences: state.absences.filter(absence => absence.status === 'offen').length,
  }), [state]);

  const conceptOptions = state.concepts.map(concept => ({ value: concept.id, label: concept.name }));

  const setFilter = (key, value) => setFilters(current => ({ ...current, [key]: value }));

  const commitChange = (updater, audit) => {
    setState(previous => {
      const next = clone(previous);
      updater(next);
      if (audit) {
        next.auditLogs = [{
          id: makeId('audit'),
          time: nowIso(),
          user: 'Admin',
          area: audit.area,
          action: audit.action,
          record: audit.record,
          detail: audit.detail,
        }, ...next.auditLogs].slice(0, 200);
      }
      return next;
    });
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    window.setTimeout(() => setMessage(null), 4500);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const requireValues = (form, labels) => {
    const missing = labels.filter(([key]) => !String(form[key] ?? '').trim());
    if (missing.length) {
      showMessage('error', `Bitte ausfüllen: ${missing.map(([, label]) => label).join(', ')}`);
      return false;
    }
    return true;
  };

  const saveOrder = event => {
    event.preventDefault();
    if (!requireValues(orderForm, [
      ['title', 'Titel'],
      ['company', 'Firma'],
      ['location', 'Einsatzort'],
      ['startDate', 'Startdatum'],
      ['endDate', 'Enddatum'],
      ['role', 'zuständige Rolle'],
    ])) return;
    if (orderForm.startDate > orderForm.endDate) {
      showMessage('error', 'Das Startdatum darf nicht nach dem Enddatum liegen.');
      return;
    }

    const id = editing.orderId || makeId('ord');
    commitChange(next => {
      const payload = { ...orderForm, id, updatedAt: nowIso() };
      const index = next.orders.findIndex(order => order.id === id);
      if (index >= 0) next.orders[index] = payload;
      else next.orders.unshift(payload);
    }, {
      area: 'Aufträge',
      action: editing.orderId ? 'Aktualisiert' : 'Erstellt',
      record: orderForm.title,
      detail: `Status ${orderForm.status}, Schichtleiter ${orderForm.shiftLead || 'nicht zugewiesen'}`,
    });
    setOrderForm(emptyOrder);
    setEditing(current => ({ ...current, orderId: null }));
    showMessage('success', 'Auftrag gespeichert und für berechtigte Rollen sichtbar.');
  };

  const editOrder = order => {
    setOrderForm({ ...emptyOrder, ...order });
    setEditing(current => ({ ...current, orderId: order.id }));
    setActive('orders');
  };

  const updateOrderStatus = (order, status) => {
    commitChange(next => {
      const item = next.orders.find(current => current.id === order.id);
      item.status = status;
      item.updatedAt = nowIso();
    }, {
      area: 'Aufträge',
      action: 'Status geändert',
      record: order.title,
      detail: `Neuer Status: ${status}`,
    });
  };

  const saveHrUser = event => {
    event.preventDefault();
    if (!requireValues(hrForm, [['name', 'Name'], ['email', 'E-Mail']])) return;
    const id = editing.hrId || makeId('hr');
    commitChange(next => {
      const payload = { ...hrForm, id };
      const index = next.hrUsers.findIndex(user => user.id === id);
      if (index >= 0) next.hrUsers[index] = payload;
      else next.hrUsers.unshift(payload);
    }, {
      area: 'HR',
      action: editing.hrId ? 'Aktualisiert' : 'Erstellt',
      record: hrForm.name,
      detail: `Zuständigkeiten: ${hrForm.responsibilities.join(', ') || 'keine'}`,
    });
    setHrForm(emptyHr);
    setEditing(current => ({ ...current, hrId: null }));
    showMessage('success', 'HR-Benutzer gespeichert.');
  };

  const editHrUser = user => {
    setHrForm({ ...emptyHr, ...user });
    setEditing(current => ({ ...current, hrId: user.id }));
  };

  const saveConcept = event => {
    event.preventDefault();
    if (!requireValues(conceptForm, [['name', 'Name'], ['description', 'Beschreibung'], ['breakRule', 'Pausenregel']])) return;
    const id = editing.conceptId || makeId('concept');
    commitChange(next => {
      const payload = { ...conceptForm, id };
      const index = next.concepts.findIndex(concept => concept.id === id);
      if (index >= 0) next.concepts[index] = payload;
      else next.concepts.unshift(payload);
    }, {
      area: 'Firmenkonzepte',
      action: editing.conceptId ? 'Aktualisiert' : 'Erstellt',
      record: conceptForm.name,
      detail: conceptForm.description,
    });
    setConceptForm(emptyConcept);
    setEditing(current => ({ ...current, conceptId: null }));
    showMessage('success', 'Firmenkonzept gespeichert und für Aufträge nutzbar.');
  };

  const editConcept = concept => {
    setConceptForm({ ...emptyConcept, ...concept });
    setEditing(current => ({ ...current, conceptId: concept.id }));
  };

  const saveTimeRule = event => {
    event.preventDefault();
    if (!requireValues(timeRuleForm, [['name', 'Name'], ['overtimeRule', 'Überstundenregel']])) return;
    if (Number(timeRuleForm.targetHours) <= 0 || Number(timeRuleForm.breakMinutes) < 0) {
      showMessage('error', 'Stunden- und Pausenwerte müssen gültig sein.');
      return;
    }
    const id = editing.timeRuleId || makeId('time');
    commitChange(next => {
      const payload = {
        ...timeRuleForm,
        id,
        targetHours: Number(timeRuleForm.targetHours),
        breakMinutes: Number(timeRuleForm.breakMinutes),
      };
      const index = next.timeRules.findIndex(rule => rule.id === id);
      if (index >= 0) next.timeRules[index] = payload;
      else next.timeRules.unshift(payload);
    }, {
      area: 'Lohn und Stunden',
      action: editing.timeRuleId ? 'Stundenregel aktualisiert' : 'Stundenregel erstellt',
      record: timeRuleForm.name,
      detail: `${timeRuleForm.targetHours} Sollstunden`,
    });
    setTimeRuleForm(emptyTimeRule);
    setEditing(current => ({ ...current, timeRuleId: null }));
    showMessage('success', 'Stundenregel gespeichert.');
  };

  const saveWageRule = event => {
    event.preventDefault();
    if (!requireValues(wageRuleForm, [['name', 'Name'], ['validFrom', 'Gültig ab'], ['validTo', 'Gültig bis']])) return;
    if (wageRuleForm.validFrom > wageRuleForm.validTo) {
      showMessage('error', 'Der Gültigkeitszeitraum ist ungültig.');
      return;
    }
    const id = editing.wageRuleId || makeId('wage');
    commitChange(next => {
      const payload = {
        ...wageRuleForm,
        id,
        hourlyRate: Number(wageRuleForm.hourlyRate),
        bonus: Number(wageRuleForm.bonus),
      };
      const index = next.wageRules.findIndex(rule => rule.id === id);
      if (index >= 0) next.wageRules[index] = payload;
      else next.wageRules.unshift(payload);
    }, {
      area: 'Lohn und Stunden',
      action: editing.wageRuleId ? 'Lohnregel aktualisiert' : 'Lohnregel erstellt',
      record: wageRuleForm.name,
      detail: `Ansatz CHF ${wageRuleForm.hourlyRate}`,
    });
    setWageRuleForm(emptyWageRule);
    setEditing(current => ({ ...current, wageRuleId: null }));
    showMessage('success', 'Lohnregel gespeichert.');
  };

  const saveEmployee = event => {
    event.preventDefault();
    if (!requireValues(employeeForm, [['name', 'Name'], ['email', 'E-Mail'], ['personnelNo', 'Personalnummer']])) return;
    const duplicate = state.employees.some(employee =>
      employee.personnelNo === employeeForm.personnelNo && employee.id !== editing.employeeId
    );
    if (duplicate) {
      showMessage('error', 'Diese Personalnummer existiert bereits.');
      return;
    }
    const id = editing.employeeId || makeId('emp');
    commitChange(next => {
      const payload = { ...employeeForm, id };
      if (payload.status !== 'aktiv') payload.mobileAccess = false;
      const index = next.employees.findIndex(employee => employee.id === id);
      if (index >= 0) next.employees[index] = payload;
      else next.employees.unshift(payload);
    }, {
      area: 'Mitarbeiter',
      action: editing.employeeId ? 'Aktualisiert' : 'Erstellt',
      record: employeeForm.name,
      detail: `Mobile Nutzung ${employeeForm.mobileAccess ? 'aktiv' : 'inaktiv'}`,
    });
    setEmployeeForm(emptyEmployee);
    setEditing(current => ({ ...current, employeeId: null }));
    showMessage('success', 'Mitarbeiter gespeichert.');
  };

  const setUserStatus = async (user, newStatus) => {
    const isActive = newStatus === 'aktiv';
    if (!isActive) {
      const activeAdmins = apiUsers.filter(u => u.roleName === 'ADMIN' && u.active);
      if (user.roleName === 'ADMIN' && user.active && activeAdmins.length <= 1) {
        showMessage('error', 'Der letzte aktive Admin darf nicht deaktiviert werden.');
        return;
      }
    }
    try {
      await api.put(`/api/users/${user.id}`, { active: isActive });
      showMessage('success', `Benutzer ${isActive ? 'aktiviert' : 'deaktiviert'}.`);
      fetchApiUsers();
    } catch {
      showMessage('error', 'Status konnte nicht geändert werden.');
    }
  };

  const setUserRole = async (user, role) => {
    const activeAdmins = apiUsers.filter(u => u.roleName === 'ADMIN' && u.active);
    if (user.roleName === 'ADMIN' && role !== 'ADMIN' && activeAdmins.length <= 1) {
      showMessage('error', 'Der letzte aktive Admin darf seine Admin-Rolle nicht verlieren.');
      return;
    }
    try {
      await api.put(`/api/users/${user.id}`, { roleName: role });
      showMessage('success', `Rolle auf ${ROLE_LABELS[role]} geändert.`);
      fetchApiUsers();
    } catch {
      showMessage('error', 'Rolle konnte nicht geändert werden.');
    }
  };

  const togglePermission = (role, permission) => {
    commitChange(next => {
      const current = next.rolePermissions[role] || [];
      next.rolePermissions[role] = current.includes(permission)
        ? current.filter(item => item !== permission)
        : [...current, permission];
    }, {
      area: 'Rollen',
      action: 'Berechtigung geändert',
      record: ROLE_LABELS[role],
      detail: permission,
    });
  };

  const hideNotice = notice => {
    commitChange(next => {
      next.hiddenNoticeIds.push(notice.id);
    }, {
      area: 'Hinweise',
      action: 'Hinweis erledigt',
      record: notice.title,
      detail: notice.detail,
    });
  };

  const filteredOrders = state.orders
    .filter(order => filters.orderStatus === 'alle' || order.status === filters.orderStatus)
    .filter(order => matchesSearch({
      ...order,
      concept: findName(state.concepts, order.conceptId, ''),
    }, search));

  const filteredTimeEntries = state.timeEntries
    .filter(entry => !filters.timePeriod || entry.date.startsWith(filters.timePeriod))
    .filter(entry => matchesSearch({
      ...entry,
      employee: findName(state.employees, entry.employeeId, ''),
      order: state.orders.find(order => order.id === entry.orderId)?.title || '',
    }, search));

  const filteredAudit = state.auditLogs
    .filter(log => filters.auditArea === 'alle' || log.area === filters.auditArea)
    .filter(log => matchesSearch(log, search));

  const searchRows = useMemo(() => {
    const rows = [
      ...state.orders.map(order => ({ type: 'Auftrag', title: order.title, detail: `${order.company}, ${order.status}`, target: 'orders' })),
      ...state.employees.map(employee => ({ type: 'Mitarbeiter', title: employee.name, detail: `${employee.personnelNo}, ${employee.status}`, target: 'employees' })),
      ...state.hrUsers.map(user => ({ type: 'HR', title: user.name, detail: `${user.email}, ${user.status}`, target: 'hr' })),
      ...state.reports.map(report => ({ type: 'Rapport', title: findName(state.employees, report.employeeId), detail: `${findName(state.orders, report.orderId, '')}, ${report.status}`, target: 'reports' })),
    ];
    return rows
      .filter(row => filters.searchType === 'alle' || row.type === filters.searchType)
      .filter(row => matchesSearch(row, search))
      .sort((a, b) => a.type.localeCompare(b.type) || a.title.localeCompare(b.title));
  }, [filters.searchType, search, state]);

  const reportRows = useMemo(() => {
    const orderTitle = id => state.orders.find(order => order.id === id)?.title || 'Unbekannt';
    const rowsByType = {
      Aufträge: state.orders.map(order => ({
        id: order.id,
        name: order.title,
        status: order.status,
        date: order.startDate,
        detail: `${order.company}, ${order.location}`,
        evidence: findName(state.concepts, order.conceptId),
      })),
      Stunden: state.timeEntries.map(entry => ({
        id: entry.id,
        name: findName(state.employees, entry.employeeId),
        status: entry.status,
        date: entry.date,
        detail: `${orderTitle(entry.orderId)}, ${entry.hours} Stunden`,
        evidence: entry.note,
      })),
      Absenzen: state.absences.map(absence => ({
        id: absence.id,
        name: findName(state.employees, absence.employeeId),
        status: absence.status,
        date: absence.startDate,
        detail: `${absence.type}: ${absence.startDate} bis ${absence.endDate}`,
        evidence: 'Freigabe offen',
      })),
      Mitarbeiter: state.employees.map(employee => ({
        id: employee.id,
        name: employee.name,
        status: employee.status,
        date: employee.personnelNo,
        detail: employee.email,
        evidence: employee.mobileAccess ? 'Mobile App aktiv' : 'Mobile App inaktiv',
      })),
      Rapporte: state.reports.map(report => ({
        id: report.id,
        name: findName(state.employees, report.employeeId),
        status: report.status,
        date: report.date,
        detail: `${orderTitle(report.orderId)}: ${report.text || 'Kein Rapporttext vorhanden'}`,
        evidence: report.imageCount > 0 ? `${report.imageCount} Bildnachweise` : 'Keine Bildnachweise',
      })),
    };

    return (rowsByType[filters.reportType] || [])
      .filter(row => !filters.reportPeriod || String(row.date).startsWith(filters.reportPeriod))
      .filter(row => matchesSearch(row, search));
  }, [filters.reportPeriod, filters.reportType, search, state]);

  const exportReport = () => {
    const rows = [
      ['Bereich', 'Name', 'Status', 'Datum'],
      ...state.orders.map(order => ['Auftrag', order.title, order.status, order.startDate]),
      ...state.timeEntries.map(entry => ['Stunden', findName(state.employees, entry.employeeId), entry.status, entry.date]),
      ...state.absences.map(absence => ['Absenz', findName(state.employees, absence.employeeId), absence.status, absence.startDate]),
      ...state.employees.map(employee => ['Mitarbeiter', employee.name, employee.status, employee.personnelNo]),
    ];
    downloadCsv('admin-bericht.csv', rows);
    commitChange(next => next, {
      area: 'Berichte',
      action: 'Export erstellt',
      record: 'admin-bericht.csv',
      detail: 'Berichtsdaten als CSV exportiert',
    });
  };

  const resetDemoData = () => {
    setState(clone(DEFAULT_ADMIN_STATE));
    showMessage('success', 'Admin-Daten wurden zurückgesetzt.');
  };

  return (
    <div className="app-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Planifywork</p>
          <h1>Admin Arbeitsbereich</h1>
          <p>Aufträge, Personen, Regeln und Prüfungen in einer konsistenten Ansicht.</p>
        </div>
        <div className="actions">
          <button className="ghost-button" type="button" onClick={resetDemoData}>Zurücksetzen</button>
          <button className="danger-button" type="button" onClick={logout}>Abmelden</button>
        </div>
      </header>

      <div className="admin-layout">
        <aside className="sidebar">
          {NAV_ITEMS.map(([key, label]) => (
            <button key={key} className={`nav-button${active === key ? ' active' : ''}`} type="button" onClick={() => setActive(key)}>
              <span>{label}</span>
              <span>{key === 'overview' ? stats.openOrders : ''}</span>
            </button>
          ))}
        </aside>

        <main className="content">
          {message && <p className={message.type === 'error' ? 'form-error' : 'form-success'}>{message.text}</p>}
          {active !== 'overview' && (
            <div className="toolbar" style={{ marginBottom: 16 }}>
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Suchen" />
              <button className="ghost-button" type="button" onClick={() => setSearch('')}>Leeren</button>
            </div>
          )}

          {active === 'overview' && (
            <section className="section">
              <div className="section-heading">
                <div>
                  <h2>Übersicht</h2>
                  <p>Aktuelle Kennzahlen und wichtige Hinweise.</p>
                </div>
              </div>
              <div className="metric-grid">
                <button className="metric-card" type="button" onClick={() => setActive('orders')}>
                  <strong>{stats.openOrders}</strong>
                  <span>offene oder aktive Aufträge</span>
                </button>
                <button className="metric-card" type="button" onClick={() => setActive('employees')}>
                  <strong>{stats.activeEmployees}</strong>
                  <span>aktive Mitarbeiter</span>
                </button>
                <button className="metric-card" type="button" onClick={() => setActive('salary')}>
                  <strong>{stats.timeWarnings}</strong>
                  <span>offene Stundenprüfungen</span>
                </button>
                <button className="metric-card" type="button" onClick={() => setActive('reports')}>
                  <strong>{stats.openAbsences}</strong>
                  <span>offene Absenzen oder Ferien</span>
                </button>
              </div>

              <div className="panel">
                <h3>Wichtige Hinweise</h3>
                {notices.length === 0 ? (
                  <div className="empty-state">Keine offenen Hinweise vorhanden.</div>
                ) : (
                  <div className="notice-list">
                    {notices.map(notice => (
                      <div className="notice-card" key={notice.id}>
                        <div>
                          <strong>{notice.title}</strong>
                          <span className="muted">{notice.detail}</span>
                        </div>
                        <div className="actions">
                          <button className="secondary-button" type="button" onClick={() => setActive(notice.target)}>Öffnen</button>
                          <button className="ghost-button" type="button" onClick={() => hideNotice(notice)}>Erledigt</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {active === 'orders' && (
            <section className="section">
              <div className="section-heading">
                <div>
                  <h2>Aufträge verwalten</h2>
                  <p>Erstellen, bearbeiten, zuweisen und Status nachführen.</p>
                </div>
              </div>
              <form className="panel" onSubmit={saveOrder}>
                <h3>{editing.orderId ? 'Auftrag bearbeiten' : 'Auftrag erstellen'}</h3>
                <div className="form-grid">
                  <Field label="Titel"><input value={orderForm.title} onChange={event => setOrderForm({ ...orderForm, title: event.target.value })} /></Field>
                  <Field label="Firma"><input value={orderForm.company} onChange={event => setOrderForm({ ...orderForm, company: event.target.value })} /></Field>
                  <Field label="Einsatzort"><input value={orderForm.location} onChange={event => setOrderForm({ ...orderForm, location: event.target.value })} /></Field>
                  <Field label="Startdatum"><input type="date" value={orderForm.startDate} onChange={event => setOrderForm({ ...orderForm, startDate: event.target.value })} /></Field>
                  <Field label="Enddatum"><input type="date" value={orderForm.endDate} onChange={event => setOrderForm({ ...orderForm, endDate: event.target.value })} /></Field>
                  <Field label="Zuständige Rolle"><input value={orderForm.role} onChange={event => setOrderForm({ ...orderForm, role: event.target.value })} /></Field>
                  <Field label="Schichtleiter"><input value={orderForm.shiftLead} onChange={event => setOrderForm({ ...orderForm, shiftLead: event.target.value })} /></Field>
                  <Field label="Status">
                    <select value={orderForm.status} onChange={event => setOrderForm({ ...orderForm, status: event.target.value })}>
                      {ORDER_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </Field>
                  <Field label="Firmenkonzept">
                    <select value={orderForm.conceptId} onChange={event => setOrderForm({ ...orderForm, conceptId: event.target.value })}>
                      <option value="">Nicht zugewiesen</option>
                      {conceptOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="actions" style={{ marginTop: 14 }}>
                  <button className="primary-button" type="submit">Speichern</button>
                  <button className="ghost-button" type="button" onClick={() => { setOrderForm(emptyOrder); setEditing(current => ({ ...current, orderId: null })); }}>Abbrechen</button>
                </div>
              </form>

              <div className="toolbar">
                <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Aufträge suchen" />
                <select value={filters.orderStatus} onChange={event => setFilter('orderStatus', event.target.value)}>
                  <option value="alle">Alle Status</option>
                  {ORDER_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Titel</th>
                      <th>Firma</th>
                      <th>Zeitraum</th>
                      <th>Status</th>
                      <th>Schichtleiter</th>
                      <th>Konzept</th>
                      <th>Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map(order => (
                      <tr key={order.id}>
                        <td>{order.title}<br /><span className="muted">{order.location}</span></td>
                        <td>{order.company}</td>
                        <td>{order.startDate} bis {order.endDate}</td>
                        <td>
                          <select className="compact-select" value={order.status} onChange={event => updateOrderStatus(order, event.target.value)}>
                            {ORDER_STATUSES.map(status => <option key={status} value={status}>{status}</option>)}
                          </select>
                        </td>
                        <td>{order.shiftLead || 'Nicht zugewiesen'}</td>
                        <td>{findName(state.concepts, order.conceptId)}</td>
                        <td><button className="secondary-button" type="button" onClick={() => editOrder(order)}>Bearbeiten</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {active === 'hr' && (
            <section className="section">
              <div className="section-heading">
                <div>
                  <h2>HR verwalten</h2>
                  <p>HR-Benutzer, Status und Zuständigkeiten.</p>
                </div>
              </div>
              <form className="panel" onSubmit={saveHrUser}>
                <h3>{editing.hrId ? 'HR-Benutzer bearbeiten' : 'HR-Benutzer erstellen'}</h3>
                <div className="form-grid">
                  <Field label="Name"><input value={hrForm.name} onChange={event => setHrForm({ ...hrForm, name: event.target.value })} /></Field>
                  <Field label="E-Mail"><input type="email" value={hrForm.email} onChange={event => setHrForm({ ...hrForm, email: event.target.value })} /></Field>
                  <Field label="Status">
                    <select value={hrForm.status} onChange={event => setHrForm({ ...hrForm, status: event.target.value })}>
                      <option value="aktiv">aktiv</option>
                      <option value="deaktiviert">deaktiviert</option>
                    </select>
                  </Field>
                  <div className="field full">
                    <span className="muted">Zuständigkeiten</span>
                    <div className="check-grid">
                      {RESPONSIBILITIES.map(item => (
                        <label className="check-row" key={item}>
                          <input
                            type="checkbox"
                            checked={hrForm.responsibilities.includes(item)}
                            onChange={event => setHrForm({
                              ...hrForm,
                              responsibilities: event.target.checked
                                ? [...hrForm.responsibilities, item]
                                : hrForm.responsibilities.filter(value => value !== item),
                            })}
                          />
                          {item}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="actions" style={{ marginTop: 14 }}>
                  <button className="primary-button" type="submit">Speichern</button>
                  <button className="ghost-button" type="button" onClick={() => { setHrForm(emptyHr); setEditing(current => ({ ...current, hrId: null })); }}>Abbrechen</button>
                </div>
              </form>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>E-Mail</th>
                      <th>Status</th>
                      <th>Zuständigkeiten</th>
                      <th>Berechtigung Lohn</th>
                      <th>Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.hrUsers.filter(user => matchesSearch(user, search)).map(user => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td><StatusBadge value={user.status} /></td>
                        <td>{user.responsibilities.join(', ') || 'Keine'}</td>
                        <td>{user.responsibilities.includes('Lohnverwaltung') ? <StatusBadge value="erlaubt" /> : <StatusBadge value="verweigert" />}</td>
                        <td><button className="secondary-button" type="button" onClick={() => editHrUser(user)}>Bearbeiten</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {active === 'concepts' && (
            <section className="section">
              <div className="section-heading">
                <div>
                  <h2>Firmenkonzepte verwalten</h2>
                  <p>Betriebliche Regeln für Aufträge, Mitarbeiter und Rapporte.</p>
                </div>
              </div>
              <form className="panel" onSubmit={saveConcept}>
                <h3>{editing.conceptId ? 'Konzept bearbeiten' : 'Konzept erstellen'}</h3>
                <div className="form-grid">
                  <Field label="Name"><input value={conceptForm.name} onChange={event => setConceptForm({ ...conceptForm, name: event.target.value })} /></Field>
                  <Field label="Pausenregel"><input value={conceptForm.breakRule} onChange={event => setConceptForm({ ...conceptForm, breakRule: event.target.value })} /></Field>
                  <Field label="Stundenregel">
                    <select value={conceptForm.timeRuleId} onChange={event => setConceptForm({ ...conceptForm, timeRuleId: event.target.value })}>
                      <option value="">Nicht zugewiesen</option>
                      {state.timeRules.map(rule => <option key={rule.id} value={rule.id}>{rule.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Lohnregel">
                    <select value={conceptForm.wageRuleId} onChange={event => setConceptForm({ ...conceptForm, wageRuleId: event.target.value })}>
                      <option value="">Nicht zugewiesen</option>
                      {state.wageRules.map(rule => <option key={rule.id} value={rule.id}>{rule.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Status">
                    <select value={conceptForm.status} onChange={event => setConceptForm({ ...conceptForm, status: event.target.value })}>
                      <option value="aktiv">aktiv</option>
                      <option value="inaktiv">inaktiv</option>
                    </select>
                  </Field>
                  <Field label="Rapport erforderlich">
                    <select value={conceptForm.reportRequired ? 'ja' : 'nein'} onChange={event => setConceptForm({ ...conceptForm, reportRequired: event.target.value === 'ja' })}>
                      <option value="ja">ja</option>
                      <option value="nein">nein</option>
                    </select>
                  </Field>
                  <Field label="Beschreibung" full><textarea value={conceptForm.description} onChange={event => setConceptForm({ ...conceptForm, description: event.target.value })} /></Field>
                </div>
                <div className="actions" style={{ marginTop: 14 }}>
                  <button className="primary-button" type="submit">Speichern</button>
                  <button className="ghost-button" type="button" onClick={() => { setConceptForm(emptyConcept); setEditing(current => ({ ...current, conceptId: null })); }}>Abbrechen</button>
                </div>
              </form>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Regeln</th>
                      <th>Status</th>
                      <th>Betroffene Bereiche</th>
                      <th>Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.concepts.filter(concept => matchesSearch(concept, search)).map(concept => {
                      const affectedOrders = state.orders.filter(order => order.conceptId === concept.id).length;
                      const affectedEmployees = state.employees.filter(employee => employee.conceptId === concept.id).length;
                      return (
                        <tr key={concept.id}>
                          <td>{concept.name}<br /><span className="muted">{concept.description}</span></td>
                          <td>{concept.breakRule}<br /><span className="muted">{concept.reportRequired ? 'Rapportpflicht' : 'Keine Rapportpflicht'}</span></td>
                          <td><StatusBadge value={concept.status} /></td>
                          <td>{affectedOrders} Aufträge, {affectedEmployees} Mitarbeiter</td>
                          <td><button className="secondary-button" type="button" onClick={() => editConcept(concept)}>Bearbeiten</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {active === 'salary' && (
            <section className="section">
              <div className="section-heading">
                <div>
                  <h2>Lohn und Stunden bestimmen</h2>
                  <p>Regeln definieren und erfasste Stunden prüfen.</p>
                </div>
              </div>
              <div className="split-grid">
                <form className="panel" onSubmit={saveTimeRule}>
                  <h3>Stundenregel</h3>
                  <div className="form-grid">
                    <Field label="Name"><input value={timeRuleForm.name} onChange={event => setTimeRuleForm({ ...timeRuleForm, name: event.target.value })} /></Field>
                    <Field label="Sollstunden"><input type="number" step="0.1" value={timeRuleForm.targetHours} onChange={event => setTimeRuleForm({ ...timeRuleForm, targetHours: event.target.value })} /></Field>
                    <Field label="Pausenminuten"><input type="number" value={timeRuleForm.breakMinutes} onChange={event => setTimeRuleForm({ ...timeRuleForm, breakMinutes: event.target.value })} /></Field>
                    <Field label="Konzept">
                      <select value={timeRuleForm.conceptId} onChange={event => setTimeRuleForm({ ...timeRuleForm, conceptId: event.target.value })}>
                        <option value="">Nicht zugewiesen</option>
                        {conceptOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Überstundenregel" full><textarea value={timeRuleForm.overtimeRule} onChange={event => setTimeRuleForm({ ...timeRuleForm, overtimeRule: event.target.value })} /></Field>
                  </div>
                  <div className="actions" style={{ marginTop: 14 }}>
                    <button className="primary-button" type="submit">Speichern</button>
                  </div>
                </form>
                <form className="panel" onSubmit={saveWageRule}>
                  <h3>Lohnregel</h3>
                  <div className="form-grid">
                    <Field label="Name"><input value={wageRuleForm.name} onChange={event => setWageRuleForm({ ...wageRuleForm, name: event.target.value })} /></Field>
                    <Field label="Stundenansatz"><input type="number" step="0.05" value={wageRuleForm.hourlyRate} onChange={event => setWageRuleForm({ ...wageRuleForm, hourlyRate: event.target.value })} /></Field>
                    <Field label="Zuschlag %"><input type="number" value={wageRuleForm.bonus} onChange={event => setWageRuleForm({ ...wageRuleForm, bonus: event.target.value })} /></Field>
                    <Field label="Zuordnung"><input value={wageRuleForm.assignment} onChange={event => setWageRuleForm({ ...wageRuleForm, assignment: event.target.value })} /></Field>
                    <Field label="Gültig ab"><input type="date" value={wageRuleForm.validFrom} onChange={event => setWageRuleForm({ ...wageRuleForm, validFrom: event.target.value })} /></Field>
                    <Field label="Gültig bis"><input type="date" value={wageRuleForm.validTo} onChange={event => setWageRuleForm({ ...wageRuleForm, validTo: event.target.value })} /></Field>
                  </div>
                  <div className="actions" style={{ marginTop: 14 }}>
                    <button className="primary-button" type="submit">Speichern</button>
                  </div>
                </form>
              </div>
              <div className="split-grid">
                <div className="panel">
                  <h3>Gespeicherte Stundenregeln</h3>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Regel</th>
                          <th>Konzept</th>
                          <th>Aktion</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.timeRules.map(rule => (
                          <tr key={rule.id}>
                            <td>{rule.name}</td>
                            <td>{rule.targetHours}h, {rule.breakMinutes} Min. Pause<br /><span className="muted">{rule.overtimeRule}</span></td>
                            <td>{findName(state.concepts, rule.conceptId)}</td>
                            <td>
                              <button className="secondary-button" type="button" onClick={() => {
                                setTimeRuleForm({ ...emptyTimeRule, ...rule });
                                setEditing(current => ({ ...current, timeRuleId: rule.id }));
                              }}>
                                Bearbeiten
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="panel">
                  <h3>Gespeicherte Lohnregeln</h3>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Ansatz</th>
                          <th>Gültigkeit</th>
                          <th>Aktion</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.wageRules.map(rule => (
                          <tr key={rule.id}>
                            <td>{rule.name}<br /><span className="muted">{rule.assignment}</span></td>
                            <td>CHF {rule.hourlyRate} / h<br /><span className="muted">{rule.bonus}% Zuschlag</span></td>
                            <td>{rule.validFrom} bis {rule.validTo}</td>
                            <td>
                              <button className="secondary-button" type="button" onClick={() => {
                                setWageRuleForm({ ...emptyWageRule, ...rule });
                                setEditing(current => ({ ...current, wageRuleId: rule.id }));
                              }}>
                                Bearbeiten
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="panel">
                <h3>Stundenübersicht</h3>
                <div className="toolbar">
                  <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Stunden suchen" />
                  <input type="month" value={filters.timePeriod} onChange={event => setFilter('timePeriod', event.target.value)} />
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Mitarbeiter</th>
                      <th>Auftrag</th>
                      <th>Datum</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Stunden</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTimeEntries.map(entry => (
                      <tr key={entry.id}>
                        <td>{findName(state.employees, entry.employeeId)}</td>
                        <td>{state.orders.find(order => order.id === entry.orderId)?.title || 'Unbekannt'}</td>
                        <td>{entry.date}</td>
                        <td>{entry.checkIn || '-'}</td>
                        <td>{entry.checkOut || '-'}</td>
                        <td>{entry.hours}</td>
                        <td><StatusBadge value={entry.status} /> <span className="muted">{entry.note}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {active === 'employees' && (
            <section className="section">
              <div className="section-heading">
                <div>
                  <h2>Mitarbeiter verwalten</h2>
                  <p>Erfassen, bearbeiten, mobile Nutzung und Deaktivierung.</p>
                </div>
              </div>
              <form className="panel" onSubmit={saveEmployee}>
                <h3>{editing.employeeId ? 'Mitarbeiter bearbeiten' : 'Mitarbeiter erfassen'}</h3>
                <div className="form-grid">
                  <Field label="Name"><input value={employeeForm.name} onChange={event => setEmployeeForm({ ...employeeForm, name: event.target.value })} /></Field>
                  <Field label="E-Mail"><input type="email" value={employeeForm.email} onChange={event => setEmployeeForm({ ...employeeForm, email: event.target.value })} /></Field>
                  <Field label="Personalnummer"><input value={employeeForm.personnelNo} onChange={event => setEmployeeForm({ ...employeeForm, personnelNo: event.target.value })} /></Field>
                  <Field label="Konzept">
                    <select value={employeeForm.conceptId} onChange={event => setEmployeeForm({ ...employeeForm, conceptId: event.target.value })}>
                      <option value="">Nicht zugewiesen</option>
                      {conceptOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Status">
                    <select value={employeeForm.status} onChange={event => setEmployeeForm({ ...employeeForm, status: event.target.value, mobileAccess: event.target.value === 'aktiv' })}>
                      <option value="aktiv">aktiv</option>
                      <option value="deaktiviert">deaktiviert</option>
                    </select>
                  </Field>
                  <Field label="Mobile App Zugang">
                    <select value={employeeForm.mobileAccess ? 'aktiv' : 'inaktiv'} onChange={event => setEmployeeForm({ ...employeeForm, mobileAccess: event.target.value === 'aktiv' })}>
                      <option value="aktiv">aktiv</option>
                      <option value="inaktiv">inaktiv</option>
                    </select>
                  </Field>
                </div>
                <div className="actions" style={{ marginTop: 14 }}>
                  <button className="primary-button" type="submit">Speichern</button>
                  <button className="ghost-button" type="button" onClick={() => { setEmployeeForm(emptyEmployee); setEditing(current => ({ ...current, employeeId: null })); }}>Abbrechen</button>
                </div>
              </form>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Personalnummer</th>
                      <th>Status</th>
                      <th>Mobile App</th>
                      <th>Konzept</th>
                      <th>Bestehende Daten</th>
                      <th>Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.employees.filter(employee => matchesSearch(employee, search)).map(employee => (
                      <tr key={employee.id}>
                        <td>{employee.name}<br /><span className="muted">{employee.email}</span></td>
                        <td>{employee.personnelNo}</td>
                        <td><StatusBadge value={employee.status} /></td>
                        <td><StatusBadge value={employee.mobileAccess ? 'aktiv' : 'inaktiv'} /></td>
                        <td>{findName(state.concepts, employee.conceptId)}</td>
                        <td>{state.timeEntries.filter(entry => entry.employeeId === employee.id).length} Stunden, {state.reports.filter(report => report.employeeId === employee.id).length} Rapporte</td>
                        <td><button className="secondary-button" type="button" onClick={() => { setEmployeeForm({ ...emptyEmployee, ...employee }); setEditing(current => ({ ...current, employeeId: employee.id })); }}>Bearbeiten</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {active === 'roles' && (
            <section className="section">
              <div className="section-heading">
                <div>
                  <h2>Rollen und Berechtigungen</h2>
                  <p>Rollen zuweisen, Rechte prüfen und Admin-Schutz erzwingen.</p>
                </div>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Benutzer</th>
                      <th>Rolle</th>
                      <th>Status</th>
                      <th>Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiUsers.length === 0 && (
                      <tr><td colSpan={4} style={{ textAlign: 'center', color: '#888', padding: '12px' }}>Keine Benutzer gefunden</td></tr>
                    )}
                    {apiUsers.filter(user => matchesSearch(user, search)).map(user => (
                      <tr key={user.id}>
                        <td>
                          {user.firstName} {user.lastName}<br />
                          <span className="muted">{user.username} · {user.email}</span>
                        </td>
                        <td>
                          <select className="compact-select" value={user.roleName} onChange={event => setUserRole(user, event.target.value)}>
                            {ROLES.map(role => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
                          </select>
                        </td>
                        <td><StatusBadge value={user.active ? 'aktiv' : 'deaktiviert'} /></td>
                        <td>
                          <button className={user.active ? 'danger-button' : 'secondary-button'} type="button" onClick={() => setUserStatus(user, user.active ? 'deaktiviert' : 'aktiv')}>
                            {user.active ? 'Deaktivieren' : 'Aktivieren'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="overview-grid">
                {ROLES.map(role => (
                  <div className="panel" key={role}>
                    <h3>{ROLE_LABELS[role]}</h3>
                    <div className="check-grid">
                      {PERMISSIONS.map(permission => (
                        <label className="check-row" key={permission}>
                          <input
                            type="checkbox"
                            checked={(state.rolePermissions[role] || []).includes(permission)}
                            onChange={() => togglePermission(role, permission)}
                          />
                          {permission}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {active === 'reports' && (
            <section className="section">
              <div className="section-heading">
                <div>
                  <h2>Berichte und Statistiken</h2>
                  <p>Aufträge, Stunden, Absenzen, Mitarbeiter und Rapporte auswerten.</p>
                </div>
                <button className="primary-button" type="button" onClick={exportReport}>CSV exportieren</button>
              </div>
              <div className="toolbar">
                <select value={filters.reportType} onChange={event => setFilter('reportType', event.target.value)}>
                  <option>Aufträge</option>
                  <option>Stunden</option>
                  <option>Absenzen</option>
                  <option>Mitarbeiter</option>
                  <option>Rapporte</option>
                </select>
                <input type="month" value={filters.reportPeriod} onChange={event => setFilter('reportPeriod', event.target.value)} />
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Bereich</th>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Datum / Referenz</th>
                      <th>Detail</th>
                      <th>Nachweis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportRows.map(row => (
                        <tr key={`${filters.reportType}-${row.id}`}>
                          <td>{filters.reportType}</td>
                          <td>{row.name}</td>
                          <td><StatusBadge value={row.status} /></td>
                          <td>{row.date}</td>
                          <td>{row.detail}</td>
                          <td>{row.evidence}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {active === 'search' && (
            <section className="section">
              <div className="section-heading">
                <div>
                  <h2>Suche, Filter und Sortierung</h2>
                  <p>Aufträge, Mitarbeiter, HR-Benutzer und Rapporte rollenübergreifend finden.</p>
                </div>
              </div>
              <div className="toolbar">
                <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Suchbegriff" />
                <select value={filters.searchType} onChange={event => setFilter('searchType', event.target.value)}>
                  <option value="alle">Alle Bereiche</option>
                  <option value="Auftrag">Aufträge</option>
                  <option value="Mitarbeiter">Mitarbeiter</option>
                  <option value="HR">HR</option>
                  <option value="Rapport">Rapporte</option>
                </select>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Bereich</th>
                      <th>Name</th>
                      <th>Detail</th>
                      <th>Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchRows.map(row => (
                      <tr key={`${row.type}-${row.title}-${row.detail}`}>
                        <td>{row.type}</td>
                        <td>{row.title}</td>
                        <td>{row.detail}</td>
                        <td><button className="secondary-button" type="button" onClick={() => setActive(row.target)}>Öffnen</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {active === 'audit' && (
            <section className="section">
              <div className="section-heading">
                <div>
                  <h2>Audit-Log</h2>
                  <p>Wichtige Änderungen an Benutzern, Rollen, Aufträgen, Lohnregeln und Stunden.</p>
                </div>
              </div>
              <div className="toolbar">
                <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Audit-Log suchen" />
                <select value={filters.auditArea} onChange={event => setFilter('auditArea', event.target.value)}>
                  <option value="alle">Alle Bereiche</option>
                  {[...new Set(state.auditLogs.map(log => log.area))].map(area => <option key={area} value={area}>{area}</option>)}
                </select>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Zeitpunkt</th>
                      <th>Benutzer</th>
                      <th>Bereich</th>
                      <th>Aktion</th>
                      <th>Datensatz</th>
                      <th>Änderung</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAudit.map(log => (
                      <tr key={log.id}>
                        <td>{formatDateTime(log.time)}</td>
                        <td>{log.user}</td>
                        <td>{log.area}</td>
                        <td>{log.action}</td>
                        <td>{log.record}</td>
                        <td>{log.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
