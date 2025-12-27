# Simplified Trakt Integration Setup

## Overview

This site uses the **free Trakt OAuth API** to display watch history on the "Now" page. No paid VIP subscription is required.

## Key Simplifications (January 2025)

- Removed automatic token refresh system
- Removed admin notification system
- Removed complex error handling
- **Result:** Reduced from ~500 lines to ~200 lines of code
- **Cost savings:** $30-60/year (no VIP needed)

## How It Works

1. **OAuth Flow:** User authenticates via Trakt OAuth
2. **Token Storage:** Access tokens stored in Netlify environment variables
3. **API Calls:** Netlify function fetches recent watch history
4. **Display:** Frontend shows 3 recent TV episodes and 3 recent movies
5. **Images:** TMDB API provides poster images

## Setup Instructions

### 1. Create a Trakt API Application

1. Go to https://trakt.tv/oauth/applications
2. Create a new application:
   - **Name:** Your site name
   - **Redirect URI:** `https://yourdomain.com/callback/oauth`
   - For local dev: Also add `http://localhost:8000/callback/oauth`
3. Save your Client ID and Client Secret

### 2. Configure Environment Variables

Add to Netlify (Site Settings → Environment Variables):

```bash
# Trakt OAuth
GATSBY_TRAKT_CLIENT_ID=your_client_id_here
GATSBY_TRAKT_CLIENT_SECRET=your_client_secret_here
GATSBY_TRAKT_ACCESS_TOKEN=will_get_after_oauth
GATSBY_TRAKT_REFRESH_TOKEN=will_get_after_oauth

# TMDB (for poster images) - Optional but recommended
GATSBY_TMDB_API_KEY=your_tmdb_key
```

### 3. Get Access Tokens

**Development:**

1. Run `npm run develop`
2. Visit `http://localhost:8000/now?admin`
3. Click "Re-authenticate" if you see an error
4. Authorize on Trakt.tv
5. Copy tokens from callback page
6. Add to `.env.development`

**Production:**

1. Visit `https://yourdomain.com/now?admin`
2. Click "Re-authenticate"
3. Authorize on Trakt.tv
4. Copy tokens from callback page
5. Add to Netlify environment variables
6. Trigger new deployment

### 4. Token Lifecycle

- **Access tokens expire:** Every ~3 months
- **Refresh tokens expire:** Every ~3 months (unused)
- **When expired:** Simply re-authenticate using the same OAuth flow
- **No automation:** Manual re-auth every few months is simple and reliable

## Files Involved

### Netlify Functions

- `netlify/functions/history.js` - Fetches watch history from Trakt API
- `netlify/functions/trakt-token.js` - OAuth token exchange

### Frontend

- `src/pages/now.js` - Displays watch history
- `src/pages/callback/oauth.js` - OAuth callback handler
- `src/components/mediaDisplay.js` - Display components

## Testing

### Admin Access

Access admin features via any of these methods:

- `?admin` query parameter (e.g., `/now?admin`)
- Development mode (`npm run develop`)
- Localhost access

### Re-authentication

When tokens expire (~3 months):

1. Visit `/now?admin`
2. See re-authenticate button in error message
3. Click button → authorize → copy new tokens
4. Update environment variables
5. Redeploy (production only)

## Troubleshooting

### "Token expired" error

- Visit `/now?admin`
- Click "Re-authenticate"
- Update environment variables with new tokens

### "No authentication token provided"

- Check that `GATSBY_TRAKT_ACCESS_TOKEN` is set in environment variables
- Verify environment variable starts with `GATSBY_` prefix (required for frontend)

### Redirect URI mismatch

- Verify redirect URI in Trakt app settings matches exactly
- Check for trailing slashes (should not have one)
- Ensure protocol matches (http vs https)

### TMDB images not loading

- TMDB API key is optional but recommended
- Get free key at https://www.themoviedb.org/settings/api
- Add as `GATSBY_TMDB_API_KEY`

## Cost Comparison

| Setup                    | Annual Cost | Maintenance                      | Complexity |
| ------------------------ | ----------- | -------------------------------- | ---------- |
| **Current (Simplified)** | $0          | Re-auth every 3 months           | Low        |
| Previous (Auto-refresh)  | $0          | Auto-refresh, manual env updates | High       |
| Trakt VIP RSS            | $30-60      | Minimal                          | Very Low   |

## Migration Notes

If upgrading from the previous complex setup:

**Removed files:**

- `netlify/functions/refresh-token.js`
- `src/utils/trakt-auth.js`
- `static/trakt-token-alerts.html`
- `static/trakt-alert.html`
- `src/pages/callback/trakt.js` (duplicate)

**Removed features:**

- Automatic token refresh
- Admin email notifications
- Webhook alerts
- Complex admin banners

**Environment variables no longer needed:**

- `ADMIN_ALERT_WEBHOOK_URL`
- `EMAIL_SERVICE_URL`
- `EMAIL_API_KEY`
- `ADMIN_EMAIL`

## FAQ

**Q: Do I need Trakt VIP?**
A: No! The OAuth API is completely free.

**Q: How often do I need to re-authenticate?**
A: About every 3 months when tokens expire.

**Q: Can I automate token refresh?**
A: Yes, but it adds complexity. The previous auto-refresh system required environment variable updates anyway, so manual re-auth every 3 months is simpler.

**Q: What happens when tokens expire?**
A: Admins see a re-authenticate button. Public visitors see a friendly "temporarily unavailable" message.

**Q: Can I track this automatically from my viewing habits?**
A: Trakt doesn't auto-track. You need to use Plex/Jellyfin scrobblers or track manually at trakt.tv.

## Support

For Trakt API issues: https://trakt.tv/support
For TMDB API issues: https://www.themoviedb.org/talk
