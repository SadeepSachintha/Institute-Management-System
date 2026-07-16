# Production Handover Plan: Institute Management System (IMS)

This document serves as the operational handover plan for deploying the **Institute Management System (IMS)** in a high-availability, secure, and production-grade environment.

---

## 🌐 1. System Architecture & Topology

The application is structured as a multi-service containerized environment optimized for security, performance, and monitoring.

```text
                            [ HTTPS / Port 443 ]
                                     │
                                     ▼
                          [ Host Nginx Web Proxy ]
                         (SSL Certificate Handler)
                                     │
            ┌────────────────────────┼────────────────────────┐
            │                        │                        │
    [ Host Port 8000 ]       [ Host Port 8080 ]       [ Host Port 6379 ]
            │                        │                        │
            ▼                        ▼                        ▼
     [ Docker Nginx ]        [ Docker FastAPI ]        [ Redis Container ]
  (Proxies to PHP-FPM:9000)   (ML analytics api)       (Cache & Job Queue)
            │                        │                        │
            └────────────┬───────────┴───────────┬────────────┘
                         │                       │
                         ▼                       ▼
                 [ Docker Queue ]        [ Docker MariaDB ]
                 (Queue Worker)         (DB Port 3306 Internal)
```

---

## 🔑 2. Production Environment Variable Configurations

### Laravel Backend (`.env` Configuration Checklist)
Ensure the following variables are configured in the production environment:

```env
# Core Application settings
APP_NAME="IMS Core"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://ims.yourinstitution.edu
APP_KEY=base64:YOUR_SECRET_CRYPTOGRAPHIC_KEY_HERE

# Database configuration
DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=ims_db
DB_USERNAME=ims_admin
DB_PASSWORD=YOUR_STRONG_PRODUCTION_DB_PASSWORD

# Cache & Queues (Redis)
CACHE_STORE=redis
SESSION_DRIVER=database
QUEUE_CONNECTION=redis
REDIS_HOST=redis
REDIS_PORT=6379

# Keycloak Single Sign-On (SSO) settings
KEYCLOAK_CLIENT_ID=ims-portal-client
KEYCLOAK_CLIENT_SECRET=YOUR_KEYCLOAK_CLIENT_SECRET_KEY
KEYCLOAK_REDIRECT_URI=https://ims.yourinstitution.edu/auth/sso/callback
KEYCLOAK_BASE_URL=https://keycloak.yourinstitution.edu
KEYCLOAK_REALM=ims-realm

# Stripe Checkout Payment settings
STRIPE_SECRET=sk_live_YOUR_STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_STRIPE_WEBHOOK_SECRET_SIGNATURE
```

---

## 🚀 3. Step-by-Step Deployment Guide

### Step 3.1: Environment Setup
1. Update system packages and install Docker dependencies:
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y docker.io docker-compose-v2 git certbot python3-certbot-nginx
   sudo systemctl enable --now docker
   ```
2. Clone the repository into `/var/www/ims`:
   ```bash
   git clone https://github.com/SadeepSachintha/Institute-Management-System.git /var/www/ims
   cd /var/www/ims
   ```

### Step 3.2: Build and Run Containerized Services
1. Build the Laravel app, Nginx proxy, Redis, queue worker, and Python analytics images:
   ```bash
   docker compose -f docker-compose.yml up -d --build
   ```
2. Run database migrations:
   ```bash
   docker compose exec app php artisan migrate --force
   ```
3. Seed baseline system settings and roles:
   ```bash
   docker compose exec app php artisan db:seed --class=RolesAndPermissionsSeeder
   ```
4. Optimize Laravel routing and configurations cache:
   ```bash
   docker compose exec app php artisan config:cache
   ```

### Step 3.3: Frontend Compilation
Compile React Single-Page Application assets for optimized browser delivery:
```bash
npm install
npm run build
```

---

## 🛠️ 4. Subsystem Integrations Setup

### 🔐 4.1: Keycloak SSO & Spatie Role-Based Access Control
1. **Keycloak Client Creation:**
   * Create a new OpenID Connect client named `ims-portal-client` in the realm.
   * Set **Valid Redirect URIs** to `https://ims.yourinstitution.edu/auth/sso/callback`.
   * Set **Access Type** to *confidential* and copy the generated Client Secret to the Laravel `.env`.
2. **Spatie RBAC Setup:**
   * Run migration tables inside the database container.
   * Seed roles using `RolesAndPermissionsSeeder` to create `admin`, `faculty`, `student`, and `parent` permissions levels.

### ⚡ 4.2: Asynchronous Queue Workers & Supervisor
In containerized environments, the `queue` service runs `php artisan queue:work --tries=3` inside a loop. If using bare-metal setups, deploy a Supervisor config `/etc/supervisor/conf.d/ims-queue.conf`:
```ini
[program:ims-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/ims/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/ims/storage/logs/queue.log
stopwaitsecs=3600
```

### 💳 4.3: Stripe Checkout Webhooks
1. Configure Stripe API keys (`STRIPE_SECRET`) in the environment.
2. Register the endpoint URL `https://ims.yourinstitution.edu/stripe/webhook` in the Stripe Developers Dashboard.
3. Select event type `checkout.session.completed` for notifications.
4. Copy the webhook signing secret `whsec_...` to the environment configurations to verify incoming signatures.

---

## 📈 5. Monitoring & Observability

### OpenTelemetry JSON Tracing
The application monitors request durations, queries count, and memory footprint using the structured logging middleware.

* **Log Location:** `storage/logs/telemetry.log`
* **Audit Format:**
  ```json
  {
    "timestamp": "2026-07-16T15:17:30+00:00",
    "trace_id": "90ea959...",
    "span_id": "a90dfb2...",
    "service_name": "ims-core-app",
    "http": {
      "method": "POST",
      "url": "https://ims.yourinstitution.edu/api/finance/stripe-checkout",
      "status_code": 200,
      "ip": "203.0.113.19"
    },
    "performance": {
      "duration_ms": 42.50,
      "memory_used_mb": 2.10,
      "db_queries_count": 3,
      "db_queries_time_ms": 1.25
    }
  }
  ```
To parse, aggregate, and ship these metrics to Prometheus/Grafana or Datadog, install a lightweight logging shipper (like **Filebeat** or **Fluent Bit**) targeting the `telemetry.log` file.

---

## 💾 6. Database Backups & Maintenance

Install a nightly backup script `/var/scripts/backup.sh` on the host:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/ims"
DATE=$(date +%Y-%m-%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup SQL Database
docker compose exec db mysqldump -u root ims_db > "$BACKUP_DIR/db_$DATE.sql"

# Backup Uploaded documents and slips
tar -czf "$BACKUP_DIR/storage_$DATE.tar.gz" -C /var/www/ims/storage/app/public/ .

# Retain only last 14 days of logs and backups
find $BACKUP_DIR -type f -mtime +14 -delete
```
Schedule the cronjob in crontab via `crontab -e`:
```text
0 2 * * * /bin/bash /var/scripts/backup.sh
```
This ensures complete database state replication and student document vaults protection every night at 2:00 AM.
