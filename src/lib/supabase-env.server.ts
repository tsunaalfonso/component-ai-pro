/**
 * Server-side Supabase env normalization.
 *
 * Locally and inside Lovable, the server runtime receives SUPABASE_URL /
 * SUPABASE_PUBLISHABLE_KEY. On external hosts (Vercel) people usually only
 * configure the Vite-prefixed variables, which are inlined at build time.
 * This module backfills the non-prefixed server names from the VITE_ values
 * so SSR and server functions initialize with the same configuration.
 *
 * Only public (publishable/anon) values are mirrored here — never the service
 * role key, which must stay a server-only secret.
 */
const PUBLIC_ENV_MAP: Array<[serverName: string, value: string | undefined]> = [
  ["SUPABASE_URL", import.meta.env["VITE_SUPABASE_URL"] as string | undefined],
  [
    "SUPABASE_PUBLISHABLE_KEY",
    (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ??
      import.meta.env["VITE_SUPABASE_ANON_KEY"]) as string | undefined,
  ],
  ["SUPABASE_PROJECT_ID", import.meta.env["VITE_SUPABASE_PROJECT_ID"] as string | undefined],
];

export function normalizeSupabaseServerEnv(): void {
  try {
    if (typeof process === "undefined" || !process.env) return;
    for (const [name, value] of PUBLIC_ENV_MAP) {
      if (!process.env[name] && value) process.env[name] = value;
    }
  } catch {
    // Read-only env in some runtimes — the generated clients still fall back to VITE_ values.
  }
}

normalizeSupabaseServerEnv();
