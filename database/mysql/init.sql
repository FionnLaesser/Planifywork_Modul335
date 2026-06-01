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
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- ── Orders ───────────────────────────────────────────────────────────────────

CREATE TABLE orders (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(200) NOT NULL,
    description     TEXT,
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

CREATE TABLE work_plans (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    title           VARCHAR(200),
    shift_lead_id   BIGINT,
    start_date      DATE,
    end_date        DATE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shift_lead_id) REFERENCES users(id)
);

CREATE TABLE shifts (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    work_plan_id BIGINT,
    employee_id  BIGINT,
    shift_date   DATE,
    start_time   TIME,
    end_time     TIME,
    notes        TEXT,
    FOREIGN KEY (work_plan_id) REFERENCES work_plans(id),
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

-- ── Seed: Roles ──────────────────────────────────────────────────────────────

INSERT INTO roles (name) VALUES ('ADMIN'), ('HR'), ('SHIFT_LEAD'), ('EMPLOYEE');

-- ── Seed: Test-User (Passwort fuer alle: "password") ─────────────────────────
-- BCrypt-Hash fuer "password" mit Staerke 10

INSERT INTO users (username, email, password, first_name, last_name, role_id, active) VALUES
('admin',      'admin@workforce.ch',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'System',  'Admin',     1, true),
('hr.mueller', 'hr@workforce.ch',       '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Anna',    'Mueller',   2, true),
('sl.huber',   'sl@workforce.ch',       '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Bruno',   'Huber',     3, true),
('emp.meier',  'emp@workforce.ch',      '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Clara',   'Meier',     4, true);
