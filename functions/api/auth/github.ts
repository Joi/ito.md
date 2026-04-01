// functions/api/auth/github.ts
// GET /api/auth/github — redirect to GitHub OAuth
// Optional: ?claim=<person_id> to claim a seeded profile

interface Env {
  GITHUB_CLIENT_ID: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const claimId = url.searchParams.get('claim') || '';

  const redirectUri = `${url.origin}/api/auth/github-callback`;
  const state = claimId ? `claim:${claimId}` : 'login';

  const githubUrl = new URL('https://github.com/login/oauth/authorize');
  githubUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
  githubUrl.searchParams.set('redirect_uri', redirectUri);
  githubUrl.searchParams.set('scope', 'read:user user:email');
  githubUrl.searchParams.set('state', state);

  return Response.redirect(githubUrl.toString(), 302);
};
