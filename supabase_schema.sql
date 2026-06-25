-- =========================================================================
-- SUPABASE DATABASE SCHEMA FOR AL-WALEED NEON MANUFACTURING ERP
-- COMPREHENSIVE 9-TABLE RELATIONAL POSTGRESQL SPECIFICATION
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS DB Table
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(100) NOT NULL,
    job_title VARCHAR(150),
    date_created VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) DEFAULT '123456'
);

-- 2. EMPLOYEES DB Table
DROP TABLE IF EXISTS employees CASCADE;
CREATE TABLE employees (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'EMP-1002'
    arabic_name VARCHAR(255) NOT NULL,
    english_name VARCHAR(255) NOT NULL,
    iqama_id VARCHAR(50) UNIQUE NOT NULL,
    passport_details VARCHAR(255) NOT NULL,
    job_title VARCHAR(150) NOT NULL,
    grade VARCHAR(50) NOT NULL,
    basic_salary NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    allowances JSONB DEFAULT '{"housing": 0, "transport": 0, "phone": 0, "food": 0}'::jsonb,
    home_address TEXT,
    custody JSONB DEFAULT '{"laptop": "", "tools": "", "vehicles": ""}'::jsonb,
    birth_date VARCHAR(50) NOT NULL,
    date_of_joining VARCHAR(50) NOT NULL,
    contract_expiry VARCHAR(50) NOT NULL,
    department VARCHAR(100) NOT NULL,
    classification VARCHAR(100),
    contract_url TEXT,
    contract_qiwa_number VARCHAR(100),
    custody_assets JSONB DEFAULT '[]'::jsonb
);

-- 3. CUSTOMERS/CLIENTS DB Table
DROP TABLE IF EXISTS customers CASCADE;
CREATE TABLE customers (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'C-301'
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    activity VARCHAR(150),
    city VARCHAR(100),
    address TEXT,
    phone VARCHAR(50),
    cr_name VARCHAR(255),
    is_taxable BOOLEAN DEFAULT TRUE,
    tax_id VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Active'
);

-- 4. QUOTATIONS / PROJECTS DB Table
DROP TABLE IF EXISTS quotations CASCADE;
CREATE TABLE quotations (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'QT-2026-001'
    client_name VARCHAR(255) NOT NULL,
    project_title VARCHAR(255) NOT NULL,
    stage VARCHAR(100) NOT NULL, -- e.g. 'New Lead', 'Down-payment', etc.
    neon_meters NUMERIC(10,2) DEFAULT 0.00,
    installation_fees NUMERIC(12,2) DEFAULT 0.00,
    vat_rate NUMERIC(4,2) DEFAULT 0.15,
    items JSONB DEFAULT '[]'::jsonb,
    milestones JSONB DEFAULT '{"downPayment":{"amount":0,"percentage":50,"isCollected":false,"alertSent":false},"preInstallation":{"amount":0,"percentage":30,"isCollected":false,"alertSent":false},"uponDelivery":{"amount":0,"percentage":20,"isCollected":false,"alertSent":false}}'::jsonb,
    date_created VARCHAR(50) NOT NULL,
    sales_rep_name VARCHAR(150),
    design_file_url TEXT,
    design_file_name VARCHAR(255),
    installation_address TEXT,
    signage_type VARCHAR(100),
    production_status VARCHAR(100) DEFAULT 'Pending Design Checklist',
    cnc_file_url TEXT,
    cnc_file_name VARCHAR(255),
    production_stages JSONB DEFAULT '[]'::jsonb,
    production_materials JSONB DEFAULT '[]'::jsonb,
    production_tasks JSONB DEFAULT '[]'::jsonb,
    production_halt_reason TEXT,
    production_halt_history JSONB DEFAULT '[]'::jsonb,
    production_canceled_reason TEXT,
    customerId VARCHAR(50)
);

