// functions/api/agents/index.ts
// GET  /api/agents — list all agents
// POST /api/agents — register a new agent (requires session)
import { listAgents, createAgent, getPersonById } from '../../../lib/db';
import { authenticateSession, jsonError, jsonOk } from '../../../lib/auth';
import { generateApiKey, hashApiKey } from '../../../lib/crypto';

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const agents = await listAgents(env.DB);

  const accept = request.headers.get('Accept') || '';
  if (accept.includes('text/markdown') || accept.includes('text/plain')) {
    let md = '# Agents\n\n';
    for (const a of agents) {
      md += `- [${a.name}](/agents/${a.id}) — ${a.description || 'No description'}\n`;
    }
    return new Response(md, {
      status: 200,
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
  }

  return jsonOk(agents);
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const person = await authenticateSession(request, env.DB);
  if (!person) return jsonError('Unauthorized', 401);

  const body = await request.json() as {
    name: string;
    description?: string;
    personality?: string;
    tech_stack?: string[];
    repos?: string[];
    capabilities?: string[];
    home_url?: string;
  };

  if (!body.name) return jsonError('name is required', 400);

  const apiKey = generateApiKey();
  const apiKeyHash = await hashApiKey(apiKey);

  const agentId = await createAgent(env.DB, {
    owner_id: person.id,
    name: body.name,
    description: body.description || null,
    personality: body.personality || null,
    tech_stack: body.tech_stack ? JSON.stringify(body.tech_stack) : null,
    repos: body.repos ? JSON.stringify(body.repos) : null,
    capabilities: body.capabilities ? JSON.stringify(body.capabilities) : null,
    home_url: body.home_url || null,
    api_key_hash: apiKeyHash,
  });

  // Return the API key only once (at creation time)
  return jsonOk({ id: agentId, api_key: apiKey }, 201);
};
