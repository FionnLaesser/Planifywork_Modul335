# Tests & CI-Pipeline – Workforce Management System

**Für wen:** Alle Teammitglieder  
**Zweck:** Erklärt wie die automatischen Tests funktionieren, was die CI-Pipeline prüft und was zu tun ist wenn etwas rot wird.

---

## Kurzfassung

Jedes Mal wenn jemand Code auf `main` pusht oder einen Pull Request erstellt, läuft automatisch eine Pipeline auf GitHub. Sie prüft ob das System noch funktioniert. Wenn sie grün ist, ist alles in Ordnung. Wenn sie rot ist, muss das Problem behoben werden bevor der Code gemergt werden darf.

---

## 1 – Tests lokal ausführen

### Voraussetzung

Alle Docker-Container müssen laufen:

```bash
docker compose up -d
```

### Test starten

```bash
node tests/api-test.js
```

### Erwartete Ausgabe

```
Workforce Management System – API-Testlauf
Ziel: http://localhost:8000

▸ Auth & Login
  ✔ Login admin → Rolle ADMIN
  ✔ Login hr.mueller → Rolle HR
  ...

━━━ Ergebnis: 54/54 Tests bestanden – alles grün
```

Ein `✘` bedeutet ein Test ist fehlgeschlagen. Der Text daneben erklärt was erwartet wurde und was tatsächlich zurückkam.

---

## 2 – Was die Tests prüfen

Die Tests rufen die echten API-Endpunkte über den Gateway (`localhost:8000`) auf — genau so wie die Frontends es auch tun. Es werden keine Datenbank-Einträge direkt geprüft, sondern nur die HTTP-Antworten der Services.

### Auth & Login (7 Tests)

Prüft ob der Login für alle vier Rollen funktioniert und ob Sicherheitsregeln greifen.

| Was geprüft wird | Warum wichtig |
|---|---|
| Jede Rolle kann sich einloggen und bekommt einen JWT-Token | Grundvoraussetzung für alles andere |
| Falsches Passwort → HTTP 401 | Sicherheit |
| Anfrage ohne Token → HTTP 401/403 | Sicherheit |

---

### Benutzerverwaltung (12 Tests) — User & Role Service

Prüft die komplette CRUD-Logik für Benutzer. Diese Endpunkte werden von HR-Web und Admin-Web genutzt.

| Was geprüft wird | User Story |
|---|---|
| Alle User laden, nach Rolle filtern | US-HR-03 |
| Neuen Schichtleiter anlegen | US-HR-01 |
| Doppelter Benutzername wird abgelehnt | US-HR-01 AK-5 |
| Benutzerdaten bearbeiten, Änderung wird gespeichert | US-HR-02 |
| Rolle eines Users ändern (Admin-Funktion) | US-ADM-013 |
| User deaktivieren → Login ist danach gesperrt | US-HR-02 AK-4 |

---

### Arbeitsplanung (13 Tests) — Planning Service

Prüft den vollständigen Planungsablauf des Schichtleiters.

| Was geprüft wird | User Story |
|---|---|
| Arbeitsplan erstellen, ist danach abrufbar, Status = DRAFT | US-SL-002 |
| Schicht hinzufügen, Stunden werden automatisch berechnet (08:00–17:00 = 9h) | US-SL-003 |
| Geplante Stunden und Reststunden werden im Plan angezeigt | US-SL-004 |
| Warnung wenn weniger als 95% des HR-Kontingents geplant | US-SL-005 |
| Warnung wenn HR-Kontingent überschritten | US-SL-005 |
| Plan veröffentlichen → Status = PUBLISHED | US-SL-006 |
| Mitarbeiter-Kalender enthält veröffentlichte Schichten | US-SL-006 AK-2 |

> **Hinweis zu Testdaten:** Schichten werden auf das Datum `2099-01-15` gelegt. Das liegt absichtlich weit in der Zukunft, damit mehrfache Testläufe nicht kollidieren (der Planning Service prüft ob ein Mitarbeiter schon eingeplant ist).

---

### Absenzen & Ferien (9 Tests) — Absence Service

Prüft den Genehmigungsablauf von Ferienanfragen.

| Was geprüft wird | User Story |
|---|---|
| Absenz erfassen (Typ, Zeitraum, Begründung) | US-HR-09 |
| Alle Absenzen laden, offene Anträge laden | US-HR-09 / US-HR-08 |
| Absenz bearbeiten (Typ und Dates ändern) | US-HR-09 |
| Ferienantrag genehmigen → Status = APPROVED | US-HR-08 |
| Ferienantrag ablehnen mit Begründung → Status = REJECTED | US-HR-08 AK-6 |

---

### Rechnungen (8 Tests) — Billing Service

Prüft den vollständigen Rechnungsablauf.

| Was geprüft wird | User Story |
|---|---|
| Rechnung mit Positionen erstellen → Status = DRAFT | US-HR-06 |
| Alle Rechnungen und Detail abrufen | US-HR-07 |
| Rechnung versenden → Status = SENT | US-HR-07 |
| Als bezahlt markieren → Status = PAID | US-HR-07 |

---

### Stunden (2 Tests) — Time Service

| Was geprüft wird | User Story |
|---|---|
| Gesamtstunden aller Mitarbeiter abrufen | US-HR-04 |
| Monatsauswertung für einen Mitarbeiter | US-HR-05 |

---

### Aufräumen (3 Tests)

