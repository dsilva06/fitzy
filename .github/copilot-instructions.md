This file contains concise, actionable guidance for AI coding agents (Copilot-style assistants) working on the FITZY frontend.

Overview
- This is a Vite + React single-page app scaffolded for the Base44 platform. App entry: `src/main.jsx` -> `src/App.jsx` -> `src/pages/index.jsx`.
- API surface is centralized through `src/api/*`. `src/api/base44Client.js` creates a `base44` client (App-level `appId` and `requiresAuth`). `src/api/entities.js` and `src/api/integrations.js` re-export commonly used entities and integrations.

Architecture & boundaries (what matters)
- UI primitives live under `src/components/ui/` — these are small, reusable Radix/Tailwind-based components used across pages (e.g. `button.jsx`, `dialog.jsx`, `toaster.jsx`). Prefer using these primitives for consistent styling and behavior.
- Feature-level components and pages are organized under `src/pages/` and `src/components/{checkout,wallet,shared}`. Pages import UI primitives rather than raw HTML/CSS.
- Data & back-end integration go through the Base44 SDK. Avoid introducing a separate HTTP client; use `base44` exported from `src/api/base44Client.js` and the entity re-exports in `src/api/entities.js`.
- Global app state is minimal; services (auth, entities, integrations) are consumed directly where needed. Examples: `base44.auth.me()` (see `src/pages/Layout.jsx`) and `base44.auth.logout()`.

Key patterns & conventions
- Path alias: `@` maps to `./src` (see `vite.config.js`). Imports use `@/` widely (e.g. `import App from '@/App.jsx'`).
- CSS: Tailwind is used across the app. Global styles live in `src/index.css` and `src/App.css`.
- Component naming: files use `.jsx` even for small primitives. Keep components as default exports when following existing patterns.
- API modules: prefer using the re-exports in `src/api/entities.js` (e.g. `import { Venue, Booking } from '@/api/entities'`) rather than deep SDK imports.

Developer workflows (discovered)
- Install & run locally:
  - `npm install`
  - `npm run dev` (Vite dev server)
  - `npm run build` (production build)
  - `npm run preview` (preview built bundle)
- Linting: `npm run lint` (ESLint configured). No test runner detected in the repo.
- Vite config notes: server `allowedHosts: true` and `esbuildOptions` forces `.js` to be loaded as `jsx`. Keep that when adding custom build tooling.

Integration & external dependencies
- Primary integration: `@base44/sdk` (see `package.json`). `src/api/base44Client.js` sets `appId` and `requiresAuth`. Treat `appId` like a config value — do not hardcode new secrets in source.
- `src/api/integrations.js` exposes Core integrations (e.g. `InvokeLLM`, `SendEmail`, `UploadFile`). Use these re-exports for cross-cutting integrations.

Notable gotchas & repo-specific checks for PRs
- Some files import `@tanstack/react-query` hooks (for example `src/pages/Layout.jsx` uses `useQuery`) — verify `react-query` is installed or add it to `package.json` as needed.
- There are many Radix-based primitives in `src/components/ui/`. When updating UI, prefer small changes to these primitives to avoid inconsistent behavior across pages.
- Watch for mixed file extensions: most code is `.jsx` but `src/utils/index.ts` exists — TypeScript typings are used sparingly. Don't convert the repo to full TypeScript without a coordinated effort.

How to modify behavior safely
- API & auth changes: update `src/api/base44Client.js` and re-export mappings in `src/api/entities.js`. Consumers expect the `base44` client API shape; keep `requiresAuth` semantics and `base44.auth` methods intact.
- Styling: change Tailwind config (`tailwind.config.js`) or component classes inside `src/components/ui/` for consistent updates.

Examples to reference when coding
- Use client and entities: `src/pages/Layout.jsx`:
  - `const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => base44.auth.me() })`
  - `base44.auth.logout()` in the drawer logout button.
- Base44 client: `src/api/base44Client.js` (appId + requiresAuth)
- UI primitive: `src/components/ui/button.jsx` (consistent props and className merging pattern)

If something isn't discoverable
- If environment secrets or dev server proxies are required, check repository deploy docs or ask owners — secrets are not in repo.
- If tests or CI configuration are added later, update this file with commands and CI expectations.

When reviewing PRs
- Confirm imports use `@/` alias when referring to `src/*`.
- Prefer reuse of `src/components/ui` primitives and `src/api/*` re-exports.
- Small, focused changes to global CSS or to UI primitives require cross-page smoke checks.

Questions for maintainers (ask early)
- Should `@tanstack/react-query` be added as an explicit dependency? Layout uses `useQuery` but it is not listed in `package.json`.
- Where should environment-level configuration (e.g., `appId`) live for different environments (dev/staging/prod)? Currently `src/api/base44Client.js` hardcodes `appId`.

If you need anything else, tell me which area to expand (routing, state, build, CI, or a specific feature folder).
