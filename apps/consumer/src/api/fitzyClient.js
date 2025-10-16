import { createFitzyClient } from "@fitzy/shared-sdk";

const apiBaseUrl =
  import.meta.env?.VITE_API_BASE_URL ?? "http://localhost:8000/api";

const demoEmail = import.meta.env?.VITE_FITZY_DEMO_EMAIL ?? "test@example.com";
const demoPassword =
  import.meta.env?.VITE_FITZY_DEMO_PASSWORD ?? "password";

export const fitzy = createFitzyClient({
  baseURL: apiBaseUrl,
  demoCredentials: {
    email: demoEmail,
    password: demoPassword,
    deviceName: "consumer-web",
    autoLogin: true,
  },
});
