/**
 * Accurate Sync Service
 *
 * Handles synchronization between Accurate and Carramica
 * - Stock sync (Accurate → Firestore)
 * - Order sync (Firestore → Accurate)
 * - Product mapping
 */

const admin = require("firebase-admin");
const {
  getActiveSession,
} = require("./accurateAuth");
const {
  getAllItems,
  getItemDetail,
  getSalesOrderList,
  getSalesOrderDetail,
  createSalesOrder,
  testConnection,
  logOperation,
} = require("./accurateApi");
const {
  COLLECTION_ACCURATE_LOGS,
  DEFAULT_STOCK_SYNC_INTERVAL_MS,
} = require("../constants/accurateConstants");

// Firestore
const firestore = admin.firestore();

// ============================================
// STOCK SYNC
// ============================================

/**
 * Sync stock from Accurate to Firestore
 *
 * Flow:
 * 1. Get all items from Accurate (with availableToSell)
 * 2. Match with Firestore products by SKU
 * 3. Update Firestore product.stok = availableToSell
 *
 * @param {Object} options - Sync options
 * @param {boolean} options.dryRun - If true, don't actually update
 * @param {string} options.skuFilter - Optional: sync only specific SKU
 * @returns {Object} Sync result
 */
async function syncStockFromAccurate(options = {}) {
  const { dryRun = false, skuFilter = null } = options;

  console.log(`[ACCURATE-SYNC] Starting stock sync...`);
  console.log(`[ACCURATE-SYNC] Dry run mode: ${dryRun}`);

  const startTime = Date.now();
  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // Get all items from Accurate
    console.log("[ACCURATE-SYNC] Fetching items from Accurate...");
    const accurateItems = await getAllItems({
      fields: "id,name,no,availableToSell,quantityOnHand,quantityReserved,itemType",
    });

    console.log(`[ACCURATE-SYNC] Found ${accurateItems.length} items in Accurate`);

    // Process each item
    for (const item of accurateItems) {
      try {
        // Skip if filtered by SKU and doesn't match
        if (skuFilter && item.no !== skuFilter) {
          skipped++;
          continue;
        }

        // Find matching product in Firestore
        const productSnapshot = await firestore
          .collection("product")
          .where("sku", "==", item.no)
          .limit(1)
          .get();

        // If not found by sku, try by accurateItemId
        let productDoc = null;
        if (productSnapshot.empty) {
          const byAccurateIdSnapshot = await firestore
            .collection("product")
            .where("accurateItemId", "==", item.id)
            .limit(1)
            .get();

          if (!byAccurateIdSnapshot.empty) {
            productDoc = byAccurateIdSnapshot.docs[0];
          }
        } else {
          productDoc = productSnapshot.docs[0];
        }

        if (!productDoc) {
          console.log(`[ACCURATE-SYNC] Product not found for SKU: ${item.no}`);
          skipped++;
          continue;
        }

        processed++;

        const productData = productDoc.data();
        const previousStock = productData.stok || 0;
        const newStock = item.availableToSell || 0;

        // Check if stock changed
        if (previousStock !== newStock) {
          if (!dryRun) {
            // Update Firestore
            await productDoc.ref.update({
              stok: newStock,
              availableToSell: item.availableToSell,
              quantityOnHand: item.quantityOnHand,
              quantityReserved: item.quantityReserved,
              accurateItemId: item.id,
              accurateNo: item.no,
              accurateLastSync: admin.firestore.Timestamp.now(),
              stockSource: "accurate",
              lastStockUpdate: admin.firestore.Timestamp.now(),
              updatedAt: admin.firestore.Timestamp.now(),
            });
          }

          console.log(
            `[ACCURATE-SYNC] Stock updated: ${item.no} (${productData.nama}): ${previousStock} → ${newStock}`
          );
          updated++;
        } else {
          console.log(`[ACCURATE-SYNC] Stock unchanged: ${item.no} = ${newStock}`);
        }
      } catch (error) {
        console.error(`[ACCURATE-SYNC] Error processing item ${item.no}:`, error.message);
        errors++;
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const duration = Date.now() - startTime;

    console.log(`[ACCURATE-SYNC] Sync complete!`);
    console.log(`[ACCURATE-SYNC] Processed: ${processed}, Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);
    console.log(`[ACCURATE-SYNC] Duration: ${duration}ms`);

    // Log to Firestore
    await logOperation("stock_sync", "syncStockFromAccurate", {
      dryRun,
      totalItems: accurateItems.length,
      processed,
      updated,
      skipped,
      errors,
      duration,
      timestamp: admin.firestore.Timestamp.now(),
    });

    // Update last sync time in config
    if (!dryRun) {
      await updateConfig({ lastStockSync: admin.firestore.Timestamp.now() });
    }

    return {
      success: true,
      totalItems: accurateItems.length,
      processed,
      updated,
      skipped,
      errors,
      duration,
    };
  } catch (error) {
    console.error("[ACCURATE-SYNC] Sync failed:", error.message);

    await logOperation("stock_sync", "syncStockFromAccurate", {
      success: false,
      error: error.message,
      duration: Date.now() - startTime,
      timestamp: admin.firestore.Timestamp.now(),
    });

    return {
      success: false,
      error: error.message,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Sync single product stock from Accurate
 *
 * @param {string} sku - Product SKU
 * @param {boolean} dryRun - If true, don't actually update
 * @returns {Object} Sync result
 */
async function syncSingleProductStock(sku, dryRun = false) {
  return syncStockFromAccurate({ skuFilter: sku, dryRun });
}

// ============================================
// ORDER SYNC
// ============================================

/**
 * Create order in Accurate from Carramica order
 *
 * @param {Object} orderData - Order data from Firestore
 * @param {string} orderData.id - Firestore order ID
 * @param {string} orderData.senderName - Customer name
 * @param {string} orderData.senderPhone - Customer phone
 * @param {string} orderData.email - Customer email
 * @param {Array} orderData.orders - Order items array
 * @param {string} orderData.paymentMethod - Payment method
 * @param {boolean} dryRun - If true, don't actually create
 * @returns {Object} Created order result
 */
async function createOrderInAccurate(orderData, dryRun = false) {
  console.log(`[ACCURATE-ORDER] Creating order in Accurate...`);
  console.log(`[ACCURATE-ORDER] Order ID: ${orderData.id}`);
  console.log(`[ACCURATE-ORDER] Customer: ${orderData.senderName}`);

  try {
    // Build sales order payload for Accurate
    const salesOrderPayload = {
      customerName: orderData.senderName || "Guest Customer",
      branchName: "CARRAMICA", // Default branch
      salesOrderDetails: [],
    };

    // Process each order item (orders is an array, take first one for simplicity)
    const primaryOrder = orderData.orders && orderData.orders[0] ? orderData.orders[0] : null;

    if (primaryOrder && primaryOrder.products) {
      for (const product of primaryOrder.products) {
        salesOrderPayload.salesOrderDetails.push({
          itemNo: product.id, // Use Firestore product ID or SKU
          quantity: product.quantity || 1,
          unitPrice: product.price || 0,
        });
      }
    }

    // Add shipping info if available
    if (primaryOrder) {
      salesOrderPayload.shipTo = {
        name: primaryOrder.receiverName || orderData.senderName,
        address: primaryOrder.address || "",
        phone: primaryOrder.receiverPhone || orderData.senderPhone,
      };

      if (primaryOrder.kurir) {
        salesOrderPayload.shippingCourier = primaryOrder.kurir;
      }

      if (primaryOrder.ongkir) {
        salesOrderPayload.shippingCost = primaryOrder.ongkir;
      }
    }

    console.log("[ACCURATE-ORDER] Payload:", JSON.stringify(salesOrderPayload, null, 2));

    if (dryRun) {
      console.log("[ACCURATE-ORDER] Dry run - not creating order");
      return {
        success: true,
        dryRun: true,
        payload: salesOrderPayload,
      };
    }

    // Create order in Accurate
    const result = await createSalesOrder(salesOrderPayload);

    // Update Firestore order with Accurate reference
    await firestore.collection("orders").doc(orderData.id).update({
      accurateOrderId: result.id?.toString(),
      accurateOrderNo: result.no,
      accurateSynced: true,
      accurateSyncAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    });

    console.log(`[ACCURATE-ORDER] Order created in Accurate: ${result.no || result.id}`);

    // Log operation
    await logOperation("order_sync", "createOrderInAccurate", {
      firestoreOrderId: orderData.id,
      accurateOrderId: result.id,
      accurateOrderNo: result.no,
      customerName: orderData.senderName,
      timestamp: admin.firestore.Timestamp.now(),
    });

    return {
      success: true,
      accurateOrderId: result.id,
      accurateOrderNo: result.no,
    };
  } catch (error) {
    console.error("[ACCURATE-ORDER] Failed to create order:", error.message);

    // Log error
    await logOperation("order_sync", "createOrderInAccurate", {
      firestoreOrderId: orderData.id,
      success: false,
      error: error.message,
      timestamp: admin.firestore.Timestamp.now(),
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Sync orders from Accurate to Firestore
 *
 * @param {Object} options - Sync options
 * @param {boolean} options.dryRun - If true, don't actually update
 * @param {number} options.pageSize - Number of orders to sync
 * @returns {Object} Sync result
 */
async function syncOrdersFromAccurate(options = {}) {
  const { dryRun = false, pageSize = 50 } = options;

  console.log("[ACCURATE-ORDER] Starting order sync from Accurate...");

  const startTime = Date.now();
  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  try {
    // Get orders from Accurate
    const result = await getSalesOrderList({
      pageSize: pageSize,
      fields: "id,no,date,customerName,branchName,status,totalAmount",
    });

    console.log(`[ACCURATE-ORDER] Found ${result.orders.length} orders in Accurate`);

    for (const order of result.orders) {
      try {
        // Check if order already exists in Firestore
        const existingSnapshot = await firestore
          .collection("orders")
          .where("accurateOrderId", "==", order.id.toString())
          .limit(1)
          .get();

        if (!existingSnapshot.empty) {
          console.log(`[ACCURATE-ORDER] Order ${order.no} already synced, skipping...`);
          skipped++;
          continue;
        }

        processed++;

        if (!dryRun) {
          // Get full order detail
          const orderDetail = await getSalesOrderDetail(order.id);

          // Create order in Firestore
          await firestore.collection("orders").add({
            source: "accurate",
            accurateOrderId: order.id.toString(),
            accurateOrderNo: order.no,
            accurateSynced: true,
            accurateSyncAt: admin.firestore.Timestamp.now(),
            senderName: order.customerName,
            senderPhone: "",
            email: "",
            orders: [
              {
                ordId: `AO-${order.no}`,
                receiverName: orderDetail.shipTo?.name || order.customerName,
                receiverPhone: orderDetail.shipTo?.phone || "",
                address: orderDetail.shipTo?.address || "",
                kurir: order.shippingCourier || "",
                products: orderDetail.salesOrderDetails?.map((item) => ({
                  id: item.itemNo,
                  nama: item.itemName || item.itemNo,
                  quantity: item.quantity,
                  price: item.unitPrice,
                  amount: item.quantity * item.unitPrice,
                })) || [],
              },
            ],
            totalHargaProduk: order.totalAmount - (order.shippingCost || 0),
            totalOngkir: order.shippingCost || 0,
            totalAfterDiskonDanOngkir: order.totalAmount,
            orderStatus: mapAccurateStatus(order.status),
            paymentStatus: "settlement",
            createdAt: order.date ? admin.firestore.Timestamp.fromDate(new Date(order.date)) : admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
          });

          updated++;
        }

        console.log(`[ACCURATE-ORDER] Order synced: ${order.no}`);
      } catch (error) {
        console.error(`[ACCURATE-ORDER] Error syncing order ${order.no}:`, error.message);
        errors++;
      }

      // Small delay
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const duration = Date.now() - startTime;

    console.log(`[ACCURATE-ORDER] Sync complete!`);
    console.log(`[ACCURATE-ORDER] Processed: ${processed}, Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);

    // Log
    await logOperation("order_sync", "syncOrdersFromAccurate", {
      dryRun,
      totalOrders: result.orders.length,
      processed,
      updated,
      skipped,
      errors,
      duration,
      timestamp: admin.firestore.Timestamp.now(),
    });

    return {
      success: true,
      totalOrders: result.orders.length,
      processed,
      updated,
      skipped,
      errors,
      duration,
    };
  } catch (error) {
    console.error("[ACCURATE-ORDER] Sync failed:", error.message);

    return {
      success: false,
      error: error.message,
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Map Accurate order status to Carramica status
 *
 * @param {string} accurateStatus - Accurate status
 * @returns {string} Carramica status
 */
function mapAccurateStatus(accurateStatus) {
  const statusMap = {
    DONE: "completed",
    CLOSED: "completed",
    SHIPPING: "sent",
    PROCESSING: "processing",
    PENDING: "pending",
    CANCELLED: "cancel",
    VOID: "cancel",
  };

  return statusMap[accurateStatus?.toUpperCase()] || "pending";
}

// ============================================
// DESTY TO ACCURATE SYNC
// ============================================

/**
 * Sync product from Desty webhook to Accurate
 * Called when Desty receives an order from marketplace
 *
 * @param {Object} webhookData - Desty webhook payload
 * @param {boolean} dryRun - If true, don't actually sync
 * @returns {Object} Sync result
 */
async function syncDestyOrderToAccurate(webhookData, dryRun = false) {
  console.log("[ACCURATE-SYNC] Syncing Desty order to Accurate...");

  const { orderSn, itemList, hasPaid } = webhookData;

  try {
    if (dryRun) {
      console.log("[ACCURATE-SYNC] Dry run - not creating order");
      return {
        success: true,
        dryRun: true,
        orderSn,
        itemCount: itemList?.length || 0,
      };
    }

    // Build order payload
    const orderPayload = {
      customerName: "Marketplace Customer",
      branchName: "CARRAMICA",
      salesOrderDetails: [],
      reference: `DESTY-${orderSn}`,
    };

    // Add items from webhook
    if (itemList && itemList.length > 0) {
      for (const item of itemList) {
        orderPayload.salesOrderDetails.push({
          itemNo: item.skuNumber || item.itemCode,
          quantity: item.quantity || 1,
          unitPrice: 0, // Price not available in webhook
        });
      }
    }

    // Create in Accurate
    const result = await createSalesOrder(orderPayload);

    console.log(`[ACCURATE-SYNC] Desty order ${orderSn} synced to Accurate: ${result.no}`);

    // Log
    await logOperation("order_sync", "syncDestyOrderToAccurate", {
      destyOrderSn: orderSn,
      accurateOrderId: result.id,
      accurateOrderNo: result.no,
      hasPaid,
      timestamp: admin.firestore.Timestamp.now(),
    });

    return {
      success: true,
      accurateOrderId: result.id,
      accurateOrderNo: result.no,
    };
  } catch (error) {
    console.error("[ACCURATE-SYNC] Failed to sync Desty order:", error.message);

    return {
      success: false,
      destyOrderSn: orderSn,
      error: error.message,
    };
  }
}

// ============================================
// CONFIG MANAGEMENT
// ============================================

/**
 * Get Accurate config from Firestore
 *
 * @returns {Object} Config object
 */
async function getConfig() {
  const doc = await firestore.collection("accurate_settings").doc("config").get();

  if (doc.exists) {
    return doc.data();
  }

  // Return default config
  return {
    syncEnabled: true,
    dryRunMode: true,
    autoSyncStock: true,
    autoSyncOrders: true,
    pushToDestyFromAccurate: true,
    stockSyncIntervalMs: DEFAULT_STOCK_SYNC_INTERVAL_MS,
    orderSyncIntervalMs: DEFAULT_STOCK_SYNC_INTERVAL_MS,
  };
}

/**
 * Update Accurate config in Firestore
 *
 * @param {Object} updates - Fields to update
 * @returns {boolean} Success status
 */
async function updateConfig(updates) {
  try {
    await firestore.collection("accurate_settings").doc("config").set(
      {
        ...updates,
        updatedAt: admin.firestore.Timestamp.now(),
      },
      { merge: true }
    );

    return true;
  } catch (error) {
    console.error("[ACCURATE-SYNC] Error updating config:", error.message);
    return false;
  }
}

/**
 * Get sync status
 *
 * @returns {Object} Status object
 */
async function getSyncStatus() {
  const connection = await testConnection();
  const config = await getConfig();

  // Get last sync logs
  const stockLogSnapshot = await firestore
    .collection(COLLECTION_ACCURATE_LOGS)
    .where("type", "==", "stock_sync")
    .orderBy("timestamp", "desc")
    .limit(1)
    .get();

  const orderLogSnapshot = await firestore
    .collection(COLLECTION_ACCURATE_LOGS)
    .where("type", "==", "order_sync")
    .orderBy("timestamp", "desc")
    .limit(1)
    .get();

  return {
    connected: connection.success,
    connection,
    config,
    lastStockSync: stockLogSnapshot.empty ? null : stockLogSnapshot.docs[0].data(),
    lastOrderSync: orderLogSnapshot.empty ? null : orderLogSnapshot.docs[0].data(),
  };
}

module.exports = {
  // Stock sync
  syncStockFromAccurate,
  syncSingleProductStock,

  // Order sync
  createOrderInAccurate,
  syncOrdersFromAccurate,

  // Desty integration
  syncDestyOrderToAccurate,

  // Config
  getConfig,
  updateConfig,
  getSyncStatus,

  // Utilities
  mapAccurateStatus,
};
