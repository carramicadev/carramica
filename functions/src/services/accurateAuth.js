/**
 * Accurate OAuth Service
 *
 * Handles OAuth 2.0 authentication with Accurate API
 * - Token management (get, refresh, store)
 * - OAuth callback handling
 * - Session management (open-db)
 */

const axios = require("axios");
const admin = require("firebase-admin");
const {
  ACCURATE_ACCOUNT_API,
  ACCURATE_API_HOST,
  ACCURATE_OAUTH_AUTHORIZE,
  ACCURATE_OAUTH_TOKEN,
  ACCURATE_CLIENT_ID,
  ACCURATE_CLIENT_SECRET,
  ACCURATE_CALLBACK_URL,
  ACCURATE_DEFAULT_DATABASE_ID,
  COLLECTION_ACCURATE_TOKENS,
  COLLECTION_ACCURATE_CONFIG,
  TOKEN_EXPIRATION_BUFFER_MS,
  TOKEN_CACHE_DURATION,
} = require("../constants/accurateConstants");

// Token cache (in-memory)
let cachedTokens = null;
let tokenCacheTime = 0;

/**
 * Build OAuth Authorization URL
 * Redirect user to this URL to initiate OAuth flow
 *
 * @returns {string} Authorization URL
 */
function getAuthorizationUrl() {
  const params = new URLSearchParams({
    client_id: ACCURATE_CLIENT_ID,
    redirect_uri: ACCURATE_CALLBACK_URL,
    response_type: "code",
    // Accurate API scopes - sesuai dengan yang berhasil di Postman
    scope: "item_view customer_view sales_order_save sales_order_view",
  });

  return `${ACCURATE_OAUTH_AUTHORIZE}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 *
 * @param {string} code - Authorization code from OAuth callback
 * @returns {Object} Token data { accessToken, refreshToken, expiresIn }
 */
async function exchangeCodeForToken(code) {
  try {
    console.log("[ACCURATE-AUTH] Exchanging authorization code for token...");
    console.log("[ACCURATE-AUTH] Code length:", code ? code.length : 0);
    console.log("[ACCURATE-AUTH] OAuth URL:", ACCURATE_OAUTH_TOKEN);

    // Create Basic Auth header (base64 of client_id:client_secret)
    const auth = Buffer.from(`${ACCURATE_CLIENT_ID}:${ACCURATE_CLIENT_SECRET}`).toString("base64");
    console.log("[ACCURATE-AUTH] Auth header created, length:", auth.length);

    // Accurate requires x-www-form-urlencoded format
    const params = new URLSearchParams();
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", ACCURATE_CALLBACK_URL);

    const bodyString = params.toString();
    console.log("[ACCURATE-AUTH] Request body:", bodyString);

    const response = await axios.post(
      ACCURATE_OAUTH_TOKEN,
      bodyString,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${auth}`,
        },
        timeout: 30000,
      }
    );

    console.log("[ACCURATE-AUTH] Response status:", response.status);
    console.log("[ACCURATE-AUTH] Response data keys:", Object.keys(response.data || {}));

    if (response.data.access_token) {
      console.log("[ACCURATE-AUTH] Token obtained successfully");

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type || "Bearer",
      };
    }

    throw new Error("No access_token in response: " + JSON.stringify(response.data));
  } catch (error) {
    console.error("[ACCURATE-AUTH] Error exchanging code for token:", error.message);
    console.error("[ACCURATE-AUTH] Error name:", error.name);
    if (error.response) {
      console.error("[ACCURATE-AUTH] Response status:", error.response.status);
      console.error("[ACCURATE-AUTH] Response data:", JSON.stringify(error.response.data));
      console.error("[ACCURATE-AUTH] Response headers:", JSON.stringify(error.response.headers));
    } else if (error.request) {
      console.error("[ACCURATE-AUTH] No response received");
      console.error("[ACCURATE-AUTH] Error request:", error.request);
    }
    throw error;
  }
}

