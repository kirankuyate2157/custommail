### 1. **Core Tenancy & Identity**

We’ll use a **multi-tenant model** (since many customers will use your system).

### Tables:

#### `tenants`

- `id (PK, UUID)`
- `name` – Company / Customer name
- `plan_type` – free / pro / enterprise
- `status` – active/inactive/suspended
- `created_at`, `updated_at`

#### `users`

- `id (PK, UUID)`
- `tenant_id (FK → tenants.id)`
- `email` – login ID
- `full_name`,
- `username` (optional)
- `password_hash`
- `auth_provider`- [basic, google auth,SSO other]
- `role` – owner / admin / member / viewer
- `status` – active/inactive
- `last_login_at`
- `created_at`, `updated_at`
- `access_token`
- `refresh_token`
- `ip_address`
- `user_agent`

_(You can integrate **Auth0** or keep native auth — schema is flexible.)_

---

### 2. **Contact Management**

A **shared contact list per tenant** (any user with permissions can add/update).

#### `contacts`

- `id (PK, UUID)`
- `tenant_id (FK → tenants.id)`
- `pronouns`
- `full_name`
- `email`
- `phone`
- `job_title`
- `company_name`
- `linkedin_url`
- `other_url`
- `form_url`
- `location`
- `source` (linkedin_scrape, csv_upload, manual)
- `added_by` (FK → users.user_id)
- `tenant_id` (FK)
- `tags` (array/jsonb → \["HR", "Hiring Manager", "Tech Recruiter"])
- `notes` (text)
- `created_at`, `updated_at`

---

### 3. **Templates & Configurations**

#### `email_templates`

- `template_id (PK, UUID)`
- `tenant_id`
- `name`
- `subject`
- `body_html`
- `body_text`
- `created_by`
- `created_at`, `updated_at`

#### `template_versions`

- `id`
- `template_id`
- `version_no`
- `name`
- `subject`
- `body_html`
- `body_text`
- `created_at`

---
### 3. **Email Account** (what sender email is connected)

* `account_id` (PK)
* `user_id` (FK → User)
* `provider` (`gmail`, `outlook`, `custom_smtp`)
* `email_address` (actual sending email, e.g. `user@gmail.com`)
* `connection_type` (`oauth`, `app_password`)
* `oauth_token` (if Gmail OAuth)
* `refresh_token` (if Gmail OAuth)
* `app_password` (encrypted, if SMTP app password)
* `status` (`active`, `disconnected`, `error`)
* `last_connected_at`

---

# 4. **Mail Sending & Tracking**

We need **detailed tracking per mail & per user**.

#### `email_campaigns`
Exactly 💡 you’re thinking in the **right scalable direction**. Let’s break it down step by step for **Email Campaigns** as the next major piece after **Contacts** and **Templates**:

---

## 🔹 Core Concept

* **Templates** are reusable blueprints.
* **Campaigns** are *instances* that use a snapshot (copy) of the template **at creation time** so later template edits don’t affect running or past campaigns.
* Campaigns must be **independent, immutable logs** for tracking and auditing.

---

## 🔹 Campaign Entity – Fields

Here’s a detailed list of fields you’ll likely need:

### 1. Campaign Metadata

* `campaign_id` (unique ID)
* `campaign_name` (human-readable name)
* `description` (optional, for internal notes)
* `created_by` (user ID who created)
* `created_at`, `updated_at`
* `status` (draft, scheduled, running, completed, paused, canceled)

### 2. Template Snapshot

* `template_id` (reference to original template for traceability)
* `template_snapshot` (the HTML/text content & subject line copied at campaign creation)
* `email_subject` (campaign-specific subject, can override template)
* `email_body_html`
* `email_body_text`

### 3. Audience (Target Contacts)

* `contact_list_ids` (reference one or more lists)
* `segment_rules` (filters: e.g., job title = recruiter, company\_size > 500)
* `final_recipient_count` (snapshot at send time, since lists may change later)

### 4. Sending Configuration

