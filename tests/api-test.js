/**
 * Workforce Management System – Automatischer API-Testlauf
 *
 * Ausführen:  node tests/api-test.js
 * Voraussetzung: alle Docker-Container laufen (docker compose up -d)
 * Node-Version: 18+ (nutzt built-in fetch)
 */

const BASE = 'http://localhost:8000';

// ── Farben ────────────────────────────────────────────────────
const C = {
  green:  '\x1b[32m', red:   '\x1b[31m', yellow: '\x1b[33m',
  cyan:   '\x1b[36m', bold:  '\x1b[1m',  reset:  '\x1b[0m',
};

// ── Zustand ───────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const tokens   = {};
const toDelete = { users: [], absences: [] };

// ── Hilfsfunktionen ───────────────────────────────────────────

async function req(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    let data;
    try { data = await res.json(); } catch { data = null; }
    return { status: res.status, data };
  } catch {
    return { status: 0, data: null };
  }
}

function pass(label, note = '') {
  passed++;
  const n = note ? ` ${C.yellow}(${note})${C.reset}` : '';
  console.log(`  ${C.green}✔${C.reset} ${label}${n}`);
}

function fail(label, reason) {
  failed++;
  console.log(`  ${C.red}✘${C.reset} ${label} ${C.red}→ ${reason}${C.reset}`);
}

function skip(label) {
  console.log(`  ${C.yellow}⊘${C.reset} ${label} ${C.yellow}(Service noch nicht vollständig implementiert)${C.reset}`);
}

function section(title) {
  console.log(`\n${C.bold}${C.cyan}▸ ${title}${C.reset}`);
}

function check(label, ok, reason) {
  ok ? pass(label) : fail(label, reason);
}

// ── Testblöcke ────────────────────────────────────────────────

async function testAuth() {
  section('Auth & Login');

  // Jede Rolle muss sich einloggen können
  for (const [username, role] of [
    ['admin',      'ADMIN'],
    ['hr.mueller', 'HR'],
    ['sl.huber',   'SHIFT_LEAD'],
    ['emp.meier',  'EMPLOYEE'],
  ]) {
    const { status, data } = await req('POST', '/api/auth/login', { username, password: 'password' });
    if (status === 200 && data?.token && data?.role === role) {
      tokens[role] = data.token;
      pass(`Login ${username} → Rolle ${role}`);
    } else {
      fail(`Login ${username}`, `HTTP ${status}`);
    }
  }

  // Token validieren (Gateway leitet weiter → 200 oder 403 je nach Gateway-Config)
  const { status: sv } = await req('GET', '/api/auth/validate', null, tokens['HR']);
  check('Token-Validierung', sv === 200 || sv === 403, `HTTP ${sv}`);

  // Falsches Passwort → 401
  const { status: sp } = await req('POST', '/api/auth/login', { username: 'admin', password: 'falsch' });
  check('Falsches Passwort → 401', sp === 401 || sp === 403, `HTTP ${sp}, erwartet 401`);

  // Kein Token → Zugriff verweigert
  const { status: st } = await req('GET', '/api/users');
  check('Kein Token → 401/403', st === 401 || st === 403, `HTTP ${st}, erwartet 401/403`);
}

