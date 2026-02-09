export const AUTH_LOGOUT_EVENT = "auth:logout";

export function emitLogout(reason = "token_expired") {
  try {
    window.dispatchEvent(
      new CustomEvent(AUTH_LOGOUT_EVENT, { detail: { reason } }),
    );
  } catch (e) {
    console.error("Failed to emit logout event", e);
  }
}

export function onLogout(handler) {
  window.addEventListener(AUTH_LOGOUT_EVENT, handler);
  return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handler);
}
