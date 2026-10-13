import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// App-wide feedback: centered toasts + confirm dialogs over a blurred backdrop.
// Use these instead of window.alert / window.confirm.
const ToastContext = createContext(null);

const TOAST_MS = 2200;

const ICONS = {
  success: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  error: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  info: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  warning: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="8" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
};

export function ToastProvider({ children }) {
  const [toastState, setToastState] = useState(null); // { id, message, type }
  const [dialog, setDialog] = useState(null); // { title, message, confirmLabel, cancelLabel, danger, resolve }
  const [closing, setClosing] = useState(false);
  const timer = useRef(null);
  const confirmBtn = useRef(null);

  const dismissToast = useCallback(() => {
    clearTimeout(timer.current);
    setClosing(true);
    setTimeout(() => {
      setToastState(null);
      setClosing(false);
    }, 160);
  }, []);

  const toast = useCallback(
    (message, { type = "success", duration = TOAST_MS } = {}) => {
      clearTimeout(timer.current);
      setClosing(false);
      setToastState({ id: Date.now(), message, type });
      timer.current = setTimeout(dismissToast, duration);
    },
    [dismissToast]
  );

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        setToastState(null); // a decision takes priority over a passing toast
        setDialog({
          title: "Are you sure?",
          confirmLabel: "Confirm",
          cancelLabel: "Cancel",
          danger: false,
          ...(typeof opts === "string" ? { message: opts } : opts),
          resolve,
        });
      }),
    []
  );

  const closeDialog = useCallback((result) => {
    setDialog((d) => {
      d?.resolve(result);
      return null;
    });
  }, []);

  // Esc dismisses whichever layer is open; focus the primary action of a dialog
  useEffect(() => {
    if (!toastState && !dialog) return;
    if (dialog) confirmBtn.current?.focus();
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (dialog) closeDialog(false);
      else dismissToast();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toastState, dialog, closeDialog, dismissToast]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {toastState && !dialog && (
        <div className={`feedback-backdrop ${closing ? "is-closing" : ""}`} onClick={dismissToast}>
          <div
            key={toastState.id}
            className={`toast toast--${toastState.type}`}
            role="status"
            aria-live="polite"
          >
            <button
              type="button"
              className="toast__close"
              onClick={dismissToast}
              aria-label="Dismiss"
            >
              {ICONS.error}
            </button>
            <span className="toast__icon">{ICONS[toastState.type] || ICONS.info}</span>
            <p className="toast__message">{toastState.message}</p>
          </div>
        </div>
      )}

      {dialog && (
        <div className="feedback-backdrop" onClick={() => closeDialog(false)}>
          <div
            className="toast dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            aria-describedby="dialog-message"
            onClick={(e) => e.stopPropagation()}
          >
            <span className={`toast__icon ${dialog.danger ? "toast__icon--danger" : ""}`}>
              {dialog.danger ? ICONS.warning : ICONS.info}
            </span>
            <h2 id="dialog-title" className="dialog__title">
              {dialog.title}
            </h2>
            {dialog.message && (
              <p id="dialog-message" className="toast__message muted">
                {dialog.message}
              </p>
            )}
            <div className="dialog__actions">
              <button className="btn btn--ghost" onClick={() => closeDialog(false)}>
                {dialog.cancelLabel}
              </button>
              <button
                ref={confirmBtn}
                className={`btn ${dialog.danger ? "btn--danger" : "btn--primary"}`}
                onClick={() => closeDialog(true)}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
