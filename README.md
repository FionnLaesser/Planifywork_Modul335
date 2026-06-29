# Workforce Management System

Schulprojekt Modul 335 – Mobile Applikation  
Klasse: IFZM-2426 009 Rudy-Martin-Fionn-Jannik

![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3-6DB33F?logo=springboot&logoColor=white)
![Flutter](https://img.shields.io/badge/Flutter-3.3+-02569B?logo=flutter&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Docker](https://img.shields.io/badge/Docker_Compose-2496ED?logo=docker&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?logo=mongodb&logoColor=white)

---

## Inhaltsverzeichnis

1. [Projektidee](#1-projektidee)
2. [Technologie-Stack](#2-technologie-stack)
3. [Rollen & Zugänge](#3-rollen--zugänge)
4. [Gesamtarchitektur](#4-gesamtarchitektur)
5. [Projektstruktur](#5-projektstruktur)
6. [Services im Detail](#6-services-im-detail)
   - [API Gateway](#61-api-gateway--port-8000)
   - [Auth Service](#62-auth-service--port-8001)
   - [User & Role Service](#63-user--role-service--port-8002)
   - [Order Service](#64-order-service--port-8003)
   - [Planning Service](#65-planning-service--port-8004)
   - [Time Service](#66-time-service--port-8005)
   - [Absence & Vacation Service](#67-absence--vacation-service--port-8006)
   - [Billing Service](#68-billing-service--port-8007)
   - [Report / Media Service](#69-report--media-service--port-8008)
7. [Frontend-Apps](#7-frontend-apps)
8. [Mobile App (Flutter)](#8-mobile-app-flutter)
9. [Datenbanken](#9-datenbanken)
10. [Docker & lokale Umgebung](#10-docker--lokale-umgebung)
11. [Port-Übersicht](#11-port-übersicht)
12. [Arbeitsweise im Team (Kanban)](#12-arbeitsweise-im-team-kanban)
13. [Konventionen & Coding-Standards](#13-konventionen--coding-standards)

---

## Vorschau

### Web-Applikationen

| App | Screenshot 1 | Screenshot 2 | Screenshot 3 |
|---|---|---|---|
| **HR Web** `:3002`<br>`hr.mueller` / `password` | ![HR Dashboard](docs/screenshots/screenshot_hr_dashboard.png) | ![Stundenfreigabe](docs/screenshots/screenshot_hr_stundenfreigabe.png) | ![Rapport-Bilder](docs/screenshots/web_hr_rapports.png) |
| **Schichtleiter Web** `:3003`<br>`sl.huber` / `password` | ![Arbeitsplanung](docs/screenshots/screenshot_sl_planung.png) | | |
| **Admin Web** `:3001`<br>`admin` / `password` | ![Admin Dashboard](docs/screenshots/screenshot_admin_dashboard.png) | | |

> **Rapport-Bilder** (`/rapports`): HR wählt einen Mitarbeiter aus dem Dropdown — die App lädt alle via Mobile App hochgeladenen Fotos aus MongoDB und zeigt sie mit Datum, Auftrags-ID und Notiz an. Bild wird per Klick auf "Bild laden" via API Gateway mit JWT-Auth abgerufen.

---

### Mobile App (Flutter · Login: `emp.meier` / `password`)

| Login | Check-in/out | Kalender |
|---|---|---|
| ![Login](docs/screenshots/mobile_login.png) | ![Checkin](docs/screenshots/mobile_checkin.png) | ![Kalender](docs/screenshots/mobile_kalender.png) |

| Absenzen | Rapport-Upload |
|---|---|
| ![Absenzen](docs/screenshots/mobile_absenzen.png) | ![Rapport](docs/screenshots/mobile_rapport.png) |

> **Kalender**: Zeigt nur veröffentlichte Schichten. Der Schichtleiter muss den Arbeitsplan unter `/planning` zuerst veröffentlichen (Status → PUBLISHED), danach erscheinen die Schichten im Mitarbeiter-Kalender.  
> **Rapport-Upload**: Foto wird direkt aus der Kamera aufgenommen und via `POST /api/media/upload` (Multipart) durch den API Gateway an den Report/Media Service weitergeleitet, wo es in **MongoDB** gespeichert wird.

---

### MongoDB-Nachweis: Hochgeladenes Rapportbild

![MongoDB Upload](docs/screenshots/mobile_noSQLupload.png)

> Das Bild ist als Binary-Dokument in der Collection `media_reports` der Datenbank `workforce-media` gespeichert. Einsehbar via **Mongo Express** unter http://localhost:8081 oder im HR-Web unter `/rapports`.

---

## Änderungshistorie

### 2026-06-22 — Debugging-Session & neue Seite: Rapport-Bilder

#### Übersicht

| Bereich | Typ | Kurzbeschreibung |
|---|---|---|
| Planning Service | Bugfix | CORS-Doppelheader behoben |
| HR-Web | Bugfix | Stundenfreigabe mit `Promise.allSettled` stabilisiert |
| SL-Web | Bugfix | Arbeitsplanung: Silent-Fehler sichtbar + Auto-Retry |
| Mobile App | Bugfix | Bild-Upload: Gateway-Buffer, Content-Type, Timeout |
| Report-Media Service | Bugfix | `authenticationEntryPoint` → 401 statt 403 |
| HR-Web | Feature | Neue Seite `/rapports` mit Lazy-Image-Loading |
| Docker / CI | Stabilität | Health-Checks und Timeouts angepasst |
| Dokumentation | Docs | 11 Screenshots, Vorschau-Galerie, Flutter-Anleitung |

---

#### 1. Bugfix: CORS-Doppelheader im Planning Service

**Problem**: HR-Stundenfreigabe und SL-Arbeitsplanung lieferten einen doppelten `Access-Control-Allow-Origin`-Header — der Browser blockierte daraufhin alle Requests an `/api/planning/**`.

**Ursache**: Der Planning Service setzte den CORS-Header auf zwei Wegen gleichzeitig:
1. Eigene `corsConfigurationSource`-Bean in `SecurityConfig`
2. `@CrossOrigin`-Annotation direkt auf dem Controller

Im System gilt: **CORS wird ausschliesslich vom API Gateway verwaltet** — alle anderen Services müssen `cors.disable()` setzen.

```mermaid
graph LR
    Browser -->|"preflight / request"| GW

    subgraph GW["API Gateway :8000\n(einzige CORS-Quelle)"]
        CORS["Access-Control-Allow-Origin\nAccess-Control-Allow-Methods\nAccess-Control-Allow-Headers"]
    end

    GW --> PL["Planning Service\nvorher: cors.disable() FEHLT ❌\nnachher: cors.disable() ✅"]
    GW --> AU["Auth Service\ncors.disable() ✅"]
    GW --> US["User-Role Service\ncors.disable() ✅"]
    GW --> AB["Absence Service\ncors.disable() ✅"]
    GW --> RM["Report-Media Service\ncors.disable() ✅"]

    style GW fill:#bbf7d0,stroke:#15803d,color:#14532d
    style PL fill:#fecaca,stroke:#dc2626,color:#7f1d1d
```

**Fix**:
- `corsConfigurationSource`-Bean + Import aus `SecurityConfig.java` entfernt, `cors.disable()` eingesetzt
- `@CrossOrigin`-Annotation + Import aus `PlanningController.java` entfernt
- 2 Regressionstests in `PlanningControllerTests` sichern, dass der Service keinen CORS-Header direkt setzt

---

#### 2. Bugfix: Bild-Upload Mobile App

**Problem**: Upload von Kamerabildern schlug aus 3 unabhängigen Gründen fehl.

```mermaid
sequenceDiagram
    actor App as Flutter App
    participant GW as API Gateway :8000
    participant RS as Report-Media Service
    participant DB as MongoDB

    rect rgb(254,202,202)
        Note over App,DB: VORHER — 3 parallele Fehlerquellen
        App->>GW: POST /api/media/upload (Kamerabild ~4 MB)
        Note over GW: ❌ 256 KB In-Memory-Limit → bricht ab
        Note over App: ❌ Content-Type: application/octet-stream<br/>(kein Datei-Extension → Auto-detect schlägt fehl)
        Note over App: ❌ Timeout: 8 s (globaler Request-Timeout)
    end

    rect rgb(187,247,208)
        Note over App,DB: NACHHER — alle 3 Ursachen behoben
        App->>GW: POST /api/media/upload<br/>Content-Type: image/jpeg ✅  Timeout: 30 s ✅
        Note over GW: max-in-memory-size: 10 MB ✅
        GW->>RS: weiterleiten
        RS->>DB: Bild binär speichern
        RS-->>App: 201 Created ✅
    end
```

**Fixes im Detail**:

| # | Problem | Datei | Änderung |
|---|---|---|---|
| 1 | Gateway bricht Upload bei > 256 KB ab | `api-gateway/application.yml` | `spring.codec.max-in-memory-size: 10MB` |
| 2 | Auto-detect Content-Type schlägt bei temp. Pfaden fehl | `mobile/lib/services/api_service.dart` | Explizit `image/jpeg` / `image/png` via `http_parser` |
| 3 | Globaler 8s-Timeout zu knapp für grosse Bilder | `mobile/lib/services/api_config.dart` | Separater `uploadTimeout: 30s` |
| 4 | Kein Token → 403 statt 401 (kein `authenticationEntryPoint`) | `report-media-service/.../SecurityConfig.java` | `authenticationEntryPoint` ergänzt |

---

#### 3. Bugfix: Race Condition bei HR-Stundenfreigabe & SL-Arbeitsplanung

**Problem**: Seiten zeigten Fehler oder deaktivierte Buttons, wenn Services beim ersten Seitenaufruf direkt nach dem Docker-Start noch nicht vollständig bereit waren.

```mermaid
graph TD
    A[Seitenaufruf direkt nach docker compose up] --> B{Services bereit?}
    B -->|Nein| C_old["VORHER: Promise.all\n→ ein Fehler = alles leer\nButton bleibt deaktiviert\nkeine Erklärung"]
    B -->|Nein| D_new["NACHHER: Promise.allSettled\n→ Teilfehler werden isoliert\nroter Hinweis sichtbar\nAuto-Retry nach 5 s"]
    B -->|Ja| E[Seite lädt normal]
    D_new -->|5 s später| B

    style C_old fill:#fecaca,stroke:#dc2626,color:#7f1d1d
    style D_new fill:#bbf7d0,stroke:#15803d,color:#14532d
```

---

#### 4. Docker-Stabilität & CI

**Docker Compose**:
- Alle Spring-Boot-Services warten via `condition: service_healthy` auf MySQL / MongoDB
- `nc`-basierte Health-Checks entfernt (BusyBox-Inkompatibilität: SIGALRM Exit-Code)
- `user-role-service` seeded beim Start automatisch 160h Stundenkontingent für `sl.huber` → frische Umgebung sofort nutzbar

**CI-Timeouts**:

| Schritt | Vorher | Nachher |
|---|---|---|
| Seed-User-Warte | 120 s | 150 s |
| API-Gateway-Warte | 90 s | 150 s |
| Job-Timeout | 15 min | 25 min |

---

#### 5. Neue Seite: HR-Web Rapport-Bilder (`/rapports`)

HR-Benutzer können Rapportfotos einsehen, die Mitarbeiter via Mobile App hochgeladen haben.

```mermaid
graph LR
    subgraph Mobile["Mobile App (Flutter)"]
        MA["Mitarbeiter\nfotografiert & lädt hoch"]
    end

    subgraph Backend["Backend"]
        GW["API Gateway :8000"]
        RS["Report-Media Service :8087"]
        DB[("MongoDB\nmedia_reports")]
    end

    subgraph HRWeb["HR-Web (React)"]
        DP["/rapports\nDropdown → Mitarbeiter wählen"]
        IL["Lazy Image Load\n→ Blob URL"]
        BW["Bild im Browser"]
    end

    MA -->|"POST /api/media/upload\nJWT + multipart"| GW
    GW --> RS --> DB

    DP -->|"GET /api/media/employee/{id}"| GW
    GW --> RS --> DB --> RS --> GW --> IL
    IL -->|"URL.createObjectURL()"| BW

    style GW fill:#dbeafe,stroke:#1d4ed8,color:#1e3a8a
    style DB fill:#fef9c3,stroke:#ca8a04,color:#713f12
```

**Details**:
- Mitarbeiter-Dropdown: `GET /api/users?role=EMPLOYEE`
- Rapport-Liste: `GET /api/media/employee/{id}` — zeigt Datum, Auftrags-ID, Notiz, Dateigrösse
- Bilder werden **lazy** per Klick geladen: Axios `responseType: 'blob'` → `URL.createObjectURL()` (direkter `<img src>` geht nicht, da JWT-Header nötig)
- Blob-URLs beim Seitenverlassen via `URL.revokeObjectURL()` freigegeben

---

#### 6. Tests & CI

| Test-Datei | Neue Tests | Was wird geprüft |
|---|---|---|
| `PlanningControllerTests.java` | +2 | Service setzt keinen CORS-Header direkt |
| `MediaControllerTests.java` | +7 | Upload JPEG/PNG, kein Token→401, falscher Typ→400, 404, listByEmployee, Upload mit Auftrags-ID |
| `api-test.js` | +6 | Media: Listing HR/Admin/Employee, kein Token→401, 404, Order-List |
| CI Maven `-pl` | +1 Service | `report-media-service` neu im Backend-Test-Job |

---

#### 7. Screenshot-Dokumentation

11 Screenshots in `docs/screenshots/` — Vorschau-Galerie oben im README ergänzt.

| Datei | Inhalt |
|---|---|
| `mobile_login.png` | Flutter Login-Screen |
| `mobile_checkin.png` | Check-in / Check-out |
| `mobile_kalender.png` | Kalenderansicht |
| `mobile_absenzen.png` | Absenz einreichen |
| `mobile_rapport.png` | Rapport mit Bild-Upload |
| `mobile_noSQLupload.png` | MongoDB-Nachweis des Uploads |
| `screenshot_admin_dashboard.png` | Admin-Dashboard |
| `screenshot_hr_dashboard.png` | HR-Dashboard |
| `screenshot_hr_stundenfreigabe.png` | HR Stundenfreigabe |
| `screenshot_sl_planung.png` | Schichtleiter Arbeitsplanung |
| `web_hr_rapports.png` | HR Rapport-Bilder Seite |

---

## Dokumentation

| Dokument | Beschreibung |
|---|---|
| [UML- & Architekturdiagramme](docs/diagrams.md) | Systemarchitektur, Klassendiagramm, ER-Diagramm, Sequenz- und Statusdiagramme (Mermaid) |
| [User Stories – HR](docs/userstories_hr.md) | User Stories mit Akzeptanzkriterien für die HR-Rolle |
| [User Stories – Schichtleiter](docs/userstories_schichtleiter.md) | User Stories mit Akzeptanzkriterien für die Schichtleiter-Rolle |
| [User Stories – Mitarbeiter](docs/userstories_mitarbeiter.md) | User Stories mit Akzeptanzkriterien für die Mitarbeiter-Rolle |
| [User Stories – Admin](docs/userstories_admin.md) | User Stories mit Akzeptanzkriterien für die Admin-Rolle |
| [Tests & CI-Pipeline](docs/testing-and-ci.md) | Wie Tests ausgeführt werden, was die CI-Pipeline prüft, was bei Fehlern zu tun ist |
| [Testbericht](docs/testreport.md) | Ergebnisse des automatischen API-Testlaufs (54/54 Tests bestanden) |
| [OWASP Top 10 Testplan](docs/owasp-testplan.md) | Sicherheits-Testplan mit OWASP-Kategorien, Befunden, Verbesserungen und offenen Punkten |
| [Flipper Auth Integration](docs/flipper-auth-integration.md) | Übernommene Flipper-, HCE-, ESP32- und Auth-Service-Teile |

---

## Quick Start – System starten & testen

### Voraussetzungen

- **Docker Desktop** installiert und gestartet
- Ports **3001–3004**, **8000–8009**, **3307**, **27017**, **8080**, **8081** sind frei

---

### Schritt 1 – Alles starten

Im Stammverzeichnis des Projekts (`Modul_335_Mobile_Applikation/`) ausführen:

**Erster Start oder nach einem Reset:**
```bash
docker compose down -v
docker compose up --build -d
```

**Folgestarts** (kein Code geändert, Daten sollen erhalten bleiben):
```bash
docker compose up -d
```

> **Erster Build:** dauert 3–5 Minuten (Maven-Dependencies, npm install).  
> **Folgestarts:** gehen in Sekunden, da Images bereits gebaut sind.

**Wichtig – Demo-Accounts:** Die Benutzer (`admin`, `hr.mueller`, `sl.huber`, `emp.meier`) werden **nicht** per SQL-Seed angelegt, sondern beim Start des `user-role-service` per `CommandLineRunner` mit korrekt generiertem BCrypt-Hash. MySQL-Healthcheck stellt sicher, dass die Rollen bereits vorhanden sind, bevor der Service startet.

Seeding prüfen:
```bash
docker compose logs user-role-service | grep Seed
```
Erwartete Ausgabe:
```
Seed-User angelegt: admin (ADMIN)
Seed-User angelegt: hr.mueller (HR)
Seed-User angelegt: sl.huber (SHIFT_LEAD)
Seed-User angelegt: emp.meier (EMPLOYEE)
```

---

### Schritt 2 – Browser-Zugänge

| Anwendung | URL | Beschreibung |
|---|---|---|
| **Admin-Frontend** | http://localhost:3001 | Rollen, Benutzerverwaltung, Aufträge |
| **HR-Frontend** | http://localhost:3002 | Schichtleiter anlegen, Stunden, Rechnungen, Absenzen |
| **Schichtleiter-Frontend** | http://localhost:3003 | Arbeitspläne, Schichten, Kalender |
| **Flipper Auth Dashboard** | http://localhost:3004 | Flipper-Login/Logout-Challenges testen |
| **phpMyAdmin** | http://localhost:8080 | MySQL-Datenbankadmin |
| **Mongo Express** | http://localhost:8081 | MongoDB-Admin (kein Login nötig) |

---

### Schritt 3 – Einloggen

Alle Frontends verwenden denselben Login-Endpunkt über den API-Gateway (`localhost:8000`). Die Demo-Accounts werden beim Start automatisch angelegt.

| Benutzername | Passwort | Rolle | Frontend |
|---|---|---|---|
| `admin` | `password` | Admin | http://localhost:3001 |
| `hr.mueller` | `password` | HR | http://localhost:3002 |
| `sl.huber` | `password` | Schichtleiter | http://localhost:3003 |
| `emp.meier` | `password` | Mitarbeiter | Flutter Mobile App |

> Jedes Frontend prüft nach dem Login die Rolle im JWT. `admin` kann sich z.B. **nicht** im HR-Frontend einloggen — falsche Rolle wird verweigert.

---

### Schritt 4 – Was kann ich wo tun?

**Admin** → http://localhost:3001

| Seite | Funktion |
|---|---|
| Rollen | Benutzer aus der DB anzeigen, Rolle ändern, deaktivieren/aktivieren |
| Aufträge | Aufträge über den Order Service erstellen, bearbeiten, zuweisen und Status ändern |
| HR / Mitarbeiter | Übersicht (lokal) |

**HR** → http://localhost:3002

| Seite | URL | Funktion |
|---|---|---|
| Benutzerverwaltung | `/users` | Schichtleiter/Mitarbeiter anlegen, bearbeiten, deaktivieren |
| Stundenübersicht | `/time` | Gesamtstunden, Monatsdetail und Pausenverstösse prüfen |
| Stundenfreigabe | `/hour-budgets` | Monatliche HR-Stundenkontingente für Schichtleiter festlegen |
| Rechnungen | `/invoices` | Rechnungen erstellen, versenden, als bezahlt markieren |
| Lohnauszüge | `/payroll` | Monatslohn aus Stunden, Rate, Zuschlägen und Abzügen berechnen |
| Absenzen & Ferien | `/absences` | Ferienanträge genehmigen/ablehnen, Absenzen erfassen |

**Schichtleiter** → http://localhost:3003

| Seite | URL | Funktion |
|---|---|---|
| Arbeitsplanung | `/planning` | Arbeitspläne mit HR-Stundenfreigabe erstellen, Schichten hinzufügen, veröffentlichen |
| Aufträge | `/orders` | Zugewiesene Aufträge aus dem Order Service einsehen und Status ändern |
| Arbeitszeiten | `/time` | Gesamtstunden, Monatsdetails und Pausenverstösse der Mitarbeiter einsehen |

**Flutter Mobile App** (Login: `emp.meier` / `password`)

| Screen | Funktion |
|---|---|
| Check-in/out | `POST /api/time/checkin`, `POST /api/time/checkout`; Pausenminuten werden beim Check-out mitgegeben |
| Kalender | `GET /api/planning/calendar/{employeeId}` – zeigt veröffentlichte Schichten des laufenden Monats |
| Absenzen | `POST /api/absences`, `GET /api/absences/employee/{employeeId}` |
| Rapport | `POST /api/media/upload` mit optionaler Auftrags-ID; Bild wird in MongoDB gespeichert |

---

### Schritt 5 – Automatische API-Tests ausführen

Wenn der Docker-Stack läuft, können die API-Tests aus dem `tests`-Ordner gestartet werden:

```bash
cd tests
node api-test.js
```

Die Tests verwenden den lokalen API-Gateway unter `http://localhost:8000`.

---

### Schritt 6 – API direkt testen (optional)

```
POST http://localhost:8000/api/auth/login
Content-Type: application/json

{
  "username": "hr.mueller",
  "password": "password"
}
```

Antwort:
```json
{
  "token": "eyJ...",
  "role": "HR",
  "username": "hr.mueller",
  "userId": 2
}
```

Den `token`-Wert als `Authorization: Bearer <token>` Header für alle weiteren API-Anfragen verwenden.

---

### Container verwalten

```bash
# Status aller Container anzeigen
docker compose ps

# Logs eines bestimmten Services live verfolgen
docker compose logs -f api-gateway
docker compose logs -f user-role-service
docker compose logs -f hr-web

# Alle Container stoppen (Daten bleiben erhalten)
docker compose down

# Einzelnen Service nach Code-Änderung neu bauen und starten
docker compose up --build user-role-service -d

# Kompletter Reset – stoppt alles und löscht alle Datenbankdaten
docker compose down -v && docker compose up --build -d
```

> `down -v` löscht die MySQL- und MongoDB-Volumes. Beim nächsten Start legt `init.sql` Schema und Rollen neu an, der `user-role-service` seeded die Demo-Accounts.

---

### Bekannte Stolpersteine

| Problem | Ursache | Lösung |
|---|---|---|
| Login schlägt mit 401 fehl | MySQL-Volume mit falsch geseedeten Usern aus alter Version | `docker compose down -v && docker compose up --build -d` |
| Login leitet sofort zurück auf `/login` | 401-Response vom Login-Endpoint triggerte früher einen Hard-Redirect | Behoben in `api.js` aller drei Frontends (Interceptor prüft jetzt ob Request = Login-Endpoint) |
| Admin zeigt 403 und kann Mitarbeiter oder Aufträge nicht laden/speichern | Im Browser ist noch ein abgelaufener oder ungültiger JWT gespeichert | Admin-Web entfernt bei 401/403 den alten Loginzustand und leitet zur erneuten Anmeldung weiter; User- und Order-Service antworten bei ungültigen Tokens korrekt mit 401 |
| Leere Seite ohne Login-Formular | `vite.config.js` fehlte → JSX wurde nicht verarbeitet | Behoben, `vite.config.js` ist vorhanden |
| CORS-Fehler 403 | Gateway hatte kein `globalcors`, Services gaben doppelte CORS-Header | Behoben: Gateway verwaltet CORS, Services haben `cors.disable()` |
| Admin zeigt andere User als HR-Frontend | `adminSeed.js` enthielt lokale Dummy-User (Amir Suter, Lea Baumann etc.); HR- und Mitarbeiter-Formulare schrieben in `localStorage` statt in die DB | Behoben in `DashboardPage.jsx`: `saveHrUser` und `saveEmployee` rufen jetzt `POST /api/users` auf; Suche und Stats verwenden echte API-Daten |
| Nach Wechsel auf neuen Rechner zeigt Admin noch alte Daten | Browser-`localStorage` vom alten Rechner enthält veralteten Admin-State | DevTools → Application → Local Storage → `planifywork-admin-state-v1` löschen, Seite neu laden |
| CORS-Fehler „Es darf nur eine CORS-Kopfzeile verwendet werden" auf `/api/planning/**` | Planning Service hatte `corsConfigurationSource`-Bean in `SecurityConfig` **und** `@CrossOrigin` auf dem Controller gleichzeitig; CORS wird aber ausschliesslich vom API Gateway gesetzt | Beide Service-seitigen CORS-Konfigurationen entfernt, `cors.disable()` eingesetzt; gilt als Konvention für alle Services — niemals `@CrossOrigin` oder eigene `CorsConfigurationSource` in einem Service hinzufügen |
| Bild-Upload aus Mobile App schlägt fehl (kein 200, kein sinnvoller Fehler) | Spring Cloud Gateway hat ein Standard-In-Memory-Buffer-Limit von 256 KB; Kamerabilder sind grösser und werden vom Gateway abgebrochen, bevor der Report-Service sie sieht | `spring.codec.max-in-memory-size: 10MB` in `api-gateway/application.yml` setzen; Limit muss mindestens so gross sein wie `spring.servlet.multipart.max-file-size` im Report-Service |

---

## 1. Projektidee

Das **Workforce Management System** ist eine verteilte Applikation zur Verwaltung von Mitarbeitern, Arbeitszeiten, Aufträgen, Schichten und Rechnungen.

Das System besteht aus:

- **3 React-Webapplikationen** für Admin, HR und Schichtleiter (Desktop)
- **1 Flutter-Mobile-App** für Mitarbeiter (iOS / Android)
- **8 Spring-Boot-Microservices** als Backend
- **MySQL** für strukturierte Daten
- **MongoDB** für Bild-Uploads und Mediendaten
- **Docker Compose** zur lokalen Ausführung aller Komponenten

---

## 2. Technologie-Stack

| Bereich        | Technologie             | Version  |
|----------------|-------------------------|----------|
| Frontend Web   | React + Vite            | React 18 |
| Mobile         | Flutter                 | SDK 3.3+ |
| Backend        | Spring Boot             | 3.3      |
| API Gateway    | Spring Cloud Gateway    | 2023.0   |
| Authentifizierung | JWT (jjwt)           | 0.12.5   |
| Datenbank 1    | MySQL                   | 8.0      |
| Datenbank 2    | MongoDB                 | 7.0      |
| Container      | Docker + Docker Compose | –        |
| DB-Admin       | phpMyAdmin + Mongo Express | –     |
| HTTP Client    | Axios (React) / http (Flutter) | – |
| State (Flutter)| Provider               | 6.1      |
| Routing (React)| React Router DOM        | v6       |

---

## 3. Rollen & Zugänge

| Rolle        | Zugang                               | JWT-Rolle    | Test-Benutzer  | Passwort   |
|--------------|--------------------------------------|--------------|----------------|------------|
| Admin        | Admin Web – http://localhost:3001    | `ADMIN`      | `admin`        | `password` |
| HR           | HR Web – http://localhost:3002       | `HR`         | `hr.mueller`   | `password` |
| Schichtleiter| Schichtleiter Web – http://localhost:3003 | `SHIFT_LEAD` | `sl.huber` | `password` |
| Mitarbeiter  | Flutter Mobile App                   | `EMPLOYEE`   | `emp.meier`    | `password` |

Jedes Frontend prüft nach dem Login die Rolle im JWT-Token. Stimmt die Rolle nicht überein, wird der Zugang verweigert.

Die Testbenutzer werden beim ersten Start des `user-role-service` automatisch in der Datenbank angelegt (via `CommandLineRunner` in `UserRoleServiceApplication.java`). Voraussetzung: Die Rollen müssen in der `roles`-Tabelle vorhanden sein (wird via `database/mysql/init.sql` beim ersten Start von MySQL erledigt).

---

## 4. Gesamtarchitektur

```mermaid
graph TB
    subgraph Clients["Clients"]
        AW["React Admin Web\n:3001"]
        HW["React HR Web\n:3002"]
        SW["React Schichtleiter Web\n:3003"]
        MA["Flutter Mobile App\nAndroid / iOS"]
    end

    subgraph GWLayer["API Gateway"]
        GW["Spring Cloud Gateway :8000\nJWT-Prüfung · CORS · Routing"]
    end

    subgraph SVC["Backend Microservices (Spring Boot 3.3)"]
        AS["Auth Service\n:8001"]
        URS["User & Role Service\n:8002"]
        OS["Order Service\n:8003"]
        PS["Planning Service\n:8004"]
        TS["Time Service\n:8005"]
        AVS["Absence Service\n:8006"]
        BS["Billing Service\n:8007"]
        RMS["Report/Media Service\n:8008"]
    end

    subgraph DBLayer["Datenbanken"]
        MYSQL[("MySQL :3307\nworkforce DB\nBenutzer · Aufträge · Schichten\nZeiten · Absenzen · Rechnungen")]
        MONGO[("MongoDB :27017\nworkforce-media DB\nBilder · Rapport-Metadaten")]
    end

    AW & HW & SW & MA --> GW
    GW --> AS & URS & OS & PS & TS & AVS & BS & RMS
    AS & URS & OS & PS & TS & AVS & BS --> MYSQL
    RMS --> MONGO
```

> Detaillierte Diagramme (ER, Klassendiagramm, Sequenz-, Statusdiagramme) → [docs/diagrams.md](docs/diagrams.md)

---

## 5. Projektstruktur

```
Modul_335_Mobile_Applikation/
│
├── docker-compose.yml              # Startet alle Container
├── .gitignore
│
├── backend/                        # Spring Boot Microservices
│   ├── api-gateway/                # Zentraler Einstiegspunkt, JWT-Prüfung
│   ├── auth-service/               # Login, Logout, JWT erstellen
│   ├── user-role-service/          # Benutzerverwaltung, Rollen
│   ├── order-service/              # Auftragsmanagement
│   ├── planning-service/           # Arbeitsplanung, Schichten
│   ├── time-service/               # Check-in/out, Arbeitszeitberechnung
│   ├── absence-vacation-service/   # Absenzen und Ferien
│   ├── billing-service/            # Rechnungen
│   └── report-media-service/       # Bild-Upload (MongoDB)
│
├── frontend/                       # React Webapplikationen
│   ├── admin-web/                  # Admin-Oberfläche
│   ├── hr-web/                     # HR-Oberfläche
│   └── shiftlead-web/              # Schichtleiter-Oberfläche
│
├── mobile/                         # Flutter Mobile App
│   └── lib/
│       ├── main.dart
│       ├── screens/                # UI-Screens
│       └── services/               # API- und Auth-Logik
│
└── database/
    ├── mysql/init.sql              # MySQL Schema + Seed-Daten
    └── mongodb/init.js             # MongoDB Collection-Setup
```

Jeder Spring-Boot-Service hat dieselbe interne Struktur:

```
<service-name>/
├── Dockerfile
├── pom.xml
└── src/main/
    ├── java/com/workforce/<name>/
    │   ├── <Name>Application.java  # Einstiegspunkt
    │   ├── controller/             # REST-Endpoints (@RestController)
    │   ├── service/                # Geschäftslogik
    │   ├── model/                  # Entities / Datenmodelle
    │   ├── repository/             # Datenbankzugriff (JPA / MongoDB)
    │   └── config/                 # Security, JWT, CORS etc.
    └── resources/
        └── application.yml         # Port, DB-Verbindung, JWT-Secret
```

Jede React-App hat dieselbe interne Struktur:

```
<app-name>/
├── Dockerfile
├── nginx.conf
├── package.json
├── index.html
└── src/
    ├── main.jsx                    # React-Einstiegspunkt
    ├── App.jsx                     # Router-Setup, Protected Routes
    ├── pages/                      # Seitenkomponenten (LoginPage, Dashboard...)
    ├── components/                 # Wiederverwendbare UI-Komponenten
    └── services/
        └── api.js                  # Axios-Instanz mit JWT-Interceptor
```

---

## 6. Services im Detail

### 6.1 API Gateway · Port 8000

**Aufgabe:** Einziger Einstiegspunkt für alle Frontends. Leitet HTTP-Anfragen anhand des URL-Pfades an den passenden Microservice weiter.

**Routing-Tabelle:**

| Pfad-Prefix     | Ziel-Service              |
|-----------------|---------------------------|
| `/api/auth/**`  | auth-service :8001        |
| `/api/users/**` | user-role-service :8002   |
| `/api/orders/**`| order-service :8003       |
| `/api/planning/**` | planning-service :8004 |
| `/api/time/**`  | time-service :8005        |
| `/api/absences/**` | absence-vacation-service :8006 |
| `/api/billing/**` | billing-service :8007   |
| `/api/media/**` | report-media-service :8008|
| `/api/flipper-auth/**` | flipper-auth-service :8009 |

**Hinweis zur Integration:**
- Das Gateway leitet alle `/api/**`-Requests an die passenden Microservices weiter.
- JWT-Header werden durchgereicht; die rollenbasierte Prüfung passiert in den jeweiligen Services per Spring Security.
- CORS ist für Admin, HR, Schichtleiter und Flipper-Web konfiguriert.
- Rate Limiting bleibt optional.

---

### 6.2 Auth Service · Port 8001

**Aufgabe:** Authentifizierung. Erstellt JWT-Tokens nach erfolgreichem Login.

**Bereits implementiert:**
- `POST /api/auth/login` → gibt JWT-Token + Rolle zurück
- `GET /api/auth/validate` → prüft ob ein Token gültig ist
- `User`- und `Role`-Entity mit JPA
- `UserRepository` (findByUsername, findByEmail)
- `JwtUtil` (Token erstellen, validieren, Rolle/Username extrahieren)
- Spring Security Konfiguration (stateless, BCrypt)

**Noch zu implementieren:**
- `POST /api/auth/logout` (Token-Blacklist oder Frontend-seitig)
- Passwort ändern
- Erster Admin-Benutzer per Seed-Script

---

### 6.3 User & Role Service · Port 8002

**Aufgabe:** Verwaltung aller Benutzer und ihrer Rollen.

**Noch zu implementieren:**
- `GET /api/users` – alle Benutzer auflisten (Admin)
- `POST /api/users` – neuen Benutzer anlegen
- `PUT /api/users/{id}` – Benutzer bearbeiten
- `DELETE /api/users/{id}` – Benutzer deaktivieren
- `GET /api/users/{id}` – Benutzerdetails
- Entities: `User`, `Role`
- Repository, Service, Controller

---

### 6.4 Order Service · Port 8003

**Aufgabe:** Auftragsmanagement. Admin erstellt Aufträge, Schichtleiter empfangen sie, Mitarbeiter können Auftragsdaten herunterladen.

**Implementiert:**
- `GET /api/orders` – Aufträge auflisten, optional mit `?shiftLeadId=` und `?status=` filtern
- `GET /api/orders/{id}` – Auftragsdetail anzeigen
- `POST /api/orders` – Auftrag erstellen (Admin)
- `PUT /api/orders/{id}` – Auftrag bearbeiten (Admin)
- `PUT /api/orders/{id}/assign` – Schichtleiter/Mitarbeiter zuweisen (Admin)
- `PUT /api/orders/{id}/status` – Status ändern (Admin/Schichtleiter)
- `GET /api/orders/{id}/download` – Auftragsdaten als JSON abrufen
- Entities: `WorkOrder`, `OrderEmployee`
- Status-Enum: `OPEN`, `IN_PROGRESS`, `DONE`

**Beispiel: Auftrag erstellen**

```http
POST http://localhost:8000/api/orders
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "title": "Umbau Eingang A",
  "description": "Material prüfen und Rapportbilder hochladen",
  "company": "Demo AG",
  "location": "Zürich",
  "startDate": "2026-06-01",
  "endDate": "2026-06-30",
  "requiredRole": "Montage",
  "assignedShiftLeadId": 3,
  "createdBy": 1,
  "status": "OPEN",
  "employeeIds": [4]
}
```

---

### 6.5 Planning Service · Port 8004

**Aufgabe:** HR gibt monatliche Stundenkontingente pro Schichtleiter frei. Schichtleiter erstellen darauf basierend Arbeitspläne für ihr Team. Mitarbeiter sehen veröffentlichte Schichten im Mobile-Kalender.

**Implementiert:**
- `POST /api/planning/hour-budgets` – HR-Stundenkontingent pro Schichtleiter und Monat erstellen/aktualisieren
- `GET /api/planning/hour-budgets` – HR-Stundenkontingente auflisten, optional mit `?shiftLeadId=` filtern
- `POST /api/planning/workplans` – Arbeitsplan erstellen und HR-Stundenkontingent automatisch übernehmen
- `GET /api/planning/workplans` – Arbeitspläne auflisten, optional mit `?shiftLeadId=` filtern
- `GET /api/planning/workplans/{id}` – Arbeitsplan inkl. Schichten und Stundenübersicht anzeigen
- `PUT /api/planning/workplans/{id}` – Arbeitsplan-Entwurf bearbeiten
- `POST /api/planning/workplans/{id}/shifts` – Schicht hinzufügen, optional mit `orderId`
- `PUT /api/planning/workplans/{id}/publish` – Arbeitsplan veröffentlichen
- `GET /api/planning/calendar/{employeeId}` – veröffentlichte Kalenderschichten eines Mitarbeiters anzeigen
- Entities: `HourBudget`, `WorkPlan`, `Shift`, `WorkPlanStatus`

**Stundenlogik:**
- `approvedHours` wird aus der HR-Stundenfreigabe übernommen und nicht mehr vom Schichtleiter eingegeben.
- `plannedHours` wird aus allen Schichten eines Arbeitsplans berechnet.
- `remainingHours` zeigt die Differenz zwischen freigegebenen und geplanten Stunden.
- `overLimit` wird `true`, wenn mehr als das HR-Kontingent geplant wurde.
- `underPlanned` wird `true`, wenn weniger als 95 % des HR-Kontingents geplant wurden.

**Beispiel: HR-Stundenfreigabe erstellen**

```http
POST http://localhost:8000/api/planning/hour-budgets
Authorization: Bearer <hr-token>
Content-Type: application/json

{
  "shiftLeadId": 3,
  "year": 2026,
  "month": 6,
  "approvedHours": 1000,
  "createdBy": 2,
  "notes": "Sommermonat Juni"
}
```

**Beispiel: Arbeitsplan erstellen**

```http
POST http://localhost:8000/api/planning/workplans
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Monatsplan Juni",
  "shiftLeadId": 3,
  "startDate": "2026-06-01",
  "endDate": "2026-06-30"
}
```

**Beispiel: Schicht hinzufügen**

```http
POST http://localhost:8000/api/planning/workplans/1/shifts
Authorization: Bearer <token>
Content-Type: application/json

{
  "employeeId": 4,
  "orderId": null,
  "shiftDate": "2026-06-03",
  "startTime": "08:00",
  "endTime": "17:00",
  "notes": "Tagesschicht"
}
```

---

### 6.6 Time Service · Port 8005

**Aufgabe:** Check-in / Check-out erfassen, Arbeitsstunden berechnen, Auswertungen bereitstellen.

**Implementiert:**
- `POST /api/time/checkin` – Check-in speichern
- `POST /api/time/checkout` – Check-out speichern und Netto-Arbeitszeit berechnen
- `GET /api/time/current/{employeeId}` – aktuell offener Check-in eines Mitarbeiters
- `GET /api/time/latest/{employeeId}` – letzter Zeiteintrag eines Mitarbeiters
- `GET /api/time/today/{employeeId}` – heutiger Zeiteintrag eines Mitarbeiters
- `GET /api/time/month/{employeeId}?month=&year=` – Monatsauswertung pro Mitarbeiter
- `GET /api/time/total?from=&to=` – Gesamtstunden aller Mitarbeiter im Zeitraum
- `GET /api/time/total/{employeeId}?from=&to=` – Gesamtstunden eines Mitarbeiters im Zeitraum
- `GET /api/time/break-violations?from=&to=&employeeId=` – Pausenverstösse auswerten
- Rollen: HR/Admin für Auswertungen, Schichtleiter für Team-Übersicht, Mitarbeiter für eigenen Check-in/out
- Entities: `TimeEntry`
- Berechnung: Netto-Stunden aus Check-in, Check-out und Pausenzeit
- Pausenregel: mehr als 6 Stunden Brutto-Arbeitszeit → mindestens 30 Minuten Pause; mehr als 9 Stunden → mindestens 45 Minuten Pause

---

### 6.7 Absence & Vacation Service · Port 8006

**Aufgabe:** Ferienanfragen und Absenzen verwalten.

**Implementiert:**
- `POST /api/absences` – Absenz/Ferienanfrage einreichen (Mitarbeiter, HR, Admin)
- `GET /api/absences/employee/{employeeId}` – eigene Absenzen/Ferienanfragen für die Mobile App laden
- `GET /api/absences` – Absenzen nach Mitarbeiter und/oder Typ filtern
- `GET /api/absences/pending` – offene Anfragen (HR)
- `PUT /api/absences/{id}/approve` – genehmigen (HR)
- `PUT /api/absences/{id}/reject` – ablehnen (HR)
- `PUT /api/absences/{id}` – Abwesenheit bearbeiten (HR/Admin)
- `DELETE /api/absences/{id}` – Abwesenheit löschen (HR/Admin)
- Entities: `Absence`
- Type-Enum: `VACATION`, `SICK`, `OTHER`
- Status-Enum: `PENDING`, `APPROVED`, `REJECTED`

---

### 6.8 Billing Service · Port 8007

**Aufgabe:** HR erstellt Rechnungen und monatliche Lohnauszüge basierend auf erfassten Arbeitsstunden.

**Implementiert Rechnungen:**
- `POST /api/billing/invoices` – Rechnung erstellen
- `GET /api/billing/invoices` – alle Rechnungen
- `GET /api/billing/invoices/{id}` – Rechnungsdetail
- `PUT /api/billing/invoices/{id}/send` – Rechnung versenden
- `PUT /api/billing/invoices/{id}/pay` – Rechnung als bezahlt markieren
- Entities: `Invoice`, `InvoicePosition`
- Status-Enum: `DRAFT`, `SENT`, `PAID`

**Implementiert Lohnauszüge:**
- `POST /api/billing/payroll-statements` – Lohnauszug aus Monatsstunden, Stundenrate, Zuschlägen und Abzügen erstellen oder neu berechnen
- `GET /api/billing/payroll-statements` – Lohnauszüge auflisten, optional mit `?status=` filtern
- `GET /api/billing/payroll-statements/{id}` – Lohnauszug anzeigen
- `PUT /api/billing/payroll-statements/{id}/approve` – Lohnauszug freigeben
- `PUT /api/billing/payroll-statements/{id}/pay` – Lohnauszug als bezahlt markieren
- Entities: `PayrollStatement`, `PayrollStatus`
- Status-Enum: `DRAFT`, `APPROVED`, `PAID`
- Stundendaten kommen aus `time_entries` des Time Service

---

### 6.9 Report / Media Service · Port 8008

**Aufgabe:** Bild-Uploads aus der Mobile App empfangen und in MongoDB speichern.

**Implementiert:**
- `POST /api/media/upload` – Bild aus der Mobile App per Multipart hochladen
- `GET /api/media/{id}` – Bilddatei aus MongoDB abrufen
- `GET /api/media/order/{orderId}` – alle Rapportbilder eines Auftrags auflisten
- `GET /api/media/employee/{employeeId}` – alle Rapportbilder eines Mitarbeiters auflisten
- MongoDB-Document: `MediaReport` (employeeId, orderId, rapportId, filename, contentType, fileSize, storagePath, uploadedAt, metadata, data)
- Bilddaten werden direkt in MongoDB gespeichert; maximale Upload-Grösse: 10 MB

**Beispiel: Rapportbild hochladen**

```http
POST http://localhost:8000/api/media/upload
Authorization: Bearer <employee-token>
Content-Type: multipart/form-data

file=<bild.jpg>
employeeId=4
orderId=1
note=Rapportfoto Eingang A
```

---

## 7. Frontend-Apps

### Gemeinsame Basis (alle 3 Apps)

- **Vite** als Build-Tool
- **React Router v6** für clientseitiges Routing
- **Axios** mit JWT-Interceptor (`src/services/api.js`)
  - Setzt automatisch den `Authorization: Bearer <token>` Header
  - Leitet bei 401 automatisch auf `/login` weiter
- **Protected Routes** – nicht eingeloggte Nutzer werden auf `/login` umgeleitet
- Login prüft die JWT-Rolle, falsche Rolle = Zugang verweigert

### Admin Web · Port 3001

**Implementiert:**
- Login mit Rollenprüfung `ADMIN`
- Dashboard mit vollständiger Navigation (Übersicht, Aufträge, HR, Firmenkonzepte, Lohn und Stunden, Mitarbeiter, Rollen, Berichte, Suche, Audit-Log)
- Rollen-Tab: alle Benutzer aus der DB anzeigen, Rolle ändern, deaktivieren/aktivieren (`GET /api/users`, `PUT /api/users/:id`)
- HR-Tab: HR-Benutzer aus DB anzeigen, anlegen, bearbeiten und deaktivieren/aktivieren (`GET /api/users?role=HR`, `POST /api/users`, `PUT /api/users/:id`)
- Mitarbeiter-Tab: Mitarbeiter aus DB anzeigen, anlegen, bearbeiten und deaktivieren/aktivieren (`GET /api/users?role=EMPLOYEE`, `POST /api/users`, `PUT /api/users/:id`)
- Aufträge: werden über den Order Service gespeichert (`GET/POST/PUT /api/orders`)
- Firmenkonzepte, Stunden-/Lohnregeln, Berichte, Audit-Log: weiterhin lokal im Browser
- Suche und Übersichts-Statistiken verwenden echte DB-Daten für Benutzer/Mitarbeiter/Aufträge

> **Hinweis:** Firmenkonzepte, Stunden- und Lohnregeln werden aktuell noch im `localStorage` des Browsers gespeichert. Aufträge sind jetzt backendgestützt und bleiben in MySQL erhalten.

> **Hinweis Bearbeiten-Formular:** Beim Bearbeiten eines bestehenden HR- oder Mitarbeiter-Benutzers werden Benutzername und Passwort ausgeblendet, da der `PUT /api/users/:id` Endpunkt diese Felder nicht akzeptiert (Benutzername ist eindeutig und unveränderlich; Passwortänderung ist nicht implementiert).

**Noch zu implementieren:**
- Firmendaten-Seite (`/company`)
- Stundenübersicht aus dem Time Service laden

### HR Web · Port 3002

**Implementiert:**
- Login mit Rollenprüfung `HR`
- Benutzerverwaltung (`/users`): Schichtleiter/Mitarbeiter anlegen, bearbeiten, deaktivieren
- Stundenübersicht (`/time`): Gesamtstunden, Monatsdetail und Pausenverstösse prüfen
- Stundenfreigabe (`/hour-budgets`): Monatskontingente pro Schichtleiter freigeben
- Rechnungen (`/invoices`): Erstellen, versenden, als bezahlt markieren (DRAFT → SENT → PAID)
- Lohnauszüge (`/payroll`): Monatslohn aus Stunden, Stundenrate, Zuschlägen und Abzügen berechnen (DRAFT → APPROVED → PAID)
- Absenzen & Ferien (`/absences`): Ferienanfragen genehmigen/ablehnen, Absenzen erfassen und verwalten

**Noch zu implementieren:**
- Abwesenheitskalender (`/absences/calendar`) — Backend-Endpunkt vorhanden, Frontend-Widget fehlt (US-HR-10)

### Schichtleiter Web · Port 3003

**Implementiert:**
- Login mit Rollenprüfung `SHIFT_LEAD` und Speicherung von `userId`
- Dashboard mit Kacheln für Planung, Aufträge und Notizen
- Arbeitsplan-Erstellung (`/planning`) mit automatisch übernommener HR-Stundenfreigabe
- Schichten hinzufügen inklusive Mitarbeiter-Auswahl, optionaler Auftrag-ID und Notiz
- Stundenübersicht mit HR-Kontingent, geplanten Stunden, Reststunden und Warnungen
- Arbeitszeiten-Seite (`/time`) lädt Gesamtstunden, Monatsdetails und Pausenverstösse aus dem Time Service
- Arbeitsplan veröffentlichen, damit Mitarbeiter die Schichten im Mobile-Kalender sehen

**Implementiert zusätzlich:**
- Auftrags-Ansicht (`/orders`) lädt zugewiesene Aufträge aus dem Order Service
- Schichtleiter kann den Auftragsstatus auf `OPEN`, `IN_PROGRESS` oder `DONE` setzen
- Arbeitsplanung bietet zugewiesene Aufträge als Auswahl für neue Schichten an

**Vorbereitet:**
- Notizen-Übersicht (`/notes`) als Platzhalter; Schichtnotizen werden bereits im Arbeitsplan gespeichert

---

## 8. Mobile App (Flutter)

**Verzeichnis:** `mobile/`  
**Rolle:** Mitarbeiter (`emp.meier` / `password`)  
**Technologie:** Flutter SDK 3.3+, Provider 6.1, http, SharedPreferences, image_picker

Die Mobile App verbindet sich mit demselben API Gateway (`:8000`) und verwendet dasselbe JWT wie die drei Web-Frontends. Sie ist **ausschliesslich für die Rolle `EMPLOYEE`** gedacht.

---

### Voraussetzungen (Entwicklungsumgebung)

- **Flutter SDK** ≥ 3.3 ([flutter.dev/docs/get-started/install](https://flutter.dev/docs/get-started/install))
- **Android Studio** mit installiertem Android Emulator (API 33+) **oder** ein physisches Android-Gerät
- **Docker-Stack läuft** (`docker compose up -d`) – die App spricht gegen den Backend-Stack

---

### Schritt 1 – API-URL konfigurieren

> ⚠️ **Wichtig:** Die URL muss vor dem ersten Start angepasst werden. Ohne korrekte URL kann die App keine Verbindung zum Backend aufbauen.

Die Basis-URL für alle API-Anfragen steht zentral in einer Datei:

```
mobile/lib/services/api_config.dart
```

```dart
class ApiConfig {
  // Android Emulator: 10.0.2.2 = localhost des Host-Rechners
  // Echtes Gerät im selben WLAN: lokale IP des Host-Rechners (z.B. 192.168.1.x)
  static const String baseUrl = 'http://10.0.2.2:8000';
  static const Duration requestTimeout = Duration(seconds: 8);
}
```

| Situation | Wert für `baseUrl` |
|---|---|
| Android-Emulator (Standard) | `http://10.0.2.2:8000` |
| Echtes Gerät im selben WLAN | `http://<lokale-IP-des-Rechners>:8000` |
| iOS-Simulator | `http://localhost:8000` |

> Die lokale IP des Rechners findet man unter Windows mit `ipconfig` (z.B. `192.168.1.42`), unter macOS/Linux mit `ifconfig` oder `ip a`.

**Wichtig:** Nach einer URL-Änderung muss die App neu gebaut werden (`flutter run`).

---

### Schritt 2 – App starten

```bash
cd mobile
flutter pub get          # Dependencies installieren (einmalig)
flutter run              # App im verbundenen Emulator / Gerät starten
```

Alternativer Start direkt im Android Studio:
1. Emulator über **Device Manager** starten
2. In der Run-Konfiguration das `mobile/`-Verzeichnis auswählen
3. **Run** drücken

---

### Schritt 3 – Einloggen

| Feld | Wert |
|---|---|
| Benutzername | `emp.meier` |
| Passwort | `password` |

Die App ruft `POST /api/auth/login` auf denselben API Gateway auf wie die Web-Frontends. Nach erfolgreichem Login speichert sie `token`, `role`, `username` und `userId` in den `SharedPreferences` des Geräts. Das JWT ist 24 Stunden gültig.

> Die App prüft die Rolle **nicht** beim Login – technisch kann jeder Systembenutzer die Mobile App verwenden. Im Normalbetrieb ist sie für die Rolle `EMPLOYEE` vorgesehen.

---

### Screens und API-Endpoints

#### Tab 1 – Check-in / Check-out

Ermöglicht dem Mitarbeiter, die Arbeitszeit direkt aus der App zu erfassen.

| Aktion | Endpoint | Payload |
|---|---|---|
| Status laden | `GET /api/time/current/{userId}` | – |
| Check-in | `POST /api/time/checkin` | `{ "employeeId": 4 }` |
| Check-out | `POST /api/time/checkout` | `{ "employeeId": 4, "breakMinutes": 30 }` |

- Beim Check-out wird die Pausenzeit in Minuten abgezogen
- Die Netto-Arbeitsstunden werden vom Time Service berechnet und zurückgegeben
- Ist der Mitarbeiter bereits eingecheckt, zeigt die App den aktuellen Check-in-Zeitpunkt

#### Tab 2 – Kalender

Zeigt die veröffentlichten Schichten des Mitarbeiters für den laufenden Monat.

| Aktion | Endpoint |
|---|---|
| Schichten laden | `GET /api/planning/calendar/{userId}?from=YYYY-MM-DD&to=YYYY-MM-DD` |

> Schichten sind nur sichtbar, wenn der Schichtleiter den Arbeitsplan **veröffentlicht** hat (Status `PUBLISHED`). Entwürfe (`DRAFT`) erscheinen nicht.

#### Tab 3 – Absenzen & Ferien

Mitarbeiter kann eigene Ferienanträge und Absenzen einreichen und den Status einsehen.

| Aktion | Endpoint | Payload |
|---|---|---|
| Absenzen laden | `GET /api/absences/employee/{userId}` | – |
| Absenz einreichen | `POST /api/absences` | `{ "employeeId": 4, "type": "VACATION", "startDate": "...", "endDate": "...", "reason": "..." }` |

Typen: `VACATION` (Ferien), `SICK` (Krank), `OTHER` (Sonstiges)  
Status: `PENDING` → `APPROVED` / `REJECTED` (wird von HR gesetzt)

#### Tab 4 – Rapport / Foto-Upload

Mitarbeiter fotografiert den Arbeitsort und lädt das Bild mit optionaler Auftrags-ID hoch.

| Aktion | Endpoint |
|---|---|
| Bild hochladen | `POST /api/media/upload` (Multipart) |

Felder: `file` (Bilddatei), `employeeId`, `orderId` (optional), `note` (optional)  
Das Bild wird in **MongoDB** (`workforce-media.media_reports`) gespeichert. Max. 10 MB.

---

### Architektur der Mobile App

```
mobile/lib/
├── main.dart                    # App-Einstieg, Provider-Setup, Login/Home-Weiche
├── services/
│   ├── api_config.dart          # Zentrale URL-Konfiguration (hier bei Bedarf anpassen)
│   ├── api_service.dart         # GET, POST, Multipart-Upload mit JWT-Header
│   └── auth_service.dart        # Login, Logout, JWT/UserId/Rolle (SharedPreferences)
└── screens/
    ├── login_screen.dart        # Login-UI
    ├── home_screen.dart         # Bottom-Navigation (4 Tabs)
    ├── checkin_screen.dart      # Check-in / Check-out → Time Service
    ├── calendar_screen.dart     # Monatskalender → Planning Service
    ├── absence_screen.dart      # Absenzen einreichen und anzeigen → Absence Service
    └── report_screen.dart       # Kamera → Bild-Upload → Report/Media Service
```

Alle API-Aufrufe laufen ausschliesslich über `ApiService`. Kein Screen ruft `http` direkt auf. Der `AuthService` verwaltet den Login-Zustand und stellt den JWT-Header für alle Requests bereit.

---

### Troubleshooting Mobile

| Problem | Ursache | Lösung |
|---|---|---|
| `Backend nicht erreichbar` | Falsche `baseUrl` in `api_config.dart` | URL auf `10.0.2.2:8000` (Emulator) oder lokale IP (echtes Gerät) setzen |
| `Nicht autorisiert` (401) | Token abgelaufen (24h) oder nie gesetzt | Ausloggen und neu einloggen |
| Keine Schichten im Kalender | Schichtleiter hat Plan noch nicht veröffentlicht | Im Schichtleiter-Web Plan veröffentlichen (Status → PUBLISHED) |
| Kamera öffnet sich nicht | `image_picker` Berechtigungen fehlen | Android: Kameraberechtigung in App-Einstellungen erteilen |
| Upload schlägt mit 413 fehl | Bild grösser als 10 MB | Kleinere Auflösung / niedrigere Bildqualität wählen |

### Noch zu implementieren

- Auftragsdaten herunterladen (`GET /api/orders/{id}/download`)
- Eigenes Benutzerprofil anzeigen

---

## 9. Datenbanken

### MySQL · Host-Port 3307 / Container-Port 3306

Wird verwendet für **alle strukturierten Daten**.

**Datenbank:** `workforce`  
**Benutzer:** `workforce` / `workforce`

Intern verwenden die Backend-Services weiterhin `mysql-db:3306`. Auf dem Windows-Host ist MySQL über `localhost:3307` erreichbar, damit es keinen Konflikt mit einer lokal installierten Windows-MySQL-Instanz auf Port 3306 gibt.

Tabellen (automatisch angelegt via `database/mysql/init.sql`):

| Tabelle | Inhalt |
|---|---|
| `roles` | ADMIN, HR, SHIFT_LEAD, EMPLOYEE |
| `users` | Alle Benutzer mit Rollenzuweisung |
| `orders` | Aufträge inklusive Firma, Einsatzort, Zeitraum, Status und Schichtleiter-Zuweisung |
| `order_employees` | Zuordnung Mitarbeiter ↔ Auftrag |
| `work_plans` | Arbeitspläne inkl. HR-Stundenkontingent, Status und Veröffentlichungszeitpunkt |
| `shifts` | Einzelschichten mit Mitarbeiter- und optionalem Auftragsbezug |
| `time_entries` | Check-in/out Einträge |
| `absences` | Absenzen und Ferienanfragen |
| `invoices` | Rechnungen |
| `invoice_positions` | Rechnungspositionen |

**phpMyAdmin:** [http://localhost:8080](http://localhost:8080)

### MongoDB · Port 27017

Wird verwendet für **Bild-Uploads aus der Mobile App**.

**Datenbank:** `workforce-media`  
**Benutzer:** `workforce` / `workforce`

Collection: `media_reports`

```json
{
  "employee_id": 42,
  "order_id": 7,
  "rapport_id": "uuid-...",
  "filename": "bild_2024_01.jpg",
  "content_type": "image/jpeg",
  "file_size": 204800,
  "storage_path": "mongodb://workforce-media/media_reports/uuid-...",
  "uploaded_at": "2024-01-15T14:30:00Z",
  "metadata": { "note": "Rapportfoto Eingang A" },
  "data": "<binary image data>"
}
```

**Mongo Express:** [http://localhost:8081](http://localhost:8081)

---

## 10. Docker & lokale Umgebung

### Voraussetzungen

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installiert und gestartet
- Ports **3001–3004**, **8000–8009**, **3307**, **27017**, **8080**, **8081** sind frei
- Node.js v18+ nur nötig, wenn Frontends im Entwicklungsmodus (ausserhalb Docker) gestartet werden

---

### Alles starten (empfohlener Befehl)

```bash
docker compose up --build -d
```

Startet alle Container auf einmal: Datenbanken, alle 8 Backend-Services, alle 3 Frontends und die DB-Admins.

| Flag | Bedeutung |
|---|---|
| `--build` | Bilder neu bauen (nötig beim ersten Start und nach Code-Änderungen) |
| `-d` | Hintergrundmodus (Terminal bleibt frei) |

> Folgestarts ohne Code-Änderungen: `docker compose up -d` (kein `--build`, startet in Sekunden).

---

### Container-Status prüfen

```bash
docker compose ps
```

`mysql-db` muss den Status `healthy` haben, bevor die Backend-Services bereit sind. Wenn ein Service `unhealthy` zeigt, Logs prüfen.

---

### Logs anzeigen

```bash
# Live-Log eines Services
docker compose logs -f api-gateway
docker compose logs -f user-role-service
docker compose logs -f absence-vacation-service

# Letzten 50 Zeilen ohne Live-Follow
docker compose logs --tail=50 hr-web
```

---

### Einzelnen Service neu bauen (nach Code-Änderung)

```bash
# Ein Service
docker compose up --build user-role-service -d

# Mehrere Services gleichzeitig
docker compose up --build auth-service user-role-service absence-vacation-service -d
```

---

### Nur Datenbanken starten (für IntelliJ-Entwicklung)

```bash
docker compose up mysql-db mongo-db phpmyadmin mongo-express -d
```

Spring-Boot-Services können dann direkt aus IntelliJ gestartet werden (`SPRING_PROFILES_ACTIVE=local`).

---

### Alle Container stoppen

```bash
# Stoppen – Daten bleiben erhalten
docker compose down

# Stoppen + alle Volumes löschen (DB-Reset)
docker compose down -v
```

> Nach `docker compose down -v`: beim nächsten `docker compose up --build -d` werden Schema, Rollen und alle Demo-Accounts automatisch neu angelegt.

---

### Browser-Zugänge (Übersicht)

| Anwendung | URL | Login |
|---|---|---|
| Admin-Frontend | http://localhost:3001 | `admin` / `password` |
| HR-Frontend | http://localhost:3002 | `hr.mueller` / `password` |
| Schichtleiter-Frontend | http://localhost:3003 | `sl.huber` / `password` |
| Flipper Auth Dashboard | http://localhost:3004 | *(kein Login)* |
| phpMyAdmin | http://localhost:8080 | `workforce` / `workforce` |
| Mongo Express | http://localhost:8081 | *(kein Login)* |
| API Gateway | http://localhost:8000 | *(direkte API-Calls)* |

---

## 11. Port-Übersicht

| Komponente             | Port  |
|------------------------|-------|
| API Gateway            | 8000  |
| Auth Service           | 8001  |
| User & Role Service    | 8002  |
| Order Service          | 8003  |
| Planning Service       | 8004  |
| Time Service           | 8005  |
| Absence/Vacation Svc.  | 8006  |
| Billing Service        | 8007  |
| Report/Media Service   | 8008  |
| Flipper Auth Service   | 8009  |
| Admin Web              | 3001  |
| HR Web                 | 3002  |
| Schichtleiter Web      | 3003  |
| Flipper Auth Web       | 3004  |
| MySQL                  | 3307 Host → 3306 Container |
| MongoDB                | 27017 |
| phpMyAdmin             | 8080  |
| Mongo Express          | 8081  |

---

## 12. Arbeitsweise im Team (Kanban)

Das Kanban-Board findet ihr direkt hier im GitHub-Repository unter dem Tab **Projects**.

### Branch-Strategie

```
main                    ← stabiler Stand
└── feature/<name>      ← Feature-Branch für eine Aufgabe
```

Beispiele:
- `feature/time-service-checkin`
- `feature/hr-web-invoices`
- `feature/flutter-calendar`
- `feature/owasp-testplan`

### Workflow pro Use Case / Kanban-Karte

1. Karte im Kanban-Board von **To Do** → **In Progress** verschieben
2. Feature-Branch erstellen:
   ```bash
   git checkout -b feature/<name>
   ```
3. Implementieren, committen
4. Branch pushen
5. Pull Request auf `main` erstellen oder nach Absprache direkt in `main` mergen
6. Kurze Gegenkontrolle durch eine andere Person (Code Review)
7. Merge → Karte auf **Done** verschieben

### Commit-Konvention

```
<typ>(<bereich>): <kurze Beschreibung>

Beispiele:
feat(time-service): add check-in endpoint
fix(auth-service): correct JWT expiration
feat(flutter): connect calendar to planning API
feat(hr-web): implement invoice creation page
```

**Typen:** `feat`, `fix`, `refactor`, `docs`, `style`, `test`

---

## 13. Konventionen & Coding-Standards

### Backend (Java / Spring Boot)

- Packagestruktur: `com.workforce.<servicename>.<schicht>`
- Schichten: `controller` → `service` → `repository` → `model`
- REST-Endpoints geben immer `ResponseEntity<T>` zurück
- Fehlerbehandlung: `@ControllerAdvice` mit sinnvollen HTTP-Status-Codes
- JWT-Secret **nie** in den Code schreiben – nur über `application.yml` / Umgebungsvariable
- Lombok (`@Data`, `@RequiredArgsConstructor`) für Boilerplate

### Frontend (React)

- Komponenten: **PascalCase** (`UserList.jsx`)
- Hooks/Funktionen: **camelCase**
- API-Aufrufe **immer** über `src/services/api.js` (nicht direkt `axios.get(...)`)
- Kein Token-Handling direkt in Komponenten – nur in `api.js` und `localStorage`

### Mobile (Flutter)

- Screens in `lib/screens/`, Services in `lib/services/`, Modelle in `lib/models/`
- API-Aufrufe **nur** über `ApiService`, nie direkt `http.get()` in Widgets
- State-Management mit **Provider** (`AuthService extends ChangeNotifier`)
- Keine hardcodierten URLs – Konstante in `ApiService._baseUrl`

---

*Viel Erfolg beim Ausarbeiten! Bei Fragen → Issue erstellen oder direkt im Kanban kommentieren.*

---

## 14. Nachträgliche Ergänzungen (Stand 2026-06-22)

### Übersicht der Änderungen

Folgende drei Punkte wurden nachträglich implementiert, um offene Lücken zu schliessen:

1. **Config Service** – neuer Backend-Microservice für Firmenkonzepte, Stundenregeln und Lohnregeln (ersetzt localStorage im Admin-Web)
2. **Admin-Web: Stundenübersicht vom Time Service** – Echtdaten statt Dummy-Daten
3. **HR-Web: Abwesenheitskalender** – neuer Tab mit monatlicher Kalenderansicht

---

### 1. Config Service (`backend/config-service`, Port 8010)

**Warum:** Das Admin-Web speicherte Firmenkonzepte, Stundenregeln und Lohnregeln bisher im `localStorage` des Browsers. Das hat mehrere Nachteile: Daten gehen beim Browser-Clear verloren, sind nicht teamweit geteilt und entsprechen nicht der Microservice-Architektur des restlichen Systems.

**Was wurde gemacht:**

- Neuer Spring Boot 3.3 Microservice `config-service` im Package `com.workforce.adminconfig`
- **Standalone-Maven-Projekt** (eigene `spring-boot-starter-parent`-Elterndependenz), damit die bestehenden Dockerfiles der 10 anderen Services nicht angefasst werden mussten
- Port **8010**, Container-Name `config-service`
- Gleiche Sicherheitsarchitektur wie alle anderen Services: JWT-Auth-Filter, stateless, kein CORS (Gateway regelt das)
- **Berechtigungen:** GET für ADMIN/HR/SHIFT_LEAD; POST/PUT/DELETE nur für ADMIN

**Neue Datenbanktabellen** in `database/mysql/init.sql`:

| Tabelle | Inhalt |
|---|---|
| `company_concepts` | Firmenkonzepte: Name, Beschreibung, aktiv/inaktiv |
| `time_rules` | Stundenregeln: max. Tages-/Wochenstunden, Pausenregel |
| `wage_rules` | Lohnregeln: Stundenansatz, Überstundenansatz, zugeordnetes Konzept |

**API-Endpunkte:**

```
GET    /api/config/concepts         → alle Konzepte
POST   /api/config/concepts         → Konzept erstellen (ADMIN)
PUT    /api/config/concepts/{id}    → Konzept bearbeiten (ADMIN)

GET    /api/config/time-rules       → alle Stundenregeln
POST   /api/config/time-rules       → Stundenregel erstellen (ADMIN)
PUT    /api/config/time-rules/{id}  → Stundenregel bearbeiten (ADMIN)

GET    /api/config/wage-rules       → alle Lohnregeln
POST   /api/config/wage-rules       → Lohnregel erstellen (ADMIN)
PUT    /api/config/wage-rules/{id}  → Lohnregel bearbeiten (ADMIN)
```

**Geänderte Infrastruktur-Dateien:**
- `backend/api-gateway/src/main/resources/application.yml` → neue Route `/api/config/**`
- `docker-compose.yml` → `config-service`-Eintrag, in `api-gateway` depends_on ergänzt

---

### 2. Admin-Web: Stundenübersicht vom Time Service

**Warum:** Der Admin konnte bisher nur Dummy-Daten aus dem `localStorage` sehen. Der Time Service (`:8005`) liefert die echten Check-in/Check-out-Einträge aller Mitarbeiter.

**Was wurde gemacht** in `frontend/admin-web/src/pages/DashboardPage.jsx`:

- Neue State-Variablen: `apiTimeTotal`, `apiBreakViolations`, `timeFrom`, `timeTo`
- Neue Funktion `loadTimeTotal(from, to)` → ruft `GET /api/time/total` und `GET /api/time/break-violations` parallel auf
- Im Tab **"Lohn und Stunden"**: Stundenübersicht zeigt jetzt echte Gesamtstunden pro Mitarbeiter und Pausenverstösse aus dem Time Service
- Datumsfilter (Von/Bis) mit Laden-Button – gleiche UX wie auf der HR-Seite

---

### 3. HR-Web: Abwesenheitskalender

**Warum:** In der HR-Web-Applikation gab es zwar eine Absenz-Verwaltungsseite (Genehmigen, Ablehnen, Erstellen), aber keine übersichtliche kalendarische Darstellung aller Absenzen.

**Was wurde gemacht** in `frontend/hr-web/src/pages/AbsencesPage.jsx`:

- Neuer Tab **"Kalender"** neben den bestehenden Tabs "Ausstehende Anträge" und "Alle Absenzen"
- Monatliche Rasteransicht (Mo–So, ISO-Wochenstart)
- Farbkodierung nach Absenztyp:
  - **Ferien** → blau (`#dbeafe` / `#1e40af`)
  - **Krankheit** → rot (`#fee2e2` / `#991b1b`)
  - **Sonstiges** → grau (`#f3f4f6` / `#4b5563`)
- Vor-/Zurück-Navigation zwischen Monaten, Heute-Markierung
- Lädt alle Absenzen via `GET /api/absences`; das Raster filtert lokal auf den sichtbaren Monat

---

### Ports-Übersicht (vollständig)

| Port | Service |
|---|---|
| 8000 | API Gateway |
| 8001 | Auth Service |
| 8002 | User & Role Service |
| 8003 | Order Service |
| 8004 | Planning Service |
| 8005 | Time Service |
| 8006 | Absence & Vacation Service |
| 8007 | Billing Service |
| 8008 | Report/Media Service |
| 8009 | Flipper Auth Service |
| **8010** | **Config Service (neu)** |
| 3001 | Admin Web |
| 3002 | HR Web |
| 3003 | Schichtleiter Web |
| 3004 | Flipper Auth Web |
