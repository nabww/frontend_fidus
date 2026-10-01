import { createContext, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import client, { SESSION_EXPIRED_EVENT } from "../api/client";
import { useToast } from "./ToastContext";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Session died mid-use: drop the user, send them to sign in (and back afterwards)
  useEffect(() => {
    function onExpired(e) {
      setUser(null);
      if (e.detail?.quiet || location.pathname === "/login") return;
      toast("Your session has expired. Please sign in again.", { type: "info", duration: 3000 });
      navigate("/login", { replace: true, state: { from: location.pathname } });
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [location.pathname, navigate, toast]);

  useEffect(() => {
    // Optimistically restore the session, then verify the token with the API —
    // a stale/forged localStorage entry gets cleared by the /me response (or 401 interceptor)
    const stored = localStorage.getItem("fidus_user");
    if (stored) setUser(JSON.parse(stored));

    if (!localStorage.getItem("fidus_token")) {
      setLoading(false);
      return;
    }
    client.get("/auth/me")
      .then((res) => {
        setUser(res.data);
        localStorage.setItem("fidus_user", JSON.stringify(res.data));
      })
      .catch(() => setUser(null)) // interceptor clears storage on 401
      .finally(() => setLoading(false));
  }, []);

  function applySession(data) {
    localStorage.setItem("fidus_token", data.token);
    localStorage.setItem("fidus_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }

  async function login(email, password) {
    const { data } = await client.post("/auth/login", { email, password });
    return applySession(data);
  }

  async function register(payload) {
    const { data } = await client.post("/auth/register", payload);
    return applySession(data);
  }

  async function oauthLogin(provider, payload) {
    const { data } = await client.post(`/auth/oauth/${provider}`, payload);
    return applySession(data);
  }

  // Successful reset signs the user straight in
  async function resetPassword(token, password) {
    const { data } = await client.post("/auth/reset-password", { token, password });
    return applySession(data);
  }

  function logout() {
    localStorage.removeItem("fidus_token");
    localStorage.removeItem("fidus_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, oauthLogin, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
