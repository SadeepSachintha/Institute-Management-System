# Institute Management System (IMS)

The **Institute Management System (IMS)** is a modern, cloud-based platform designed as the central digital nervous system of an educational institution. It moves beyond basic record-keeping to offer workflow automation, predictive analytics, and seamless stakeholder communication.

---

## 🚀 Key Modules & Features

### 1. Student Information System (SIS) & Admissions
* **Onboarding State Machine:** Automates transitions from Inquiry $\rightarrow$ Applicant $\rightarrow$ Enrolled $\rightarrow$ Alumni.
* **Document Verification Queue:** Administrative queue showing applicant PDFs/images, verifying status, and promoting profiles to enrolled.
* **Institutional Audit Trail:** Logs administrative events (entered grades, leave updates, tuition payments) with IP addresses and before/after values.
* **Interactive Audit Explorer:** View administrative activities side-by-side (before/after JSON differences) and export streaming CSV logs.
* **Automatic ID Generation:** Generates unique student IDs (`STU-YYYY-XXXX`) the moment enrollment registration is completed.

### 2. Academic & Course Management
* **Collision Timetable Scheduler:** Course scheduling with double-booking checks on faculty, room, and student batch cohorts.
* **Asynchronous Notifications:** Absences and leave status approvals trigger database logs and mock emails via Laravel's notification channel framework, dispatched via background queue workers.
* **Gradebook:** Configurable assessment parameters, weighting calculations, and cumulative GPA logs.
* **Bulk Grade Importer:** Drag-and-drop CSV importer with flexible header matching, client-side pre-parsing previews, and transaction-controlled rollbacks.
* **PDF Report Card Generator:** Auto-calculates cumulative percentages, GPAs, and cohort rankings, exporting transcripts to printable PDF reports.

### 3. Financial & Fee Management (Stripe & Bank Slip Uploads)
* **Automated Billing:** Dynamic tuition, library, and transportation fee invoicing.
* **Stripe Checkout Integration:** Redirects payments securely to official Stripe Checkout sessions. A custom webhook handler (`/stripe/webhook`) listens to successful sessions to process tuition.
* **Bank Slip Upload Portal (Free Alternative):** Students can upload deposit receipts/PDFs directly, placing invoices in `pending_verification` to avoid payment gateway fees.
* **Admin Verification Overlay:** Admins review pending slips via a preview modal, approve/reject transactions, and dynamically register bank transfer payments.
* **PDF Invoice & Receipt Exporter:** Generates verified billing invoices and payment receipts in a styled HSL print template.
* **Revenue Dashboard:** Premium HSL-gradient interactive Area charts tracking collections, paid invoices, and outstanding balances.

### 4. Faculty & HR Management
* **Leave Requests:** Approval workflow for leaves with workloads mapping.
* **Faculty Profiles:** Qualifications tracker, department assignments, and teaching hour capacities.

### 5. Single Sign-On (SSO) & Role-Based Access Control (RBAC)
* **Keycloak OAuth2 SSO:** Integrated Socialite OpenID Connect login flows for unified dashboard access, with an automatic local mock login fallback for development.
* **Spatie Permissions & Roles:** Protects backend endpoints and frontend layouts using Spatie's RBAC system (`admin`, `faculty`, `student`, `parent`).

### 6. Caching & Performance
* **Redis Cache-Aside:** wrapped timetables and grade transcript queries in a high-speed Redis caching layer, with automatic invalidation triggers on grade entries or scheduling updates.

### 7. Observability & OpenTelemetry
* **Structured Performance Tracing:** Global middleware monitors request latencies, memory footprints, and database queries count, saving standard OpenTelemetry JSON telemetry logs to `storage/logs/telemetry.log`.

### 8. AI Analytics & Early Warning System
* **Early Warning Explainability:** scikit-learn `LogisticRegression` model flags dropout risks and returns SHAP-like feature contributions (attendance, grades, lateness, absences) mapped onto graphical progress meters.
* **Seasonality-Aware Forecasts:** Predicts enrollments using Classical Additive Time-Series Decomposition to model term-based peaks.
* **Global Toast Center:** Real-time stackable visual notifications alerting administrators and faculty of onboarding workflows, attendance logs, and invoice payments.

