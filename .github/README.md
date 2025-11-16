# KAJ–GCMC Platform

A modern compliance‑automation and client‑management platform built with a modular, service‑oriented architecture.  
This repository contains the full source for the **KAJ–GCMC Platform**, including:

- Multi‑tenant backend API
- Secure authentication & RBAC
- Document & filing management
- Client management & workflow automation
- Background job processing
- Reporting & PDF generation
- Web dashboard
- Infrastructure & Docker deployment

---

## 🚀 Tech Stack

### **Frontend**
- Next.js (App Router)
- React / TypeScript
- TailwindCSS + Radix UI components
- tRPC client
- Better-Auth client integration

### **Backend API**
- Hono (Bun runtime)
- tRPC v11
- Prisma ORM
- PostgreSQL
- Multi‑tenant architecture
- RBAC enforcement layer

### **Authentication**
- **Better‑Auth**
- Password login, sessions, secure cookies
- Multi‑tenant session context injection
- Permissions evaluated at procedure level

### **Background Processing**
- BullMQ + Redis
- Scheduled jobs:
  - Compliance score refresh
  - Filing reminders
  - Document expiry notifications
  - Email dispatch queue

### **Object Storage**
- MinIO (S3-compatible)
- Fully tenant‑isolated buckets
- Presigned uploads & secure downloads

### **Reporting System**
- Full PDF generation pipeline
- Templates included:
  - Client File Report
  - Compliance Summary
  - Documents List
  - Filings Summary
  - Service History
- Download endpoints via API
- Frontend “Download Report” components

### **Deployment & Infrastructure**
- Docker & Docker Compose
- Multi‑service build for:
  - Web (Next.js)
  - API (Hono)
  - Worker (BullMQ)
- Local development environment
- Production-ready multistage Dockerfiles

---

## 🧩 Repository Structure

```
/
├── apps/
│   ├── web/               # Next.js dashboard
│   ├── server/            # Hono + tRPC API
│   └── worker/            # BullMQ worker processes
│
├── packages/
│   ├── api/               # tRPC routers
│   ├── auth/              # Better-Auth config + adapters
│   ├── db/                # Prisma + database client
│   ├── rbac/              # Roles, permissions, enforcement
│   ├── reports/           # PDF report generator
│   └── config/            # Shared tsconfigs and utilities
│
├── docker-compose.yml
├── README.md
└── MIGRATION_STATUS.md
```

---

## ✨ Core Features

### 🧑‍💼 **Client Management**
- Create, edit, and manage client records  
- Track businesses, contacts, and notes  
- View documents, filings, and tasks related to each client  

### 📄 **Document Management**
- File upload + version control  
- Document types & metadata  
- Expiry tracking  
- Export full document lists to PDF  

### 🗂 **Filing Management**
- Filing categories + jurisdictions  
- Due dates, status tracking  
- Recurring filings  
- Filing reminders  
- Export filing summaries  

### 📊 **Dashboard**
- Compliance scoring
- Recent activity
- Alerts & reminders
- Key metrics cards

### 🔐 **RBAC + Multi-Tenant Security**
- Separate data per tenant  
- 8 system roles  
- Every router wrapped with permission enforcement  

### 📨 **Notifications**
- In-app notifications  
- Automatic alerts for expiries and overdue filings  

### 🧵 **Background Jobs**
- Compliance score scheduler  
- Filing deadlines & reminders  
- Document expiry notifications  

### 📑 **PDF Reporting**
- Beautifully formatted PDF output  
- API endpoints to download reports  
- Used for client deliverables & audit packets  

---

## 🐳 Running Locally (Docker)

### 1. Start infrastructure
```sh
docker compose up -d postgres redis minio
```

### 2. Install dependencies
```sh
bun install
```

### 3. Prepare database
```sh
bun db:generate
bun db:push
```

### 4. Run the whole stack in Docker
```sh
docker compose up --build
```

Services:
- **Web**: http://localhost:3001  
- **API**: http://localhost:3000  
- **MinIO Console**: http://localhost:9001  

---

## 🧪 Testing

Unit + Integration Tests for:
- RBAC
- API routers
- Test utilities
- Reports rendering

Run tests:
```sh
bun test
```

---

## 📦 Production Deployment

### CI/CD Workflow (Recommended)
- GitHub Actions  
- Automated tests  
- Docker build + push  
- Deploy to container platform  
  - Render
  - Fly.io
  - AWS ECS
  - DigitalOcean Apps

### Environment Variables
All variables are documented in `.env.example` for each app.

---

## 📜 Documentation

Important files:

- `MIGRATION_STATUS.md` — tracks migration progress
- `REPORTS_SYSTEM_SUMMARY.md` — overview of the entire PDF system
- `DOCKER.md` — instructions for running & deploying
- `packages/reports/README.md` — report system documentation

---

## 📌 Roadmap / Enhancements

### Completed Enhancements
✔ Full migration to new architecture  
✔ PDF report system  
✔ Worker system + scheduled jobs  
✔ Frontend dashboards  
✔ Documents, Filings, Clients UI  
✔ API test suite  
✔ Infrastructure modernization  

### Upcoming Enhancements
- **Client Portal App**
- **Email delivery service (SMTP or provider)**
- **Advanced analytics dashboards**
- **Audit logging visualization**
- **Role-based UI hiding**
- **Mobile UI improvements**
- **Full CI/CD pipeline**

---

## 🤝 Contributing

1. Create a new branch  
2. Make changes using Claude Code automatic editing or Bun tooling  
3. Run:
```sh
bun lint
bun test
```
4. Open PR

---

## 📄 License
Private — All rights reserved.

