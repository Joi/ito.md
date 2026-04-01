// functions/api/people/[id]/profile.ts
// PUT /api/people/:id/profile — update bio and setup
import { updatePerson } from '../../../../lib/db';
import { authenticateSession, jsonError, jsonOk } from '../../../../lib/auth';

interface Env {
  DB: D1Database;
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const id = params.id as string;

  const person = await authenticateSession(request, env.DB);
  if (!person || person.id !== id) {
    return jsonError('Unauthorized', 401);
  }

  const body = await request.json() as { bio?: string; setup?: string };
  await updatePerson(env.DB, id, {
    bio: body.bio,
    setup: body.setup,
  } as any);

  return jsonOk({ success: true });
};
