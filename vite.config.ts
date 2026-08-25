// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Cloudflare Workers deployment target (nitro `cloudflare-module` preset).
// Nitro owns the generated `.output` deployment artifacts and deploys them with
// `nitro deploy --prebuilt`; no hand-written Worker entry point is used.
const nitro = {
  preset: "cloudflare-module",
  cloudflare: {
    wrangler: {
      name: "component-ai-pro",
      compatibility_flags: ["nodejs_compat"],
    },
  },
} as never;

export default defineConfig({
  // Extra Vite plugins go here. The Lovable TanStack preset already supplies
  // tanstackStart, viteReact, tailwindcss and tsConfigPaths in the correct
  // order — do not re-add them, they would be duplicated.
  plugins: [],
  nitro,
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
