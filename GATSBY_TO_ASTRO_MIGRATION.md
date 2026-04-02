# Gatsby to Astro Migration Plan

## Why Migrate

Gatsby has been effectively deprecated since Netlify acquired it in early 2023 and subsequently wound down active development. The ecosystem (plugins, community support, security patches) is stagnating. Astro is a natural successor for content-focused sites with islands of interactivity — which is exactly what this site is.

## Current State Summary

| Aspect | Current Setup |
|--------|--------------|
| Framework | Gatsby 5.16.1 |
| React | 18.3.1 |
| Styling | Tailwind v4 + CSS Modules + Styled Components |
| Content | 3 MDX blog posts in `blog/` |
| Hosting | Netlify (functions + static) |
| Functions | 5 Netlify Functions (V2 format) |
| Interactive pages | `/headsup` (game), `/motion-test`, `/now` (API data) |

## Migration Strategy: Incremental, Page-by-Page

Rather than a big-bang rewrite, migrate incrementally:
1. Set up Astro project alongside Gatsby config
2. Migrate static pages first
3. Move interactive pages as React islands
4. Remove Gatsby once complete

---

## Phase 0: Project Scaffolding

**Goal:** Get Astro running with the existing styling and layout infrastructure.

### Tasks
- [ ] Install Astro and core integrations (`@astrojs/react`, `@astrojs/tailwind`, `@astrojs/mdx`, `@astrojs/netlify`)
- [ ] Create `astro.config.mjs` with Netlify adapter
- [ ] Port `src/styles/global.css` (Tailwind v4 entry point) — should work as-is
- [ ] Port fonts (`src/css/typography.css` + `src/fonts/Poppins/`)
- [ ] Port dark mode pre-render script (currently in `gatsby-ssr.js`) to an inline `<script>` in the Astro layout
- [ ] Create base Astro layout (`src/layouts/BaseLayout.astro`) replacing `layout.js`
- [ ] Move static assets from `static/` to `public/` (Astro convention)
- [ ] Configure `prettierrc` with `prettier-plugin-astro`
- [ ] Verify Tailwind dark mode (`@custom-variant`) works in Astro's PostCSS pipeline

### Key Differences
| Gatsby | Astro |
|--------|-------|
| `static/` → copied to `public/` at build | `public/` is the static dir directly |
| `gatsby-ssr.js` for head injection | `<script is:inline>` in layout `<head>` |
| `gatsby-browser.js` for client wrappers | Astro layouts or client directives |
| `useStaticQuery` for site metadata | Import from a config file or `Astro.props` |

---

## Phase 1: Static Pages

**Goal:** Migrate pages with no/minimal client-side interactivity.

### Homepage (`/`)
- [ ] Create `src/pages/index.astro`
- [ ] Replace `useStaticQuery` for site metadata with a static config import
- [ ] Replace `react-media` responsive breakpoints with CSS-only approach (Tailwind responsive classes already handle this — `react-media` is only used in `layout.js` for conditional rendering)
- [ ] Port employment history, contact info, intro sections
- [ ] Convert `layout.js` responsive navigation to CSS-based show/hide (Tailwind `hidden md:block` etc.)

### 404 Page
- [ ] Create `src/pages/404.astro`

### Responsive Test Page (`/responsive-test`)
- [ ] Create `src/pages/responsive-test.astro` (or drop it if no longer needed)

### Blog
- [ ] Move MDX files from `blog/` to `src/content/blog/` (Astro content collections)
- [ ] Define content collection schema in `src/content/config.ts`
- [ ] Create `src/pages/blog/index.astro` for blog listing
- [ ] Create `src/pages/blog/[slug].astro` for individual posts
- [ ] Verify MDX rendering with `@astrojs/mdx`
- [ ] Port blog CSS module styles

---

## Phase 2: Interactive Pages (React Islands)

