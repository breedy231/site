# Personal Website

This is my personal website, brought to you by Gatsby. I'm developing it on a Raspberry Pi 4.

## Quick Start

```bash
npm install
npm run develop
```

For detailed setup instructions, see **[DEVELOPMENT_SETUP.md](DEVELOPMENT_SETUP.md)**.

## Notable Tools

- Built using Gatsby 5 / React 18 / Node 18.
- Hosted via Netlify.
- Requests made via Axios.
- Prettier + ESLint with pre-commit hooks.
- Automatic token refresh for API integrations.

## Documentation

- **[DEVELOPMENT_SETUP.md](DEVELOPMENT_SETUP.md)** - Complete development environment setup
- **[CLAUDE.md](CLAUDE.md)** - Project architecture and implementation details
- **[TRAKT_SETUP.md](TRAKT_SETUP.md)** - OAuth integration and admin features
- **[AUTOMATED_ALERTS_SETUP.md](AUTOMATED_ALERTS_SETUP.md)** - Alert system configuration

# OAuth Integration Testing

## Trakt API Integration

The "Now" page includes integration with Trakt.tv to display currently watching content. The OAuth flow requires testing and token management.

### Testing OAuth Flow

#### Option 1: Test on Production (Recommended)

```
https://brendantreed.com/now/?admin
```

- No additional configuration needed
- Click "Re-authenticate with Trakt" button
- Follow OAuth flow and copy new tokens to Netlify environment variables

#### Option 2: Test on Deploy Previews

For testing on deploy preview URLs:

1. **Add temporary redirect URI to Trakt app:**
   - Go to your Trakt.tv app settings
   - Add the deploy preview callback URL (shown in alert when clicking re-auth button)
   - Example: `https://deploy-preview-X--site.netlify.app/callback/trakt`

2. **Complete OAuth flow**
3. **Remove temporary URL** from Trakt app after testing

#### Option 3: Local Development

```bash
npm run develop
# Visit: http://localhost:8000/now/?admin
```

### Updating Environment Variables

After successful OAuth authentication:

1. **Copy the displayed tokens** from the callback page
2. **Go to Netlify Dashboard** → Site Settings → Environment Variables
3. **Update these variables:**
   ```
   GATSBY_TRAKT_ACCESS_TOKEN=your_new_access_token
   GATSBY_TRAKT_REFRESH_TOKEN=your_new_refresh_token
   ```
4. **Trigger new deployment** for changes to take effect
5. **Verify** that the "Now" page shows Trakt data instead of 401 errors

### Troubleshooting OAuth

- **"Redirect URI malformed"**: Ensure the redirect URI in authorization request matches exactly in token exchange
- **401 errors**: Check that environment variables are updated and deployment completed
- **502 errors**: Verify Netlify functions are using modern syntax (`export default`, `new Response()`)

# Codespace support

This repo is setup to be run via Codespaces. To do that, click the button at the top of the page, and when the page is loaded you can run the site with `gatsby develop -H 0.0.0.0`
