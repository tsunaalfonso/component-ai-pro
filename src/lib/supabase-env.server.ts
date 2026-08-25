/**
 * Server-side Supabase env normalization.
 *
 * Runtimes differ in how they hand configuration to the server:
 *  - Locally / inside Lovable: `process.env` already holds SUPABASE_URL and
 *    SUPABASE_PUBLISHABLE_KEY.
 *  - Cloudflare Workers: variables and secrets are *request-scoped bindings*
 *    passed as the `env` argument to `fetch()`. At global scope `process.env`
 *    can be empty, so we mirror the bindings into `process.env` on every
 *    request, before the SSR handler (and any Supabase client factory) runs.
 *  - Any host where only the Vite-prefixed public variables are configured:
 *    those are inlined at build time and used as a last-resort fallback.
 *
 * Only public (publishable/anon) values are ever mirrored from VITE_ names.
 * Server-only secrets (SUPABASE_SERVICE_ROLE_KEY, LOVABLE_API_KEY, ...) are
 * read exclusively from real runtime bindings and never from VITE_ values.
 */

/** Public values that may be inlined at build time by Vite. */
const PUBLIC_ENV_FALLBACKS: Array<[serverName: string, value: string | undefined]> = [
  ["SUPABASE_URL", import.meta.env["VITE_SUPABASE_URL"] as string | undefined],
  [
    "SUPABASE_PUBLISHABLE_KEY",
    (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
      import.meta.env["VITE_SUPABASE_ANON_KEY"]) as string | undefined,
  ],
  ["SUPABASE_PROJECT_ID", import.meta.env["VITE_SUPABASE_PROJECT_ID"] as string | undefined],
];

/** Names we copy out of the Cloudflare `env` bindings object into process.env. */
const RUNTIME_ENV_KEYS = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_ANON_KEY",
  "SUPABASE_PROJECT_ID",
  "SUPABASE_SERVICE_ROLE_KEY",
  "LOVABLE_API_KEY",
  "LOVABLE_CRON_SECRET",
  "LOVABLE_CRON_SECRET_PREVIOUS",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "VITE_SUPABASE_ANON_KEY",
  "VITE_SUPABASE_PROJECT_ID",
] as const;

function envBag(): Record<string, string | undefined> | undefined {
  try {
    if (typeof process === "undefined" || !process.env) return undefined;
    return process.env as Record<string, string | undefined>;
  } catch {
    return undefined;
  }
}

function setIfMissing(bag: Record<string, string | undefined>, name: string, value?: string) {
  if (value && !bag[name]) bag[name] = value;
}

/**
 * Copy Cloudflare Worker bindings (the `env` argument of `fetch`) into
 * `process.env`, then backfill public names from VITE_ aliases.
 * Safe to call on every request; it never overwrites an existing value.
 */
export function normalizeSupabaseServerEnv(runtimeEnv?: unknown): void {
  const bag = envBag();
  if (!bag) return;

  const bindings = (runtimeEnv ?? {}) as Record<string, unknown>;
  for (const key of RUNTIME_ENV_KEYS) {
    const value = bindings[key];
    if (typeof value === "string") setIfMissing(bag, key, value);
  }

  // Public aliases: SUPABASE_* <- VITE_SUPABASE_*
  setIfMissing(bag, "SUPABASE_URL", bag["VITE_SUPABASE_URL"]);
  setIfMissing(
    bag,
    "SUPABASE_PUBLISHABLE_KEY",
    bag["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? bag["VITE_SUPABASE_ANON_KEY"],
  );
  setIfMissing(bag, "SUPABASE_PROJECT_ID", bag["VITE_SUPABASE_PROJECT_ID"]);

  // Last resort: build-time inlined VITE_ values.
  for (const [name, value] of PUBLIC_ENV_FALLBACKS) setIfMissing(bag, name, value);
}

/**
 * Returns the names of required public Supabase variables that are still
 * missing after normalization. Used for a clear startup/runtime error.
 */
export function missingSupabaseServerEnv(): string[] {
  const bag = envBag() ?? {};
  return ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY"].filter((name) => !bag[name]);
}

// Best-effort at module load (Node / Lovable / local dev).
normalizeSupabaseServerEnv();
