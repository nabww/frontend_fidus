import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { homeFor } from "../utils/homeFor";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const APPLE_CLIENT_ID = import.meta.env.VITE_APPLE_CLIENT_ID;

const scriptCache = {};
function loadScript(src) {
  if (!scriptCache[src]) {
    scriptCache[src] = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  return scriptCache[src];
}

export default function OAuthButtons() {
  const { oauthLogin } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const from = useLocation().state?.from;
  const googleBtnRef = useRef(null);
  const [error, setError] = useState("");

  function onSuccess(user) {
    navigate(from || homeFor(user), { replace: true });
  }

  // Google Identity Services — renders the official button
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    loadScript("https://accounts.google.com/gsi/client")
      .then(() => {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: ({ credential }) =>
            oauthLogin("google", { token: credential })
              .then(onSuccess)
              .catch(() => setError("Google sign-in failed")),
        });
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: theme === "dark" ? "filled_black" : "outline",
          size: "large",
          width: googleBtnRef.current?.offsetWidth || 300,
          text: "continue_with",
        });
      })
      .catch(() => setError("Couldn't load Google sign-in"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  // Apple JS SDK — popup flow; Apple only sends the name on first authorization
  async function signInWithApple() {
    try {
      await loadScript(
        "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
      );
      window.AppleID.auth.init({
        clientId: APPLE_CLIENT_ID,
        scope: "name email",
        redirectURI: window.location.origin,
        usePopup: true,
      });
      const res = await window.AppleID.auth.signIn();
      const name = res.user
        ? `${res.user.name?.firstName || ""} ${res.user.name?.lastName || ""}`.trim()
        : undefined;
      const user = await oauthLogin("apple", {
        token: res.authorization.id_token,
        name: name || undefined,
      });
      onSuccess(user);
    } catch (err) {
      if (err?.error !== "popup_closed_by_user") setError("Apple sign-in failed");
    }
  }

  if (!GOOGLE_CLIENT_ID && !APPLE_CLIENT_ID) return null;

  return (
    <>
      <div className="oauth-divider"><span>or continue with</span></div>
      <div className="oauth-buttons">
        {GOOGLE_CLIENT_ID && <div ref={googleBtnRef} className="oauth-google" />}
        {APPLE_CLIENT_ID && (
          <button type="button" className="btn btn--ghost oauth-apple" onClick={signInWithApple}>
             Continue with Apple
          </button>
        )}
      </div>
      {error && <p className="error-text">{error}</p>}
    </>
  );
}