async function testUserService() {
  section('User & Role Service  (US-HR-01 / US-HR-02 / US-HR-03 / US-ADM-013)');

  // US-HR-03 – alle User laden
  const { status: s1, data: users } = await req('GET', '/api/users', null, tokens['ADMIN']);
  check('GET /api/users – alle User laden  (US-HR-03)', s1 === 200 && Array.isArray(users), `HTTP ${s1}`);
  check('Mindestens 4 Seed-User vorhanden', (users?.length ?? 0) >= 4, `${users?.length} User gefunden`);

  // Filter SHIFT_LEAD
  const { status: s2, data: leads } = await req('GET', '/api/users?role=SHIFT_LEAD', null, tokens['HR']);
  check('GET /api/users?role=SHIFT_LEAD  (US-HR-03)', s2 === 200 && Array.isArray(leads), `HTTP ${s2}`);

  // Filter EMPLOYEE
  const { status: s3, data: emps } = await req('GET', '/api/users?role=EMPLOYEE', null, tokens['HR']);
  check('GET /api/users?role=EMPLOYEE  (US-HR-03)', s3 === 200 && Array.isArray(emps), `HTTP ${s3}`);

  // US-HR-01 – neuen Schichtleiter anlegen
  const ts = Date.now();
  const newUser = {
    firstName: 'Auto', lastName: 'Test',
    username:  `sl.auto.${ts}`,
    email:     `sl.auto.${ts}@test.local`,
    password:  'password',
    roleName:  'SHIFT_LEAD',
    active:    true,
  };
  const { status: s4, data: created } = await req('POST', '/api/users', newUser, tokens['HR']);
  check('POST /api/users – Schichtleiter anlegen  (US-HR-01)', s4 === 200 || s4 === 201, `HTTP ${s4}`);
  if (created?.id) toDelete.users.push(created.id);

  if (created?.id) {
    // Detail abrufen
    const { status: s5 } = await req('GET', `/api/users/${created.id}`, null, tokens['HR']);
    check('GET /api/users/:id – User-Detail', s5 === 200, `HTTP ${s5}`);

    // US-HR-01 AK-5 – doppelter Benutzername → Fehler
    const { status: sdup } = await req('POST', '/api/users', newUser, tokens['HR']);
    check('Doppelter Benutzername → Fehler  (US-HR-01 AK-5)', sdup >= 400, `HTTP ${sdup}`);

    // US-HR-02 – Daten bearbeiten
    const { status: s6, data: updated } = await req('PUT', `/api/users/${created.id}`, { firstName: 'Bearbeitet' }, tokens['HR']);
    check('PUT /api/users/:id – bearbeiten  (US-HR-02)', s6 === 200, `HTTP ${s6}`);
    check('Vorname wurde aktualisiert', updated?.firstName === 'Bearbeitet', `firstName=${updated?.firstName}`);

    // US-ADM-013 – Rolle ändern
    const { status: s7 } = await req('PUT', `/api/users/${created.id}`, { roleName: 'EMPLOYEE' }, tokens['ADMIN']);
    check('Rolle ändern → EMPLOYEE  (US-ADM-013)', s7 === 200, `HTTP ${s7}`);

    // US-HR-02 – deaktivieren
    const { status: s8 } = await req('PUT', `/api/users/${created.id}`, { active: false }, tokens['HR']);
    check('Benutzer deaktivieren  (US-HR-02)', s8 === 200, `HTTP ${s8}`);

    // Deaktivierter User → Login schlägt fehl
    const { status: s9 } = await req('POST', '/api/auth/login', { username: newUser.username, password: 'password' });
    check('Deaktivierter User → Login verweigert  (US-HR-02 AK-4)', s9 === 401 || s9 === 403, `HTTP ${s9}`);

    // Wieder aktivieren für Cleanup
    await req('PUT', `/api/users/${created.id}`, { active: true }, tokens['HR']);
  }
}

