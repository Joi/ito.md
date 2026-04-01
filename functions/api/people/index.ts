// functions/api/people/index.ts
// GET /api/people — list all people (JSON or markdown)
import { listPeople } from '../../../lib/db';
import { jsonOk } from '../../../lib/auth';

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const people = await listPeople(env.DB);

  const accept = request.headers.get('Accept') || '';
  if (accept.includes('text/markdown') || accept.includes('text/plain')) {
    // Markdown response for agents
    let md = '# People\n\n';
    for (const p of people) {
      const flags = [
        p.trust_code ? 'trust_code' : '',
        p.personal_connection ? 'personal_connection' : '',
      ].filter(Boolean).join(' · ');
      const flagStr = flags ? ` — ${flags}` : '';
      const status = p.status === 'seeded' ? ' *(unclaimed)*' : '';
      md += `- [${p.display_name || p.github_username || p.id}](/people/${p.id})${flagStr}${status}\n`;
    }
    return new Response(md, {
      status: 200,
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
  }

  return jsonOk(people);
};
