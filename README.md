# Fidus — Frontend

React (Vite) storefront plus vendor and admin dashboards, role-gated in a
single app. Dark/light theme, green/white/black palette.

## Stack

- React 18 + Vite 5, React Router 6
- axios (`src/api/client.js`) — attaches the JWT, emits `session-expired`
  on 401
- Tailwind CSS v4 (`@tailwindcss/vite`) + hand-rolled CSS in
  `src/styles/index.css` (CSS custom properties drive the theme)
- Vitest + Testing Library (jsdom) for tests

## Setup

```bash
npm install
cp .env.example .env   # point VITE_API_URL at the backend
npm run dev            # serves on :5174 (vite.config.js), API on :5050
```

Other scripts: `npm run build`, `npm run preview`, `npm test`,
`npm run lint`, `npm run format`.

## Folder structure

```
src/
  api/client.js       # axios instance + imageUrl() helper for /uploads paths
  context/            # AuthContext, CartContext, ThemeContext, ToastContext
  components/         # Navbar, ProtectedRoute, DashboardShell/Tabs,
                      # SearchBox, FilterChips, ListState, ImageManager,
                      # PayoutDetailModal, Icons (inline Feather-style SVGs)
  hooks/              # useList (data fetching), useDebounced, useStoreConfig
  pages/              # customer-facing pages + Help
  pages/vendor/       # vendor dashboard, orders, products, POS
  pages/admin/        # admin overview, vendors, customers, orders,
                      # products, delivery zones, payouts, audit, settings
  styles/index.css    # theme tokens + component classes (.card, .btn, .chip…)
  test/               # vitest setup + component/context tests
```

## Routing

- Public: `/`, `/products/:id`, `/cart`, `/help`, `/sell` (vendor
  application), `/login`, `/register`, `/forgot-password`, `/reset-password`
- Customer (auth): `/checkout`, `/orders`, `/orders/:id`
- Vendor (`ProtectedRoute role="vendor"`): `/vendor` overview + payouts,
  `/vendor/orders` (+`/:id`), `/vendor/products` (+`new`/`:id/edit`),
  `/vendor/pos` (direct/walk-in sales with STK push)
- Admin (`ProtectedRoute role="admin"`): `/admin`, `…/vendors` (+`/:id`),
  `…/customers`, `…/orders`, `…/products`, `…/delivery`, `…/payouts`,
  `…/audit`, `…/settings`

Pending vendors land on `/vendor/status`; approved vendors keep full buyer
access.

## Conventions

- Cart lives in `localStorage` until checkout creates a real order and
  fires the M-Pesa STK push; `utils/payment.js` polls until confirmed.
- All dialogs/toasts go through `useToast()` (`toast` + `confirm`) — never
  `window.alert`/`confirm`.
- List pages: `<DashboardShell>` + `useList` + `SearchBox`/`FilterChips`;
  vendor orders paginate server-side.
- Product images resolve through `imageUrl()` — never hardcode the API host.

## Testing

```bash
npm test     # vitest run (jsdom + Testing Library)
npm run lint
```

`src/test/setup.js` polyfills `localStorage` — neither Node 22's stub nor
the installed jsdom provides a working one for these tests.
