# Personal Website

My personal website, built with Astro and hosted on Netlify.

## Quick Start

```bash
npm install
npm run dev
```

Visit [http://localhost:4321](http://localhost:4321).

For detailed setup instructions, see **[DEVELOPMENT_SETUP.md](DEVELOPMENT_SETUP.md)**.

## Notable Tools

- Built with Astro 5 / React 18 / Node 20+
- Hosted via Netlify
- Tailwind CSS v4 for styling
- Prettier + ESLint with pre-commit hooks
- Automatic token refresh for API integrations via Netlify Blobs

## Documentation

- **[DEVELOPMENT_SETUP.md](DEVELOPMENT_SETUP.md)** - Development environment setup
- **[CLAUDE.md](CLAUDE.md)** - Project architecture and implementation details
- **[TRAKT_SETUP.md](TRAKT_SETUP.md)** - OAuth integration and admin features

## OAuth Integration (Trakt)

The "/now" page integrates with Trakt.tv to display currently watching content. Tokens are managed automatically via Netlify Blobs with auto-refresh on expiry.

### Testing OAuth Flow

#### Option 1: Test on Production (Recommended)

```
https://brendanreed.net/now?admin
```

- Click "Re-authenticate with Trakt" button
- Tokens are saved to Netlify Blobs automatically

#### Option 2: Local Development

```bash
npm run dev
# Visit: http://localhost:4321/now?admin
```

### Troubleshooting OAuth

- **"Redirect URI malformed"**: Ensure the redirect URI in Trakt app settings matches the callback URL
- **401 errors**: Visit `/now?admin` and re-authenticate, or check Netlify function logs
- **502 errors**: Check Netlify function logs for details
