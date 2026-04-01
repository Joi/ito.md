// tests/lib/db.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getPersonById,
  getPersonByGithub,
  listPeople,
  createPerson,
  updatePerson,
  getAgentById,
  getAgentsByOwner,
  listAgents,
  createAgent,
  getToolsByPerson,
  createTool,
  getFollowsByPerson,
  createFollow,
  createSession,
  getSession,
  deleteSession,
} from '../../lib/db';

// Mock D1 database
function createMockDB() {
  const results: Record<string, any[]> = {};
  return {
    prepare: vi.fn((sql: string) => ({
      bind: vi.fn((...args: any[]) => ({
        first: vi.fn(async () => results[sql]?.[0] ?? null),
        all: vi.fn(async () => ({ results: results[sql] ?? [] })),
        run: vi.fn(async () => ({ success: true })),
      })),
      first: vi.fn(async () => results[sql]?.[0] ?? null),
      all: vi.fn(async () => ({ results: results[sql] ?? [] })),
      run: vi.fn(async () => ({ success: true })),
    })),
    _setResults: (sql: string, data: any[]) => { results[sql] = data; },
  };
}

describe('db helpers', () => {
  let db: ReturnType<typeof createMockDB>;

  beforeEach(() => {
    db = createMockDB();
  });

  describe('createPerson', () => {
    it('calls prepare with INSERT and returns person id', async () => {
      const id = await createPerson(db as any, {
        github_username: 'testuser',
        display_name: 'Test User',
        status: 'seeded',
        trust_code: 1,
        personal_connection: 0,
        trust_note: 'test',
        trust_by: 'p_admin123456',
      });
      expect(id).toMatch(/^p_/);
      expect(db.prepare).toHaveBeenCalled();
      const sql = db.prepare.mock.calls[0][0];
      expect(sql).toContain('INSERT INTO people');
    });
  });

  describe('getPersonById', () => {
    it('calls prepare with SELECT by id', async () => {
      await getPersonById(db as any, 'p_abc123456789');
      expect(db.prepare).toHaveBeenCalled();
      const sql = db.prepare.mock.calls[0][0];
      expect(sql).toContain('SELECT');
      expect(sql).toContain('people');
    });
  });

  describe('getPersonByGithub', () => {
    it('queries by github_username', async () => {
      await getPersonByGithub(db as any, 'testuser');
      expect(db.prepare).toHaveBeenCalled();
      const sql = db.prepare.mock.calls[0][0];
      expect(sql).toContain('github_username');
    });
  });

  describe('listPeople', () => {
    it('queries all people', async () => {
      await listPeople(db as any);
      expect(db.prepare).toHaveBeenCalled();
    });
  });

  describe('createAgent', () => {
    it('calls INSERT with agent data', async () => {
      const result = await createAgent(db as any, {
        owner_id: 'p_abc123456789',
        name: 'test-agent',
        description: 'A test agent',
        api_key_hash: 'fakehash',
      });
      expect(result).toMatch(/^a_/);
      const sql = db.prepare.mock.calls[0][0];
      expect(sql).toContain('INSERT INTO agents');
    });
  });

  describe('createTool', () => {
    it('calls INSERT with tool data', async () => {
      const result = await createTool(db as any, {
        person_id: 'p_abc123456789',
        name: 'Amplifier',
        url: 'https://github.com/microsoft/amplifier',
        tags: JSON.stringify(['agent-framework', 'cli']),
        note: 'Runs everything',
      });
      expect(result).toMatch(/^t_/);
      const sql = db.prepare.mock.calls[0][0];
      expect(sql).toContain('INSERT INTO tools');
    });
  });

  describe('createFollow', () => {
    it('calls INSERT with follow data', async () => {
      const result = await createFollow(db as any, {
        person_id: 'p_abc123456789',
        target_github: 'Joi',
        note: 'The founder',
      });
      expect(result).toMatch(/^f_/);
      const sql = db.prepare.mock.calls[0][0];
      expect(sql).toContain('INSERT INTO follows');
    });
  });

  describe('sessions', () => {
    it('createSession inserts a session', async () => {
      await createSession(db as any, 'token123', 'p_abc123456789');
      const sql = db.prepare.mock.calls[0][0];
      expect(sql).toContain('INSERT INTO sessions');
    });

    it('getSession queries by token', async () => {
      await getSession(db as any, 'token123');
      const sql = db.prepare.mock.calls[0][0];
      expect(sql).toContain('sessions');
    });

    it('deleteSession removes by token', async () => {
      await deleteSession(db as any, 'token123');
      const sql = db.prepare.mock.calls[0][0];
      expect(sql).toContain('DELETE');
    });
  });
});