* `from_name`
* `from_email`
* `reply_to_email`
* `sending_domain` (if using multiple domains/accounts)
* `schedule_type` (immediate / scheduled / recurring)
* `schedule_time` (if scheduled)
* `throttle_rate` (e.g., 100 emails/hour to avoid spam flags)
* `batch_size` (if large lists need chunking)

### 5. Tracking & Analytics Setup

* `tracking_enabled` (yes/no)
* `track_opens` (pixel tracking)
* `track_clicks` (redirect links with tracking)
* `unsubscribe_link` (mandatory in most regions)
* `custom_utm_params` (for Google Analytics)

---

## 🔹 Campaign Execution Flow

1. **Draft → Configure**

   * Choose template (snapshot taken).
   * Choose audience (lists/segments).
   * Configure sender identity + schedule.

2. **Validate**

   * Run pre-checks (broken links, missing unsubscribe, invalid emails).
   * Estimate reach size.

3. **Launch**

   * At schedule time, resolve target contacts into **campaign\_recipients** table.
   * Each recipient gets an entry with `status = pending`.

4. **Send Engine**

   * Picks recipients in batches.
   * Sends emails (through SMTP, SendGrid, SES, etc).
   * Updates recipient status → sent, failed.

5. **Tracking**

   * Opens, clicks, bounces, unsubscribes logged per recipient.
   * Real-time updates.

6. **Feedback & Insights**

   * Campaign dashboard shows:

     * Total Sent
     * Deliverability (delivered vs. bounced)
     * Open rate, Click-through rate (CTR)
     * Unsubscribe rate
     * Engagement over time
     * Per-contact activity timeline

---

## 🔹 Campaign-Recipient Relationship
Perfect 👍 Let’s design a **`campaign_recipients`** table in a **feature-full, advanced way** so you can track **per-contact engagement** with maximum flexibility, insights, and scalability.

---

## 🎯 Purpose of `campaign_recipients`

* Each row = one contact’s lifecycle in one campaign.
* Enables tracking of delivery, engagement, and behavior.
* Supports personalization, A/B testing, feedback, and compliance.

---

## 🗂️ Suggested Fields for `campaign_recipients`

### 🔹 **Core Identifiers**

* `id` – PK
* `campaign_id` – FK → `email_campaigns.id`
* `contact_id` – FK → `contacts.id`
* `template_snapshot_id` – FK → saved snapshot of template at campaign start

---

### 🔹 **Delivery Tracking**

* `delivery_status` – ENUM (`pending`, `sent`, `delivered`, `bounced`, `blocked`, `spam_reported`)
* `delivery_time` – TIMESTAMP
* `bounce_reason` – TEXT (for soft/hard bounce explanation)
* `retry_count` – INT (for failed deliveries)

---

### 🔹 **Open Tracking**

* `open_count` – INT (total opens)
* `first_open_time` – TIMESTAMP
* `last_open_time` – TIMESTAMP
* `device_info` – JSON (device/browser metadata from pixel tracking)

---

### 🔹 **Click Tracking**

* `click_count` – INT
* `last_click_time` – TIMESTAMP
* `clicked_links` – JSON (list of URLs clicked, with counts + timestamps)
* `cta_conversion` – BOOLEAN/JSON (did the user complete CTA flow, e.g. signup/purchase)

---

### 🔹 **Engagement Metrics**

* `reply_status` – ENUM (`none`, `replied`, `auto_reply`)
* `reply_time` – TIMESTAMP
* `reply_message_id` – TEXT (link to inbound email thread)
* `forwarded` – BOOLEAN (detected via tracking)
* `social_shares` – JSON (if email has share tracking)

---

### 🔹 **Scoring / Insights**

* `engagement_score` – INT (weighted score from opens, clicks, replies)
* `heatmap_data` – JSON (email body areas clicked → for advanced analysis)

---

### 🔹 **A/B Testing**

* `variant_id` – FK → `campaign_variants.id`
* `experiment_group` – ENUM (`A`, `B`, `C`...)

---

### 🔹 **Personalization Context**

