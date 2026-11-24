/**
 * Why the user was sent to /login, carried across the full page load of that redirect so the
 * login page can explain it (e.g. "your account was deactivated").
 */
export type LogoutReason = 'account-disabled';

const STORAGE_KEY = 'kumpul_cafe_logout_reason';

export function setLogoutReason(reason: LogoutReason): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, reason);
  } catch {
    // Storage unavailable (private mode): the login page just shows no explanation
  }
}

/** Returns the pending reason once and clears it. */
export function consumeLogoutReason(): LogoutReason | null {
  try {
    const reason = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    return reason === 'account-disabled' ? reason : null;
  } catch {
    return null;
  }
}
