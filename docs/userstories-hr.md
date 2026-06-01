# User Stories – Rolle: HR

**Projekt:** Workforce Management System  
**Rolle:** HR-Mitarbeiterin  
**Zugang:** HR Web Frontend (Port 3002)  
**JWT-Rolle:** `HR`

---

## Übersicht

| ID | Titel | Bereich |
|---|---|---|
| [US-HR-01](#us-hr-01--schichtleiter-anlegen) | Schichtleiter anlegen | Schichtleiterverwaltung |
| [US-HR-02](#us-hr-02--schichtleiter-bearbeiten--deaktivieren) | Schichtleiter bearbeiten / deaktivieren | Schichtleiterverwaltung |
| [US-HR-03](#us-hr-03--schichtleiter-übersicht) | Schichtleiter-Übersicht | Schichtleiterverwaltung |
| [US-HR-04](#us-hr-04--gesamtstunden-aller-mitarbeiter-einsehen) | Gesamtstunden aller Mitarbeiter einsehen | Stundenverwaltung |
| [US-HR-05](#us-hr-05--detaillierte-stundenauswertung-pro-mitarbeiter) | Detaillierte Stundenauswertung pro Mitarbeiter | Stundenverwaltung |
| [US-HR-06](#us-hr-06--rechnung-erstellen) | Rechnung erstellen | Rechnungswesen |
| [US-HR-07](#us-hr-07--rechnungen-verwalten) | Rechnungen verwalten | Rechnungswesen |
| [US-HR-08](#us-hr-08--ferienanfragen-genehmigen--ablehnen) | Ferienanfragen genehmigen / ablehnen | Absenzen & Ferien |
| [US-HR-09](#us-hr-09--absenzen-verwalten) | Absenzen verwalten | Absenzen & Ferien |
| [US-HR-10](#us-hr-10--abwesenheitskalender-einsehen) | Abwesenheitskalender einsehen | Absenzen & Ferien |

---

## Schichtleiterverwaltung

### US-HR-01 · Schichtleiter anlegen

> **Als** HR-Mitarbeiterin  
> **möchte ich** einen neuen Schichtleiter im System anlegen können,  
> **damit** dieser sich auf der Schichtleiter-Weboberfläche einloggen und Teams verwalten kann.

**Betroffene Komponenten:**
- Frontend: `hr-web` → Seite `/shift-leads/new`
- Backend: `user-role-service` → `POST /api/users`
- Datenbank: Tabellen `users`, `roles`

**Akzeptanzkriterien:**

- [ ] HR kann ein Formular mit Vorname, Nachname, E-Mail und Benutzername ausfüllen
- [ ] Die Rolle `SHIFT_LEAD` wird automatisch zugewiesen
- [ ] Das System generiert ein temporäres Passwort (oder HR setzt es direkt)
- [ ] Nach erfolgreichem Anlegen erscheint eine Bestätigungsmeldung
- [ ] Bei bereits vorhandenem Benutzername oder E-Mail erscheint eine verständliche Fehlermeldung
- [ ] Der neue Schichtleiter erscheint sofort in der Schichtleiter-Übersicht

---

### US-HR-02 · Schichtleiter bearbeiten / deaktivieren

> **Als** HR-Mitarbeiterin  
> **möchte ich** die Daten eines bestehenden Schichtleiters bearbeiten und ihn bei Bedarf deaktivieren können,  
> **damit** Änderungen korrekt im System hinterlegt sind und der Zugang bei Austritt gesperrt werden kann.

**Betroffene Komponenten:**
- Frontend: `hr-web` → Seite `/shift-leads/:id/edit`
- Backend: `user-role-service` → `PUT /api/users/:id`
- Datenbank: Tabelle `users` (Feld `active`)

**Akzeptanzkriterien:**

- [ ] HR kann Vorname, Nachname und E-Mail eines Schichtleiters bearbeiten
- [ ] Änderungen werden nach Klick auf „Speichern" persistiert
- [ ] HR kann einen Schichtleiter deaktivieren (nicht dauerhaft löschen)
- [ ] Ein deaktivierter Schichtleiter kann sich nicht mehr einloggen (Login schlägt fehl)
- [ ] Der Status (aktiv/inaktiv) ist in der Übersicht sichtbar
- [ ] Eine Deaktivierung erfordert eine Bestätigungsabfrage („Wirklich deaktivieren?")

---

### US-HR-03 · Schichtleiter-Übersicht

> **Als** HR-Mitarbeiterin  
> **möchte ich** eine Übersicht aller Schichtleiter sehen,  
> **damit** ich den aktuellen Stand der Schichtleiter-Verwaltung jederzeit überblicken kann.

**Betroffene Komponenten:**
- Frontend: `hr-web` → Seite `/shift-leads`
- Backend: `user-role-service` → `GET /api/users?role=SHIFT_LEAD`

**Akzeptanzkriterien:**

- [ ] Tabelle zeigt alle Schichtleiter mit Name, E-Mail, Benutzername und Status
- [ ] Aktive und inaktive Schichtleiter sind farblich unterscheidbar
- [ ] Suchfeld filtert die Liste nach Name oder E-Mail in Echtzeit
- [ ] Klick auf einen Eintrag öffnet die Detailansicht / Bearbeitungsseite
- [ ] Schaltfläche „Neuen Schichtleiter anlegen" ist sichtbar und funktioniert

---

## Stundenverwaltung

### US-HR-04 · Gesamtstunden aller Mitarbeiter einsehen

> **Als** HR-Mitarbeiterin  
> **möchte ich** die Gesamtstunden aller Mitarbeiter einsehen können,  
> **damit** ich einen vollständigen Überblick über die geleisteten Arbeitszeiten habe.

**Betroffene Komponenten:**
- Frontend: `hr-web` → Seite `/hours`
- Backend: `time-service` → `GET /api/time/total` (mit optionalem Datumsfilter)

**Akzeptanzkriterien:**

- [ ] Tabelle listet alle Mitarbeiter mit ihren Gesamtstunden auf
- [ ] Filterung nach Zeitraum: aktuelle Woche, aktueller Monat, benutzerdefinierter Bereich
- [ ] Sortierung nach Name (A–Z) und nach Stunden (hoch/runter) möglich
- [ ] Stunden werden mit zwei Dezimalstellen angezeigt (z.B. `38.50 h`)
- [ ] Daten werden vom Time Service geladen und sind aktuell

---

### US-HR-05 · Detaillierte Stundenauswertung pro Mitarbeiter

> **Als** HR-Mitarbeiterin  
> **möchte ich** eine detaillierte Stundenauswertung für einen bestimmten Mitarbeiter abrufen können,  
> **damit** ich einzelne Arbeitszeitnachweise prüfen und bei Bedarf exportieren kann.

**Betroffene Komponenten:**
- Frontend: `hr-web` → Seite `/hours/:employeeId`
- Backend: `time-service` → `GET /api/time/month/:employeeId`

**Akzeptanzkriterien:**

- [ ] Detailansicht zeigt alle täglichen Einträge mit Datum, Check-in, Check-out und Nettostunden
- [ ] Summe der Tages-, Wochen- und Monatsstunden wird angezeigt
- [ ] Filterung nach Datumsbereich möglich
- [ ] Export der Auswertung als CSV-Datei möglich
- [ ] Fehlende Check-out-Einträge werden visuell markiert

---

## Rechnungswesen

### US-HR-06 · Rechnung erstellen

> **Als** HR-Mitarbeiterin  
> **möchte ich** eine Rechnung für einen abgeschlossenen Auftrag erstellen können,  
> **damit** Kunden korrekt und vollständig fakturiert werden.

**Betroffene Komponenten:**
- Frontend: `hr-web` → Seite `/invoices/new`
- Backend: `billing-service` → `POST /api/billing/invoices`
- Backend: `time-service` → Stundendaten abrufen
- Backend: `order-service` → Auftragsdaten abrufen

**Akzeptanzkriterien:**

- [ ] HR wählt einen Auftrag aus einer Dropdown-Liste aus
- [ ] Das System befüllt die geleisteten Stunden automatisch aus dem Time Service
- [ ] HR kann Stundensatz, Beschreibung und einzelne Rechnungspositionen anpassen
- [ ] Die Rechnung wird zuerst als Entwurf (`DRAFT`) gespeichert
- [ ] Eine Vorschau der Rechnung ist vor dem Speichern möglich
- [ ] Pflichtfelder (Auftrag, Stunden, Stundensatz) werden validiert

---

### US-HR-07 · Rechnungen verwalten

> **Als** HR-Mitarbeiterin  
> **möchte ich** den Status meiner Rechnungen verwalten und einsehen können,  
> **damit** ich den gesamten Rechnungsprozess vom Entwurf bis zur Bezahlung im Blick behalte.

**Betroffene Komponenten:**
- Frontend: `hr-web` → Seite `/invoices`
- Backend: `billing-service` → `GET /api/billing/invoices`, `PUT /api/billing/invoices/:id/send`

**Akzeptanzkriterien:**

- [ ] Übersicht zeigt alle Rechnungen mit Rechnungsnummer, Auftrag, Betrag, Datum und Status
- [ ] Status-Übergänge: `DRAFT` → `SENT` → `PAID`
- [ ] HR kann eine Rechnung von „Entwurf" auf „Gesendet" setzen
- [ ] HR kann eine Rechnung als „Bezahlt" markieren
- [ ] Filtermöglichkeit nach Status und Erstellungsdatum
- [ ] Klick auf eine Rechnung öffnet die Detailansicht

---

## Absenzen & Ferien

### US-HR-08 · Ferienanfragen genehmigen / ablehnen

> **Als** HR-Mitarbeiterin  
> **möchte ich** offene Ferienanfragen von Mitarbeitern genehmigen oder ablehnen können,  
> **damit** Mitarbeiter zeitnah eine Rückmeldung zu ihrem Ferienantrag erhalten.

**Betroffene Komponenten:**
- Frontend: `hr-web` → Seite `/absences?type=VACATION&status=PENDING`
- Backend: `absence-vacation-service` → `GET /api/absences/pending`, `PUT /api/absences/:id/approve`, `PUT /api/absences/:id/reject`

**Akzeptanzkriterien:**

- [ ] Liste zeigt alle offenen Ferienanfragen mit Mitarbeitername, Zeitraum und Begründung
- [ ] HR kann eine Anfrage mit einem Klick genehmigen (`APPROVED`) oder ablehnen (`REJECTED`)
- [ ] Der Status wird sofort in der Liste aktualisiert
- [ ] Genehmigte/abgelehnte Anfragen verschwinden aus der „Offene Anfragen"-Ansicht
- [ ] Bei Ablehnung kann HR optional eine Begründung hinterlegen
- [ ] Anzahl offener Anfragen ist im Dashboard als Badge sichtbar

---

### US-HR-09 · Absenzen verwalten

> **Als** HR-Mitarbeiterin  
> **möchte ich** Absenzen von Mitarbeitern einsehen und bei Bedarf manuell erfassen können,  
> **damit** Fehlzeiten vollständig und korrekt dokumentiert sind.

**Betroffene Komponenten:**
- Frontend: `hr-web` → Seite `/absences`
- Backend: `absence-vacation-service` → `GET /api/absences`, `POST /api/absences`, `PUT /api/absences/:id`, `DELETE /api/absences/:id`

**Akzeptanzkriterien:**

- [ ] Übersicht zeigt alle Absenzen gefiltert nach Mitarbeiter, Typ und Zeitraum
- [ ] Abwesenheitstypen sind erkennbar: `VACATION` (Ferien), `SICK` (Krank), `OTHER` (Sonstige)
- [ ] HR kann eine Absenz manuell für einen Mitarbeiter erfassen
- [ ] Bestehende Absenzen können bearbeitet oder gelöscht werden
- [ ] Löschung erfordert eine Bestätigungsabfrage

---

### US-HR-10 · Abwesenheitskalender einsehen

> **Als** HR-Mitarbeiterin  
> **möchte ich** einen Kalender sehen, der alle Abwesenheiten aller Mitarbeiter auf einen Blick darstellt,  
> **damit** ich Personalengpässe frühzeitig erkennen und die Planung unterstützen kann.

**Betroffene Komponenten:**
- Frontend: `hr-web` → Seite `/absences/calendar`
- Backend: `absence-vacation-service` → `GET /api/absences?month=&year=`

**Akzeptanzkriterien:**

- [ ] Monatsansicht zeigt alle Abwesenheiten farblich nach Typ markiert (Ferien = grün, Krank = rot, Sonstige = grau)
- [ ] Jede Abwesenheit zeigt Mitarbeitername beim Hover/Klick
- [ ] Navigation zwischen Monaten ist möglich (zurück / vorwärts)
- [ ] Filterung nach Schichtleiter-Team möglich
- [ ] Tage mit mehr als 3 gleichzeitigen Abwesenheiten werden hervorgehoben

---

## Technische Hinweise für die Implementierung

### Backend-Endpoints (Zusammenfassung)

| Service | Methode | Endpoint | Beschreibung |
|---|---|---|---|
| user-role-service | GET | `/api/users?role=SHIFT_LEAD` | Alle Schichtleiter |
| user-role-service | POST | `/api/users` | Schichtleiter anlegen |
| user-role-service | PUT | `/api/users/:id` | Schichtleiter bearbeiten |
| time-service | GET | `/api/time/total` | Gesamtstunden alle |
| time-service | GET | `/api/time/month/:id` | Monatsdetail Mitarbeiter |
| billing-service | GET | `/api/billing/invoices` | Alle Rechnungen |
| billing-service | POST | `/api/billing/invoices` | Rechnung erstellen |
| billing-service | PUT | `/api/billing/invoices/:id/send` | Status → SENT |
| absence-vacation-service | GET | `/api/absences/pending` | Offene Anfragen |
| absence-vacation-service | PUT | `/api/absences/:id/approve` | Genehmigen |
| absence-vacation-service | PUT | `/api/absences/:id/reject` | Ablehnen |
| absence-vacation-service | GET | `/api/absences` | Alle Absenzen |
| absence-vacation-service | POST | `/api/absences` | Absenz erfassen |

### Frontend-Seiten (hr-web)

| Route | Komponente | User Story |
|---|---|---|
| `/shift-leads` | `ShiftLeadsPage` | US-HR-03 |
| `/shift-leads/new` | `NewShiftLeadPage` | US-HR-01 |
| `/shift-leads/:id/edit` | `EditShiftLeadPage` | US-HR-02 |
| `/hours` | `HoursOverviewPage` | US-HR-04 |
| `/hours/:employeeId` | `EmployeeHoursPage` | US-HR-05 |
| `/invoices` | `InvoicesPage` | US-HR-07 |
| `/invoices/new` | `NewInvoicePage` | US-HR-06 |
| `/absences` | `AbsencesPage` | US-HR-08, US-HR-09 |
| `/absences/calendar` | `AbsenceCalendarPage` | US-HR-10 |
