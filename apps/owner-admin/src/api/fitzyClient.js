import { createFitzyClient } from '@fitzy/shared-sdk';

const baseURL =
  import.meta.env?.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

const ownerEmail =
  import.meta.env?.VITE_OWNER_EMAIL ?? 'test@example.com';
const ownerPassword =
  import.meta.env?.VITE_OWNER_PASSWORD ?? 'password';
const autoLogin =
  (import.meta.env?.VITE_OWNER_AUTO_LOGIN ?? 'false') === 'true';
const deviceName =
  import.meta.env?.VITE_OWNER_DEVICE_NAME ?? 'owner-admin-web';

export const fitzy = createFitzyClient({
  baseURL,
  demoCredentials: {
    email: ownerEmail,
    password: ownerPassword,
    deviceName,
    autoLogin,
  },
});
