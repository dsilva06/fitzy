# Fitzy Owner Admin

This single-page app lets the operations team review and approve venue onboarding requests that come from the venue-admin portal. It consumes the same Fitzy API, but limits access to owner-level accounts.

## Development

```bash
# from the repo root
npm install
npm run dev --workspace owner-admin
```

### Environment variables

Create an `.env` file next to `vite.config.js` with:

```
VITE_API_BASE_URL=http://localhost:8000/api
VITE_OWNER_EMAIL=test@example.com
VITE_OWNER_PASSWORD=password
VITE_OWNER_AUTO_LOGIN=true
```

The email/password should match an owner user that exists in your backend seeders.

## Features

- Owner authentication (restores previous session when possible)
- Consolidated metrics for pending/approved/rejected venues
- Filterable list of venues grouped by status
- Detail view showing venue metadata, linked admin accounts, and historical notes
- Inline approvals/rejections with optional status notes and auto-refresh of the list
