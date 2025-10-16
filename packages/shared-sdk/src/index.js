import { createHttpClient, applyAuthHeader, getStoredToken } from "./http.js";
import { createAuthApi } from "./auth.js";
import { createEntitiesApi } from "./entities.js";
import { createCoreIntegrations } from "./integrations.js";

function resolveBaseURL(inputBaseURL) {
  if (inputBaseURL) return inputBaseURL;

  if (typeof process !== "undefined" && process?.env) {
    if (process.env.FITZY_API_BASE_URL) {
      return process.env.FITZY_API_BASE_URL;
    }
    if (process.env.VITE_API_BASE_URL) {
      return process.env.VITE_API_BASE_URL;
    }
  }

  if (
    typeof window !== "undefined" &&
    window.__FITZY_API_BASE_URL__ &&
    typeof window.__FITZY_API_BASE_URL__ === "string"
  ) {
    return window.__FITZY_API_BASE_URL__;
  }

  return "http://localhost:8000/api";
}

function createFitzyClient(options = {}) {
  const baseURL = resolveBaseURL(options.baseURL);
  const http = createHttpClient(baseURL);

  const existingToken = getStoredToken();
  if (existingToken) {
    applyAuthHeader(http, existingToken);
  }

  const auth = createAuthApi(http, options);
  const entities = createEntitiesApi(http);
  const integrations = {
    Core: createCoreIntegrations(),
  };

  return {
    auth,
    entities,
    integrations,
  };
}

export { createFitzyClient };
