import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach the JWT to every request once the user is logged in
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("fidus_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const SESSION_EXPIRED_EVENT = "fidus:session-expired";

// A 401 on a request that carried a token means the session died (expired/revoked).
// Requests without a token (e.g. a wrong password on /auth/login) are left alone.
// AuthProvider listens for the event, so it can redirect + toast without a reload.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const hadToken = Boolean(error.config?.headers?.Authorization);
    if (error.response?.status === 401 && hadToken) {
      localStorage.removeItem("fidus_token");
      localStorage.removeItem("fidus_user");
      // Load-time session checks (/auth/me) clear a stale session quietly
      const quiet = error.config?.url?.includes("/auth/me");
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { quiet } }));
    }
    return Promise.reject(error);
  }
);

export default client;

// Resolves product images: absolute URLs pass through, /uploads/... paths
// are served by the API origin (VITE_API_URL minus the /api suffix)
const API_ORIGIN = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");
export function imageUrl(url) {
  if (!url) return null;
  return /^https?:\/\//.test(url) ? url : `${API_ORIGIN}${url}`;
}
