# Claude Code Project Notes

## Build System

- **Framework**: Astro 5 with React islands for interactive components
- **Build command**: `npm run build` (runs `astro build`, outputs to `dist/`)
- **Dev server**: `npm run dev` (runs `astro dev` on port 4321)
- **Static assets**: `public/` directory (served as-is by Astro, tracked in git)
- **Build output**: `dist/` directory (gitignored)
- **Package manager**: npm (not yarn)

## Architecture

### Astro + React Islands

- Static pages (homepage, 404, blog) are `.astro` files — zero JS shipped to client
- Interactive pages use React components as Astro islands:
  - `client:load` — hydrates on page load (e.g., ThemeToggle, NowPage)
  - `client:only="react"` — renders only on client, no SSR (e.g., HeadsUpGame, MotionTest, OAuthCallback)
- Base layout: `src/layouts/BaseLayout.astro`

### Key Files

| File                           | Purpose                                                     |
| ------------------------------ | ----------------------------------------------------------- |
| `astro.config.mjs`             | Astro config with React, MDX, Netlify, Sitemap integrations |
| `src/layouts/BaseLayout.astro` | Shared layout with nav, theme toggle, dark mode script      |
| `src/styles/global.css`        | Tailwind v4 entry point, fonts, dark mode, body styles      |
| `src/content.config.ts`        | Blog content collection schema                              |
| `src/components/*.jsx`         | React island components                                     |
| `netlify.toml`                 | Build config, API redirects, function paths                 |

### Pages

| Route              | File                              | Type                               |
| ------------------ | --------------------------------- | ---------------------------------- |
| `/`                | `src/pages/index.astro`           | Static                             |
| `/404`             | `src/pages/404.astro`             | Static                             |
| `/blog`            | `src/pages/blog/index.astro`      | Static (content collection)        |
| `/blog/[slug]`     | `src/pages/blog/[slug].astro`     | Static (content collection)        |
| `/responsive-test` | `src/pages/responsive-test.astro` | Static                             |
| `/now`             | `src/pages/now.astro`             | React island (`NowPage.jsx`)       |
| `/headsup`         | `src/pages/headsup.astro`         | React island (`HeadsUpGame.jsx`)   |
| `/motion-test`     | `src/pages/motion-test.astro`     | React island (`MotionTest.jsx`)    |
| `/callback/oauth`  | `src/pages/callback/oauth.astro`  | React island (`OAuthCallback.jsx`) |

## Serverless Functions

All functions in `netlify/functions/` use modern Netlify Functions V2 format:

1. **history.js** - Trakt watch history with automatic token refresh via Netlify Blobs
2. **goodreads.js** - Goodreads API integration
3. **lastfm.js** - Last.fm API integration
4. **trakt-token.js** - OAuth token exchange (persists tokens to Blobs)
5. **lib/trakt-tokens.js** - Shared module for token storage, retrieval, and refresh

### Function Format

- Use modern ES module syntax: `export default async function handler(req) {}`
- Return `new Response(JSON.stringify(data), { status, headers })`
- Access request headers with `req.headers.get("header-name")`
- Use `process.env.VARIABLE_NAME` for environment variables

## Blog (Content Collections)

Blog posts live in `blog/*.mdx` and are loaded via Astro content collections.

- Schema defined in `src/content.config.ts`
- Frontmatter: `name`, `datePublished`, `author`, `slug`
- Use standard markdown links (not Gatsby `<Link>`) in MDX files
- Blog listing: `src/pages/blog/index.astro`
- Blog post: `src/pages/blog/[slug].astro`

## CSS & Styling (Tailwind v4)

### Architecture

The project uses **Tailwind CSS v4** via the `@tailwindcss/vite` plugin (configured in `astro.config.mjs`).

**Single entry point:** `src/styles/global.css`

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
@custom-variant dark (&:where(.dark, .dark *));
```

- No `tailwind.config.js` — v4 uses CSS directives
- No `postcss.config.js` — Tailwind runs as a Vite plugin
- `@custom-variant dark` enables class-based dark mode (`.dark` on `<html>`)

### Dark Mode

- Inline `<script is:inline>` in `BaseLayout.astro` reads `localStorage` and sets `.dark` class before paint (prevents FOUC)
- `ThemeToggle.jsx` (React island with `client:load`) toggles the class and persists to `localStorage`
- Tailwind `dark:` utilities work throughout

### Fonts

- Poppins Regular and Bold loaded from `public/fonts/Poppins/`
- `@font-face` declarations in `src/styles/global.css`
- Preloaded via `<link rel="preload">` in `BaseLayout.astro`

## Environment Variables

### Netlify Functions (server-side, `process.env`)

```
TRAKT_CLIENT_ID=your_client_id          # Required: Trakt API headers
TRAKT_CLIENT_SECRET=your_client_secret   # Required: token refresh
TRAKT_ACCESS_TOKEN=your_access_token     # Seeds Blobs on first use
TRAKT_REFRESH_TOKEN=your_refresh_token   # Seeds Blobs on first use
TMDB_API_KEY=your_tmdb_key              # Optional: poster images
```

### Client-side (Astro `import.meta.env`)

```
PUBLIC_TRAKT_CLIENT_ID=your_client_id   # Used in OAuth redirect URL on /now page
```

Note: Astro exposes only `PUBLIC_` prefixed vars to client code via `import.meta.env`.

### Important: Cloudflare / User-Agent

All Trakt API requests **must include a `User-Agent` header** or Cloudflare blocks them. Set to `brendanreed-site/1.0` in `history.js` and `lib/trakt-tokens.js`.

## OAuth Integration (Trakt)

### How It Works

1. Tokens seeded from env vars into Netlify Blobs on first request
2. Blobs becomes source of truth
3. Auto-refresh on 401: `history.js` detects expiry, refreshes, saves, retries
4. Manual re-auth: visit `/now?admin`, click Re-authenticate

### Files Involved

- `netlify/functions/lib/trakt-tokens.js` - Token storage/refresh
- `netlify/functions/history.js` - Watch history + auto-refresh
- `netlify/functions/trakt-token.js` - OAuth code exchange
- `src/components/NowPage.jsx` - Displays watch history
- `src/components/OAuthCallback.jsx` - OAuth callback handler

## Code Formatting

### Prettier Configuration (`.prettierrc`)

```json
{
  "arrowParens": "avoid",
  "semi": false,
  "plugins": ["prettier-plugin-astro", "prettier-plugin-tailwindcss"],
  "overrides": [{ "files": "*.astro", "options": { "parser": "astro" } }]
}
```

### Pre-commit Hooks

Husky + lint-staged:

- `*.{js,jsx,ts,tsx,json,md,astro}` → Prettier
- `*.{js,jsx,ts,tsx}` → ESLint

### Commands

```bash
npm run format          # Format all files
npm run build           # Build for production
npm run dev             # Start dev server (port 4321)
npx eslint src/ --fix   # Fix lint errors
```

## CI Pipeline

GitHub Actions (`.github/workflows/main.yml`):

- Runs on PRs and pushes to main
- Uses npm (not yarn)
- Auto-formats with Prettier and commits changes

## Testing the Now Page

1. Visit `/now`
2. Verify "Reading", "Watching", and "Listening" sections load
3. Check browser console for API errors

**Troubleshooting:**

- Watching unavailable → Check Netlify function logs
- Token refresh failed → Visit `/now?admin` and re-authenticate
- Cloudflare errors → Verify `User-Agent` header in API requests
- Images missing → Check `TMDB_API_KEY` env var
- Test refresh → `/.netlify/functions/history?force-refresh=true`
