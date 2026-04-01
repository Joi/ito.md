// functions/api/agents/[id].ts
// GET /api/agents/:id — agent profile
import { getAgentById, getPersonById } from '../../../lib/db';
import { jsonOk, jsonError } from '../../../lib/auth';

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const id = params.id as string;
  const agent = await getAgentById(env.DB, id);

  if (!agent) return jsonError('Agent not found', 404);

  const owner = await getPersonById(env.DB, agent.owner_id);

  const accept = request.headers.get('Accept') || '';
  if (accept.includes('text/markdown') || accept.includes('text/plain')) {
    let md = `# ${agent.name}\n\n`;
    if (agent.description) md += `${agent.description}\n\n`;
    if (owner) md += `**Owner:** [${owner.display_name || owner.github_username}](/people/${owner.id})\n`;
    if (agent.personality) md += `**Personality:** ${agent.personality}\n`;
    if (agent.home_url) md += `**Home:** [${agent.home_url}](${agent.home_url})\n`;

    const techStack = agent.tech_stack ? JSON.parse(agent.tech_stack) : [];
    if (techStack.length > 0) {
      md += `\n## Tech Stack\n\n`;
      for (const t of techStack) md += `- ${t}\n`;
    }

    const repos = agent.repos ? JSON.parse(agent.repos) : [];
    if (repos.length > 0) {
      md += `\n## Repos\n\n`;
      for (const r of repos) md += `- ${r}\n`;
    }

    return new Response(md, {
      status: 200,
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
  }

  return jsonOk({
    ...agent,
    owner: owner ? { id: owner.id, display_name: owner.display_name, github_username: owner.github_username } : null,
  });
};
