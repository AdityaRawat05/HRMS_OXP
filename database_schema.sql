-- ============================================================
-- PeoplePay360 — HR & Payroll Operations Platform
-- Reference MySQL Database Schema
-- IMPORTANT: Reference ONLY for Phase 2 Prisma Translation.
-- DO NOT execute directly against SQLite.
-- ============================================================

CREATE TABLE roles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE role_permissions (
    role_id VARCHAR(36) NOT NULL,
    permission_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
    user_id VARCHAR(36) NOT NULL,
    role_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE companies (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    tax_id VARCHAR(50),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    currency VARCHAR(10) DEFAULT 'USD',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE departments (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL,
    manager_id VARCHAR(36),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE job_positions (
    id VARCHAR(36) PRIMARY KEY,
    department_id VARCHAR(36) NOT NULL,
    title VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

CREATE TABLE employees (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) UNIQUE,
    company_id VARCHAR(36) NOT NULL,
    department_id VARCHAR(36) NOT NULL,
    job_position_id VARCHAR(36) NOT NULL,
    employee_code VARCHAR(50) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    date_of_birth DATE,
    joining_date DATE NOT NULL,
    employment_status VARCHAR(30) DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (job_position_id) REFERENCES job_positions(id)
);

CREATE TABLE employee_contracts (
    id VARCHAR(36) PRIMARY KEY,
    employee_id VARCHAR(36) NOT NULL,
    contract_ref VARCHAR(50) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE,
    wage DECIMAL(12, 2) NOT NULL,
    contract_type VARCHAR(30) NOT NULL DEFAULT 'FULL_TIME',
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    working_schedule_id VARCHAR(36),
    salary_structure_id VARCHAR(36),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE working_schedules (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    hours_per_day DECIMAL(4, 2) DEFAULT 8.0,
    hours_per_week DECIMAL(4, 2) DEFAULT 40.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE working_schedule_lines (
    id VARCHAR(36) PRIMARY KEY,
    schedule_id VARCHAR(36) NOT NULL,
    day_of_week VARCHAR(15) NOT NULL,
    work_from TIME NOT NULL,
    work_to TIME NOT NULL,
    FOREIGN KEY (schedule_id) REFERENCES working_schedules(id) ON DELETE CASCADE
);

CREATE TABLE attendance (
    id VARCHAR(36) PRIMARY KEY,
    employee_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    check_in DATETIME NOT NULL,
    check_out DATETIME,
    worked_hours DECIMAL(5, 2) DEFAULT 0.0,
    overtime_hours DECIMAL(5, 2) DEFAULT 0.0,
    status VARCHAR(30) DEFAULT 'PRESENT',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE time_off_types (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(30) NOT NULL UNIQUE,
    requires_approval BOOLEAN DEFAULT TRUE,
    is_paid BOOLEAN DEFAULT TRUE
);

CREATE TABLE time_off_allocations (
    id VARCHAR(36) PRIMARY KEY,
    employee_id VARCHAR(36) NOT NULL,
    time_off_type_id VARCHAR(36) NOT NULL,
    allocated_days DECIMAL(5, 2) NOT NULL,
    used_days DECIMAL(5, 2) DEFAULT 0.0,
    year INT NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (time_off_type_id) REFERENCES time_off_types(id)
);

CREATE TABLE time_off_requests (
    id VARCHAR(36) PRIMARY KEY,
    employee_id VARCHAR(36) NOT NULL,
    time_off_type_id VARCHAR(36) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days DECIMAL(5, 2) NOT NULL,
    reason TEXT,
    status VARCHAR(30) DEFAULT 'SUBMITTED',
    approved_by VARCHAR(36),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (time_off_type_id) REFERENCES time_off_types(id)
);

CREATE TABLE salary_rule_categories (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    type VARCHAR(30) NOT NULL -- BASIC, ALLOWANCE, DEDUCTION, GROSS, NET, TAX
);

CREATE TABLE salary_structures (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE salary_rules (
    id VARCHAR(36) PRIMARY KEY,
    structure_id VARCHAR(36) NOT NULL,
    category_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,
    sequence INT DEFAULT 10,
    condition_type VARCHAR(30) DEFAULT 'ALWAYS', -- ALWAYS, PYTHON_EXPRESSION
    condition_code TEXT,
    amount_type VARCHAR(30) NOT NULL, -- FIXED, PERCENTAGE, CODE
    fixed_amount DECIMAL(12, 2) DEFAULT 0.0,
    percentage_rate DECIMAL(5, 2) DEFAULT 0.0,
    amount_code TEXT,
    FOREIGN KEY (structure_id) REFERENCES salary_structures(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES salary_rule_categories(id)
);

CREATE TABLE payroll_periods (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'OPEN'
);

CREATE TABLE payruns (
    id VARCHAR(36) PRIMARY KEY,
    period_id VARCHAR(36) NOT NULL,
    name VARCHAR(150) NOT NULL,
    status VARCHAR(30) DEFAULT 'DRAFT', -- DRAFT, COMPUTED, VALIDATED, PAID
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    validated_at DATETIME,
    FOREIGN KEY (period_id) REFERENCES payroll_periods(id)
);

CREATE TABLE payslips (
    id VARCHAR(36) PRIMARY KEY,
    payrun_id VARCHAR(36) NOT NULL,
    employee_id VARCHAR(36) NOT NULL,
    contract_id VARCHAR(36) NOT NULL,
    number VARCHAR(50) NOT NULL UNIQUE,
    basic_wage DECIMAL(12, 2) NOT NULL,
    gross_wage DECIMAL(12, 2) NOT NULL,
    net_wage DECIMAL(12, 2) NOT NULL,
    total_deductions DECIMAL(12, 2) NOT NULL,
    status VARCHAR(30) DEFAULT 'DRAFT',
    pdf_url VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payrun_id) REFERENCES payruns(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (contract_id) REFERENCES employee_contracts(id)
);

CREATE TABLE payslip_lines (
    id VARCHAR(36) PRIMARY KEY,
    payslip_id VARCHAR(36) NOT NULL,
    rule_id VARCHAR(36),
    category_code VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    total DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (payslip_id) REFERENCES payslips(id) ON DELETE CASCADE
);

CREATE TABLE payrun_warnings (
    id VARCHAR(36) PRIMARY KEY,
    payrun_id VARCHAR(36) NOT NULL,
    employee_id VARCHAR(36),
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payrun_id) REFERENCES payruns(id) ON DELETE CASCADE
);

CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(36),
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
