# PeoplePay360 — HR & Payroll Operations Platform

## Overview
PeoplePay360 is an integrated, enterprise-ready HR and Payroll Operations Platform designed to automate the full employee payroll lifecycle—from contract setup and working schedules to dynamic multi-rule pay calculation, payruns, automated payslip generation (PDF & email), and live analytical reporting.



## Technology Stack

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM (v6)
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Validation**: Zod
- **Document Generation**: PDFKit (Phase 8)
- **Email Service**: Nodemailer (Phase 8)
- **Testing**: Jest & Supertest
- **Code Quality**: ESLint & Prettier

### Database (Planned for Phase 2)
- **Database Engine**: SQLite+MySQL
- **ORM**: Prisma

---

## Project Structure
```
PeoplePay360/
│
├── backend/
│   ├── src/
│   │   ├── config/             # Environment & app configurations
│   │   ├── controllers/        # Route controllers (Health Check, etc.)
│   │   ├── middleware/         # Error handling, 404, CORS
│   │   ├── routes/             # Express API routes (/api/health)
│   │   ├── services/           # Business logic layer (Phase 2+)
│   │   ├── repositories/       # Data access layer (Phase 2+)
│   │   ├── validators/         # Zod schemas (Phase 2+)
│   │   ├── utils/              # Utility functions
│   │   ├── types/              # TypeScript definitions
│   │   ├── app.ts              # Express application setup
│   │   └── server.ts           # HTTP server entrypoint
│   ├── tests/                  # Jest integration & unit tests
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── .gitignore
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Views (Home, Login, Dashboard)
│   │   ├── layouts/            # Application layouts (MainLayout)
│   │   ├── services/           # Axios API client (api.ts)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── contexts/           # State contexts
│   │   ├── routes/             # App Router configuration
│   │   ├── types/              # TypeScript definitions
│   │   ├── utils/              # UI helpers
│   │   ├── App.tsx             # Root React component
│   │   └── main.tsx            # DOM entrypoint
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── .env.example
│   └── .gitignore
│
├── docs/                       # Architecture documentation
├── database_schema.sql         # Reference MySQL schema for Phase 2 translation
├── .gitignore
├── README.md
└── package.json                # Root orchestration package
```

---

## Frontend Overview
The frontend is a single-page React app built with Vite and Tailwind CSS.
- **Routes**:
  - `/` — Home page highlighting system business pipeline architecture.
  - `/login` — User portal login (placeholder prior to Phase 3 Auth).
  - `/dashboard` — Operational metrics overview & phase readiness matrix.
- **API Status Ticker**: Header periodically polls `GET /api/health` via Axios to report backend availability.

---

## Backend Overview
The backend is an Express application written in TypeScript.
- **Entry Points**:
  - `src/app.ts`: Express middleware, CORS configuration, API route registration, 404, and error handling middleware.
  - `src/server.ts`: Starts the HTTP server.
- **Response Format**:
  - Success: `{ "success": true, "message": "...", "data": {} }`
  - Error: `{ "success": false, "message": "...", "errors": [] }`

---

## API Documentation

### Health Check Endpoint
```http
GET /api/health
```
**Expected Response**:
```json
{
  "success": true,
  "message": "PeoplePay360 API is running"
}
```

---

## Environment Variables

### Backend (`backend/.env.example`)
```ini
PORT=5000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Frontend (`frontend/.env.example`)
```ini
VITE_API_URL=http://localhost:5000/api
```

---

## Installation

Run the following from the root directory to install all dependencies for root, backend, and frontend:
```bash
npm run install:all
```
Or install individually:
```bash
# Backend dependencies
cd backend && npm install

# Frontend dependencies
cd ../frontend && npm install
```

---

## Running the Project

### Running Both Frontend & Backend
From the root directory:
```bash
npm run dev
```

### Running Backend Only
```bash
npm run dev:backend
# Or from inside /backend: npm run dev
```
Backend will run at: `http://localhost:5000`

### Running Frontend Only
```bash
npm run dev:frontend
# Or from inside /frontend: npm run dev
```
Frontend will run at: `http://localhost:5173`

---

## Development Workflow & Verification

1. **Verify Backend Build**:
   ```bash
   cd backend && npm run build
   ```
2. **Verify Frontend Build**:
   ```bash
   cd frontend && npm run build
   ```
3. **Run Backend Tests**:
   ```bash
   cd backend && npm test
   ```

---

## Future Database Setup (Phase 2 Roadmap)
In Phase 2, SQLite + Prisma will be introduced:
1. Prisma ORM installation (`prisma`, `@prisma/client`).
2. Translating `database_schema.sql` into `schema.prisma`.
3. Executing Prisma initial migration (`npx prisma migrate dev --name init`).
4. Updating `GET /api/health` to reflect active database connectivity.
