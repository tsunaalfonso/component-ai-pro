# Deploying to Cloudflare

## Target

Deploy this Vite + React + TanStack Start SSR application to **Cloudflare Workers**.
It is not a static Cloudflare Pages application.

Nitro's `cloudflare-module` preset owns the Worker entry point, static-assets binding,
and generated Wrangler configuration. Do not add a root `wrangler.jsonc` with a
hand-written `main` or assets directory.

## Required pipeline

The production build creates Nitro's prebuilt output:

- `.output/server/`
- `.output/public/`
- `.output/server/wrangler.json`
- `.output/nitro.json`

Deploy that output through Nitro:

```bash
npm install
npm run deploy
```

The repository's `deploy` script intentionally expands to:

```bash
npm run build && npx nitro deploy --prebuilt
```

Do not use `npx wrangler deploy` as this project's deployment command. Nitro invokes
the appropriate Cloudflare deployment tooling using its generated prebuilt metadata.

## Cloudflare Git deployment settings

In the Cloudflare Workers repository deployment settings, configure:

- **Build command:** `npm run build`
- **Deploy command:** `npm run deploy`
- **Root directory:** `/`

The deploy script builds again by design so it is safe when run directly on a fresh
checkout. If Cloudflare offers a single command field, use only `npm run deploy`.

Changing files in the repository cannot overwrite a deployment command already saved
in the Cloudflare dashboard. Replace any existing `npx wrangler deploy` value there
with `npm run deploy`, then retry the deployment.

## Environment variables

Set these public build variables for Production and Preview:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Set these as server-only Cloudflare secrets, never as `VITE_*` variables:

- `SUPABASE_SERVICE_ROLE_KEY`
- `LOVABLE_API_KEY`

Optional server aliases are `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`; the runtime
already derives them from their public `VITE_*` counterparts when omitted.

The public `VITE_*` values must be present while `npm run build` runs. Server-only
secrets are consumed at request time by the Worker and must never be exposed to the
browser bundle.