* `personalized_subject` – TEXT
* `personalized_body_hash` – TEXT (snapshot of rendered body for audit)

---

### 🔹 **Compliance & Opt-out**

* `unsubscribed` – BOOLEAN
* `unsubscribed_time` – TIMESTAMP
* `gdpr_consent_status` – ENUM (`granted`, `withdrawn`)

---

### 🔹 **System Metadata**

* `created_at` – TIMESTAMP
* `updated_at` – TIMESTAMP
* `processing_status` – ENUM (`pending`, `in_queue`, `processed`)
---
| id | campaign\_id | contact\_id | template\_snapshot\_id | status         | opened\_at          | clicked\_at         | replied\_at         | bounced\_at         | unsubscribe\_at     | delivered\_at       | last\_interaction\_at | feedback\_type  | sentiment\_score | spam\_reported | device\_type | email\_client | ip\_address   | location\_country | location\_city | engagement\_score |
| -- | ------------ | ----------- | ---------------------- | -------------- | ------------------- | ------------------- | ------------------- | ------------------- | ------------------- | ------------------- | --------------------- | --------------- | ---------------- | -------------- | ------------ | ------------- | ------------- | ----------------- | -------------- | ----------------- |
| 1  | 101          | 201         | 501                    | delivered      | 2025-09-02 10:15:00 | 2025-09-02 10:17:23 | NULL                | NULL                | NULL                | 2025-09-02 10:14:59 | 2025-09-02 10:17:23   | positive\_reply | 0.8              | false          | mobile       | Gmail         | 103.22.200.5  | India             | Mumbai         | 95                |
| 2  | 101          | 202         | 501                    | opened         | 2025-09-02 10:20:10 | NULL                | NULL                | NULL                | NULL                | 2025-09-02 10:20:08 | 2025-09-02 10:20:10   | NULL            | NULL             | false          | desktop      | Outlook       | 172.16.45.77  | USA               | New York       | 60                |
| 3  | 101          | 203         | 501                    | bounced        | NULL                | NULL                | NULL                | 2025-09-02 10:21:00 | NULL                | NULL                | NULL                  | NULL            | NULL             | false          | NULL         | NULL          | 198.51.100.10 | UK                | London         | 0                 |
| 4  | 101          | 204         | 501                    | unsubscribed   | 2025-09-02 10:25:30 | NULL                | NULL                | NULL                | 2025-09-02 10:26:00 | 2025-09-02 10:25:28 | 2025-09-02 10:26:00   | NULL            | NULL             | false          | tablet       | Apple Mail    | 192.0.2.55    | Canada            | Toronto        | 20                |
| 5  | 102          | 205         | 502                    | replied        | 2025-09-02 11:00:00 | 2025-09-02 11:05:33 | 2025-09-02 11:07:12 | NULL                | NULL                | 2025-09-02 10:59:59 | 2025-09-02 11:07:12   | question        | 0.5              | false          | mobile       | Yahoo Mail    | 203.0.113.99  | Australia         | Sydney         | 85                |
| 6  | 102          | 206         | 502                    | delivered      | NULL                | NULL                | NULL                | NULL                | NULL                | 2025-09-02 11:10:05 | NULL                  | NULL            | NULL             | false          | desktop      | Thunderbird   | 192.168.1.10  | Germany           | Berlin         | 10                |
| 7  | 103          | 207         | 503                    | spam\_reported | 2025-09-02 12:15:00 | NULL                | NULL                | NULL                | NULL                | 2025-09-02 12:14:59 | 2025-09-02 12:15:30   | NULL            | NULL             | true           | mobile       | Gmail         | 198.18.0.45   | Brazil            | São Paulo      | -50               |

---


# 6. **Billing & Usage**

You want to **charge per mail usage**.

#### `billing_plans`

- `id`
- `plan_name`
- `monthly_fee`
- `per_email_charge`
- `limits (JSON)` – e.g. max users, max templates

#### `usage_records`

- `id`
- `tenant_id`
- `period` (e.g. 2025-09)
- `email_sent_count`
- `email_opened_count`
- `charge_amount`
- `generated_at`

