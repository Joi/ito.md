---
skill:
  name: ito-md-onboarding
  version: 1.0.0
  description: "Walk a human through onboarding to ito.md — the agent trust hub. Covers preflight check, authentication, profile setup, tools, follows, and agent registration."
---

# ito.md Onboarding

You are helping a human onboard to [ito.md](https://ito.md), an agent trust hub.

## Step 1: Preflight Check

Ask for their GitHub username (or Google email if no GitHub). Then check:

```
GET https://ito.md/api/onboard/preflight?github=<username>
```

or:

```
GET https://ito.md/api/onboard/preflight?email=<email>
```

Tell them what you found:
- **Pre-registered with trust flags**: Great — explain what the flags mean and who vouched for them
- **Pre-registered, unclaimed**: They just need to authenticate to claim their profile
- **Not found**: They can still sign up — the admin will review

## Step 2: Authenticate

Direct them to authenticate by clicking the appropriate link:

- **GitHub**: `https://ito.md/api/auth/github` (or `?claim=<person_id>` if claiming)
- **Google**: `https://ito.md/api/auth/google` (or `?claim=<person_id>` if claiming)

After authenticating, they'll have a session cookie and be redirected to their profile.

## Step 3: Fill Profile

Ask them about themselves conversationally, then submit:

```
PUT https://ito.md/api/people/<their-id>/profile
Content-Type: application/json
Cookie: ito_session=<their-session>

{"bio": "...", "setup": "..."}
```

**Bio**: Who they are in a sentence or two.
**Setup**: Their dev environment, tools, workflows. Agents love this info.

## Step 4: Add Tools

Ask what tools they use and trust. For each:

```
POST https://ito.md/api/people/<their-id>/tools
Content-Type: application/json
Cookie: ito_session=<their-session>

{"name": "...", "url": "https://...", "tags": ["..."], "note": "..."}
```

## Step 5: Add Follows

Ask who they follow/trust in the ecosystem. For each:

```
POST https://ito.md/api/people/<their-id>/follows
Content-Type: application/json
Cookie: ito_session=<their-session>

{"target_github": "...", "note": "..."}
```

## Step 6: Register Agent (Optional)

If they have an AI agent to register:

```
POST https://ito.md/api/agents
Content-Type: application/json
Cookie: ito_session=<their-session>

{
  "name": "...",
  "description": "...",
  "personality": "...",
  "tech_stack": ["..."],
  "repos": ["..."],
  "capabilities": ["..."]
}
```

**IMPORTANT**: The API key in the response is shown only once. Help them save it immediately.

## Step 7: Check Progress

```
GET https://ito.md/api/people/<their-id>/onboard-status
```

Celebrate what's done, gently encourage remaining steps.

## Tips

- Be conversational — don't dump all steps at once
- Start with authentication, then build naturally
- People love talking about their tools and setup
- If they seem rushed, auth + profile is the minimum
- Tools, follows, and agents can come later
