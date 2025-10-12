-- =============================
--  Database Schema: KMAILS
-- =============================

-- ---------- EXTENSIONS ----------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------- Tenancy & Identity ----------
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE,
  plan_type VARCHAR(100),
  status VARCHAR(50),
  default_admin_user_id UUID,
  storage_limit_mb INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  username VARCHAR(100),
  password_hash TEXT,
  auth_provider VARCHAR(100),
  role VARCHAR(50),
  status VARCHAR(50),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  access_token TEXT,
  refresh_token TEXT,
  ip_address VARCHAR(100),
  user_agent TEXT
);

ALTER TABLE tenants
  ADD CONSTRAINT fk_tenants_admin FOREIGN KEY (default_admin_user_id) REFERENCES users(id);

CREATE TABLE user_org_map (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  role_in_org VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------- RBAC ----------
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(100),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_key VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------- Sessions & Audits ----------
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  ip_address VARCHAR(100),
  device_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE session_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  event VARCHAR(255),
  provider VARCHAR(255),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action VARCHAR(255),
  target_type VARCHAR(100),
  target_id UUID,
  ip_address VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  details JSONB
);

CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES users(id),
  tenant_id UUID REFERENCES tenants(id),
  action VARCHAR(255),
  resource_type VARCHAR(100),
  resource_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(50),
  notes TEXT
);

-- ---------- Mail Providers & Accounts ----------
CREATE TABLE mail_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255),
  protocol VARCHAR(100),
  auth_type VARCHAR(100),
  smtp_host VARCHAR(255),
  imap_host VARCHAR(255),
  scopes TEXT[],
  token_url VARCHAR(255),
  docs_url VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mail_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  provider_id UUID REFERENCES mail_providers(id),
  email_address VARCHAR(255),
  display_name VARCHAR(255),
  access_type VARCHAR(50),
  encrypted_access_token TEXT,
  encrypted_refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  smtp_username VARCHAR(255),
  encrypted_smtp_password TEXT,
  imap_settings JSONB,
  is_primary BOOLEAN DEFAULT FALSE,
  status VARCHAR(50),
  last_connected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mail_servers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR(255),
  host VARCHAR(255),
  port INT,
  tls BOOLEAN,
  username VARCHAR(255),
  encrypted_password TEXT,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  status VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sync_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mail_account_id UUID REFERENCES mail_accounts(id),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  operation VARCHAR(100),
  status VARCHAR(50),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  details JSONB
);

-- ---------- Contacts & Imports ----------
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  pronouns VARCHAR(50),
  full_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  job_title VARCHAR(100),
  company_name VARCHAR(255),
  linkedin_url VARCHAR(255),
  other_url VARCHAR(255),
  form_url VARCHAR(255),
  location VARCHAR(255),
  source VARCHAR(100),
  added_by UUID REFERENCES users(id),
  tags JSONB,
  notes TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  uploaded_by UUID REFERENCES users(id),
  filename VARCHAR(255),
  source_type VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE import_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  import_id UUID REFERENCES imports(id),
  contact_id UUID REFERENCES contacts(id),
  row_index INT,
  status VARCHAR(50),
  error_message TEXT
);

-- ---------- Templates ----------
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  name VARCHAR(255),
  subject VARCHAR(255),
  body_html TEXT,
  body_text TEXT,
  placeholders JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE template_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES email_templates(id) ON DELETE CASCADE,
  version_no INT,
  name VARCHAR(255),
  subject VARCHAR(255),
  body_html TEXT,
  body_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------- Campaigns ----------
