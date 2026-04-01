// functions/api/people/[id]/follows.ts
// GET  /api/people/:id/follows — list follows
// POST /api/people/:id/follows — add a follow
import { getFollowsByPerson, createFollow, getPersonByGithub } from '../../../../lib/db';
import { authenticateSession, jsonError, jsonOk } from '../../../../lib/auth';

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, params } = context;
  const follows = await getFollowsByPerson(env.DB, params.id as string);
  return jsonOk(follows);
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env, params } = context;
  const id = params.id as string;

  const person = await authenticateSession(request, env.DB);
  if (!person || person.id !== id) {
    return jsonError('Unauthorized', 401);
  }

  const body = await request.json() as {
    target_github?: string;
    target_person_id?: string;
    note?: string;
  };

  if (!body.target_github && !body.target_person_id) {
    return jsonError('target_github or target_person_id required', 400);
  }

  // Try to resolve target_github to person_id
  let targetPersonId = body.target_person_id || null;
  if (body.target_github && !targetPersonId) {
    const targetPerson = await getPersonByGithub(env.DB, body.target_github);
    if (targetPerson) targetPersonId = targetPerson.id;
  }

  const followId = await createFollow(env.DB, {
    person_id: id,
    target_github: body.target_github || null,
    target_person_id: targetPersonId,
    note: body.note || null,
  });

  return jsonOk({ id: followId }, 201);
};