#### `invoices`

- `id`
- `tenant_id`
- `amount`
- `status` (paid/unpaid/failed)
- `billing_period`
- `issued_at`, `paid_at`

---

# 7. **Audit & Security**

#### `audit_logs`

- `id`
- `tenant_id`
- `user_id`
- `action` – e.g. "create_contact", "send_email"
- `target_type` – contact/template/email
- `target_id`
- `ip_address`
- `created_at`

---

# 8. **High-level Interactions**

- **Login** → via `users` + `sessions` (or Auth0).
- **Contact added** → stored in `contacts`.
- **Mail sent** → creates `email_message`.
- **Tracking** → events stored in `email_events`.
- **Stats** → derived into `contact_user_stats`.
- **Billing** → `usage_records` count mails, charges applied in `invoices`.
- **Multi-tenant** → All key tables link to `tenant_id`.

---

👉 This schema will let you:

- Handle **multi-tenant SaaS** with roles.
- Track every **user–contact interaction**.
- Manage **templates & campaigns**.
- Charge **per-email, per-plan, or hybrid**.
- Keep full **audit history**.

Got it ✅
So, you’re planning to build a **hiring-focused CRM-style database** where:

- Contact data (candidates, recruiters, HRs, hiring managers, etc.) comes from:
  1. **Scraping sources** like LinkedIn, X (Twitter), job boards.
  2. **Manual addition** by users.
  3. **CSV uploads** (bulk contact data).

This means the **database schema** must support:

- Flexible ingestion (scraped, manual, bulk import).
- User ownership (who uploaded / owns the contact).
- Metadata (source, quality, verification, tags).
- Configs/templates for later automation (email templates, outreach campaigns).
- Auth and tenancy (multi-user + identity).

---

### 🔹 Proposed **Database Design (ERD level)**

**4. Templates & Configurations**

- `templates`
  - `template_id` (PK)
  - `name`
  - `type` (email, message, linkedin-invite, etc.)
  - `content` (text/json)
  - `created_by` (FK → users.user_id)
  - `created_at`

- `configurations` (general system/user configs)
  - `config_id` (PK)
  - `key` (smtp_settings, linkedin_cookie, etc.)
  - `value` (json/text)
  - `tenant_id` (FK)

---

**5. Activities (Interaction Logs, optional but useful)**

- `activities`
  - `activity_id` (PK)
  - `user_id` (FK)
  - `contact_id` (FK)
  - `action` (viewed, emailed, added_note, imported)
  - `timestamp`

---

### 🔹 ERD (Simplified)

```
   tenants ───< users ───< sessions
                    │
                    │ added_by
                    ▼
                 contacts ───< activities
                    ▲
       imports ───< import_contacts
                    │
             templates / configurations
```

---

### 🔹 Why this works for scraping + manual + CSV

- **Scraped Data** → Inserted into `contacts` with `source="linkedin_scrape"` and `added_by` as system bot user.
- **Manual Data** → Inserted with `source="manual"` and `added_by=user_id`.
- **CSV Uploads** → Goes into `imports`, then linked to `contacts` through `import_contacts`.

This way you **track the origin of every record** and keep ownership per tenant/user.


Got it 👍 You don’t want the schema yet — only a **field listing (with relations + purpose explained)** for both flows (Gmail API OAuth and App Password SMTP) so we clearly know what data we’ll store and how interactions connect. Here’s a detailed breakdown:

---

## 🔹 **Core Entities & Fields**

### 1. **User**

* `user_id` (PK)
* `name`
* `email` (login email, not necessarily sending email)
* `password_hash` (if using our auth flow)
* `auth_type` (`oauth_gmail`, `app_password`, `system_auth`)
* `created_at`
* `updated_at`

---

### 2. **Email Account** (what sender email is connected)

