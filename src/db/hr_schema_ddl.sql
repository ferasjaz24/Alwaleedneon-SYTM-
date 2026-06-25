-- ============================================================================
-- SQL SCRIPT: Al-Waleed Neon Custom ERP - Relational Database Schema Model
-- TARGET SYSTEM: PostgreSQL 15+ (Production Grade)
-- DESCRIPTION: HR & Personnel Affairs relational model with high-speed indexes,
--              cascade safety triggers, GOSI tracking, and deep auditing schemas.
-- AUDIT USER: Super Admin / Owner Feras
-- ============================================================================

CREATE TYPE employee_status_enum AS ENUM ('ACTIVE', 'PROBATION', 'SUSPENDED', 'OFFBOARDING', 'TERMINATED');
CREATE TYPE contract_type_enum AS ENUM ('SAUDI_FIXED', 'SAUDI_INDEFINITE', 'EXP_RELATIONAL', 'PART_TIME', 'TEMPORARY_PROJECT_BASED');
CREATE TYPE leave_type_enum AS ENUM ('ANNUAL', 'SICK', 'EMERGENCY', 'UNPAID', 'MARRIAGE', 'COMPASSIONATE');
CREATE TYPE attendance_source_enum AS ENUM ('BIOMETRIC_TERMINAL', 'MOBILE_GEOFENCED_GPS', 'DYNAMIC_QR_CODE');