Am Ende löscht das Script alle Testdaten die es angelegt hat (Absenzen + Testbenutzer). Arbeitspläne können nicht gelöscht werden (kein DELETE-Endpunkt im Planning Service) und bleiben in der DB stehen — das ist bekannt und stört nicht.

---

## 3 – CI-Pipeline auf GitHub

### Wann läuft sie?

- Bei jedem Push auf `main`
- Bei jedem Pull Request auf `main`

### Wo sehe ich den Status?

GitHub → Repository → Tab **Actions**

Jeder Commit zeigt in der Commit-Liste ein ✅ (grün) oder ❌ (rot) Icon direkt neben dem Commit-Hash.

---

### Die drei Jobs

Die Pipeline besteht aus drei unabhängigen Jobs die parallel laufen:

```
Push auf main
     │
     ├── Job 1: API Tests ──────────── Docker starten → 54 Tests → Docker stoppen
     ├── Job 2: Frontend Build ──────── npm install + npm build (hr-web, shiftlead-web)
     └── Job 3: Backend Compile ─────── mvn compile (alle 8 Services)
```

**Alle drei müssen grün sein.** Einer schlägt fehl → Pipeline rot → Pull Request kann nicht gemergt werden.

---

### Job 1 – API Tests (der wichtigste)

Dieser Job simuliert einen frischen Rechner ohne laufende Container:

1. Checkt den Code aus
2. Baut alle 16 Docker-Container neu (`docker compose up --build -d`)
3. Wartet bis MySQL den Status `healthy` hat
4. Wartet bis die Seed-User angelegt wurden
5. Wartet bis der API-Gateway HTTP-Anfragen beantwortet
6. Führt `node tests/api-test.js` aus
7. Bei Fehler: gibt die letzten 50 Log-Zeilen aller Services aus
8. Räumt auf: `docker compose down -v`

Dauer: ca. 8–12 Minuten (Maven-Build + Spring-Boot-Start)

---

### Job 2 – Frontend Build

Prüft ob hr-web und shiftlead-web ohne Fehler kompilieren:

```
npm install → npm run build
```

Schlägt fehl wenn JSX-Fehler, fehlende Imports oder Syntax-Fehler vorhanden sind.  
Dauer: ca. 30–60 Sekunden pro App.

---

### Job 3 – Backend Compile

Prüft ob alle 8 Spring Boot Services ohne Java-Compilerfehler bauen:

```
mvn compile
```

Schlägt fehl bei Syntax-Fehlern, falschen Imports oder fehlenden Klassen.  
Dauer: ca. 2–3 Minuten (mit Maven-Cache deutlich schneller).

---

## 4 – Was tun wenn die Pipeline rot ist?

### Pipeline rot finden

1. GitHub → Actions → den fehlgeschlagenen Run anklicken
2. Den roten Job anklicken
3. Den roten Schritt aufklappen → Fehlermeldung lesen

---

### Typische Fehler und Lösungen

**`✘ Login admin → Rolle ADMIN` oder ähnliche Auth-Fehler**  
→ auth-service oder user-role-service hat ein Problem. Logs im Job „Logs bei Fehler anzeigen" prüfen.

**`✘ POST /api/users – Schichtleiter anlegen`**  
→ user-role-service funktioniert nicht oder das DTO hat sich geändert. Schauen ob jemand `CreateUserRequest.java` geändert hat.

**`✘ PUT .../approve – genehmigen`**  
→ absence-vacation-service hat ein Problem. Bekannter Fix: `@RequestBody(required = false)` im Controller.

**Frontend Build schlägt fehl**  
→ Meist ein JSX-Fehler oder ein fehlender Import in einer `.jsx`-Datei. Fehlermeldung im Job lesen, lokal `npm run build` ausführen.

**Backend Compile schlägt fehl**  
→ Java-Compilerfehler. Fehlermeldung zeigt genau welche Klasse und Zeile. Lokal mit `mvn compile` prüfen.

**MySQL wird nicht healthy**  
→ Selten. Meistens ein Port-Konflikt auf dem Runner. Pipeline nochmal starten (`Re-run all jobs`).

---

## 5 – Regeln für Pull Requests

Bevor ein Branch auf `main` gemergt werden darf, muss gelten:

1. ✅ Alle 3 CI-Jobs sind grün
2. ✅ Kein Merge-Konflikt
3. ✅ Kurze Gegenkontrolle durch eine andere Person (Code Review)

> Diese Regeln können unter **GitHub → Settings → Branches → Branch protection rules** für `main` erzwungen werden. Dann ist der Merge-Button gesperrt bis die Pipeline grün ist.

---

## 6 – Was die CI *nicht* prüft

Folgendes muss weiterhin manuell getestet werden:

| Bereich | Grund |
|---|---|
| Flutter Mobile App | Läuft nur auf Android/iOS-Emulator, nicht in GitHub Actions |
| Browser-UI (Login, Navigation, Formulare) | Kein Playwright/Cypress eingerichtet |
| Aufträge (Admin-Web) | Order Service API noch nicht vollständig implementiert |
| Abwesenheitskalender (US-HR-10) | Nur Backend vorhanden, Frontend-Widget fehlt noch |

---

## 7 – Testlauf Ergebnis (Stand 01.06.2026)

```
━━━ Ergebnis: 54/54 Tests bestanden – alles grün
```

CI-Pipeline: ✅ Alle Jobs bestanden  
Laufzeit gesamt: ~10 Minuten