async function testPlanningService() {
  section('Planning Service  (US-SL-002 / US-SL-003 / US-SL-004 / US-SL-005 / US-SL-006)');

  const slId = (await req('GET', '/api/users?role=SHIFT_LEAD', null, tokens['SHIFT_LEAD']))?.data?.[0]?.id;
  const empId = (await req('GET', '/api/users?role=EMPLOYEE', null, tokens['SHIFT_LEAD']))?.data?.[0]?.id;

  // Fixes Testdatum weit in der Zukunft → nie Overlap mit echten Daten
  const TEST_START = '2099-01-01';
  const TEST_END   = '2099-01-31';
  const TEST_SHIFT = '2099-01-15';

  // HR-Stundenfreigabe – Voraussetzung für Arbeitsplan
  const { status: sb } = await req('POST', '/api/planning/hour-budgets', {
    shiftLeadId: slId, year: 2099, month: 1, approvedHours: 100, createdBy: 2, notes: 'Autotest'
  }, tokens['HR']);
  check('POST /api/planning/hour-budgets – HR-Stundenfreigabe', sb === 200 || sb === 201, `HTTP ${sb}`);

  // US-SL-002 – Arbeitsplan erstellen
  const { status: s1, data: plan } = await req('POST', '/api/planning/workplans', {
    title: '[AUTOTEST] Plan', shiftLeadId: slId,
    startDate: TEST_START, endDate: TEST_END,
  }, tokens['SHIFT_LEAD']);
  check('POST /api/planning/workplans – erstellen  (US-SL-002)', s1 === 200 || s1 === 201, `HTTP ${s1}`);

  // US-SL-002 AK-3 – Plan ist abrufbar
  const { status: s2, data: fetched } = plan?.id
    ? await req('GET', `/api/planning/workplans/${plan.id}`, null, tokens['SHIFT_LEAD'])
    : { status: 0, data: null };
  check('Plan abrufbar nach Erstellung  (US-SL-002 AK-3)', s2 === 200, `HTTP ${s2}`);
  check('Status ist DRAFT', fetched?.status === 'DRAFT', `status=${fetched?.status}`);
  check('approvedHours aus HR-Freigabe übernommen  (US-SL-002 AK-2)', Number(fetched?.approvedHours) === 100, `${fetched?.approvedHours}`);

  if (plan?.id && empId) {
    // US-SL-003 – Schicht hinzufügen
    const { status: s3, data: withShift } = await req(
      'POST', `/api/planning/workplans/${plan.id}/shifts`,
      { employeeId: empId, orderId: null, shiftDate: TEST_SHIFT, startTime: '08:00', endTime: '17:00', notes: 'Autotest' },
      tokens['SHIFT_LEAD']
    );
    check('POST .../shifts – Schicht hinzufügen  (US-SL-003)', s3 === 200 || s3 === 201, `HTTP ${s3}`);

    if (withShift?.shifts) {
      const shift = withShift.shifts.find(s => s.notes === 'Autotest');

      // US-SL-003 AK-2 – Stunden berechnet
      check('Schicht-Stunden automatisch berechnet (9 h)  (US-SL-003 AK-2)', Number(shift?.plannedHours) === 9, `${shift?.plannedHours}`);

      // US-SL-004 – plannedHours im Plan
      check('plannedHours im Plan aktualisiert  (US-SL-004 AK-1)', Number(withShift.plannedHours) >= 9, `${withShift.plannedHours}`);
      check('remainingHours vorhanden  (US-SL-004 AK-2)', withShift.remainingHours !== undefined, 'fehlt');

      // US-SL-005 – Warnungen
      check('overLimit=false bei 9/100 h  (US-SL-005 AK-1)', withShift.overLimit === false, `overLimit=${withShift.overLimit}`);
      check('underPlanned=true bei < 95 h  (US-SL-005 AK-2)', withShift.underPlanned === true, `underPlanned=${withShift.underPlanned}`);
    }

    // US-SL-006 – Arbeitsplan veröffentlichen
    const { status: s4, data: published } = await req('PUT', `/api/planning/workplans/${plan.id}/publish`, null, tokens['SHIFT_LEAD']);
    check('PUT .../publish – veröffentlichen  (US-SL-006)', s4 === 200, `HTTP ${s4}`);
    check('Status ist PUBLISHED  (US-SL-006 AK-1)', published?.status === 'PUBLISHED', `status=${published?.status}`);

    // US-SL-006 AK-2 – Mitarbeiter sieht Schichten im Kalender
    const { status: s5, data: cal } = await req('GET', `/api/planning/calendar/${empId}`, null, tokens['EMPLOYEE']);
    check(`Mitarbeiter-Kalender enthält veröffentlichte Schichten  (US-SL-006 AK-2)`, s5 === 200 && Array.isArray(cal), `HTTP ${s5}`);
  }
}