* `account_id` (PK)
* `user_id` (FK → User)
* `provider` (`gmail`, `outlook`, `custom_smtp`)
* `email_address` (actual sending email, e.g. `user@gmail.com`)
* `connection_type` (`oauth`, `app_password`)
* `oauth_token` (if Gmail OAuth)
* `refresh_token` (if Gmail OAuth)
* `app_password` (encrypted, if SMTP app password)
* `status` (`active`, `disconnected`, `error`)
* `last_connected_at`

---

### 3. **Session / Login Tracking**

* `session_id` (PK)
* `user_id` (FK → User)
* `ip_address`
* `device_info`
* `login_time`
* `logout_time`
* `is_active`

---

## 🔹 **Mailing Entities**

### 4. **Template**

* `template_id` (PK)
* `user_id` (FK → User)
* `name`
* `subject` (with variables allowed, e.g. `{{name}}`)
* `body_html`
* `body_text`
* `placeholders` (JSON list: e.g. `["name", "company", "offer_link"]`)
* `created_at`
* `updated_at`

---

### 5. **Recipient List**

* `recipient_id` (PK)
* `user_id` (FK → User)
* `name`
* `email`
* `company`
* `tags` (JSON, e.g. `["interview", "followup"]`)
* `is_active`
* `created_at`

---

### 6. **Email Campaign** (bulk or single send trigger)

* `campaign_id` (PK)
* `user_id` (FK → User)
* `account_id` (FK → Email Account)
* `template_id` (FK → Template, nullable for ad-hoc mail)
* `subject`
* `body_html`
* `scheduled_time`
* `status` (`draft`, `scheduled`, `sending`, `completed`, `failed`)
* `total_recipients`
* `created_at`

---

### 7. **Email Log / Message** (every mail sent or received)

* `message_id` (PK)
* `campaign_id` (FK → Campaign, nullable if ad-hoc)
* `recipient_id` (FK → Recipient)
* `account_id` (FK → Email Account)
* `subject`
* `body_html`
* `body_text`
* `status` (`queued`, `sent`, `delivered`, `bounced`, `failed`)
* `gmail_thread_id` (if OAuth Gmail → track conversation)
* `gmail_message_id` (unique Gmail ID for replies, receipts)
* `sent_at`
* `delivered_at`
* `opened_at` (tracked via pixel)
* `clicked_at` (tracked via redirect link)
* `replied_at` (if Gmail API connected & reply fetched)

---

## 🔹 **Tracking & Analytics**

### 8. **Open/Click Tracking**

* `tracking_id` (PK)
* `message_id` (FK → Email Log)
* `event_type` (`open`, `click`)
* `event_time`
* `ip_address`
* `user_agent`

---

### 9. **Reply Tracking** *(Only if Gmail OAuth is connected)*

* `reply_id` (PK)
* `message_id` (FK → Email Log)
* `from_email`
* `reply_body`
* `reply_time`

---

## 🔹 **Interactions Between Fields**

* **User → Email Account**: One user can have multiple email accounts (via OAuth Gmail or App Password).
* **Email Account → Campaign**: Campaigns are tied to a sending account.
* **Campaign → Template & Recipients**: Campaigns may use a template and send to a recipient list.
* **Campaign → Email Log**: Expands into individual sent messages.
* **Email Log → Tracking**: Opens/clicks/replies update engagement.
* **Email Log → Reply Tracking**: Only if Gmail API is used, replies are linked back.

---

👉 Key difference in **data availability**:

* **Gmail OAuth** → can store `thread_id`, `message_id`, full reply tracking, delivery receipts, smart sync.
* **App Password SMTP** → can only send and track opens/clicks (no direct reply fetch).

---

Do you want me to now **map out the end-to-end flow** (like step 1: user connects Gmail / enters app password → step 2: create template → step 3: send campaign → step 4: logs + tracking) with these fields?




Exactly 💡 you’re thinking in the **right scalable direction**. Let’s break it down step by step for **Email Campaigns** as the next major piece after **Contacts** and **Templates**:

---

## 🔹 Core Concept

