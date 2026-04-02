# Trakt Integration Setup

## Overview

This site uses the **free Trakt OAuth API** to display watch history on the "/now" page. Tokens are automatically refreshed via Netlify Blobs — no manual intervention needed unless the refresh token itself becomes invalid.

## How It Works

1. **OAuth Flow:** User authenticates via Trakt OAuth
2. **Token Storage:** Tokens stored in Netlify Blobs (seeded from env vars on first use)
3. **Auto-Refresh:** When access token expires, `history.js` detects the 401, refreshes via the refresh token, saves to Blobs, and retries
4. **API Calls:** Netlify function fetches 3 recent TV episodes and 3 recent movies
5. **Images:** TMDB API provides poster images (optional)

## Setup Instructions

### 1. Create a Trakt API Application

1. Go to https://trakt.tv/oauth/applications
2. Create a new application:
   - **Name:** Your site name
   - **Redirect URI:** `https://yourdomain.com/callback/oauth`
   - For local dev: Also add `http://localhost:4321/callback/oauth`
3. Save your Client ID and Client Secret

### 2. Configure Environment Variables

Add to Netlify (Site Settings > Environment Variables):

```bash
# Required
TRAKT_CLIENT_ID=your_client_id_here
TRAKT_CLIENT_SECRET=your_client_secret_here
TRAKT_ACCESS_TOKEN=your_initial_access_token
TRAKT_REFRESH_TOKEN=your_initial_refresh_token

# Client-side (for OAuth redirect URL in the browser)
PUBLIC_TRAKT_CLIENT_ID=your_client_id_here

# Optional (for poster images)
TMDB_API_KEY=your_tmdb_key
```

After the first successful request, `TRAKT_ACCESS_TOKEN` and `TRAKT_REFRESH_TOKEN` are no longer read from env vars — Netlify Blobs becomes the source of truth. They can be kept as a fallback if Blobs is cleared.

### 3. Get Initial Access Tokens

**Development:**

1. Run `npm run dev`
2. Visit `http://localhost:4321/now?admin`
3. Click "Re-authenticate"
4. Authorize on Trakt.tv
5. Tokens are displayed on the callback page — add to your `.env` file

**Production:**

1. Visit `https://yourdomain.com/now?admin`
2. Click "Re-authenticate"
3. Authorize on Trakt.tv
4. Tokens are saved to Netlify Blobs automatically

### 4. Token Lifecycle

- **Access tokens expire:** Every ~3 months
- **Auto-refresh:** Handled automatically by `history.js` via Netlify Blobs
- **Manual re-auth:** Only needed if the refresh token itself becomes invalid
- **Test refresh flow:** Hit `/.netlify/functions/history?force-refresh=true`

## Files Involved

### Netlify Functions

- `netlify/functions/history.js` - Fetches watch history, auto-refreshes on 401
- `netlify/functions/trakt-token.js` - OAuth token exchange, saves to Blobs
- `netlify/functions/lib/trakt-tokens.js` - Token storage/retrieval/refresh via Blobs

### Frontend

- `src/components/NowPage.jsx` - Displays watch history (React island)
- `src/components/OAuthCallback.jsx` - OAuth callback handler (React island)
- `src/components/mediaDisplay.jsx` - BookDisplay, WatchDisplay, TrackDisplay components

## Admin Access

Access admin features (re-auth button, detailed errors) via:

- `?admin` query parameter (e.g., `/now?admin`)
- Development mode (`npm run dev`)
- Localhost access

## Troubleshooting

### "Token expired" / 401 errors

The system should auto-refresh. If it doesn't:

1. Visit `/now?admin`
2. Click "Re-authenticate"
3. Tokens are saved to Blobs automatically

### Cloudflare blocking requests

All Trakt API requests must include a `User-Agent` header or Cloudflare blocks them from Netlify's server IPs. This is set to `brendanreed-site/1.0` in `history.js` and `lib/trakt-tokens.js`.

### TMDB images not loading

- TMDB API key is optional but recommended
- Get a free key at https://www.themoviedb.org/settings/api
- Add as `TMDB_API_KEY` in Netlify env vars

### Redirect URI mismatch

- Verify redirect URI in Trakt app settings matches the callback URL exactly
- Dev: `http://localhost:4321/callback/oauth`
- Prod: `https://yourdomain.com/callback/oauth`
