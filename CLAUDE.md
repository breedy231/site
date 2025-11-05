# Claude Code Project Notes

## Build System

- The `public/` directory contains build output and is gitignored
- Source files should be edited in `static/` directory, not `public/`
- Files in `static/` get copied to `public/` during the build process

## File Structure

- **Source files**: `static/` directory (tracked in git)
- **Build output**: `public/` directory (gitignored)

When fixing files for deployment, always edit the source files in `static/`, not the generated files in `public/`.

## Netlify Functions

### Function Format

- Use modern ES module syntax: `export default async function handler(req) {}`
- Return `new Response(JSON.stringify(data), { status, headers })` instead of `res.status().json()`
- Access request headers with `req.headers.get("header-name")`
- Use `process.env.VARIABLE_NAME` for environment variables

### Common Issues

- **502 errors**: Usually caused by incorrect function syntax or missing dependencies
- **Deployment differences**: Functions may work locally but fail in production due to:
  - Wrong module syntax (CommonJS vs ES modules)
  - Missing environment variables
  - Dependency issues

### Debugging Steps for 502 Errors

1. Check function syntax matches modern Netlify format
2. Verify environment variables are set in Netlify dashboard
3. Check function logs in Netlify dashboard
4. Test function signature: `export default async function(req) {}`

## Frontend Error Handling

### API Call Patterns

When fetching from Netlify functions, always:

```javascript
fetch(apiUrl)
  .then(res => {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    return res.json()
  })
  .then(data => setData(data))
  .catch(err => setError(err.message))
```

### Defensive Rendering

Always check data structure before mapping:

```javascript
{data && data.requiredProperty && (
  data.requiredProperty.map(item => ...)
)}
```

This prevents "Cannot read properties of undefined" errors when APIs fail.

## OAuth Integration (Trakt) - Simplified

### Overview (Updated January 2025)

The Trakt integration now uses a **simplified OAuth approach** using the free Trakt API:

- **No automatic token refresh** - Manual re-auth every ~3 months
- **No complex notifications** - Simple admin error messages
- **~200 lines of code** (previously ~500 lines)
- **$0 cost** - No VIP subscription required

See `TRAKT_SETUP.md` for complete setup instructions.

### Token Management

**When tokens expire (~3 months):**

1. Visit `/now?admin`
2. Click "Re-authenticate" button
3. Authorize on Trakt.tv
4. Copy new tokens from callback page
5. Update environment variables in Netlify
6. Trigger new deployment

**Admin detection:**
- `?admin` query parameter
- Development mode (`npm run develop`)
- Localhost access

### Environment Variables Required

```
GATSBY_TRAKT_CLIENT_ID=your_client_id
GATSBY_TRAKT_CLIENT_SECRET=your_client_secret
GATSBY_TRAKT_ACCESS_TOKEN=your_access_token
GATSBY_TRAKT_REFRESH_TOKEN=your_refresh_token
GATSBY_TMDB_API_KEY=your_tmdb_key (optional, for poster images)
```

### Implementation Pattern