* **Templates** are reusable blueprints.
* **Campaigns** are *instances* that use a snapshot (copy) of the template **at creation time** so later template edits don’t affect running or past campaigns.
* Campaigns must be **independent, immutable logs** for tracking and auditing.

---

## 🔹 Campaign Entity – Fields

Here’s a detailed list of fields you’ll likely need:

### 1. Campaign Metadata

* `campaign_id` (unique ID)
* `campaign_name` (human-readable name)
* `description` (optional, for internal notes)
* `created_by` (user ID who created)
* `created_at`, `updated_at`
* `status` (draft, scheduled, running, completed, paused, canceled)

### 2. Template Snapshot

* `template_id` (reference to original template for traceability)
* `template_snapshot` (the HTML/text content & subject line copied at campaign creation)
* `email_subject` (campaign-specific subject, can override template)
* `email_body_html`
* `email_body_text`

### 3. Audience (Target Contacts)

* `contact_list_ids` (reference one or more lists)
* `segment_rules` (filters: e.g., job title = recruiter, company\_size > 500)
* `final_recipient_count` (snapshot at send time, since lists may change later)

### 4. Sending Configuration

* `from_name`
* `from_email`
* `reply_to_email`
* `sending_domain` (if using multiple domains/accounts)
* `schedule_type` (immediate / scheduled / recurring)
* `schedule_time` (if scheduled)
* `throttle_rate` (e.g., 100 emails/hour to avoid spam flags)
* `batch_size` (if large lists need chunking)

### 5. Tracking & Analytics Setup

* `tracking_enabled` (yes/no)
* `track_opens` (pixel tracking)
* `track_clicks` (redirect links with tracking)
* `unsubscribe_link` (mandatory in most regions)
* `custom_utm_params` (for Google Analytics)

---

## 🔹 Campaign Execution Flow

1. **Draft → Configure**

   * Choose template (snapshot taken).
   * Choose audience (lists/segments).
   * Configure sender identity + schedule.

2. **Validate**

   * Run pre-checks (broken links, missing unsubscribe, invalid emails).
   * Estimate reach size.

3. **Launch**

   * At schedule time, resolve target contacts into **campaign\_recipients** table.
   * Each recipient gets an entry with `status = pending`.

4. **Send Engine**

   * Picks recipients in batches.
   * Sends emails (through SMTP, SendGrid, SES, etc).
   * Updates recipient status → sent, failed.

5. **Tracking**

   * Opens, clicks, bounces, unsubscribes logged per recipient.
   * Real-time updates.

6. **Feedback & Insights**

   * Campaign dashboard shows:

     * Total Sent
     * Deliverability (delivered vs. bounced)
     * Open rate, Click-through rate (CTR)
     * Unsubscribe rate
     * Engagement over time
     * Per-contact activity timeline

---

## 🔹 Campaign-Recipient Relationship

You’ll need a **campaign\_recipients** table for per-contact tracking:

* `campaign_id`
* `contact_id`
* `email`
* `status` (pending, sent, delivered, bounced, opened, clicked, unsubscribed, replied)
* `open_count`, `click_count`, `last_engagement_at`
* `feedback` (manual notes or system classification e.g., "interested", "out of office")

This allows deep insights like:

* Which contacts are **actively engaging**.
* Which are **silent** (no open/click).
* Which are **hard bounces** (emails dead).
* Which are **soft bounces** (temporary failure).

---

## 🔹 Scalability / Best Practices

* ✅ Always snapshot template + recipient list at campaign creation.
* ✅ Separate **campaigns** from **templates** to avoid accidental retroactive changes.
* ✅ Store granular recipient-level events for analytics.
* ✅ Allow **multi-campaign per contact history** to track engagement trends.
* ✅ Support **A/B Testing campaigns** (subject line, template variants).
* ✅ Consider **reply tracking** (via unique reply-to addresses or mailbox integration).

---

👉 Next step: I can draft a **full scalable interaction flow diagram** for Campaigns (with Templates + Contacts + CampaignRecipients) so the relationships are crystal clear.

Do you want me to sketch that flow out for you in a **step-by-step visual interaction diagram style**?
