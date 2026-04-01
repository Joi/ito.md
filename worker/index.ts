// worker/index.ts — Content negotiation handler for ito.md
// Wraps markdown content in HTML shell for browsers, serves raw markdown for agents

import type { Env } from '../lib/types';

const SITE_NAME = 'ito.md';

/** Check if request wants markdown (agent/CLI) or HTML (browser) */
export function wantsMarkdown(request: Request): boolean {
  const accept = request.headers.get('Accept') || '';
  // curl sends */* but also has no text/html
  // Explicit markdown or plain text requests
  if (accept.includes('text/markdown') || accept.includes('text/plain')) return true;
  // If no HTML wanted, serve markdown
  if (!accept.includes('text/html') && !accept.includes('*/*')) return true;
  return false;
}

/** Check if this is an llms.txt request */
export function isLlmsTxt(url: URL): boolean {
  return url.pathname === '/llms.txt' || url.pathname === '/llms-full.txt';
}

/** Wrap markdown in HTML shell */
export function wrapInHtml(markdown: string, title: string, cssPath = '/style.css'): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} — ${SITE_NAME}</title>
  <link rel="stylesheet" href="${cssPath}">
</head>
<body>
  <main id="content">
    ${markdownToHtml(markdown)}
  </main>
</body>
</html>`;
}

/** Simple markdown to HTML (inline — no dependency needed for basic formatting) */
export function markdownToHtml(md: string): string {
  let html = md;
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  // Lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);
  // Paragraphs (double newlines)
  html = html.replace(/\n\n+/g, '\n</p><p>\n');
  html = `<p>${html}</p>`;
  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p>\s*(<h[123]>)/g, '$1');
  html = html.replace(/(<\/h[123]>)\s*<\/p>/g, '$1');
  html = html.replace(/<p>\s*(<ul>)/g, '$1');
  html = html.replace(/(<\/ul>)\s*<\/p>/g, '$1');
  return html;
}
