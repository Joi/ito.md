// functions/api/auth/github-callback.ts
// GET /api/auth/github/callback — handle GitHub OAuth callback
import { getPersonByGithub, createPerson, updatePerson, createSession } from '../../../lib/db';
import { generateSessionToken } from '../../../lib/crypto';

interface Env {
  DB: D1Database;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state') || '';

  if (!code) {
    return new Response('Missing code parameter', { status: 400 });
  }

  // Exchange code for access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
  if (!tokenData.access_token) {
    return new Response(`OAuth error: ${tokenData.error || 'unknown'}`, { status: 400 });
  }

  // Fetch GitHub user profile
  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'ito-md',
    },
  });

  const ghUser = await userRes.json() as GitHubUser;

  // Parse state for claim logic
  const isClaim = state.startsWith('claim:');
  const claimId = isClaim ? state.split(':')[1] : null;

  let person = await getPersonByGithub(env.DB, ghUser.login);

  if (claimId && person && person.id !== claimId) {
    // GitHub user already claimed a different profile
    return new Response('This GitHub account is already linked to a different profile.', { status: 409 });
  }

  if (claimId && person && person.id === claimId && person.status === 'seeded') {
    // Claiming own seeded profile — update to claimed
    await updatePerson(env.DB, claimId, {
      github_id: String(ghUser.id),
      display_name: ghUser.name || person.display_name,
      status: 'claimed',
    } as any);
  } else if (claimId && !person) {
    // Claiming a seeded profile (GitHub username not yet in DB)
    await updatePerson(env.DB, claimId, {
      github_id: String(ghUser.id),
      github_username: ghUser.login,
      display_name: ghUser.name || ghUser.login,
      status: 'claimed',
    } as any);
    person = { id: claimId } as any;
  } else if (!person) {
    // New user — create a profile
    const id = await createPerson(env.DB, {
      github_username: ghUser.login,
      display_name: ghUser.name || ghUser.login,
      status: 'claimed',
    });
    person = { id } as any;
  }

  // Create session
  const token = generateSessionToken();
  await createSession(env.DB, token, person!.id);

  // Set cookie and redirect
  const headers = new Headers();
  headers.set('Set-Cookie', `ito_session=${token}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${30 * 24 * 60 * 60}`);
  headers.set('Location', `/people/${person!.id}?welcome=1`);

  return new Response(null, { status: 302, headers });
};
