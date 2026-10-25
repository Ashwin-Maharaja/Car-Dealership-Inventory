# 🚗 Car Dealership Inventory System

A production-ready, full-stack Car Dealership Inventory Management System engineered following **Test-Driven Development (TDD)** and clean coding principles. Built with **React 18**, **TailwindCSS**, **Express**, **TypeScript**, and a persistent **SQLite** database.

---

## Table of Contents

- [Overview & Architecture](#overview--architecture)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started & Local Setup](#getting-started--local-setup)
- [API Reference](#api-reference)
- [Testing & TDD Verification](#testing--tdd-verification)
- [User Roles & Default Credentials](#user-roles--default-credentials)
- [Application UI Walkthrough](#application-ui-walkthrough)
- [My AI Usage (Mandatory Disclosure)](#my-ai-usage)

---

## Overview & Architecture

The application is structured into two decoupled, fully typed layers:

1. **Backend API**: A RESTful service built with Node.js, Express, and TypeScript. It utilizes SQLite with WAL (Write-Ahead Logging) and strict foreign keys for ACID compliance. All data modifications enforce role-based access control (RBAC) with JSON Web Tokens (JWT).
2. **Frontend SPA**: A single-page application built with React 18, Vite, and TailwindCSS. It offers reactive inventory filtering, role-aware administration panels, a purchase checkout flow with live stock depletion, and responsive layouts.

```
car-dealership/
├── backend/
│   ├── src/
│   │   ├── config/database.ts     # SQLite connection & WAL pragma
│   │   ├── middleware/auth.ts     # JWT auth & role validation (Admin/User)
│   │   ├── models/schema.ts       # Database DDL with quantity & category fields
│   │   ├── routes/
│   │   │   ├── auth.ts            # Registration & login endpoints
│   │   │   ├── vehicles.ts        # CRUD, Search, Purchase & Restock
│   │   │   ├── customers.ts       # Customer management
│   │   │   ├── sales.ts           # Deal tracking ledger
│   │   │   └── dashboard.ts       # Aggregation metrics
│   │   ├── types/index.ts         # Strongly-typed models
│   │   ├── index.ts               # Express application entry
│   │   └── seed.ts                # Database seeder
│   └── tests/
│       ├── helpers.ts             # Test harness & JWT generator
│       ├── auth.test.ts           # TDD tests for registration & login
│       ├── vehicles.test.ts       # TDD tests for CRUD, search & permissions
│       └── inventory.test.ts      # TDD tests for purchase & restock
├── frontend/
│   ├── src/
│   │   ├── api/client.ts          # Axios with auto-attached Bearer tokens
│   │   ├── components/            # VehicleCard, VehicleFilters, SaleModal, StatsCard
│   │   ├── context/AuthContext.tsx# Authentication state provider
│   │   ├── pages/                 # Dashboard, Vehicles, Detail, Form, Customers, Sales
│   │   └── types/index.ts         # Frontend model interfaces
│   ├── index.html
│   ├── vite.config.ts             # Proxying /api to port 3001
│   └── tailwind.config.js
├── README.md                      # Documentation & AI disclosure
├── PROMPTS.md                     # Raw AI prompt history
└── .gitignore                     # Git ignore rules
```

---

## Key Features

- **Inventory Tracking**: Each vehicle tracks `id`, `make`, `model`, `category`, `price`, `quantity`, `year`, `color`, and `vin`.
- **Search & Multi-Filter**: Real-time filtering by keyword, body category (Sedan, SUV, Truck, Electric, Coupe, etc.), price range (`minPrice` / `maxPrice`), and availability status.
- **Stock Depletion & Purchase Button**:
  - Each vehicle features a **"Purchase"** button.
  - Purchases reduce stock by 1 atomically.
  - When quantity reaches zero, the vehicle is marked **Sold Out** and the purchase button is **disabled**.
- **Admin Management**:
  - Add new vehicles with category, price, and initial quantity.
  - Edit existing vehicle details.
  - Delete vehicles (restricted to Admin users).
  - Restock vehicles with an inventory counter (restricted to Admin users).
- **Authentication & RBAC**: Stateless JWT auth with passwords hashed using `bcryptjs` (salt factor 12).

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, TypeScript, TailwindCSS v3, React Router v6, Axios |
| **Backend** | Node.js, Express, TypeScript, SQLite (`better-sqlite3`), JWT, bcryptjs |
| **Testing** | Node.js Test Runner (`node:test`, `node:assert`), TSX |
| **Tooling** | Git, npm / pnpm |

---

## Getting Started & Local Setup

### Prerequisites
- Node.js (v18.x or later)
- npm or pnpm

### 1. Backend Setup

```bash
cd backend
npm install

# Copy environment variables
cp .env.example .env

# Seed the database with sample users and inventory
npm run seed

# Run the test suite (TDD verification)
npm run test

# Start backend server (runs on http://localhost:3001)
npm run dev
```

### 2. Frontend Setup

In a new terminal window:

```bash
cd frontend
npm install

# Start Vite dev server (runs on http://localhost:5173)
npm run dev
```

Visit **http://localhost:5173** in your browser. All requests to `/api` are automatically proxied to the backend on `http://localhost:3001`.

---

## API Reference

### Authentication
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new user (`name`, `email`, `password`, optional `role`) |
| `POST` | `/api/auth/login` | Public | Login with email and password, returns JWT token |

### Vehicles & Inventory (Protected — requires `Bearer <token>`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/vehicles` | All Users | List all vehicles with optional pagination |
| `GET` | `/api/vehicles/search` | All Users | Search by make, model, category, and price range |
| `GET` | `/api/vehicles/:id` | All Users | Retrieve single vehicle specifications |
| `POST` | `/api/vehicles` | All Users | Create a new vehicle listing |
| `PUT` | `/api/vehicles/:id` | All Users | Update vehicle details |
| `DELETE`| `/api/vehicles/:id` | **Admin Only** | Delete a vehicle record |
| `POST` | `/api/vehicles/:id/purchase` | All Users | Purchase vehicle; decrements stock quantity |
| `POST` | `/api/vehicles/:id/restock` | **Admin Only** | Restock vehicle; increments stock quantity |

---

## Testing & TDD Verification

The backend includes a comprehensive automated test suite testing user authentication, permissions, inventory decrementing, and search functionality.

To execute tests:
```bash
cd backend
npm run test
```

### Test Suite Results

```text
✔ Auth API Endpoints > POST /api/auth/register > should successfully register a new user and return a JWT token (28ms)
✔ Auth API Endpoints > POST /api/auth/register > should reject registration with missing required fields (6ms)
✔ Auth API Endpoints > POST /api/auth/register > should reject registration when email is already taken (18ms)
✔ Auth API Endpoints > POST /api/auth/login > should log in successfully with valid credentials (15ms)
✔ Auth API Endpoints > POST /api/auth/login > should reject login with wrong password (12ms)
✔ Auth API Endpoints > POST /api/auth/login > should reject login for non-existent email (9ms)
✔ Vehicles API Endpoints > Protected access check > should return 401 when requesting vehicles without token (4ms)
✔ Vehicles API Endpoints > POST /api/vehicles > should successfully add a new vehicle with make, model, category, price, and quantity (14ms)
✔ Vehicles API Endpoints > POST /api/vehicles > should reject adding vehicle with missing required fields (5ms)
✔ Vehicles API Endpoints > GET /api/vehicles/search > should search vehicles by category (11ms)
✔ Vehicles API Endpoints > GET /api/vehicles/search > should filter vehicles by price range (10ms)
✔ Vehicles API Endpoints > GET /api/vehicles/search > should search vehicles by make or model keyword (9ms)
✔ Vehicles API Endpoints > PUT /api/vehicles/:id > should update a vehicle's details (12ms)
✔ Vehicles API Endpoints > DELETE /api/vehicles/:id > should reject deletion when called by non-admin user (403 Forbidden) (7ms)
✔ Vehicles API Endpoints > DELETE /api/vehicles/:id > should allow vehicle deletion when called by an Admin (16ms)
✔ Inventory Management Endpoints > POST /api/vehicles/:id/purchase > should successfully purchase a vehicle, decreasing its stock quantity by 1 (18ms)
✔ Inventory Management Endpoints > POST /api/vehicles/:id/purchase > should transition status to 'sold' when the last unit is purchased (14ms)
✔ Inventory Management Endpoints > POST /api/vehicles/:id/purchase > should reject purchase when vehicle is out of stock (quantity = 0) (8ms)
✔ Inventory Management Endpoints > POST /api/vehicles/:id/restock > should reject restock when attempted by non-admin user (403 Forbidden) (7ms)
✔ Inventory Management Endpoints > POST /api/vehicles/:id/restock > should successfully restock a vehicle when executed by Admin (16ms)

ℹ tests 20
ℹ suites 3
ℹ pass 20
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 384
```

---

## User Roles & Default Credentials

After running `npm run seed`, the following test accounts are pre-populated:

| Email | Password | Role | Permissions |
|---|---|---|---|
| `admin@dealership.com` | `password123` | **Admin** | Full access: View, Add, Edit, Delete, Restock, Purchase |
| `user@dealership.com` | `password123` | **User** | Standard access: View, Search, Filter, Purchase |
| `mike@dealership.com` | `password123` | **Staff** | Dealership operations |

---

## Application UI Walkthrough

1. **Dashboard (`/dashboard`)**:
   - Real-time KPIs: Total Vehicles, Available in Stock, Total Sales, Cumulative Revenue.
   - Recent Sales transaction ledger with customer details.
   - Monthly sales breakdown.
2. **Vehicle Inventory (`/vehicles`)**:
   - Sidebar filters: Keyword search, Body Category dropdown, Price range bounds, Availability filter, and sorting.
   - Vehicle Cards: High-resolution preview, Category chip, Stock badge, and **interactive Purchase Button**.
   - Disabled state displayed with badge when `quantity === 0`.
3. **Vehicle Details (`/vehicles/:id`)**:
   - Complete technical specifications, VIN, mileage, and description.
   - Admin Controls: Restock modal, Edit, and Delete actions.
   - Instant Purchase button.
4. **Administration Forms (`/vehicles/new`, `/vehicles/:id/edit`)**:
   - Form for vehicle attributes with input validation.

---

## My AI Usage

### 1. AI Tools Utilized
- **Google Gemini 3.8 Flash**
- **Claude Sonnet 4.6 & Claude Opus 4.6**

### 2. How the Tools Were Used
- **Schema & Architecture Design**: Guided the transition from a traditional static dealership schema to an inventory model incorporating `category`, `quantity`, and stock transactions.
- **TDD Test Suite Construction**: Generated unit and integration test fixtures covering edge cases (e.g. attempting to purchase when `quantity === 0`, non-admin restock attempts returning `403 Forbidden`).
- **RESTful API Implementation**: Generated TypeScript route handlers with SQL parameterization to prevent injection vulnerabilities.
- **Frontend Component Design**: Accelerated UI layout with TailwindCSS utility classes, creating responsive cards, stock status badges, and loading states.

### 3. Reflection on AI Impact
Leveraging AI assistants transformed the development lifecycle into an iterative, test-first loop. By having the AI draft boundary test scenarios early, we validated role permissions (Admin vs User) and concurrency behaviors prior to writing endpoints. AI assistance significantly reduced boilerplate code writing while maintaining control over data validation, business rules, and error handling.

---

## License

MIT License. Designed and developed for the TDD Kata: Car Dealership Inventory System.
