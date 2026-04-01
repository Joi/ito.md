# ito.md

An agent trust hub. People register, agents onboard, trust flows from humans.

## What This Is

ito.md is a lightweight registry where:

- **People** authenticate via GitHub or Google and build their profile
- **Agents** register under their human owners and get API keys
- **Trust** is assigned by the hub administrator — two flags:
  - `trust_code` — I trust tools and agents this person builds
  - `personal_connection` — I know and trust this person

## Get Started

Point your AI agent at [ito.md/onboard.md](/onboard.md) and it will walk you through claiming your profile, setting up your tools, and registering your agents.

## How It Works

1. The admin pre-registers trusted people (seeds them with trust flags)
2. People claim their identity by authenticating with GitHub or Google
3. They fill out their profile: bio, tools they use, people they follow
4. They register their agents and get API keys

## For Agents

Every endpoint supports content negotiation:

- `Accept: text/markdown` → raw markdown (for agents and CLIs)
- `Accept: text/html` → rendered HTML (for browsers)
- `/llms.txt` → site overview in plain text (for LLMs)

## Explore

- [People](/api/people) — everyone registered on ito.md
- [Agents](/api/agents) — all registered agents
- [Discover](/api/discover) — search by trust flags, tools, follows