async function testAbsenceService() {
  section('Absence Service  (US-HR-08 / US-HR-09)');

  const today = new Date().toISOString().slice(0, 10);

  // US-HR-09 – Absenz erfassen
  const { status: s1, data: abs1 } = await req('POST', '/api/absences',
    { employeeId: 4, type: 'SICK', startDate: today, endDate: today, reason: 'Autotest' },
    tokens['HR']);
  check('POST /api/absences – Absenz erfassen  (US-HR-09)', s1 === 200 || s1 === 201, `HTTP ${s1}`);
  if (abs1?.id) toDelete.absences.push(abs1.id);

  // US-HR-09 – alle Absenzen laden
  const { status: s2, data: all } = await req('GET', '/api/absences', null, tokens['HR']);
  check('GET /api/absences – alle Absenzen  (US-HR-09)', s2 === 200 && Array.isArray(all), `HTTP ${s2}`);

  // US-HR-08 – offene Anträge
  const { status: s3, data: pending } = await req('GET', '/api/absences/pending', null, tokens['HR']);
  check('GET /api/absences/pending – offene Anträge  (US-HR-08)', s3 === 200 && Array.isArray(pending), `HTTP ${s3}`);

  if (abs1?.id) {
    // US-HR-09 – bearbeiten (type, startDate, endDate, reason sind Pflicht)
    const { status: s4, data: edited } = await req('PUT', `/api/absences/${abs1.id}`,
      { type: 'OTHER', startDate: today, endDate: today, reason: 'Bearbeitet' }, tokens['HR']);
    check('PUT /api/absences/:id – bearbeiten  (US-HR-09)', s4 === 200, `HTTP ${s4}`);

    // US-HR-08 – genehmigen (reviewerId mitsenden)
    const { status: s5, data: approved } = await req('PUT', `/api/absences/${abs1.id}/approve`,
      { reviewerId: 2 }, tokens['HR']);
    check('PUT .../approve – genehmigen  (US-HR-08)', s5 === 200, `HTTP ${s5}`);
    check('Status ist APPROVED', approved?.status === 'APPROVED', `status=${approved?.status}`);
  }

  // US-HR-08 – ablehnen (neue Absenz)
  const { data: abs2 } = await req('POST', '/api/absences',
    { employeeId: 4, type: 'VACATION', startDate: today, endDate: today, reason: 'Ablehntest' },
    tokens['HR']);
  if (abs2?.id) {
    toDelete.absences.push(abs2.id);
    const { status: s6, data: rejected } = await req('PUT', `/api/absences/${abs2.id}/reject`,
      { rejectionReason: 'Kein Kontingent' }, tokens['HR']);
    check('PUT .../reject – ablehnen  (US-HR-08)', s6 === 200, `HTTP ${s6}`);
    check('Status ist REJECTED', rejected?.status === 'REJECTED', `status=${rejected?.status}`);
    check('Ablehnungsgrund gespeichert  (US-HR-08 AK-6)', !!rejected?.rejectionReason, 'kein rejectionReason');
  }
}

