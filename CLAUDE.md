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
    ? "https://main-site.netlify.app/callback/oauth" // Fallback to main site
    : `${currentHost}/callback/oauth`
}
```

### Testing OAuth

- **Local development**: Works with localhost redirect URI
- **Deploy previews**: Automatically redirects to main site
- **Production**: Test on `https://main-site.netlify.app/?admin`
