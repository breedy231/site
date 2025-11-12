# Trakt Integration Admin Setup

## Overview

The Trakt integration now includes admin-only features that hide authentication errors from external visitors while providing you with notifications and easy re-authentication.

## Features Implemented

### 1. **Public vs Admin Experience**

- **External visitors**: See "Currently watching updates temporarily unavailable" with helpful message
- **Admin (you)**: See detailed error messages and re-authentication buttons
- **Admin detection**: Works via development mode, localhost access, or `?admin` query parameter

### 2. **Notification System**

When Trakt tokens expire, you'll be notified via:

- Console logs (development)
- Netlify Forms submissions (production)
- Optional: Email notifications through Netlify

### 3. **Graceful Fallbacks**

- External users never see technical error messages
- Page remains functional with other content (Reading, Listening sections)
- No broken authentication flows exposed to public

## Admin Access Methods

### Development

- Automatically detected when running `npm run develop-https`
- Full admin controls and error details visible

### Production Testing

- Add `?admin` to any URL: `https://brendantreed.com/now/?admin`
- Shows admin panel and detailed errors when tokens expire

### Localhost

- Any localhost access automatically grants admin privileges

## Email Notifications Setup (Optional)

To receive email alerts when tokens expire:

1. **Enable Netlify Forms notifications:**
   - Go to your Netlify dashboard
   - Navigate to Site Settings > Forms
   - Set up email notifications for the form named `trakt-token-alert`

2. **Alternative: Webhook notifications:**
   - Replace the Netlify Forms code with a webhook to your preferred service
   - Update the `notifyAdminOfTokenIssue` function in the serverless functions

## Token Refresh Workflow

### Automatic Token Refresh (New!)

The system now automatically refreshes expired tokens:

1. **Token expires**: API returns 401 error
2. **System detects**: Automatic refresh is triggered
3. **New tokens obtained**: Using stored refresh token
4. **Request retried**: Original API call succeeds with new token
5. **Users see data**: No interruption in service
6. **Admin notification**: New tokens logged for environment variable updates

### Manual Token Refresh (Fallback)

If automatic refresh fails, fallback to manual process:

1. **External visitors**: See graceful "temporarily unavailable" message
2. **You (admin)**: See prominent yellow admin notice at top of page
3. **Notification**: Automatic alert sent via configured method
4. **Re-authentication**: One-click button to restart OAuth flow
5. **Update environment**: Copy new tokens to environment variables
6. **Deploy**: Push changes to update production

## Files Modified

### Core Integration

- `src/pages/now.js` - Admin detection and UI changes
- `netlify/functions/history.js` - Notification system + automatic token refresh
- `src/api/history.js` - Local development notifications
- `static/trakt-alert.html` - Netlify Forms setup

### Automatic Token Refresh (Added)

- `netlify/functions/refresh-token.js` - Token refresh endpoint
- `src/utils/trakt-auth.js` - Frontend refresh token utility
- `src/pages/callback/oauth.js` - OAuth callback handler

## Testing

### Test Public Experience:

```bash
# Visit without admin privileges
curl https://brendantreed.com/now/
```

### Test Admin Experience:

```bash
# Visit with admin privileges
curl https://brendantreed.com/now/?admin
```

This setup ensures your personal site maintains a professional appearance for visitors while giving you full control and visibility into the system status.
