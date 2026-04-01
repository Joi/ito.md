// functions/api/onboard/preflight.ts
// GET /api/onboard/preflight?github=username — check if pre-registered
import { getPersonByGithub, getPersonByGoogleEmail } from '../../../lib/db';
import { jsonOk, jsonError } from '../../../lib/auth';

interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const github = url.searchParams.get('github');
  const email = url.searchParams.get('email');

  if (!github && !email) {
    return jsonError('Provide ?github=username or ?email=address', 400);
  }

  let person = null;
  if (github) {
    person = await getPersonByGithub(env.DB, github);
  } else if (email) {
    person = await getPersonByGoogleEmail(env.DB, email);
  }

  if (!person) {
    return jsonOk({
      found: false,
      message: 'Not pre-registered. You can still sign up — the admin will review your registration.',
    });
  }

  const flags = {
    trust_code: Boolean(person.trust_code),
    personal_connection: Boolean(person.personal_connection),
  };

  return jsonOk({
    found: true,
    person_id: person.id,
    status: person.status,
    display_name: person.display_name,
    trust_flags: flags,
    trust_note: person.trust_note,
    trust_by: person.trust_by,
    claim_url: person.status === 'seeded'
      ? (github ? `/api/auth/github?claim=${person.id}` : `/api/auth/google?claim=${person.id}`)
      : null,
    message: person.status === 'seeded'
      ? `Welcome! You've been pre-registered by ${person.trust_by || 'the admin'}. Authenticate to claim your profile.`
      : 'You\'ve already claimed your profile. You\'re all set!',
  });
};
