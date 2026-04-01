// functions/people/[id].ts
// GET /people/:id — person profile page (HTML for browsers, redirects agents to API)
import { getPersonById, getAgentsByOwner, getToolsByPerson, getFollowsByPerson } from '../../lib/db';
import { authenticateSession } from '../../lib/auth';
import { wantsMarkdown, wrapInHtml } from '../../worker/index';

interface Env {
  DB: D1Database;
}

function profileToMarkdown(person: any, agents: any[], tools: any[], follows: any[], isOwner: boolean): string {
  let md = `# ${person.display_name || person.github_username || person.id}\n\n`;
  if (person.github_username) md += `**GitHub:** [${person.github_username}](https://github.com/${person.github_username})\n`;
  if (person.google_email && isOwner) md += `**Email:** ${person.google_email}\n`;

  const flags = [
    person.trust_code ? 'trust_code' : '',
    person.personal_connection ? 'personal_connection' : '',
  ].filter(Boolean).join(' · ');
  if (flags) md += `**Trust:** ${flags}\n`;
  md += `**Status:** ${person.status}\n`;

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

  if (isOwner) {
    md += '\n---\n\n*This is your profile. You can update it via the API or your agent.*\n';
  }

  md += `\n[Back to People](/api/people) · [Discover](/api/discover)\n`;

  return md;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const id = params.id as string;
  const person = await getPersonById(env.DB, id);

  if (!person) {
    const html = wrapInHtml('# Not Found\n\nThis person was not found on ito.md.\n\n[Back to People](/api/people)', 'Not Found');
    return new Response(html, { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  const agents = await getAgentsByOwner(env.DB, id);
  const tools = await getToolsByPerson(env.DB, id);
  const follows = await getFollowsByPerson(env.DB, id);

  // Check if viewing user is the profile owner
  const viewer = await authenticateSession(request, env.DB);
  const isOwner = viewer?.id === person.id;

  const md = profileToMarkdown(person, agents, tools, follows, isOwner);

  if (wantsMarkdown(request)) {
    return new Response(md, {
      status: 200,
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
  }

  return new Response(wrapInHtml(md, person.display_name || 'Profile'), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
};
