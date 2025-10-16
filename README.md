# Fitzy Monorepo

This repository hosts all Fitzy applications and shared code:

- `apps/backend` – Laravel API powering consumer and admin experiences.
- `apps/consumer` – consumer-facing React client (now wired to the Fitzy API).
- `apps/venue-admin` – React portal for venue operators to manage schedules, inventory, and content.
- `apps/owner-admin` – React portal for Fitzy owners to manage finances, permissions, and reporting.
- `packages/shared-sdk` – shared TypeScript/JavaScript SDK that wraps the Laravel API for all frontends.

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   npm install --workspaces
   ```

   Alternatively, install per workspace:

   ```bash
   cd apps/backend && composer install && npm install
   cd apps/consumer && npm install
   cd apps/venue-admin && npm install
   cd apps/owner-admin && npm install
   ```

2. **Database & seed data**

   ```bash
   cd apps/backend
   touch database/database.sqlite
   php artisan migrate --seed
   ```

   The seeder provisions demo venues, class types, sessions, packages, payment methods, and an owner account (`test@example.com` / `password`).

3. **Local development**

   - API: `cd apps/backend && php artisan serve`
   - Consumer web: `npm run dev --workspace consumer`
   - Venue admin: `npm run dev --workspace venue-admin`
   - Owner admin: `npm run dev --workspace owner-admin`

   The frontends expect `VITE_API_BASE_URL` (default `http://localhost:8000/api`). Optional demo auto-login overrides:

   ```bash
   VITE_FITZY_DEMO_EMAIL=test@example.com
   VITE_FITZY_DEMO_PASSWORD=password
   ```

## Base44 Migration Checklist

- [x] Build native Laravel endpoints covering sessions, venues, bookings, packages, payments, favorites, and waitlists.
- [x] Implement a shared HTTP client in `packages/shared-sdk` targeting the Laravel API (auth via Sanctum).
- [x] Swap the consumer app to the shared client and remove `@base44/sdk`; extend the new admin portals using the same SDK next.

## Scripts

- `npm run build` – build every workspace sequentially.
- `npm run dev:consumer` – start consumer Vite dev server.
- `npm run dev:venue` – start venue admin Vite dev server.
- `npm run dev:owner` – start owner admin Vite dev server.

Feel free to add additional shared packages under `packages/` as the platform grows.
