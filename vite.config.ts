// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Cloudflare Workers deployment target (nitro `cloudflare-module` preset).
  // Build output: dist/client (static assets) + dist/server (worker, wrangler.json).
  nitro: {
    preset: "cloudflare-module",
    cloudflare: {
      // Worker name written into dist/server/wrangler.json
      wrangler: { name: "ic-smart-multi-tester" },
    } as { wrangler: { name: string } },

  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
