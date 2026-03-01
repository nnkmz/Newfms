-- UiTM eWorks Facilities SaaS (MVP+) PostgreSQL Schema
-- Gunakan pada PostgreSQL 14+.
-- Contoh: psql "$DATABASE_URL" -f database/eworks-postgres-schema.sql

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS tenants (
  id text PRIMARY KEY,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_users (
  id text PRIMARY KEY,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  username text NOT NULL,
  full_name text NOT NULL,
  email text,
  role text NOT NULL CHECK (role IN ('requestor', 'helpdesk', 'technician', 'admin')),
  password_hash text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, username)
);

CREATE TABLE IF NOT EXISTS complaints (
  id text PRIMARY KEY,
  reference_no text NOT NULL,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  requestor_type text NOT NULL CHECK (requestor_type IN ('staff', 'student', 'external')),
  status text NOT NULL CHECK (status IN ('new', 'triaged', 'assigned', 'in_progress', 'on_hold', 'resolved', 'rejected', 'cancelled', 'closed')),
  priority text NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  channel text NOT NULL CHECK (channel IN ('online', 'phone', 'walk_in')),
  reporter_identifier text NOT NULL,
  reporter_full_name text,
  campus text NOT NULL,
  sla_due_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  payload jsonb NOT NULL,
  UNIQUE (tenant_id, reference_no)
);

CREATE TABLE IF NOT EXISTS complaint_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id text NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('new', 'triaged', 'assigned', 'in_progress', 'on_hold', 'resolved', 'rejected', 'cancelled', 'closed')),
  changed_at timestamptz NOT NULL,
  changed_by text NOT NULL,
  note text
);

CREATE TABLE IF NOT EXISTS complaint_feedback (
  complaint_id text PRIMARY KEY REFERENCES complaints(id) ON DELETE CASCADE,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  satisfaction text NOT NULL CHECK (satisfaction IN ('satisfied', 'unsatisfied')),
  comment text,
  submitted_at timestamptz NOT NULL,
  submitted_by text NOT NULL
);

CREATE TABLE IF NOT EXISTS work_orders (
  id text PRIMARY KEY,
  code text NOT NULL,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  complaint_id text NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('open', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  team text NOT NULL,
  assignee_id text,
  scheduled_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  payload jsonb NOT NULL,
  UNIQUE (tenant_id, code)
);

CREATE TABLE IF NOT EXISTS work_order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id text NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  tenant_id text NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('open', 'scheduled', 'in_progress', 'completed', 'cancelled')),
  changed_at timestamptz NOT NULL,
  changed_by text NOT NULL,
  note text
);

CREATE INDEX IF NOT EXISTS idx_complaints_tenant_status_updated
  ON complaints (tenant_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_complaints_tenant_campus
  ON complaints (tenant_id, campus);

CREATE INDEX IF NOT EXISTS idx_complaints_payload_gin
  ON complaints USING GIN (payload);

CREATE INDEX IF NOT EXISTS idx_work_orders_tenant_status_updated
  ON work_orders (tenant_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_work_orders_tenant_complaint
  ON work_orders (tenant_id, complaint_id);

CREATE INDEX IF NOT EXISTS idx_app_users_tenant_role
  ON app_users (tenant_id, role);

INSERT INTO tenants (id, name)
VALUES ('uitm', 'Universiti Teknologi MARA')
ON CONFLICT (id) DO NOTHING;

-- Placeholder hash untuk akaun demo.
-- Sistem auth dalam kod menggunakan seed in-memory secara default.
INSERT INTO app_users (id, tenant_id, username, full_name, email, role, password_hash)
VALUES
  ('usr_admin_uitm', 'uitm', 'admin', 'UiTM Admin', 'admin@uitm.edu.my', 'admin', 'seed:change-me'),
  ('usr_helpdesk_uitm', 'uitm', 'helpdesk', 'UiTM Helpdesk', 'helpdesk@uitm.edu.my', 'helpdesk', 'seed:change-me'),
  ('usr_technician_uitm', 'uitm', 'technician', 'UiTM Technician', 'tech@uitm.edu.my', 'technician', 'seed:change-me'),
  ('usr_requestor_uitm', 'uitm', 'requestor', 'UiTM Requestor', 'requestor@uitm.edu.my', 'requestor', 'seed:change-me')
ON CONFLICT (tenant_id, username) DO NOTHING;

COMMIT;
