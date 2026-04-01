// functions/api/discover.ts
// GET /api/discover — search people by trust flags, tools, follows
// Query params: ?flag=trust_code&tag=mcp-server&person=username&followed-by=username
import { jsonOk } from '../../lib/auth';

interface Env {
  DB: D1Database;
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
    // Specific person by GitHub username
    const p = await env.DB.prepare(
      'SELECT * FROM people WHERE github_username = ? COLLATE NOCASE'
    ).bind(person).first();
    if (!p) return jsonOk({ results: [], query: { person } });
    return jsonOk({ results: [p], query: { person } });
  }

  if (followedBy) {
    // People followed by a specific person
    const follower = await env.DB.prepare(
      'SELECT id FROM people WHERE github_username = ? COLLATE NOCASE'
    ).bind(followedBy).first<{ id: string }>();

    if (!follower) return jsonOk({ results: [], query: { 'followed-by': followedBy } });

    const follows = await env.DB.prepare(
      `SELECT p.* FROM follows f
       JOIN people p ON p.id = f.target_person_id
       WHERE f.person_id = ?`
    ).bind(follower.id).all();

    return jsonOk({ results: follows.results, query: { 'followed-by': followedBy } });
  }

  if (tag) {
    // People who use tools with a specific tag
    const results = await env.DB.prepare(
      `SELECT DISTINCT p.* FROM tools t
       JOIN people p ON p.id = t.person_id
       WHERE t.tags LIKE ?`
    ).bind(`%${tag}%`).all();

    return jsonOk({ results: results.results, query: { tag } });
  }

  if (flag) {
    // People with a specific trust flag
    let sql = '';
    if (flag === 'trust_code') {
      sql = 'SELECT * FROM people WHERE trust_code = 1 ORDER BY display_name';
    } else if (flag === 'personal_connection') {
      sql = 'SELECT * FROM people WHERE personal_connection = 1 ORDER BY display_name';
    } else {
      return jsonOk({ results: [], query: { flag }, error: 'Unknown flag. Use trust_code or personal_connection.' });
    }
    const results = await env.DB.prepare(sql).all();
    return jsonOk({ results: results.results, query: { flag } });
  }

  // No filters — return all people
  const all = await env.DB.prepare('SELECT * FROM people ORDER BY display_name').all();
  return jsonOk({
    results: all.results,
    query: {},
    hint: 'Use ?flag=trust_code, ?tag=mcp-server, ?person=username, or ?followed-by=username to filter.',
  });
};
