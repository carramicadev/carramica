/**
 * Accurate OAuth Configuration & Constants
 *
 * Configuration for Accurate API OAuth 2.0 integration
 */

// Accurate Account API (for OAuth)
const ACCURATE_ACCOUNT_API = "https://account.accurate.id";
const ACCURATE_OAUTH_AUTHORIZE = "https://account.accurate.id/oauth/authorize";
const ACCURATE_OAUTH_TOKEN = "https://account.accurate.id/oauth/token";  // TANPA /api!

// Accurate OAuth Credentials
// TODO: Move to Firebase Functions config for production
const ACCURATE_CLIENT_ID = "54be850d-61c2-40c6-ab61-9ed9b92c5a72";
const ACCURATE_CLIENT_SECRET = "f1063c05f09901d0bfc2a40d2ae0d3e7";

// Callback URL - Cloud Function endpoint
const ACCURATE_CALLBACK_URL = "https://asia-southeast2-carramica-prod.cloudfunctions.net/accurateOAuthCallback";

// Default Database ID - PT Carramica Kreasi Indonesia
const ACCURATE_DEFAULT_DATABASE_ID = 2828596;
const ACCURATE_DEFAULT_DATABASE_NAME = "PT Carramica Kreasi Indonesia";

// Firestore Collections
const COLLECTION_ACCURATE_SETTINGS = "accurate_settings";
const COLLECTION_ACCURATE_CONFIG = "accurate_settings/config";
const COLLECTION_ACCURATE_TOKENS = "accurate_settings/tokens";
const COLLECTION_ACCURATE_LOGS = "accurate_sync_logs";

// Token expiration buffer (refresh 1 hour before actual expiration)
const TOKEN_EXPIRATION_BUFFER_MS = 60 * 60 * 1000; // 1 hour

// Cache duration
const TOKEN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Sync intervals
const DEFAULT_STOCK_SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const DEFAULT_ORDER_SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Accurate API Endpoints (relative to dynamic host)
const ACCURATE_ENDPOINTS = {
  // Database
  OPEN_DB: "/api/open-db.do",

  // Item
  ITEM_LIST: "/accurate/api/item/list.do",
  ITEM_DETAIL: "/accurate/api/item/detail.do",

  // Sales Order
  SALES_ORDER_LIST: "/accurate/api/sales-order/list.do",
  SALES_ORDER_SAVE: "/accurate/api/sales-order/save.do",
  SALES_ORDER_DETAIL: "/accurate/api/sales-order/detail.do",

  // Customer
  CUSTOMER_LIST: "/accurate/api/customer/list.do",
  CUSTOMER_SAVE: "/accurate/api/customer/save.do",

  // Branch
  BRANCH_LIST: "/accurate/api/branch/list.do",
};

module.exports = {
  // API URLs
  ACCURATE_ACCOUNT_API,
  ACCURATE_OAUTH_AUTHORIZE,
  ACCURATE_OAUTH_TOKEN,
  ACCURATE_CLIENT_ID,
  ACCURATE_CLIENT_SECRET,
  ACCURATE_CALLBACK_URL,
  ACCURATE_DEFAULT_DATABASE_ID,
  ACCURATE_DEFAULT_DATABASE_NAME,

  // Collections
  COLLECTION_ACCURATE_SETTINGS,
  COLLECTION_ACCURATE_CONFIG,
  COLLECTION_ACCURATE_TOKENS,
  COLLECTION_ACCURATE_LOGS,

  // Constants
  TOKEN_EXPIRATION_BUFFER_MS,
  TOKEN_CACHE_DURATION,
  DEFAULT_STOCK_SYNC_INTERVAL_MS,
  DEFAULT_ORDER_SYNC_INTERVAL_MS,
  ACCURATE_ENDPOINTS,
};