---

## 🛠️ Technology Stack

| Component | Technology | Role |
| --- | --- | --- |
| **Core Backend** | Laravel 12.x | Secure MVC framework, notifications channels, polymorphic audit logging, and Eloquent ORM. |
| **SSO & Auth** | Keycloak OAuth2 + Socialite | Identity federation and role assignments. |
| **Performance** | Redis Alpine | Queue worker driver and fast cache-aside memory store. |
| **Payment Gateway** | Stripe SDK | Checkout Session integrations and webhook processors. |
| **Frontend** | React SPA (Inertia.js) + Recharts | Reactive views with role-based panels, expandable risk explainer rows, and interactive data visualizations. |
| **CSS Styling** | Tailwind CSS / HSL CSS | Unified dark-theme glassmorphism layout, custom SVG academic emblem, custom form widgets, and glow indicators. |
| **MLOps & Analytics** | Python 3.14 + FastAPI + SQLAlchemy | Machine learning pipeline, classical additive seasonal forecaster, SHAP explainer engine, and connection pooling. |
| **Database** | MariaDB / MySQL | Relational data store, configured on custom port `3307` for environment safety. |

---

## ⚙️ Local Setup Instructions

Select one of the following deployment options:

### Option A: Containerized Setup (Docker) - Recommended

Ensure you have **Docker** and **Docker Compose** installed.

1. **Build and start all containers** in detached mode:
   ```bash
   docker-compose up -d --build
   ```
   This will boot the database (`db`), Laravel server (`app`), reverse proxy (`web`), Redis cache (`redis`), queue worker (`queue`), and Python analytics engine (`analytics`).

2. **Run migrations and seed the database** inside the running app container:
   ```bash
   docker-compose exec app php artisan migrate:fresh --seed
   ```

3. **Install and compile frontend assets** (if running locally for the first time):
   ```bash
   npm install
   npm run build
   ```

The application is now accessible at:
* **Laravel Web Portal:** `http://localhost:8000`
* **Python FastAPI Docs:** `http://localhost:8080/docs`
* **MySQL/MariaDB Host Connection:** `127.0.0.1:3307`
* **Redis Host Connection:** `127.0.0.1:6379`

To stop the containers:
```bash
docker-compose down
```

---

### Option B: Bare-Metal Setup (XAMPP / Local Python / Standalone DB)

#### Prerequisites
* **PHP 8.2+** (contained in XAMPP)
* **Node.js v24.17.x** (LTS)
* **Python 3.14.x** (contained in system PATH)

#### Step 1: Configure Isolated Database
For development safety and to prevent conflicting with existing default database instances on port `3306`:
1. Initialize the new data directory:
   ```powershell
   d:\xampp\mysql\bin\mysql_install_db.exe --datadir=d:\xampp\mysql\data-ims
   ```
2. Start the database process:
   ```powershell
   Start-Process -FilePath "d:\xampp\mysql\bin\mysqld.exe" -ArgumentList "--no-defaults --datadir=d:\xampp\mysql\data-ims --port=3307 --standalone" -WindowStyle Hidden
   ```
3. Create the database:
   ```powershell
   d:\xampp\mysql\bin\mysql.exe -u root -P 3307 -e "CREATE DATABASE IF NOT EXISTS ims_db;"
   ```

#### Step 2: Set Up Laravel Backend
1. Generate the database tables and seed mock data:
   ```powershell
   d:\xampp\php\php.exe artisan migrate:fresh --seed
   ```
2. Create the symbolic link for uploaded public storage documents and slips:
   ```powershell
   d:\xampp\php\php.exe artisan storage:link
   ```
3. Install Javascript dependencies and build client SPA assets:
   ```powershell
   npm install
   npm run build
   ```
4. Start the Laravel development server:
   ```powershell
   d:\xampp\php\php.exe artisan serve --port=8000
   ```

