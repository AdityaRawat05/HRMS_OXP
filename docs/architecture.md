# PeoplePay360 Architecture Overview

## Business Process Flow
```
Employee
   ↓
Contract
   ↓
Working Schedule
   ↓
Attendance / Time Off
   ↓
Salary Structure
   ↓
Salary Rules
   ↓
Payrun
   ↓
Payslip
   ↓
PDF / Email
   ↓
Payroll Dashboard
```

## Layer Architecture
```
React Frontend
      ↓
Axios / REST API
      ↓
Node.js + Express Backend
      ↓
Controllers
      ↓
Services
      ↓
Repositories
      ↓
Prisma ORM (Deferred to Phase 2)
      ↓
SQLite (Deferred to Phase 2)
```

## Status & Roadmap
- **Phase 1**: Initial Project Setup (Completed) — Backend Express TypeScript core, Frontend Vite React layout & router, health check API, standard error middleware. Database setup is explicitly deferred.
- **Phase 2**: Database Setup (Pending explicit instruction)
- **Phase 3**: Authentication & Authorization
- **Phase 4**: HR & Contract Management
- **Phase 5**: Attendance & Time Off Tracking
- **Phase 6**: Dynamic Salary Rules Engine
- **Phase 7**: Payrun Execution Engine
- **Phase 8**: Payslip PDF & Email Distribution
- **Phase 9**: Live Analytics Dashboard
- **Phase 10**: End-to-End Verification & Testing