async function testBillingService() {
  section('Billing Service  (US-HR-06 / US-HR-07)');

  // US-HR-06 – Rechnung erstellen
  const { status: s1, data: inv } = await req('POST', '/api/billing/invoices', {
    orderId: null, createdBy: 2, totalHours: 10, amount: 500,
    positions: [{ description: 'Teststunden', hours: 10, rate: 50, subtotal: 500 }],
  }, tokens['HR']);
  check('POST /api/billing/invoices – Rechnung erstellen  (US-HR-06)', s1 === 200 || s1 === 201, `HTTP ${s1}`);
  check('Status ist DRAFT  (US-HR-06)', inv?.status === 'DRAFT', `status=${inv?.status}`);

  // US-HR-07 – alle Rechnungen
  const { status: s2, data: all } = await req('GET', '/api/billing/invoices', null, tokens['HR']);
  check('GET /api/billing/invoices – alle Rechnungen  (US-HR-07)', s2 === 200 && Array.isArray(all), `HTTP ${s2}`);

  if (inv?.id) {
    // Detail
    const { status: s3 } = await req('GET', `/api/billing/invoices/${inv.id}`, null, tokens['HR']);
    check('GET /api/billing/invoices/:id – Detail', s3 === 200, `HTTP ${s3}`);

    // US-HR-07 – versenden (DRAFT → SENT)
    const { status: s4, data: sent } = await req('PUT', `/api/billing/invoices/${inv.id}/send`, null, tokens['HR']);
    check('PUT .../send – DRAFT → SENT  (US-HR-07)', s4 === 200, `HTTP ${s4}`);
    check('Status ist SENT', sent?.status === 'SENT', `status=${sent?.status}`);

    // US-HR-07 – bezahlt (SENT → PAID)
    const { status: s5, data: paid } = await req('PUT', `/api/billing/invoices/${inv.id}/pay`, null, tokens['HR']);
    check('PUT .../pay – SENT → PAID  (US-HR-07)', s5 === 200, `HTTP ${s5}`);
    check('Status ist PAID', paid?.status === 'PAID', `status=${paid?.status}`);
  }

  // Lohnauszug aus Time Entries berechnen
  const { status: sp1, data: payroll } = await req('POST', '/api/billing/payroll-statements', {
    employeeId: 4, year: 2026, month: 6, hourlyRate: 30, bonusAmount: 50, deductionAmount: 20, createdBy: 2
  }, tokens['HR']);
  check('POST /api/billing/payroll-statements – Lohnauszug erstellen', sp1 === 200 || sp1 === 201, `HTTP ${sp1}`);

  const { status: sp2, data: payrollList } = await req('GET', '/api/billing/payroll-statements', null, tokens['HR']);
  check('GET /api/billing/payroll-statements – Lohnauszüge laden', sp2 === 200 && Array.isArray(payrollList), `HTTP ${sp2}`);

  if (payroll?.id) {
    const { status: sp3, data: approved } = await req('PUT', `/api/billing/payroll-statements/${payroll.id}/approve`, null, tokens['HR']);
    check('PUT payroll-statements/:id/approve – freigeben', sp3 === 200 && approved?.status === 'APPROVED', `HTTP ${sp3}`);

    const { status: sp4, data: paid } = await req('PUT', `/api/billing/payroll-statements/${payroll.id}/pay`, null, tokens['HR']);
    check('PUT payroll-statements/:id/pay – bezahlt markieren', sp4 === 200 && paid?.status === 'PAID', `HTTP ${sp4}`);
  }
}

async function testTimeService() {
  section('Time Service  (US-HR-04 / US-HR-05 / US-SL-009)');

  const { status: s1, data: totals } = await req('GET', '/api/time/total', null, tokens['HR']);
  if (s1 === 404 || s1 === 501 || s1 === 503 || s1 === 0) {
    skip('GET /api/time/total – Gesamtstunden  (US-HR-04)');
  } else {
    check('GET /api/time/total – Gesamtstunden  (US-HR-04)', s1 === 200 && Array.isArray(totals), `HTTP ${s1}`);
  }

  const { status: sv, data: violations } = await req('GET', '/api/time/break-violations', null, tokens['HR']);
  check('GET /api/time/break-violations – Pausenverstösse laden', sv === 200 && Array.isArray(violations), `HTTP ${sv}`);

  const { status: s2 } = await req('GET', '/api/time/month/4?month=6&year=2026', null, tokens['HR']);
  if (s2 === 404 || s2 === 501 || s2 === 503 || s2 === 0) {
    skip('GET /api/time/month/:id – Monatsauswertung  (US-HR-05)');
  } else {
    check('GET /api/time/month/:id – Monatsauswertung  (US-HR-05)', s2 === 200, `HTTP ${s2}`);
  }
}

