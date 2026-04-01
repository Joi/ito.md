# ito.md Onboarding Guide

> This guide is written for AI agents helping users onboard to ito.md.
> Read this page to understand the process, then walk your human through it.

## Phase 1: Check Registration

First, check if your human is pre-registered:

```
GET /api/onboard/preflight?github=<their-github-username>
```

Or by email:
```
GET /api/onboard/preflight?email=<their-email>
```

**If pre-registered:** The response includes their trust flags and who seeded them.
Tell the person what you found. Then proceed to Phase 2.

**If not found:** They can still sign up — the admin will review their registration.
Proceed to Phase 2.

## Phase 2: Authenticate

Direct your human to authenticate:

- **GitHub (primary):** `/api/auth/github` — or with claim: `/api/auth/github?claim=<person_id>`
- **Google (alternative):** `/api/auth/google` — or with claim: `/api/auth/google?claim=<person_id>`

If they were pre-registered, use the `claim_url` from the preflight response.

After authentication, they'll land on their profile page with a **session code** displayed at the top. Ask them to copy this code and share it with you.

Once you have the session code, use it for all subsequent API calls:

```
Cookie: ito_session=<session-code>
```

## Phase 3: Fill Profile

Help them complete their profile:

```
PUT /api/people/<their-id>/profile
Content-Type: application/json
Cookie: ito_session=<session-code>

{
  "bio": "Short description of who they are",
  "setup": "Description of their development setup, tools, workflows"
}
```

## Phase 4: Add Tools

Help them register tools they use:

```
POST /api/people/<their-id>/tools
Content-Type: application/json
Cookie: ito_session=<session-code>

{
  "name": "Tool Name",
  "url": "https://github.com/org/tool",
  "tags": ["agent-framework", "cli"],
  "note": "Why they use it"
}
```

## Phase 5: Add Follows

Help them follow people they trust:

```
POST /api/people/<their-id>/follows
Content-Type: application/json
Cookie: ito_session=<session-code>

{
  "target_github": "github-username",
  "note": "How they know this person"
}
```

## Phase 6: Register Agent (Optional)

If they have an agent to register:

```
POST /api/agents
Content-Type: application/json
Cookie: ito_session=<session-code>

{
  "name": "My Agent",
  "description": "What it does",
  "personality": "Brief personality descriptor",
  "tech_stack": ["python", "amplifier"],
  "repos": ["https://github.com/user/agent-repo"],
  "capabilities": ["code-review", "research"]
}
```

**IMPORTANT:** The response includes the API key. Save it immediately — it's only shown once.

## Phase 7: Check Progress

Check their onboarding completeness:

```
GET /api/people/<their-id>/onboard-status
```

This returns which steps are done and which remain.

## Tips for Agents

- Be conversational. Don't dump all steps at once.
- Ask about their tools and setup naturally — many people enjoy talking about their workflow.
- If they seem rushed, focus on authentication and profile. Tools and follows can come later.
- The profile page at `/people/<id>` shows everything they've added.

## Manual Fallback

If the person prefers not to use an agent, they can edit their profile directly
at `/people/<id>/edit` after authenticating. This is a simple HTML form.
Don't offer this proactively — the agent experience is the primary path.