-- 5. PRODUCTION_ORDERS DB Table
DROP TABLE IF EXISTS production_orders CASCADE;
CREATE TABLE production_orders (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'PO-101'
    production_code VARCHAR(100) UNIQUE NOT NULL,
    project_id VARCHAR(50) REFERENCES quotations(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'In Progress',
    scheduled_start VARCHAR(50),
    scheduled_end VARCHAR(50),
    actual_start VARCHAR(50),
    actual_end VARCHAR(50),
    logs JSONB DEFAULT '[]'::jsonb,
    scrap_percentage NUMERIC(5,2) DEFAULT 0.00
);

-- 6. INVENTORY / RAW MATERIAL STOCK DB Table
DROP TABLE IF EXISTS inventory CASCADE;
CREATE TABLE inventory (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'INV-001'
    name VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(150) NOT NULL,
    qty_available NUMERIC(12,2) DEFAULT 0.00,
    qty_reserved NUMERIC(12,2) DEFAULT 0.00,
    reorder_point NUMERIC(12,2) DEFAULT 5.00
);

-- 7. TASKS DB Table
DROP TABLE IF EXISTS tasks CASCADE;
CREATE TABLE tasks (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'TSK-001'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_worker VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Pending',
    due_date VARCHAR(50)
);

-- 8. ATTENDANCE DB Table
DROP TABLE IF EXISTS attendance CASCADE;
CREATE TABLE attendance (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'ATT-201'
    emp_id VARCHAR(50) REFERENCES employees(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    date VARCHAR(50) NOT NULL,
    check_in VARCHAR(50),
    check_out VARCHAR(50),
    late_minutes INTEGER DEFAULT 0,
    latitude NUMERIC(10,6),
    longitude NUMERIC(10,6),
    assigned_worksite VARCHAR(255),
    worksite_lat NUMERIC(10,6),
    worksite_lng NUMERIC(10,6),
    status VARCHAR(50) DEFAULT 'PENDING'
);

-- 9. PAYMENTS DB Table
DROP TABLE IF EXISTS payments CASCADE;
CREATE TABLE payments (
    id VARCHAR(50) PRIMARY KEY, -- e.g. 'PAY-101'
    quotation_id VARCHAR(50) REFERENCES quotations(id) ON DELETE CASCADE,
    client_name VARCHAR(255),
    milestone VARCHAR(100),
    amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    payment_date VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Paid',
    payment_method VARCHAR(100),
    reference_no VARCHAR(100)
);

-- 10. LEAVES DB Table
DROP TABLE IF EXISTS leaves CASCADE;
CREATE TABLE leaves (
    id VARCHAR(50) PRIMARY KEY,
    emp_id VARCHAR(50) REFERENCES employees(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type_ar VARCHAR(150),
    type_en VARCHAR(150),
    duration_days INTEGER NOT NULL DEFAULT 1,
    start_date VARCHAR(50) NOT NULL,
    end_date VARCHAR(50) NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    submission_type VARCHAR(50) DEFAULT 'self'
);

-- 11. DEDUCTIONS DB Table
DROP TABLE IF EXISTS deductions CASCADE;
CREATE TABLE deductions (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) REFERENCES employees(id) ON DELETE CASCADE,
    employee_name VARCHAR(255) NOT NULL,
    type VARCHAR(100),
    amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    reason TEXT,
    date VARCHAR(50) NOT NULL,
    is_manual BOOLEAN DEFAULT TRUE,
    status VARCHAR(50) DEFAULT 'draft'
);

-- 12. MONTHLY_PAYROLLS DB Table
DROP TABLE IF EXISTS monthly_payrolls CASCADE;
CREATE TABLE monthly_payrolls (
    id VARCHAR(50) PRIMARY KEY,
    month VARCHAR(50) NOT NULL,
    employee_id VARCHAR(50) REFERENCES employees(id) ON DELETE CASCADE,
    employee_name VARCHAR(255) NOT NULL,
    basic_salary NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    allowances NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    deductions NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    net_salary NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Draft'
);

-- 13. INQUIRIES DB Table
DROP TABLE IF EXISTS inquiries CASCADE;
CREATE TABLE inquiries (
    id VARCHAR(50) PRIMARY KEY,
    emp_id VARCHAR(50) REFERENCES employees(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category_ar VARCHAR(150),
    category_en VARCHAR(150),
    details TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    hr_notes TEXT
);

-- 14. CLEARANCES DB Table
DROP TABLE IF EXISTS clearances CASCADE;
CREATE TABLE clearances (
    clearance_id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) REFERENCES employees(id) ON DELETE CASCADE,
    commence_date VARCHAR(50) NOT NULL,
    reason_category VARCHAR(150) NOT NULL,
    detailed_justification TEXT,
    checkpoint_blockers JSONB DEFAULT '{"pendingVehiclesHandover": false, "pendingITHandover": false, "pendingToolkitsHandover": false}'::jsonb,
    audit_security_hash TEXT,
    scheduled_final_settle_date VARCHAR(50),
    signatories JSONB DEFAULT '{"fleetManager": "", "itDirector": "", "warehouseController": ""}'::jsonb,
    is_fully_certified_cleared BOOLEAN DEFAULT FALSE
);

-- 15. EMPLOYEE_AUDIT_TRAILS DB Table
DROP TABLE IF EXISTS employee_audit_trails CASCADE;
CREATE TABLE employee_audit_trails (
    id SERIAL PRIMARY KEY,
    timestamp VARCHAR(50) NOT NULL,
    operator_id VARCHAR(100) NOT NULL,
    employee_id VARCHAR(50) REFERENCES employees(id) ON DELETE CASCADE,
    field_changed VARCHAR(150) NOT NULL,
    old_value TEXT,
    new_value TEXT
);

-- 16. ACTIVITY_LOGS DB Table
DROP TABLE IF EXISTS activity_logs CASCADE;
CREATE TABLE activity_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp VARCHAR(50) NOT NULL,
    user_operator VARCHAR(100) NOT NULL,
    action_type VARCHAR(255),
    action_details TEXT
);

-- =========================================================================
-- SEED INITIAL DATA FOR TESTING & DEVELOPMENT
-- =========================================================================

-- Seed Users
INSERT INTO users (username, role, job_title, date_created) VALUES
('FERAS', 'Super Admin', 'Owner / GM', '2026-01-01'),
('AL_HR', 'HR Manager', 'HR Manager', '2026-01-05'),
('AL_SALES', 'Sales Rep', 'Senior Sales Associate', '2026-01-10')
ON CONFLICT (username) DO NOTHING;

-- Seed Employees
INSERT INTO employees (id, arabic_name, english_name, iqama_id, passport_details, job_title, grade, basic_salary, allowances, home_address, custody, birth_date, date_of_joining, contract_expiry, department, classification) VALUES
('EMP-1002', 'فهد المطيري', 'Fahad Al-Mutairi', '2411223344', 'PP-9008811', 'مشرف خط كهربائي', 'Level 4', 7500, '{"housing": 1500, "transport": 500, "phone": 200, "food": 300}'::jsonb, 'حي النرجس، الرياض', '{"laptop": "MacBook Air", "tools": "أدوات قياس الجهد والحرارة", "vehicles": "تويوتا هايلاكس 2024"}'::jsonb, '1992-04-12', '2022-01-15', '2027-01-14', 'Production', 'موظف'),
('EMP-1003', 'عماد غانم', 'Emad Ghanem', '2300445566', 'PP-1234567', 'فني لحام أكريليك', 'Level 2', 5500, '{"housing": 1000, "transport": 400, "phone": 100, "food": 300}'::jsonb, 'حي الروضة، الرياض', '{"laptop": "", "tools": "صاروخ قص، ماكينة لحام ديجيتال", "vehicles": ""}'::jsonb, '1995-09-21', '2023-06-10', '2026-06-09', 'Production', 'عامل تصنيع')
ON CONFLICT (id) DO NOTHING;

-- Seed Customers
INSERT INTO customers (id, name, company, activity, city, address, phone, is_taxable, tax_id, status) VALUES
('C-301', 'شيراتون الدمام للشقق الفندقية', 'مجموعة الشيراتون العالمية', 'فنادق وضيافة', 'الدمام', 'شارع الملك عبدالعزيز، غبر الدمام، ص.ب 2039', '0501112233', TRUE, '300123456789013', 'Active'),
('C-302', 'مطاعم ليمونة الرياض للوجبات', 'شركة ليمونة للأغذية', 'مطاعم', 'الرياض', 'طريق الملك فهد، حي الصحافة، الرياض 13321', '0567788990', FALSE, '', 'Active')
ON CONFLICT (id) DO NOTHING;

-- Seed Quotations & Projects
INSERT INTO quotations (id, client_name, project_title, stage, neon_meters, installation_fees, vat_rate, items, milestones, date_created, sales_rep_name, installation_address, signage_type, production_status, design_file_name, design_file_url, cnc_file_name, cnc_file_url, production_stages, production_materials, production_tasks, customerId) VALUES
('QT-2026-001', 'Al-Muhaidib Corporate HQ', '3D Neon Exterior Branding & Tower Signage', 'Production Start', 145, 8500, 0.15, 
'[{"id": "ITEM-1", "description": "Blue Acrylic Double-Lit Lettering Al-Muhaidib En/Ar", "quantity": 1, "unitPrice": 42000}, {"id": "ITEM-2", "description": "Neon Flex Cyan Border Piping for Wall Canopy", "quantity": 145, "unitPrice": 150}]'::jsonb,
'{"downPayment": {"amount": 31872.5, "percentage": 50, "isCollected": true, "alertSent": true}, "preInstallation": {"amount": 19123.5, "percentage": 30, "isCollected": false, "alertSent": false}, "uponDelivery": {"amount": 12749.0, "percentage": 20, "isCollected": false, "alertSent": false}}'::jsonb,
'2026-05-01', 'AL_SALES', 'شارع التخصصي، حي المعذر، الرياض', 'Acrylic Board', 'In Production', 'muhaidib_building_elevations_v3.pdf', '/assets/muhaidib_building_elevations_v3.pdf', 'muhaidib_cnc_router_engrave_path.dxf', '/assets/muhaidib_cnc_router_engrave_path.dxf',
'[
  {"id": 1, "titleAr": "التصميم الهندسي", "titleEn": "Structural Design", "status": "Done", "operator": "فهد المهيب", "expectedHours": 12, "actualHours": 10, "timeStarted": null, "logs": ["تم تصفية الأوتوكاد", "اعتماد الأوزان"], "isCurrentlyPaused": false, "pauseReason": ""},
  {"id": 2, "titleAr": "اعتماد العميل", "titleEn": "Client Approval", "status": "Done", "operator": "ياسر المبيعات", "expectedHours": 48, "actualHours": 40, "timeStarted": null, "logs": ["الموافقة موثقة بالإيميل"], "isCurrentlyPaused": false, "pauseReason": ""},
  {"id": 3, "titleAr": "طباعة الفليكس والمشغولات", "titleEn": "Letter Printing", "status": "Done", "operator": "محمد البنغالي", "expectedHours": 6, "actualHours": 5, "timeStarted": null, "logs": ["بدء سحب الأحبار الكورية"], "isCurrentlyPaused": false, "pauseReason": ""},
  {"id": 4, "titleAr": "قص الأكريليك واللواتر", "titleEn": "Router Cutting", "status": "Current", "operator": "راجو سانجاي", "expectedHours": 8, "actualHours": 1, "timeStarted": "2026-06-09T08:00:00Z", "logs": ["تحميل ملف القص التلقائي الـ CNC"], "isCurrentlyPaused": false, "pauseReason": ""},
  {"id": 5, "titleAr": "التجميع والكهرباء واللحام", "titleEn": "Wiring & Assembly", "status": "Pending", "operator": "سلمان العتيبي", "expectedHours": 16, "actualHours": 0, "timeStarted": null, "logs": [], "isCurrentlyPaused": false, "pauseReason": ""},
  {"id": 6, "titleAr": "فحص الجودة والمطابقة", "titleEn": "QC Testing", "status": "Pending", "operator": "أبو بكر مراقب الجودة", "expectedHours": 4, "actualHours": 0, "timeStarted": null, "logs": [], "isCurrentlyPaused": false, "pauseReason": ""},
  {"id": 7, "titleAr": "التركيب الميداني والتشغيل", "titleEn": "Site Installation", "status": "Pending", "operator": "فريق التركيبات 1", "expectedHours": 24, "actualHours": 0, "timeStarted": null, "logs": [], "isCurrentlyPaused": false, "pauseReason": ""}
]'::jsonb,
'[
  {"id": "mat-1", "key": "aluminum", "name": "ألمنيوم الهيكل الرئيسي", "requested": 100, "available": 65, "reserved": 65, "deficit": 35, "reqDate": "2026-06-09", "status": "Pending"},
  {"id": "mat-2", "key": "acrylic", "name": "أكريليك واجهة اللوحة", "requested": 40, "available": 40, "reserved": 40, "deficit": 0, "reqDate": "2026-06-09", "status": "Fully Supplied"},
  {"id": "mat-3", "key": "leds", "name": "وحدات إضاءة LED كوري", "requested": 1500, "available": 1200, "reserved": 1200, "deficit": 300, "reqDate": "2026-06-09", "status": "Pending"},
  {"id": "mat-4", "key": "transformers", "name": "محولات طاقة مقاومة للمياه", "requested": 12, "available": 15, "reserved": 12, "deficit": 0, "reqDate": "2026-06-09", "status": "Fully Supplied"}
]'::jsonb,
'[
  {"id": "T-201", "workerName": "سلمان العتيبي", "role": "الكهرباء والتجميع", "description": "تركيب تمديدات ليد كوري المقاومة للمياه والتاكد من سلامة الاحمال الكهربائية", "createdAt": "2026-06-09"},
  {"id": "T-202", "workerName": "محمد البنغالي", "role": "الطباعة والقص", "description": "سحب الفينيل المقاوم للاشعة فوق البنفسجية للواجهات الخارجية", "createdAt": "2026-06-09"}
]'::jsonb,
NULL, '[]'::jsonb, NULL, 'C-301'),

