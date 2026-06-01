# User Stories – Rolle: HR

**Projekt:** Workforce Management System  
**Rolle:** HR-Mitarbeiterin  
**Zugang:** HR Web Frontend – http://localhost:5173 (Entwicklung) / Port 3002 (Docker)  
**JWT-Rolle:** `HR`

---

## Implementierungsstand (Stand: 01.06.2026)

| ID | Titel | Status |
|---|---|---|
| [US-HR-01](#us-hr-01--schichtleiter-anlegen) | Schichtleiter anlegen | ✅ Abgeschlossen |
| [US-HR-02](#us-hr-02--schichtleiter-bearbeiten--deaktivieren) | Schichtleiter bearbeiten / deaktivieren | ✅ Abgeschlossen |
| [US-HR-03](#us-hr-03--schichtleiter-übersicht) | Schichtleiter-Übersicht | ✅ Abgeschlossen |
| [US-HR-04](#us-hr-04--gesamtstunden-aller-mitarbeiter-einsehen) | Gesamtstunden aller Mitarbeiter einsehen | ⚠️ Teilweise |
| [US-HR-05](#us-hr-05--detaillierte-stundenauswertung-pro-mitarbeiter) | Detaillierte Stundenauswertung pro Mitarbeiter | ⚠️ Teilweise |
| [US-HR-06](#us-hr-06--rechnung-erstellen) | Rechnung erstellen | ⚠️ Teilweise |
| [US-HR-07](#us-hr-07--rechnungen-verwalten) | Rechnungen verwalten | ✅ Abgeschlossen |
| [US-HR-08](#us-hr-08--ferienanfragen-genehmigen--ablehnen) | Ferienanfragen genehmigen / ablehnen | ✅ Abgeschlossen |
| [US-HR-09](#us-hr-09--absenzen-verwalten) | Absenzen verwalten | ✅ Abgeschlossen |
| [US-HR-10](#us-hr-10--abwesenheitskalender-einsehen) | Abwesenheitskalender einsehen | ❌ Nicht implementiert |

---

## Schichtleiterverwaltung

### US-HR-01 · Schichtleiter anlegen

> **Als** HR-Mitarbeiterin  
> **möchte ich** einen neuen Schichtleiter im System anlegen können,  
> **damit** dieser sich auf der Schichtleiter-Weboberfläche einloggen und Teams verwalten kann.

**Implementiert in:** `frontend/hr-web/src/pages/UsersPage.jsx` · `backend/user-role-service` → `POST /api/users`

**Akzeptanzkriterien:**

- [x] HR kann ein Formular mit Vorname, Nachname, E-Mail und Benutzername ausfüllen
- [x] Die Rolle `SHIFT_LEAD` ist im Dropdown wählbar und wird korrekt zugewiesen
- [x] HR setzt das initiale Passwort direkt im Formular (BCrypt-gehasht gespeichert)
- [x] Nach erfolgreichem Anlegen wird das Modal geschlossen und die Liste aktualisiert
- [x] Bei bereits vorhandenem Benutzername oder E-Mail erscheint eine Fehlermeldung aus dem Backend
- [x] Der neue Benutzer erscheint sofort in der Übersicht

**Hinweis:** Die Seite ist unter `/users` erreichbar und verwaltet alle Rollen (nicht nur SHIFT_LEAD), was den Scope der Story abdeckt und erweitert.

---

### US-HR-02 · Schichtleiter bearbeiten / deaktivieren

> **Als** HR-Mitarbeiterin  
> **möchte ich** die Daten eines bestehenden Schichtleiters bearbeiten und ihn bei Bedarf deaktivieren können,  
> **damit** Änderungen korrekt im System hinterlegt sind und der Zugang bei Austritt gesperrt werden kann.

**Implementiert in:** `frontend/hr-web/src/pages/UsersPage.jsx` · `backend/user-role-service` → `PUT /api/users/:id`, `DELETE /api/users/:id`

**Akzeptanzkriterien:**

- [x] HR kann Vorname, Nachname und E-Mail eines Benutzers bearbeiten
- [x] Änderungen werden nach Klick auf „Speichern" in der Datenbank persistiert
- [x] HR kann einen Benutzer deaktivieren (Soft-Delete – Datensatz bleibt erhalten)
- [x] Ein deaktivierter Benutzer kann sich nicht mehr einloggen (Backend prüft `active`-Flag)
- [x] Der Status (Aktiv / Inaktiv) ist in der Übersicht farblich markiert (grün / grau)
- [x] Eine Deaktivierung erfordert eine Bestätigungsabfrage im Browser (`confirm()`)

---

### US-HR-03 · Schichtleiter-Übersicht

> **Als** HR-Mitarbeiterin  
> **möchte ich** eine Übersicht aller Schichtleiter sehen,  
> **damit** ich den aktuellen Stand der Schichtleiter-Verwaltung jederzeit überblicken kann.

**Implementiert in:** `frontend/hr-web/src/pages/UsersPage.jsx` · `backend/user-role-service` → `GET /api/users?role=SHIFT_LEAD`

**Akzeptanzkriterien:**

- [x] Tabelle zeigt alle Benutzer mit Name, Benutzername, E-Mail, Rolle und Status
- [x] Rollenfilter-Dropdown erlaubt Filterung nach `SHIFT_LEAD` (und anderen Rollen)
- [x] Aktive und inaktive Benutzer sind farblich unterscheidbar (grün / grau)
- [x] Suchfeld filtert die Liste nach Name oder Benutzername (Echtzeit via API-Parameter)
- [x] „Bearbeiten"-Button öffnet ein Modal mit den Benutzerdaten
- [x] Schaltfläche „+ Benutzer erstellen" ist sichtbar und öffnet das Erstell-Modal

---

## Stundenverwaltung

### US-HR-04 · Gesamtstunden aller Mitarbeiter einsehen

> **Als** HR-Mitarbeiterin  
> **möchte ich** die Gesamtstunden aller Mitarbeiter einsehen können,  
> **damit** ich einen vollständigen Überblick über die geleisteten Arbeitszeiten habe.

**Implementiert in:** `frontend/hr-web/src/pages/TimePage.jsx` · `backend/time-service` → `GET /api/time/total`

**Akzeptanzkriterien:**

- [x] Tabelle listet alle Mitarbeiter-IDs mit ihren Gesamtstunden auf
- [x] Filterung nach benutzerdefiniertem Zeitraum (Von/Bis Datepicker, Standard: aktueller Monat)
- [x] Stunden werden mit zwei Dezimalstellen angezeigt (z.B. `38.50 h`)
- [x] Daten werden live vom Time Service geladen
- [ ] Schnellauswahl „Aktuelle Woche" / „Aktueller Monat" als Buttons (nur manueller Bereich)
- [ ] Sortierung nach Mitarbeitername oder Stunden (hoch/runter)

**Status: Kernfunktion abgeschlossen.** Sortierung und Schnellauswahl-Buttons sind nice-to-have.

---

### US-HR-05 · Detaillierte Stundenauswertung pro Mitarbeiter

> **Als** HR-Mitarbeiterin  
> **möchte ich** eine detaillierte Stundenauswertung für einen bestimmten Mitarbeiter abrufen können,  
> **damit** ich einzelne Arbeitszeitnachweise prüfen und bei Bedarf exportieren kann.

**Implementiert in:** `frontend/hr-web/src/pages/TimePage.jsx` · `backend/time-service` → `GET /api/time/month/:employeeId`

**Akzeptanzkriterien:**

- [x] Detailansicht zeigt alle Tageseinträge mit Datum, Check-in, Check-out und Nettostunden
- [x] Filterung nach Monat und Jahr möglich
- [x] Fehlende Check-out-Einträge werden visuell als „Offen" (orange) markiert
- [ ] Gesamtsumme der Monatsstunden wird als Summenzeile angezeigt
- [ ] Export der Auswertung als CSV-Datei
- [ ] Wochen- und Tages-Zwischensummen

**Status: Kernfunktion abgeschlossen.** CSV-Export und Summenzeile fehlen.

---

## Rechnungswesen

### US-HR-06 · Rechnung erstellen

> **Als** HR-Mitarbeiterin  
> **möchte ich** eine Rechnung für einen abgeschlossenen Auftrag erstellen können,  
> **damit** Kunden korrekt und vollständig fakturiert werden.

**Implementiert in:** `frontend/hr-web/src/pages/InvoicesPage.jsx` · `backend/billing-service` → `POST /api/billing/invoices`

**Akzeptanzkriterien:**

- [x] HR kann dynamische Rechnungspositionen (Beschreibung, Stunden, CHF/h) hinzufügen und entfernen
- [x] Die Rechnung wird als Entwurf (`DRAFT`) gespeichert
- [x] Pflichtfelder sind mit HTML5 `required` validiert
- [ ] Auftrag aus einer Dropdown-Liste wählbar (aktuell: manuelle ID-Eingabe)
- [ ] Geleistete Stunden werden automatisch aus dem Time Service befüllt
- [ ] Vorschau der Rechnung vor dem Speichern

**Status: Grundfunktion implementiert.** Integration mit Order- und Time-Service für Auto-Fill fehlt.

---

### US-HR-07 · Rechnungen verwalten

> **Als** HR-Mitarbeiterin  
> **möchte ich** den Status meiner Rechnungen verwalten und einsehen können,  
> **damit** ich den gesamten Rechnungsprozess vom Entwurf bis zur Bezahlung im Blick behalte.

**Implementiert in:** `frontend/hr-web/src/pages/InvoicesPage.jsx` · `backend/billing-service` → `GET /api/billing/invoices`, `PUT .../send`, `PUT .../pay`

**Akzeptanzkriterien:**

- [x] Übersicht zeigt alle Rechnungen mit ID, Auftrag-ID, Ersteller, Stunden, Betrag (CHF) und Status
- [x] Status-Übergänge: `DRAFT` → `SENT` → `PAID` über dedizierte Schaltflächen
- [x] „Versenden"-Button bei Entwürfen setzt Status auf `SENT`
- [x] „Als bezahlt"-Button bei gesendeten Rechnungen setzt Status auf `PAID`
- [x] Filtermöglichkeit nach Status (DRAFT / SENT / PAID)
- [x] „Details"-Button öffnet Modal mit allen Positionen, Stunden und Gesamtbetrag

---

## Absenzen & Ferien

### US-HR-08 · Ferienanfragen genehmigen / ablehnen

> **Als** HR-Mitarbeiterin  
> **möchte ich** offene Ferienanfragen von Mitarbeitern genehmigen oder ablehnen können,  
> **damit** Mitarbeiter zeitnah eine Rückmeldung zu ihrem Ferienantrag erhalten.

**Implementiert in:** `frontend/hr-web/src/pages/AbsencesPage.jsx` · `backend/absence-vacation-service` → `GET /api/absences/pending`, `PUT .../approve`, `PUT .../reject`

**Akzeptanzkriterien:**

- [x] Tab „Ausstehende Anträge" listet alle offenen Anfragen (Mitarbeiter-ID, Typ, Von, Bis, Grund, Status)
- [x] „Genehmigen"-Button setzt Status sofort auf `APPROVED`
- [x] „Ablehnen"-Button öffnet ein Modal für einen optionalen Ablehnungsgrund
- [x] Die Liste wird nach jeder Aktion sofort aktualisiert
- [x] Genehmigte / abgelehnte Anfragen verschwinden aus dem Pending-Tab
- [x] Ablehnungsgrund kann optional als Freitext hinterlegt werden
- [ ] Anzahl offener Anfragen als Badge im Dashboard sichtbar
- [ ] Mitarbeitername statt Mitarbeiter-ID in der Liste (aktuell nur ID)

**Status: Kernfunktion abgeschlossen.** Dashboard-Badge und Namensanzeige sind Verbesserungen.

---

### US-HR-09 · Absenzen verwalten

> **Als** HR-Mitarbeiterin  
> **möchte ich** Absenzen von Mitarbeitern einsehen und bei Bedarf manuell erfassen können,  
> **damit** Fehlzeiten vollständig und korrekt dokumentiert sind.

**Implementiert in:** `frontend/hr-web/src/pages/AbsencesPage.jsx` · `backend/absence-vacation-service` → `GET /api/absences`, `POST /api/absences`, `PUT /api/absences/:id`, `DELETE /api/absences/:id`

**Akzeptanzkriterien:**

- [x] Tab „Alle Absenzen" zeigt alle Absenzen mit Typ, Zeitraum, Grund und Status
- [x] Filterung nach Typ (`VACATION`, `SICK`, `OTHER`) mit deutschen Bezeichnungen
- [x] Filterung nach Mitarbeiter-ID (kombinierbar mit Typ-Filter)
- [x] „Filter zurücksetzen"-Button wenn ein Filter aktiv ist
- [x] HR kann eine Absenz manuell für einen Mitarbeiter erfassen (Mitarbeiter-ID, Typ, Von, Bis, Begründung)
- [x] Bestehende Absenzen können bearbeitet werden (Typ, Datum, Begründung — Status bleibt erhalten)
- [x] Absenzen können mit Bestätigungsabfrage gelöscht werden

---

### US-HR-10 · Abwesenheitskalender einsehen

> **Als** HR-Mitarbeiterin  
> **möchte ich** einen Kalender sehen, der alle Abwesenheiten aller Mitarbeiter auf einen Blick darstellt,  
> **damit** ich Personalengpässe frühzeitig erkennen und die Planung unterstützen kann.

**Betroffene Komponenten:**
- Frontend: `hr-web` → neue Seite `/absences/calendar`
- Backend: `absence-vacation-service` → `GET /api/absences` (mit Monats-/Jahresfilter, bereits vorhanden)

**Akzeptanzkriterien:**

- [ ] Monatsansicht zeigt alle Abwesenheiten farblich nach Typ (Ferien = grün, Krank = rot, Sonstige = grau)
- [ ] Mitarbeitername wird beim Hover / Klick auf einen Eintrag angezeigt
- [ ] Navigation zwischen Monaten (zurück / vorwärts)
- [ ] Filterung nach Team oder Schichtleiter möglich
- [ ] Tage mit mehr als 3 gleichzeitigen Abwesenheiten werden hervorgehoben

**Status: Nicht implementiert.** Backend-Endpunkt (`GET /api/absences`) ist vorhanden – nur das Frontend-Kalender-Widget fehlt noch.

---

## Technische Referenz

### Implementierte Backend-Endpoints

| Service | Methode | Endpoint | Status |
|---|---|---|---|
| user-role-service | GET | `/api/users` | ✅ |
| user-role-service | GET | `/api/users/:id` | ✅ |
| user-role-service | POST | `/api/users` | ✅ |
| user-role-service | PUT | `/api/users/:id` | ✅ |
| user-role-service | DELETE | `/api/users/:id` | ✅ (Soft-Delete) |
| time-service | GET | `/api/time/total` | ✅ |
| time-service | GET | `/api/time/month/:id` | ✅ |
| billing-service | GET | `/api/billing/invoices` | ✅ |
| billing-service | GET | `/api/billing/invoices/:id` | ✅ |
| billing-service | POST | `/api/billing/invoices` | ✅ |
| billing-service | PUT | `/api/billing/invoices/:id/send` | ✅ |
| billing-service | PUT | `/api/billing/invoices/:id/pay` | ✅ |
| absence-vacation-service | GET | `/api/absences` | ✅ |
| absence-vacation-service | GET | `/api/absences/pending` | ✅ |
| absence-vacation-service | POST | `/api/absences` | ✅ |
| absence-vacation-service | PUT | `/api/absences/:id/approve` | ✅ |
| absence-vacation-service | PUT | `/api/absences/:id/reject` | ✅ |
| absence-vacation-service | PUT | `/api/absences/:id` | ✅ |
| absence-vacation-service | DELETE | `/api/absences/:id` | ✅ |

### Frontend-Seiten (hr-web)

| Route | Komponente | User Stories |
|---|---|---|
| `/users` | `UsersPage` | US-HR-01, US-HR-02, US-HR-03 |
| `/time` | `TimePage` | US-HR-04, US-HR-05 |
| `/invoices` | `InvoicesPage` | US-HR-06, US-HR-07 |
| `/absences` | `AbsencesPage` | US-HR-08, US-HR-09 |
| `/absences/calendar` | *(nicht implementiert)* | US-HR-10 |
