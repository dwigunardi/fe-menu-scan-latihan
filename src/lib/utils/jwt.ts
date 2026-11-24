/**
 * Client-side JWT claim readers. They do NOT verify the signature: use them only to compare which
 * user a token belongs to or when it expires, never for authorization decisions.
 */

function readClaims(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const claims: unknown = JSON.parse(atob(padded));
    return claims && typeof claims === 'object' ? (claims as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** The `sub` (user id) claim, or null when the token is not a readable JWT. */
export function getJwtSubject(token: string): string | null {
  const sub = readClaims(token)?.sub;
  return typeof sub === 'string' ? sub : null;
}

/** The `exp` claim in milliseconds since epoch, or null when absent or unreadable. */
export function getJwtExpiryMs(token: string): number | null {
  const exp = readClaims(token)?.exp;
  return typeof exp === 'number' ? exp * 1000 : null;
}
