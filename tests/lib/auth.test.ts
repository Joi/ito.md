// tests/lib/auth.test.ts
import { describe, it, expect } from 'vitest';
import { extractSessionToken, extractBearerToken, isAdmin } from '../../lib/auth';

describe('auth utilities', () => {
  describe('extractSessionToken', () => {
    it('extracts token from ito_session cookie', () => {
      const request = new Request('https://ito.md', {
        headers: { Cookie: 'ito_session=abc123; other=xyz' },
      });
      expect(extractSessionToken(request)).toBe('abc123');
    });

    it('returns null when no cookie header', () => {
      const request = new Request('https://ito.md');
      expect(extractSessionToken(request)).toBeNull();
    });

    it('returns null when ito_session cookie missing', () => {
      const request = new Request('https://ito.md', {
        headers: { Cookie: 'other=xyz' },
      });
      expect(extractSessionToken(request)).toBeNull();
    });
  });

  describe('extractBearerToken', () => {
    it('extracts token from Authorization header', () => {
      const request = new Request('https://ito.md', {
        headers: { Authorization: 'Bearer ito_live_token123' },
      });
      expect(extractBearerToken(request)).toBe('ito_live_token123');
    });

    it('returns null when no Authorization header', () => {
      const request = new Request('https://ito.md');
      expect(extractBearerToken(request)).toBeNull();
    });

    it('returns null when header is not Bearer', () => {
      const request = new Request('https://ito.md', {
        headers: { Authorization: 'Basic abc123' },
      });
      expect(extractBearerToken(request)).toBeNull();
    });
  });

  describe('isAdmin', () => {
    it('returns true for matching username (case-insensitive)', () => {
      expect(isAdmin('Joi', 'joi')).toBe(true);
      expect(isAdmin('joi', 'Joi')).toBe(true);
    });

    it('returns false for non-matching username', () => {
      expect(isAdmin('notjoi', 'Joi')).toBe(false);
    });
  });
});
