# StockSense - Inventory Management System

A full-stack inventory management system built for the Odoo Hackathon.

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + React Query + React Hook Form
- **Backend**: Node.js + Express + TypeScript + Prisma ORM + SQLite
- **Auth**: JWT + bcrypt + OTP-based password reset (mocked)

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
# Install all dependencies
npm run setup

# Or manually:
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### Development

```bash
# Start both frontend and backend
npm run dev

# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
```

### Database

```bash
# Push schema changes
npm run db:push

# Seed demo data
npm run db:seed

# Open Prisma Studio
cd server && npm run prisma:studio
```

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@stocksense.com | password123 |
| Manager | manager@stocksense.com | password123 |
| Staff | staff@stocksense.com | password123 |

## Features

### Dashboard
- KPIs: Total Products, Low Stock, Out of Stock, Pending Receipts/Deliveries/Transfers
- Stock by Category (pie chart)
- Stock by Warehouse (bar chart)
- 7-day activity chart
- Recent stock movements

### Products
- CRUD with SKU, name, category, UoM, reorder point
- Stock levels per location
- Movement history

### Operations
- **Receipts**: Incoming stock from suppliers → validate to increase stock
- **Deliveries**: Outgoing stock to customers → validate to decrease stock
- **Internal Transfers**: Move stock between locations
- **Adjustments**: Fix discrepancies between system and physical count

### Stock Ledger
- Real-time stock levels across all locations
- Filters: warehouse, location, category, low stock only
- Complete audit trail (stock ledger)

### Settings
- Warehouses & Locations (hierarchical)
- Product Categories
- Units of Measure

## Project Structure

```
stocksense/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components (Layout)
│   │   ├── hooks/         # Custom hooks (useAuth)
│   │   ├── lib/           # API client, types, queries
│   │   ├── pages/         # Page components
│   │   ├── App.tsx        # Routes
│   │   └── main.tsx       # Entry point
│   └── ...
├── server/                 # Express backend
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── seed.ts        # Demo data
│   ├── src/
│   │   ├── lib/           # Prisma client, validators
│   │   ├── middleware/    # Auth, error handling
│   │   ├── routes/        # API routes
│   │   └── index.ts       # Entry point
│   └── ...
└── package.json           # Root workspace
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user
- `POST /api/auth/forgot-password` - Request OTP
- `POST /api/auth/reset-password` - Reset with OTP

### Products
- `GET /api/products` - List (paginated, searchable)
- `GET /api/products/:id` - Get one
- `POST /api/products` - Create
- `PUT /api/products/:id` - Update
- `DELETE /api/products/:id` - Archive
- `GET /api/products/:id/stock` - Stock per location
- `GET /api/products/:id/moves` - Movement history
- `GET /api/products/low-stock` - Low stock items

### Operations
- `GET /api/receipts` / `POST` / `GET/:id` / `POST/:id/validate` / `POST/:id/cancel`
- `GET /api/deliveries` / `POST` / `GET/:id` / `POST/:id/validate` / `POST/:id/cancel`
- `GET /api/transfers` / `POST` / `GET/:id` / `POST/:id/validate` / `POST/:id/cancel`
- `GET /api/adjustments` / `POST` / `GET/:id` / `POST/:id/validate` / `POST/:id/cancel`

### Stock
- `GET /api/stock` - Current stock (filterable)
- `GET /api/stock/ledger` - Movement history
- `GET /api/stock/product/:id/location/:id` - Specific stock

### Dashboard
- `GET /api/dashboard/kpis` - Dashboard KPIs
- `GET /api/dashboard/stock-by-category`
- `GET /api/dashboard/stock-by-warehouse`
- `GET /api/dashboard/activity`

### Settings
- `GET /api/warehouses` / `POST` / `GET/:id` / `PUT/:id` / `DELETE/:id`
- `GET /api/locations` / `POST` / `GET/:id` / `PUT/:id` / `DELETE/:id`
- `GET /api/categories` / `POST` / `PUT/:id` / `DELETE/:id`
- `GET /api/uoms` / `POST` / `PUT/:id` / `DELETE/:id`

## Production Build

```bash
npm run build
# Frontend: client/dist/
# Backend: server/dist/
```

## Environment Variables

### Server (.env)
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
PORT=3001
NODE_ENV=production
CLIENT_URL="https://your-frontend.com"
```

## License

MIT