**Goal:** Migrate pages that require significant client-side JavaScript using Astro's island architecture (`client:load` / `client:only="react"`).

### Now Page (`/now`)
- [ ] Create `src/pages/now.astro` with static shell
- [ ] Extract data-fetching sections into React island components:
  - `ReadingSection.tsx` (Goodreads data)
  - `WatchingSection.tsx` (Trakt data + OAuth)
  - `ListeningSection.tsx` (Last.fm data)
- [ ] Use `client:load` directive for these islands (they fetch on mount)
- [ ] Port media display components (`BookDisplay`, `WatchDisplay`, `TrackDisplay`)
- [ ] Port OAuth admin detection logic
- [ ] Port Trakt re-auth button

### OAuth Callback (`/callback/oauth`)
- [ ] Create as a React island (`client:only="react"`) since it's entirely client-side (reads URL params, posts to API)

### Heads Up Game (`/headsup`)
- [ ] Create `src/pages/headsup.astro` with minimal shell
- [ ] Keep the entire game as a single React island (`client:only="react"`) — it's 100% interactive
- [ ] Port `SoundManager.js` as-is
- [ ] Port `headsupCategories.js` data
- [ ] Port game sound files (already in `public/` after Phase 0)
- [ ] Verify `framer-motion` works in island context
- [ ] Test device orientation APIs

### Motion Test (`/motion-test`)
- [ ] Create `src/pages/motion-test.astro` with minimal shell
- [ ] Keep as React island (`client:only="react"`)

---

## Phase 3: Infrastructure & Config

### Netlify Functions
- [ ] **No changes needed** — functions in `netlify/functions/` are independent of the framework
- [ ] Update `netlify.toml`:
  - Build command: `astro build` (replaces `gatsby build`)
  - Publish directory: `dist` (replaces `public`)
  - Keep `/api/*` redirects as-is
- [ ] Verify Netlify adapter generates correct function wrappers (if using SSR routes)

### SEO & Head Management
- [ ] Replace `react-helmet` with Astro's built-in `<head>` management
- [ ] Port manifest config from `gatsby-plugin-manifest` to a static `manifest.json` in `public/`
- [ ] Port any Open Graph / meta tags

### Images
- [ ] Replace `gatsby-plugin-image` / `gatsby-plugin-sharp` with Astro's built-in `<Image>` component (`astro:assets`)
- [ ] Audit image usage — currently minimal (blog images, media posters from APIs)

### Theme Context
- [ ] Replace React Context (`ThemeContext.js`) with a vanilla JS approach:
  - Inline script in `<head>` reads localStorage and sets `.dark` class (prevents FOUC)
  - `ThemeToggle` becomes a small client-side island or vanilla JS web component
  - Astro components use Tailwind `dark:` variants (no change needed)

### Environment Variables
- [ ] Rename `GATSBY_*` env vars to standard names (Astro uses `PUBLIC_` prefix for client-exposed vars)
  - `GATSBY_TRAKT_CLIENT_ID` → `PUBLIC_TRAKT_CLIENT_ID`
  - `GATSBY_TMDB_API_KEY` → `PUBLIC_TMDB_API_KEY`
  - Server-only vars (secrets) drop the prefix entirely
- [ ] Update Netlify dashboard env vars
- [ ] Update all code references

---

## Phase 4: Cleanup

- [ ] Remove all Gatsby dependencies from `package.json`:
  - `gatsby`, `gatsby-cli`, and all `gatsby-plugin-*` / `gatsby-transformer-*` / `gatsby-source-*`
  - `react-helmet`
  - `react-media` (if fully replaced with CSS)
  - `gatsby-adapter-netlify`
