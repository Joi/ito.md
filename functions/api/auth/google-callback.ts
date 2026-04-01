// functions/api/auth/google-callback.ts
// GET /api/auth/google/callback — handle Google OAuth callback
import { getPersonByGoogleEmail, createPerson, updatePerson, createSession, getPersonById } from '../../../lib/db';
import { generateSessionToken } from '../../../lib/crypto';

interface Env {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
}

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
}

interface GoogleUserInfo {
  sub: string;        // Google user ID
  email: string;
  name: string;
  picture?: string;
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
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${url.origin}/api/auth/google-callback`,
      grant_type: 'authorization_code',
    }),
  });

  const tokenData = await tokenRes.json() as GoogleTokenResponse;
  if (!tokenData.access_token) {
    return new Response(`OAuth error: ${tokenData.error || 'unknown'}`, { status: 400 });
  }

  // Fetch Google user info
  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  const gUser = await userRes.json() as GoogleUserInfo;

  // Parse state for claim logic
  const isClaim = state.startsWith('claim:');
  const claimId = isClaim ? state.split(':')[1] : null;

  let person = await getPersonByGoogleEmail(env.DB, gUser.email);

  if (claimId && person && person.id !== claimId) {
    return new Response('This Google account is already linked to a different profile.', { status: 409 });
  }

  if (claimId && !person) {
    // Claiming a seeded profile with Google
    await updatePerson(env.DB, claimId, {
      google_id: gUser.sub,
      google_email: gUser.email,
      display_name: gUser.name,
      status: 'claimed',
    } as any);
    person = { id: claimId } as any;
  } else if (!person) {
    // New user via Google
    const id = await createPerson(env.DB, {
      google_email: gUser.email,
      display_name: gUser.name,
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
