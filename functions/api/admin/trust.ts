// functions/api/admin/trust.ts
// PUT /api/admin/trust — update trust flags for a person (admin only)
import { getPersonById, updatePerson, createTrustLogEntry } from '../../../lib/db';
import { authenticateSession, isAdmin, jsonError, jsonOk } from '../../../lib/auth';

interface Env {
  DB: D1Database;
  ADMIN_GITHUB_USERNAME: string;
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const person = await authenticateSession(request, env.DB);
  if (!person || !person.github_username || !isAdmin(person.github_username, env.ADMIN_GITHUB_USERNAME)) {
    return jsonError('Admin access required', 403);
  }

  const body = await request.json() as {
    person_id: string;
    trust_code?: boolean;
    personal_connection?: boolean;
    note?: string;
  };

  if (!body.person_id) return jsonError('person_id is required', 400);

  const target = await getPersonById(env.DB, body.person_id);
  if (!target) return jsonError('Person not found', 404);

  const updates: Record<string, any> = {};
  if (body.trust_code !== undefined) updates.trust_code = body.trust_code ? 1 : 0;
  if (body.personal_connection !== undefined) updates.personal_connection = body.personal_connection ? 1 : 0;

  if (Object.keys(updates).length > 0) {
    await updatePerson(env.DB, body.person_id, updates as any);
  }

  // Log the trust change
  await createTrustLogEntry(env.DB, {
    from_person: person.id,
    to_person: body.person_id,
    flags: JSON.stringify({
      trust_code: body.trust_code ?? target.trust_code,
      personal_connection: body.personal_connection ?? target.personal_connection,
    }),
    note: body.note || null,
  });

  return jsonOk({ success: true });
};
