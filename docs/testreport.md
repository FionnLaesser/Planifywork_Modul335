# Testbericht – Workforce Management System

**Projekt:** Modul 335 – Mobile Applikation  
**Datum:** 01.06.2026  
**Testlauf:** `node tests/api-test.js`  
**Ergebnis: 54 / 54 Tests bestanden**

---

## Testergebnis Übersicht

| Service | Getestet | Bestanden | Fehlgeschlagen |
|---|---|---|---|
| Auth & Login | 4 | 4 | 0 |
| User & Role Service | 12 | 12 | 0 |
| Planning Service | 13 | 13 | 0 |
| Absence Service | 9 | 9 | 0 |
| Billing Service | 8 | 8 | 0 |
| Time Service | 2 | 2 | 0 |
| Aufräumen (Cleanup) | 3 | 3 | 0 |
| **Total** | **54** | **54** | **0** |

---

## Auth & Login

| Test | User Story | Ergebnis |
|---|---|---|
| Login `admin` → Rolle ADMIN | US-ADM-021 | ✅ |
| Login `hr.mueller` → Rolle HR | US-ADM-021 | ✅ |
| Login `sl.huber` → Rolle SHIFT_LEAD | US-ADM-021 | ✅ |
| Login `emp.meier` → Rolle EMPLOYEE | US-ADM-021 | ✅ |
| Token-Validierung | – | ✅ |
| Falsches Passwort → 401 | US-ADM-021 AK-2 | ✅ |
| Kein Token → 401/403 | US-ADM-021 AK-2 | ✅ |

---

## User & Role Service

| Test | User Story | Ergebnis |
|---|---|---|
| Alle User laden | US-HR-03 | ✅ |
| Mindestens 4 Seed-User vorhanden | US-HR-03 | ✅ |
| Filter nach Rolle SHIFT_LEAD | US-HR-03 | ✅ |
| Filter nach Rolle EMPLOYEE | US-HR-03 | ✅ |
| Schichtleiter anlegen (POST) | US-HR-01 | ✅ |
| User-Detail abrufen | US-HR-01 | ✅ |
| Doppelter Benutzername → Fehler | US-HR-01 AK-5 | ✅ |
| Benutzer bearbeiten (PUT) | US-HR-02 | ✅ |
| Vorname wurde aktualisiert | US-HR-02 | ✅ |
| Rolle ändern (Admin) | US-ADM-013 | ✅ |
| Benutzer deaktivieren | US-HR-02 | ✅ |
| Deaktivierter User → Login verweigert | US-HR-02 AK-4 | ✅ |

---

## Planning Service

| Test | User Story | Ergebnis |
|---|---|---|
| Arbeitsplan erstellen (POST) | US-SL-002 | ✅ |
| Plan nach Erstellung abrufbar | US-SL-002 AK-3 | ✅ |
| Status ist DRAFT | US-SL-002 | ✅ |
| approvedHours korrekt gespeichert | US-SL-002 AK-2 | ✅ |
| Schicht hinzufügen (POST) | US-SL-003 | ✅ |
| Schicht-Stunden automatisch berechnet (9 h) | US-SL-003 AK-2 | ✅ |
| plannedHours im Plan aktualisiert | US-SL-004 AK-1 | ✅ |
| remainingHours vorhanden | US-SL-004 AK-2 | ✅ |
| overLimit = false bei 9 / 100 h | US-SL-005 AK-1 | ✅ |
| underPlanned = true bei < 95 h | US-SL-005 AK-2 | ✅ |
| Arbeitsplan veröffentlichen (PUT) | US-SL-006 | ✅ |
| Status ist PUBLISHED | US-SL-006 AK-1 | ✅ |
| Mitarbeiter-Kalender enthält veröffentlichte Schichten | US-SL-006 AK-2 | ✅ |

---

## Absence Service

| Test | User Story | Ergebnis |
|---|---|---|
| Absenz erfassen (POST) | US-HR-09 | ✅ |
| Alle Absenzen laden | US-HR-09 | ✅ |
| Offene Anträge laden (pending) | US-HR-08 | ✅ |
| Absenz bearbeiten (PUT) | US-HR-09 | ✅ |
| Ferienantrag genehmigen (approve) | US-HR-08 | ✅ |
| Status ist APPROVED | US-HR-08 AK-1 | ✅ |
| Ferienantrag ablehnen (reject) | US-HR-08 | ✅ |
| Status ist REJECTED | US-HR-08 AK-2 | ✅ |
| Ablehnungsgrund gespeichert | US-HR-08 AK-6 | ✅ |

---

## Billing Service

| Test | User Story | Ergebnis |
|---|---|---|
| Rechnung erstellen (POST) | US-HR-06 | ✅ |
| Status ist DRAFT | US-HR-06 | ✅ |
| Alle Rechnungen laden | US-HR-07 | ✅ |
| Rechnungsdetail abrufen | US-HR-07 | ✅ |
| Rechnung versenden → SENT | US-HR-07 | ✅ |
| Status ist SENT | US-HR-07 | ✅ |
| Als bezahlt markieren → PAID | US-HR-07 | ✅ |
| Status ist PAID | US-HR-07 | ✅ |

---

## Time Service

| Test | User Story | Ergebnis |
|---|---|---|
| Gesamtstunden aller Mitarbeiter | US-HR-04 | ✅ |
| Monatsauswertung pro Mitarbeiter | US-HR-05 | ✅ |

---

## Bekannte Lücken (nicht automatisch getestet)

| Bereich | Grund | Empfehlung |
|---|---|---|
| Check-in / Check-out (Flutter) | Mobile App kann nicht in CI getestet werden | Manueller Test auf Emulator |
| US-SL-009 Arbeitszeiten Schichtleiter | Gleiche Endpunkte wie HR-Time, bereits abgedeckt | – |
| US-SL-007 Aufträge einsehen | Order Service API noch nicht vollständig implementiert | Implementieren, dann Testfall ergänzen |
| US-HR-10 Abwesenheitskalender | Nur Backend-Endpunkt vorhanden, kein Frontend | Kalender-Widget implementieren |
| Frontend E2E (Login, Navigation, Formulare) | Kein Playwright / Cypress eingerichtet | Optional: E2E-Tests ergänzen |
| Admin-Web lokaler State | Aufträge, Konzepte etc. sind localStorage-only | Wenn Order Service implementiert: Testfall ergänzen |

---

## Testdaten-Strategie

- Alle Testdaten verwenden eindeutige Timestamps im Benutzernamen (`sl.auto.{timestamp}`)
- Schichten werden auf Datum `2099-01-15` angelegt (weit in der Zukunft, keine Kollision mit echten Daten)
- Am Ende jedes Laufs werden alle erstellten Absenzen und Testbenutzer automatisch gelöscht
- Arbeitspläne werden nicht gelöscht (kein DELETE-Endpunkt im Planning Service) — akkumulieren sich in der DB

---

## Testlauf lokal

```bash
# Voraussetzung: alle Container laufen
docker compose up -d

# Tests ausführen
node tests/api-test.js
```

Node 18+ erforderlich (nutzt built-in fetch).
