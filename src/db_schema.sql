-- =========================================================================
-- ENTERPRISE ERP SYSTEM FOR AL-WALEED NEON MANUFACTURING
-- COMPREHENSIVE RELATIONAL DATABASE SCHEMA (POSTGRESQL SPECIFICATION)
-- High-Performance Schema incorporating Sales, CRM, Manufacturing, BoM, 
-- Engineering, Inventory, Procurement, Finance, HR with RBAC & Auditing.
-- =========================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DEPARTMENTS
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. ROLES (RBAC)
CREATE TABLE roles (
    role_name VARCHAR(50) PRIMARY KEY,
    description TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. PERMISSIONS (RBAC)
CREATE TABLE permissions (
    permission_key VARCHAR(100) PRIMARY KEY,
    module VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. ROLE_PERMISSIONS
CREATE TABLE role_permissions (
    role_name VARCHAR(50) REFERENCES roles(role_name) ON DELETE CASCADE,
    permission_key VARCHAR(100) REFERENCES permissions(permission_key) ON DELETE CASCADE,
    PRIMARY KEY (role_name, permission_key)
);

-- 5. USERS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(150) UNIQUE,
    assigned_role VARCHAR(50) REFERENCES roles(role_name) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Deactivated')),
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. EMPLOYEES
CREATE TABLE employees (
    id VARCHAR(50) PRIMARY KEY, -- 'EMP-1001'
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    arabic_name VARCHAR(255) NOT NULL,
    english_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20),
    iqama_national_id VARCHAR(15) UNIQUE NOT NULL,
    passport_number VARCHAR(20) UNIQUE NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE RESTRICT,
    job_title VARCHAR(100) NOT NULL,
    grade VARCHAR(20) NOT NULL,
    basic_salary DECIMAL(12,2) NOT NULL CHECK (basic_salary > 0),
    allowance_housing DECIMAL(12,2) DEFAULT 0.00,
    allowance_transport DECIMAL(12,2) DEFAULT 0.00,
    allowance_phone DECIMAL(12,2) DEFAULT 0.00,
    bank_iban VARCHAR(34),
    home_address TEXT,
    custody_records JSONB DEFAULT '{}'::jsonb,
    birth_date DATE NOT NULL,
    date_of_joining DATE NOT NULL,
    contract_expiry_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Probation', 'Suspended', 'Offboarding', 'Terminated')),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. ATTENDANCE
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(50) REFERENCES employees(id) ON DELETE CASCADE,
    clock_in TIMESTAMP WITH TIME ZONE NOT NULL,
    clock_out TIMESTAMP WITH TIME ZONE,
    late_minutes INT DEFAULT 0,
    overtime_minutes INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Draft',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. LEAVE REQUESTS
CREATE TABLE leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id VARCHAR(50) REFERENCES employees(id) ON DELETE CASCADE,
    leave_type VARCHAR(30) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INT NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    reason TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. CLIENTS (CRM)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    vat_number VARCHAR(20),
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    address TEXT NOT NULL,
    currency VARCHAR(10) DEFAULT 'SAR',
    account_status VARCHAR(20) DEFAULT 'Active' CHECK (account_status IN ('Active', 'Suspended', 'Inactive')),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. CONTACTS (CRM Sub-resource)
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(100),
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    is_primary BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. LEADS (Opportunity Pipeline)
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    company_name VARCHAR(255),
    contact_name VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    source VARCHAR(50), -- Web, Walk-in, Cold Call
    status VARCHAR(30) DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Design Phase', 'Estimation', 'Quotation Sent', 'Negotiation', 'Won', 'Lost')),
    estimated_revenue DECIMAL(12,2) DEFAULT 0.00,
    notes TEXT,
    assigned_sales_rep VARCHAR(100),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. QUOTATIONS
CREATE TABLE quotations (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'QT-2026-001'
    client_id UUID REFERENCES clients(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(30) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Rejected', 'Revised')),
    neon_meters DECIMAL(8,2) DEFAULT 0.00,
    installation_fees DECIMAL(12,2) DEFAULT 0.00,
    discount_amount DECIMAL(12,2) DEFAULT 0.00,
    tax_rate DECIMAL(4,2) DEFAULT 0.15,
    grand_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    scope_of_work TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. QUOTATION_ITEMS
CREATE TABLE quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id VARCHAR(50) REFERENCES quotations(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    unit_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    subtotal DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    height_cm DECIMAL(8,2),
    width_cm DECIMAL(8,2),
    materials_notes TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. PROJECTS (Core Project Entity - Single Source of Truth)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_code VARCHAR(50) UNIQUE NOT NULL, -- 'PRJ-2026-001'
    quotation_id VARCHAR(50) REFERENCES quotations(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    details TEXT,
    proposed_price DECIMAL(12,2) NOT NULL,
    design_approved BOOLEAN DEFAULT FALSE,
    design_approver VARCHAR(100),
    design_file_url VARCHAR(500),
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    status VARCHAR(30) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Planning', 'Production', 'Quality Check', 'Ready For Installation', 'Installed', 'Completed', 'Closed')),
    overall_progress DECIMAL(5,2) DEFAULT 0.00,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. PROJECT_STAGES
CREATE TABLE project_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    stage_name VARCHAR(100) NOT NULL,
    stage_order INT NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'On Hold')),
    start_date DATE,
    end_date DATE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. PROJECT_ACTIVITIES
CREATE TABLE project_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- Log, Milestone, Communication, Action
    description TEXT NOT NULL,
    employee_id VARCHAR(50) REFERENCES employees(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. PRODUCT_CATEGORIES
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL, -- Neon Flex, Acrylic Sheet, LED Driver, Cladding Panels
    description TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 18. PRODUCTS (Raw materials AND finished manufacturing templates)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category_id UUID REFERENCES product_categories(id) ON DELETE RESTRICT,
    description TEXT,
    unit_of_measure VARCHAR(20) DEFAULT 'pcs', -- meters, sheets, roll, pack
    standard_cost DECIMAL(12,2) DEFAULT 0.00,
    list_price DECIMAL(12,2) DEFAULT 0.00,
    is_raw_material BOOLEAN DEFAULT TRUE,
    is_manufactured BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 19. BILL OF MATERIALS (BOM)
CREATE TABLE bill_of_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE, -- Manufactured output
    name VARCHAR(255) NOT NULL, -- e.g., 'Standard Acrylic Channel Letter BOM'
    version VARCHAR(20) DEFAULT '1.0',
    is_active BOOLEAN DEFAULT TRUE,
    estimated_manufacturing_hours DECIMAL(6,2),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 20. BOM_ITEMS
CREATE TABLE bom_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bom_id UUID REFERENCES bill_of_materials(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT, -- raw component
    quantity_required DECIMAL(10,3) NOT NULL,
    waste_percentage DECIMAL(4,2) DEFAULT 0.00,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 21. PRODUCTION_ORDERS
CREATE TABLE production_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_code VARCHAR(50) UNIQUE NOT NULL, -- 'PO-2026-001'
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    bom_id UUID REFERENCES bill_of_materials(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'Waiting' CHECK (status IN ('Waiting', 'Scheduled', 'In Progress', 'Paused', 'Completed')),
    scheduled_start TIMESTAMP WITH TIME ZONE,
    scheduled_end TIMESTAMP WITH TIME ZONE,
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    scrap_percentage DECIMAL(4,2) DEFAULT 0.00,
    supervisor_feedback TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 22. PRODUCTION_STAGES
CREATE TABLE production_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_order_id UUID REFERENCES production_orders(id) ON DELETE CASCADE,
    stage_name VARCHAR(100) NOT NULL, -- Design, Laser Cutting, CNC, Welding, Assembly...
    stage_order INT NOT NULL,
    operator_id VARCHAR(50) REFERENCES employees(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Paused', 'Completed')),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    actual_hours DECIMAL(6,2) DEFAULT 0.00,
    expected_hours DECIMAL(6,2) DEFAULT 0.00,
    logs JSONB DEFAULT '[]'::jsonb,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 23. PRODUCTION_TASKS
CREATE TABLE production_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_stage_id UUID REFERENCES production_stages(id) ON DELETE CASCADE,
    assigned_employee_id VARCHAR(50) REFERENCES employees(id) ON DELETE RESTRICT,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20) DEFAULT 'Normal',
    status VARCHAR(20) DEFAULT 'Pending',
    completed_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 24. WAREHOUSES
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL, -- 'WH-MAIN', 'WH-FAB'
    location VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 25. INVENTORY
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE RESTRICT,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    qty_available DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    qty_reserved DECIMAL(12,3) NOT NULL DEFAULT 0.000,
    reorder_point DECIMAL(12,3) DEFAULT 5.000,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (warehouse_id, product_id)
);

-- 26. INVENTORY_TRANSACTIONS
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE RESTRICT,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    transaction_type VARCHAR(30) NOT NULL, -- Receipt, Consumption, Adjustment, Reserve, Deduction
    qty DECIMAL(12,3) NOT NULL,
    reference_id VARCHAR(100), -- PO number, Production code
    notes TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 27. INVENTORY_RESERVATIONS
CREATE TABLE inventory_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_order_id UUID REFERENCES production_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE RESTRICT,
    qty_reserved DECIMAL(12,3) NOT NULL,
    is_released BOOLEAN DEFAULT FALSE,
    is_consumed BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 28. SUPPLIERS
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(150),
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    address TEXT,
    vat_number VARCHAR(20),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 29. PURCHASE_REQUESTS
CREATE TABLE purchase_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_code VARCHAR(50) UNIQUE NOT NULL, -- 'PR-2026-001'
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    production_order_id UUID REFERENCES production_orders(id) ON DELETE SET NULL,
    requested_by VARCHAR(100) NOT NULL,
    status VARCHAR(30) DEFAULT 'Requested' CHECK (status IN ('Requested', 'Approved', 'Rejected', 'Ordered')),
    approval_notes TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 30. PURCHASE_ORDERS
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_code VARCHAR(50) UNIQUE NOT NULL, -- 'PO-2026-001'
    purchase_request_id UUID REFERENCES purchase_requests(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
    status VARCHAR(30) DEFAULT 'Ordered' CHECK (status IN ('Ordered', 'Partially Received', 'Received', 'Cancelled')),
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    delivery_date DATE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 31. PURCHASE_ORDER_ITEMS
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    quantity DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(12,2) NOT NULL,
    quantity_received DECIMAL(10,2) DEFAULT 0.00,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 32. INSTALLATIONS
CREATE TABLE installations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    installation_code VARCHAR(50) UNIQUE NOT NULL, -- 'INST-2026-001'
    site_address TEXT NOT NULL,
    scheduled_date DATE_CREATED DATE,
    actual_installation_date DATE,
    status VARCHAR(30) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Cancelled')),
    lead_supervisor_id VARCHAR(50) REFERENCES employees(id) ON DELETE SET NULL,
    safety_audit_signed BOOLEAN DEFAULT FALSE,
    customer_signoff_name VARCHAR(150),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 33. INSTALLATION_TASKS
CREATE TABLE installation_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    installation_id UUID REFERENCES installations(id) ON DELETE CASCADE,
    assigned_technician_id VARCHAR(50) REFERENCES employees(id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    difficulty_grade VARCHAR(20) DEFAULT 'Medium',
    is_completed BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 34. INVOICES
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_code VARCHAR(50) UNIQUE NOT NULL, -- 'INV-2026-001'
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE RESTRICT,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,
    tax_amount DECIMAL(12,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'Unpaid' CHECK (status IN ('Unpaid', 'Partially Paid', 'Paid', 'Overdue')),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 35. PAYMENTS
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- Bank Transfer, Riyad Bank Link, Cash, Cheque
    reference_no VARCHAR(100),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 36. COLLECTIONS (Cash pipeline & client milestones collection)
CREATE TABLE collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    milestone_name VARCHAR(100) NOT NULL, -- Down-payment, Pre-installation, Upon Delivery
    percentage DECIMAL(5,2) NOT NULL,
    target_amount DECIMAL(12,2) NOT NULL,
    collected_amount DECIMAL(12,2) DEFAULT 0.00,
    status VARCHAR(25) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Partially Paid', 'Paid', 'Overdue')),
    collection_due_date DATE,
    actual_collected_date DATE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 37. EXPENSES
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    expense_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    category VARCHAR(100) NOT NULL, -- Rent, Hardware, Marketing, Fuel...
    description TEXT,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 38. PROJECT_COSTS (Per project financial costing & final gross margins)
CREATE TABLE project_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    material_cost_actual DECIMAL(12,2) DEFAULT 0.00,
    labor_cost_actual DECIMAL(12,2) DEFAULT 0.00,
    overhead_cost_actual DECIMAL(12,2) DEFAULT 0.00,
    total_cost DECIMAL(12,2) GENERATED ALWAYS AS (material_cost_actual + labor_cost_actual + overhead_cost_actual) STORED,
    profit DECIMAL(12,2) DEFAULT 0.00,
    margin_percentage DECIMAL(5,2) DEFAULT 0.00,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(100) DEFAULT 'SYSTEM',
    updated_by VARCHAR(100) DEFAULT 'SYSTEM',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 39. AUDIT_LOGS
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    username VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL, -- e.g. CREATE, UPDATE, DELETE, APPROVE, STATUS CHANGED
    entity_name VARCHAR(100), -- projects, employees, quotations
    entity_id VARCHAR(100),
    old_value JSONB,
    new_value JSONB,
    triggered_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 40. NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