('QT-2026-002', 'The Coffee Address Riyadh', 'Custom Pink/Yellow Retro Neon Interior Fabrication', 'Down-payment', 48, 2400, 0.15,
'[{"id": "ITEM-3", "description": "Retro Styled Hot Pink Open Neon Tube Sign", "quantity": 1, "unitPrice": 12500}, {"id": "ITEM-4", "description": "Yellow Warm Neon Neon Piping under Bar counter", "quantity": 48, "unitPrice": 120}]'::jsonb,
'{"downPayment": {"amount": 11822.0, "percentage": 50, "isCollected": true, "alertSent": true}, "preInstallation": {"amount": 7093.2, "percentage": 30, "isCollected": true, "alertSent": false}, "uponDelivery": {"amount": 4728.8, "percentage": 20, "isCollected": false, "alertSent": false}}'::jsonb,
'2026-05-18', 'AL_SALES', 'طريق عثمان بن عفان، حي الملقا، الرياض', 'Neon Sign', 'Pending Design Checklist', 'coffee_retro_pink_neon_layout.png', '/assets/coffee_retro_pink_neon_layout.png', NULL, NULL,
'[]'::jsonb, '[]'::jsonb, '[]'::jsonb,
NULL, '[]'::jsonb, NULL, 'C-302')
ON CONFLICT (id) DO NOTHING;

