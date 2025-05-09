// routes/oauth.js
const express = require('express');
const { encrypt, decrypt } = require('../utils/crypto');

const router = express.Router();

const {
  OWN_URL,
  REVIEW_APP_FRONTEND_HOST,
  AUTH0_URL,
  AUTH0_CLIENT_ID,
  AUTH0_CLIENT_SECRET,
  AUTH0_ENCRYPTION_KEY
} = process.env;

/**
 * @swagger
 * tags:
 *   name: OAuth
 *   description: OAuth login and callback handling
 */

/**
 * @swagger
 * /api/oauth/login:
 *   get:
 *     summary: Redirect to Auth0 login
 *     tags: [OAuth]
 *     parameters:
 *       - in: query
 *         name: redirectTo
 *         schema:
 *           type: string
 *         required: false
 *         description: URL to redirect to after login
 *     responses:
 *       302:
 *         description: Redirect to Auth0 login
 */
router.get("/login", (req, res) => {
  const { redirectTo } = req.query;
  
  const state = encrypt(JSON.stringify({
    origin: redirectTo || req.get("origin") || REVIEW_APP_FRONTEND_HOST
  }), { encryptionKey: AUTH0_ENCRYPTION_KEY, encoding: "base64url" });
  
  const query = `client_id=${AUTH0_CLIENT_ID}&response_type=code&redirect_uri=${OWN_URL}/api/oauth/callback&scope=openid profile email&state=${state}`;
  const url = `${AUTH0_URL}/authorize?${query}`;
  
  return res.redirect(url);
});

/**
 * @swagger
 * /api/oauth/callback:
 *   get:
 *     summary: Handle Auth0 OAuth callback
 *     tags: [OAuth]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         required: false
 *         description: Authorization code returned from Auth0
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         required: false
 *         description: Encrypted state with origin
 *       - in: query
 *         name: setup_action
 *         schema:
 *           type: string
 *         required: false
 *         description: Optional setup action, e.g., "install"
 *     responses:
 *       302:
 *         description: Redirects user back to frontend with tokens or error
 */
router.get("/callback", async (req, res) => {
  const { code, state, setup_action: setupAction } = req.query;
  let origin = REVIEW_APP_FRONTEND_HOST;
  
  try {
    const stateData = JSON.parse(decrypt(state, { 
      encryptionKey: AUTH0_ENCRYPTION_KEY, 
      encoding: "base64url" 
    }));
    origin = stateData.origin;
  } catch (error) {
    console.error('Error decrypting state:', error);
  }
  
  if (!code) {
    return res.redirect(`${origin}?error=code_required`);
  }
  
  if (setupAction === "install") {
    return res.redirect(origin);
  }
  
  try {
    const auth0 = require('../services/auth0')();
    const response = await auth0("oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: AUTH0_CLIENT_ID,
        client_secret: AUTH0_CLIENT_SECRET,
        code,
        redirect_uri: `${OWN_URL}/api/oauth/callback`
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch token: ${response.statusText}`);
    }
    
    const body = await response.json();
    const queries = {
      accessToken: body.access_token,
      ...(body.refresh_token ? { refreshToken: body.refresh_token } : {}),
      origin
    };
    
    const url = `${OWN_URL}/api/auth?${new URLSearchParams(queries)}`;
    return res.redirect(url);
  } catch (error) {
    console.error('Auth0 token exchange error:', error);
    return res.redirect(`${origin}?error=auth0_error`);
  }
});

module.exports = router;
