-- SQL Setup Script for the ERP Database
-- Execute this script in your Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS users (
  username text PRIMARY KEY,
  role text,
  job_title text,
  date_created text,
  password text
);

CREATE TABLE IF NOT EXISTS employees (
  id text PRIMARY KEY,
  arabic_name text,
  english_name text,
  iqama_id text,
  passport_details text,
  job_title text,
  grade text,
  basic_salary numeric,
  allowances jsonb,
  home_address text,
  sick_leaves_taken numeric,
  annual_leaves_taken numeric,
  avatar_url text
);

CREATE TABLE IF NOT EXISTS customers (
  id text PRIMARY KEY,
  name text,
  company text,
  activity text,
  city text,
  address text,
  phone text,
  cr_name text,
  is_taxable boolean,
  tax_id text,
  status text
);

CREATE TABLE IF NOT EXISTS attendance (
  id text PRIMARY KEY,
  emp_id text,
  name text,
  date text,
  check_in text,
  check_out text,
  late_minutes numeric,
  latitude numeric,
  longitude numeric,
  assigned_worksite text,
  worksite_lat numeric,
  worksite_lng numeric,
  status text
);

CREATE TABLE IF NOT EXISTS quotations (
  id text PRIMARY KEY,
  client_name text,
  project_title text,
  stage text,
  neon_meters numeric,
  installation_fees numeric,
  vat_rate numeric,
  items jsonb,
  milestones jsonb,
  date_created text,
  sales_rep_name text,
  design_file_url text,
  design_file_name text,
  installation_address text,
  signage_type text,
  production_status text,
  cnc_file_url text,
  cnc_file_name text
);

CREATE TABLE IF NOT EXISTS leaves (
  id text PRIMARY KEY,
  emp_id text,
  name text,
  type_ar text,
  type_en text,
  duration_days numeric,
  start_date text,
  end_date text,
  reason text,
  status text,
  submission_type text
);

CREATE TABLE IF NOT EXISTS deductions (
  id text PRIMARY KEY,
  employee_id text,
  employee_name text,
  type text,
  amount numeric,
  reason text,
  date text,
  is_manual boolean,
  status text
);

CREATE TABLE IF NOT EXISTS inquiries (
  id text PRIMARY KEY,
  emp_id text,
  name text,
  category_ar text,
  category_en text,
  details text,
  status text,
  hr_notes text,
  date_created text
);

CREATE TABLE IF NOT EXISTS monthly_payrolls (
  id text PRIMARY KEY,
  month text,
  employee_id text,
  employee_name text,
  basic_salary numeric,
  allowances numeric,
  deductions numeric,
  net_salary numeric,
  status text
);

CREATE TABLE IF NOT EXISTS production_orders (
  id text PRIMARY KEY,
  production_code text,
  project_id text,
  status text,
  scheduled_start text,
  scheduled_end text,
  actual_start text,
  actual_end text,
  scrap_percentage numeric
);

CREATE TABLE IF NOT EXISTS inventory (
  id text PRIMARY KEY,
  name text,
  category text,
  qty_available numeric,
  qty_reserved numeric,
  reorder_point numeric
);

CREATE TABLE IF NOT EXISTS tasks (
  id text PRIMARY KEY,
  title text,
  description text,
  assigned_worker text,
  status text,
  due_date text
);

CREATE TABLE IF NOT EXISTS payments (
  id text PRIMARY KEY,
  quotation_id text,
  client_name text,
  milestone text,
  amount numeric,
  payment_date text,
  status text,
  payment_method text,
  reference_no text
);

CREATE TABLE IF NOT EXISTS clearances (
  clearance_id text PRIMARY KEY,
  employee_id text,
  commence_date text,
  reason_category text,
  detailed_justification text,
  checkpoint_blockers jsonb,
  audit_security_hash text,
  scheduled_final_settle_date text,
  signatories jsonb,
  is_fully_certified_cleared boolean
);