-- Seed Production Orders
INSERT INTO production_orders (id, production_code, project_id, status, scheduled_start, scheduled_end, actual_start, actual_end, scrap_percentage) VALUES
('PO-101', 'PO-2026-001', 'QT-2026-001', 'In Progress', '2026-06-01', '2026-06-30', '2026-06-02', NULL, 1.25)
ON CONFLICT (id) DO NOTHING;

-- Seed Inventory
INSERT INTO inventory (id, name, category, qty_available, qty_reserved, reorder_point) VALUES
('INV-001', 'أكريليك (Plexiglass)', 'مواد الواجهات والحروف', 120.00, 42.00, 10.00),
('INV-002', 'حديد مجلفن', 'مواد الواجهات والحروف', 75.00, 15.00, 5.00),
('INV-003', 'فينيل لامع', 'مواد الطباعة والإستيكرات', 200.00, 50.00, 20.00),
('INV-004', 'وحدات إضاءة LED كوري', 'توصيل وتمديد وإضاءة', 1800.00, 1200.00, 100.00)
ON CONFLICT (id) DO NOTHING;

-- Seed Tasks
INSERT INTO tasks (id, title, description, assigned_worker, status, due_date) VALUES
('TSK-001', 'تجهيز ملف ليزر حروف شيراتون', 'تحضير مسارات القص التلقائي وإرسالها للمشغل', 'فهد المطيري', 'Done', '2026-06-10'),
('TSK-002', 'قص وجه الأكريليك لوحة المعذر', 'تفصيل الألواح مع خلوص التمدد الحراري', 'عماد غانم', 'In Progress', '2026-06-15')
ON CONFLICT (id) DO NOTHING;

-- Seed Attendance
INSERT INTO attendance (id, emp_id, name, date, check_in, check_out, late_minutes, latitude, longitude, assigned_worksite, worksite_lat, worksite_lng, status) VALUES
('ATT-201', 'EMP-1002', 'فهد المطيري', '2026-06-06', '08:15', '17:05', 15, 24.7136, 46.6753, 'Olaya Mega Banner (Riyadh)', 24.7136, 46.6753, 'PENDING'),
('ATT-202', 'EMP-1003', 'عماد غانم', '2026-06-06', '08:42', '17:00', 42, 24.6405, 46.7121, 'CNC Factory Yard (Olayah Suburb)', 24.7431, 46.6812, 'PENDING')
ON CONFLICT (id) DO NOTHING;

-- Seed Payments
INSERT INTO payments (id, quotation_id, client_name, milestone, amount, payment_date, status, payment_method, reference_no) VALUES
('PAY-101', 'QT-2026-001', 'Al-Muhaidib Corporate HQ', 'Down-payment', 31872.50, '2026-05-02', 'Paid', 'Bank Transfer', 'TXN-9021-ALWALEED')
ON CONFLICT (id) DO NOTHING;
