# Development Setup Guide

## Prerequisites

- **Node.js** v20 or higher
- **npm**
- **Git**

## Quick Start

```bash
git clone https://github.com/breedy231/site.git
cd site
npm install
npm run dev
```

Visit [http://localhost:4321](http://localhost:4321).

## Code Quality & Formatting

### Automatic Setup

The project configures code quality tools during `npm install`:

- Husky git hooks
- lint-staged for pre-commit formatting
- Prettier + ESLint integration

### Pre-commit Process

Every commit automatically:

1. Formats code with Prettier (`.js`, `.jsx`, `.ts`, `.tsx`, `.json`, `.md`, `.astro`)
2. Fixes linting issues with ESLint (`.js`, `.jsx`, `.ts`, `.tsx`)
3. Stages changes automatically
4. Prevents commits if unfixable errors exist

### Manual Commands

```bash
npm run format                # Format all files
npm run build                 # Build for production
npm run dev                   # Start dev server (port 4321)
npm run preview               # Preview production build
npx eslint src/ --fix         # Fix lint errors
npx lint-staged               # Test pre-commit hooks
```

## Configuration Files

### Code Formatting

- **`.prettierrc`** - Prettier config (includes Astro and Tailwind plugins)
- **`.prettierignore`** - Files excluded from formatting
- **`.eslintrc.cjs`** - ESLint rules and settings

### Build System

- **`astro.config.mjs`** - Astro config with React, MDX, Netlify, Sitemap integrations
- **`netlify.toml`** - Netlify build config and API redirects

## Environment Variables

Create a `.env` file in the project root:

```bash
# Trakt API (server-side, used by Netlify functions)
TRAKT_CLIENT_ID=your_client_id
TRAKT_CLIENT_SECRET=your_client_secret
TRAKT_ACCESS_TOKEN=your_access_token
TRAKT_REFRESH_TOKEN=your_refresh_token

# TMDB API (for poster images, optional)
TMDB_API_KEY=your_tmdb_api_key

# Trakt Client ID (client-side, for OAuth redirect URL)
PUBLIC_TRAKT_CLIENT_ID=your_client_id
```

Note: Astro only exposes `PUBLIC_`-prefixed variables to client-side code via `import.meta.env`.

## Project Structure

```
├── src/
│   ├── components/    # React island components (.jsx)
│   ├── content.config.ts  # Blog content collection schema
│   ├── data/          # Static data (game categories)
│   ├── layouts/       # Astro layouts (BaseLayout.astro)
│   ├── pages/         # Astro pages (routes)
│   └── styles/        # Global CSS (Tailwind entry point)
├── blog/              # MDX blog posts
├── netlify/
│   └── functions/     # Netlify serverless functions
├── public/            # Static assets (fonts, sounds, images)
└── dist/              # Build output (gitignored)
```

## Architecture

- **Static pages** (homepage, 404, blog) are `.astro` files — zero JS to client
- **Interactive pages** use React components as Astro islands:
  - `client:load` — hydrates on page load (ThemeToggle, NowPage)
  - `client:only="react"` — client-only rendering (HeadsUpGame, MotionTest, OAuthCallback)

## Development Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes — commits are auto-formatted
git add .
git commit -m "feat: your feature description"

# Push
git push origin feature/your-feature-name
```

### Testing

```bash
npm run dev       # Dev server at localhost:4321
npm run build     # Production build
npm run preview   # Preview production build locally
```

### Netlify Functions

Functions in `netlify/functions/` use modern V2 format and are independent of Astro:

```javascript
export default async function handler(req) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}
```

API redirects in `netlify.toml` map `/api/*` to `/.netlify/functions/*`.

### OAuth Flow (Trakt)

- **Development**: Redirect URI is `http://localhost:4321/callback/oauth`
- **Production**: Uses `${currentHost}/callback/oauth`

## Troubleshooting

### Pre-commit hooks not running

```bash
npm run prepare
ls -la .git/hooks/
```

### Build issues

```bash
rm -rf node_modules dist .astro
npm install
npm run build
```

### OAuth issues

- Visit `/now?admin` to trigger re-authentication
- Check Netlify function logs for token refresh errors
- Verify redirect URIs in Trakt app settings match
