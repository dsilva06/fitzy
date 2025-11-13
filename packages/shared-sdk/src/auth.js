import {
  applyAuthHeader,
  getStoredToken,
  setStoredToken,
} from "./http.js";

const DEMO_SKIP_KEY = "fitzy:demo-skip";

const hasStorage = () =>
  typeof window !== "undefined" && window.localStorage !== undefined;

const getDemoSkip = () =>
  hasStorage() && window.localStorage.getItem(DEMO_SKIP_KEY) === "1";

const setDemoSkip = (value) => {
  if (!hasStorage()) return;
  if (value) {
    window.localStorage.setItem(DEMO_SKIP_KEY, "1");
  } else {
    window.localStorage.removeItem(DEMO_SKIP_KEY);
  }
};

function createAuthApi(http, options = {}) {
  const demoCredentials = options.demoCredentials ?? null;
  let cachedUser = null;

  const login = async ({ email, password, deviceName } = {}) => {
    const response = await http.post("/auth/login", {
      email,
      password,
      device_name: deviceName ?? "web-client",
    });

    const { token, user } = response.data;
    setStoredToken(token);
    applyAuthHeader(http, token);
    setDemoSkip(false);
    cachedUser = user;
    return user;
  };

  const register = async ({
    email,
    password,
    firstName,
    lastName,
    phone,
    role,
    venueId,
    venueName,
    venueCity,
    venueNeighborhood,
    venueAddress,
    venueDescription,
    deviceName,
  } = {}) => {
    const response = await http.post("/auth/register", {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
      phone,
      role,
      venue_id: venueId,
      venue_name: venueName,
      venue_city: venueCity,
      venue_neighborhood: venueNeighborhood,
      venue_address: venueAddress,
      venue_description: venueDescription,
      device_name: deviceName ?? "web-client",
    });

    const payload = response.data ?? {};
    const token = payload.token ?? null;
    const user = payload.user ?? null;
    const pending = Boolean(payload.pending);

    if (token) {
      setStoredToken(token);
      applyAuthHeader(http, token);
      setDemoSkip(false);
      cachedUser = user;
    } else {
      cachedUser = null;
    }

    return {
      user,
      token,
      pending,
      status: payload.status ?? null,
      message: payload.message ?? null,
    };
  };

  const ensureDemoSession = async () => {
    if (!demoCredentials?.email || !demoCredentials?.password) {
      return null;
    }

    try {
      return await login({
        email: demoCredentials.email,
        password: demoCredentials.password,
        deviceName: demoCredentials.deviceName ?? "demo-client",
      });
    } catch (error) {
      console.warn("Fitzy demo login failed", error?.message ?? error);
      return null;
    }
  };

  const me = async () => {
    let token = getStoredToken();

    if (
      !token &&
      demoCredentials?.autoLogin &&
      !getDemoSkip()
    ) {
      await ensureDemoSession();
      token = getStoredToken();
    }

    if (!token) return null;

    try {
      const response = await http.get("/auth/me");
      const user = response.data;
      cachedUser = user;
      return user;
    } catch (error) {
      setStoredToken(null);
      applyAuthHeader(http, null);
      setDemoSkip(true);
      return null;
    }
  };

  const updateMe = async (payload) => {
    const response = await http.put("/auth/me", payload);
    cachedUser = response.data;
    return cachedUser;
  };

  const logout = async () => {
    try {
      await http.post("/auth/logout");
    } catch (error) {
      // ignore network errors on logout
    }
    setStoredToken(null);
    applyAuthHeader(http, null);
    setDemoSkip(true);
    cachedUser = null;
    return true;
  };

  return {
    login,
    register,
    me,
    logout,
    updateMe,
  };
}

export { createAuthApi };
