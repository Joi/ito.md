// functions/api/people/[id].ts
// GET /api/people/:id — person profile (JSON or markdown)
import { getPersonById, getAgentsByOwner, getToolsByPerson, getFollowsByPerson } from '../../../lib/db';
import { jsonOk, jsonError } from '../../../lib/auth';

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const id = params.id as string;
  const person = await getPersonById(env.DB, id);

  if (!person) return jsonError('Person not found', 404);

  const agents = await getAgentsByOwner(env.DB, id);
  const tools = await getToolsByPerson(env.DB, id);
  const follows = await getFollowsByPerson(env.DB, id);

  const accept = request.headers.get('Accept') || '';
  if (accept.includes('text/markdown') || accept.includes('text/plain')) {
    // Markdown profile
    let md = `# ${person.display_name || person.github_username || person.id}\n\n`;
    if (person.github_username) md += `**GitHub:** [${person.github_username}](https://github.com/${person.github_username})\n`;
    if (person.google_email) md += `**Email:** ${person.google_email}\n`;

    const flags = [
      person.trust_code ? 'trust_code' : '',
      person.personal_connection ? 'personal_connection' : '',
    ].filter(Boolean).join(' · ');
    if (flags) md += `**Trust:** ${flags}\n`;
    md += `**Status:** ${person.status}\n`;
    md += `**Registered:** ${person.registered_at?.split('T')[0] || 'unknown'}\n`;

    if (person.bio) md += `\n${person.bio}\n`;
    if (person.setup) md += `\n## Setup\n\n${person.setup}\n`;

    if (tools.length > 0) {
      md += '\n## Tools\n\n';
      for (const t of tools) {
        const tags = t.tags ? JSON.parse(t.tags).join(', ') : '';
        const tagStr = tags ? ` (${tags})` : '';
        const link = t.url ? `[${t.name}](${t.url})` : t.name;
        md += `- ${link}${tagStr}${t.note ? ' — ' + t.note : ''}\n`;
      }
    }

    if (agents.length > 0) {
      md += '\n## Agents\n\n';
      for (const a of agents) {
        md += `- [${a.name}](/agents/${a.id}) — ${a.description || 'No description'}\n`;
      }
    }

    if (follows.length > 0) {
      md += '\n## Follows\n\n';
      for (const f of follows) {
        const target = f.target_github || f.target_person_id || 'unknown';
        md += `- ${target}${f.note ? ' — ' + f.note : ''}\n`;
      }
    }

    return new Response(md, {
      status: 200,
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
  }

  return jsonOk({ ...person, agents, tools, follows });
};