#### Step 3: Set Up Python FastAPI Analytics
1. Install Python requirements in the virtual environment:
   ```powershell
   .\analytics\.venv\Scripts\pip.exe install -r .\analytics\requirements.txt
   ```
2. Run the FastAPI development server:
   ```powershell
   .\analytics\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8080 --reload --app-dir .\analytics
   ```

---

## 🧪 Verification & Demo Testing

### 1. Verification Login Credentials
* **Admin:** `admin@ims.com` (password: `password`)
* **Faculty:** `alan@ims.com` (password: `password`)
* **Student (High Risk / John Doe):** `john@ims.com` (password: `password`) - *low grades and attendance*
* **Student (Perfect / Jane Smith):** `jane@ims.com` (password: `password`)
* **Student (Applicant / Alice Cooper):** `alice@ims.com` (password: `password`)
* **Parent:** `sarah@ims.com` (password: `password`)

---

### 2. Manual Verification Guides

#### 🏦 Bank Slip Manual Payment Verification Portal
1. **Student Slip Upload:** Log in as Student Alice Cooper (`alice@ims.com`). Navigate to the **Tuition** view, select an invoice, and upload a bank deposit slip receipt. The invoice status updates to `pending_verification`.
2. **Admin Verify:** Log in as Admin (`admin@ims.com`), go to the **Financial Ledger & Invoices** view. Pending slips will appear in the verification dashboard checklist. Click **Verify Slip** to review the file, insert remarks, and click **Approve & Mark Paid**.
3. Verify that the system automatically registers a bank transfer payment, upgrades Alice's status to `enrolled`, and generates her Student ID.

#### 🖨️ PDF Invoice, Receipt, & Report Card Exporters
1. **Students**: Log in as student John Doe (`john@ims.com`). Navigate to the **Grades** view and click **Download Report Card (PDF)** to print the transcript. Navigate to the **Tuition** view and click **Download Invoice (PDF)** or **Download Receipt (PDF)** for transaction details.
2. **Administrators**: Log in as Admin (`admin@ims.com`), go to **SIS Central Registry** or **Financial Ledger** and download official report cards, invoices, and receipt PDFs for any student.

#### 🔍 Interactive Audit Log Explorer & Exporter
1. Log in as Admin (`admin@ims.com`), navigate to the **SIS Central Registry** tab and scroll to the **Institutional Audit Trail**.
2. Click any log row to expand it. Inspect the side-by-side JSON diff viewer highlighting changes in Old vs New states.
3. Click **Export CSV** to stream and download the filtered activity logs as a spreadsheet.

#### 📥 Bulk Grade Book CSV Importer
1. Log in as Faculty Dr. Alan Turing (`alan@ims.com`), navigate to the **Gradebook** tab.
2. Toggle the **Bulk Import (CSV)** button on the right sidebar form.
3. Click **Download Template** to fetch a pre-formatted sample CSV.
4. Upload a CSV with invalid entries (e.g. non-existent student IDs, marks exceeding max marks) and verify that the red box displays the exact row numbers and error descriptions.
5. Upload a valid CSV and click **Process CSV Import**. Verify that all records are successfully imported in a database transaction, updating the Grade Registry instantly.

---

### 3. Core Automated Tests
To run all automated backend integration and unit tests (validating CSV import, student enrollment, document verification, timetable overlaps, and PDF streams):
```powershell
d:\xampp\php\php.exe artisan test
```
To filter by specific modules:
```powershell
d:\xampp\php\php.exe artisan test --filter=ImsTest
```

---

### 4. Baseline Core Demos
1. **AI Early Warning Test:** Log in as Dr. Alan Turing, modify John Doe's attendance to "absent" and input failing marks, then check the Analytics Dashboard to see the risk probability index and SHAP explanation update dynamically via the ML microservice.
2. **Workflow Automation Test:** Log in as Student Alice Cooper, who has status "applicant". Go to the Payment Sandbox, complete the fee payment of \$300. Verify the system automatically generates student ID `STU-2026-0003` and shifts her status to "enrolled".

---

Developed and maintained by [SS Labz](https://ss-labz.pages.dev).