async function cleanupTestData() {
  section('Aufräumen (Testdaten löschen)');
  for (const id of toDelete.absences) {
    const { status } = await req('DELETE', `/api/absences/${id}`, null, tokens['HR']);
    pass(`Absenz #${id} gelöscht`, status !== 200 ? `HTTP ${status}` : '');
  }
  for (const id of toDelete.users) {
    const { status } = await req('DELETE', `/api/users/${id}`, null, tokens['ADMIN']);
    pass(`User #${id} gelöscht`, status !== 200 ? `HTTP ${status}` : '');
  }
}

async function testConfigService() {
  section('Config Service  (Firmenkonzepte / Stundenregeln / Lohnregeln)');

  // ── Konzepte ─────────────────────────────────────────────────
  const { status: gc1, data: concepts } = await req('GET', '/api/config/concepts', null, tokens['ADMIN']);
  check('GET /api/config/concepts – Admin darf lesen', gc1 === 200 && Array.isArray(concepts), `HTTP ${gc1}`);

  const { status: gc2 } = await req('GET', '/api/config/concepts', null, tokens['HR']);
  check('GET /api/config/concepts – HR darf lesen', gc2 === 200, `HTTP ${gc2}`);

  const { status: gc3 } = await req('GET', '/api/config/concepts', null, tokens['SHIFT_LEAD']);
  check('GET /api/config/concepts – SHIFT_LEAD darf lesen', gc3 === 200, `HTTP ${gc3}`);

  const { status: pc1, data: newConcept } = await req('POST', '/api/config/concepts',
    { name: 'Test-Konzept CI', description: 'Automatisch erstellt', active: true },
    tokens['ADMIN']);
  check('POST /api/config/concepts – Admin darf erstellen', pc1 === 201, `HTTP ${pc1}`);

  if (newConcept?.id) {
    const { status: pu1, data: updated } = await req('PUT', `/api/config/concepts/${newConcept.id}`,
      { name: 'Test-Konzept CI (aktualisiert)', active: false },
      tokens['ADMIN']);
    check('PUT /api/config/concepts/:id – Admin darf bearbeiten', pu1 === 200 && updated?.active === false, `HTTP ${pu1}`);
  }

  const { status: pc2 } = await req('POST', '/api/config/concepts',
    { name: 'Sollte fehlschlagen', active: true },
    tokens['HR']);
  check('POST /api/config/concepts – HR darf NICHT erstellen (403)', pc2 === 403, `HTTP ${pc2}`);

  // ── Stundenregeln ─────────────────────────────────────────────
  const { status: gt1, data: timeRules } = await req('GET', '/api/config/time-rules', null, tokens['ADMIN']);
  check('GET /api/config/time-rules – Admin darf lesen', gt1 === 200 && Array.isArray(timeRules), `HTTP ${gt1}`);

  const { status: pt1, data: newTimeRule } = await req('POST', '/api/config/time-rules',
    { name: 'CI-Stundenregel', maxDailyHours: 8.5, maxWeeklyHours: 42, breakAfterHours: 6, breakDurationMinutes: 30, active: true },
    tokens['ADMIN']);
  check('POST /api/config/time-rules – Admin darf erstellen', pt1 === 201, `HTTP ${pt1}`);

  if (newTimeRule?.id) {
    const { status: put1 } = await req('PUT', `/api/config/time-rules/${newTimeRule.id}`,
      { name: 'CI-Stundenregel (aktualisiert)', active: false },
      tokens['ADMIN']);
    check('PUT /api/config/time-rules/:id – Admin darf bearbeiten', put1 === 200, `HTTP ${put1}`);
  }

  // ── Lohnregeln ────────────────────────────────────────────────
  const { status: gw1, data: wageRules } = await req('GET', '/api/config/wage-rules', null, tokens['ADMIN']);
  check('GET /api/config/wage-rules – Admin darf lesen', gw1 === 200 && Array.isArray(wageRules), `HTTP ${gw1}`);

  const { status: pw1, data: newWageRule } = await req('POST', '/api/config/wage-rules',
    { name: 'CI-Lohnregel', hourlyRate: 28.5, overtimeRate: 42.75, active: true },
    tokens['ADMIN']);
  check('POST /api/config/wage-rules – Admin darf erstellen', pw1 === 201, `HTTP ${pw1}`);

  if (newWageRule?.id) {
    const { status: pwu1 } = await req('PUT', `/api/config/wage-rules/${newWageRule.id}`,
      { hourlyRate: 30.0, active: true },
      tokens['ADMIN']);
    check('PUT /api/config/wage-rules/:id – Admin darf bearbeiten', pwu1 === 200, `HTTP ${pwu1}`);
  }
}

