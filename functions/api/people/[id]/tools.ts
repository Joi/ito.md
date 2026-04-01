// functions/api/people/[id]/tools.ts
// GET  /api/people/:id/tools — list tools
// POST /api/people/:id/tools — add a tool
import { getToolsByPerson, createTool } from '../../../../lib/db';
import { authenticateSession, jsonError, jsonOk } from '../../../../lib/auth';

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, params } = context;
  const tools = await getToolsByPerson(env.DB, params.id as string);
  return jsonOk(tools);
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const id = params.id as string;

  const person = await authenticateSession(request, env.DB);
  if (!person || person.id !== id) {
    return jsonError('Unauthorized', 401);
  }

  const body = await request.json() as {
    name: string;
    url?: string;
    tags?: string[];
    note?: string;
  };

  if (!body.name) return jsonError('name is required', 400);

  const toolId = await createTool(env.DB, {
    person_id: id,
    name: body.name,
    url: body.url || null,
    tags: body.tags ? JSON.stringify(body.tags) : null,
    note: body.note || null,
  });

  return jsonOk({ id: toolId }, 201);
};
