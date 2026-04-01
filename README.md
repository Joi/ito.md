# ito.md

An agent trust hub. People register, agents onboard, trust flows from humans.

## What is this?

ito.md is a lightweight registry where:

- **People** authenticate via GitHub or Google and build their profiles
- **Agents** register under their human owners and get API keys
- **Trust** is assigned by the hub admin via two flags:
  - `trust_code` — I trust tools and agents this person builds
  - `personal_connection` — I know and trust this person

## Architecture

- **Cloudflare Pages** — static content + serverless functions
- **D1** — SQLite database at the edge
- **Content negotiation** — browsers get HTML, agents get markdown, APIs return JSON
- **Agent-first onboarding** — designed for AI agents to walk humans through registration

## Quick Start

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Run tests
npm test

# Deploy
npm run deploy
```

## Setup

1. Create a D1 database: `npx wrangler d1 create ito-md-db`
2. Update `wrangler.toml` with the database ID
3. Run the schema: `npx wrangler d1 execute ito-md-db --file=schema/001-init.sql`
4. Set secrets:
   ```bash
   npx wrangler pages secret put GITHUB_CLIENT_ID
   npx wrangler pages secret put GITHUB_CLIENT_SECRET
   npx wrangler pages secret put GOOGLE_CLIENT_ID
   npx wrangler pages secret put GOOGLE_CLIENT_SECRET
   npx wrangler pages secret put ADMIN_GITHUB_USERNAME
   npx wrangler pages secret put SESSION_SECRET
   ```
5. Populate seed data: `./scripts/seed deploy`
6. Deploy: `npm run deploy`

## Seed Data

Pre-populate trusted people:

```bash
./scripts/seed add --github harperreed --name "Harper Reed" --trust-code --personal-connection --note "Long-time friend and collaborator"
./scripts/seed list
./scripts/seed deploy
```

## API

All endpoints support content negotiation:
- `Accept: text/markdown` — raw markdown (agents, CLIs)
- `Accept: text/html` — rendered HTML (browsers)
- `Accept: application/json` — JSON

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/people` | List all people |
| GET | `/api/people/:id` | Person profile (tools, agents, follows) |
| PUT | `/api/people/:id/profile` | Update bio/setup (auth required) |
| POST | `/api/people/:id/tools` | Add a tool (auth required) |
| POST | `/api/people/:id/follows` | Follow someone (auth required) |
| GET | `/api/agents` | List all agents |
| GET | `/api/agents/:id` | Agent profile |
| POST | `/api/agents` | Register agent (auth required) |
| PUT | `/api/admin/trust` | Update trust flags (admin only) |
| GET | `/api/onboard/preflight` | Check if pre-registered |
| GET | `/api/discover` | Search by trust, tools, follows |
| GET | `/api/auth/github` | GitHub OAuth |
| GET | `/api/auth/google` | Google OAuth |

## License

MIT
