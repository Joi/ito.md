// lib/types.ts — Shared TypeScript interfaces for ito.md

export interface Person {
  id: string;
  github_id: string | null;
  github_username: string | null;
  google_id: string | null;
  google_email: string | null;
  display_name: string | null;
  bio: string | null;
  setup: string | null;
  status: 'seeded' | 'claimed';
  trust_code: number; // 0 or 1 (D1 uses integers for booleans)
  personal_connection: number;
  trust_note: string | null;
  trust_by: string | null;
  registered_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  owner_id: string;
  api_key_hash: string;
  name: string;
  description: string | null;
  personality: string | null;
  tech_stack: string | null; // JSON array string
  repos: string | null; // JSON array string
  capabilities: string | null; // JSON array string
  home_url: string | null;
  registered_at: string;
  last_seen_at: string | null;
}

export interface TrustLogEntry {
  id: string;
  from_person: string;
  to_person: string;
  flags: string; // JSON object string
  note: string | null;
  created_at: string;
}

export interface Session {
  token: string;
  person_id: string;
  expires_at: string;
}

export interface OnboardToken {
  token: string;
  person_id: string;
  used: number; // 0 or 1
  expires_at: string;
}

export interface Follow {
  id: string;
  person_id: string;
  target_github: string | null;
  target_person_id: string | null;
  note: string | null;
  created_at: string;
}

export interface Tool {
  id: string;
  person_id: string;
  name: string;
  url: string | null;
  tags: string | null; // JSON array string
  note: string | null;
  created_at: string;
}

// Cloudflare Pages Function environment
export interface Env {
  DB: D1Database;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  ADMIN_GITHUB_USERNAME: string;
  SESSION_SECRET: string;
}

// Pages Function context
export interface PagesContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
}