- [ ] Remove Gatsby config files: `gatsby-config.js`, `gatsby-node.js`, `gatsby-browser.js`, `gatsby-ssr.js`
- [ ] Remove `styled-components` if no longer used (currently only in `textElements.js` which appears unused)
- [ ] Update `CLAUDE.md` to reflect new architecture
- [ ] Remove `GATSBY_NETLIFY_MIGRATION_PLAN.md` (obsolete)
- [ ] Update CI workflow (`.github/workflows/main.yml`) if build commands changed
- [ ] Update pre-commit hooks / lint-staged config for `.astro` files
- [ ] Final build and deploy test

---

## Dependency Mapping

### Keep
| Package | Reason |
|---------|--------|
| `react`, `react-dom` | Used by interactive islands |
| `tailwindcss`, `@tailwindcss/postcss`, `@tailwindcss/typography` | Styling (works with Astro) |
| `framer-motion` | Heads Up game animations |
| `axios` | API calls in islands |
| `fast-xml-parser` | Used by Netlify function (not framework-dependent) |
| `@netlify/blobs` | Used by Netlify function |
| `prop-types` | Used by React components |
| `prettier`, `eslint`, `husky`, `lint-staged` | Dev tooling |

### Add
| Package | Reason |
|---------|--------|
| `astro` | Framework |
| `@astrojs/react` | React island support |
| `@astrojs/mdx` | MDX blog posts |
| `@astrojs/netlify` | Netlify adapter (SSR/functions) |
| `@astrojs/tailwind` or manual PostCSS | Tailwind integration |
| `prettier-plugin-astro` | Format `.astro` files |

### Remove
| Package | Reason |
|---------|--------|
| `gatsby` + all `gatsby-*` plugins | Replaced by Astro |
| `gatsby-cli` | Replaced by `astro` CLI |
| `react-helmet` | Astro handles `<head>` natively |
| `react-media` | Replace with CSS-only responsive |
| `styled-components` + babel plugin | Unused / replaceable with Tailwind |
| `@mdx-js/react` | Astro MDX integration handles this |
| `sass` | Not needed if all styles use Tailwind/CSS |

---

## Risk Assessment

### Low Risk
- Static pages (homepage, 404, blog) — straightforward template conversion
- Netlify functions — completely independent of framework
- Tailwind CSS — works identically in Astro
- Static assets — just move `static/` contents to `public/`

### Medium Risk
- Dark mode FOUC prevention — need to replicate the `gatsby-ssr.js` inline script approach
- MDX blog posts — Astro's MDX handling differs slightly (content collections vs file-based routing)
- Environment variable renaming — need to update code + Netlify dashboard simultaneously

### Higher Risk
- Heads Up game as React island — complex state + device APIs + framer-motion; needs thorough testing on mobile
- OAuth flow — redirect URIs and token exchange must work identically
- `react-media` removal — need to verify CSS-only responsive approach covers all layout cases

---

## Estimated Effort by Phase

| Phase | Scope | Complexity |
|-------|-------|------------|
| Phase 0 | Scaffolding | Low |
| Phase 1 | Static pages + blog | Low-Medium |
| Phase 2 | Interactive islands | Medium-High |
| Phase 3 | Infrastructure | Medium |
| Phase 4 | Cleanup | Low |

---

## Testing Checklist

- [ ] All pages render correctly (visual comparison)
- [ ] Dark mode toggle works without FOUC
- [ ] Blog posts render MDX correctly (code blocks, images, links)
- [ ] `/now` page loads data from all 3 APIs
- [ ] Trakt OAuth login + callback flow works
- [ ] Heads Up game works on mobile (tilt detection, sounds, scoring)
- [ ] Motion test page detects device orientation
- [ ] Netlify deploy succeeds
- [ ] Netlify function redirects (`/api/*`) work
- [ ] Lighthouse scores maintained or improved
- [ ] No console errors in production build
- [ ] RSS/sitemap still works (if applicable)
- [ ] Font loading works correctly

## Rollback Plan

Keep the `main` branch on Gatsby until the Astro migration is fully tested on a preview deploy. The migration branch can be abandoned at any point without affecting production.
