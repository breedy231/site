# Development Setup Guide

This guide covers setting up the development environment for Brendan Reed's personal site.

## Quick Reference: Avoid Common CI Failures ⚠️

**Before every push, run:**

```bash
yarn build  # Test the full build locally
```

**Common CI failures and fixes:**
| Error | Cause | Fix |
|-------|-------|-----|
| `lockfile needs to be updated` | Added dependency without updating yarn.lock | `yarn install && git add yarn.lock` |
| `Module parse failed` (native module) | Native module in `src/api/` | Move to `functions/` directory |
| ESLint errors | Unused variables, semicolons | Remove unused vars, run `yarn format` |
| Prettier formatting | Code doesn't match style | Pre-commit hooks should fix automatically |

**Key rules:**

- ✅ **Always commit yarn.lock** when adding dependencies
- ✅ **Native modules go in `functions/`**, not `src/api/`
- ✅ **No semicolons** in JavaScript (Prettier config)
- ✅ **Remove unused variables** (ESLint requirement)

## Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Git**

## Quick Start

```bash
# Clone the repository
git clone https://github.com/breedy231/site.git
cd site

# Install dependencies
npm install

# Start development server
npm run develop

# For HTTPS development (required for some OAuth testing)
npm run develop-https
```

## Code Quality & Formatting

### Automatic Setup

The project automatically configures code quality tools during `npm install`:

- ✅ **Husky** git hooks installed
- ✅ **lint-staged** configured for pre-commit formatting
- ✅ **Prettier** + **ESLint** integration ready

### Pre-commit Process

Every commit automatically:

1. **Formats code** with Prettier
2. **Fixes linting issues** with ESLint
3. **Stages changes** automatically
4. **Prevents commits** if unfixable errors exist

### Manual Commands

```bash
# Format all files
npm run format

# Check formatting without changes
npx prettier --check "**/*.{js,jsx,ts,tsx,json,md}"

# Lint with auto-fix
npx eslint src/ --fix

# Test pre-commit hooks
npx lint-staged

# Clean Gatsby cache
npm run clean
```

## Configuration Files

### Code Formatting

- **`.prettierrc`** - Prettier configuration
- **`.prettierignore`** - Files to exclude from formatting
- **`.eslintrc.js`** - ESLint rules and settings

### Build System

- **`gatsby-config.js`** - Gatsby configuration
- **`gatsby-node.js`** - Build-time node APIs
- **`tailwind.config.js`** - Tailwind CSS configuration
- **`postcss.config.js`** - PostCSS configuration

## Environment Variables

### Required for Development

Create `.env.development` with:

```bash
# Trakt API (for TV/Movie tracking)
GATSBY_TRAKT_CLIENT_ID=your_client_id
GATSBY_TRAKT_CLIENT_SECRET=your_client_secret
GATSBY_TRAKT_ACCESS_TOKEN=your_access_token
GATSBY_TRAKT_REFRESH_TOKEN=your_refresh_token

# TMDB API (for poster images)
GATSBY_TMDB_API_KEY=your_tmdb_api_key

# Last.fm API (for music tracking)
GATSBY_LASTFM_API_KEY=your_lastfm_api_key
GATSBY_LASTFM_USERNAME=your_lastfm_username

# Goodreads (for book tracking)
GATSBY_GOODREADS_USER_ID=your_goodreads_user_id
```

### Optional (for alerts/notifications)

```bash
# For automated alerts
ADMIN_ALERT_WEBHOOK_URL=your_slack_webhook_url
EMAIL_SERVICE_URL=your_email_service_url
EMAIL_API_KEY=your_email_api_key
ADMIN_EMAIL=your_email@domain.com
```

## Project Structure

```
├── src/
│   ├── api/           # Gatsby serverless functions (Gatsby-compiled)
│   ├── components/    # React components
│   ├── context/       # React context providers
│   ├── pages/         # Gatsby pages (routes)
│   └── utils/         # Utility functions
├── functions/         # Netlify serverless functions (Netlify-bundled)
├── static/            # Static assets (copied to public/)
├── blog/              # MDX blog posts
└── public/            # Build output (auto-generated)
```

### Important: Functions Directory Architecture

**Two different function directories exist for different build systems:**

#### `src/api/` - Gatsby-Compiled Functions

- **Compiled by**: Gatsby's webpack during `gatsby build`
- **Use for**: Simple functions without native dependencies
- **Examples**: API wrappers, data transformations, OAuth handlers
- **Limitations**: Cannot use native Node modules (canvas, sharp, sqlite3, etc.)
- **Style Requirements**: Must follow Prettier/ESLint rules (no semicolons, etc.)

#### `functions/` - Netlify-Bundled Functions

- **Compiled by**: Netlify's esbuild (bypasses Gatsby)
- **Use for**: Functions with native dependencies or heavy processing
- **Examples**: Image generation (canvas), PDF processing, database operations
- **Advantages**: Full Node.js environment, native module support
- **Style Requirements**: Same Prettier/ESLint rules apply

