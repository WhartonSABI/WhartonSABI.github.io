# Member Access (archived)

GitHub OAuth–protected member area. Not currently used on the site.

**To restore:**
1. Move `lib/auth.ts` → `src/lib/auth.ts` (uses `./data` – keep `getMemberGithubUsernames` in `data.ts`)
2. Move `middleware.ts` → `src/middleware.ts`
3. Move `pages/auth/` → `src/pages/auth/`
4. Move `pages/members/` → `src/pages/members/` (fix imports to `../../layouts/` etc.)
5. Add adapter: `import node from '@astrojs/node'` and `adapter: node({ mode: 'standalone' })`
6. Add Member Access tab to `Nav.astro`
7. Remove Data from Seminar/Lab/Moneyball nav; add redirects to `/members/data`
8. Set env: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `SESSION_SECRET`
