# Image Guardian

Reverse image search & takedown helper. Upload an image, find where it appears across the web, and prepare takedown requests — built on TanStack Start, React 19, Tailwind v4, shadcn/ui, and Lovable Cloud (Supabase).

## Tech stack

- **Framework:** TanStack Start v1 (Vite 7, React 19, SSR)
- **Styling:** Tailwind CSS v4 + shadcn/ui (Radix primitives)
- **Backend:** Lovable Cloud (Supabase) — auth + database
- **Reverse image search:** SerpAPI (Google Lens)
- **Deploy target:** Cloudflare Workers
- **Language:** TypeScript (strict)

## Prerequisites

- Node.js 20+ (works on 22/24)
- npm (or bun/pnpm)
- A [SerpAPI](https://serpapi.com) account (free tier available)

## Getting started (local)

```bash
# 1. Install dependencies
npm install

# 2. Create a .env file in the project root (see below)

# 3. Start the dev server
npm run dev
```

The app will be available at http://localhost:5173.

## Environment variables

Create a `.env` file in the project root:

```env
SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_PROJECT_ID="your-project-id"

# Required for reverse image search
SERPAPI_KEY="your-serpapi-key"
```

> The Supabase keys are auto-provisioned when you use Lovable Cloud — copy them from the connected project. The `SERPAPI_KEY` is yours; grab one at https://serpapi.com/manage-api-key.

## Available scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server with HMR |
| `npm run build` | Production build (Cloudflare Workers target) |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format the project with Prettier |

## Project structure

```
src/
  routes/              File-based routes (TanStack Router)
    __root.tsx         Root layout / HTML shell
    index.tsx          Landing page
    auth.tsx           Sign in / sign up
    dashboard.tsx      Authenticated dashboard
    api/
      reverse-image-search.ts   Server route hitting SerpAPI
  components/          App + shadcn/ui components
  lib/                 Auth context, helpers
  integrations/
    supabase/          Auto-generated Supabase client & types
  styles.css           Tailwind v4 tokens + theme
supabase/
  migrations/          Database migrations
  config.toml          Supabase project config
```

## Authentication

Email/password auth via Lovable Cloud (Supabase). The auth context lives in `src/lib/auth.tsx` and protects the `/dashboard` route.

## Deployment

The project is configured for **Cloudflare Workers** via `@cloudflare/vite-plugin` and `wrangler.jsonc`. The simplest path is to publish from Lovable (top-right **Publish** button) — it handles the build and deploy.

To deploy manually:

```bash
npm run build
npx wrangler deploy
```

Make sure your environment variables / secrets are configured in the Cloudflare dashboard (or via `wrangler secret put`).

## Notes

- **Do not edit** `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`, `src/routeTree.gen.ts`, or anything in `supabase/migrations/` — they are auto-generated.
- Routes use TanStack Router's flat dot-separated naming (e.g. `posts.$postId.tsx`).
- Styling uses Tailwind v4 tokens defined in `src/styles.css` — prefer semantic tokens over raw colors.

## License

MIT