**When to use which:**

```javascript
// ✅ src/api/ - Simple API wrapper
export default async function handler(req) {
  const data = await fetch("external-api.com")
  return new Response(JSON.stringify(data))
}

// ✅ functions/ - Native module usage
const { createCanvas } = require("canvas")
exports.handler = async event => {
  const canvas = createCanvas(800, 600)
  // ... image generation
}
```

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes, commits are automatically formatted
git add .
git commit -m "feat: your feature description"

# Push when ready
git push origin feature/your-feature-name
```

### 2. No More Formatting Conflicts!

Previously, developers experienced this frustrating cycle:

```bash
git commit -m "fix: something"
git push                        # ❌ Rejected
git pull                        # GitHub Actions reformatted code
git push                        # ✅ Finally works
```

**Now:** Local formatting matches CI exactly, so pushes work on the first try!

### 3. Testing

```bash
# Test locally
npm run develop

# Test production build (ALWAYS do this before pushing!)
npm run build
npm run serve

# Test HTTPS (for OAuth)
npm run develop-https
```

**CRITICAL:** Always run `npm run build` locally before pushing to catch:

- Gatsby compilation errors
- Webpack bundling issues
- Native module conflicts
- Missing dependencies

## Build System

### Source Files vs Build Output

**Important:** Always edit files in `src/` and `static/`, never in `public/`!

- **Source**: `static/` directory (version controlled)
- **Build output**: `public/` directory (gitignored)
- **Build process**: Copies `static/` → `public/` + generates pages

### Dependency Management

**When adding dependencies:**

```bash
# Add the dependency
yarn add some-package

# Update lockfile (REQUIRED for CI)
git add yarn.lock package.json
git commit -m "chore: add some-package dependency"
```

**NEVER commit without updating yarn.lock** or CI will fail with:

```
error Your lockfile needs to be updated, but yarn was run with `--frozen-lockfile`.
```

### Code Style Requirements

**All code must follow these rules:**

```javascript
// ❌ WRONG - Will fail CI
const foo = require("bar")
function test(ctx, bounds) {
  // unused parameters
}

// ✅ CORRECT
const foo = require("bar") // No semicolon
function test() {
  // Remove unused parameters
  // ...
}
```

**Pre-commit hooks automatically fix most issues**, but ESLint errors will block commits.
Run `yarn format` before committing if you're unsure.

## API Integration

### OAuth Flow (Trakt)

1. **Development**: Uses `localhost:8000/callback/oauth`
2. **Production**: Uses `${currentHost}/callback/oauth`
3. **Deploy previews**: Falls back to main site URL

### Automatic Token Refresh

The system automatically refreshes expired tokens:

- **Success**: Logs new tokens for manual environment variable updates
- **Failure**: Falls back to manual re-authentication
- **Notifications**: Sends alerts via configured methods

## Troubleshooting

### Pre-commit Issues

**Hooks not running:**

```bash
npm run prepare
ls -la .git/hooks/  # Should see pre-commit file
```

**Formatting inconsistencies:**

```bash
npm run format
git add .
git commit --amend --no-edit
```

### Build Issues

**Cache problems:**

```bash
npm run clean
npm run develop
```

**Dependency issues:**

```bash
rm -rf node_modules yarn.lock
yarn install
git add yarn.lock  # Don't forget to commit the updated lockfile!
```

**Native module errors during build:**

If you see webpack errors like:

```
Module parse failed: Unexpected character '' (1:0)
You may need an appropriate loader to handle this file type
```

This means a native module is in the wrong directory:

- **Move from**: `src/api/your-function.js`
- **Move to**: `functions/your-function.js`
- **Update imports**: Change `../module` to `./module` as needed
- **Update netlify.toml**: Ensure `functions = "functions"` is set

**Lockfile out of sync (CI failing):**

```bash
yarn install          # Updates yarn.lock
git add yarn.lock
git commit -m "chore: update yarn.lock"
git push
```

### OAuth Issues

**Redirect URI errors:**

- Check Trakt app settings match callback URLs
- For deploy previews, test on main site instead

**Token expiration:**

- Visit `/now?admin` to trigger re-authentication
- Check Netlify function logs for auto-refresh status

## Contributing

1. **Follow the commit convention**: `feat:`, `fix:`, `docs:`, etc.
2. **Let pre-commit hooks do their job** - they ensure code quality
3. **Test OAuth changes** on deploy previews when possible
4. **Update documentation** when adding new features
5. **Check function logs** in Netlify dashboard for debugging

## Getting Help

- **Documentation**: See `CLAUDE.md` for comprehensive setup info
- **OAuth Setup**: See `TRAKT_SETUP.md` for API integration
- **Alert Setup**: See `AUTOMATED_ALERTS_SETUP.md` for notifications
- **Issues**: Check Netlify function logs and browser console

The development environment is designed to "just work" - if something seems overly complicated, there's probably a simpler way! ✨
