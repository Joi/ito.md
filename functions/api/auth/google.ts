// functions/api/auth/google.ts
// GET /api/auth/google — redirect to Google OAuth
// Optional: ?claim=<person_id> to claim a seeded profile

interface Env {
  GOOGLE_CLIENT_ID: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const claimId = url.searchParams.get('claim') || '';

  const redirectUri = `${url.origin}/api/auth/google-callback`;
  const state = claimId ? `claim:${claimId}` : 'login';

  const googleUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  googleUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
  googleUrl.searchParams.set('redirect_uri', redirectUri);
  googleUrl.searchParams.set('response_type', 'code');
  googleUrl.searchParams.set('scope', 'openid email profile');
  googleUrl.searchParams.set('state', state);

  return Response.redirect(googleUrl.toString(), 302);
};
