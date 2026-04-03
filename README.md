# linkedin-post-discovery-mcp

**LinkedIn post discovery/search MCP for recruiting, lead generation, and market research.**

A thin, open-source MCP server that wraps your existing upstream providers:

- **RapidAPI**: LinkedIn Posts Search API
- **Apify**: `sandhive/linkedin-posts-parser`

## Why this exists

This repo is for **distribution in MCP/agent ecosystems** (OpenClaw-style, general MCP clients, and easy adaptation to Eliza-like usage), not a new monetization layer.

### Important billing model

- Billing and metering stay upstream.
- If `provider=rapidapi`, usage is billed by your RapidAPI plan.
- If `provider=apify`, usage is billed by your Apify account.
- No proxy billing, no hidden credentials, no credential sharing.

## Features

- Canonical MCP interface with provider abstraction (`rapidapi` or `apify`).
- Main tool: `search_linkedin_posts`.
- Optional convenience tools:
  - `find_hiring_posts`
  - `find_fresh_low_competition_posts`
  - `find_high_engagement_posts`
- Shared normalized filter schema and normalized result fields.
- Strong runtime validation with `zod`.
- Retry for transient upstream failures only.

## Normalized input schema

```json
{
  "query": "string, optional",
  "isHiring": "boolean, optional, default false",
  "hasLink": "boolean, optional, default false",
  "minLikes": "integer, optional",
  "maxComments": "integer, optional",
  "postedWithinHours": "integer, optional",
  "authorType": "person | company | any, optional, default any",
  "sortBy": "newest | top | hot, optional, default newest",
  "limit": "integer 1..100, optional, default 25"
}
```

## Normalized output fields

- `postKey`
- `text`
- `author`
- `authorUrl`
- `authorType`
- `createdAt`
- `geo`
- `likes`
- `commentsCount`
- `hasLink`
- `isHiring`
- `postUrl` (if available)

## Setup

### 1) Install

```bash
npm install
```

### 2) Configure env

```bash
cp .env.example .env
```

Choose exactly one provider by setting:

- `PROVIDER=rapidapi` OR
- `PROVIDER=apify`

#### Required env vars by provider

**RapidAPI mode**
- `RAPIDAPI_KEY`
- `RAPIDAPI_HOST`
- Optional: `RAPIDAPI_BASE_URL`

**Apify mode**
- `APIFY_TOKEN`
- Optional: `APIFY_BASE_URL` (default `https://api.apify.com/v2`)
- Optional: `APIFY_ACTOR_ID` (default `sandhive/linkedin-posts-parser`)

### 3) Run MCP server (stdio)

```bash
npm run dev
```

or

```bash
npm run build && npm start
```

## MCP config examples

See `examples/mcp/`:

1. `rapidapi.json` - remote MCP with env placeholders
2. `apify-hosted.json` - hosted MCP via Bearer token header
3. `apify-local.json` - local stdio server

## Quickstart workflows (prompt ideas)

- Find recent hiring posts about product management in the US.
- Find AI posts with links from people, not companies.
- Find low-comment startup fundraising posts from the last 24 hours.
- Find high-engagement GTM posts.

More examples: `examples/prompts.md`.

## Tool reference

### `search_linkedin_posts`
The primary normalized interface for both providers.

### `find_hiring_posts`
Thin preset over `search_linkedin_posts` with `isHiring=true`.

### `find_fresh_low_competition_posts`
Thin preset with defaults:
- `postedWithinHours=24`
- `maxComments=10`
- `sortBy=newest`

### `find_high_engagement_posts`
Thin preset with defaults:
- `minLikes=100`
- `sortBy=top`

## Security notes

- BYO credentials only; never commit real secrets.
- Rotate any credential that was ever exposed.
- Debug logging masks secrets.
- This project does not store user data, implement accounts, or process billing.

## Limitations

- Normalization is best-effort across provider payload differences.
- Some fields (like `postUrl`, `geo`, or exact `authorType`) depend on upstream completeness.
- RapidAPI endpoint path may vary by listing version; adjust `RAPIDAPI_BASE_URL` / provider file if needed.

## Development notes

Code layout:

- `src/providers/rapidapi.ts`
- `src/providers/apify.ts`
- `src/normalize.ts`
- `src/tools/searchLinkedinPosts.ts`
- `src/tools/presets.ts`
- `src/config.ts`
- `src/index.ts`

No database. No user accounts. No billing layer.
