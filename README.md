# PeoplePay360 — HR & Payroll Operations Platform

PeoplePay360 is an enterprise-grade Human Resource Management System (HRMS) and Payroll Operations Platform built with Next.js 14, TypeScript, Prisma ORM, and MySQL. It delivers end-to-end operational workflows for employee management, contract lifecycle tracking, flexible working schedules, biometric & manual attendance logging, time-off allocations & requests, automated salary structure computations, payrun execution, payslip generation with PDF rendering, and real-time cross-module payroll analytics.

---

## Table of Contents

- [1. Project Overview](#1-project-overview)
- [2. Objectives](#2-objectives)
- [3. Key Features](#3-key-features)
- [4. Application Modules](#4-application-modules)
- [5. System Architecture](#5-system-architecture)
- [6. Application Flow](#6-application-flow)
- [7. Detailed Module Flow](#7-detailed-module-flow)
- [8. Database Architecture](#8-database-architecture)
- [9. Database Schema](#9-database-schema)
- [10. Backend Architecture](#10-backend-architecture)
- [11. Frontend Architecture](#11-frontend-architecture)
- [12. API Architecture](#12-api-architecture)
- [13. Authentication & Authorization](#13-authentication--authorization)
- [14. Payroll Flow](#14-payroll-flow)
- [15. Attendance Flow](#15-attendance-flow)
- [16. Time Off Flow](#16-time-off-flow)
- [17. Employee & Contract Flow](#17-employee--contract-flow)
- [18. Project Structure](#18-project-structure)
- [19. Technology Stack](#19-technology-stack)
- [20. Database Setup](#20-database-setup)
- [21. Environment Configuration](#21-environment-configuration)
- [22. Installation](#22-installation)
- [23. Running the Application](#23-running-the-application)
- [24. Development Workflow](#24-development-workflow)
- [25. API Documentation](#25-api-documentation)
- [26. Validation & Error Handling](#26-validation--error-handling)
- [27. Security Considerations](#27-security-considerations)
- [28. Testing](#28-testing)
- [29. Git Workflow](#29-git-workflow)
- [30. Future Enhancements](#30-future-enhancements)
- [31. Troubleshooting](#31-troubleshooting)
- [32. Contributors](#32-contributors)
- [33. License](#33-license)

---

## 1. Project Overview

PeoplePay360 resolves fragmented HR operations by centralizing data across employee onboarding, employment contracts, attendance tracking, leave requests, and payroll execution into a unified relational database schema. 

### Business Problems Solved:
- **Disjointed Payroll Computation**: Automatically evaluates salary structures, fixed allowances, percentage deductions, working schedule hours, overtime, and leave days to generate precise payslips.
- **Leave Balance Discrepancies**: Tracks leave policy configurations (Time Off Types), approved allocations, and leave request workflows while preventing double-booking or unallocated leave consumption.
- **Attendance Quality & Compliance**: Log check-ins/check-outs, calculates late minutes, early departures, and overtime hours, feeding attendance data directly into payroll period computations.
- **Executive Operational Visibility**: Provides real-time aggregated dashboards for net salary costs by department, historical salary trends, payslip status distributions, and active payroll alerts.

---

## 2. Objectives

- **Centralized Employee Records**: Manage active, probation, and historical staff profiles with department and managerial hierarchy mapping.
- **Contract Lifecycle Management**: Support permanent, temporary, and contractor terms linked to specific wage structures, currency codes, and validity windows.
- **Flexible Working Schedules**: Define weekly schedules, daily shift hours, break durations, and tolerance thresholds.
- **Attendance Tracking**: Enable self-service check-in/out, manual supervisor corrections, and automated late/overtime tracking.
- **Time Off & Policy Governance**: Manage leave type policies (paid, unpaid, medical, comp-off), handle allocation requests, and enforce approval rules.
- **End-to-End Payroll Engine**: Execute draft, computed, validated, and paid payruns with automatic payslip generation and downloadable PDF receipts.
- **Strict Role-Based Access Control (RBAC)**: Enforce granular user permissions (`admin`, `hr_manager`, `hr_payroll_user`, `employee`).

---

## 3. Key Features

### 👥 Employee & User Management
- **Employee Kanban & List Views**: Search, filter, and view employee cards with active status, department, and position badges.
- **User RBAC & Authentication**: Secure bcrypt password hashing, HTTP-only cookie session management, and granular permission enforcement.

### 📄 Contract & Schedule Management
- **Employment Contracts**: Track wage amounts, salary structures, contract types (permanent, temporary, internship), and start/end dates.
- **Working Schedules**: Multi-day shift definitions with configurable daily work hours, break times, and total weekly hours.

### ⏱️ Attendance & Time-Off
- **Attendance Dashboard**: Log daily check-in/out times, inspect worked hours, overtime, and manual supervisor corrections.
- **Time Off Workflow**: Submit leave requests, manage leave allocations per employee, and process approvals/refusals.

### 💰 Payroll & Payslips
- **Payrun Pipeline**: Compute payruns across eligible staff based on active contracts, working schedule days, and approved leave.
- **Payslip PDF Export**: Server-side PDF generation formatted with gross salary, itemized deductions, net pay, and company headers.
- **Payroll Executive Dashboard**: Multi-filter analytical overview of total net salary, department cost distributions, monthly salary trends, and real-time compliance alerts.

---

## 4. Application Modules

| Module | Purpose | Status |
| :--- | :--- | :--- |
| **Authentication & RBAC** | User login, session tokens, permissions, password hashing | Implemented |
| **User Management** | Create and manage user accounts and assigned roles | Implemented |
| **Employees** | Kanban and list views, staff directory, department mapping | Implemented |
| **Contracts** | Employment terms, wage configuration, validity windows | Implemented |
| **Working Schedules** | Shift templates, daily working hours, break definitions | Implemented |
| **Attendance** | Check-in/out logging, overtime computation, status tracking | Implemented |
| **Time Off** | Leave type configuration, allocation balances, request approval flow | Implemented |
| **Payroll & Payruns** | Batch payrun execution, status transitions (draft → computed → validated → paid) | Implemented |
| **Payslips** | Itemized salary line calculations, PDF export | Implemented |
| **Payroll Dashboard** | Executive analytics, department cost charts, monthly trends, alerts | Implemented |
| **Biometric Hardware Sync** | Direct hardware sensor push integration | Planned |
| **Automated Email Dispatch** | SMTP bulk payslip email delivery | Planned |

---

## 5. System Architecture

PeoplePay360 follows a decoupled client-server architecture utilizing Next.js 14 App Router for both API services and Frontend views.

```mermaid
flowchart TB
    subgraph Client ["Client Layer"]
        U[HR Admin / Manager / Employee]
        FE[Next.js 14 Frontend Application - Port 3001/3003]
    end

    subgraph Server ["Server Layer"]
        API[Next.js 14 API Route Handlers - Port 3000]
        AUTH[Authentication & RBAC Middleware]
        SVC[Business Logic Services / Controllers]
        PDF[PDFKit Document Renderer]
    end

    subgraph Data ["Data Layer"]
        ORM[Prisma ORM Client 5.22]
        DB[(MySQL Database Server)]
    end

    U -->|HTTPS / Browser| FE
    FE -->|JSON REST API Requests| API
    API --> AUTH
    AUTH --> SVC
    SVC --> PDF
    SVC --> ORM
    ORM --> DB
```

---

## 6. Application Flow

1. **User Authentication**: User logs in at `/login`. Credentials are verified against bcrypt password hashes in the `users` table; a 7-day HTTP-only session cookie is set.
2. **Context Setup**: User role (`admin`, `hr_manager`, `employee`) determines available menu options and route access.
3. **Operational Workflow**:
   - HR creates **Companies**, **Departments**, and **Working Schedules**.
   - HR registers **Employees** and assigns active **Contracts** with wage amounts and **Salary Structures**.
   - Staff log daily **Attendance** or apply for **Time Off Requests**. Managers review and approve requests.
   - Payroll Admin selects a **Payroll Period** and creates a **Payrun**.
   - System computes **Payslips** for all eligible staff by evaluating attendance, approved time off, and salary rules.
   - Payrun is validated and marked as **Paid**.
4. **Analytics & Output**: HR reviews real-time figures on the **Payroll Dashboard** and downloads employee **Payslip PDFs**.

---

## 7. Detailed Module Flow

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Payroll Admin
    participant FE as Frontend (/payroll/payruns)
    participant API as Backend API (/api/payruns)
    participant Engine as Computation Engine
    participant DB as MySQL Database

    Admin->>FE: Click "Create Pay Run"
    FE->>API: GET /api/payruns/eligible-employees
    API->>DB: Query active contracts & employees
    DB-->>API: Return eligible staff list
    API-->>FE: Return employee list
    Admin->>FE: Select Period & Execute Compute
    FE->>API: POST /api/payruns/[id]/compute
    API->>Engine: Evaluate rules (Base, Allowances, Tax, Leave)
    Engine->>DB: Save Payslip & PayslipLines records
    DB-->>API: Saved successfully
    API-->>FE: Payrun status updated to 'computed'
    Admin->>FE: Mark as Paid & Download PDF
    FE->>API: GET /api/payslips/[id]/pdf
    API-->>FE: Stream PDF binary stream
```

---

## 8. Database Architecture

The relational schema is defined in `prisma/schema.prisma` and enforced via MySQL foreign keys, unique constraints, and multi-column performance indexes.

### Core Relationship Highlights:
- `users` 1:1 `employees` (optional binding)
- `companies` 1:N `departments`, `employees`, `payroll_periods`, `payruns`
- `employees` 1:N `employee_contracts`, `attendance_records`, `time_off_requests`, `time_off_allocations`, `payslips`
- `payroll_periods` 1:N `payruns`, `payslips`
- `payruns` 1:N `payslips`, `payrun_warnings`
- `payslips` 1:N `payslip_lines`, `payrun_warnings`
- `time_off_types` 1:N `time_off_allocations`, `time_off_requests`
- `salary_structures` 1:N `salary_rules`, `payruns`, `employee_contracts`

---

## 9. Database Schema

### Key Data Models & Primary Fields:

```prisma
model employees {
  id               Int                       @id @default(autoincrement()) @db.UnsignedInt
  user_id          Int?                      @unique
  company_id       Int
  employee_code    String                    @db.VarChar(30)
  first_name       String                    @db.VarChar(100)
  last_name        String                    @db.VarChar(100)
  work_email       String?                   @db.VarChar(255)
  department_id    Int?
  job_position_id  Int?
  manager_id       Int?
  employment_type  employees_employment_type @default(full_time)
  hire_date        DateTime                  @db.Date
  bank_name        String?
  bank_account_no  String?
  bank_ifsc_code   String?
  is_active        Boolean                   @default(true)
}

model employee_contracts {
  id                  Int                              @id @default(autoincrement()) @db.UnsignedInt
  employee_id         Int
  reference           String                           @unique
  contract_type       employee_contracts_contract_type @default(permanent)
  wage_amount         Decimal                          @db.Decimal(15, 2)
  working_schedule_id Int?
  salary_structure_id Int?
  state               employee_contracts_state         @default(draft)
}

model payslips {
  id                 BigInt         @id @default(autoincrement()) @db.UnsignedBigInt
  payrun_id          Int
  employee_id        Int
  contract_id        Int
  payroll_period_id  Int
  reference          String         @unique
  basic_salary       Decimal        @db.Decimal(15, 2)
  gross_salary       Decimal        @db.Decimal(15, 2)
  total_deductions   Decimal        @db.Decimal(15, 2)
  net_salary         Decimal        @db.Decimal(15, 2)
  state              payslips_state @default(draft)
}
```

---

## 10. Backend Architecture

- **Framework**: Next.js App Router API Handlers (`app/api/**/route.ts`).
- **ORM**: Prisma Client (`lib/prisma.ts`) with connection pooling.
- **CORS Handling**: Universal CORS origin and credential headers handled in `lib/cors.ts`.
- **Session Auth**: Cookie-based verification via `lib/auth.ts`.
- **PDF Engine**: Server-side binary PDF generation via PDFKit in `app/api/payslips/[id]/pdf/route.ts`.

---

## 11. Frontend Architecture

- **Framework**: Next.js 14 with TypeScript (`frontend/app/**`).
- **Styling**: Vanilla CSS with Tailwind CSS utilities configured in `frontend/tailwind.config.js`.
- **Design Tokens**: Dark enterprise SaaS color palette:
  - Background: `#0B1220`
  - Cards/Panels: `#111827`
  - Secondary Panels: `#172033`
  - Input Backgrounds: `#0F172A`
  - Borders: `#263449`
  - Primary Accent: `#4F8CFF`
  - Status Indicators: Success (`#22C55E`), Warning (`#F59E0B`), Error (`#EF4444`).
- **API Client**: Centralized strongly-typed API client in `frontend/lib/api.ts`.

---

## 12. API Architecture

The REST API communicates using standard JSON request and response envelopes:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional response message",
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 45,
    "totalPages": 1
  }
}
```

---

## 13. Authentication & Authorization

### Session Authentication:
- Session tokens are stored in `user_sessions` with 7-day expiration.
- Cookies are transmitted via `HTTPOnly`, `SameSite=Lax`.

### Role-Based Access Control (RBAC):
- Roles (`admin`, `hr_manager`, `hr_payroll_user`, `employee`) bind to permissions formatted as `module:action:resource` (e.g. `payroll:create:payrun`, `time_off:approve:time_off_request`).

---

## 14. Payroll Flow

1. Create/Open a **Payroll Period** (e.g. `Sep 2026`).
2. Trigger `POST /api/payruns/[id]/compute`.
3. System fetches active contract wage, evaluates salary rules (Basic, HRA, Allowances, PF, Tax), deducts unpaid absences, and creates itemized `payslip_lines`.
4. Validate payrun (`POST /api/payruns/[id]/validate`).
5. Mark payrun as paid (`POST /api/payruns/[id]/mark-paid`).
6. Employees view/download PDF payslip receipts via `GET /api/payslips/[id]/pdf`.

---

## 15. Attendance Flow

1. Employee triggers `POST /api/attendance/check-in`.
2. System logs check-in timestamp and calculates late arrival status against assigned `working_schedules`.
3. Employee triggers `POST /api/attendance/check-out`.
4. System computes `worked_hours` and `overtime_hours`.
5. HR Managers can review attendance logs or submit manual supervisor corrections via `PUT /api/attendance/[id]`.

---

## 16. Time Off Flow

1. HR Admin creates **Time Off Types** (e.g. Paid Time Off, Sick Leave) specifying unit (Days/Hours) and approval requirements.
2. HR Admin allocates leave balances to staff via **Time Off Allocations** (`POST /api/time-off/allocations`).
3. Employee submits a **Time Off Request** (`POST /api/time-off/requests`).
4. Manager/HR reviews request and calls `POST /api/time-off/requests/[id]/approve` or `refuse`.
5. Approved requests automatically update `used_days` and `remaining_days` on the corresponding allocation.

---

## 17. Employee & Contract Flow

1. Create employee profile via `POST /api/employees` or User Registration.
2. Link employee to Department, Job Position, and Manager.
3. Create contract via `POST /api/contracts` specifying Start Date, Wage Amount, Currency, Working Schedule, and Salary Structure.
4. Set contract state to `active`.

---

## 18. Project Structure

```
HRC/
├── app/                        # Next.js Server & Backend REST API Routes
│   ├── api/
│   │   ├── attendance/         # Check-in, check-out, attendance management
│   │   ├── auth/               # Login, logout, current user session
│   │   ├── contracts/          # Contract CRUD & dropdown options
│   │   ├── employees/          # Employee directory & Kanban search
│   │   ├── health/             # System & MySQL health checks
│   │   ├── payroll/            # Payroll Dashboard aggregations
│   │   ├── payroll-periods/    # Payroll period configuration
│   │   ├── payruns/            # Payrun creation, computation, validation
│   │   ├── payslips/           # Payslip calculations & PDF generation
│   │   ├── roles/              # RBAC role management
│   │   ├── time-off/           # Types, allocations, and requests
│   │   ├── users/              # User account management
│   │   └── working-schedules/  # Shifts and schedule lines
│   ├── layout.tsx              # Root HTML wrapper
│   └── page.tsx                # Root redirection
├── frontend/                   # Next.js 14 Web Application
│   ├── app/
│   │   ├── attendance/         # Attendance UI routes
│   │   ├── employees/          # Employee Kanban & contract routes
│   │   ├── login/              # Login screen
│   │   ├── payroll/            # Dashboard, Payruns, Payslips routes
│   │   └── time-off/           # Leave Requests, Allocations, Types routes
│   ├── components/             # Reusable UI component modules
│   ├── lib/
│   │   └── api.ts              # Strongly-typed HTTP API client
│   ├── next.config.js          # Next.js config with API proxy rewrites
│   └── package.json            # Frontend dependencies
├── lib/                        # Core Backend Utilities
│   ├── auth.ts                 # Bcrypt, sessions, RBAC helpers
│   ├── cors.ts                 # Universal CORS response handlers
│   ├── prisma.ts               # Prisma Client singleton
│   └── time-off.ts             # Leave calculation & audit helpers
├── prisma/
│   └── schema.prisma           # MySQL Data Model definitions
├── .env                        # Root Environment variables
├── package.json                # Backend dependencies & scripts
└── README.md                   # Comprehensive project documentation
```

---

## 19. Technology Stack

- **Core Runtime**: Node.js v20+ / v22+
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.6+
- **Database**: MySQL 8.0+
- **ORM**: Prisma Client v5.22.0
- **Authentication**: BcryptJS + HTTP-Only Cookie Session Store
- **Document Generation**: PDFKit
- **Styling**: Vanilla CSS & Tailwind CSS v3.4

---

## 20. Database Setup

Ensure MySQL server is running and create the target database:

```sql
CREATE DATABASE hrc_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Run Prisma schema validation and client generation:

```bash
npx prisma validate
npx prisma generate
```

*(Note: The database schema is managed via existing Prisma models. Do not run destructive schema resets).*

---

## 21. Environment Configuration

Create a `.env` file in the root directory (`C:\Users\rawat\OneDrive\Desktop\HRC\.env`):

```env
DATABASE_URL="mysql://username:password@localhost:3306/hrc_db"
NODE_ENV="development"
PORT=3000
```

Create a `.env.local` file in the `frontend` directory (`C:\Users\rawat\OneDrive\Desktop\HRC\frontend\.env.local`):

```env
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000"
```

---

## 22. Installation

Install backend dependencies in the root directory:

```bash
cd C:\Users\rawat\OneDrive\Desktop\HRC
npm install
```

Install frontend dependencies in the `frontend` directory:

```bash
cd C:\Users\rawat\OneDrive\Desktop\HRC\frontend
npm install
```

---

## 23. Running the Application

Running the full platform requires **two terminals**:

### Terminal 1: Backend API Server (Port 3000)
```powershell
cd C:\Users\rawat\OneDrive\Desktop\HRC
npm run dev
```
> Serves REST APIs at `http://localhost:3000`

### Terminal 2: Frontend Web Application (Port 3001 or 3003)
```powershell
cd C:\Users\rawat\OneDrive\Desktop\HRC\frontend
npx next dev -p 3003
```
> Serves Web UI at `http://localhost:3003`

---

## 24. Development Workflow

1. Perform code edits in `app/api/` (Backend) or `frontend/` (Frontend).
2. Run type check before committing:
   ```bash
   # In frontend/
   npx tsc --noEmit
   npm run lint

   # In root /
   npx tsc --noEmit
   ```
3. Test endpoints via API client or browser.

---

## 25. API Documentation

### Key Endpoint Catalog:

| HTTP Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & set session cookie |
| `POST` | `/api/auth/logout` | Terminate active user session |
| `GET` | `/api/auth/me` | Fetch authenticated user profile & permissions |
| `GET` | `/api/employees` | Search & list active employees |
| `GET` | `/api/contracts` | List employee contracts & wage terms |
| `GET` | `/api/working-schedules` | List working schedule shift templates |
| `POST` | `/api/attendance/check-in` | Record daily attendance check-in |
| `POST` | `/api/attendance/check-out` | Record daily attendance check-out |
| `GET` | `/api/time-off/requests` | List employee time-off requests |
| `POST` | `/api/time-off/requests/[id]/approve` | Approve leave request |
| `GET` | `/api/payruns` | List payruns |
| `POST` | `/api/payruns/[id]/compute` | Calculate salary rules & generate payslips |
| `POST` | `/api/payruns/[id]/validate` | Finalize payrun computation |
| `POST` | `/api/payruns/[id]/mark-paid` | Mark payrun & payslips as paid |
| `GET` | `/api/payslips/[id]/pdf` | Stream downloadable payslip PDF |
| `GET` | `/api/payroll/dashboard` | Fetch aggregated executive payroll analytics |
| `GET` | `/api/health/database` | Verify MySQL database connection status |

---

## 26. Validation & Error Handling

The platform uses consistent HTTP status codes:
- **`200 OK`**: Request executed successfully.
- **`201 Created`**: Entity created successfully.
- **`401 Unauthorized`**: Missing or expired session cookie.
- **`403 Forbidden`**: Insufficient RBAC permission.
- **`404 Not Found`**: Target record does not exist.
- **`422 Unprocessable Entity`**: Missing required parameters or invalid data payload.
- **`500 Internal Server Error`**: Unexpected server failure (sanitized to conceal raw stack traces).

---

## 27. Security Considerations

- **Password Storage**: Passwords hashed using bcrypt with salt factor 10.
- **Session Tokens**: Cryptographically random 256-bit hex strings.
- **Cookie Security**: HTTP-only, SameSite=Lax flags prevent XSS session hijack.
- **CORS Protection**: Access-Control headers restricted to allowed origin.
- **SQL Injection Prevention**: Parameterized queries enforced automatically via Prisma ORM.

---

## 28. Testing

### Manual & Automated Verification Steps:
```bash
# 1. Validate Prisma Data Models
npx prisma validate

# 2. Frontend TypeScript Compilation
cd frontend
npx tsc --noEmit

# 3. Frontend ESLint Audit
npm run lint

# 4. Production Build Verification
npm run build
```

---

## 29. Git Workflow

- Main Development Branch: `main`
- Standard Commit Message Convention:
  ```bash
  git add .
  git commit -m "feat: implement payroll dashboard analytics endpoint and frontend visualizer"
  git push origin main
  ```

---

## 30. Future Enhancements

- **Biometric Device Integration**: Direct IP push protocol receiver for physical turnstile/biometric punch devices.
- **Bulk Email Payslip Delivery**: Background job queue for email dispatching of payslip PDFs.
- **Multi-Currency Support**: Real-time currency exchange rates for international contractor payroll.

---

## 31. Troubleshooting

### Problem: `EADDRINUSE: address already in use :::3001` or `:::3000`
- **Cause**: Another dev server instance is already running on that port.
- **Solution**: Terminate the active process or launch on a different port:
  ```powershell
  npx next dev -p 3003
  ```

### Problem: `Cannot find module './819.js'`
- **Cause**: Running `npm run build` while `next dev` is running overwrote the `.next` development cache.
- **Solution**: Delete the `.next` directory and restart the dev server:
  ```powershell
  Remove-Item -Recurse -Force frontend\.next
  npx next dev -p 3003
  ```

### Problem: `POST /api/auth/login 401`
- **Cause**: Incorrect password or invalid user email.
- **Solution**: Use valid credentials:
  - **Email**: `hr@odoo.com`
  - **Password**: `Admin@123`

---

## 32. Contributors

- **Development Team**: PeoplePay360 Engineering Group
- **Repository**: [AdityaRawat05/HRMS_OXP](https://github.com/AdityaRawat05/HRMS_OXP)

---

## 33. License

Private & Proprietary — PeoplePay360 Software Solutions. All rights reserved.
