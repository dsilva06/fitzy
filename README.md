# Fitzy Monorepo

Fitzy is our whole fitness platform in one repo. Think of it like a toolbox:

- `apps/backend` → the brain (Laravel API + database work)
- `apps/consumer` → what gym members see (React app)
- `apps/venue-admin` → the control room for each venue
- `apps/owner-admin` → the business dashboard
- `packages/shared-sdk` → code the apps share to talk to the API

All the apps talk to the backend, so getting the backend running is step one.

---

## 1. Clone and install basics
```bash
git clone https://github.com/your-org/fitzy.git
cd fitzy
npm install        # installs JS deps for every app
```

You only need to do this once per machine.

---

## 2. Start the backend (Laravel API)

### First-time setup
```bash
cd apps/backend
cp .env.example .env          # create env file
composer install              # install PHP deps
php artisan key:generate      # set app key
```

Now pick how you want to run it:

### Option A – Sail (Docker) ✅ easiest if you already have Docker Desktop
```bash
./vendor/bin/sail up -d                # starts PHP + MySQL containers
./vendor/bin/sail artisan migrate --seed
```
Sail maps the API to `http://localhost`. To stop everything run `./vendor/bin/sail down`.

### Option B – Native PHP/MySQL
Only do this if you already have MySQL installed and configured.
```bash
php artisan serve                      # http://127.0.0.1:8000
php artisan migrate --seed
```
Make sure `.env` points at your own MySQL instance (e.g. `DB_HOST=127.0.0.1`).

> **Optional Docker commands** (if you prefer raw Docker Compose):
> ```bash
> docker compose -f apps/backend/compose.yaml up -d
> docker compose -f apps/backend/compose.yaml exec laravel.test php artisan migrate --seed
> docker compose -f apps/backend/compose.yaml down
> ```

---

## 3. Start the front-end apps

Each app runs on Vite. Pick the ones you need (consumer, venue admin, owner admin). Example for consumer:

```bash
cd apps/consumer
cp .env.example .env        # set VITE_API_BASE_URL to http://localhost/api
npm run dev
```

Repeat the same steps inside `apps/venue-admin` and/or `apps/owner-admin` if you plan to work on them. Alternatively, from the repo root you can run:

```bash
npm run dev --workspace consumer
npm run dev --workspace venue-admin
npm run dev --workspace owner-admin
```

Each command launches a dev server (usually on port 5173/5174/etc.).

---

## 4. Shared SDK
Nothing to start here. The SDK lives in `packages/shared-sdk` and the front-ends import it automatically. If you change SDK files, restart the corresponding Vite dev server so it picks up the change.

---

## Handy Sail commands (if you use Docker)
```bash
./vendor/bin/sail ps                   # show running containers
./vendor/bin/sail shell                # open a shell in the PHP container
./vendor/bin/sail artisan migrate:fresh --seed
./vendor/bin/sail npm install          # run npm inside the container if needed
./vendor/bin/sail logs -f              # tail logs
```
Prefer Docker Compose? Just replace the Sail command with `docker compose -f apps/backend/compose.yaml ...`.

---

## What do I actually run every day?
1. `./vendor/bin/sail up -d` (or `php artisan serve` + your own MySQL)  
2. `npm run dev` inside each front-end you need  
3. Hack away ✨

You only rerun migrations/seeds when the database schema changes.

## Scripts
- `npm run dev:consumer`, `npm run dev:venue`, `npm run dev:owner`
- `npm run build` builds every workspace.

## Notes
- Keep shared logic in `packages/shared-sdk`.
- React Query is already configured—use it for new data fetching.
- Report issues or open pull requests in this repo. Every app lives here.
