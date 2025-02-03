// scripts/get-trakt-tokens.mjs
import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';

const app = express();
const PORT = 8888;

// Load these from .env file
const CLIENT_ID = process.env.TRAKT_CLIENT_ID;
const CLIENT_SECRET = process.env.TRAKT_CLIENT_SECRET;
const REDIRECT_URI = `http://localhost:${PORT}/callback/trakt`;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing TRAKT_CLIENT_ID or TRAKT_CLIENT_SECRET in .env file');
  process.exit(1);
}

app.get('/auth', (req, res) => {
  const authUrl = `https://trakt.tv/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}`;
  res.redirect(authUrl);
});

app.get('/callback/trakt', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    res.send('No authorization code received');
    return;
  }

  try {
    const response = await fetch('https://api.trakt.tv/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to exchange token');
    }

    // Display the tokens
    res.send(`
      <h1>Authentication Successful!</h1>
      <p>Add these values to your Netlify environment variables:</p>
      <pre>
TRAKT_ACCESS_TOKEN=${data.access_token}
TRAKT_REFRESH_TOKEN=${data.refresh_token}
      </pre>
      <p>You can now close this window and stop the script.</p>
    `);

    // Optional: Log to console as well
    console.log('\nAuthentication successful! Here are your tokens:\n');
    console.log(`TRAKT_ACCESS_TOKEN=${data.access_token}`);
    console.log(`TRAKT_REFRESH_TOKEN=${data.refresh_token}\n`);

  } catch (error) {
    console.error('Error exchanging code for token:', error);
    res.status(500).send('Error getting tokens');
  }
});

app.listen(PORT, () => {
  console.log(`\nServer running at http://localhost:${PORT}`);
  console.log(`\nTo start the authentication process, visit:\nhttp://localhost:${PORT}/auth\n`);
});