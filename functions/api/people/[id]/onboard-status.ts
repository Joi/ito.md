// functions/api/people/[id]/onboard-status.ts
// GET /api/people/:id/onboard-status — check onboarding completeness
import { getPersonById, getAgentsByOwner, getToolsByPerson, getFollowsByPerson } from '../../../../lib/db';
import { jsonOk, jsonError } from '../../../../lib/auth';

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, params } = context;
  const id = params.id as string;
  const person = await getPersonById(env.DB, id);
  if (!person) return jsonError('Person not found', 404);

  const agents = await getAgentsByOwner(env.DB, id);
  const tools = await getToolsByPerson(env.DB, id);
  const follows = await getFollowsByPerson(env.DB, id);

  const steps = {
    claimed: person.status === 'claimed',
    has_bio: Boolean(person.bio),
    has_setup: Boolean(person.setup),
    has_tools: tools.length > 0,
    has_follows: follows.length > 0,
    has_agent: agents.length > 0,
  };

  const total = Object.keys(steps).length;
  const done = Object.values(steps).filter(Boolean).length;

  return jsonOk({
    person_id: id,
    progress: `${done}/${total}`,
    steps,
    complete: done === total,
  });
};
