// lib/auth.ts — Authentication utilities for ito.md
import type { Env, Session, Person } from './types';
import { getSession, getPersonById } from './db';
import { hashApiKey } from './crypto';

/** Extract session token from ito_session cookie */
export function extractSessionToken(request: Request): string | null {
  const cookie = request.headers.get('Cookie');
  if (!cookie) return null;
  const match = cookie.match(/ito_session=([^;]+)/);
  return match ? match[1] : null;
}

/** Extract Bearer token from Authorization header */
export function extractBearerToken(request: Request): string | null {
  const auth = request.headers.get('Authorization');
  if (!auth) return null;
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

/** Check if a github username is the admin */
export function isAdmin(githubUsername: string, adminUsername: string): boolean {
  return githubUsername.toLowerCase() === adminUsername.toLowerCase();
}

/** Authenticate a request via session cookie. Returns person or null. */
export async function authenticateSession(request: Request, db: D1Database): Promise<Person | null> {
  const token = extractSessionToken(request);
  if (!token) return null;
  const session = await getSession(db, token);
  if (!session) return null;
  return getPersonById(db, session.person_id);
}

/** Authenticate a request via API key (for agents). Returns agent owner or null. */
export async function authenticateApiKey(request: Request, db: D1Database): Promise<{ agent_id: string; owner_id: string } | null> {
  const token = extractBearerToken(request);
  if (!token || !token.startsWith('ito_live_')) return null;
  const hash = await hashApiKey(token);
  const agent = await db.prepare('SELECT id, owner_id FROM agents WHERE api_key_hash = ?').bind(hash).first<{ id: string; owner_id: string }>();
  return agent ? { agent_id: agent.id, owner_id: agent.owner_id } : null;
}

/** JSON error response helper */
export function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** JSON success response helper */
export function jsonOk(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
