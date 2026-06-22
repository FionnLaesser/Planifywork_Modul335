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

const ORDER_STATUSES = ['offen', 'aktiv', 'abgeschlossen'];
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
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  status: 'aktiv',
  responsibilities: [],
};

const emptyConcept = {
  name: '',
  description: '',
  active: true,
};

const emptyTimeRule = {
  name: '',
  maxDailyHours: 8,
  maxWeeklyHours: 40,
  breakAfterHours: 6,
  breakDurationMinutes: 30,
  active: true,
};

const emptyWageRule = {
  name: '',
  hourlyRate: 28,
  overtimeRate: 42,
  conceptId: '',
  active: true,
};

const emptyEmployee = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
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

const ORDER_STATUS_TO_API = {
  offen: 'OPEN',
  aktiv: 'IN_PROGRESS',
  abgeschlossen: 'DONE',
};

const ORDER_STATUS_FROM_API = {
  OPEN: 'offen',
  IN_PROGRESS: 'aktiv',
  DONE: 'abgeschlossen',
};

function toApiOrderStatus(value) {
  return ORDER_STATUS_TO_API[value] || value || 'OPEN';
}

function toUiOrderStatus(value) {
  return ORDER_STATUS_FROM_API[value] || value || 'offen';
}

function toUiOrder(order) {
  return {
    id: order.id,
    title: order.title || '',
    description: order.description || '',
    company: order.company || '',
    location: order.location || '',
    startDate: order.startDate || '',
    endDate: order.endDate || '',
    role: order.requiredRole || '',
    shiftLead: order.assignedShiftLeadId ? String(order.assignedShiftLeadId) : '',
    status: toUiOrderStatus(order.status),
    conceptId: '',
    employeeIds: order.employeeIds || [],
  };
}

