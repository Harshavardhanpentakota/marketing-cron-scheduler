# Marketing Cron & Alert Scheduler

A modern, full-stack marketing notification scheduler featuring a Next.js 14 dashboard and a resilient Python FastAPI background worker powered by APScheduler and `uv`.

---

## Architecture Overview

```
marketing-cron-scheduler/
├── ui/                 # Next.js 14 + TypeScript + Tailwind CSS (Dark theme + subtle light borders)
│   ├── app/            # App Router: Dashboard (/) & Execution Logs (/logs)
│   ├── components/     # AlertCard, CreateAlertModal, LogTable, LogDetailModal, Navbar
│   └── lib/            # Typed API client, models, and cron helpers
│
├── service/            # FastAPI + APScheduler + SQLite + uv
│   ├── app/
│   │   ├── main.py     # FastAPI application & startup lifecycle
│   │   ├── database.py # SQLite database configuration & session factory
│   │   ├── models/     # Alert & AlertLog ORM and Pydantic models
│   │   ├── api/        # REST endpoints (/api/alerts, /api/logs)
│   │   ├── scheduler/  # APScheduler engine (Static dates & Cron triggers)
│   │   └── dispatchers/# Meta WhatsApp Cloud API & SMTP Email dispatchers
│   ├── pyproject.toml  # uv dependency manifest
│   └── .env            # WhatsApp & Email credentials
```

---

## Features

- **Dashboard**:
  - Live metric KPI cards (Active Alert Jobs, Cron Recurring, One-Time Static).
  - Search by client, business name, or subject.
  - Filter by All, Cron, or Static.
  - Quick action buttons on each card: **Run Now (Test)**, **Pause / Resume**, **Delete**, and **View Logs**.
- **Create Alert Modal**:
  - **Auto-Channel Detection**: Entering only phone detects **WhatsApp**, entering only email detects **Email**, and entering both automatically enables **Both**.
  - **One-Time Static**: Pick any future date/time with instant presets (+5m, +30m, +1h, Tomorrow).
  - **Recurring Cron**: Visual presets (Hourly, Daily @ 9 AM, Weekly on Monday, Monthly) or Custom Cron expression (`0 9 * * 1-5`) with live human-readable translation.
  - **Dynamic Tags**: Click `{client_name}` or `{business_name}` pills to auto-inject placeholders into your message body.
- **Execution Logs (`/logs`)**:
  - Direct deep-linking: Clicking any alert navigates to `/logs?alert_id=<id>` displaying past runs for that specific alert.
  - Global log stream when visited without query parameters.
  - Modal inspector: View exact rendered message dispatched, provider delivery status, and raw WhatsApp API / SMTP responses.
- **Service & Dispatchers**:
  - **Meta WhatsApp Business Cloud API**: Direct integration via Graph API (`POST /v21.0/{phone_id}/messages`).
  - **Email (SMTP)**: Universal SMTP support (Gmail, SendGrid, Amazon SES, Mailgun, Resend).
  - **Safe Mock Mode (`MOCK_DISPATCH=true`)**: Enabled by default, so you can test all features and see logs without having live API credentials configured.

---

## Getting Started

### 1. Start the Backend Service (`/service`)

```bash
cd service
# If you have uv installed globally:
uv run uvicorn app.main:app --port 8000 --reload

# Or using the local project uv binary:
../.bin/uv run uvicorn app.main:app --port 8000 --reload
```
The FastAPI API will be available at `http://127.0.0.1:8000` (Swagger docs at `http://127.0.0.1:8000/docs`).

### 2. Start the Frontend Dashboard (`/ui`)

```bash
cd ui
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Configuring Live Credentials

Open `service/.env` and update the respective settings:

```ini
# Meta WhatsApp Business Cloud API
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_TOKEN=your_meta_system_user_token

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=marketing@yourcompany.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=marketing@yourcompany.com

# Disable mock mode when ready for live delivery
MOCK_DISPATCH=false
```
