// lib/db.ts — D1 query helpers for ito.md
import { generateId } from './crypto';
import type { Person, Agent, Tool, Follow, Session } from './types';

const now = () => new Date().toISOString();

// ── People ──────────────────────────────────────────────

export async function getPersonById(db: D1Database, id: string): Promise<Person | null> {
  return db.prepare('SELECT * FROM people WHERE id = ?').bind(id).first<Person>();
}

export async function getPersonByGithub(db: D1Database, username: string): Promise<Person | null> {
  return db.prepare('SELECT * FROM people WHERE github_username = ? COLLATE NOCASE').bind(username).first<Person>();
}

export async function getPersonByGoogleEmail(db: D1Database, email: string): Promise<Person | null> {
  return db.prepare('SELECT * FROM people WHERE google_email = ? COLLATE NOCASE').bind(email).first<Person>();
}

export async function listPeople(db: D1Database): Promise<Person[]> {
  const result = await db.prepare('SELECT * FROM people ORDER BY display_name').all<Person>();
  return result.results;
}

export async function listSeededPeople(db: D1Database): Promise<Person[]> {
  const result = await db.prepare("SELECT * FROM people WHERE status = 'seeded' ORDER BY display_name").all<Person>();
  return result.results;
}

export async function createPerson(db: D1Database, data: {
  github_username?: string | null;
  google_email?: string | null;
  display_name?: string | null;
  status?: 'seeded' | 'claimed';
  trust_code?: number;
  personal_connection?: number;
  trust_note?: string | null;
  trust_by?: string | null;
}): Promise<string> {
  const id = generateId('p');
  const ts = now();
  await db.prepare(
    `INSERT INTO people (id, github_username, google_email, display_name, status, trust_code, personal_connection, trust_note, trust_by, registered_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    data.github_username ?? null,
    data.google_email ?? null,
    data.display_name ?? null,
    data.status ?? 'seeded',
    data.trust_code ?? 0,
    data.personal_connection ?? 0,
    data.trust_note ?? null,
    data.trust_by ?? null,
    ts,
    ts,
  ).run();
  return id;
}

export async function updatePerson(db: D1Database, id: string, data: Partial<Person>): Promise<void> {
  const fields: string[] = [];
  const values: any[] = [];
  const allowed = ['github_id', 'github_username', 'google_id', 'google_email', 'display_name', 'bio', 'setup', 'status', 'trust_code', 'personal_connection', 'trust_note', 'trust_by'];
  for (const key of allowed) {
    if (key in data) {
      fields.push(`${key} = ?`);
      values.push((data as any)[key]);
    }
  }
  if (fields.length === 0) return;
  fields.push('updated_at = ?');
  values.push(now());
  values.push(id);
  await db.prepare(`UPDATE people SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
}

// ── Agents ──────────────────────────────────────────────

export async function getAgentById(db: D1Database, id: string): Promise<Agent | null> {
  return db.prepare('SELECT * FROM agents WHERE id = ?').bind(id).first<Agent>();
}

export async function getAgentsByOwner(db: D1Database, ownerId: string): Promise<Agent[]> {
  const result = await db.prepare('SELECT * FROM agents WHERE owner_id = ? ORDER BY name').bind(ownerId).all<Agent>();
  return result.results;
}

export async function getAgentByApiKeyHash(db: D1Database, hash: string): Promise<Agent | null> {
  return db.prepare('SELECT * FROM agents WHERE api_key_hash = ?').bind(hash).first<Agent>();
}

export async function listAgents(db: D1Database): Promise<Agent[]> {
  const result = await db.prepare('SELECT * FROM agents ORDER BY name').all<Agent>();
  return result.results;
}

export async function createAgent(db: D1Database, data: {
  owner_id: string;
  name: string;
  description?: string | null;
  personality?: string | null;
  tech_stack?: string | null;
  repos?: string | null;
  capabilities?: string | null;
  home_url?: string | null;
  api_key_hash: string;
}): Promise<string> {
  const id = generateId('a');
  const ts = now();
  await db.prepare(
    `INSERT INTO agents (id, owner_id, api_key_hash, name, description, personality, tech_stack, repos, capabilities, home_url, registered_at, last_seen_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id,
    data.owner_id,
    data.api_key_hash,
    data.name,
    data.description ?? null,
    data.personality ?? null,
    data.tech_stack ?? null,
    data.repos ?? null,
    data.capabilities ?? null,
    data.home_url ?? null,
    ts,
    ts,
  ).run();
  return id;
}

// ── Tools ───────────────────────────────────────────────

export async function getToolsByPerson(db: D1Database, personId: string): Promise<Tool[]> {
  const result = await db.prepare('SELECT * FROM tools WHERE person_id = ? ORDER BY name').bind(personId).all<Tool>();
  return result.results;
}

export async function createTool(db: D1Database, data: {
  person_id: string;
  name: string;
  url?: string | null;
  tags?: string | null;
  note?: string | null;
}): Promise<string> {
  const id = generateId('t');
  const ts = now();
  await db.prepare(
    `INSERT INTO tools (id, person_id, name, url, tags, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, data.person_id, data.name, data.url ?? null, data.tags ?? null, data.note ?? null, ts).run();
  return id;
}

// ── Follows ─────────────────────────────────────────────

export async function getFollowsByPerson(db: D1Database, personId: string): Promise<Follow[]> {
  const result = await db.prepare('SELECT * FROM follows WHERE person_id = ? ORDER BY created_at').bind(personId).all<Follow>();
  return result.results;
}

export async function createFollow(db: D1Database, data: {
  person_id: string;
  target_github?: string | null;
  target_person_id?: string | null;
  note?: string | null;
}): Promise<string> {
  const id = generateId('f');
  const ts = now();
  await db.prepare(
    `INSERT INTO follows (id, person_id, target_github, target_person_id, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(id, data.person_id, data.target_github ?? null, data.target_person_id ?? null, data.note ?? null, ts).run();
  return id;
}

// ── Sessions ────────────────────────────────────────────

export async function createSession(db: D1Database, token: string, personId: string): Promise<void> {
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
  await db.prepare(
    'INSERT INTO sessions (token, person_id, expires_at) VALUES (?, ?, ?)'
  ).bind(token, personId, expires).run();
}

export async function getSession(db: D1Database, token: string): Promise<Session | null> {
  return db.prepare(
    'SELECT * FROM sessions WHERE token = ? AND expires_at > ?'
  ).bind(token, now()).first<Session>();
}

export async function deleteSession(db: D1Database, token: string): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
}

// ── Trust Log ───────────────────────────────────────────

export async function createTrustLogEntry(db: D1Database, data: {
  from_person: string;
  to_person: string;
  flags: string;
  note?: string | null;
}): Promise<string> {
  const id = generateId('tl');
  const ts = now();
  await db.prepare(
    'INSERT INTO trust_log (id, from_person, to_person, flags, note, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, data.from_person, data.to_person, data.flags, data.note ?? null, ts).run();
  return id;
}
