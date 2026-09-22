/**
 * Firebase Cloud Functions for Desty API Proxy
 * These functions act as a proxy to avoid CORS issues when calling Desty API from the frontend
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// Desty API Configuration
const DESTY_API_URL = "https://api.desty.app";
const APPLY_ID = functions.config().desty?.apply_id || "e384d7c6-b5a0-46ef-8165-e7cc4ffbb3fe";
const USERNAME = functions.config().desty?.username || "+6281215571500";
const MOBILE = functions.config().desty?.mobile || "+6281215571500";

// Token cache
let cachedToken = null;
let tokenExpireTime = null;

/**
 * Get access token from Desty API
 */
async function getAccessToken() {
  // Check if cached token is still valid
  if (cachedToken && tokenExpireTime && Date.now() < tokenExpireTime - (60 * 60 * 1000)) {
    return cachedToken;
  }

  try {
    const response = await fetch(`${DESTY_API_URL}/api/auth/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        applyId: APPLY_ID,
        username: USERNAME,
        mobile: MOBILE,
      }),
    });

    const data = await response.json();

    if (data.code === "0" && data.data?.accessToken) {
      cachedToken = data.data.accessToken;
      tokenExpireTime = Date.now() + (30 * 24 * 60 * 60 * 1000);
      return cachedToken;
    } else {
      throw new Error(data.msg || "Failed to get access token");
    }
  } catch (error) {
    console.error("Desty Auth Error:", error);
    throw error;
  }
}

/**
 * Cloud Function: Fetch all products from Desty
 */
exports.fetchDestyProducts = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const warehouseId = data.warehouseId || "2042620805094079444";

  try {
    const authHeader = await getAccessToken();
    const allProducts = [];
    let pageNumber = 1;
    const pageSize = 50;
    let totalPages = 1;

    while (pageNumber <= totalPages) {
      const response = await fetch(`${DESTY_API_URL}/api/product/page`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          pageNumber,
          pageSize,
        }),
      });

      const result = await response.json();

      if (result.code === "0" && result.data) {
        result.data.results?.forEach((product) => {
          if (product.skuInfoList && product.skuInfoList.length > 0) {
            product.skuInfoList.forEach((sku) => {
              allProducts.push({
                productName: product.productName,
                spuId: product.spuId,
                isBundleProduct: product.isBundleProduct,
                createTime: product.createTime,
                updateTime: product.updateTime,
                skuId: sku.skuId,
                skuNumber: sku.skuNumber,
                salesPrice: sku.salesPrice,
                image: sku.image,
                baseUnit: sku.baseUnit,
                variantNameOptionList: sku.variantNameOptionList,
                onHandStock:
                  sku.masterInventoryList?.find((inv) => inv.warehouseId === warehouseId)
                    ?.onHandStock || 0,
                totalStock:
                  sku.masterInventoryList?.reduce(
                    (sum, inv) => sum + (inv.onHandStock || 0),
                    0
                  ) || 0,
              });
            });
          }
        });

        totalPages = result.data.totalPages || 1;
        pageNumber++;
      } else {
        throw new Error(result.msg || "Failed to fetch products");
      }
    }

    return { products: allProducts };
  } catch (error) {
    console.error("Error fetching Desty products:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Cloud Function: Get single SKU detail from Desty
 */
exports.getDestySkuDetail = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { skuNumber } = data;

  if (!skuNumber) {
    throw new functions.https.HttpsError("invalid-argument", "skuNumber is required");
  }

  try {
    const authHeader = await getAccessToken();

    const response = await fetch(
      `${DESTY_API_URL}/api/product/sku/detail?skuNumber=${encodeURIComponent(skuNumber)}`,
      {
        method: "GET",
        headers: {
          Authorization: authHeader,
        },
      }
    );

    const result = await response.json();

    if (result.code === "0") {
      return result.data;
    } else {
      throw new Error(result.msg || "Failed to get SKU detail");
    }
  } catch (error) {
    console.error("Error fetching Desty SKU detail:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

/**
 * Cloud Function: Sync stock to Desty
 */
exports.syncStockToDesty = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { warehouseId, stocks } = data;

  if (!warehouseId || !stocks || !Array.isArray(stocks)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "warehouseId and stocks array are required"
    );
  }

  try {
    const authHeader = await getAccessToken();

    const response = await fetch(`${DESTY_API_URL}/api/inventory/stock/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        warehouseId,
        stocks: stocks.map((stock) => ({
          skuNumber: stock.skuNumber,
          onHandStock: stock.onHandStock,
          productName: stock.productName || "",
        })),
      }),
    });

    const result = await response.json();

    if (result.code === "0") {
      return {
        success: true,
        failureList: result.data?.failureList || [],
      };
    } else {
      throw new Error(result.msg || "Failed to sync stock");
    }
  } catch (error) {
    console.error("Error syncing stock to Desty:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});
