// functions/api/people/index.ts
// GET /api/people — list all people (JSON, markdown, or HTML)
import { listPeople } from '../../../lib/db';
import { jsonOk } from '../../../lib/auth';
import { wantsMarkdown, wrapInHtml } from '../../../worker/index';

interface Env {
  DB: D1Database;
}

function peopleToMarkdown(people: any[]): string {
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
  return md;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const people = await listPeople(env.DB);

  const accept = request.headers.get('Accept') || '';

  if (wantsMarkdown(request)) {
    return new Response(peopleToMarkdown(people), {
      status: 200,
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
  }

  if (accept.includes('text/html') || accept.includes('*/*')) {
    const md = peopleToMarkdown(people);
    return new Response(wrapInHtml(md, 'People'), {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  return jsonOk(people);
};
