# Fitzy Monorepo

Fitzy brings together every app that powers our fitness platform. This repo contains the backend API, three web frontends, and the shared SDK they all rely on.

## Structure
- `apps/backend` – Laravel API for bookings, memberships, and payments.
- `apps/consumer` – React/Vite consumer experience.
- `apps/venue-admin` – Venue management dashboard.
- `apps/owner-admin` – Ownership and finance dashboard.
- `packages/shared-sdk` – Shared HTTP client for the API.

## Quick Start
```bash
git clone https://github.com/your-org/fitzy.git
cd fitzy
npm install
```

Boot servers:
- API: `cd apps/backend && composer install && php artisan serve`
- Consumer web: `npm run dev --workspace consumer`
- Venue admin: `npm run dev --workspace venue-admin`
- Owner admin: `npm run dev --workspace owner-admin`

Frontends expect `VITE_API_BASE_URL` (defaults to `http://localhost:8000/api`). Seed demo data with `php artisan migrate --seed` for the backend.

## Scripts
- `npm run dev:consumer`, `npm run dev:venue`, `npm run dev:owner`
- `npm run build` builds every workspace.

## Notes
- Keep shared logic in `packages/shared-sdk`.
- React Query is already configured—use it for new data fetching.
- Report issues or open pull requests in this repo. Every app lives here.
