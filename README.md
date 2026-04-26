# Shahar Bazar

Portable TanStack Start marketplace app built with React, TypeScript, Vite, Tailwind CSS, and Lovable Cloud/Supabase-compatible backend services.

## Run locally

```bash
bun install
cp .env.example .env
bun run dev
```

Open the local URL shown in the terminal.

## Build and preview

```bash
bun run build
bun run start
```

## Required environment variables

Set these on any hosting platform:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — required for server-rendered routes like sitemap generation

## Deploy on other platforms

### Vercel / Netlify

1. Connect this repository.
2. Install command: `bun install`
3. Build command: `bun run build`
4. Add the environment variables above.
5. Deploy.

### Cloudflare Workers / Pages

This project includes `wrangler.jsonc` for Worker-style deployment.

```bash
bun run build
bunx wrangler deploy
```

## Notes

- The frontend can be hosted anywhere that supports modern React/Vite apps.
- Database, auth, realtime chat, storage, and server-side data still need the connected backend variables.
- Do not commit real secret values. Use your hosting provider's environment variable settings.