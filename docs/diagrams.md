# UML- & Architekturdiagramme – PlanifyWork

Alle Diagramme sind in [Mermaid](https://mermaid.js.org/) verfasst und werden in GitHub, GitLab und modernen Markdown-Viewern direkt gerendert.

---

## 1. Systemarchitektur

```mermaid
graph TB
    subgraph Clients["Clients"]
        BROWSER["Webbrowser"]
        MOBILE["Flutter Mobile App\nAndroid / iOS"]
    end

    subgraph Frontend["Frontends (Nginx in Docker)"]
        AW["Admin Web\n:3001"]
        HW["HR Web\n:3002"]
        SW["Schichtleiter Web\n:3003"]
        FW["Flipper Auth Web\n:3004"]
    end

    subgraph Gateway["API Gateway"]
        GW["Spring Cloud Gateway :8000\nJWT-Prüfung · CORS · Routing"]
    end

    subgraph Services["Backend Microservices (Spring Boot 3.3 / JVM 21)"]
        AS["Auth Service\n:8001"]
        URS["User & Role Service\n:8002"]
        OS["Order Service\n:8003"]
        PS["Planning Service\n:8004"]
        TS["Time Service\n:8005"]
        AVS["Absence/Vacation Service\n:8006"]
        BS["Billing Service\n:8007"]
        RMS["Report/Media Service\n:8008"]
        FAS["Flipper Auth Service\n:8009"]
    end

    subgraph DBs["Datenbanken"]
        MYSQL[("MySQL :3307\nworkforce DB")]
        MONGO[("MongoDB :27017\nworkforce-media DB")]
    end

    BROWSER --> AW & HW & SW & FW
    MOBILE --> GW
    AW & HW & SW & FW --> GW

    GW --> AS & URS & OS & PS & TS & AVS & BS & RMS & FAS

    AS & URS & OS & PS & TS & AVS & BS & FAS --> MYSQL
    RMS --> MONGO
```

---

## 2. Deployment-Diagramm (Docker Compose)

```mermaid
graph TB
    subgraph Host["Windows Host"]
        subgraph DC["docker-compose.yml"]
            subgraph FE["Frontend Container (Nginx)"]
                C1["admin-web :3001"]
                C2["hr-web :3002"]
                C3["shiftlead-web :3003"]
                C4["flipper-auth-web :3004"]
            end
            subgraph BE["Backend Container (JVM 21)"]
                C5["api-gateway :8000"]
                C6["auth-service :8001"]
                C7["user-role-service :8002"]
                C8["order-service :8003"]
                C9["planning-service :8004"]
                C10["time-service :8005"]
                C11["absence-vacation-service :8006"]
                C12["billing-service :8007"]
                C13["report-media-service :8008"]
                C14["flipper-auth-service :8009"]
            end
            subgraph DB["Datenbank Container"]
                C15[("mysql-db\n:3307 → :3306")]
                C16[("mongo-db\n:27017")]
                C17["phpMyAdmin :8080"]
                C18["mongo-express :8081"]
            end
        end
        FLUTTER["Flutter App\n(Emulator: 10.0.2.2:8000)"]
    end

    C1 & C2 & C3 & C4 --> C5
    C5 --> C6 & C7 & C8 & C9 & C10 & C11 & C12 & C13 & C14
    C6 & C7 & C8 & C9 & C10 & C11 & C12 & C14 --> C15
    C13 --> C16
    C17 --> C15
    C18 --> C16
    FLUTTER --> C5
```

---

## 3. Klassendiagramm – Domänenmodell (alle JPA-Entitäten)

```mermaid
classDiagram
    direction TB

    class User {
        +Long id
        +String username
        +String email
        +String password
        +String firstName
        +String lastName
        +Role role
        +boolean active
        +LocalDateTime createdAt
    }

    class Role {
        +Long id
        +RoleName name
    }

    class RoleName {
        <<enumeration>>
        ADMIN
        HR
        SHIFT_LEAD
        EMPLOYEE
    }

    class WorkOrder {
        +Long id
        +String title
        +String description
        +String company
        +String location
        +LocalDate startDate
        +LocalDate endDate
        +String requiredRole
        +OrderStatus status
        +Long assignedShiftLeadId
        +Long createdBy
        +LocalDateTime createdAt
    }

    class OrderStatus {
        <<enumeration>>
        OPEN
        IN_PROGRESS
        DONE
    }

    class OrderEmployee {
        +OrderEmployeeId id
    }

    class OrderEmployeeId {
        +Long orderId
        +Long employeeId
    }

    class WorkPlan {
        +Long id
        +String title
        +Long shiftLeadId
        +LocalDate startDate
        +LocalDate endDate
        +Long hourBudgetId
        +BigDecimal approvedHours
        +WorkPlanStatus status
        +LocalDateTime createdAt
        +LocalDateTime publishedAt
        +List~Shift~ shifts
    }

    class HourBudget {
        +Long id
        +Long shiftLeadId
        +Integer year
        +Integer month
        +BigDecimal approvedHours
        +Long createdBy
        +String notes
        +LocalDateTime createdAt
        +LocalDateTime updatedAt
    }

    class WorkPlanStatus {
        <<enumeration>>
        DRAFT
        PUBLISHED
    }

    class Shift {
        +Long id
        +WorkPlan workPlan
        +Long orderId
        +Long employeeId
        +LocalDate shiftDate
        +LocalTime startTime
        +LocalTime endTime
        +String notes
    }

    class TimeEntry {
        +Long id
        +Long employeeId
        +LocalDateTime checkIn
        +LocalDateTime checkOut
        +Integer breakMinutes
        +BigDecimal totalHours
        +LocalDate entryDate
    }

    class Absence {
        +Long id
        +Long employeeId
        +AbsenceType type
        +LocalDate startDate
        +LocalDate endDate
        +String reason
        +AbsenceStatus status
        +Long reviewedBy
        +String rejectionReason
        +LocalDateTime createdAt
    }

    class AbsenceType {
        <<enumeration>>
        VACATION
        SICK
        OTHER
    }

    class AbsenceStatus {
        <<enumeration>>
        PENDING
        APPROVED
        REJECTED
    }

    class Invoice {
        +Long id
        +Long orderId
        +Long createdBy
        +BigDecimal totalHours
        +BigDecimal amount
        +InvoiceStatus status
        +LocalDateTime createdAt
        +List~InvoicePosition~ positions
    }

    class InvoiceStatus {
        <<enumeration>>
        DRAFT
        SENT
        PAID
    }

    class InvoicePosition {
        +Long id
        +Invoice invoice
        +String description
        +BigDecimal hours
        +BigDecimal rate
        +BigDecimal subtotal
    }

    class PayrollStatement {
        +Long id
        +Long employeeId
        +Integer year
        +Integer month
        +BigDecimal hourlyRate
        +BigDecimal totalHours
        +BigDecimal grossAmount
        +BigDecimal bonusAmount
        +BigDecimal deductionAmount
        +BigDecimal netAmount
        +PayrollStatus status
        +Long createdBy
        +LocalDateTime createdAt
        +LocalDateTime updatedAt
    }

    class PayrollStatus {
        <<enumeration>>
        DRAFT
        APPROVED
        PAID
    }

    class FlipperDevice {
        +Long id
        +String flipperId
        +Long userId
        +String secret
    }

    class AuthSession {
        +Long id
        +Long userId
        +String challenge
        +AuthAction action
        +LocalDateTime expiresAt
        +boolean used
        +boolean success
        +Integer breakMinutes
    }

    class MediaReport {
        <<MongoDB Document>>
        +String id
        +Long employeeId
        +Long orderId
        +String rapportId
        +String filename
        +String contentType
        +Integer fileSize
        +String storagePath
        +Instant uploadedAt
        +Map~String,Object~ metadata
        +byte[] data
    }

    User "many" --> "1" Role : hat
    Role --> RoleName
    WorkOrder --> OrderStatus
    WorkOrder "1" o-- "0..*" OrderEmployee : zugeordnete Mitarbeiter
    OrderEmployee --> OrderEmployeeId
    WorkPlan --> WorkPlanStatus
    WorkPlan --> HourBudget : nutzt HR-Freigabe
    WorkPlan "1" *-- "0..*" Shift : enthält
    Absence --> AbsenceType
    Absence --> AbsenceStatus
    Invoice --> InvoiceStatus
    PayrollStatement --> PayrollStatus
    Invoice "1" *-- "0..*" InvoicePosition : hat
```

---

## 4. ER-Diagramm (MySQL – workforce DB)

```mermaid
erDiagram
    roles {
        bigint id PK
        varchar name UK
    }
    users {
        bigint id PK
        varchar username UK
        varchar email UK
        varchar password
        varchar firstName
        varchar lastName
        bigint role_id FK
        boolean active
        datetime createdAt
    }
    orders {
        bigint id PK
        varchar title
        text description
        varchar company
        varchar location
        date startDate
        date endDate
        varchar requiredRole
        varchar status
        bigint assignedShiftLeadId FK
        bigint createdBy FK
        datetime createdAt
    }
    order_employees {
        bigint order_id FK
        bigint employee_id FK
    }
    hour_budgets {
        bigint id PK
        bigint shift_lead_id FK
        int budget_year
        int budget_month
        decimal approved_hours
        bigint created_by FK
        varchar notes
        datetime created_at
        datetime updated_at
    }
    work_plans {
        bigint id PK
        varchar title
        bigint shift_lead_id FK
        bigint hour_budget_id FK
        date startDate
        date endDate
        decimal approvedHours
        varchar status
        datetime createdAt
        datetime publishedAt
    }
    shifts {
        bigint id PK
        bigint work_plan_id FK
        bigint order_id FK
        bigint employee_id FK
        date shiftDate
        time startTime
        time endTime
        text notes
    }
    time_entries {
        bigint id PK
        bigint employeeId FK
        datetime checkIn
        datetime checkOut
        int breakMinutes
        decimal totalHours
        date entryDate
    }
    absences {
        bigint id PK
        bigint employeeId FK
        varchar type
        date startDate
        date endDate
        varchar reason
        varchar status
        bigint reviewedBy FK
        varchar rejectionReason
        datetime createdAt
    }
    invoices {
        bigint id PK
        bigint orderId FK
        bigint createdBy FK
        decimal totalHours
        decimal amount
        varchar status
        datetime createdAt
    }
    invoice_positions {
        bigint id PK
        bigint invoice_id FK
        varchar description
        decimal hours
        decimal rate
        decimal subtotal
    }
    payroll_statements {
        bigint id PK
        bigint employee_id FK
        int payroll_year
        int payroll_month
        decimal hourly_rate
        decimal total_hours
        decimal gross_amount
        decimal bonus_amount
        decimal deduction_amount
        decimal net_amount
        varchar status
        bigint created_by FK
        datetime created_at
        datetime updated_at
    }
    flipper_device {
        bigint id PK
        varchar flipper_id UK
        bigint user_id FK
        varchar secret
    }
    auth_session {
        bigint id PK
        bigint user_id FK
        varchar challenge UK
        varchar action
        datetime expires_at
        boolean used
        boolean success
        int break_minutes
    }
    used_nonce {
        bigint id PK
        varchar nonce UK
        varchar flipper_id
        datetime created_at
    }

    roles ||--o{ users : "hat"
    users ||--o{ orders : "erstellt (createdBy)"
    users ||--o{ order_employees : "zugeordnet"
    users ||--o{ hour_budgets : "erhält Freigabe"
    users ||--o{ work_plans : "leitet (shiftLeadId)"
    users ||--o{ shifts : "eingeplant in"
    users ||--o{ time_entries : "hat"
    users ||--o{ absences : "beantragt"
    orders ||--o{ order_employees : "enthält"
    orders ||--o{ shifts : "referenziert in"
    orders ||--o{ invoices : "abgerechnet via"
    hour_budgets ||--o{ work_plans : "Kontingent für"
    work_plans ||--o{ shifts : "enthält"
    invoices ||--o{ invoice_positions : "hat"
    users ||--o{ payroll_statements : "Lohnauszug"
    users ||--o{ flipper_device : "hat"
    users ||--o{ auth_session : "startet"
```

---

## 5. Sequenzdiagramm – Login & JWT-Authentifizierung

```mermaid
sequenceDiagram
    actor Benutzer
    participant Frontend
    participant GW as API Gateway :8000
    participant Auth as Auth Service :8001
    participant DB as MySQL

    Benutzer->>Frontend: Benutzername + Passwort eingeben
    Frontend->>GW: POST /api/auth/login {username, password}
    GW->>Auth: Weiterleitung (kein JWT erforderlich)
    Auth->>DB: SELECT * FROM users WHERE username=?
    DB-->>Auth: User-Datensatz (BCrypt-Hash)
    Auth->>Auth: BCrypt.matches(password, hash)

    alt Passwort korrekt
        Auth->>Auth: JWT erstellen (sub=username, role, userId, exp=24h)
        Auth-->>GW: 200 {token, role, username, userId}
        GW-->>Frontend: 200 {token, role, username, userId}
        Frontend->>Frontend: token + userId in localStorage speichern
        Frontend-->>Benutzer: Weiterleitung auf Dashboard
    else Passwort falsch
        Auth-->>GW: 401 Unauthorized
        GW-->>Frontend: 401 Unauthorized
        Frontend-->>Benutzer: Fehlermeldung anzeigen
    end

    Note over Frontend,GW: Alle weiteren Requests\nAuthorization: Bearer token
```

---

## 6. Sequenzdiagramm – Check-in / Check-out (Mobile App)

```mermaid
sequenceDiagram
    actor Mitarbeiter
    participant App as Flutter Mobile App
    participant GW as API Gateway :8000
    participant TS as Time Service :8005
    participant DB as MySQL

    Mitarbeiter->>App: Check-in Button tippen
    App->>GW: POST /api/time/checkin {employeeId}\nAuthorization: Bearer JWT
    GW->>GW: JWT validieren, employeeId extrahieren
    GW->>TS: POST /api/time/checkin {employeeId}
    TS->>DB: INSERT time_entries (employeeId, checkIn=NOW(), entryDate)
    DB-->>TS: TimeEntry {id}
    TS-->>GW: 200 {id, checkIn}
    GW-->>App: 200 {id, checkIn}
    App-->>Mitarbeiter: "Eingecheckt um HH:mm"

    Note over Mitarbeiter,DB: Arbeitszeit läuft ...

    Mitarbeiter->>App: Check-out Button + Pausenminuten eingeben
    App->>GW: POST /api/time/checkout {employeeId, breakMinutes}
    GW->>TS: POST /api/time/checkout
    TS->>DB: SELECT * FROM time_entries\nWHERE employeeId=? AND checkOut IS NULL
    DB-->>TS: offener TimeEntry {id, checkIn}
    TS->>TS: totalHours = (NOW() - checkIn) - breakMinutes / 60
    TS->>DB: UPDATE time_entries SET checkOut=NOW(), totalHours=?
    DB-->>TS: OK
    TS-->>GW: 200 {totalHours, checkOut}
    GW-->>App: 200 {totalHours}
    App-->>Mitarbeiter: "Ausgecheckt – X.XX Stunden heute"
```

---

## 7. Sequenzdiagramm – Absenz einreichen & genehmigen

```mermaid
sequenceDiagram
    actor Mitarbeiter
    actor HR
    participant App as Flutter Mobile App
    participant HRWeb as HR Web :3002
    participant GW as API Gateway :8000
    participant ABS as Absence Service :8006
    participant DB as MySQL

    Mitarbeiter->>App: Ferienantrag ausfüllen (Typ, Von, Bis, Grund)
    App->>GW: POST /api/absences\n{employeeId, type, startDate, endDate, reason}
    GW->>ABS: POST /api/absences
    ABS->>DB: INSERT absences (status=PENDING)
    DB-->>ABS: Absence {id}
    ABS-->>App: 201 {id, status: PENDING}
    App-->>Mitarbeiter: Antrag eingereicht

    Note over HR,DB: HR öffnet offene Anträge

    HR->>HRWeb: Absenzen → Offene Anfragen
    HRWeb->>GW: GET /api/absences/pending
    GW->>ABS: GET /api/absences/pending
    ABS->>DB: SELECT * FROM absences WHERE status='PENDING'
    DB-->>ABS: [Absence, ...]
    ABS-->>HRWeb: Liste offener Anträge

    alt Genehmigen
        HR->>HRWeb: Genehmigen klicken
        HRWeb->>GW: PUT /api/absences/{id}/approve
        GW->>ABS: PUT /api/absences/{id}/approve
        ABS->>DB: UPDATE absences SET status='APPROVED', reviewedBy=hrId
        DB-->>ABS: OK
        ABS-->>HRWeb: 200 {status: APPROVED}
        HRWeb-->>HR: Absenz genehmigt
    else Ablehnen
        HR->>HRWeb: Ablehnen + Begründung eingeben
        HRWeb->>GW: PUT /api/absences/{id}/reject {rejectionReason}
        GW->>ABS: PUT /api/absences/{id}/reject
        ABS->>DB: UPDATE absences SET status='REJECTED', rejectionReason=?
        DB-->>ABS: OK
        ABS-->>HRWeb: 200 {status: REJECTED}
        HRWeb-->>HR: Absenz abgelehnt
    end
```

---

## 8. Sequenzdiagramm – Arbeitsplan erstellen & veröffentlichen

```mermaid
sequenceDiagram
    actor Schichtleiter
    participant SLWeb as Schichtleiter Web :3003
    participant GW as API Gateway :8000
    participant PS as Planning Service :8004
    participant DB as MySQL

    participant HRWeb as HR Web :3002

    HRWeb->>GW: POST /api/planning/hour-budgets\n{shiftLeadId, year, month, approvedHours}
    GW->>PS: POST /api/planning/hour-budgets
    PS->>DB: INSERT/UPDATE hour_budgets
    DB-->>PS: HourBudget {id, approvedHours}
    PS-->>HRWeb: 201 HourBudget

    Schichtleiter->>SLWeb: Neuen Arbeitsplan anlegen
    SLWeb->>GW: POST /api/planning/workplans\n{title, shiftLeadId, startDate, endDate}
    GW->>PS: POST /api/planning/workplans
    PS->>DB: SELECT hour_budgets für shiftLeadId + Monat
    DB-->>PS: HourBudget {approvedHours}
    PS->>DB: INSERT work_plans (hour_budget_id, approved_hours, status=DRAFT)
    DB-->>PS: WorkPlan {id}
    PS-->>SLWeb: 201 {id, status: DRAFT, approvedHours}

    loop Schichten hinzufügen
        Schichtleiter->>SLWeb: Schicht hinzufügen (Mitarbeiter, Datum, Zeit, Auftrag)
        SLWeb->>GW: POST /api/planning/workplans/{id}/shifts\n{employeeId, shiftDate, startTime, endTime, orderId}
        GW->>PS: POST /api/planning/workplans/{id}/shifts
        PS->>DB: INSERT shifts (work_plan_id=id)
        DB-->>PS: Shift {id}
        PS-->>SLWeb: 201 Shift
    end

    Schichtleiter->>SLWeb: Arbeitsplan veröffentlichen
    SLWeb->>GW: PUT /api/planning/workplans/{id}/publish
    GW->>PS: PUT /api/planning/workplans/{id}/publish
    PS->>DB: UPDATE work_plans SET status='PUBLISHED', publishedAt=NOW()
    DB-->>PS: OK
    PS-->>SLWeb: 200 {status: PUBLISHED}
    SLWeb-->>Schichtleiter: Plan veröffentlicht

    Note over Schichtleiter,DB: Mitarbeiter sehen Schichten\nim Flutter-Kalender
```

---

## 9. Sequenzdiagramm – Rapport-Bild hochladen (Mobile)

```mermaid
sequenceDiagram
    actor Mitarbeiter
    participant App as Flutter Mobile App
    participant GW as API Gateway :8000
    participant MS as Report/Media Service :8008
    participant Mongo as MongoDB

    Mitarbeiter->>App: Kamera öffnen, Foto aufnehmen
    App->>App: Bild in Byte-Array konvertieren (max. 10 MB)
    Mitarbeiter->>App: orderId und Notiz angeben
    App->>GW: POST /api/media/upload\nContent-Type: multipart/form-data\n{file, employeeId, orderId, note}
    GW->>MS: POST /api/media/upload (Multipart)
    MS->>MS: rapportId = UUID.randomUUID()
    MS->>MS: MediaReport erstellen\n(employeeId, orderId, filename, data, metadata)
    MS->>Mongo: save(MediaReport) → Collection media_reports
    Mongo-->>MS: MediaReport {id}
    MS-->>GW: 201 {id, rapportId, filename, uploadedAt}
    GW-->>App: 201 {id, rapportId, uploadedAt}
    App-->>Mitarbeiter: Rapport hochgeladen
```

---

## 10. Statusdiagramme

### 10.1 Auftragsstatus (WorkOrder)

```mermaid
stateDiagram-v2
    [*] --> OPEN : Auftrag erstellt (Admin)
    OPEN --> IN_PROGRESS : Schichtleiter beginnt Auftrag
    IN_PROGRESS --> DONE : Arbeit abgeschlossen
    DONE --> [*]

    OPEN : OPEN\nAuftrag offen, noch nicht begonnen
    IN_PROGRESS : IN_PROGRESS\nAuftrag wird bearbeitet
    DONE : DONE\nAuftrag abgeschlossen
```

### 10.2 Absenz-Status

```mermaid
stateDiagram-v2
    [*] --> PENDING : Mitarbeiter reicht Antrag ein
    PENDING --> APPROVED : HR genehmigt
    PENDING --> REJECTED : HR lehnt ab (mit Begründung)
    APPROVED --> [*]
    REJECTED --> [*]

    PENDING : PENDING\nWarte auf HR-Entscheid
    APPROVED : APPROVED\nAbsenz genehmigt
    REJECTED : REJECTED\nAbsenz abgelehnt
```

### 10.3 Rechnungsstatus (Invoice)

```mermaid
stateDiagram-v2
    [*] --> DRAFT : HR erstellt Rechnung
    DRAFT --> SENT : HR versendet Rechnung
    SENT --> PAID : Zahlung eingegangen
    PAID --> [*]

    DRAFT : DRAFT\nEntwurf – noch nicht versendet
    SENT : SENT\nRechnung versendet, Zahlung ausstehend
    PAID : PAID\nBezahlt
```

### 10.4 Arbeitsplan-Status (WorkPlan)

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Schichtleiter erstellt Plan
    DRAFT --> PUBLISHED : Schichtleiter veröffentlicht
    PUBLISHED --> [*]

    DRAFT : DRAFT\nEntwurf – nur Schichtleiter sichtbar
    PUBLISHED : PUBLISHED\nVeröffentlicht – Mitarbeiter sehen Schichten im Kalender
```

---

## 11. Use-Case-Diagramm

```mermaid
graph LR
    Admin(["Admin"])
    HR(["HR"])
    SL(["Schichtleiter"])
    EMP(["Mitarbeiter"])

    subgraph auth["Authentifizierung"]
        LOGIN(["Login / Logout"])
    end

    subgraph bv["Benutzerverwaltung"]
        BV1(["Benutzer anlegen"])
        BV2(["Benutzer bearbeiten"])
        BV3(["Rolle ändern"])
        BV4(["Benutzer deaktivieren"])
    end

    subgraph am["Auftragsmanagement"]
        AM1(["Auftrag erstellen"])
        AM2(["Auftrag zuweisen"])
        AM3(["Status ändern"])
        AM4(["Auftrag herunterladen"])
    end

    subgraph pl["Planung"]
        PL1(["Arbeitsplan erstellen"])
        PL2(["Schicht hinzufügen"])
        PL3(["Plan veröffentlichen"])
        PL4(["Kalender anzeigen"])
    end

    subgraph ze["Zeiterfassung"]
        ZE1(["Check-in"])
        ZE2(["Check-out"])
        ZE3(["Stunden anzeigen"])
    end

    subgraph ab["Absenzen"]
        AB1(["Absenz einreichen"])
        AB2(["Absenz genehmigen"])
        AB3(["Absenz ablehnen"])
    end

    subgraph bi["Rechnungen"]
        BI1(["Rechnung erstellen"])
        BI2(["Rechnung versenden"])
        BI3(["Als bezahlt markieren"])
    end

    subgraph rp["Rapport"]
        RP1(["Foto hochladen"])
        RP2(["Bilder anzeigen"])
    end

    Admin --- LOGIN
    HR --- LOGIN
    SL --- LOGIN
    EMP --- LOGIN

    Admin --- BV1 & BV2 & BV3 & BV4
    HR --- BV1 & BV2

    Admin --- AM1 & AM2 & AM3
    SL --- AM3
    EMP --- AM4

    SL --- PL1 & PL2 & PL3
    EMP --- PL4

    EMP --- ZE1 & ZE2
    HR --- ZE3
    SL --- ZE3

    EMP --- AB1
    HR --- AB2 & AB3

    HR --- BI1 & BI2 & BI3

    EMP --- RP1
    HR --- RP2
    Admin --- RP2
```