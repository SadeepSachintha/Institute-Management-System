# Institute Management System (IMS)

The **Institute Management System (IMS)** is a modern, cloud-based platform designed as the central digital nervous system of an educational institution. It moves beyond basic record-keeping to offer workflow automation, predictive analytics, and seamless stakeholder communication.

---

## 🚀 Key Modules & Features

### 1. Student Information System (SIS) & Admissions
* **Onboarding State Machine:** Automates transitions from Inquiry $\rightarrow$ Applicant $\rightarrow$ Enrolled $\rightarrow$ Alumni.
* **Document Verification Queue:** Administrative queue showing applicant PDFs/images, verifying status, and promoting profiles to enrolled.
* **Institutional Audit Trail:** Logs administrative events (entered grades, leave updates, tuition payments) with IP addresses and before/after values.
* **Automatic ID Generation:** Generates unique student IDs (`STU-YYYY-XXXX`) the moment enrollment registration is completed.

### 2. Academic & Course Management
* **Collision Timetable Scheduler:** Course scheduling with double-booking checks on faculty, room, and student batch cohorts.
* **Database & Mail Alerts:** Absences and leave status approvals trigger database logs and mock emails via Laravel's notification channel framework.
* **Gradebook:** Configurable assessment parameters, weighting calculations, and cumulative GPA logs.

### 3. Financial & Fee Management
* **Automated Billing:** Dynamic tuition, library, and transportation fee invoicing.
* **Tuition Sandbox Portal:** A payment simulation sandbox for students/parents to process outstanding dues and get instant digital receipts.
* **Revenue Dashboard:** Premium HSL-gradient interactive Area charts tracking collections, paid invoices, and outstanding balances.

### 4. Faculty & HR Management
* **Leave Requests:** Approval workflow for leaves with workloads mapping.
* **Faculty Profiles:** Qualifications tracker, department assignments, and teaching hour capacities.

### 5. AI Analytics & Early Warning System
* **Early Warning Explainability:** scikit-learn `LogisticRegression` model flags dropout risks and returns SHAP-like feature contributions (attendance, grades, lateness, absences) mapped onto graphical progress meters.
* **Seasonality-Aware Forecasts:** Predicts enrollments using Classical Additive Time-Series Decomposition to model term-based peaks.
* **Global Toast Center:** Real-time stackable visual notifications alerting administrators and faculty of onboarding workflows, attendance logs, and invoice payments.

---

## 🛠️ Technology Stack

| Component | Technology | Role |
| --- | --- | --- |
| **Core Backend** | Laravel 12.x | Secure MVC framework, notifications channels, polymorphic audit logging, and Eloquent ORM. |
| **Frontend** | React SPA (Inertia.js) + Recharts | Reactive views with role-based panels, expandable risk explanator rows, and interactive data visualizations. |
| **CSS Styling** | Tailwind CSS / HSL CSS | Unified dark-theme glassmorphism layout, custom SVG academic emblem, custom form widgets, and glow indicators. |
| **MLOps & Analytics** | Python 3.14 + FastAPI + SQLAlchemy | Machine learning pipeline, classical additive seasonal forecaster, SHAP explainer engine, and SQLAlchemy `QueuePool` database connection pooling. |
| **Database** | MariaDB / MySQL | Relational data store, configured on custom port `3307` for environment safety. |

---

## 📁 Project Structure

```text
Institute Management System/
├── analytics/              # Python FastAPI microservice
│   ├── .venv/              # Local Python virtual environment
│   ├── model.py            # Logistic Regression ML model (scikit-learn)
│   ├── main.py             # FastAPI Server & database connection
│   ├── requirements.txt    # Python packages list
│   └── Dockerfile          # Microservice Docker container mapping
├── app/                    # Laravel controllers, models, middlewares
├── config/                 # Laravel configs
├── database/               # Migrations & database seeders
├── public/                 # Built assets
├── resources/              # React SPA Pages, Components, and Layouts
│   ├── js/
│   │   ├── Components/     # Shared components and role-based dashboard views
│   │   │   └── Dashboard/  # SisPanel, FinancePanel, HrPanel, AnalyticsPanel, etc.
│   │   ├── Contexts/       # React Contexts (ToastContext for global alerts)
│   │   ├── Layouts/        # AuthenticatedLayout and GuestLayout
│   │   ├── Pages/          # Client view screens (Dashboard.jsx, Welcome.jsx)
│   │   └── app.jsx
│   └── css/
├── routes/                 # Web routes (Blade / Inertia) and API endpoints
├── package.json            # Vite asset compiler packages
├── composer.json           # Laravel PHP packages
├── Dockerfile              # Laravel PHP-FPM container mapping
├── nginx.conf              # Nginx server container mapping
├── docker-compose.yml      # Orchestrates all Docker services
└── README.md
```

---

## ⚙️ Local Setup Instructions

Select one of the following deployment options:

### Option A: Containerized Setup (Docker) - Recommended

Ensure you have **Docker** and **Docker Compose** installed.

1. **Build and start all containers** in detached mode:
   ```bash
   docker-compose up -d --build
   ```
   This will boot the database (`db`), Laravel server (`app`), reverse proxy (`web`), and Python analytics engine (`analytics`).

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

To stop the containers:
```bash
docker-compose down
```

---

### Option B: Bare-Metal Setup (XAMPP / Local Python)

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
   Start-Process -FilePath "d:\xampp\mysql\bin\mysqld.exe" -ArgumentList "--datadir=d:\xampp\mysql\data-ims --port=3307 --standalone" -WindowStyle Hidden
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
2. Install Javascript dependencies and build client SPA assets:
   ```powershell
   npm install
   npm run build
   ```
   *Note: If node/npm are not in your system's PATH on Windows, you can locate them under `C:\Program Files\nodejs` and execute:*
   ```powershell
   $env:Path += ";C:\Program Files\nodejs"
   & "C:\Program Files\nodejs\npm.cmd" run build
   ```
3. Start the Laravel development server:
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
1. **Login credentials:**
   * **Admin:** `admin@ims.com` (password: `password`)
   * **Faculty:** `alan@ims.com` (password: `password`)
   * **Student (High Risk):** `john@ims.com` (password: `password`) - *low grades and attendance*
   * **Student (Perfect):** `jane@ims.com` (password: `password`)
   * **Parent:** `sarah@ims.com` (password: `password`)
2. **AI Early Warning Test:** 
   Log in as Dr. Alan Turing, navigate to the gradebook or attendance logger, modify John Doe's attendance to "absent" and input failing marks, then check the Analytics Dashboard to see the risk probability index update dynamically via the ML microservice.
3. **Workflow Automation Test:** 
   Log in as Student Alice Cooper, who has status "applicant". Go to the Payment Sandbox, complete the fee payment of \$300. Verify the system automatically generates student ID `STU-2026-0003` and shifts her status to "enrolled".

---

Developed and maintained by [SS Labz](https://ss-labz.pages.dev).