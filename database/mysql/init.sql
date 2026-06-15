-- Workforce Management System - MySQL Schema

CREATE DATABASE IF NOT EXISTS workforce;
USE workforce;

-- ── Users & Roles ────────────────────────────────────────────────────────────

CREATE TABLE roles (
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    name     VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE users (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    username     VARCHAR(100) NOT NULL UNIQUE,
    email        VARCHAR(150) NOT NULL UNIQUE,
    password     VARCHAR(255) NOT NULL,
    first_name   VARCHAR(100),
    last_name    VARCHAR(100),
    role_id      BIGINT NOT NULL,
    active       BOOLEAN DEFAULT TRUE,
    flipper_logged_in BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE flipper_device (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    flipper_id  VARCHAR(100) NOT NULL UNIQUE,
    user_id     BIGINT NOT NULL,
    secret      VARCHAR(255) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE auth_session (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    challenge   VARCHAR(255) NOT NULL UNIQUE,
    action      ENUM('LOGIN','LOGOUT') NOT NULL,
    expires_at  DATETIME(6) NOT NULL,
    used        BOOLEAN NOT NULL DEFAULT FALSE,
    success     BOOLEAN NOT NULL DEFAULT FALSE,
    break_minutes INT NOT NULL DEFAULT 0,
    created_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE used_nonce (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    nonce       VARCHAR(255) NOT NULL UNIQUE,
    flipper_id  VARCHAR(100) NOT NULL,
    created_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
);

-- ── Orders ───────────────────────────────────────────────────────────────────

CREATE TABLE orders (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
    company         VARCHAR(200),
    location        VARCHAR(200),
    start_date      DATE,
    end_date        DATE,
    required_role   VARCHAR(100),
    status          ENUM('OPEN','IN_PROGRESS','DONE') DEFAULT 'OPEN',
    assigned_shift_lead_id BIGINT,
    created_by      BIGINT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_shift_lead_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE order_employees (
    order_id    BIGINT,
    employee_id BIGINT,
    PRIMARY KEY (order_id, employee_id),
    FOREIGN KEY (order_id)    REFERENCES orders(id),
    FOREIGN KEY (employee_id) REFERENCES users(id)
);

-- ── Planning / Shifts ────────────────────────────────────────────────────────

CREATE TABLE hour_budgets (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    shift_lead_id   BIGINT NOT NULL,
    budget_year     INT NOT NULL,
    budget_month    INT NOT NULL,
    approved_hours  DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    created_by      BIGINT,
    notes           VARCHAR(500),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_hour_budget_shiftlead_month (shift_lead_id, budget_year, budget_month),
    FOREIGN KEY (shift_lead_id) REFERENCES users(id),
    FOREIGN KEY (created_by)    REFERENCES users(id)
);

CREATE TABLE work_plans (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    shift_lead_id   BIGINT NOT NULL,
    hour_budget_id  BIGINT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    approved_hours  DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    status          ENUM('DRAFT','PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at    TIMESTAMP NULL,
    FOREIGN KEY (shift_lead_id)  REFERENCES users(id),
    FOREIGN KEY (hour_budget_id) REFERENCES hour_budgets(id)
);

CREATE TABLE shifts (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    work_plan_id BIGINT NOT NULL,
    order_id     BIGINT NULL,
    employee_id  BIGINT NOT NULL,
    shift_date   DATE NOT NULL,
    start_time   TIME NOT NULL,
    end_time     TIME NOT NULL,
    notes        TEXT,
    FOREIGN KEY (work_plan_id) REFERENCES work_plans(id),
    FOREIGN KEY (order_id)     REFERENCES orders(id),
    FOREIGN KEY (employee_id)  REFERENCES users(id)
);

-- ── Time Tracking ────────────────────────────────────────────────────────────

CREATE TABLE time_entries (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id  BIGINT NOT NULL,
    check_in     DATETIME,
    check_out    DATETIME,
    break_minutes INT DEFAULT 0,
    total_hours  DECIMAL(5,2),
    entry_date   DATE,
    FOREIGN KEY (employee_id) REFERENCES users(id)
);

-- ── Absences & Vacations ─────────────────────────────────────────────────────

CREATE TABLE absences (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id  BIGINT NOT NULL,
    type         ENUM('VACATION','SICK','OTHER') NOT NULL,
    start_date   DATE NOT NULL,
    end_date     DATE NOT NULL,
    reason       TEXT,
    status            ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    reviewed_by       BIGINT,
    rejection_reason  TEXT,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES users(id),
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- ── Billing ──────────────────────────────────────────────────────────────────

CREATE TABLE invoices (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id     BIGINT,
    created_by   BIGINT,
    total_hours  DECIMAL(8,2),
    amount       DECIMAL(10,2),
    status       ENUM('DRAFT','SENT','PAID') DEFAULT 'DRAFT',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id)   REFERENCES orders(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE invoice_positions (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_id  BIGINT,
    description VARCHAR(255),
    hours       DECIMAL(6,2),
    rate        DECIMAL(8,2),
    subtotal    DECIMAL(10,2),
    FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

CREATE TABLE payroll_statements (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee_id     BIGINT NOT NULL,
    payroll_year    INT NOT NULL,
    payroll_month   INT NOT NULL,
    hourly_rate     DECIMAL(8,2) NOT NULL,
    total_hours     DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    gross_amount    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    bonus_amount    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    deduction_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    net_amount      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status          ENUM('DRAFT','APPROVED','PAID') NOT NULL DEFAULT 'DRAFT',
    created_by      BIGINT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_payroll_employee_month (employee_id, payroll_year, payroll_month),
    FOREIGN KEY (employee_id) REFERENCES users(id),
    FOREIGN KEY (created_by)  REFERENCES users(id)
);

-- ── Seed: Roles ──────────────────────────────────────────────────────────────

INSERT INTO roles (name) VALUES ('ADMIN'), ('HR'), ('SHIFT_LEAD'), ('EMPLOYEE');

-- Demo-Benutzer werden beim Start des user-role-service automatisch per
-- CommandLineRunner angelegt (BCrypt-Hash wird live generiert, kein Hardcode).
