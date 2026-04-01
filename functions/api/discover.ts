// functions/api/discover.ts
// GET /api/discover — search people by trust flags, tools, follows
// Query params: ?flag=trust_code&tag=mcp-server&person=username&followed-by=username
import { jsonOk } from '../../lib/auth';
import { wantsMarkdown, wrapInHtml } from '../../worker/index';

interface Env {
  DB: D1Database;
}

function resultsToMarkdown(results: any[], query: Record<string, string>): string {
  const filterDesc = Object.entries(query).map(([k, v]) => `${k}=${v}`).join(', ');
  let md = `# Discover\n\n`;
  if (filterDesc) md += `**Filter:** ${filterDesc}\n\n`;
  if (results.length === 0) {
    md += `No results found.\n`;
    return md;
  }
  md += `**${results.length} result${results.length !== 1 ? 's' : ''}**\n\n`;
  for (const p of results) {
    const flags = [
      p.trust_code ? 'trust_code' : '',
      p.personal_connection ? 'personal_connection' : '',
    ].filter(Boolean).join(' · ');
    const flagStr = flags ? ` — ${flags}` : '';
    const status = p.status === 'seeded' ? ' *(unclaimed)*' : '';
    const gh = p.github_username ? ` ([${p.github_username}](https://github.com/${p.github_username}))` : '';
    md += `- [${p.display_name || p.github_username || p.id}](/people/${p.id})${gh}${flagStr}${status}\n`;
    if (p.bio) md += `  ${p.bio}\n`;
  }
  md += `\n---\n\n**Try:** [trust_code](/api/discover?flag=trust_code) · [personal_connection](/api/discover?flag=personal_connection) · [all people](/api/people)\n`;
  return md;
}

function respond(request: Request, results: any[], query: Record<string, string>, extra?: Record<string, any>) {
  const accept = request.headers.get('Accept') || '';

  if (wantsMarkdown(request)) {
    return new Response(resultsToMarkdown(results, query), {
      status: 200,
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
  }

  if (accept.includes('text/html') || accept.includes('*/*')) {
    const md = resultsToMarkdown(results, query);
    return new Response(wrapInHtml(md, 'Discover'), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  return jsonOk({ results, query, ...extra });
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);

  const flag = url.searchParams.get('flag');
  const tag = url.searchParams.get('tag');
  const person = url.searchParams.get('person');
  const followedBy = url.searchParams.get('followed-by');

  // Build query based on filters
  if (person) {
    const p = await env.DB.prepare(
      'SELECT * FROM people WHERE github_username = ? COLLATE NOCASE'
    ).bind(person).first();
    return respond(request, p ? [p] : [], { person });
  }

  if (followedBy) {
    const follower = await env.DB.prepare(
      'SELECT id FROM people WHERE github_username = ? COLLATE NOCASE'
    ).bind(followedBy).first<{ id: string }>();

    if (!follower) return respond(request, [], { 'followed-by': followedBy });

    const follows = await env.DB.prepare(
      `SELECT p.* FROM follows f
       JOIN people p ON p.id = f.target_person_id
       WHERE f.person_id = ?`
    ).bind(follower.id).all();

    return respond(request, follows.results, { 'followed-by': followedBy });
  }

  if (tag) {
    const results = await env.DB.prepare(
      `SELECT DISTINCT p.* FROM tools t
       JOIN people p ON p.id = t.person_id
       WHERE t.tags LIKE ?`
    ).bind(`%${tag}%`).all();

    return respond(request, results.results, { tag });
  }

  if (flag) {
    let sql = '';
    if (flag === 'trust_code') {
      sql = 'SELECT * FROM people WHERE trust_code = 1 ORDER BY display_name';
    } else if (flag === 'personal_connection') {
      sql = 'SELECT * FROM people WHERE personal_connection = 1 ORDER BY display_name';
    } else {
      return respond(request, [], { flag }, { error: 'Unknown flag. Use trust_code or personal_connection.' });
    }
    const results = await env.DB.prepare(sql).all();
    return respond(request, results.results, { flag });
  }

  // No filters — return all people
  const all = await env.DB.prepare('SELECT * FROM people ORDER BY display_name').all();
  return respond(request, all.results, {}, {
    hint: 'Use ?flag=trust_code, ?tag=mcp-server, ?person=username, or ?followed-by=username to filter.',
  });
};