```javascript
const handleOAuth = () => {
  const isDevelopment = process.env.NODE_ENV === "development"
  const currentHost = window.location.origin

  const redirectUri = isDevelopment
    ? "http://localhost:8000/callback/oauth"
    : `${currentHost}/callback/oauth`

  // Redirect to Trakt authorization
  window.location.href = `https://trakt.tv/oauth/authorize?...`
}
```

### Files Involved

- `netlify/functions/history.js` - Fetches watch history
- `netlify/functions/trakt-token.js` - OAuth token exchange
- `src/pages/now.js` - Displays watch history
- `src/pages/callback/oauth.js` - OAuth callback handler

## Code Formatting & Pre-commit Hooks

### Prettier Configuration

The project uses Prettier for consistent code formatting across local development and CI:

**Configuration file:** `.prettierrc`

```json
{
  "arrowParens": "avoid",
  "semi": false,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

**Key settings:**

- **Arrow parens:** Avoid parentheses around single arrow function parameters
- **Semicolons:** Disabled (uses ASI - Automatic Semicolon Insertion)
- **Tailwind plugin:** Automatically sorts CSS classes for consistency

### Pre-commit Hooks

The project uses Husky + lint-staged to ensure code quality before commits:

**Setup:** Automatically installed via `npm install` → `husky install`

**lint-staged configuration:**

```json
{
  "*.{js,jsx,ts,tsx,json,md}": ["prettier --write"],
  "*.{js,jsx,ts,tsx}": ["eslint --fix"]
}
```

**What happens on commit:**

1. **Prettier formats** all JS/TS/JSON/Markdown files
2. **ESLint fixes** automatically fixable linting issues
3. **Files are staged** automatically (lint-staged handles git add)
4. **Commit proceeds** with properly formatted code

### CI/GitHub Actions Consistency

**Problem solved:** Previously, local commits and GitHub Actions used different formatting configurations, causing push/pull conflicts.

**Solution:** Synchronized configurations ensure identical formatting:

**Local (lint-staged):** `*.{js,jsx,ts,tsx,json,md}`
**CI (GitHub Actions):** `*.{js,jsx,ts,tsx,json,md}`
**Result:** No formatting differences between local and CI

### Prettier Ignore

Files excluded from formatting via `.prettierignore`:

- `node_modules/` - Dependencies
- `public/` - Build output
- `.cache/` - Gatsby cache
- `package-lock.json` - Lock file formatting
- Generated/minified files

### Troubleshooting

**Pre-commit hooks not running:**

1. Ensure Husky is installed: `npm run prepare`
2. Check git hooks: `ls -la .git/hooks/`
3. Verify lint-staged config in `package.json`

**Formatting inconsistencies:**

1. Run manually: `npm run format`
2. Check Prettier config: `.prettierrc`
3. Verify file patterns match between lint-staged and CI

**ESLint errors blocking commits:**

1. Check errors: `npx eslint src/`
2. Auto-fix: `npx eslint src/ --fix`
3. Update ESLint config if needed: `.eslintrc.js`

### Commands

```bash
# Format all files manually
npm run format

# Check formatting without fixing
npx prettier --check "**/*.{js,jsx,ts,tsx,json,md}"

# Run ESLint with auto-fix
npx eslint src/ --fix

# Test pre-commit hooks
npx lint-staged
```

## GitHub Actions CI Pipeline

### Overview

The project uses GitHub Actions for continuous integration, automatically formatting code and ensuring consistency across all commits.

### Workflow Configuration

**File:** `.github/workflows/main.yml`

The workflow runs on:

- All pull requests
- Pushes to the `main` branch

**Key features:**

- Automatic code formatting with Prettier
- Yarn package manager support
- Git commit and push capabilities
- Proper permissions and checkout handling

### Critical Fixes Applied

#### 1. Package Manager Consistency

**Problem:** CI was failing because GitHub Actions used npm commands while the project uses yarn.

**Before:**

```yaml
- name: Install dependencies
  run: npm ci
- name: Run Prettier
  run: npm run format
```

**After:**

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v3
  with:
    node-version: "18"
    cache: "yarn"
- name: Install dependencies
  run: yarn install --frozen-lockfile
- name: Run Prettier
  run: yarn format
```

#### 2. Git Permissions

**Problem:** GitHub Actions couldn't commit and push changes due to insufficient permissions.

**Solution:** Added proper permissions to the job:

```yaml
permissions:
  contents: write
  pull-requests: write
```

#### 3. Checkout Reference Handling

**Problem:** Checkout wasn't properly handling different scenarios (PR vs direct push).

**Solution:** Enhanced checkout step:

```yaml
- name: Checkout
  uses: actions/checkout@v3
  with:
    # Handle both PRs and direct pushes
    ref: ${{ github.head_ref || github.ref }}
    # Fetch full history for proper git operations
    fetch-depth: 0
    # Use token with write permissions
    token: ${{ secrets.GITHUB_TOKEN }}
```

### Workflow Steps

1. **Checkout code** with proper permissions and reference handling
2. **Setup Node.js 18** with yarn caching
3. **Install dependencies** using yarn with frozen lockfile
4. **Run Prettier** to format code
5. **Check for changes** and set output flag
6. **Commit and push** formatted code if changes detected

### Benefits

- **No more push/pull conflicts:** Local formatting now matches CI exactly
- **Consistent code style:** All commits automatically formatted
- **Zero configuration:** Works out of the box for all developers
- **Efficient caching:** Yarn cache speeds up CI runs

### Troubleshooting CI Issues

**Build failing with package manager errors:**

- Verify `yarn.lock` exists and is committed
- Check that workflow uses `yarn` commands, not `npm`

**Permission denied on git operations:**

- Ensure `contents: write` permission is set
- Verify `GITHUB_TOKEN` has proper scope

**Checkout issues on PRs:**

- Check `ref` parameter uses `${{ github.head_ref || github.ref }}`
- Ensure `fetch-depth: 0` for full history

**Formatting inconsistencies:**

- Verify `.prettierrc` configuration matches local setup
- Check file patterns match between CI and lint-staged

### Testing After Token Update

After updating tokens and deploying:

1. Visit `/now` page (without `?admin`)
2. Verify "Reading" and "Listening" sections load
3. Verify "Watching" section shows data (not fallback message)
4. Check browser console for any remaining API errors

**Troubleshooting:**
- If you see "Token expired" - Visit `/now?admin` and re-authenticate
- If images don't load - Check `GATSBY_TMDB_API_KEY` is set
- If no data shows - Verify all environment variables are set correctly
