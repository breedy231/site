# Automated Alerts Setup for Trakt Token Refresh

Since Trakt access tokens expire every 24 hours, you need automated alerts when the system auto-refreshes tokens so you can update environment variables.

The system supports multiple notification methods - choose one or multiple:

## Option 1: Netlify Forms + Email (Recommended)

**Pros:** Built into Netlify, no external dependencies, reliable
**Cons:** Requires manual setup in Netlify dashboard

### Setup Steps:

1. **Deploy the form** (already included in your site)
   - File: `static/trakt-token-alerts.html`
   - Netlify will auto-detect this form after deployment

2. **Configure email notifications:**
   - Go to Netlify Dashboard → Site Settings → Forms
   - Find the "trakt-token-alert" form
   - Click "Settings" → "Form notifications"
   - Add your email address
   - Set up email templates (optional)

3. **Test the system:**
   - The form will trigger when tokens are auto-refreshed
   - You'll receive an email with token refresh details

## Option 2: Slack/Discord Webhook

**Pros:** Instant notifications, rich formatting, team visibility
**Cons:** Requires setting up webhook

### Setup Steps:

1. **Create webhook:**
   - **Slack:** Go to your workspace → Apps → Incoming Webhooks → Create
   - **Discord:** Server Settings → Integrations → Webhooks → New Webhook

2. **Add environment variable:**

   ```
   ADMIN_ALERT_WEBHOOK_URL=https://hooks.slack.com/your-webhook-url
   ```

3. **Messages will include:**
   - ✅ Success: "🔄 Trakt Tokens Auto-Refreshed - Action Required"
   - ❌ Failure: "🚨 Trakt Token Issue"
   - Direct links to admin panel
   - Timestamp and context

## Option 3: Direct Email Service

**Pros:** Complete control, custom templates
**Cons:** Requires email service setup (SendGrid, Mailgun, etc.)

### Setup Steps:

1. **Choose email service:**
   - SendGrid, Mailgun, AWS SES, etc.
   - Get API key and service endpoint

2. **Add environment variables:**

   ```
   EMAIL_SERVICE_URL=https://api.sendgrid.v3/mail/send
   EMAIL_API_KEY=your-api-key
   ADMIN_EMAIL=your-email@domain.com
   ```

3. **Customize the email format** in `sendEmailAlert()` function if needed

## Option 4: Multiple Methods (Recommended for Critical Sites)

Set up multiple notification methods for redundancy:

- **Primary:** Netlify Forms (reliable baseline)
- **Secondary:** Slack webhook (instant notification)
- **Backup:** Direct email (if webhook fails)

All methods run simultaneously using `Promise.allSettled()`, so failure in one doesn't affect others.

## Notification Triggers

### Successful Auto-Refresh

**When:** System successfully refreshes expired tokens
**Action Required:** ✅ Update environment variables in Netlify Dashboard
**Message Example:**

```
🔄 Trakt Tokens Auto-Refreshed

📋 Action Required: Update environment variables in Netlify Dashboard
🔗 Link: https://your-site.netlify.app/now?admin
📅 Time: 2025-01-15T10:30:00.000Z

⚡ The system successfully refreshed expired tokens, but manual environment variable updates are needed to persist the new tokens.
```

### Auto-Refresh Failure

**When:** System cannot refresh tokens (refresh token expired, API issues)
**Action Required:** ❌ Manual re-authentication needed
**Message Example:**

```
🚨 Trakt Token Issue

❌ Error: Trakt access token has expired. Please re-authenticate.
🔗 Fix: https://your-site.netlify.app/now?admin
📅 Time: 2025-01-15T10:30:00.000Z

🛠️ Please re-authenticate or check token configuration.
```

## Testing Alerts

### Test Netlify Forms:

1. Go to `/trakt-token-alerts.html` on your site
2. Submit the form manually to test email notifications

### Test Webhooks:

1. Add a test environment variable temporarily
2. Trigger a function that calls `notifyAdminOfTokenIssue("Test alert")`

### Test Auto-Refresh Flow:

1. Wait for token to expire naturally (24 hours)
2. Visit your site - auto-refresh should trigger
3. Check for notification within a few minutes

## Environment Variables Summary

**Required for all methods:**

```bash
# Your existing Trakt variables
GATSBY_TRAKT_CLIENT_ID=your_client_id
GATSBY_TRAKT_CLIENT_SECRET=your_client_secret
GATSBY_TRAKT_ACCESS_TOKEN=your_access_token
GATSBY_TRAKT_REFRESH_TOKEN=your_refresh_token

# For alerts
NETLIFY_URL=https://your-site.netlify.app
```

**Optional (choose based on notification method):**

```bash
# For webhooks (Slack/Discord)
ADMIN_ALERT_WEBHOOK_URL=https://hooks.slack.com/your-webhook

# For direct email
EMAIL_SERVICE_URL=https://api.sendgrid.v3/mail/send
EMAIL_API_KEY=your-email-api-key
ADMIN_EMAIL=your-email@domain.com
```

## Monitoring & Maintenance

- **Check function logs** regularly for alert delivery status
- **Update webhook URLs** if they change
- **Test notifications** monthly to ensure they're working
- **Monitor email delivery** - check spam folders initially

## Troubleshooting

**No notifications received:**

1. Check Netlify function logs for errors
2. Verify environment variables are set correctly
3. Test each notification method individually

**Notifications working but no token updates:**

1. Check if the alert contains the new token values
2. Verify you're updating the correct environment variables in Netlify
3. Ensure you're triggering a new deployment after updates

**Too many notifications:**

1. Check if multiple methods are configured (this is normal)
2. Verify tokens are being updated correctly (prevents repeated refresh attempts)

With these alerts, you'll be notified within minutes when tokens need updating, ensuring minimal downtime for your Trakt integration! 🔔
