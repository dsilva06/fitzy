import { createFitzyClient } from "@fitzy/shared-sdk";

const baseURL =
  import.meta.env?.VITE_API_BASE_URL ?? "http://localhost:8000/api";

const adminEmail =
  import.meta.env?.VITE_VENUE_ADMIN_EMAIL ?? "daniela@fitzy.demo";
const adminPassword =
  import.meta.env?.VITE_VENUE_ADMIN_PASSWORD ?? "password";
const adminDevice =
  import.meta.env?.VITE_VENUE_ADMIN_DEVICE_NAME ?? "venue-admin-web";

export const fitzy = createFitzyClient({
  baseURL,
  demoCredentials: {
    email: adminEmail,
    password: adminPassword,
    deviceName: adminDevice,
    autoLogin: true,
  },
});
