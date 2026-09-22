/**
 * Accurate API Client
 *
 * Handles all API calls to Accurate using dynamic host
 * - Item operations (list, detail, create, update)
 * - Sales Order operations (list, create, detail)
 * - Customer operations
 */

const axios = require("axios");
const {
  getActiveSession,
  getAccessToken,
} = require("./accurateAuth");
const {
  ACCURATE_ENDPOINTS,
  COLLECTION_ACCURATE_LOGS,
} = require("../constants/accurateConstants");

// Initialize Firestore
const admin = require("firebase-admin");
const firestore = admin.firestore();

/**
 * Make authenticated API request to Accurate
 *
 * @param {string} endpoint - API endpoint (relative path)
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {Object} data - Request body data
 * @param {Object} params - Query parameters
 * @returns {Object} Response data
 */
async function apiRequest(endpoint, method = "GET", data = null, params = null) {
  const sessionInfo = await getActiveSession();

  if (!sessionInfo) {
    throw new Error("Cannot get active session - not connected to Accurate");
  }

  const { session, host, accessToken } = sessionInfo;

  const config = {
    method: method,
    url: `${host}${endpoint}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "X-Session-Id": session,
      "Content-Type": "application/json",
    },
    timeout: 60000, // 60 seconds timeout for complex operations
  };

  if (data) {
    config.data = data;
  }

  if (params) {
    config.params = params;
  }

  console.log(`[ACCURATE-API] ${method} ${endpoint}`);
  if (params) {
    console.log(`[ACCURATE-API] Params:`, JSON.stringify(params));
  }

  try {
    const response = await axios(config);

    if (response.data.s === false) {
      console.error("[ACCURATE-API] API returned error:", JSON.stringify(response.data));
      throw new Error(`API Error: ${response.data.d || "Unknown error"}`);
    }

    return response.data;
  } catch (error) {
    console.error(`[ACCURATE-API] Error calling ${endpoint}:`, error.message);
    if (error.response) {
      console.error("[ACCURATE-API] Response:", JSON.stringify(error.response.data));
    }
    throw error;
  }
}

// ============================================
// ITEM OPERATIONS
// ============================================

/**
 * Get list of items from Accurate
 *
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.pageSize - Items per page (default: 100)
 * @param {string} options.filterItemType - Filter by item type (INVENTORY, NON_INVENTORY, SERVICE)
 * @param {string} options.fields - Comma-separated field list
 * @returns {Object} { items: [], sp: pagination info }
 */
async function getItemList(options = {}) {
  const {
    page = 1,
    pageSize = 100,
    filterItemType = "INVENTORY",
    fields = "id,name,no,availableToSell,quantityOnHand,quantityReserved,itemType,categoryName,unitPrice,lastSalesDate",
  } = options;

  const params = {
    page: page,
    "page-size": pageSize,
    "filter.itemType": filterItemType,
    fields: fields,
  };

  const response = await apiRequest(ACCURATE_ENDPOINTS.ITEM_LIST, "GET", null, params);

  return {
    items: response.d || [],
    sp: response.sp || {},
  };
}

/**
 * Get all items by iterating through pages
 *
 * @param {Object} options - Query options
 * @returns {Array} All items
 */
async function getAllItems(options = {}) {
  const allItems = [];
  let page = 1;
  let hasMore = true;
  const maxPages = 100; // Safety limit

  while (hasMore && page <= maxPages) {
    console.log(`[ACCURATE-API] Fetching items page ${page}...`);

    const result = await getItemList({ ...options, page });

    if (result.items && result.items.length > 0) {
      allItems.push(...result.items);
    }

    const pageCount = result.sp.pageCount || 1;
    const currentPage = result.sp.page || 1;

    if (currentPage >= pageCount) {
      hasMore = false;
    } else {
      page++;
    }

    // Add small delay to avoid rate limiting
    if (hasMore) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  console.log(`[ACCURATE-API] Fetched ${allItems.length} items total`);

  return allItems;
}

/**
 * Get item detail by ID
 *
 * @param {number} itemId - Accurate Item ID
 * @returns {Object} Item detail
 */
async function getItemDetail(itemId) {
  const response = await apiRequest(
    ACCURATE_ENDPOINTS.ITEM_DETAIL,
    "GET",
    null,
    { id: itemId }
  );

  return response.d || response;
}

/**
 * Get item by SKU (item number)
 *
 * @param {string} itemNo - Item number/SKU
 * @returns {Object|null} Item if found
 */
async function getItemByNo(itemNo) {
  // First, search in item list
  const result = await getItemList({ fields: "id,name,no,availableToSell", pageSize: 100 });

  const item = result.items.find((i) => i.no === itemNo);

  if (item) {
    // Get full detail
    return await getItemDetail(item.id);
  }

  return null;
}

/**
 * Save/create item in Accurate
 *
 * @param {Object} itemData - Item data
 * @returns {Object} Created/updated item
 */
async function saveItem(itemData) {
  const response = await apiRequest(ACCURATE_ENDPOINTS.ITEM_LIST, "POST", itemData);

  return response.d || response;
}

// ============================================
// SALES ORDER OPERATIONS
// ============================================

/**
 * Get list of sales orders
 *
 * @param {Object} options - Query options
 * @returns {Object} { orders: [], sp: pagination info }
 */
async function getSalesOrderList(options = {}) {
  const {
    page = 1,
    pageSize = 50,
    startDate,
    endDate,
    fields = "id,no,date,customerName,branchName,status,totalAmount,shippingCost,shippingAddress,shippingCourier",
  } = options;

  const params = {
    page: page,
    "page-size": pageSize,
    fields: fields,
  };

  if (startDate) {
    params["filter.date"] = `>=${startDate}`;
  }

  if (endDate) {
    params["filter.date"] = params["filter.date"]
      ? `${params["filter.date"]};<=${endDate}`
      : `<=${endDate}`;
  }

  const response = await apiRequest(ACCURATE_ENDPOINTS.SALES_ORDER_LIST, "GET", null, params);

  return {
    orders: response.d || [],
    sp: response.sp || {},
  };
}

/**
 * Get sales order detail by ID
 *
 * @param {number} orderId - Accurate Sales Order ID
 * @returns {Object} Order detail with items
 */
async function getSalesOrderDetail(orderId) {
  const response = await apiRequest(
    ACCURATE_ENDPOINTS.SALES_ORDER_DETAIL,
    "GET",
    null,
    { id: orderId }
  );

  return response.d || response;
}

/**
 * Create sales order in Accurate
 *
 * @param {Object} orderData - Sales order data
 * @returns {Object} Created order { id, no, ... }
 *
 * Expected orderData format:
 * {
 *   "customerName": "John Doe",
 *   "branchName": "CARRAMICA",
 *   "shipTo": {
 *     "name": "John Doe",
 *     "address": "Jl. xxx",
 *     "phone": "081234567890"
 *   },
 *   "salesOrderDetails": [
 *     {
 *       "itemNo": "SKU-001",
 *       "quantity": 2,
 *       "unitPrice": 150000
 *     }
 *   ],
 *   "shippingCost": 15000,
 *   "shippingCourier": "JNE"
 * }
 */
async function createSalesOrder(orderData) {
  console.log("[ACCURATE-API] Creating sales order...");

  const response = await apiRequest(ACCURATE_ENDPOINTS.SALES_ORDER_SAVE, "POST", orderData);

  if (response.s && response.d) {
    console.log("[ACCURATE-API] Sales order created:", response.d.no || response.d.id);
    return response.d;
  }

  throw new Error(`Failed to create sales order: ${JSON.stringify(response)}`);
}

/**
 * Update sales order
 *
 * @param {number} orderId - Order ID
 * @param {Object} orderData - Updated order data
 * @returns {Object} Updated order
 */
async function updateSalesOrder(orderId, orderData) {
  console.log("[ACCURATE-API] Updating sales order:", orderId);

  const orderWithId = { ...orderData, id: orderId };

  const response = await apiRequest(ACCURATE_ENDPOINTS.SALES_ORDER_SAVE, "POST", orderWithId);

  if (response.s && response.d) {
    console.log("[ACCURATE-API] Sales order updated:", response.d.no || response.d.id);
    return response.d;
  }

  throw new Error(`Failed to update sales order: ${JSON.stringify(response)}`);
}

// ============================================
// CUSTOMER OPERATIONS
// ============================================

/**
 * Get customer list
 *
 * @param {Object} options - Query options
 * @returns {Object} { customers: [], sp: pagination info }
 */
async function getCustomerList(options = {}) {
  const {
    page = 1,
    pageSize = 100,
    fields = "id,name,companyName,email,phone1,address",
  } = options;

  const params = {
    page: page,
    "page-size": pageSize,
    fields: fields,
  };

  const response = await apiRequest(ACCURATE_ENDPOINTS.CUSTOMER_LIST, "GET", null, params);

  return {
    customers: response.d || [],
    sp: response.sp || {},
  };
}

/**
 * Get customer by name
 *
 * @param {string} customerName - Customer name
 * @returns {Object|null} Customer if found
 */
async function getCustomerByName(customerName) {
  const result = await getCustomerList({ pageSize: 100 });

  const customer = result.customers.find(
    (c) => c.name?.toLowerCase() === customerName?.toLowerCase()
  );

  return customer || null;
}

// ============================================
// BRANCH OPERATIONS
// ============================================

/**
 * Get branch list
 *
 * @returns {Array} List of branches
 */
async function getBranchList() {
  const response = await apiRequest(ACCURATE_ENDPOINTS.BRANCH_LIST, "GET");

  return response.d || [];
}

/**
 * Get branch by name
 *
 * @param {string} branchName - Branch name
 * @returns {Object|null} Branch if found
 */
async function getBranchByName(branchName) {
  const branches = await getBranchList();

  const branch = branches.find(
    (b) => b.name?.toLowerCase() === branchName?.toLowerCase()
  );

  return branch || null;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Log API operation to Firestore
 *
 * @param {string} type - Log type (api_call, sync, error)
 * @param {string} operation - Operation name
 * @param {Object} details - Details to log
 */
async function logOperation(type, operation, details) {
  try {
    await firestore.collection(COLLECTION_ACCURATE_LOGS).add({
      type: type,
      operation: operation,
      details: details,
      timestamp: admin.firestore.Timestamp.now(),
    });
  } catch (error) {
    console.error("[ACCURATE-API] Error logging operation:", error.message);
  }
}

/**
 * Test connection to Accurate
 *
 * @returns {Object} Connection test result
 */
async function testConnection() {
  try {
    const startTime = Date.now();

    // Get session
    const sessionInfo = await getActiveSession();

    if (!sessionInfo) {
      return {
        success: false,
        message: "Cannot connect to Accurate - check OAuth tokens",
      };
    }

    // Try to get branch list as connection test
    const branches = await getBranchList();

    const duration = Date.now() - startTime;

    return {
      success: true,
      message: "Connected to Accurate successfully",
      host: sessionInfo.host,
      databaseId: sessionInfo.session ? "Connected" : "Not connected",
      branchCount: branches.length,
      duration: `${duration}ms`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
      error: error.message,
    };
  }
}

module.exports = {
  // Core
  apiRequest,

  // Items
  getItemList,
  getAllItems,
  getItemDetail,
  getItemByNo,
  saveItem,

  // Sales Orders
  getSalesOrderList,
  getSalesOrderDetail,
  createSalesOrder,
  updateSalesOrder,

  // Customers
  getCustomerList,
  getCustomerByName,

  // Branches
  getBranchList,
  getBranchByName,

  // Utilities
  logOperation,
  testConnection,
};
