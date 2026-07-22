// Stands in for "$amplify/env/poll-spotify" under Vitest (aliased in
// vitest.config.ts). That module only exists once `npm run sandbox`
// generates .amplify/generated/env/poll-spotify.ts, which never happens in
// CI/local test runs — and unlike aws-amplify/etc, vi.mock alone can't cover
// it, since Vite's import-analysis tries to resolve the literal specifier
// before any mock factory gets a chance to intercept it.
export const env = {};
