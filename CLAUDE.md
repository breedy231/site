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

## OAuth Integration (Trakt)

### Redirect URI Configuration

OAuth providers require exact redirect URI matches. Common issues:

- **Deploy previews**: URLs like `deploy-preview-X--site.netlify.app` aren't in OAuth app whitelist
- **Development vs Production**: Different URIs for localhost vs production

### Debugging OAuth Errors

**"Redirect URI malformed or doesn't match":**

1. Check if current hostname matches configured OAuth redirect URIs
2. For deploy previews, redirect to main site for OAuth testing
3. Verify OAuth app configuration includes all needed URIs

### Implementation Pattern

```javascript
const handleOAuth = () => {
  const isDevelopment = process.env.NODE_ENV === "development"
  const currentHost = window.location.origin
  const isDeployPreview = currentHost.includes("deploy-preview")

  const redirectUri = isDevelopment
    ? "http://localhost:8000/callback/oauth"
    : isDeployPreview
    ? "https://brendantreed.com/callback/oauth" // Fallback to main site
    : `${currentHost}/callback/oauth`
}
```

### Testing OAuth

- **Local development**: Works with localhost redirect URI
- **Deploy previews**: Automatically redirects to main site
- **Production**: Test on `https://brendantreed.com/?admin`

## OAuth Token Management Workflow

### Complete OAuth Testing Process

1. **Trigger OAuth flow** (click re-auth button on Now page)
2. **Complete authorization** on Trakt.tv
3. **Copy new tokens** from callback page
4. **Update environment variables** in Netlify Dashboard
5. **Trigger deployment** (or wait for auto-deploy)
6. **Verify integration** works (401 errors should be resolved)

### Key Implementation Details

- **Frontend OAuth**: Uses dynamic redirect URI based on current hostname
- **Backend token exchange**: Matches redirect URI from request headers
- **Admin detection**: `?admin` parameter or development environment
- **Token display**: Production shows tokens for manual environment variable updates
- **Graceful fallbacks**: Public users see helpful messages, not technical errors

### Environment Variables Required

```
GATSBY_TRAKT_CLIENT_ID=your_client_id
GATSBY_TRAKT_CLIENT_SECRET=your_client_secret
GATSBY_TRAKT_ACCESS_TOKEN=your_access_token
GATSBY_TRAKT_REFRESH_TOKEN=your_refresh_token
```

### Post-OAuth Deployment Testing

After updating tokens and deploying:

1. Visit `/now` page (without `?admin`)
2. Verify "Reading" and "Listening" sections load
3. Verify "Watching" section shows data (not fallback message)
4. Check browser console for any remaining API errors
