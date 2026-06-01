# Workforce Management System

Schulprojekt Modul 335 – Mobile Applikation  
Klasse: Modul 335

---

## Dokumentation

| Dokument | Beschreibung |
|---|---|
| [User Stories – HR](docs/userstories_hr.md) | 10 User Stories mit Akzeptanzkriterien für die HR-Rolle |

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

| Rolle        | Zugang              | JWT-Rolle   |
|--------------|---------------------|-------------|
| Admin        | Admin Web (Port 3001) | `ADMIN`   |
| HR           | HR Web (Port 3002)    | `HR`      |
| Schichtleiter| Schichtleiter Web (Port 3003) | `SHIFT_LEAD` |
| Mitarbeiter  | Flutter Mobile App  | `EMPLOYEE`  |

Jedes Frontend prüft nach dem Login die Rolle im JWT-Token. Stimmt die Rolle nicht überein, wird der Zugang verweigert.

---

## 4. Gesamtarchitektur

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  React          │  │  React          │  │  React          │  │  Flutter        │
│  Admin Web      │  │  HR Web         │  │  Schichtleiter  │  │  Mobile App     │
│  :3001          │  │  :3002          │  │  Web :3003      │  │  (Android/iOS)  │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                   │                     │                    │
         └───────────────────┴──────────REST / JSON / JWT───────────────┘
                                                   │
                                      ┌────────────▼────────────┐
                                      │      API Gateway        │
                                      │   Spring Cloud Gateway  │
                                      │         :8000           │
                                      └────────────┬────────────┘
                                                   │
          ┌──────────┬──────────┬──────────────────┼──────────────────┬──────────┐
          │          │          │                  │                  │          │
     ┌────▼───┐ ┌────▼───┐ ┌───▼────┐        ┌────▼───┐        ┌────▼───┐ ┌────▼───┐
     │ Auth   │ │ User & │ │ Order  │        │Planning│        │ Time   │ │Absence │
     │Service │ │ Role   │ │Service │        │Service │        │Service │ │Service │
     │ :8001  │ │Service │ │ :8003  │        │ :8004  │        │ :8005  │ │ :8006  │
     └────┬───┘ │ :8002  │ └───┬────┘        └───┬────┘        └───┬────┘ └───┬────┘
          │     └────┬───┘     │                 │                 │          │
          │          │         │                 │                 │          │
     ┌────▼───┐      │    ┌────▼────────────────────────────────────────┐    │
     │Billing │      │    │                   MySQL :3306               │    │
     │Service │      └───►│  workforce DB – Benutzer, Rollen, Aufträge, │◄───┘
     │ :8007  │           │  Schichten, Zeiten, Absenzen, Rechnungen    │
     └────┬───┘           └─────────────────────────────────────────────┘
          │
     ┌────▼────────┐      ┌─────────────────────────────────────────────┐
     │Report/Media │      │               MongoDB :27017                │
     │ Service     │─────►│  workforce-media – Bilder, Bild-Metadaten,  │
     │  :8008      │      │  Rapport-Zuordnungen                        │
     └─────────────┘      └─────────────────────────────────────────────┘
