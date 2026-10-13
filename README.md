# Fidus — Frontend

React (Vite) storefront and vendor dashboard, role-gated in a single app.

## Setup

```bash
npm install
cp .env.example .env   # point VITE_API_URL at the backend
npm run dev            # serves on :5174 (vite.config.js), API on :5050
```

## Folder structure

```
src/
  api/client.js       # axios instance, attaches JWT automatically
  context/             # AuthContext (login/register/logout), CartContext (local cart)
  components/          # Navbar, ProtectedRoute
  pages/                # customer-facing pages
  pages/vendor/         # vendor dashboard + product form (role-gated)
  styles/index.css      # base styling
```

## Routing

- `/`, `/products/:id`, `/cart`, `/checkout` — customer flow
- `/login`, `/register`
- `/vendor/dashboard`, `/vendor/products/new`, `/vendor/products/:id/edit` — vendor-only,
  guarded by `ProtectedRoute role="vendor"`

Cart lives in `localStorage` until checkout, when it's submitted to the backend to create
a real order and trigger the M-Pesa STK push.