-- 1. COMPANIES & REGIONAL BRANCHES table
CREATE TABLE branches (
    branch_id VARCHAR(50) PRIMARY KEY,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    coordinates_gps POINT, -- Geofencing installation check coordinates
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. ORGANIZATIONS, DIVISIONS, & DEPARTMENTS table (Adjacency Schema)
CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    branch_id VARCHAR(50) REFERENCES branches(branch_id) ON DELETE CASCADE,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    parent_id INT REFERENCES departments(department_id) ON DELETE SET NULL, -- Self-referencing recursive node tree
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. JOB TITLES & GRADE SCALES TABLE (Specific advertising specifications)
CREATE TABLE job_titles (
    title_id SERIAL PRIMARY KEY,
    job_code VARCHAR(30) UNIQUE NOT NULL,
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255) NOT NULL,
    target_grade INT CHECK (target_grade BETWEEN 1 AND 10),
    basic_salary_min NUMERIC(12, 2) NOT NULL,
    basic_salary_max NUMERIC(12, 2) NOT NULL,
    field_allowance_risks NUMERIC(12, 2) DEFAULT 0.00, -- Risk allowance for Neon/Signage fabrication & high-altitude hoisting
    target_sales_kpi NUMERIC(12, 2) DEFAULT 0.00, -- KPI targets for sign estimators/reps
    safety_gear_checklist JSONB, -- list of required certificates such as 'Working at Heights Certification'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. ERP EMPLOYEE MASTER DIRECTORY
CREATE TABLE employees (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'EMP-1001'
    arabic_name VARCHAR(255) NOT NULL, -- Quadruple Bilingual Arabic name
    english_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20),
    iqama_national_id VARCHAR(15) UNIQUE NOT NULL,
    passport_number VARCHAR(20) UNIQUE NOT NULL,
    birth_date DATE NOT NULL,
    role_level VARCHAR(50) NOT NULL DEFAULT 'Employee', -- super_admin, hrm_manager, technician
    department_id INT REFERENCES departments(department_id) ON DELETE RESTRICT,
    title_id INT REFERENCES job_titles(title_id) ON DELETE RESTRICT,
    basic_salary NUMERIC(12, 2) NOT NULL CHECK (basic_salary > 0),
    allowance_housing NUMERIC(12, 2) DEFAULT 0.00,
    allowance_transport NUMERIC(12, 2) DEFAULT 0.00,
    allowance_phone NUMERIC(12, 2) DEFAULT 0.00,
    allowance_risk NUMERIC(12, 2) DEFAULT 0.00,
    bank_iban VARCHAR(34) NOT NULL,
    bank_swift VARCHAR(11) DEFAULT 'SABBRIYXXXX',
    home_address VARCHAR(500) NOT NULL,
    date_of_joining DATE NOT NULL,
    status employee_status_enum DEFAULT 'PROBATION',
    is_gosi_subscribed BOOLEAN DEFAULT FALSE, -- General Organization for Social Insurance Subscriptions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. RECRUITMENT & PORTFOLIO APPLICATION TRACKING
CREATE TABLE recruitment_applications (
    application_id SERIAL PRIMARY KEY,
    applicant_name VARCHAR(255) NOT NULL,
    email VARCHAR(150),
    mobile_phone VARCHAR(30) NOT NULL,
    applied_job_title VARCHAR(255) NOT NULL,
    cv_file_url VARCHAR(500) NOT NULL,
    interviewer_score NUMERIC(3, 2) CHECK (interviewer_score BETWEEN 0.00 AND 5.00),
    interview_technical_notes TEXT,
    requisition_status VARCHAR(50) DEFAULT 'UNDER_REVIEW', -- SUBMITTED, APPROVED, OFFERED, PROMOTED_TO_EMP
    promoted_employee_id VARCHAR(50) REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. CONTRACTS LIFECYCLE LEDGER
CREATE TABLE contracts (
    contract_id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    contract_type contract_type_enum NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE, -- NULL represents indefinite contract for Saudi nationals
    is_signed BOOLEAN DEFAULT FALSE,
    special_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_contract_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- 7. INDEPENDENT TIME & ATTENDANCE INGESTION MACHINE
CREATE TABLE attendance_logs (
    log_id BIGSERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
    clock_out TIMESTAMP WITH TIME ZONE,
    late_minutes INT DEFAULT 0,
    overtime_minutes INT DEFAULT 0,
    source_terminal attendance_source_enum DEFAULT 'BIOMETRIC_TERMINAL',
    field_gps_verified BOOLEAN DEFAULT FALSE, -- Flag verifying GPS placement constraints
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. FRACTIONAL LEAVE BALANCE && ACCRUALS LEDGER
CREATE TABLE leaves_ledger (
    ledger_id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type leave_type_enum NOT NULL,
    total_annual_allowance NUMERIC(5, 2) NOT NULL DEFAULT 30.00,
    remaining_balance NUMERIC(5, 2) NOT NULL DEFAULT 30.00,
    last_accrual_run DATE DEFAULT CURRENT_DATE,
    CONSTRAINT unique_emp_leave_type UNIQUE (employee_id, leave_type)
);

-- 9. LIVE PENDING AUDITS MATRIX
CREATE TABLE core_audit_trails (
    trail_id BIGSERIAL PRIMARY KEY,
    operator_username VARCHAR(100) NOT NULL, -- references editor login (e.g. Feras)
    employee_id VARCHAR(50) REFERENCES employees(id) ON DELETE SET NULL,
    field_changed VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(45),
    triggered_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- HIGH-PERFORMANCE DATABASE INDEX KEYS (FOR REAL-TIME PAGINATION & CONSTRAINTS)
-- ============================================================================

-- Fast lookup index for employee identification searches
CREATE UNIQUE INDEX idx_employees_iqama ON employees(iqama_national_id);
CREATE INDEX idx_employees_eng_name ON employees(english_name);
CREATE INDEX idx_employees_department ON employees(department_id);

-- Speed up monthly pagination performance for biometric hardware tracking
CREATE INDEX idx_attendance_monthly ON attendance_logs(employee_id, clock_in) 
       INCLUDE (late_minutes, overtime_minutes);

-- Quick expiry alert indices for compliance managers (<90, <60, <30 days)
CREATE INDEX idx_employees_contract_expire ON employees(contract_expiry);

-- High-speed tracking of audit trails per employee
CREATE INDEX idx_audit_trails_employee ON core_audit_trails(employee_id);

-- ============================================================================
-- LIVE TRANSITION TRIGGER FOR AUTOMATIC CANDIDATE IMMIGRATION ON APPROVAL
-- ============================================================================

CREATE OR REPLACE FUNCTION promote_candidate_to_employee()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.requisition_status = 'PROMOTED_TO_EMP' AND OLD.requisition_status <> 'PROMOTED_TO_EMP' THEN
        -- Insert new active worker draft into Employees register
        INSERT INTO employees (
            id,
            arabic_name,
            english_name,
            iqama_national_id,
            passport_number,
            birth_date,
            department_id,
            basic_salary,
            bank_iban,
            home_address,
            date_of_joining,
            status
        ) VALUES (
            'EMP-' || CAST((floor(random() * (9999-1000+1)) + 1000) AS INT),
            NEW.applicant_name,
            NEW.applicant_name, -- Temporary bilingual map
            '2' || CAST((floor(random() * (999999999-100000000+1)) + 100000000) AS INT), -- Simulated Iqama
            'SA' || CAST((floor(random() * (9999999-1000000+1)) + 1000000) AS INT), -- passport
            '1995-01-01',
            1, -- default general department
            5500.00, -- default base salary
            'SA7300000000000000000000',
            'Saudi National Address, Riyadh HQ',
            CURRENT_DATE,
            'PROBATION'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_candidate_migration
AFTER UPDATE ON recruitment_applications
FOR EACH ROW
EXECUTE FUNCTION promote_candidate_to_employee();
