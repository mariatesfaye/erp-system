# Mini ERP (Portfolio MVP)

A minimal full-stack ERP-style application focused on core business workflows:

- authentication with role-based access
- inventory management (products + stock IN/OUT ledger)
- invoicing with transactional stock deduction

This project is intentionally lean and practical for portfolio demonstration.

## Features

### Auth
- JWT login (`POST /auth/login`)
- Current user endpoint (`GET /auth/me`)
- Roles: `ADMIN`, `STAFF`
- Route and action protection (backend-enforced)

### Inventory
- Products: list, detail, create, update
- Stock movements: create `IN` movements manually (admin only)
- Product balance computed from ledger: `SUM(IN) - SUM(OUT)`

### Invoicing
- Customers: list, create, update
- Invoices: list, detail, create draft, update draft, issue
- Duplicate invoice line product IDs are rejected
- Issuing invoice creates `OUT` stock movements
- Issued invoices are immutable (no update, no re-issue)

## Tech Stack

- **Backend:** NestJS, Prisma, PostgreSQL
- **Frontend:** Next.js (App Router), Tailwind CSS
- **Auth:** JWT (Bearer token)

## System Design Highlights

- **Stock consistency via ledger model:** inventory is derived from stock movements, not a mutable quantity column.
- **Atomic invoice issuing:** issuing runs in a Prisma transaction.
  - verifies invoice is `DRAFT`
  - checks stock availability per line
  - creates `OUT` movements
  - updates invoice to `ISSUED`
  - commits all-or-nothing

## Project Structure

```text
erp-system/
  backend/
  frontend/
  README.md
```

## Setup

### 1) Prerequisites
- Node.js 20+
- npm
- PostgreSQL

### 2) Clone and install

```bash
git clone https://github.com/mariatesfaye/erp-system
cd erp-system
```

### 3) Backend setup

```bash
cd backend
cp .env.example .env
```

Set in `backend/.env`:

- `DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/mini_erp?schema=public`
- `JWT_SECRET=your-long-random-secret`

Then run:

```bash
npm install
npm run db:deploy
npm run db:seed
npm run start:dev
```

Backend runs on `http://localhost:3000`.

### 4) Frontend setup

Open a second terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs on `http://localhost:3001` (or 3000 if free).

Set in `frontend/.env`:

- `NEXT_PUBLIC_API_URL=http://localhost:3000`

## Demo Credentials

Seeded users:

- **ADMIN**
  - Email: `admin@demo.local`
  - Password: `Admin123!`
- **STAFF**
  - Email: `staff@demo.local`
  - Password: `Staff123!`

## Run Both Backend and Frontend (Command List)

### Terminal A (backend)

```bash
cd erp-system/backend
cp .env.example .env
# edit .env values
npm install
npm run db:deploy
npm run db:seed
npm run start:dev
```

### Terminal B (frontend)

```bash
cd erp-system/frontend
cp .env.example .env
# set NEXT_PUBLIC_API_URL=http://localhost:3000
npm install
npm run dev
```

### Quick verification flow

1. Open frontend in browser
2. Login with admin credentials
3. Create product
4. Add stock IN
5. Create customer
6. Create invoice draft
7. Issue invoice
8. Check product balance decreased

## Screenshots

### Login
![Login Page](frontend/public/assets/login.jpg)

### Products
![Products List](frontend/public/assets/products.jpg)

### Product Detail
![Product Detail](frontend/public/assets/product-detail.jpg)

### Stock
![Stock Page](frontend/public/assets/stock.jpg)

### Customers
![Customers Page](frontend/public/assets/customers.jpg)

### Invoices List
![Invoices List](frontend/public/assets/invoices-list.jpg)

### Invoice Detail
![Invoice Detail](frontend/public/assets/invoice-detail.jpg)

## Why This Project Is Interesting

This project demonstrates practical backend correctness (RBAC + transactional stock integrity) and a clean, minimal frontend UX for operational workflows. It balances simplicity with real-world patterns often used in internal business tools.