/**
 * Refresh access token using refresh token
 *
 * @param {string} refreshToken - Refresh token
 * @returns {Object} New token data
 */
async function refreshAccessToken(refreshToken) {
  try {
    console.log("[ACCURATE-AUTH] Refreshing access token...");

    // Create Basic Auth header (base64 of client_id:client_secret)
    const auth = Buffer.from(`${ACCURATE_CLIENT_ID}:${ACCURATE_CLIENT_SECRET}`).toString("base64");

    // Accurate requires x-www-form-urlencoded format
    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", refreshToken);

    const response = await axios.post(
      ACCURATE_OAUTH_TOKEN,
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${auth}`,  // Basic Auth header
        },
        timeout: 30000,
      }
    );

    if (response.data.access_token) {
      console.log("[ACCURATE-AUTH] Token refreshed successfully");

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token || refreshToken, // Keep old if not provided
        expiresIn: response.data.expires_in,
        tokenType: response.data.token_type || "Bearer",
      };
    }

    throw new Error("No access_token in refresh response");
  } catch (error) {
    console.error("[ACCURATE-AUTH] Error refreshing token:", error.message);
    throw error;
  }
}

/**
 * Get cached tokens or fetch new ones from Firestore
 *
 * @returns {Object|null} Cached token data or null if not connected
 */
async function getCachedTokens() {
  const now = Date.now();

  // Return cached if still valid
  if (cachedTokens && (now - tokenCacheTime) < TOKEN_CACHE_DURATION) {
    console.log("[ACCURATE-AUTH] Using cached tokens");
    return cachedTokens;
  }

  // Fetch from Firestore
  try {
    console.log("[ACCURATE-AUTH] Fetching tokens from Firestore...");
    const db = admin.firestore();
    const tokensDoc = await db.collection(COLLECTION_ACCURATE_TOKENS).doc("main").get();

    if (tokensDoc.exists) {
      const data = tokensDoc.data();
      console.log("[ACCURATE-AUTH] Loaded tokens from Firestore");
      cachedTokens = data;
      tokenCacheTime = now;
      return data;
    }

    console.log("[ACCURATE-AUTH] No tokens found in Firestore");
    return null;
  } catch (error) {
    console.error("[ACCURATE-AUTH] Error fetching tokens from Firestore:", error.message);
    return null;
  }
}

/**
 * Get valid access token
 * Uses cached token, refreshes if needed, or returns null if not connected
 *
 * @returns {string|null} Valid access token or null
 */
async function getAccessToken() {
  const tokens = await getCachedTokens();

  if (!tokens) {
    console.log("[ACCURATE-AUTH] No tokens available");
    return null;
  }

  // Check if token is expired or about to expire
  const expiresAt = tokens.expiresAt ? tokens.expiresAt.toDate() : null;

  if (expiresAt) {
    const timeUntilExpiry = expiresAt.getTime() - Date.now();

    if (timeUntilExpiry <= 0) {
      console.log("[ACCURATE-AUTH] Token expired, refreshing...");
      return await refreshToken();
    }

    if (timeUntilExpiry < TOKEN_EXPIRATION_BUFFER_MS) {
      console.log("[ACCURATE-AUTH] Token expiring soon, refreshing...");
      return await refreshToken();
    }
  }

  return tokens.accessToken;
}

/**
 * Refresh token and update Firestore
 *
 * @returns {string|null} New access token or null
 */
async function refreshToken() {
  const tokens = await getCachedTokens();

  if (!tokens || !tokens.refreshToken) {
    console.log("[ACCURATE-AUTH] Cannot refresh - no refresh token");
    return null;
  }

  try {
    const newTokens = await refreshAccessToken(tokens.refreshToken);

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + newTokens.expiresIn * 1000);

    // Update in Firestore
    const db = admin.firestore();
    await db.collection(COLLECTION_ACCURATE_TOKENS).doc("main").set(
      {
        ...tokens,
        ...newTokens,
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        lastRefreshAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      },
      { merge: true }
    );

    // Update cache
    cachedTokens = {
      ...tokens,
      ...newTokens,
      expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
    };
    tokenCacheTime = Date.now();

    console.log("[ACCURATE-AUTH] Token refreshed and saved to Firestore");
    return newTokens.accessToken;
  } catch (error) {
    console.error("[ACCURATE-AUTH] Failed to refresh token:", error.message);
    return null;
  }
}

/**
 * Store tokens in Firestore
 *
 * @param {Object} tokenData - Token data from OAuth exchange
 * @returns {boolean} Success status
 */
async function storeTokens(tokenData) {
  console.log("[ACCURATE-AUTH] storeTokens called with:", {
    hasAccessToken: !!tokenData.accessToken,
    hasRefreshToken: !!tokenData.refreshToken,
    expiresIn: tokenData.expiresIn,
    tokenType: tokenData.tokenType
  });

  try {
    console.log("[ACCURATE-AUTH] Using Firebase Admin SDK...");

    // Set a timeout for the entire operation
    const timeout = 10000; // 10 seconds

    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Operation timed out after 10 seconds")), timeout);
    });

    // The actual store operation
    const storePromise = (async () => {
      // Get Firestore instance
      let db;
      try {
        console.log("[ACCURATE-AUTH] Getting Firestore...");
        db = admin.firestore();
        console.log("[ACCURATE-AUTH] Firestore instance obtained, type:", typeof db);
        console.log("[ACCURATE-AUTH] Firestore app:", db.app ? "exists" : "no app");
      } catch (firestoreError) {
        console.error("[ACCURATE-AUTH] Error getting Firestore:", firestoreError.message);
        throw firestoreError;
      }

      const expiresAt = new Date(Date.now() + tokenData.expiresIn * 1000);

      const tokenDoc = {
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        tokenType: tokenData.tokenType || "Bearer",
        expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
        connectedAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
        lastRefreshAt: null,
      };

      console.log("[ACCURATE-AUTH] Token document prepared, writing to:", `${COLLECTION_ACCURATE_TOKENS}/main`);

      try {
        await db.doc(`${COLLECTION_ACCURATE_TOKENS}/main`).set(tokenDoc);
        console.log("[ACCURATE-AUTH] Firestore write completed!");
      } catch (writeError) {
        console.error("[ACCURATE-AUTH] Error writing to Firestore:", writeError.message);
        console.error("[ACCURATE-AUTH] Write error code:", writeError.code);
        throw writeError;
      }

      // Update cache
      cachedTokens = tokenDoc;
      tokenCacheTime = Date.now();

      return true;
    })();

    // Race between store operation and timeout
    const result = await Promise.race([storePromise, timeoutPromise]);

    console.log("[ACCURATE-AUTH] Tokens stored successfully - returning TRUE");
    return result;
  } catch (error) {
    console.error("[ACCURATE-AUTH] STORE FAILED - Error details:");
    console.error("[ACCURATE-AUTH]   Message:", error.message);
    console.error("[ACCURATE-AUTH]   Name:", error.name);
    console.error("[ACCURATE-AUTH]   Stack:", error.stack);

    return false;
  }
}

/**
 * Open database and get session with dynamic host
 * This must be called before making API requests
 *
 * @returns {Object|null} { session, host, databaseId, databaseName } or null
 */
async function openDatabase() {
  try {
    const accessToken = await getAccessToken();

    if (!accessToken) {
      console.error("[ACCURATE-AUTH] No access token available");
      return null;
    }

    console.log("[ACCURATE-AUTH] Opening database:", ACCURATE_DEFAULT_DATABASE_ID);
    console.log("[ACCURATE-AUTH] Using API host:", ACCURATE_API_HOST);

    const response = await axios.get(`${ACCURATE_API_HOST}/api/open-db.do`, {
      params: { id: ACCURATE_DEFAULT_DATABASE_ID },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      timeout: 30000,
    });

    console.log("[ACCURATE-AUTH] Response:", JSON.stringify(response.data));

    if (response.data.s) {
      const { session, host } = response.data;

      console.log("[ACCURATE-AUTH] Database opened successfully");
      console.log("[ACCURATE-AUTH] Host:", host);
      console.log("[ACCURATE-AUTH] Session:", session ? session.substring(0, 20) + "..." : "N/A");

      // Update host in Firestore for reference
      const db = admin.firestore();
      await db.collection(COLLECTION_ACCURATE_TOKENS).doc("main").set(
        {
          session: session,
          host: host,
          databaseId: ACCURATE_DEFAULT_DATABASE_ID,
          databaseName: ACCURATE_DEFAULT_DATABASE_NAME,
          lastOpenDbAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
        },
        { merge: true }
      );

      return {
        session: session,
        host: host,
        databaseId: ACCURATE_DEFAULT_DATABASE_ID,
        databaseName: ACCURATE_DEFAULT_DATABASE_NAME,
      };
    }

    console.error("[ACCURATE-AUTH] Failed to open database - s flag is false:", response.data);
    return null;
  } catch (error) {
    console.error("[ACCURATE-AUTH] Error opening database:", error.message);
    console.error("[ACCURATE-AUTH] Error name:", error.name);
    if (error.response) {
      console.error("[ACCURATE-AUTH] Response status:", error.response.status);
      console.error("[ACCURATE-AUTH] Response data:", JSON.stringify(error.response.data));
      console.error("[ACCURATE-AUTH] Response headers:", JSON.stringify(error.response.headers));
    } else if (error.request) {
      console.error("[ACCURATE-AUTH] No response received - request:", error.request);
    }
    return null;
  }
}

/**
 * Get active session with dynamic host
 * Opens database if needed
 *
 * @returns {Object|null} { session, host, accessToken } or null
 */
async function getActiveSession() {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    console.error("[ACCURATE-AUTH] No access token available");
    return null;
  }

  // Get session from cached tokens first
  const tokens = await getCachedTokens();

  if (tokens && tokens.session && tokens.host) {
    // Validate session by trying a simple API call
    try {
      const testResponse = await axios.get(
        `${tokens.host}/accurate/api/branch/list.do`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Session-Id": tokens.session,
          },
          timeout: 10000,
        }
      );

      // Session is valid
      return {
        session: tokens.session,
        host: tokens.host,
        accessToken: accessToken,
      };
    } catch (error) {
      console.log("[ACCURATE-AUTH] Session expired or invalid, re-opening database...");
    }
  }

  // Need to open database
  const dbInfo = await openDatabase();

  if (!dbInfo) {
    console.error("[ACCURATE-AUTH] Could not open database");
    return null;
  }

  return {
    session: dbInfo.session,
    host: dbInfo.host,
    accessToken: accessToken,
  };
}

/**
 * Check if Accurate is connected (has valid tokens)
 *
 * @returns {boolean} Connection status
 */
async function isConnected() {
  const accessToken = await getAccessToken();
  return accessToken !== null;
}

/**
 * Disconnect Accurate (clear tokens)
 *
 * @returns {boolean} Success status
 */
async function disconnect() {
  try {
    const db = admin.firestore();
    await db.collection(COLLECTION_ACCURATE_TOKENS).doc("main").delete();

    // Clear cache
    cachedTokens = null;
    tokenCacheTime = 0;

    console.log("[ACCURATE-AUTH] Disconnected from Accurate");
    return true;
  } catch (error) {
    console.error("[ACCURATE-AUTH] Error disconnecting:", error.message);
    return false;
  }
}

/**
 * Clear token cache (force refresh on next call)
 */
function clearCache() {
  cachedTokens = null;
  tokenCacheTime = 0;
  console.log("[ACCURATE-AUTH] Cache cleared");
}

module.exports = {
  // OAuth URLs
  getAuthorizationUrl,

  // Token management
  exchangeCodeForToken,
  refreshAccessToken,
  storeTokens,
  getAccessToken,
  refreshToken,
  isConnected,
  disconnect,
  clearCache,

  // Session management
  openDatabase,
  getActiveSession,

  // Cache
  getCachedTokens,
};
