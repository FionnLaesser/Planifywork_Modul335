# Endpoint-Integrationsmatrix – PlanifyWork

Diese Matrix gleicht UML/Architektur, API-Gateway, Backend-Controller, Web-Frontends und Flutter-App ab.

## Gateway-Routen

| Pfad-Prefix | Backend-Service | Port | Verwendet von | Status |
|---|---|---:|---|---|
| `/api/auth/**` | auth-service | 8001 | Admin Web, HR Web, Schichtleiter Web, Flutter | OK |
| `/api/users/**` | user-role-service | 8002 | Admin Web, HR Web, Schichtleiter Web | OK |
| `/api/orders/**` | order-service | 8003 | Admin Web, Schichtleiter Web | OK |
| `/api/planning/**` | planning-service | 8004 | HR Web, Schichtleiter Web, Flutter Kalender | OK |
| `/api/time/**` | time-service | 8005 | HR Web, Schichtleiter Web, Flutter Check-in/out | OK |
| `/api/absences/**` | absence-vacation-service | 8006 | HR Web, Flutter Absenzen | OK |
| `/api/billing/**` | billing-service | 8007 | HR Web | OK |
| `/api/media/**` | report-media-service | 8008 | Flutter Rapport | OK |
| `/api/flipper-auth/**` | flipper-auth-service | 8009 | Flipper Web, Flutter Check-in/out | OK |

## Fachliche Endpoint-Flows

### Planning / HR-Stundenfreigabe

| Schritt | Endpoint | Rolle | UI/App | Bemerkung |
|---|---|---|---|---|
| HR gibt Monatsstunden frei | `POST /api/planning/hour-budgets` | HR/ADMIN | HR Web `/hour-budgets` | Voraussetzung für Arbeitspläne |
| HR/Schichtleiter lädt Freigaben | `GET /api/planning/hour-budgets?shiftLeadId=` | HR/ADMIN/SHIFT_LEAD | HR Web, Schichtleiter Web `/planning` | Schichtleiter filtert nach eigener ID |
| Arbeitsplan erstellen | `POST /api/planning/workplans` | SHIFT_LEAD/HR/ADMIN | Schichtleiter Web `/planning` | `approvedHours` kommt aus HR-Freigabe, nicht aus dem UI |
| Arbeitspläne laden | `GET /api/planning/workplans?shiftLeadId=` | SHIFT_LEAD/HR/ADMIN | Schichtleiter Dashboard/Planning | OK |
| Schicht hinzufügen | `POST /api/planning/workplans/{id}/shifts` | SHIFT_LEAD/HR/ADMIN | Schichtleiter Web `/planning` | Optional mit `orderId` |
| Plan veröffentlichen | `PUT /api/planning/workplans/{id}/publish` | SHIFT_LEAD/HR/ADMIN | Schichtleiter Web `/planning` | Danach für Mobile sichtbar |
| Mitarbeiterkalender | `GET /api/planning/calendar/{employeeId}?from=&to=` | EMPLOYEE/SHIFT_LEAD/HR/ADMIN | Flutter Kalender | Nur veröffentlichte Schichten |

### Time / Pausenverstösse

| Endpoint | Rolle | UI/App | Status |
|---|---|---|---|
| `POST /api/time/checkin` | EMPLOYEE/SHIFT_LEAD | Flutter Check-in | OK |
| `POST /api/time/checkout` | EMPLOYEE/SHIFT_LEAD | Flutter Check-out | OK, sendet `breakMinutes` |
| `GET /api/time/current/{employeeId}` | EMPLOYEE/SHIFT_LEAD/HR/ADMIN | Flutter Check-in Screen | OK |
| `GET /api/time/latest/{employeeId}` | EMPLOYEE/SHIFT_LEAD/HR/ADMIN | Flutter Check-in Screen | OK |
| `GET /api/time/month/{employeeId}` | HR/ADMIN/SHIFT_LEAD | HR Web, Schichtleiter Web | OK |
| `GET /api/time/total` | HR/ADMIN/SHIFT_LEAD | HR Web, Schichtleiter Web | OK |
| `GET /api/time/total/{employeeId}` | HR/ADMIN/SHIFT_LEAD | Detailansichten/API | OK |
| `GET /api/time/break-violations` | HR/ADMIN/SHIFT_LEAD | HR Web, Schichtleiter Web | OK |

### Mobile

| Funktion | Endpoint | Status |
|---|---|---|
| Login | `POST /api/auth/login` | OK, speichert `token`, `role`, `username`, `userId` |
| Kalender | `GET /api/planning/calendar/{employeeId}?from=&to=` | OK |
| Check-in/out | `POST /api/time/checkin`, `POST /api/time/checkout` | OK |
| Absenzen | `POST /api/absences`, `GET /api/absences/employee/{employeeId}` | OK |
| Rapport-Bild | `POST /api/media/upload` | OK |
| Flipper Session | `/api/flipper-auth/**` | OK |

## Bekannte Architekturregel

Alle Frontends und die Flutter-App sprechen gegen das API-Gateway auf Port `8000`. Direkte Service-Ports sind nur für lokale Entwicklung/Debugging gedacht.