```

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

**Noch zu implementieren:**
- JWT-Filter (Token prüfen, bevor Anfrage weitergeleitet wird)
- CORS-Konfiguration für alle Frontends
- Rate Limiting (optional)

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

**Noch zu implementieren:**
- `GET /api/orders` – Aufträge auflisten (gefiltert nach Rolle)
- `POST /api/orders` – Auftrag erstellen (Admin)
- `PUT /api/orders/{id}` – Auftrag bearbeiten
- `PUT /api/orders/{id}/assign` – Schichtleiter/Mitarbeiter zuweisen
- `GET /api/orders/{id}/download` – Auftragsdaten herunterladen
- Entities: `Order`, `OrderEmployee`
- Status-Enum: `OPEN`, `IN_PROGRESS`, `DONE`

---

### 6.5 Planning Service · Port 8004

**Aufgabe:** Schichtleiter erstellt Arbeitspläne für sein Team. Mitarbeiter sehen ihren Arbeitskalender.

**Noch zu implementieren:**
- `GET /api/planning/calendar/{employeeId}` – Kalender eines Mitarbeiters
- `POST /api/planning/workplans` – Arbeitsplan erstellen
- `POST /api/planning/workplans/{id}/shifts` – Schicht hinzufügen
- `GET /api/planning/workplans` – Arbeitspläne des Schichtleiters
- Entities: `WorkPlan`, `Shift`

---

### 6.6 Time Service · Port 8005

**Aufgabe:** Check-in / Check-out erfassen, Arbeitsstunden berechnen, Auswertungen bereitstellen.

**Noch zu implementieren:**
- `POST /api/time/checkin` – Check-in speichern
- `POST /api/time/checkout` – Check-out speichern
- `GET /api/time/today/{employeeId}` – heutiger Eintrag
- `GET /api/time/month/{employeeId}?month=&year=` – Monatsauswertung
- `GET /api/time/total/{employeeId}` – Gesamtstunden
- Entities: `TimeEntry`
- Berechnung: Tages-, Wochen-, Monatsstunden

---

### 6.7 Absence & Vacation Service · Port 8006

**Aufgabe:** Ferienanfragen und Absenzen verwalten.

**Noch zu implementieren:**
- `POST /api/absences` – Absenz/Ferienanfrage einreichen (Mitarbeiter)
- `GET /api/absences/employee/{id}` – eigene Absenzen
- `GET /api/absences/pending` – offene Anfragen (HR)
- `PUT /api/absences/{id}/approve` – genehmigen (HR)
- `PUT /api/absences/{id}/reject` – ablehnen (HR)
- Entities: `Absence`
- Type-Enum: `VACATION`, `SICK`, `OTHER`
- Status-Enum: `PENDING`, `APPROVED`, `REJECTED`

---

### 6.8 Billing Service · Port 8007

**Aufgabe:** HR erstellt Rechnungen basierend auf erfassten Arbeitsstunden.

**Noch zu implementieren:**
- `POST /api/billing/invoices` – Rechnung erstellen
- `GET /api/billing/invoices` – alle Rechnungen
- `GET /api/billing/invoices/{id}` – Rechnungsdetail
- `PUT /api/billing/invoices/{id}/send` – Rechnung versenden
- Entities: `Invoice`, `InvoicePosition`
- Status-Enum: `DRAFT`, `SENT`, `PAID`
- Stundendaten kommen vom Time Service

---

### 6.9 Report / Media Service · Port 8008

**Aufgabe:** Bild-Uploads aus der Mobile App empfangen und in MongoDB speichern.

**Noch zu implementieren:**
- `POST /api/media/upload` – Bild hochladen (Multipart)
- `GET /api/media/{id}` – Bild abrufen
- `GET /api/media/order/{orderId}` – alle Bilder eines Auftrags
- MongoDB-Document: `MediaReport` (employeeId, orderId, filename, contentType, storagePath, uploadedAt, metadata)
- Dateispeicherung: Lokal im Container oder S3-kompatibel (z.B. MinIO)

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

Bereits vorhanden: Login, Dashboard mit Navigation

**Noch zu implementieren:**
- Auftrags-Verwaltungsseite (`/orders`)
- HR-Benutzer-Verwaltungsseite (`/hr`)
- Firmendaten-Seite (`/company`)
- Lohn/Stunden-Übersicht (`/salary`)

### HR Web · Port 3002

Bereits vorhanden: Login, Dashboard mit Navigation

**Noch zu implementieren:**
- Schichtleiter-Verwaltung (`/shift-leads`)
- Total-Stunden-Ansicht (`/hours`)
- Rechnungs-Erstellung (`/invoices`)
- Stunden-Auswertungen (`/reports`)
- Absenzen/Ferien-Verwaltung (`/absences`)

### Schichtleiter Web · Port 3003

Bereits vorhanden: Login, Dashboard mit Navigation

**Noch zu implementieren:**
- Arbeitsplan-Erstellung (`/planning`)
- Auftrags-Ansicht (`/orders`)
- Notizen-Erfassung (`/notes`)

---

## 8. Mobile App (Flutter)

**Verzeichnis:** `mobile/`

### Bereits implementiert

| Datei | Inhalt |
|---|---|
| `lib/main.dart` | App-Einstieg, Provider-Setup, Login/Home-Weiche |
| `lib/services/auth_service.dart` | Login, Logout, JWT speichern (SharedPreferences), ChangeNotifier |
| `lib/services/api_service.dart` | GET, POST, Bild-Upload mit Auth-Header |
| `lib/screens/login_screen.dart` | Login-UI |
| `lib/screens/home_screen.dart` | Bottom-Navigation mit 4 Tabs |
| `lib/screens/calendar_screen.dart` | Placeholder – Arbeitskalender |
| `lib/screens/checkin_screen.dart` | Check-in / Check-out Button |
| `lib/screens/absence_screen.dart` | Ferienanfrage + Absenz einreichen |
| `lib/screens/report_screen.dart` | Kamera öffnen, Bild aufnehmen, Hochladen |

### Noch zu implementieren

- Kalender mit echten Schicht-Daten aus Planning Service
- Check-in/out mit API-Aufruf verbinden
- Ferienanfrage-Formular mit Datumswahl
- Bild-Upload tatsächlich mit Report Service verbinden
- Auftrags-Daten herunterladen (Order Service)
- Info-/Rechteanzeige des eigenen Benutzers

> **Hinweis:** Im Android-Emulator ist `http://10.0.2.2:8000` die Adresse des Hosts (= `localhost` des Computers). Für echte Geräte muss die lokale IP-Adresse verwendet werden.