function shiftLeadName(id, users) {
  const user = users.find(item => String(item.id) === String(id));
  return user ? `#${user.id} ${user.firstName} ${user.lastName}` : 'Nicht zugewiesen';
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
  const [apiEmployees, setApiEmployees] = useState([]);
  const [apiHrUsers, setApiHrUsers] = useState([]);
  const [apiOrders, setApiOrders] = useState([]);
  const [apiOrdersLoaded, setApiOrdersLoaded] = useState(false);
  const [apiShiftLeads, setApiShiftLeads] = useState([]);
  const [orderForm, setOrderForm] = useState(emptyOrder);
  const [hrForm, setHrForm] = useState(emptyHr);
  const [conceptForm, setConceptForm] = useState(emptyConcept);
  const [timeRuleForm, setTimeRuleForm] = useState(emptyTimeRule);
  const [wageRuleForm, setWageRuleForm] = useState(emptyWageRule);
  const [employeeForm, setEmployeeForm] = useState(emptyEmployee);
  const [apiConcepts, setApiConcepts] = useState([]);
  const [apiTimeRules, setApiTimeRules] = useState([]);
  const [apiWageRules, setApiWageRules] = useState([]);
  const today = new Date();
  const [timeFrom, setTimeFrom] = useState(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10));
  const [timeTo, setTimeTo] = useState(today.toISOString().slice(0, 10));
  const [apiTimeTotal, setApiTimeTotal] = useState([]);
  const [apiBreakViolations, setApiBreakViolations] = useState([]);

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

  const fetchApiEmployees = async () => {
    try {
      const { data } = await api.get('/api/users?role=EMPLOYEE');
      setApiEmployees(data);
    } catch {
      showMessage('error', 'Mitarbeiter konnten nicht geladen werden.');
    }
  };

  const fetchApiHrUsers = async () => {
    try {
      const { data } = await api.get('/api/users?role=HR');
      setApiHrUsers(data);
    } catch {
      showMessage('error', 'HR-Benutzer konnten nicht geladen werden.');
    }
  };


  const fetchApiShiftLeads = async () => {
    try {
      const { data } = await api.get('/api/users?role=SHIFT_LEAD');
      setApiShiftLeads(data);
    } catch {
      showMessage('error', 'Schichtleiter konnten nicht geladen werden.');
    }
  };

  const fetchApiOrders = async () => {
    try {
      const { data } = await api.get('/api/orders');
      setApiOrders((data || []).map(toUiOrder));
      setApiOrdersLoaded(true);
    } catch {
      setApiOrdersLoaded(false);
      showMessage('error', 'Aufträge konnten nicht geladen werden.');
    }
  };

  const fetchApiConcepts = async () => {
    try {
      const { data } = await api.get('/api/config/concepts');
      setApiConcepts(data);
    } catch {
      showMessage('error', 'Firmenkonzepte konnten nicht geladen werden.');
    }
  };

  const fetchApiTimeRules = async () => {
    try {
      const { data } = await api.get('/api/config/time-rules');
      setApiTimeRules(data);
    } catch {
      showMessage('error', 'Stundenregeln konnten nicht geladen werden.');
    }
  };

  const fetchApiWageRules = async () => {
    try {
      const { data } = await api.get('/api/config/wage-rules');
      setApiWageRules(data);
    } catch {
      showMessage('error', 'Lohnregeln konnten nicht geladen werden.');
    }
  };

  const loadTimeTotal = async (from, to) => {
    try {
      const [totalRes, violationRes] = await Promise.all([
        api.get('/api/time/total', { params: { from, to } }),
        api.get('/api/time/break-violations', { params: { from, to } }),
      ]);
      setApiTimeTotal(totalRes.data || []);
      setApiBreakViolations(violationRes.data || []);
    } catch {
      showMessage('error', 'Stundenübersicht konnte nicht geladen werden.');
    }
  };

  useEffect(() => {
    if (active === 'roles')     fetchApiUsers();
    if (active === 'employees') fetchApiEmployees();
    if (active === 'hr')        fetchApiHrUsers();
    if (active === 'orders')    { fetchApiOrders(); fetchApiShiftLeads(); }
    if (active === 'concepts')  { fetchApiConcepts(); fetchApiTimeRules(); fetchApiWageRules(); }
    if (active === 'salary')    { fetchApiTimeRules(); fetchApiWageRules(); fetchApiConcepts(); loadTimeTotal(timeFrom, timeTo); }
  }, [active]);

  useEffect(() => {
    fetchApiUsers();
    fetchApiEmployees();
    fetchApiOrders();
    fetchApiShiftLeads();
    fetchApiConcepts();
    fetchApiTimeRules();
    fetchApiWageRules();
  }, []);

  const notices = useMemo(() => buildNotices(state), [state]);
  const orders = apiOrdersLoaded ? apiOrders : state.orders;

  const stats = useMemo(() => ({
    openOrders: orders.filter(order => !['abgeschlossen', 'storniert'].includes(order.status)).length,
    activeEmployees: apiEmployees.length > 0
      ? apiEmployees.filter(e => e.active).length
      : state.employees.filter(employee => employee.status === 'aktiv').length,
    timeWarnings: state.timeEntries.filter(entry => entry.status !== 'plausibel').length,
    openAbsences: state.absences.filter(absence => absence.status === 'offen').length,
  }), [state, apiEmployees, orders]);

  const conceptOptions = apiConcepts.map(concept => ({ value: concept.id, label: concept.name }));

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
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
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

  const saveOrder = async event => {
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

    const payload = {
      title: orderForm.title,
      description: orderForm.description || `${orderForm.company} · ${orderForm.location}`,
      company: orderForm.company,
      location: orderForm.location,
      startDate: orderForm.startDate,
      endDate: orderForm.endDate,
      requiredRole: orderForm.role,
      assignedShiftLeadId: orderForm.shiftLead ? Number(orderForm.shiftLead) : null,
      createdBy: Number(localStorage.getItem('userId')) || null,
      status: toApiOrderStatus(orderForm.status),
      employeeIds: orderForm.employeeIds || [],
    };

    try {
      if (editing.orderId) {
        await api.put(`/api/orders/${editing.orderId}`, payload);
      } else {
        await api.post('/api/orders', payload);
      }
      await fetchApiOrders();
      setOrderForm(emptyOrder);
      setEditing(current => ({ ...current, orderId: null }));
      showMessage('success', editing.orderId ? 'Auftrag aktualisiert.' : 'Auftrag erstellt und für den Schichtleiter sichtbar.');
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Fehler beim Speichern des Auftrags.';
      showMessage('error', String(msg));
    }
  };

  const editOrder = order => {
    setOrderForm({ ...emptyOrder, ...order });
    setEditing(current => ({ ...current, orderId: order.id }));
    setActive('orders');
  };

  const updateOrderStatus = async (order, status) => {
    try {
      await api.put(`/api/orders/${order.id}/status`, { status: toApiOrderStatus(status) });
      await fetchApiOrders();
      showMessage('success', `Auftragsstatus auf ${status} geändert.`);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Status konnte nicht geändert werden.';
      showMessage('error', String(msg));
    }
  };

  const saveHrUser = async event => {
    event.preventDefault();
    const requiredFields = editing.hrId
      ? [['firstName', 'Vorname'], ['lastName', 'Nachname'], ['email', 'E-Mail']]
      : [['firstName', 'Vorname'], ['lastName', 'Nachname'], ['username', 'Benutzername'], ['email', 'E-Mail'], ['password', 'Passwort']];
    if (!requireValues(hrForm, requiredFields)) return;
    try {
      if (editing.hrId) {
        await api.put(`/api/users/${editing.hrId}`, {
          firstName: hrForm.firstName,
          lastName: hrForm.lastName,
          email: hrForm.email,
          active: hrForm.status === 'aktiv',
        });
        showMessage('success', 'HR-Benutzer aktualisiert.');
      } else {
        await api.post('/api/users', {
          firstName: hrForm.firstName,
          lastName: hrForm.lastName,
          username: hrForm.username,
          email: hrForm.email,
          password: hrForm.password,
          roleName: 'HR',
          active: true,
        });
        showMessage('success', 'HR-Benutzer angelegt.');
      }
      setHrForm(emptyHr);
      setEditing(current => ({ ...current, hrId: null }));
      fetchApiHrUsers();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Fehler beim Speichern des HR-Benutzers.';
      showMessage('error', String(msg));
    }
  };

  const editHrUser = user => {
    setHrForm({ ...emptyHr, ...user, status: user.active ? 'aktiv' : 'deaktiviert' });
    setEditing(current => ({ ...current, hrId: user.id }));
    setActive('hr');
  };

  const saveConcept = async event => {
    event.preventDefault();
    if (!requireValues(conceptForm, [['name', 'Name']])) return;
    const payload = {
      name: conceptForm.name,
      description: conceptForm.description,
      active: conceptForm.active,
    };
    try {
      if (editing.conceptId) {
        await api.put(`/api/config/concepts/${editing.conceptId}`, payload);
        showMessage('success', 'Firmenkonzept aktualisiert.');
      } else {
        await api.post('/api/config/concepts', payload);
        showMessage('success', 'Firmenkonzept erstellt und für Aufträge nutzbar.');
      }
      setConceptForm(emptyConcept);
      setEditing(current => ({ ...current, conceptId: null }));
      await fetchApiConcepts();
    } catch (err) {
      const msg = err.response?.data?.error || 'Fehler beim Speichern des Konzepts.';
      showMessage('error', String(msg));
    }
  };

  const editConcept = concept => {
    setConceptForm({ name: concept.name, description: concept.description || '', active: concept.active });
    setEditing(current => ({ ...current, conceptId: concept.id }));
  };

  const saveTimeRule = async event => {
    event.preventDefault();
    if (!requireValues(timeRuleForm, [['name', 'Name']])) return;
    const payload = {
      name: timeRuleForm.name,
      maxDailyHours: Number(timeRuleForm.maxDailyHours) || null,
      maxWeeklyHours: Number(timeRuleForm.maxWeeklyHours) || null,
      breakAfterHours: Number(timeRuleForm.breakAfterHours) || null,
      breakDurationMinutes: Number(timeRuleForm.breakDurationMinutes) || null,
      active: timeRuleForm.active,
    };
    try {
      if (editing.timeRuleId) {
        await api.put(`/api/config/time-rules/${editing.timeRuleId}`, payload);
        showMessage('success', 'Stundenregel aktualisiert.');
      } else {
        await api.post('/api/config/time-rules', payload);
        showMessage('success', 'Stundenregel gespeichert.');
      }
      setTimeRuleForm(emptyTimeRule);
      setEditing(current => ({ ...current, timeRuleId: null }));
      await fetchApiTimeRules();
    } catch (err) {
      const msg = err.response?.data?.error || 'Fehler beim Speichern der Stundenregel.';
      showMessage('error', String(msg));
    }
  };

  const saveWageRule = async event => {
    event.preventDefault();
    if (!requireValues(wageRuleForm, [['name', 'Name'], ['hourlyRate', 'Stundenansatz']])) return;
    const payload = {
      name: wageRuleForm.name,
      hourlyRate: Number(wageRuleForm.hourlyRate),
      overtimeRate: Number(wageRuleForm.overtimeRate) || null,
      conceptId: wageRuleForm.conceptId ? Number(wageRuleForm.conceptId) : null,
      active: wageRuleForm.active,
    };
    try {
      if (editing.wageRuleId) {
        await api.put(`/api/config/wage-rules/${editing.wageRuleId}`, payload);
        showMessage('success', 'Lohnregel aktualisiert.');
      } else {
        await api.post('/api/config/wage-rules', payload);
        showMessage('success', 'Lohnregel gespeichert.');
      }
      setWageRuleForm(emptyWageRule);
      setEditing(current => ({ ...current, wageRuleId: null }));
      await fetchApiWageRules();
    } catch (err) {
      const msg = err.response?.data?.error || 'Fehler beim Speichern der Lohnregel.';
      showMessage('error', String(msg));
    }
  };

  const saveEmployee = async event => {
    event.preventDefault();
    const requiredFields = editing.employeeId
      ? [['firstName', 'Vorname'], ['lastName', 'Nachname'], ['email', 'E-Mail']]
      : [['firstName', 'Vorname'], ['lastName', 'Nachname'], ['username', 'Benutzername'], ['email', 'E-Mail'], ['password', 'Passwort']];
    if (!requireValues(employeeForm, requiredFields)) return;
    try {
      if (editing.employeeId) {
        await api.put(`/api/users/${editing.employeeId}`, {
          firstName: employeeForm.firstName,
          lastName: employeeForm.lastName,
          email: employeeForm.email,
          active: employeeForm.status === 'aktiv',
        });
        showMessage('success', 'Mitarbeiter aktualisiert.');
      } else {
        await api.post('/api/users', {
          firstName: employeeForm.firstName,
          lastName: employeeForm.lastName,
          username: employeeForm.username,
          email: employeeForm.email,
          password: employeeForm.password,
          roleName: 'EMPLOYEE',
          active: true,
        });
        showMessage('success', 'Mitarbeiter angelegt.');
      }
      setEmployeeForm(emptyEmployee);
      setEditing(current => ({ ...current, employeeId: null }));
      fetchApiEmployees();
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data || 'Fehler beim Speichern des Mitarbeiters.';
      showMessage('error', String(msg));
    }
  };

  const editEmployee = employee => {
    setEmployeeForm({ ...emptyEmployee, ...employee, status: employee.active ? 'aktiv' : 'deaktiviert' });
    setEditing(current => ({ ...current, employeeId: employee.id }));
    setActive('employees');
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
      if (user.roleName === 'HR') fetchApiHrUsers();
      if (user.roleName === 'EMPLOYEE') fetchApiEmployees();
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

  const filteredOrders = orders
    .filter(order => filters.orderStatus === 'alle' || order.status === filters.orderStatus)
    .filter(order => matchesSearch({
      ...order,
      concept: findName(apiConcepts, order.conceptId, ''),
    }, search));

  const filteredAudit = state.auditLogs
    .filter(log => filters.auditArea === 'alle' || log.area === filters.auditArea)
    .filter(log => matchesSearch(log, search));

  const searchRows = useMemo(() => {
    const rows = [
      ...orders.map(order => ({ type: 'Auftrag', title: order.title, detail: `${order.company}, ${order.status}`, target: 'orders' })),
      ...apiEmployees.map(e => ({ type: 'Mitarbeiter', title: `${e.firstName} ${e.lastName}`, detail: `${e.username}, ${e.active ? 'aktiv' : 'deaktiviert'}`, target: 'employees' })),
      ...apiHrUsers.map(user => ({ type: 'HR', title: `${user.firstName} ${user.lastName}`, detail: `${user.email}, ${user.active ? 'aktiv' : 'deaktiviert'}`, target: 'hr' })),
      ...state.reports.map(report => ({ type: 'Rapport', title: findName(state.employees, report.employeeId), detail: `${orders.find(order => String(order.id) === String(report.orderId))?.title || ''}, ${report.status}`, target: 'reports' })),
    ];
    return rows
      .filter(row => filters.searchType === 'alle' || row.type === filters.searchType)
      .filter(row => matchesSearch(row, search))
      .sort((a, b) => a.type.localeCompare(b.type) || a.title.localeCompare(b.title));
  }, [filters.searchType, search, state, apiEmployees, apiHrUsers, orders]);

  const reportRows = useMemo(() => {
    const orderTitle = id => orders.find(order => String(order.id) === String(id))?.title || 'Unbekannt';
    const rowsByType = {
      Aufträge: orders.map(order => ({
        id: order.id,
        name: order.title,
        status: order.status,
        date: order.startDate,
        detail: `${order.company}, ${order.location}`,
        evidence: findName(apiConcepts, order.conceptId),
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
  }, [filters.reportPeriod, filters.reportType, search, state, orders]);

  const exportReport = () => {
    const rows = [
      ['Bereich', 'Name', 'Status', 'Datum'],
      ...orders.map(order => ['Auftrag', order.title, order.status, order.startDate]),
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
                  <Field label="Schichtleiter">
                    <select value={orderForm.shiftLead} onChange={event => setOrderForm({ ...orderForm, shiftLead: event.target.value })}>
                      <option value="">Nicht zugewiesen</option>
                      {apiShiftLeads.map(user => (
                        <option key={user.id} value={user.id}>#{user.id} {user.firstName} {user.lastName}</option>
                      ))}
                    </select>
                  </Field>
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
                    {filteredOrders.length === 0 && (
                      <tr>
                        <td colSpan={7} className="muted" style={{ textAlign: 'center', padding: 18 }}>
                          {apiOrdersLoaded ? 'Keine Aufträge im Order Service gefunden.' : 'Keine lokalen Aufträge gefunden.'}
                        </td>
                      </tr>
                    )}
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
                        <td>{shiftLeadName(order.shiftLead, apiShiftLeads)}</td>
                        <td>{findName(apiConcepts, order.conceptId)}</td>
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
                  <Field label="Vorname"><input value={hrForm.firstName} onChange={event => setHrForm({ ...hrForm, firstName: event.target.value })} /></Field>
                  <Field label="Nachname"><input value={hrForm.lastName} onChange={event => setHrForm({ ...hrForm, lastName: event.target.value })} /></Field>
                  {!editing.hrId && <Field label="Benutzername"><input value={hrForm.username} onChange={event => setHrForm({ ...hrForm, username: event.target.value })} /></Field>}
                  <Field label="E-Mail"><input type="email" value={hrForm.email} onChange={event => setHrForm({ ...hrForm, email: event.target.value })} /></Field>
                  {!editing.hrId && <Field label="Passwort"><input type="password" value={hrForm.password} onChange={event => setHrForm({ ...hrForm, password: event.target.value })} /></Field>}
                  <Field label="Status">
                    <select value={hrForm.status} onChange={event => setHrForm({ ...hrForm, status: event.target.value })}>
                      <option value="aktiv">aktiv</option>
                      <option value="deaktiviert">deaktiviert</option>
                    </select>
                  </Field>
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
                      <th>Benutzername</th>
                      <th>E-Mail</th>
                      <th>Status</th>
                      <th>Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiHrUsers.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888', padding: '12px' }}>Keine HR-Benutzer gefunden</td></tr>
                    )}
                    {apiHrUsers.filter(user => matchesSearch(user, search)).map(user => (
                      <tr key={user.id}>
                        <td>{user.firstName} {user.lastName}</td>
                        <td><span className="muted">{user.username}</span></td>
                        <td>{user.email}</td>
                        <td><StatusBadge value={user.active ? 'aktiv' : 'deaktiviert'} /></td>
                        <td>
                          <button className="secondary-button" type="button" onClick={() => editHrUser(user)}>Bearbeiten</button>
                          <button
                            className={user.active ? 'danger-button' : 'secondary-button'}
                            type="button"
                            style={{ marginLeft: 8 }}
                            onClick={() => setUserStatus(user, user.active ? 'deaktiviert' : 'aktiv')}
                          >
                            {user.active ? 'Deaktivieren' : 'Aktivieren'}
                          </button>
                        </td>
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
                  <p>Betriebliche Konzepte für Aufträge und Mitarbeiter – gespeichert im Config Service.</p>
                </div>
              </div>
              <form className="panel" onSubmit={saveConcept}>
                <h3>{editing.conceptId ? 'Konzept bearbeiten' : 'Konzept erstellen'}</h3>
                <div className="form-grid">
                  <Field label="Name"><input value={conceptForm.name} onChange={event => setConceptForm({ ...conceptForm, name: event.target.value })} /></Field>
                  <Field label="Status">
                    <select value={conceptForm.active ? 'aktiv' : 'inaktiv'} onChange={event => setConceptForm({ ...conceptForm, active: event.target.value === 'aktiv' })}>
                      <option value="aktiv">aktiv</option>
                      <option value="inaktiv">inaktiv</option>
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
                      <th>Beschreibung</th>
                      <th>Status</th>
                      <th>Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiConcepts.length === 0 && (
                      <tr><td colSpan={4} style={{ textAlign: 'center', color: '#888', padding: 18 }}>Keine Firmenkonzepte vorhanden</td></tr>
                    )}
                    {apiConcepts.filter(concept => matchesSearch(concept, search)).map(concept => (
                      <tr key={concept.id}>
                        <td>{concept.name}</td>
                        <td><span className="muted">{concept.description || '—'}</span></td>
                        <td><StatusBadge value={concept.active ? 'aktiv' : 'inaktiv'} /></td>
                        <td><button className="secondary-button" type="button" onClick={() => editConcept(concept)}>Bearbeiten</button></td>
                      </tr>
                    ))}
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
                  <p>Regeln definieren und erfasste Stunden prüfen – gespeichert im Config Service und Time Service.</p>
                </div>
              </div>
              <div className="split-grid">
                <form className="panel" onSubmit={saveTimeRule}>
                  <h3>{editing.timeRuleId ? 'Stundenregel bearbeiten' : 'Stundenregel erstellen'}</h3>
                  <div className="form-grid">
                    <Field label="Name"><input value={timeRuleForm.name} onChange={event => setTimeRuleForm({ ...timeRuleForm, name: event.target.value })} /></Field>
                    <Field label="Max. Tagesstunden"><input type="number" step="0.5" value={timeRuleForm.maxDailyHours} onChange={event => setTimeRuleForm({ ...timeRuleForm, maxDailyHours: event.target.value })} /></Field>
                    <Field label="Max. Wochenstunden"><input type="number" step="0.5" value={timeRuleForm.maxWeeklyHours} onChange={event => setTimeRuleForm({ ...timeRuleForm, maxWeeklyHours: event.target.value })} /></Field>
                    <Field label="Pause nach (h)"><input type="number" step="0.5" value={timeRuleForm.breakAfterHours} onChange={event => setTimeRuleForm({ ...timeRuleForm, breakAfterHours: event.target.value })} /></Field>
                    <Field label="Pausendauer (min)"><input type="number" value={timeRuleForm.breakDurationMinutes} onChange={event => setTimeRuleForm({ ...timeRuleForm, breakDurationMinutes: event.target.value })} /></Field>
                    <Field label="Status">
                      <select value={timeRuleForm.active ? 'aktiv' : 'inaktiv'} onChange={event => setTimeRuleForm({ ...timeRuleForm, active: event.target.value === 'aktiv' })}>
                        <option value="aktiv">aktiv</option>
                        <option value="inaktiv">inaktiv</option>
                      </select>
                    </Field>
                  </div>
                  <div className="actions" style={{ marginTop: 14 }}>
                    <button className="primary-button" type="submit">Speichern</button>
                    {editing.timeRuleId && <button className="ghost-button" type="button" onClick={() => { setTimeRuleForm(emptyTimeRule); setEditing(c => ({ ...c, timeRuleId: null })); }}>Abbrechen</button>}
                  </div>
                </form>
                <form className="panel" onSubmit={saveWageRule}>
                  <h3>{editing.wageRuleId ? 'Lohnregel bearbeiten' : 'Lohnregel erstellen'}</h3>
                  <div className="form-grid">
                    <Field label="Name"><input value={wageRuleForm.name} onChange={event => setWageRuleForm({ ...wageRuleForm, name: event.target.value })} /></Field>
                    <Field label="Stundenansatz (CHF)"><input type="number" step="0.05" value={wageRuleForm.hourlyRate} onChange={event => setWageRuleForm({ ...wageRuleForm, hourlyRate: event.target.value })} /></Field>
                    <Field label="Überstundenansatz (CHF)"><input type="number" step="0.05" value={wageRuleForm.overtimeRate} onChange={event => setWageRuleForm({ ...wageRuleForm, overtimeRate: event.target.value })} /></Field>
                    <Field label="Konzept">
                      <select value={wageRuleForm.conceptId} onChange={event => setWageRuleForm({ ...wageRuleForm, conceptId: event.target.value })}>
                        <option value="">Nicht zugewiesen</option>
                        {conceptOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </Field>
                    <Field label="Status">
                      <select value={wageRuleForm.active ? 'aktiv' : 'inaktiv'} onChange={event => setWageRuleForm({ ...wageRuleForm, active: event.target.value === 'aktiv' })}>
                        <option value="aktiv">aktiv</option>
                        <option value="inaktiv">inaktiv</option>
                      </select>
                    </Field>
                  </div>
                  <div className="actions" style={{ marginTop: 14 }}>
                    <button className="primary-button" type="submit">Speichern</button>
                    {editing.wageRuleId && <button className="ghost-button" type="button" onClick={() => { setWageRuleForm(emptyWageRule); setEditing(c => ({ ...c, wageRuleId: null })); }}>Abbrechen</button>}
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
                          <th>Tagesmax.</th>
                          <th>Wochenmax.</th>
                          <th>Pause</th>
                          <th>Status</th>
                          <th>Aktion</th>
                        </tr>
                      </thead>
                      <tbody>
                        {apiTimeRules.length === 0 && (
                          <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888', padding: 12 }}>Keine Stundenregeln vorhanden</td></tr>
                        )}
                        {apiTimeRules.map(rule => (
                          <tr key={rule.id}>
                            <td>{rule.name}</td>
                            <td>{rule.maxDailyHours != null ? `${rule.maxDailyHours} h` : '—'}</td>
                            <td>{rule.maxWeeklyHours != null ? `${rule.maxWeeklyHours} h` : '—'}</td>
                            <td>{rule.breakAfterHours != null ? `nach ${rule.breakAfterHours} h → ${rule.breakDurationMinutes} min` : '—'}</td>
                            <td><StatusBadge value={rule.active ? 'aktiv' : 'inaktiv'} /></td>
                            <td>
                              <button className="secondary-button" type="button" onClick={() => {
                                setTimeRuleForm({ name: rule.name, maxDailyHours: rule.maxDailyHours ?? 8, maxWeeklyHours: rule.maxWeeklyHours ?? 40, breakAfterHours: rule.breakAfterHours ?? 6, breakDurationMinutes: rule.breakDurationMinutes ?? 30, active: rule.active });
                                setEditing(current => ({ ...current, timeRuleId: rule.id }));
                              }}>Bearbeiten</button>
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
                          <th>Überstunden</th>
                          <th>Konzept</th>
                          <th>Status</th>
                          <th>Aktion</th>
                        </tr>
                      </thead>
                      <tbody>
                        {apiWageRules.length === 0 && (
                          <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888', padding: 12 }}>Keine Lohnregeln vorhanden</td></tr>
                        )}
                        {apiWageRules.map(rule => (
                          <tr key={rule.id}>
                            <td>{rule.name}</td>
                            <td>CHF {rule.hourlyRate} / h</td>
                            <td>{rule.overtimeRate != null ? `CHF ${rule.overtimeRate} / h` : '—'}</td>
                            <td>{apiConcepts.find(c => c.id === rule.conceptId)?.name || '—'}</td>
                            <td><StatusBadge value={rule.active ? 'aktiv' : 'inaktiv'} /></td>
                            <td>
                              <button className="secondary-button" type="button" onClick={() => {
                                setWageRuleForm({ name: rule.name, hourlyRate: rule.hourlyRate, overtimeRate: rule.overtimeRate ?? '', conceptId: rule.conceptId ? String(rule.conceptId) : '', active: rule.active });
                                setEditing(current => ({ ...current, wageRuleId: rule.id }));
                              }}>Bearbeiten</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="panel">
                <h3>Stundenübersicht (Time Service)</h3>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <label style={{ fontSize: 14 }}>Von<br /><input type="date" value={timeFrom} onChange={e => setTimeFrom(e.target.value)} style={{ padding: '7px 10px', border: '1px solid #c8d0d9', borderRadius: 6 }} /></label>
                  <label style={{ fontSize: 14 }}>Bis<br /><input type="date" value={timeTo} onChange={e => setTimeTo(e.target.value)} style={{ padding: '7px 10px', border: '1px solid #c8d0d9', borderRadius: 6 }} /></label>
                  <button className="primary-button" type="button" onClick={() => loadTimeTotal(timeFrom, timeTo)}>Laden</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 14 }}>
                  <div style={{ padding: 12, border: '1px solid #e0e6ed', borderRadius: 8, background: '#f8fafc' }}>
                    <strong style={{ fontSize: 22 }}>{apiTimeTotal.length}</strong><br /><span style={{ fontSize: 13, color: '#607080' }}>Mitarbeiter mit Stunden</span>
                  </div>
                  <div style={{ padding: 12, border: '1px solid #e0e6ed', borderRadius: 8, background: '#f8fafc' }}>
                    <strong style={{ fontSize: 22 }}>{apiBreakViolations.length}</strong><br /><span style={{ fontSize: 13, color: '#607080' }}>Pausenverstösse</span>
                  </div>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Mitarbeiter-ID</th>
                        <th>Gesamtstunden</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiTimeTotal.length === 0 && (
                        <tr><td colSpan={2} style={{ textAlign: 'center', color: '#888', padding: 14 }}>Keine Stundendaten im gewählten Zeitraum</td></tr>
                      )}
                      {apiTimeTotal.map(row => (
                        <tr key={row.employeeId}>
                          <td>{row.employeeId}</td>
                          <td><b>{Number(row.totalHours).toFixed(2)} h</b></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {apiBreakViolations.length > 0 && (
                  <>
                    <h4 style={{ marginTop: 20 }}>Pausenverstösse</h4>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Datum</th>
                            <th>Mitarbeiter-ID</th>
                            <th>Pause</th>
                            <th>Erforderlich</th>
                            <th>Stunden</th>
                          </tr>
                        </thead>
                        <tbody>
                          {apiBreakViolations.map(row => (
                            <tr key={row.id}>
                              <td>{row.entryDate}</td>
                              <td>{row.employeeId}</td>
                              <td>{row.breakMinutes ?? 0} min</td>
                              <td><b>{row.requiredBreakMinutes} min</b></td>
                              <td>{row.totalHours != null ? `${Number(row.totalHours).toFixed(2)} h` : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
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
                  <Field label="Vorname"><input value={employeeForm.firstName} onChange={event => setEmployeeForm({ ...employeeForm, firstName: event.target.value })} /></Field>
                  <Field label="Nachname"><input value={employeeForm.lastName} onChange={event => setEmployeeForm({ ...employeeForm, lastName: event.target.value })} /></Field>
                  {!editing.employeeId && <Field label="Benutzername"><input value={employeeForm.username} onChange={event => setEmployeeForm({ ...employeeForm, username: event.target.value })} /></Field>}
                  <Field label="E-Mail"><input type="email" value={employeeForm.email} onChange={event => setEmployeeForm({ ...employeeForm, email: event.target.value })} /></Field>
                  {!editing.employeeId && <Field label="Passwort"><input type="password" value={employeeForm.password} onChange={event => setEmployeeForm({ ...employeeForm, password: event.target.value })} /></Field>}
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
                      <th>Benutzername</th>
                      <th>E-Mail</th>
                      <th>Status</th>
                      <th>Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiEmployees.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888', padding: '12px' }}>Keine Mitarbeiter gefunden</td></tr>
                    )}
                    {apiEmployees.filter(e => matchesSearch(e, search)).map(e => (
                      <tr key={e.id}>
                        <td>{e.firstName} {e.lastName}</td>
                        <td><span className="muted">{e.username}</span></td>
                        <td>{e.email}</td>
                        <td><StatusBadge value={e.active ? 'aktiv' : 'deaktiviert'} /></td>
                        <td>
                          <button className="secondary-button" type="button" onClick={() => editEmployee(e)}>Bearbeiten</button>
                          <button
                            className={e.active ? 'danger-button' : 'secondary-button'}
                            type="button"
                            style={{ marginLeft: 8 }}
                            onClick={() => setUserStatus(e, e.active ? 'deaktiviert' : 'aktiv')}
                          >
                            {e.active ? 'Deaktivieren' : 'Aktivieren'}
                          </button>
                        </td>
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