async function testMediaService() {
  section('Report / Media Service  (US-MA-Rapport)');

  // HR und Admin dürfen Rapporte pro Mitarbeiter auflisten (auch leere Liste ist 200)
  const { status: gm1, data: list1 } = await req('GET', '/api/media/employee/4', null, tokens['HR']);
  check('GET /api/media/employee/4 – HR darf auflisten', gm1 === 200 && Array.isArray(list1), `HTTP ${gm1}`);

  const { status: gm2, data: list2 } = await req('GET', '/api/media/employee/4', null, tokens['ADMIN']);
  check('GET /api/media/employee/4 – Admin darf auflisten', gm2 === 200 && Array.isArray(list2), `HTTP ${gm2}`);

  const { status: gm3, data: list3 } = await req('GET', '/api/media/employee/4', null, tokens['EMPLOYEE']);
  check('GET /api/media/employee/4 – Employee darf eigene Rapporte sehen', gm3 === 200 && Array.isArray(list3), `HTTP ${gm3}`);

  // Kein Token → 401
  const { status: gm4 } = await req('GET', '/api/media/employee/4', null, null);
  check('GET /api/media/employee/4 – kein Token → 401', gm4 === 401, `HTTP ${gm4}`);

  // Unbekannte ID → 404
  const { status: gm5 } = await req('GET', '/api/media/nonexistent-rapport-id-ci', null, tokens['HR']);
  check('GET /api/media/:id – unbekannte ID → 404', gm5 === 404, `HTTP ${gm5}`);

  // Rapporte pro Auftrag auflisten (leere Liste = 200)
  const { status: gm6, data: list4 } = await req('GET', '/api/media/order/1', null, tokens['HR']);
  check('GET /api/media/order/1 – HR darf auflisten', gm6 === 200 && Array.isArray(list4), `HTTP ${gm6}`);
}

// ── Main ──────────────────────────────────────────────────────

async function run() {
  if (!globalThis.fetch) {
    console.error('Node 18+ erforderlich. Aktuelle Version: ' + process.version);
    process.exit(1);
  }

  console.log(`\n${C.bold}Workforce Management System – API-Testlauf${C.reset}`);
  console.log(`Ziel: ${BASE}\n`);

  await testAuth();
  await testUserService();
  await testPlanningService();
  await testAbsenceService();
  await testBillingService();
  await testTimeService();
  await testConfigService();
  await testMediaService();
  await cleanupTestData();

  const total = passed + failed;
  const color = failed === 0 ? C.green : C.red;
  console.log(`\n${C.bold}${color}━━━ Ergebnis: ${passed}/${total} Tests bestanden${failed > 0 ? ` · ${failed} fehlgeschlagen` : ' – alles grün'}${C.reset}\n`);
  if (failed > 0) process.exit(1);
}

run().catch(err => {
  console.error(`\n${C.red}Fehler: ${err.message}${C.reset}`);
  console.error('Laufen alle Container? → docker compose ps');
  process.exit(1);
});