CREATE TABLE email_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  created_by UUID REFERENCES users(id),
  campaign_name VARCHAR(255),
  description TEXT,
  template_id UUID REFERENCES email_templates(id),
  template_snapshot JSONB,
  email_subject VARCHAR(255),
  email_body_html TEXT,
  email_body_text TEXT,
  contact_list_ids UUID[],
  segment_rules JSONB,
  final_recipient_count INT,
  from_name VARCHAR(255),
  from_email VARCHAR(255),
  reply_to_email VARCHAR(255),
  sending_domain VARCHAR(255),
  schedule_type VARCHAR(100),
  schedule_time TIMESTAMPTZ,
  throttle_rate INT,
  batch_size INT,
  tracking_enabled BOOLEAN,
  track_opens BOOLEAN,
  track_clicks BOOLEAN,
  unsubscribe_link VARCHAR(255),
  custom_utm_params JSONB,
  status VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campaign_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  variant_key VARCHAR(100),
  subject VARCHAR(255),
  body_html TEXT,
  body_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campaign_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES email_campaigns(id),
  contact_id UUID REFERENCES contacts(id),
  email_address VARCHAR(255),
  variant_id UUID REFERENCES campaign_variants(id),
  delivery_status VARCHAR(50),
  delivery_time TIMESTAMPTZ,
  bounce_reason TEXT,
  retry_count INT DEFAULT 0,
  open_count INT DEFAULT 0,
  first_open_time TIMESTAMPTZ,
  last_open_time TIMESTAMPTZ,
  click_count INT DEFAULT 0,
  last_click_time TIMESTAMPTZ,
  clicked_links JSONB,
  reply_status VARCHAR(50),
  reply_time TIMESTAMPTZ,
  reply_message_id TEXT,
  unsubscribed BOOLEAN DEFAULT FALSE,
  unsubscribed_time TIMESTAMPTZ,
  gdpr_consent_status VARCHAR(50),
  engagement_score INT DEFAULT 0,
  personalized_subject TEXT,
  personalized_body_hash TEXT,
  processing_status VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------- Email Messages & Threads ----------
CREATE TABLE email_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  campaign_id UUID REFERENCES email_campaigns(id),
  mail_account_id UUID REFERENCES mail_accounts(id),
  message_id TEXT,
  thread_id TEXT,
  provider_thread_id TEXT,
  provider_message_id TEXT,
  recipient_email VARCHAR(255),
  subject TEXT,
  body_html TEXT,
  body_text TEXT,
  direction VARCHAR(50),
  status VARCHAR(50),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  bounce_reason TEXT,
  raw_headers TEXT,
  provider_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE thread_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  thread_key TEXT,
  tenant_id UUID REFERENCES tenants(id),
  last_sync_at TIMESTAMPTZ,
  messages_summary JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE inbound_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mail_account_id UUID REFERENCES mail_accounts(id),
  message_id UUID REFERENCES email_messages(id),
  from_email VARCHAR(255),
  to_email VARCHAR(255),
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  provider_message_id TEXT,
  reply_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------- Events & Tracking ----------
CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES email_messages(id),
  campaign_recipient_id UUID REFERENCES campaign_recipients(id),
  event_type VARCHAR(100),
  event_time TIMESTAMPTZ,
  ip_address VARCHAR(100),
  user_agent TEXT,
  metadata JSONB
);

CREATE TABLE tracking_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  campaign_id UUID REFERENCES email_campaigns(id),
  original_url TEXT,
  tracking_url TEXT,
  clicks_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bounce_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES email_messages(id),
  recipient_email VARCHAR(255),
  bounce_type VARCHAR(100),
  bounce_subtype VARCHAR(100),
  bounce_time TIMESTAMPTZ,
  raw_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---------- Billing ----------
CREATE TABLE billing_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100),
  monthly_fee NUMERIC(10,2),
  per_email_charge NUMERIC(10,4),
  limits JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  period VARCHAR(50),
  email_sent_count INT DEFAULT 0,
  email_opened_count INT DEFAULT 0,
  charge_amount NUMERIC(10,2),
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  amount NUMERIC(10,2),
  status VARCHAR(50),
  billing_period VARCHAR(50),
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- ---------- Policies & Activities ----------
CREATE TABLE tenant_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  allow_custom_smtp BOOLEAN DEFAULT FALSE,
  max_mailboxes INT DEFAULT 1,
  storage_limit_mb INT DEFAULT 1024,
  allow_external_providers BOOLEAN DEFAULT TRUE,
  allow_auto_sync BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  contact_id UUID REFERENCES contacts(id),
  action VARCHAR(100),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
