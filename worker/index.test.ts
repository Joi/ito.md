// worker/index.test.ts
import { describe, it, expect } from 'vitest';
import { wantsMarkdown, isLlmsTxt, markdownToHtml, wrapInHtml } from './index';

describe('content negotiation', () => {
  describe('wantsMarkdown', () => {
    it('returns true for Accept: text/markdown', () => {
      const req = new Request('https://ito.md', {
        headers: { Accept: 'text/markdown' },
      });
      expect(wantsMarkdown(req)).toBe(true);
    });

    it('returns true for Accept: text/plain', () => {
      const req = new Request('https://ito.md', {
        headers: { Accept: 'text/plain' },
      });
      expect(wantsMarkdown(req)).toBe(true);
    });

    it('returns false for Accept: text/html', () => {
      const req = new Request('https://ito.md', {
        headers: { Accept: 'text/html' },
      });
      expect(wantsMarkdown(req)).toBe(false);
    });

    it('returns false for Accept: */*', () => {
      const req = new Request('https://ito.md', {
        headers: { Accept: '*/*' },
      });
      expect(wantsMarkdown(req)).toBe(false);
    });
  });

  describe('isLlmsTxt', () => {
    it('returns true for /llms.txt', () => {
      expect(isLlmsTxt(new URL('https://ito.md/llms.txt'))).toBe(true);
    });

    it('returns true for /llms-full.txt', () => {
      expect(isLlmsTxt(new URL('https://ito.md/llms-full.txt'))).toBe(true);
    });

    it('returns false for other paths', () => {
      expect(isLlmsTxt(new URL('https://ito.md/about'))).toBe(false);
    });
  });

  describe('markdownToHtml', () => {
    it('converts headers', () => {
      expect(markdownToHtml('# Hello')).toContain('<h1>Hello</h1>');
    });

    it('converts bold text', () => {
      expect(markdownToHtml('**bold**')).toContain('<strong>bold</strong>');
    });

    it('converts links', () => {
      const html = markdownToHtml('[ito.md](https://ito.md)');
      expect(html).toContain('<a href="https://ito.md">ito.md</a>');
    });
  });

  describe('wrapInHtml', () => {
    it('wraps markdown in HTML shell with title', () => {
      const html = wrapInHtml('# Test', 'Test Page');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<title>Test Page — ito.md</title>');
      expect(html).toContain('<h1>Test</h1>');
    });
  });
});
