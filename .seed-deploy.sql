-- ito.md D1 Schema
-- Trust flags: trust_code, personal_connection (two-flag model)
-- Status: 'seeded' (pre-populated, unclaimed) or 'claimed' (authenticated)

CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY,
  github_id TEXT UNIQUE,
  github_username TEXT,
  google_id TEXT,
  google_email TEXT,
  display_name TEXT,
  bio TEXT,
  setup TEXT,
  status TEXT DEFAULT 'seeded',
  trust_code INTEGER DEFAULT 0,
  personal_connection INTEGER DEFAULT 0,
  trust_note TEXT,
  trust_by TEXT,
  registered_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  owner_id TEXT REFERENCES people(id),
  api_key_hash TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  personality TEXT,
  tech_stack TEXT,
  repos TEXT,
  capabilities TEXT,
  home_url TEXT,
  registered_at TEXT,
  last_seen_at TEXT
);

CREATE TABLE IF NOT EXISTS trust_log (
  id TEXT PRIMARY KEY,
  from_person TEXT REFERENCES people(id),
  to_person TEXT REFERENCES people(id),
  flags TEXT,
  note TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  person_id TEXT REFERENCES people(id),
  expires_at TEXT
);

CREATE TABLE IF NOT EXISTS onboard_tokens (
  token TEXT PRIMARY KEY,
  person_id TEXT REFERENCES people(id),
  used INTEGER DEFAULT 0,
  expires_at TEXT
);

CREATE TABLE IF NOT EXISTS follows (
  id TEXT PRIMARY KEY,
  person_id TEXT REFERENCES people(id),
  target_github TEXT,
  target_person_id TEXT REFERENCES people(id),
  note TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS tools (
  id TEXT PRIMARY KEY,
  person_id TEXT REFERENCES people(id),
  name TEXT NOT NULL,
  url TEXT,
  tags TEXT,
  note TEXT,
  created_at TEXT
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_people_github ON people(github_username);
CREATE INDEX IF NOT EXISTS idx_people_status ON people(status);
CREATE INDEX IF NOT EXISTS idx_people_trust_code ON people(trust_code);
CREATE INDEX IF NOT EXISTS idx_people_personal_connection ON people(personal_connection);
CREATE INDEX IF NOT EXISTS idx_agents_owner ON agents(owner_id);
CREATE INDEX IF NOT EXISTS idx_follows_person ON follows(person_id);
CREATE INDEX IF NOT EXISTS idx_follows_target ON follows(target_person_id);
CREATE INDEX IF NOT EXISTS idx_tools_person ON tools(person_id);
CREATE INDEX IF NOT EXISTS idx_sessions_person ON sessions(person_id);


INSERT OR IGNORE INTO people (id, github_username, google_email, display_name, status, trust_code, personal_connection, trust_note, trust_by, registered_at, updated_at)
VALUES ('p_uxsh6166bhgw', 'Joi', NULL, 'Joi Ito', 'seeded', 1, 1, 'Hub admin', 'seed-cli', '2026-04-01T04:17:17.807Z', '2026-04-01T04:17:17.807Z');

INSERT OR IGNORE INTO people (id, github_username, google_email, display_name, status, trust_code, personal_connection, trust_note, trust_by, registered_at, updated_at)
VALUES ('p_gynhxpktcjes', 'harperreed', NULL, 'Harper Reed', 'seeded', 1, 1, 'Long-time friend and collaborator', 'seed-cli', '2026-04-01T04:17:17.807Z', '2026-04-01T04:17:17.807Z');

INSERT OR IGNORE INTO people (id, github_username, google_email, display_name, status, trust_code, personal_connection, trust_note, trust_by, registered_at, updated_at)
VALUES ('p_5lozgcnvblqu', 'nraford7', NULL, 'Noah Raford', 'seeded', 1, 1, 'Trusted collaborator', 'seed-cli', '2026-04-01T04:17:17.807Z', '2026-04-01T04:17:17.807Z');