---

## 9. Datenbanken

### MySQL · Port 3306

Wird verwendet für **alle strukturierten Daten**.

**Datenbank:** `workforce`  
**Benutzer:** `workforce` / `workforce`

Tabellen (automatisch angelegt via `database/mysql/init.sql`):

| Tabelle | Inhalt |
|---|---|
| `roles` | ADMIN, HR, SHIFT_LEAD, EMPLOYEE |
| `users` | Alle Benutzer mit Rollenzuweisung |
| `orders` | Aufträge |
| `order_employees` | Zuordnung Mitarbeiter ↔ Auftrag |
| `work_plans` | Arbeitspläne |
| `shifts` | Einzelschichten |
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
  "storage_path": "/uploads/...",
  "uploaded_at": "2024-01-15T14:30:00Z",
  "metadata": {}
}
```

**Mongo Express:** [http://localhost:8081](http://localhost:8081)

---

## 10. Docker & lokale Umgebung

### Voraussetzungen

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installiert und gestartet
- Ports 3001–3003, 8000–8008, 3306, 27017, 8080, 8081 sind frei

### Alle Container starten

```bash
docker compose up --build
```

### Nur Datenbanken starten (für lokale Entwicklung)

```bash
docker compose up mysql-db mongo-db phpmyadmin mongo-express
```

Danach kann jeder Spring-Boot-Service direkt aus IntelliJ gestartet werden (ohne Docker), da er sich gegen die lokale MySQL/MongoDB verbindet.

### Einzelnen Service neu bauen

```bash
docker compose up --build auth-service
```

### Alle Container stoppen

```bash
docker compose down
```

### Datenbank-Volumes löschen (Reset)

```bash
docker compose down -v
```

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
| Admin Web              | 3001  |
| HR Web                 | 3002  |
| Schichtleiter Web      | 3003  |
| MySQL                  | 3306  |
| MongoDB                | 27017 |
| phpMyAdmin             | 8080  |
| Mongo Express          | 8081  |

---

## 12. Arbeitsweise im Team (Kanban)

Das Kanban-Board findet ihr direkt hier im GitHub-Repository unter dem Tab **Projects**.

### Branch-Strategie

```
main                    ← stabiler Stand, nur via Pull Request
└── feature/<name>      ← jeder arbeitet auf seinem Feature-Branch
```

Beispiele:
- `feature/time-service-checkin`
- `feature/hr-web-invoices`
- `feature/flutter-calendar`

### Workflow pro Use Case / Kanban-Karte

1. Karte im Kanban-Board von **To Do** → **In Progress** verschieben
2. Feature-Branch erstellen:
   ```bash
   git checkout -b feature/<name>
   ```
3. Implementieren, committen
4. Pull Request auf `main` erstellen
5. Kurze Gegenkontrolle durch eine andere Person (Code Review)
6. Merge → Karte auf **Done** verschieben

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
