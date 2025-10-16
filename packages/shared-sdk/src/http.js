import axios from "axios";

const TOKEN_KEY = "fitzy:token";

const hasStorage = () =>
  typeof window !== "undefined" && window.localStorage !== undefined;

function getStoredToken() {
  if (!hasStorage()) return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

function setStoredToken(token) {
  if (!hasStorage()) return;
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

function applyAuthHeader(client, token) {
  if (token) {
    client.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete client.defaults.headers.common.Authorization;
  }
}

function createHttpClient(baseURL) {
  const client = axios.create({
    baseURL,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    withCredentials: false,
  });

  client.interceptors.request.use((config) => {
    const token = getStoredToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return client;
}

export {
  createHttpClient,
  getStoredToken,
  setStoredToken,
  applyAuthHeader,
  TOKEN_KEY,
};
