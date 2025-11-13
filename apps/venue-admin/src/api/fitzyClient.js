import { createFitzyClient } from "@fitzy/shared-sdk";

const baseURL =
  import.meta.env?.VITE_API_BASE_URL ??
  (import.meta.env?.DEV ? "http://localhost/api" : "http://localhost:8000/api");

if (import.meta.env?.DEV) {
  console.info('[fitzy] API base URL:', baseURL);
}

const adminEmail =
  import.meta.env?.VITE_VENUE_ADMIN_EMAIL ?? "daniela@fitzy.demo";
const adminPassword =
  import.meta.env?.VITE_VENUE_ADMIN_PASSWORD ?? "password";
const adminDevice =
  import.meta.env?.VITE_VENUE_ADMIN_DEVICE_NAME ?? "venue-admin-web";
const autoLogin =
  (import.meta.env?.VITE_VENUE_ADMIN_AUTO_LOGIN ?? "false") === "true";

export const fitzy = createFitzyClient({
  baseURL,
  demoCredentials: {
    email: adminEmail,
    password: adminPassword,
    deviceName: adminDevice,
    autoLogin,
  },
});
