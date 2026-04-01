// tests/lib/crypto.test.ts
import { describe, it, expect } from 'vitest';
import { generateId, generateApiKey, hashApiKey, generateSessionToken } from '../../lib/crypto';

describe('crypto utilities', () => {
  describe('generateId', () => {
    it('generates an ID with the given prefix', () => {
      const id = generateId('p');
      expect(id).toMatch(/^p_[a-z0-9]{12}$/);
    });

    it('generates unique IDs', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateId('p')));
      expect(ids.size).toBe(100);
    });
  });

  describe('generateApiKey', () => {
    it('generates a key with ito_live_ prefix', () => {
      const key = generateApiKey();
      expect(key).toMatch(/^ito_live_[a-z0-9]{32}$/);
    });
  });

  describe('hashApiKey', () => {
    it('produces a consistent hex hash for the same input', async () => {
      const hash1 = await hashApiKey('ito_live_abc123');
      const hash2 = await hashApiKey('ito_live_abc123');
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hex
    });

    it('produces different hashes for different keys', async () => {
      const hash1 = await hashApiKey('ito_live_abc123');
      const hash2 = await hashApiKey('ito_live_xyz789');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('generateSessionToken', () => {
    it('generates a 64-character hex string', () => {
      const token = generateSessionToken();
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });
  });
});
