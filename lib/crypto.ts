// lib/crypto.ts — ID generation, API key generation, hashing

const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

function randomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => CHARS[byte % CHARS.length]).join('');
}

/** Generate a prefixed ID, e.g. "p_a1b2c3d4e5f6" */
export function generateId(prefix: string): string {
  return `${prefix}_${randomString(12)}`;
}

/** Generate an API key: "ito_live_<32 chars>" */
export function generateApiKey(): string {
  return `ito_live_${randomString(32)}`;
}

/** SHA-256 hash of an API key, returned as hex string */
export async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Generate a 64-character hex session token */
export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}
