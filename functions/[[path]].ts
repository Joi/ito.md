// functions/[[path]].ts — Catch-all Cloudflare Pages Function
// Handles content negotiation: browsers get HTML, agents get markdown

import type { Env } from '../lib/types';
import { wantsMarkdown, isLlmsTxt, wrapInHtml } from '../worker/index';

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  // llms.txt always gets plain text
  if (isLlmsTxt(url)) {
    const asset = await env.ASSETS.fetch(request);
    if (asset.ok) {
      return new Response(await asset.text(), {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
  }

  // Try to fetch the static asset
  const asset = await env.ASSETS.fetch(request);

  // If the asset is markdown and the client wants HTML, wrap it
  const contentType = asset.headers.get('Content-Type') || '';
  if (asset.ok && contentType.includes('text/markdown') && !wantsMarkdown(request)) {
    const markdown = await asset.text();
    // Extract title from first # heading
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : 'ito.md';
    const html = wrapInHtml(markdown, title);
    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  return asset;
};
