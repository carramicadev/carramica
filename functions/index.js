/* eslint-disable */

/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const { onRequest } = require("firebase-functions/v2/https");
const functions = require("firebase-functions");
const { jakartaFn } = require("./functions-regions");
const admin = require("firebase-admin");
const axios = require("axios");
const midtransClient = require("midtrans-client");
const {
  getFirestore,
  Timestamp,
  FieldValue,
  FieldPath,
} = require("firebase-admin/firestore");
const nodemailer = require("nodemailer");

admin.initializeApp({
  projectId: "carramica-prod"
});

// ==========================================
// SAFETY CONFIG - EMERGENCY STOP MECHANISM
// ==========================================
// 
// This config controls stock deduction behavior for ALL webhook handlers.
// You can toggle these values in Firestore WITHOUT deploying new code.
//
// HOW TO TOGGLE WITHOUT DEPLOY:
// 1. Go to Firestore Console
// 2. Add/Update document at: desty_settings/safety_config
// 3. Set the values you want
//
// DEFAULT VALUES (SAFE):
// - stockDeductionEnabled: false (DIFFERENT FROM BEFORE!)
// - dryRunMode: true
// - confirmedStatuses: ["Ready_To_Ship"] (ONLY this status triggers deduction)
// ==========================================

// Cache for safety config (refreshes every request)
let cachedSafetyConfig = null;
let configCacheTime = 0;
const CONFIG_CACHE_DURATION = 60000; // 1 minute cache

async function getSafetyConfig() {
  const now = Date.now();
  
  // Return cached config if still valid
  if (cachedSafetyConfig && (now - configCacheTime) < CONFIG_CACHE_DURATION) {
    return cachedSafetyConfig;
  }
  
  try {
    const configDoc = await firestore.doc("desty_settings/safety_config").get();
    
    if (configDoc.exists) {
      cachedSafetyConfig = configDoc.data();
      configCacheTime = now;
      console.log("[SAFETY] Loaded config from Firestore:", JSON.stringify(cachedSafetyConfig));
    } else {
      // Default safe config for Desty - use this if no config in Firestore
      // Desty statuses: Unpaid, New_Orders, Ready_To_Ship, Shipping, Completed, Cancellations, Returns
      cachedSafetyConfig = {
        stockDeductionEnabled: false,  // DEFAULT: DISABLED (SAFE!)
        dryRunMode: true,               // DEFAULT: DRY RUN (safe)
        confirmedStatuses: ["Ready_To_Ship"], // MOST COMMON trigger for settlement
        idempotencyEnabled: true,
        logLevel: "verbose"
      };
      configCacheTime = now;
      
      // Create default config in Firestore for future use
      await firestore.doc("desty_settings/safety_config").set(cachedSafetyConfig);
      console.log("[SAFETY] Created default safe config in Firestore");
    }
  } catch (error) {
    console.error("[SAFETY] Error loading config:", error.message);
    // Use safe defaults on error
    cachedSafetyConfig = {
      stockDeductionEnabled: false,
      dryRunMode: true,
      confirmedStatuses: ["Ready_To_Ship"],
      idempotencyEnabled: true,
      logLevel: "verbose"
    };
  }
  
  return cachedSafetyConfig;
}

// Helper function to force refresh config (bypass cache)
async function refreshSafetyConfig() {
  cachedSafetyConfig = null;
  configCacheTime = 0;
  return await getSafetyConfig();
}

// Callable function to refresh safety config from server
exports.refreshSafetyConfig = jakartaFn.https.onCall(async (data, context) => {
  try {
    // Force refresh the cached config
    const newConfig = await refreshSafetyConfig();

    console.log("[SAFETY] Config refreshed from Firestore:", JSON.stringify(newConfig));

    return {
      success: true,
      config: newConfig,
      message: "Safety config refreshed successfully"
    };
  } catch (error) {
    console.error("[SAFETY] Error refreshing config:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

console.log("[SAFETY] Safety config module loaded");


// const logger = require("firebase-functions/logger");
const CryptoJS = require("crypto-js");
const firestore = admin.firestore();

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started
// exports.getQuotation = jakartaFn.https.onCall(async (data, context) => {
//     try {
//         const SECRET = functions.config().secret.lalamove;
//         const time = new Date().getTime().toString(); // => `1545880607433`

//         const method = 'POST';
//         const path = '/v3/quotations';
//         const body = JSON.stringify({
//             data: {
//                 serviceType: data.serviceType,
//                 stops: data.coordinates,
//                 language: data.language
//             }
//         }); // => the whole body for '/v3/quotations'

//         const rawSignature = `${time}\r\n${method}\r\n${path}\r\n\r\n${body}`;
//         //const rawSignature = `${time}\r\n${method}\r\n${path}\r\n\r\n`; if the method is GET
//         // => '1546222219293\r\nPOST\r\n/v3/quotations\r\n\r\n{\n"data":{...}'

//         const SIGNATURE = CryptoJS.HmacSHA256(rawSignature, SECRET).toString();
//         const API_KEY = functions.config().apikey.lalamove
//         const TOKEN = `${API_KEY}:${time}:${SIGNATURE}`
//         console.log(data)
//         const response = await axios.post("/v3/quotations", {
//             data: {
//                 serviceType: data.serviceType,
//                 stops: data.coordinates,
//                 language: data.language
//             }
//         }, {
//             baseURL: 'https://rest.sandbox.lalamove.com',
//             headers: {
//                 'Authorization': `hmac ${TOKEN}`,
//                 'Market': 'ID'
//             }
//         });
//         // => '5133946c6a0ba25932cc18fa3aa1b5c3dfa2c7f99de0f8599b28c2da88ed9d42'
//         return {

//             items: response.data
//         };
//     } catch (e) {
//         throw new functions.https.HttpsError("internal", e.message)

//     }
// })

// exports.createOrderLalamove = jakartaFn.https.onCall(async (data, context) => {
//     try {
//         const SECRET = functions.config().secret.lalamove;
//         const time = new Date().getTime().toString(); // => `1545880607433`

//         const method = 'POST';
//         const path = '/v3/orders';
//         const body = JSON.stringify({
//             data: {
//                 quotationId: data.quotationId,
//                 sender: data.sender,
//                 recipients: data.recipients,
//                 metadata: {
//                     restaurantOrderId: "1234",
//                     restaurantName: "Charamics"
//                 }
//             }
//         }); // => the whole body for '/v3/orders'

//         const rawSignature = `${time}\r\n${method}\r\n${path}\r\n\r\n${body}`;
//         //const rawSignature = `${time}\r\n${method}\r\n${path}\r\n\r\n`; if the method is GET
//         // => '1546222219293\r\nPOST\r\n/v3/orders\r\n\r\n{\n"data":{...}'

//         const SIGNATURE = CryptoJS.HmacSHA256(rawSignature, SECRET).toString();
//         const API_KEY = functions.config().apikey.lalamove
//         const TOKEN = `${API_KEY}:${time}:${SIGNATURE}`
//         console.log(data)
//         const response = await axios.post("/v3/orders", {
//             data: {
//                 quotationId: data.quotationId,
//                 sender: data.sender,
//                 recipients: data.recipients,
//                 metadata: {
//                     restaurantOrderId: "1234",
//                     restaurantName: "Charamics"
//                 }
//             }
//         }, {
//             baseURL: 'https://rest.sandbox.lalamove.com',
//             headers: {
//                 'Authorization': `hmac ${TOKEN}`,
//                 'Market': 'ID'
//             }
//         });
//         // => '5133946c6a0ba25932cc18fa3aa1b5c3dfa2c7f99de0f8599b28c2da88ed9d42'
//         return {

//             items: response.data
//         };
//     } catch (e) {
//         throw new functions.https.HttpsError("internal", e.message)

//     }
// })

// exports.getKec = jakartaFn.https.onCall(async (data, context) => {
//     try {
//         if (!data.value) {
//             throw new functions.https.HttpsError("invalid-argument", "argumen tidak lengkap")
//         }
//         const apiKey = functions.config().api.key;
//         console.log(data)
//         const response = await axios.post("/pos_cash/get_destination_district", {
//             destination_district_name: data.value
//         }, {
//             baseURL: 'http://apisanbox.coresyssap.com/lapaksatria/',
//             headers: {
//                 api_key: apiKey,
//             }
//         });

//         return {

//             items: response.data
//         };
//     } catch (e) {

//         throw new functions.https.HttpsError("internal", e.message)
//     }

// });

// exports.getPrice = jakartaFn.https.onCall(async (data, context) => {
//     try {
//         if (!data.destination_district_code || !data.service_type_code) {
//             throw new functions.https.HttpsError("invalid-argument", "argumen tidak lengkap")
//         }
//         const apiKey = functions.config().api.key;
//         console.log(data)
//         const response = await axios.post("/pos_cash_v2/get_price_cash", {
//             counter_code: "DEV120",
//             destination_district_code: data.destination_district_code,
//             shipment_type_code: "SHTPC",
//             discount_id: 1,
//             discount_percentage: 0,
//             service_type_code: data.service_type_code,
//             kilo: [1],
//         }, {
//             baseURL: 'http://apisanbox.coresyssap.com/lapaksatria/',
//             headers: {
//                 api_key: apiKey,
//             }
//         });

//         return {

//             items: response.data
//         };
//     } catch (e) {

//         throw new functions.https.HttpsError("internal", e.message)
//     }

// });

// exports.getService = jakartaFn.https.onCall(async (data, context) => {
//     try {
//         if (!data.value) {
//             throw new functions.https.HttpsError("invalid-argument", "argumen tidak lengkap")
//         }
//         const apiKey = functions.config().api.key;
//         console.log(data)
//         const response = await axios.post("/pos_cash/get_service_type", {
//             product_code: data.value
//         }, {
//             baseURL: 'http://apisanbox.coresyssap.com/lapaksatria/',
//             headers: {
//                 api_key: apiKey,
//             }
//         });

//         return {

//             items: response.data
//         };
//     } catch (e) {

//         throw new functions.https.HttpsError("internal", e.message)
//     }

// });

exports.sumOrders = jakartaFn.https.onCall(async (data, context) => {
  try {
    const snapshot = await firestore.collection("orders").get();

    let totalOrdersCount = 0; // Count of all items in orders arrays
    let settlementCount = 0; // Count of documents with status === 'settlement'
    let settlementPriceSum = 0; // Sum of price for documents with status === 'settlement'
    let settlementDeliveryFeeSum = 0; // Sum of delivery_fee for documents with status === 'settlement'

    snapshot.forEach((doc) => {
      const data = doc.data();

      // Task 1: Count all orders
      if (Array.isArray(data.orders)) {
        totalOrdersCount += data.orders.length;

        if (data.paymentStatus === "settlement") {
          data.orders.forEach((order) => {
            settlementCount += 1;
            // Handle delivery_fee as string or number
            const deliveryFee =
              typeof order.ongkir === "string"
                ? parseFloat(order.ongkir) // Convert string to number
                : order.ongkir;

            if (!isNaN(deliveryFee)) {
              settlementDeliveryFeeSum += deliveryFee;
            }
          });
        }
      }

      // Task 2 & 3: Filter by status === 'settlement' and sum price
      if (data.paymentStatus === "settlement") {
        // Task 3: Sum the price
        if (typeof data.totalHargaProduk === "number") {
          settlementPriceSum += data.totalHargaProduk;
        }
      }
    });

    return {
      totalOrdersCount: totalOrdersCount,
      settlementCount: settlementCount,
      settlementPriceSum: settlementPriceSum,
      settlementDeliveryFeeSum: settlementDeliveryFeeSum,
    };
  } catch (e) {
    throw new functions.https.HttpsError("internal", e.message);
  }
});

exports.createOrder = jakartaFn.https.onCall(async (data, context) => {
  try {
    if (!data.id || !data.amount) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "argumen tidak lengkap"
      );
    }
    const apiKey = functions.config().midtrans.server.key;
    const clientKey = functions.config().midtrans.client.key;
    const status = functions.config().environment.status;

    let isProduction = false;
    if (status === "prod") {
      isProduction = true;
    }
    let snap = new midtransClient.Snap({
      isProduction: isProduction,
      serverKey: apiKey,
      clientKey: clientKey,
    });
    let parameter = {
      transaction_details: {
        order_id: `ORDER_${data.id}`,
        gross_amount: data.amount,
      },
      credit_card: {
        secure: true,
      },
      item_details: data.item,
      customer_details: data.customer_details,
      page_expiry: {
        duration: 7,
        unit: "days",
      },
    };

    console.log(data);
    // const response = await axios.post("https://app.sandbox.midtrans.com/snap/v1/transactions", {
    //     transaction_details: {
    //         order_id: `ORDER_${data.id}`,
    //         gross_amount: data.amount
    //     },
    //     credit_card: {
    //         secure: true
    //     },
    //     item_details: data.item,
    //     customer_details: data.customer_details,
    //     page_expiry: {
    //         duration: 72,
    //         unit: "hours"
    //     }

    // }, {
    //     headers: {
    //         'Accept': 'application/json',
    //         'Content-Type': 'application/json',
    //         'Authorization': `Basic ${apiKey}`
    //     }
    // });
    const res = await snap.createTransaction(parameter);
    // const notif = await snap.transaction.status(`ORDER_${data.id}`);
    // const firestore = admin.firestore()
    // const orderDoc = firestore.doc(`orders/${data.id}`);
    // await orderDoc.set({
    //     status: notif
    // }, { merge: true })

    return {
      items: res,
    };
  } catch (e) {
    throw new functions.https.HttpsError("internal", e.message);
  }
});

exports.cekStatus = jakartaFn.https.onCall(async (data, context) => {
  try {
    if (!data.order_id) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "argumen tidak lengkap"
      );
    }
    const apiKey = functions.config().midtrans.server.key;
    const clientKey = functions.config().midtrans.client.key;
    const status = functions.config().environment.status;

    let isProduction = false;
    if (status === "prod") {
      isProduction = true;
    }
    let snap = new midtransClient.Snap({
      isProduction: isProduction,
      serverKey: apiKey,
      clientKey: clientKey,
    });

    console.log(data);
    const response = await snap.transaction.status(data.order_id);
    return response;
  } catch (e) {
    throw new functions.https.HttpsError("internal", e.message);
  }
});

// cancel order
exports.cancelOrder = jakartaFn.https.onCall(async (data, context) => {
  try {
    if (!data.id) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "argumen tidak lengkap"
      );
    }
    const apiKey = functions.config().midtrans.server.key;
    const clientKey = functions.config().midtrans.client.key;
    const status = functions.config().environment.status;

    let isProduction = false;
    if (status === "prod") {
      isProduction = true;
    }
    let snap = new midtransClient.Snap({
      isProduction: isProduction,
      serverKey: apiKey,
      clientKey: clientKey,
    });
    snap.transaction.cancel(`ORDER_${data.id}`).then((response) => {
      return {
        items: response,
      };
      // do something to `response` object
    });

    // console.log(data)
    // const response = await axios.post("https://app.sandbox.midtrans.com/snap/v1/transactions", {
    //     transaction_details: {
    //         order_id: `ORDER_${data.id}`,
    //         gross_amount: data.amount
    //     },
    //     credit_card: {
    //         secure: true
    //     },
    //     item_details: data.item,
    //     customer_details: data.customer_details,
    //     page_expiry: {
    //         duration: 72,
    //         unit: "hours"
    //     }

    // }, {
    //     headers: {
    //         'Accept': 'application/json',
    //         'Content-Type': 'application/json',
    //         'Authorization': `Basic ${apiKey}`
    //     }
    // });
    // const res = await snap.createTransaction(parameter);
    // const notif = await snap.transaction.status(`ORDER_${data.id}`);
    // const firestore = admin.firestore()
    // const orderDoc = firestore.doc(`orders/${data.id}`);
    // await orderDoc.set({
    //     status: notif
    // }, { merge: true })
  } catch (e) {
    throw new functions.https.HttpsError("internal", e.message);
  }
});

// Callable function to reserve stock when order is created (pending)
// Called from frontend after order is created
exports.reserveOrderStock = jakartaFn.https.onCall(async (data, context) => {
  try {
    const { orderId } = data;
    
    if (!orderId) {
      throw new functions.https.HttpsError("invalid-argument", "orderId is required");
    }
    
    console.log(`[RESERVE] ========== RESERVE ORDER STOCK ==========`);
    console.log(`[RESERVE] Order ID: ${orderId}`);
    
    // Get the order
    const orderDoc = await firestore.doc(`orders/${orderId}`).get();
    
    if (!orderDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Order not found");
    }
    
    const orderData = orderDoc.data();
    console.log(`[RESERVE] Order data:`, JSON.stringify({
      orderId,
      paymentStatus: orderData.paymentStatus,
      orderStatus: orderData.orderStatus,
      ordersCount: orderData.orders?.length || 0,
    }));
    
    // Check if stock already reserved
    if (orderData.stockReserved) {
      console.log(`[RESERVE] Stock already reserved for order: ${orderId}`);
      console.log(`[RESERVE] ========== RESERVE SKIPPED ==========`);
      return { success: true, message: "Stock already reserved", alreadyReserved: true };
    }
    
    // Reserve stock for each product
    if (orderData.orders && orderData.orders.length > 0) {
      console.log(`[RESERVE] Processing ${orderData.orders.length} orders`);
      
      for (const order of orderData.orders) {
        if (order.products && order.products.length > 0) {
          console.log(`[RESERVE] Processing order with ${order.products.length} products`);
          
          for (const prod of order.products) {
            console.log(`[RESERVE] Product: ${prod.nama || 'unknown'}, quantity: ${prod.quantity || 0}, id: ${prod.id || 'NO_ID'}`);
            
            if (!prod.id) {
              console.error(`[RESERVE] ✗ Product has no ID, skipping`);
              continue;
            }
            
            try {
              // Get product to find SKU
              const prodDoc = await firestore.doc(`product/${prod.id}`).get();
              if (!prodDoc.exists) {
                console.error(`[RESERVE] ✗ Product ${prod.id} not found in Firestore`);
                continue;
              }
              
              const prodData = prodDoc.data();
              const skuToSync = prodData.destySkuNumber || prodData.sku_rapin || prodData.sku;
              
              console.log(`[RESERVE] Product Firestore ID: ${prod.id}`);
              console.log(`[RESERVE] Desty SKU: ${skuToSync || 'NONE'}`);
              console.log(`[RESERVE] Current stock: Fisik=${prodData.onHandStock || 0}, Pesanan=${prodData.orderStock || 0}`);
              
              // Reserve stock
              const result = await reserveStockAtomically(
                prod.id,
                skuToSync || prod.id,
                prod.quantity || 1,
                'order_created'
              );
              
              console.log(`[RESERVE] ✓ Stock reserved: ${prod.nama} x${prod.quantity || 1}`);
              console.log(`[RESERVE]   Fisik: ${result.previousOnHandStock} (unchanged)`);
              console.log(`[RESERVE]   Pesanan: ${result.previousOrderStock} → ${result.newOrderStock} (+${prod.quantity || 1})`);
              console.log(`[RESERVE]   Tersedia: ${result.previousStok} → ${result.newStok}`);
              
              // Push to Desty
              if (skuToSync) {
                console.log(`[RESERVE] Pushing stock to Desty...`);
                const pushed = await pushStockToDesty(skuToSync, {
                  onHandStock: result.newOnHandStock,
                  orderStock: result.newOrderStock,
                  promotionStock: prodData.promotionStock || 0,
                }, prodData.nama);
                if (pushed) {
                  console.log(`[RESERVE] ✓ Stock pushed to Desty: ${skuToSync}`);
                } else {
                  console.error(`[RESERVE] ✗ Failed to push stock to Desty: ${skuToSync}`);
                }
              } else {
                console.warn(`[RESERVE] ⚠ No Desty SKU found for ${prod.nama}, skipping push to Desty`);
              }
            } catch (err) {
              console.error(`[RESERVE] ✗ Failed to reserve stock for ${prod.nama}:`, err.message);
            }
          }
        } else {
          console.log(`[RESERVE] No products in this order`);
        }
      }
    } else {
      console.log(`[RESERVE] No orders in this document`);
    }
    
    // Mark order as stock reserved
    await orderDoc.ref.update({
      stockReserved: true,
      stockReservedAt: Timestamp.now(),
    });
    
    console.log(`[RESERVE] Stock reservation COMPLETED for order: ${orderId}`);
    console.log(`[RESERVE] Checking if Desty push was successful...`);
    console.log(`[RESERVE] ========== RESERVE COMPLETE ==========`);
    
    return {
      success: true,
      message: "Stock reserved successfully"
    };
    
  } catch (e) {
    console.error("[RESERVE] Error:", e.message);
    console.error("[RESERVE] ========== RESERVE FAILED ==========");
    throw new functions.https.HttpsError("internal", e.message);
  }
});

// Callable function to cancel/return reserved stock when order is cancelled
exports.cancelOrderStock = jakartaFn.https.onCall(async (data, context) => {
  try {
    const { orderId } = data;
    
    if (!orderId) {
      throw new functions.https.HttpsError("invalid-argument", "orderId is required");
    }
    
    console.log(`[CANCEL] ========== CANCEL ORDER STOCK ==========`);
    console.log(`[CANCEL] Order ID: ${orderId}`);
    
    // Get the order
    const orderDoc = await firestore.doc(`orders/${orderId}`).get();
    
    if (!orderDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Order not found");
    }
    
    const orderData = orderDoc.data();
    console.log(`[CANCEL] Order data:`, JSON.stringify({
      orderId,
      paymentStatus: orderData.paymentStatus,
      orderStatus: orderData.orderStatus,
      ordersCount: orderData.orders?.length || 0,
    }));
    
    // Cancel stock for each product
    if (orderData.orders && orderData.orders.length > 0) {
      console.log(`[CANCEL] Processing ${orderData.orders.length} orders`);
      
      for (const order of orderData.orders) {
        if (order.products && order.products.length > 0) {
          console.log(`[CANCEL] Processing order with ${order.products.length} products`);
          
          for (const prod of order.products) {
            console.log(`[CANCEL] Product: ${prod.nama || 'unknown'}, quantity: ${prod.quantity || 0}, id: ${prod.id || 'NO_ID'}`);
            
            if (!prod.id) {
              console.error(`[CANCEL] ✗ Product has no ID, skipping`);
              continue;
            }
            
            try {
              const prodDoc = await firestore.doc(`product/${prod.id}`).get();
              if (!prodDoc.exists) {
                console.error(`[CANCEL] ✗ Product ${prod.id} not found in Firestore`);
                continue;
              }
              
              const prodData = prodDoc.data();
              const skuToSync = prodData.destySkuNumber || prodData.sku_rapin || prodData.sku;
              
              console.log(`[CANCEL] Product Firestore ID: ${prod.id}`);
              console.log(`[CANCEL] Desty SKU: ${skuToSync || 'NONE'}`);
              console.log(`[CANCEL] Current stock: Fisik=${prodData.onHandStock || 0}, Pesanan=${prodData.orderStock || 0}`);
              
              // Cancel reservation
              const result = await cancelStockReservationAtomically(
                prod.id,
                skuToSync || prod.id,
                prod.quantity || 1,
                'order_cancelled'
              );
              
              console.log(`[CANCEL] ✓ Reservation cancelled: ${prod.nama} x${prod.quantity || 1}`);
              console.log(`[CANCEL]   Fisik: ${result.previousOnHandStock} (unchanged)`);
              console.log(`[CANCEL]   Pesanan: ${result.previousOrderStock} → ${result.newOrderStock} (-${prod.quantity || 1})`);
              console.log(`[CANCEL]   Tersedia: ${result.previousStok} → ${result.newStok}`);
              
              // Push to Desty
              if (skuToSync) {
                console.log(`[CANCEL] Pushing stock to Desty...`);
                const pushed = await pushStockToDesty(skuToSync, {
                  onHandStock: result.newOnHandStock,
                  orderStock: result.newOrderStock,
                  promotionStock: prodData.promotionStock || 0,
                }, prodData.nama);
                if (pushed) {
                  console.log(`[CANCEL] ✓ Stock pushed to Desty: ${skuToSync}`);
                } else {
                  console.error(`[CANCEL] ✗ Failed to push stock to Desty: ${skuToSync}`);
                }
              } else {
                console.warn(`[CANCEL] ⚠ No Desty SKU found for ${prod.nama}, skipping push to Desty`);
              }
            } catch (err) {
              console.error(`[CANCEL] ✗ Failed to cancel reservation for ${prod.nama}:`, err.message);
            }
          }
        } else {
          console.log(`[CANCEL] No products in this order`);
        }
      }
    } else {
      console.log(`[CANCEL] No orders in this document`);
    }
    
    console.log(`[CANCEL] Stock cancellation completed for order: ${orderId}`);
    console.log(`[CANCEL] ========== CANCEL COMPLETE ==========`);
    
    return {
      success: true,
      message: "Order stock cancelled successfully"
    };
    
  } catch (e) {
    console.error("[CANCEL] Error:", e.message);
    console.error("[CANCEL] ========== CANCEL FAILED ==========");
    throw new functions.https.HttpsError("internal", e.message);
  }
});

// fulfill order - when order is sent, reduce fisik stock
exports.fulfillOrder = jakartaFn.https.onCall(async (data, context) => {
  /**
   * Saat order dikirim (sent)
   * - Stock sudah dikurangi saat order dibuat (pending)
   * - orderCount di-decrement untuk setiap produk
   */
  try {
    if (!data.id) {
      throw new functions.https.HttpsError("invalid-argument", "argumen tidak lengkap");
    }
    
    console.log(`[SENT] ========== ORDER SENT ==========`);
    console.log(`[SENT] Order ID: ${data.id}`);
    
    const orderDoc = firestore.doc(`orders/${data.id}`);
    const orderSnapshot = await orderDoc.get();
    
    if (!orderSnapshot.exists) {
      throw new functions.https.HttpsError("not-found", "Order not found");
    }
    
    const orderData = orderSnapshot.data();
    
    // Decrement orderCount for each product
    if (orderData.orders && orderData.orders.length > 0) {
      for (const order of orderData.orders) {
        if (order.products && order.products.length > 0) {
          for (const prod of order.products) {
            if (prod.id) {
              try {
                const prodDoc = await firestore.doc(`product/${prod.id}`).get();
                if (prodDoc.exists) {
                  await prodDoc.ref.update({
                    orderCount: FieldValue.increment(-(prod.quantity || 1)),
                  });
                  console.log(`[SENT] Decremented orderCount for product ${prod.id} by ${prod.quantity || 1}`);
                }
              } catch (err) {
                console.error(`[SENT] Failed to update orderCount for ${prod.id}:`, err.message);
              }
            }
          }
        }
      }
    }
    
    // Update order status to sent
    await orderDoc.update({
      orderStatus: "sent",
      sentAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    console.log(`[SENT] Order ${data.id} status updated to sent`);
    console.log(`[SENT] ========== SENT COMPLETE ==========`);
    
    return {
      success: true,
      message: `Order ${data.id} marked as sent`
    };
    
  } catch (e) {
    console.error("[SENT] Error:", e.message);
    throw new functions.https.HttpsError("internal", e.message);
  }
});

// delete payment linl
exports.deletePaymentLink = jakartaFn.https.onCall(async (data, context) => {
  try {
    if (!data.id) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "argumen tidak lengkap"
      );
    }
    const apiKey = functions.config().server.key;
    const url = functions.config().midtrans.url;
    // const status = functions.config().environment.status;

    // console.log(data)
    const response = await axios.delete(
      `${url}/v1/payment-links/ORDER_${data.id}`,
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Basic ${apiKey}`,
        },
      }
    );
    return response;
    // const res = await snap.createTransaction(parameter);
    // const notif = await snap.transaction.status(`ORDER_${data.id}`);
    // const firestore = admin.firestore()
    // const orderDoc = firestore.doc(`orders/${data.id}`);
    // await orderDoc.set({
    //     status: notif
    // }, { merge: true })
  } catch (e) {
    throw new functions.https.HttpsError("internal", e.message);
  }
});
// after payment
exports.notification = jakartaFn.https.onRequest(async (req, res) => {
  try {
    const notification = req.body;
    // sent wa

    const order_id = notification.order_id.split("_")[1];
    const order_id_customer = notification.order_id.split("_")[2];
    if (order_id && order_id !== "CUST") {
      const orderDoc = firestore.doc(`orders/${order_id}`);

      const findOrder = await orderDoc.get();
      const dataOrder = findOrder.data();
      
      if (order_id !== "ORDER" && !dataOrder.kuitansi) {
        await orderDoc.set(
          {
            paymentStatus: notification.transaction_status,
            midtransRes: notification,
          },
          { merge: true }
        );
      }
      
      // =====================================================================
      // Handle STOCK based on transaction_status
      // =====================================================================
      // 1. pending → RESERVE stock (Pesanan +1, Tersedia -1)
      // 2. settlement → No change (stock already reserved)
      // 3. cancel/expire → CANCEL reservation (Pesanan -1, Tersedia +1)
      // 4. refund → CANCEL reservation (Pesanan -1, Tersedia +1)
      // =====================================================================
      
      if (notification.transaction_status === "pending") {
        console.log("[STOCK] Order pending - RESERVING stock");
        // Reserve stock for each product in the order
        if (dataOrder.orders && dataOrder.orders.length > 0) {
          for (const order of dataOrder.orders) {
            if (order.products && order.products.length > 0) {
              for (const prod of order.products) {
                try {
                  // Get product to find SKU
                  const prodDoc = await firestore.doc(`product/${prod.id}`).get();
                  if (!prodDoc.exists) {
                    console.error(`[STOCK] Product ${prod.id} not found`);
                    continue;
                  }
                  const prodData = prodDoc.data();
                  const skuToSync = prodData.destySkuNumber || prodData.sku_rapin || prodData.sku;
                  
                  // Reserve stock
                  const result = await reserveStockAtomically(
                    prod.id,
                    skuToSync || prod.id,
                    prod.quantity,
                    'midtrans_pending'
                  );
                  
                  console.log(`[STOCK] ✓ Stock reserved: ${prod.nama} x${prod.quantity}`);
                  
                  // Push to Desty
                  if (skuToSync) {
                    await pushStockToDesty(skuToSync, {
                      onHandStock: result.newOnHandStock,
                      orderStock: result.newOrderStock,
                      promotionStock: prodData.promotionStock || 0,
                    }, prodData.nama);
                  }
                } catch (err) {
                  console.error(`[STOCK] ✗ Failed to reserve stock for ${prod.nama}:`, err.message);
                }
              }
            }
          }
        }
      }
      
      // Handle cancel, expire - CANCEL reservation
      if (notification.transaction_status === "cancel" || notification.transaction_status === "expire") {
        console.log("[STOCK] Order cancelled/expired - CANCELLING reservation");
        if (dataOrder.orders && dataOrder.orders.length > 0) {
          for (const order of dataOrder.orders) {
            if (order.products && order.products.length > 0) {
              for (const prod of order.products) {
                try {
                  const prodDoc = await firestore.doc(`product/${prod.id}`).get();
                  if (!prodDoc.exists) continue;
                  const prodData = prodDoc.data();
                  const skuToSync = prodData.destySkuNumber || prodData.sku_rapin || prodData.sku;
                  
                  const result = await cancelStockReservationAtomically(
                    prod.id,
                    skuToSync || prod.id,
                    prod.quantity,
                    'midtrans_cancel'
                  );
                  
                  console.log(`[STOCK] ✓ Reservation cancelled: ${prod.nama} x${prod.quantity}`);
                  
                  if (skuToSync) {
                    await pushStockToDesty(skuToSync, {
                      onHandStock: result.newOnHandStock,
                      orderStock: result.newOrderStock,
                      promotionStock: prodData.promotionStock || 0,
                    }, prodData.nama);
                  }
                } catch (err) {
                  console.error(`[STOCK] ✗ Failed to cancel reservation for ${prod.nama}:`, err.message);
                }
              }
            }
          }
        }
      }
      let product = [
        {
          description: "Ongkir",
          item_id: "ongkir",
          price: dataOrder.totalOngkir,
          quantity: 1,
        },
      ];
      dataOrder.orders.map((ord) =>
        ord.products.map((prod) => {
          product.push({
            description: prod.nama,
            item_id: prod.sku,
            price: prod.price,
            quantity: prod.quantity,
          });
          if (prod.discount > 0) {
            product.push({
              description: `discount-${prod.nama}`,
              item_id: prod.sku,
              price: prod.discount,
              quantity: 1,
            });
          }
        })
      );

      // Settlement - stock was already reserved when order was created (pending)
      // No stock deduction needed here
      if (notification.transaction_status === "settlement") {
        console.log("[SETTLEMENT] Order paid - stock was already reserved from pending");
        
        const totalAmount = dataOrder.totalAfterDiskonDanOngkir ?? dataOrder.totalHargaProduk + dataOrder.totalOngkir;
        await createPaymentNotification({
          invoiceId: order_id,
          orderId: order_id,
          amount: totalAmount,
          customerName: dataOrder.senderName,
          customerPhone: dataOrder.senderPhone,
          items: dataOrder.orders?.reduce((acc, ord) => acc + (ord.products?.length || 0), 0) || 0,
          paymentMethod: notification.payment_type || "midtrans",
          source: "midtrans",
        });
      }
      if (notification.transaction_status === "settlement") {
        // sent wa qontak
        const baseUrl = functions.config().qontak.baseurl;
        const token = functions.config().qontak.token;
        const templatepaymentsuccess =
          functions.config().qontak.templatepaymentsuccess;
        const channel = functions.config().qontak.channel;
        const response = await axios.post(
          baseUrl,
          {
            to_number: dataOrder.senderPhone,
            to_name: dataOrder.senderName,
            message_template_id: templatepaymentsuccess,
            channel_integration_id: channel,
            language: {
              code: "id",
            },
            parameters: {
              body: [
                {
                  key: "1",
                  value: "name",
                  value_text: dataOrder.senderName,
                },
                {
                  key: "2",
                  value: "price",
                  value_text: (
                    dataOrder.totalAfterDiskonDanOngkir ??
                    dataOrder.totalHargaProduk + dataOrder.totalOngkir
                  ).toString(),
                },
              ],
            },
          },
          {
            // baseURL: baseUrl,
            headers: {
              Authorization: `Bearer ${token}`,
              // "Content-Type": "application/json"
            },
          }
        );

        await orderDoc.set(
          {
            paidDate: Timestamp.now(),
            orderStatus: "processing",
          },
          { merge: true }
        );
        const settDoc = firestore.doc(`settings/counter/orders/counter`);

        await settDoc.set(
          {
            revenue: FieldValue.increment(
              +parseInt(dataOrder?.totalAfterDiskonDanOngkir)
            ),
            paidOrder: FieldValue.increment(+dataOrder?.orders?.length),
            totalOngkir: FieldValue.increment(
              +parseInt(dataOrder?.totalOngkir)
            ),
          },
          { merge: true }
        );
      }
      // }
      res.json({ status_code: 200 });
    } else if (order_id === "CUST") {
      console.log(order_id_customer);
      const snapshot = await firestore
        .collectionGroup("orders")
        .where("order_id", "==", order_id_customer)
        .get();
      if (snapshot.empty) {
        throw new Error("Order not found");
      }
      const orderDoc = snapshot.docs[0];
      const dataOrder = orderDoc.data();
      console.log("676", dataOrder);
      await orderDoc.ref.set(
        {
          paymentStatus: notification.transaction_status,
          midtrans: { raw: notification },
        },
        { merge: true }
      );

      if (notification.transaction_status === "settlement") {
        await Promise.all(
          dataOrder.orders.map(async (data) => {
            await Promise.all(
              data.products.map(async (prod) => {
                await firestore.doc(`product/${prod.id}`).set(
                  {
                    updatedAt: Timestamp.now(),
                    stok: FieldValue.increment(-prod.quantity),
                    qty_sold: FieldValue.increment(+prod.quantity),
                  },
                  { merge: true }
                );
              })
            );
          })
        );
      }
      res.json({ status_code: 200 });
    }
  } catch (e) {
    console.log(e);
    res.json({ status_code: 400 });
  }
});

// notif paper
exports.paperNotification = jakartaFn.https.onRequest(async (req, res) => {
  try {
    const notification = req.body;
    // sent wa
    console.log("resPaper", notification);
    const order_id = notification.data.invoice.number;
    // const order_id_customer = notification.order_id.split("_")[3];
    if (order_id) {
      const orderDoc = firestore.doc(`orders/${order_id}`);
      if (notification.data.invoice.status === "paid") {
        await orderDoc.set(
          {
            paymentStatus: "settlement",
            paperRes: notification,
          },
          { merge: true }
        );
      } else {
        await orderDoc.set(
          {
            paymentStatus: notification.data.invoice.status,
            paperRes: notification,
          },
          { merge: true }
        );
      }

      // if (notification.transaction_status === 'pending') {
      const findOrder = await orderDoc.get();
      const dataOrder = findOrder.data();
      let product = [
        {
          description: "Ongkir",
          item_id: "ongkir",
          price: dataOrder.totalOngkir,
          quantity: 1,
        },
      ];
      dataOrder.orders.map((ord) =>
        ord.products.map((prod) => {
          product.push({
            description: prod.nama,
            item_id: prod.sku,
            price: prod.price,
            quantity: prod.quantity,
          });
          if (prod.discount > 0) {
            product.push({
              description: `discount-${prod.nama}`,
              item_id: prod.sku,
              price: prod.discount,
              quantity: 1,
            });
          }
        })
      );

      if (notification.data.invoice.status === "paid") {
        await Promise.all(
          dataOrder.orders.map(async (data) => {
            await Promise.all(
              data.products.map(async (prod) => {
                await firestore.doc(`product/${prod.id}`).set(
                  {
                    updatedAt: Timestamp.now(),
                    stok: FieldValue.increment(-prod.quantity),
                    qty_sold: FieldValue.increment(+prod.quantity),
                  },
                  { merge: true }
                );
              })
            );
          })
        );

        // Create payment notification for Paper.id
        const totalAmount = dataOrder.totalAfterDiskonDanOngkir ?? dataOrder.totalHargaProduk + dataOrder.totalOngkir;
        await createPaymentNotification({
          invoiceId: order_id,
          orderId: order_id,
          amount: totalAmount,
          customerName: dataOrder.senderName,
          customerPhone: dataOrder.senderPhone,
          items: dataOrder.orders?.reduce((acc, ord) => acc + ord.products?.length, 0) || 0,
          paymentMethod: "paper_id",
          source: "paper_notification",
        });
      }
      if (notification.data.invoice.status === "paid") {
        // sent wa qontak
        const baseUrl = functions.config().qontak.baseurl;
        const token = functions.config().qontak.token;
        const templatepaymentsuccess =
          functions.config().qontak.templatepaymentsuccess;
        const channel = functions.config().qontak.channel;
        const response = await axios.post(
          baseUrl,
          {
            to_number: dataOrder.senderPhone,
            to_name: dataOrder.senderName,
            message_template_id: templatepaymentsuccess,
            channel_integration_id: channel,
            language: {
              code: "id",
            },
            parameters: {
              body: [
                {
                  key: "1",
                  value: "name",
                  value_text: dataOrder.senderName,
                },
                {
                  key: "2",
                  value: "price",
                  value_text: (
                    dataOrder.totalAfterDiskonDanOngkir ??
                    dataOrder.totalHargaProduk + dataOrder.totalOngkir
                  ).toString(),
                },
              ],
            },
          },
          {
            // baseURL: baseUrl,
            headers: {
              Authorization: `Bearer ${token}`,
              // "Content-Type": "application/json"
            },
          }
        );

        await orderDoc.set(
          {
            paidDate: Timestamp.now(),
            orderStatus: "processing",
          },
          { merge: true }
        );
        const settDoc = firestore.doc(`settings/counter/orders/counter`);

        await settDoc.set(
          {
            revenue: FieldValue.increment(
              +parseInt(dataOrder?.totalHargaProduk)
            ),
            totalOrder: FieldValue.increment(+dataOrder?.orders?.length),
            paidOrder: FieldValue.increment(+dataOrder?.orders?.length),
            totalOngkir: FieldValue.increment(
              +parseInt(dataOrder?.totalOngkir)
            ),
          },
          { merge: true }
        );
      }
      // }
      res.json({ status_code: 200 });
    }
  } catch (e) {
    console.log(e);
    res.json({ status_code: 400 });
  }
});

// add user
exports.createUser = jakartaFn.https.onCall(async (data, context) => {
  let isError = false;

  try {
    const createUser = await admin.auth().createUser({
      email: data.email,
      password: data.password,
    });
    return createUser;
  } catch (error) {
    switch (error.code) {
      case "auth/email-already-exists":
        message = `email ${data.email} sudah digunakan`;
        isError = true;
        break;
      default:
        message = `${data.email} - ${error.code}`;
        isError = true;
        break;
    }
  }

  if (isError) {
    throw new functions.https.HttpsError("already-exists", message);
    // return message;
  }
});
// delete user
exports.deleteUser = jakartaFn.https.onCall(async (data, context) => {
  try {
    const deleteUser = await admin.auth().deleteUser(data.id);
    return deleteUser;
  } catch (error) {
    throw new functions.https.HttpsError("error", error.message);
  }
});
exports.getDistrict = jakartaFn.https.onCall(async (data, context) => {
  try {
    if (!data.value) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "argumen tidak lengkap"
      );
    }
    const apiKey = functions.config().biteship.dev;
    // console.log(data)
    const response = await axios.get("/v1/maps/areas", {
      params: {
        countries: "ID",
        input: data.value,
        type: "single",
      },
      baseURL: "https://api.biteship.com",
      headers: {
        authorization: apiKey,
      },
    });

    return {
      items: response.data,
    };
  } catch (e) {
    throw new functions.https.HttpsError("internal", e.message);
  }
});

exports.getRates = jakartaFn.https.onCall(async (data, context) => {
  try {
    if (
      !data.items ||
      !data.origin_latitude ||
      !data.origin_longitude ||
      !data.destination_latitude ||
      !data.destination_longitude
    ) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "argumen tidak lengkap"
      );
    }
    const apiKey = functions.config().biteship.dev;
    // console.log(data)
    const response = await axios.post(
      "/v1/rates/couriers",
      {
        origin_latitude: data.origin_latitude,
        origin_longitude: data.origin_longitude,
        destination_latitude: data.destination_latitude,
        destination_longitude: data.destination_longitude,
        couriers: "paxel,sap,lalamove",
        items: data.items,
      },
      {
        baseURL: "https://api.biteship.com",
        headers: {
          authorization: apiKey,
        },
      }
    );

    return {
      items: response.data,
    };
  } catch (e) {
    throw new functions.https.HttpsError("internal", e.message);
  }
});

exports.qontakSendWAToSender = jakartaFn.https.onCall(async (data, context) => {
  try {
    const baseUrl = functions.config().qontak.baseurl;
    const token = functions.config().qontak.token;
    const templateresitoreceiver =
      functions.config().qontak.templateresitoreceiver;
    const templatepembayaran = functions.config().qontak.templatepembayaran;
    const templateresitosender = functions.config().qontak.templateresitosender;
    const channel = functions.config().qontak.channel;
    // console.log(data)
    if (data.type === "pembayaran") {
      if (!data.no || !data.name || !data.price || !data.link) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "argumen tidak lengkap"
        );
      }
      const response = await axios.post(
        baseUrl,
        {
          to_number: data.no,
          to_name: data.name,
          message_template_id: templatepembayaran,
          channel_integration_id: channel,
          language: {
            code: "id",
          },
          parameters: {
            body: [
              {
                key: "1",
                value: "full_name",
                value_text: data.name,
              },
              {
                key: "2",
                value: "price",
                value_text: data.price,
              },
              {
                key: "3",
                value: "link",
                value_text: data.link,
              },
            ],
          },
        },
        {
          // baseURL: baseUrl,
          headers: {
            Authorization: `Bearer ${token}`,
            // "Content-Type": "application/json"
          },
        }
      );

      return {
        items: response.data,
      };
    } else if (data.type === "resi_to_sender") {
      if (
        !data.receiver ||
        !data.name ||
        !data.resi ||
        !data.kurir ||
        !data.no
      ) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "argumen tidak lengkap"
        );
      }
      const response = await axios.post(
        baseUrl,
        {
          to_number: data.no,
          to_name: data.name,
          message_template_id: templateresitosender,
          channel_integration_id: channel,
          language: {
            code: "id",
          },
          parameters: {
            body: [
              {
                key: "1",
                value: "full_name",
                value_text: data.name,
              },
              {
                key: "2",
                value: "receiver",
                value_text: data.receiver,
              },
              {
                key: "3",
                value: "resi",
                value_text: data.resi,
              },
              {
                key: "4",
                value: "kurir",
                value_text: data.kurir,
              },
            ],
          },
        },
        {
          // baseURL: baseUrl,
          headers: {
            Authorization: `Bearer ${token}`,
            // "Content-Type": "application/json"
          },
        }
      );

      return {
        items: response.data,
      };
    } else if (data.type === "resi_to_receiver") {
      if (
        !data.no ||
        !data.name ||
        !data.sender ||
        !data.id ||
        !data.resi ||
        !data.kurir
      ) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "argumen tidak lengkap"
        );
      }
      const response = await axios.post(
        baseUrl,
        {
          to_number: data.no,
          to_name: data.name,
          message_template_id: templateresitoreceiver,
          channel_integration_id: channel,
          language: {
            code: "id",
          },
          parameters: {
            body: [
              {
                key: "1",
                value: "full_name",
                value_text: data.name,
              },
              {
                key: "2",
                value: "sender",
                value_text: data.sender,
              },
              {
                key: "3",
                value: "id",
                value_text: data.id,
              },
              {
                key: "4",
                value: "resi",
                value_text: data.resi,
              },
              {
                key: "5",
                value: "kurir",
                value_text: data.kurir,
              },
            ],
          },
        },
        {
          // baseURL: baseUrl,
          headers: {
            Authorization: `Bearer ${token}`,
            // "Content-Type": "application/json"
          },
        }
      );

      return {
        items: response.data,
      };
    } else if (data.type === "dp") {
      if (!data.no || !data.name || !data.price) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "argumen tidak lengkap"
        );
      }
      const templatepaymentsuccess =
        functions.config().qontak.templatepaymentsuccess;
      const response = await axios.post(
        baseUrl,
        {
          to_number: data.no,
          to_name: data.name,
          message_template_id: templatepaymentsuccess,
          channel_integration_id: channel,
          language: {
            code: "id",
          },
          parameters: {
            body: [
              {
                key: "1",
                value: "name",
                value_text: data.name,
              },
              {
                key: "2",
                value: "price",
                value_text: data.price.toString(),
              },
            ],
          },
        },
        {
          // baseURL: baseUrl,
          headers: {
            Authorization: `Bearer ${token}`,
            // "Content-Type": "application/json"
          },
        }
      );
      return {
        items: response.data,
      };
    }
  } catch (e) {
    throw new functions.https.HttpsError("internal", e.message);
  }
});

exports.qontakGetRefreshToken = jakartaFn.https.onCall(
  async (data, context) => {
    try {
      const client_id = functions.config().qontak.client_id;
      const client_secret = functions.config().qontak.client_secret;

      // console.log(data)
      const response = await axios.post(
        "/oauth/token",
        {
          refresh_token: data.refresh_token,
          grant_type: "refresh_token",
          client_id: client_id,
          client_secret: client_secret,
        },
        {
          baseURL: "https://service-chat.qontak.com/api/open/v1",
          // headers: {
          //     authorization: apiKey,
          // },
        }
      );

      return {
        items: response.data,
      };
    } catch (e) {
      throw new functions.https.HttpsError("internal", e.message);
    }
  }
);
// exports.addMessage = functions.https.onCall((data, context) => {
//     // ...
// });

// exports.createInvoice = jakartaFn.https.onCall(async (data, context) => {
//     try {
//         if (!data.id) {
//             throw new functions.https.HttpsError("invalid-argument", "argumen tidak lengkap")
//         }
//         const firestore = admin.firestore()

//         const orderDoc = firestore.doc(`orders/${data.id}`);

//         const findOrder = await orderDoc.get();
//         const dataOrder = findOrder.data();
//         let product = []
//         let discount = dataOrder.additionalDiscount
//         dataOrder.orders.map((ord) =>
//             ord.products.map((prod) => {

//                 product.push({
//                     description: prod.nama,
//                     item_id: prod.sku,
//                     price: prod.price,
//                     quantity: prod.quantity
//                 })
//                 if (prod.discount > 0) {
//                     discount += prod.discount
//                 }
//             })
//         );

//         const apiKey = functions.config().server.key;

//         const response = await axios.post("https://api.sandbox.midtrans.com/v1/invoices", {
//             "order_id": dataOrder.midtransRes.order_id,
//             "invoice_number": dataOrder.midtransRes.transaction_id,
//             "due_date": `${dataOrder.midtransRes.expiry_time} +0700`,
//             "invoice_date": `${dataOrder.midtransRes.transaction_time} +0700`,
//             "customer_details": {
//                 "name": dataOrder.senderName,
//                 "email": dataOrder.email,
//                 "phone": dataOrder.senderPhone
//             },
//             "payment_type": 'payment_link',
//             "item_details": product,
//             "amount": {
//                 "discount": discount,
//                 "shipping": dataOrder.totalOngkir
//             }
//         }, {
//             headers: {
//                 'Accept': 'application/json',
//                 'Content-Type': 'application/json',
//                 'Authorization': `Basic ${apiKey}`
//             }
//         });

//         await orderDoc.set({
//             invoice: response.data
//         }, { merge: true })

//         return {

//             items: response.data
//         };
//     } catch (e) {

//         throw new functions.https.HttpsError("internal", e.message)
//     }

// });

// Set up Nodemailer (using Gmail example)

// Function to send reminder email
const sendReminderEmail = async (email, link, reminderType) => {
  const subject =
    reminderType === "H+1"
      ? "Payment Reminder (H+1)"
      : "Final Payment Reminder (H+5)";
  const text =
    reminderType === "H+1"
      ? `Hi ka!\n
Barangkali lupa Mica mau mengingatkan untuk melakukan pembayaran link berikut ya.\n\n

${link}\n\n

Maaf ganggu & Thank you!`
      : `Hi ka!\n
Mau info bahwa link pembayaran untuk order kaka akan expired. segera lakukan payment ya kalau jadi order.\n\n 

${link}\n\n

Thank you:) `;
};

// Cloud Function to check for H+1 and H+5 reminders (runs every day)
exports.sendPaymentReminders = jakartaFn.pubsub
  .schedule("every 24 hours")
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();

    try {
      const ordersSnapshot = await firestore
        .collection("orders")
        .where("paymentStatus", "==", "pending") // Check only pending payments
        .get();

      for (const doc of ordersSnapshot.docs) {
        const orderData = doc.data();
        const createdAt = orderData.createdAt?.toDate();
        const currentDate = now.toDate();

        // Log dates for debugging
        console.log("createdAt:", createdAt);
        console.log("currentDate:", currentDate);

        const daysSinceCreation = Math.floor(
          (currentDate - createdAt) / (1000 * 60 * 60 * 24)
        );

        // Log daysSinceCreation for debugging
        console.log("daysSinceCreation:", daysSinceCreation);

        // Qontak API configuration
        const baseUrl = functions.config().qontak.baseurl;
        const token = functions.config().qontak.token;
        const channel = functions.config().qontak.channel;
        const reminderH1 = functions.config().qontak.reminder.h1;
        const reminderH5 = functions.config().qontak.reminder.h5;

        // Log reminder flags for debugging
        console.log("reminders.day1:", orderData?.reminders?.day1);
        console.log("reminders.day5:", orderData?.reminders?.day5);

        // H+1 Day Reminder
        if (daysSinceCreation === 1 && !orderData?.reminders?.day1) {
          console.log(`Sending H+1 reminder for order: ${doc.id}`);

          try {
            await axios.post(
              baseUrl,
              {
                to_number: orderData.senderPhone,
                to_name: orderData.senderName,
                message_template_id: reminderH1,
                channel_integration_id: channel,
                language: {
                  code: "id",
                },
                parameters: {
                  body: [
                    {
                      key: "1",
                      value: "link",
                      value_text: orderData?.midtrans?.redirect_url,
                    },
                  ],
                },
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            // Mark reminder as sent
            await doc.ref.update({ "reminders.day1": true });
            console.log(`H+1 reminder sent for order: ${doc.id}`);
          } catch (error) {
            console.error(
              `Error sending H+1 reminder for order: ${doc.id}`,
              error
            );
          }
        }

        // H+5 Day Reminder
        if (daysSinceCreation === 5 && !orderData?.reminders?.day5) {
          console.log(`Sending H+5 reminder for order: ${doc.id}`);

          try {
            await axios.post(
              baseUrl,
              {
                to_number: orderData.senderPhone,
                to_name: orderData.senderName,
                message_template_id: reminderH5,
                channel_integration_id: channel,
                language: {
                  code: "id",
                },
                parameters: {
                  body: [
                    {
                      key: "1",
                      value: "link",
                      value_text: orderData?.midtrans?.redirect_url,
                    },
                  ],
                },
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            // Mark reminder as sent
            await doc.ref.update({ "reminders.day5": true });
            console.log(`H+5 reminder sent for order: ${doc.id}`);
          } catch (error) {
            console.error(
              `Error sending H+5 reminder for order: ${doc.id}`,
              error
            );
          }
        }

        // Add a delay between processing orders
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }

      console.log("Payment reminders sent successfully.");
    } catch (error) {
      console.error("Error in sendPaymentReminders function:", error);
    }
  });

// paper id
exports.createPartner = jakartaFn.https.onCall(async (data, context) => {
  try {
    if (!data.phone || !data.name || !data.number || !data.type) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "argumen tidak lengkap"
      );
    }
    const client_id = functions.config().paperid.client_id;
    const client_secret = functions.config().paperid.client_secret;
    const baseURL = functions.config().paperid.url;

    const response = await axios.post(
      "/v2/partners",
      {
        phone: data.phone,
        name: data.name,
        number: data.number,
        type: data.type,
      },
      {
        baseURL: baseURL,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          // 'Authorization': `Basic ${apiKey}`
          client_id: client_id,
          client_secret: client_secret,
        },
      }
    );

    return {
      items: response.data,
    };
  } catch (e) {
    throw new functions.https.HttpsError("internal", e.message);
  }
});

exports.createTransaction = jakartaFn.https.onCall(async (data, context) => {
  try {
    if (!data.data) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing transaction data"
      );
    }
    const client_id = functions.config().paperid.client_id;
    const client_secret = functions.config().paperid.client_secret;
    const baseURL = functions.config().paperid.url;
    console.log(data);
    const response = await axios({
      method: "post",
      url: `${baseURL}/v1/store-invoice`,
      data: data.data, // Pass the transaction data directly
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        client_id: client_id,
        client_secret: client_secret,
      },
      timeout: 10000, // 10 seconds timeout
    });

    console.log(response.data);
    // const itemLinks = response.data.data.payment_id;
    // const resTrans = await axios({
    //   method: "get",
    //   url: `${baseURL}/v1/payment/request/${itemLinks}`,
    //   headers: {
    //     Accept: "application/json",
    //     "Content-Type": "application/json",
    //     client_id: client_id,
    //     client_secret: client_secret,
    //   },
    //   timeout: 10000, // 10 seconds timeout
    // });
    return {
      items: response.data,
    };
  } catch (e) {
    throw new functions.https.HttpsError("internal", e.message);
  }
});

// ==========================================
// DESTY OMNI INTEGRATION FUNCTIONS
// ==========================================

// Desty API Configuration
const DESTY_API_BASE = "https://api.desty.app";
const DESTY_APPLY_ID = "e384d7c6-b5a0-46ef-8165-e7cc4ffbb3fe";
const DESTY_USERNAME = "+6281215571500";
const DESTY_MOBILE = "+6281215571500";
const DESTY_WAREHOUSE_ID = "crm-warehouse"; // External Warehouse ID (dari /api/warehouse/list)

// Helper function to get Desty access token
async function getDestyAccessToken() {
  try {
    // Request new token directly (skip cache for now)
    console.log("Requesting new Desty access token...");
    const response = await axios.post(`${DESTY_API_BASE}/api/auth/token`, {
      applyId: DESTY_APPLY_ID,
      username: DESTY_USERNAME,
      mobile: DESTY_MOBILE,
    });

    if (response.data.code === "0" && response.data.data) {
      const { accessToken, tokenType, expireTime } = response.data.data;
      console.log("Got new Desty token successfully, expires at:", expireTime);
      return accessToken;
    }

    throw new Error("Failed to get Desty access token: " + JSON.stringify(response.data));
  } catch (error) {
    console.error("Error getting Desty access token:", error.message);
    throw error;
  }
}

// Helper function to make authenticated Desty API requests
async function destyApiRequest(endpoint, method = "POST", body = null) {
  const accessToken = await getDestyAccessToken();
  console.log("Using token (first 50 chars):", accessToken ? accessToken.substring(0, 50) : "EMPTY");

  const config = {
    method,
    url: `${DESTY_API_BASE}/${endpoint}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  };

  console.log("Request to:", config.url);
  console.log("Headers:", JSON.stringify(config.headers));

  if (body) {
    config.data = body;
  }

  const response = await axios(config);
  console.log("Response status:", response.status);
  console.log("Response data:", JSON.stringify(response.data).substring(0, 200));
  return response.data;
}

// Desty Webhook Handler - receives order notifications from Desty
exports.destyWebhook = jakartaFn.https.onRequest(async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, accessToken');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  try {
    console.log("Desty Webhook received:", JSON.stringify(req.body, null, 2));

    // Validate request
    if (req.method !== "POST") {
      console.log("Invalid method:", req.method);
      return res.status(405).send("Method not allowed");
    }

    // Check if webhook is enabled in config
    const webhookConfig = await getWebhookConfig();

    if (!webhookConfig.enabled) {
      console.log("⚠️ [DESTY-WEBHOOK] Webhook is DISABLED in config - skipping processing");
      console.log("⚠️ [DESTY-WEBHOOK] To enable: Set webhookConfig.enabled: true in desty_settings/webhook_config");

      // Log the disabled webhook for tracking
      try {
        await firestore.collection("desty_order_logs").add({
          receivedAt: admin.firestore.Timestamp.now(),
          status: "received_but_webhook_disabled",
          reason: "webhookConfig.enabled is false in desty_settings/webhook_config",
          rawPayload: req.body,
        });
      } catch (logError) {
        console.error("Error logging disabled webhook:", logError.message);
      }

      return res.status(200).json({ status: "disabled" });
    }

    const payload = req.body;

    // Check if this is an order webhook
    if (payload.orderId || payload.orderSn) {
      await handleDestyOrderWebhook(payload);
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({ status: "received" });
  } catch (error) {
    console.error("Error processing Desty webhook:", error);
    // Still return 200 to prevent Desty from retrying
    res.status(200).json({ status: "error", message: error.message });
  }
});

// Helper function to get webhook config
async function getWebhookConfig() {
  try {
    const configDoc = await firestore.doc("desty_settings/webhook_config").get();

    if (configDoc.exists) {
      return configDoc.data();
    }

    // Default config
    return {
      enabled: true,
      retryCount: 3,
      retryDelayMs: 1000,
      validateSignature: false,
    };
  } catch (error) {
    console.error("[DESTY-WEBHOOK] Error loading webhook config:", error.message);
    // Default to enabled on error
    return { enabled: true };
  }
}

// Handle Desty order webhook
async function handleDestyOrderWebhook(payload) {
  const {
    orderId,
    orderSn,
    orderStatusList,
    hasPaid,
    itemList,
    createTime,
    orderUpdateTime,
  } = payload;

  console.log(`Processing Desty order: ${orderId} (${orderSn})`);
  console.log("Order status list:", orderStatusList);
  console.log("Has paid:", hasPaid);
  console.log("Item list:", JSON.stringify(itemList));

  // Log to Firestore for audit trail (handle undefined values)
  await firestore.collection("desty_order_logs").add({
    orderId: orderId || null,
    orderSn: orderSn || null,
    orderStatusList: orderStatusList || [],
    hasPaid: hasPaid || false,
    itemList: itemList || [],
    createTime: createTime || null,
    orderUpdateTime: orderUpdateTime || null,
    receivedAt: Timestamp.now(),
    rawPayload: payload,
  });

  // Check safety config
  const safetyConfig = await getSafetyConfig();
  
  console.log("[SAFETY] Current safety config:", JSON.stringify({
    stockDeductionEnabled: safetyConfig.stockDeductionEnabled,
    dryRunMode: safetyConfig.dryRunMode,
    confirmedStatuses: safetyConfig.confirmedStatuses,
    idempotencyEnabled: safetyConfig.idempotencyEnabled
  }));

  // Check if stock deduction is enabled
  if (!safetyConfig.stockDeductionEnabled) {
    console.log("⚠️ [SAFETY] Stock deduction is DISABLED in config");
    console.log("⚠️ [SAFETY] To enable: Set stockDeductionEnabled: true in desty_settings/safety_config");
    
    // Still log the order for tracking
    await firestore.collection("desty_order_logs").add({
      orderId: orderId || null,
      orderSn: orderSn || null,
      receivedAt: Timestamp.now(),
      status: "received_but_deduction_disabled",
      reason: "stockDeductionEnabled is false in safety config"
    });
    
    return; // Exit early - NO STOCK DEDUCTION
  }

  // Check if dry run mode is enabled
  if (safetyConfig.dryRunMode) {
    console.log("⚠️ [SAFETY] DRY RUN MODE is ENABLED");
    console.log("⚠️ [SAFETY] No stock will be actually deducted");
    console.log("⚠️ [SAFETY] To disable: Set dryRunMode: false in desty_settings/safety_config");
    
    // Log what WOULD have been processed
    await firestore.collection("desty_order_logs").add({
      orderId: orderId || null,
      orderSn: orderSn || null,
      receivedAt: Timestamp.now(),
      status: "dry_run",
      itemList: itemList || [],
      reason: "dryRunMode is true in safety config"
    });
    
    return; // Exit early - NO STOCK DEDUCTION
  }

  // Check if order was already processed (idempotency)
  if (safetyConfig.idempotencyEnabled) {
    const existingOrder = await firestore
      .collection("desty_order_logs")
      .where("orderSn", "==", orderSn)
      .where("stockDeducted", "==", true)
      .limit(1)
      .get();
    
    if (!existingOrder.empty) {
      console.log(`⚠️ [SAFETY] Order ${orderSn} already processed - SKIPPING (idempotency)`);
      return; // Exit early - ORDER ALREADY PROCESSED
    }
  }

  // Check if order is settled (STRICT CHECK using config)
  const isSettled = hasPaid === true && orderStatusList?.some(status => 
    safetyConfig.confirmedStatuses.includes(status)
  );

  console.log("Is settled:", isSettled);
  console.log("[SAFETY] Using confirmed statuses:", safetyConfig.confirmedStatuses);

  if (isSettled && itemList && itemList.length > 0) {
    console.log("Order is settled, syncing stock from Desty onHandStock...");

    // Log that we're about to process
    await firestore.collection("desty_order_logs").add({
      orderId: orderId || null,
      orderSn: orderSn || null,
      receivedAt: Timestamp.now(),
      status: "processing_stock_sync",
      itemList: itemList || []
    });

    await syncStockFromDestyWebhook(itemList, orderSn);
  } else {
    console.log("Order not in confirmed status, skipping stock sync");
  }
}

// Process stock SYNC from Desty webhook
// NOTE: Desty is the authoritative source for stock. We SYNC, not deduct.
async function syncStockFromDestyWebhook(itemList, orderSn) {
  console.log(`🚨 [DESTY SYNC START] Processing order ${orderSn} with ${itemList?.length || 0} items`);

  let processedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  let fetchCount = 0; // Items that needed API fetch for onHandStock

  for (const item of itemList) {
    const { itemCode, skuNumber, quantity, itemName, itemId, onHandStock } = item;

    // Find product in Carramica by skuNumber
    const skuToMatch = skuNumber || itemCode;

    if (!skuToMatch) {
      console.log(`Skipping item ${itemId} - no SKU code found`);
      skippedCount++;
      continue;
    }

    // Desty stock calculation:
    // Stok Tersedia = onHandStock - promotionStock - orderStock
    // If webhook payload doesn't include promotionStock/orderStock, we need to fetch from API
    let availableStock = onHandStock;

    if (onHandStock !== undefined && onHandStock !== null) {
      // If we have full stock details from webhook (including promotionStock and orderStock)
      const promotionStock = item.promotionStock || 0;
      const orderStock = item.orderStock || 0;
      const reservedStock = promotionStock + orderStock;
      availableStock = Math.max(0, onHandStock - reservedStock);

      console.log(`[DESTY-WEBHOOK] Stock calculation for ${skuToMatch}:`);
      console.log(`  onHandStock: ${onHandStock}, promotionStock: ${promotionStock}, orderStock: ${orderStock}`);
      console.log(`  ReservedStock: ${reservedStock}, Stok Tersedia: ${availableStock}`);
    }

    try {
      // Find product by destySkuNumber
      let productSnapshot = await firestore
        .collection("product")
        .where("destySkuNumber", "==", skuToMatch)
        .limit(1)
        .get();

      // If not found by destySkuNumber, try by sku or sku_rapin
      let productDoc = null;
      if (productSnapshot.empty) {
        productSnapshot = await firestore
          .collection("product")
          .where("sku", "==", skuToMatch)
          .limit(1)
          .get();

        if (!productSnapshot.empty) {
          productDoc = productSnapshot.docs[0];
        } else {
          const rapinSnapshot = await firestore
            .collection("product")
            .where("sku_rapin", "==", skuToMatch)
            .limit(1)
            .get();

          if (!rapinSnapshot.empty) {
            productDoc = rapinSnapshot.docs[0];
          }
        }
      } else {
        productDoc = productSnapshot.docs[0];
      }

      if (!productDoc) {
        console.log(`Product with SKU ${skuToMatch} not found in Carramica`);
        skippedCount++;
        continue;
      }

      const previousStock = productDoc.data().stok || 0;

      // Determine the available stock value
      let stockToSync = availableStock;

      // If onHandStock not in payload, fetch from Desty API to get full stock details
      if (onHandStock === undefined || onHandStock === null) {
        console.log(`[DESTY-WEBHOOK] onHandStock not in payload, fetching from Desty API for ${skuToMatch}...`);
        const destyStockDetails = await getDestySkuDetail(skuToMatch);
        if (destyStockDetails !== null) {
          // Calculate Stok Tersedia from API response
          const onHand = destyStockDetails.stock || 0;
          // Note: getDestySkuDetail returns stock already calculated for Gudang Online
          stockToSync = Math.max(0, onHand);
          fetchCount++;
          console.log(`[DESTY-WEBHOOK] Fetched stock from API: ${skuToMatch} = ${stockToSync}`);
        } else {
          console.warn(`[DESTY-WEBHOOK] Could not fetch stock for ${skuToMatch}, skipping...`);
          skippedCount++;
          continue;
        }
      }

      // Update stock to Stok Tersedia (SYNC, not deduct)
      await productDoc.ref.update({
        stok: stockToSync,
        destyLastSync: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      console.log(`✅ [DESTY-WEBHOOK] Stock SYNCED: ${skuToMatch} from ${previousStock} → ${stockToSync} (Stok Tersedia)`);
      processedCount++;

      // Log the sync
      await firestore.collection("desty_stock_sync_logs").add({
        skuNumber: skuToMatch,
        productId: productDoc.id,
        productName: itemName || productDoc.data().nama,
        previousStock: previousStock,
        newStock: stockToSync,
        onHandStock: onHandStock || null,
        orderSn: orderSn,
        syncType: "desty_webhook_sync",
        syncSource: onHandStock !== undefined ? "webhook_payload" : "desty_api",
        syncedAt: Timestamp.now(),
      });

    } catch (error) {
      console.error(`[DESTY-WEBHOOK] Error syncing stock for ${skuToMatch}:`, error.message);
      errorCount++;
    }
  }

  console.log(`🏁 [DESTY SYNC COMPLETE] Order ${orderSn}: processed=${processedCount}, skipped=${skippedCount}, errors=${errorCount}, fetchedFromAPI=${fetchCount}`);


  // Mark order as processed for idempotency
  await firestore.collection("desty_order_logs").add({
    orderSn: orderSn,
    stockSynced: true,
    syncType: "desty_webhook_sync",
    processedAt: Timestamp.now(),
    summary: { processed: processedCount, skipped: skippedCount, errors: errorCount, fetchedFromAPI: fetchCount }
  });
}

// Atomic stock deduction with transaction to handle concurrent updates
// =====================================================================
// STOCK MANAGEMENT FUNCTIONS
// =====================================================================
//
// Alur Stock untuk Website Carramica:
// --------------------
// 1. Order dibuat (pending) → Pesanan +1, Tersedia -1
// 2. Order dibayar (settlement/processing) → Nilai tetap
// 3. Order dikirim (sent) → Fisik -1, Pesanan -1, Tersedia 0 (back to original -1)
// 4. Order dibatalkan (cancel/refund/expire) → Pesanan -1, Tersedia +1
//

/**
 * RESERVE stock when order is created (pending status)
 * - Fisik: tetap
 * - Pesanan: +quantity
 * - Tersedia: -quantity
 */
async function reserveStockAtomically(productId, skuNumber, quantity, source) {
  /**
   * Saat order dibuat (pending)
   * - Fisik (onHandStock): -quantity (barang keluar dari gudang)
   * - Promosi (promotionStock): unchanged
   * - Pesanan (orderStock): unchanged (ini Pesanan Desty, bukan order website)
   * - Tersedia (stok): -quantity = Fisik - Promosi - Pesanan
   */
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const result = await firestore.runTransaction(async (transaction) => {
        const productRef = firestore.doc(`product/${productId}`);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists) {
          throw new Error(`Product ${productId} not found`);
        }

        const prodData = productDoc.data();
        
        const currentOnHandStock = prodData.onHandStock || 0;
        const currentPromotionStock = prodData.promotionStock || 0;
        const currentOrderStock = prodData.orderStock || 0;
        const currentStok = prodData.stok || 0;

        // Fisik: -quantity (barang keluar), Promosi: unchanged, Pesanan: unchanged
        const newOnHandStock = Math.max(0, currentOnHandStock - quantity);
        const newOrderStock = currentOrderStock;  // Pesanan Desty tidak berubah
        const newPromotionStock = currentPromotionStock;
        const newStok = Math.max(0, newOnHandStock - newPromotionStock - newOrderStock);

        transaction.update(productRef, {
          onHandStock: newOnHandStock,
          promotionStock: newPromotionStock,
          orderStock: newOrderStock,
          stok: newStok,
          orderCount: FieldValue.increment(quantity),  // +qty untuk tracking order aktif
          updatedAt: Timestamp.now(),
        });

        return {
          productId: productId,
          skuNumber: skuNumber,
          previousOnHandStock: currentOnHandStock,
          newOnHandStock: newOnHandStock,
          previousOrderStock: currentOrderStock,
          newOrderStock: newOrderStock,
          previousStok: currentStok,
          newStok: newStok,
          quantityChanged: quantity,
          source: source,
        };
      });

      console.log(`[STOCK-RESERVE] ${skuNumber}: Fisik ${result.previousOnHandStock}→${result.newOnHandStock} (-${quantity}), Tersedia ${result.previousStok}→${result.newStok}`);
      return result;

    } catch (error) {
      attempt++;
      console.error(`[STOCK-RESERVE] Attempt ${attempt} failed for ${skuNumber}:`, error.message);
      if (attempt >= maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 100 * attempt));
    }
  }
}

/**
 * FULFILL stock when order is sent (sent status)
 * NO-OP: Stock sudah dikurangi saat order dibuat (pending)
 * Jadi tidak ada perubahan lagi saat order dikirim
 */
async function fulfillStockAtomically(productId, skuNumber, quantity, source) {
  /**
   * Saat order dikirim (sent) - NO OPERATION
   * Stock sudah dikurangi saat order dibuat (pending)
   * Tidak ada perubahan lagi di Firestore maupun Desty
   */
  console.log(`[STOCK-FULFILL] ${skuNumber}: NO-OP (stock already decremented at order creation)`);
  
  return {
    productId: productId,
    skuNumber: skuNumber,
    noOperation: true,
    reason: "Stock already decremented when order was created (pending)",
    source: source,
  };
}

/**
 * CANCEL/RESTOCK when order is cancelled, refunded, expired, denied
 * - Fisik (onHandStock): +quantity (barang kembali ke gudang)
 * - Promosi (promotionStock): unchanged
 * - Pesanan (orderStock): unchanged (ini Pesanan Desty, bukan order website)
 * - Tersedia (stok): +quantity = Fisik - Promosi - Pesanan
 */
async function cancelStockReservationAtomically(productId, skuNumber, quantity, source) {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const result = await firestore.runTransaction(async (transaction) => {
        const productRef = firestore.doc(`product/${productId}`);
        const productDoc = await transaction.get(productRef);

        if (!productDoc.exists) {
          throw new Error(`Product ${productId} not found`);
        }

        const prodData = productDoc.data();
        
        const currentOnHandStock = prodData.onHandStock || 0;
        const currentPromotionStock = prodData.promotionStock || 0;
        const currentOrderStock = prodData.orderStock || 0;
        const currentStok = prodData.stok || 0;

        // Fisik: +quantity (barang kembali), Promosi: unchanged, Pesanan: unchanged
        const newOnHandStock = currentOnHandStock + quantity;
        const newOrderStock = currentOrderStock;  // Pesanan Desty tidak berubah
        const newPromotionStock = currentPromotionStock;
        const newStok = Math.max(0, newOnHandStock - newPromotionStock - newOrderStock);

        transaction.update(productRef, {
          onHandStock: newOnHandStock,
          promotionStock: newPromotionStock,
          orderStock: newOrderStock,
          stok: newStok,
          orderCount: FieldValue.increment(-quantity),  // -qty saat order dibatalkan
          updatedAt: Timestamp.now(),
        });

        return {
          productId: productId,
          skuNumber: skuNumber,
          previousOnHandStock: currentOnHandStock,
          newOnHandStock: newOnHandStock,
          previousOrderStock: currentOrderStock,
          newOrderStock: newOrderStock,
          previousStok: currentStok,
          newStok: newStok,
          quantityReturned: quantity,
          source: source,
        };
      });

      console.log(`[STOCK-CANCEL] ${skuNumber}: Fisik ${result.previousOnHandStock}→${result.newOnHandStock} (+${quantity}), Tersedia ${result.previousStok}→${result.newStok}`);
      return result;

    } catch (error) {
      attempt++;
      console.error(`[STOCK-CANCEL] Attempt ${attempt} failed for ${skuNumber}:`, error.message);
      if (attempt >= maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 100 * attempt));
    }
  }
}

// Keep old function name for backward compatibility but with NEW logic
// This will be called from settlement handler
async function deductStockAtomically(productId, skuNumber, quantity, source) {
  // For backward compatibility, we'll call fulfillStockAtomically
  // as this is what was intended for settlement processing
  return fulfillStockAtomically(productId, skuNumber, quantity, source);
}

// Push stock to Desty - sends all stock breakdown fields
// Uses /stock/sync to SET onHandStock (Fisik)
/**
 * stockData: { onHandStock, orderStock, promotionStock }
 * 
 * For website Carramica sales:
 * - We only sync onHandStock (Fisik) to Desty
 * - Pesanan (orderStock) in Desty is for marketplace orders (TikTok, Shopee)
 * - Website sales do not affect Pesanan in Desty
 */
async function pushStockToDesty(skuNumber, stockData, productName) {
  try {
    const warehouseId = DESTY_WAREHOUSE_ID;
    
    // Handle both number and object input
    let onHandStock, orderStock, promotionStock;
    if (typeof stockData === 'object' && stockData !== null) {
      onHandStock = stockData.onHandStock;
      orderStock = stockData.orderStock;
      promotionStock = stockData.promotionStock;
    } else {
      // Backward compatibility - stockData is just the available stock
      onHandStock = stockData;
      orderStock = 0;
      promotionStock = 0;
    }
    
    console.log(`[DESTY] ========== PUSH STOCK TO DESTY ==========`);
    console.log(`[DESTY] SKU: ${skuNumber}`);
    console.log(`[DESTY] Product: ${productName}`);
    console.log(`[DESTY] onHandStock (Fisik): ${onHandStock}`);
    console.log(`[DESTY] orderStock (Pesanan): ${orderStock}`);
    console.log(`[DESTY] promotionStock (Promosi): ${promotionStock}`);
    console.log(`[DESTY] warehouseId: ${warehouseId}`);

    // Validate inputs
    if (!skuNumber || skuNumber.trim() === "") {
      console.error(`[DESTY] ERROR: SKU number is empty or invalid`);
      return false;
    }

    // Get token
    console.log(`[DESTY] Getting access token...`);
    const token = await getDestyAccessToken();
    console.log(`[DESTY] Token obtained: ${token ? token.substring(0, 20) + "..." : "EMPTY"}`);

    // Sync onHandStock (Fisik) using /stock/sync
    const syncPayload = {
      warehouseId: warehouseId,
      stocks: [{
        skuNumber: skuNumber,
        onHandStock: Math.max(0, onHandStock),
        productName: productName || "",
      }],
    };
    
    console.log(`[DESTY] Request payload:`, JSON.stringify(syncPayload, null, 2));
    console.log(`[DESTY] API: POST ${DESTY_API_BASE}/api/inventory/stock/sync`);

    const syncResponse = await axios.post(
      `${DESTY_API_BASE}/api/inventory/stock/sync`,
      syncPayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    console.log(`[DESTY] Response code: ${syncResponse.data.code}`);
    console.log(`[DESTY] Response:`, JSON.stringify(syncResponse.data, null, 2));

    if (syncResponse.data.code === "0") {
      console.log(`✓ Stock synced to Desty: ${skuNumber} = ${onHandStock}`);
      console.log(`[DESTY] ===========================================`);
      
      // Log the result
      try {
        await firestore.collection("desty_stock_push_logs").add({
          skuNumber,
          onHandStock,
          orderStock,
          promotionStock,
          productName,
          warehouseId,
          status: "success",
          response: syncResponse.data,
          timestamp: Timestamp.now(),
        });
      } catch (logError) {
        console.error("Error logging:", logError.message);
      }
      return true;
    } else {
      console.error(`✗ Stock sync failed: ${syncResponse.data.msg}`);
      console.error(`[DESTY] Full response:`, JSON.stringify(syncResponse.data));
      console.log(`[DESTY] ===========================================`);
      try {
        await firestore.collection("desty_stock_push_logs").add({
          skuNumber,
          onHandStock,
          productName,
          warehouseId,
          status: "failed",
          error: syncResponse.data.msg,
          response: syncResponse.data,
          timestamp: Timestamp.now(),
        });
      } catch (logError) {}
      return false;
    }
  } catch (error) {
    console.error(`[DESTY] ERROR:`, error.message);
    console.error(`[DESTY] Stack:`, error.stack);
    console.log(`[DESTY] ===========================================`);
    try {
      await firestore.collection("desty_stock_push_logs").add({
        skuNumber,
        productName,
        status: "error",
        error: error.message,
        stack: error.stack,
        timestamp: Timestamp.now(),
      });
    } catch (logError) {}
    return false;
  }
}

// Sync stock from Desty order items
async function syncStockFromDestyOrder(itemList) {
  for (const item of itemList) {
    const { itemCode, skuNumber, quantity, itemName, itemId } = item;

    // Find product in Carramica by skuNumber (destySkuNumber)
    const skuToMatch = skuNumber || itemCode;

    if (!skuToMatch) {
      console.log(`Skipping item ${itemId} - no SKU code found`);
      continue;
    }

    try {
      // Find product by destySkuNumber
      const productSnapshot = await firestore
        .collection("product")
        .where("destySkuNumber", "==", skuToMatch)
        .limit(1)
        .get();

      // If not found by destySkuNumber, try by sku or sku_rapin
      let productDoc = null;
      if (productSnapshot.empty) {
        const altSnapshot = await firestore
          .collection("product")
          .where("sku", "==", skuToMatch)
          .limit(1)
          .get();

        if (!altSnapshot.empty) {
          productDoc = altSnapshot.docs[0];
        } else {
          const rapinSnapshot = await firestore
            .collection("product")
            .where("sku_rapin", "==", skuToMatch)
            .limit(1)
            .get();

          if (!rapinSnapshot.empty) {
            productDoc = rapinSnapshot.docs[0];
          }
        }
      } else {
        productDoc = productSnapshot.docs[0];
      }

      if (!productDoc) {
        console.log(`Product with SKU ${skuToMatch} not found in Carramica`);
        continue;
      }

      console.log(`Updating stock for product ${productDoc.id} (${skuToMatch})`);

      // Fetch current stock from Desty
      const destyStock = await getDestyStock(skuToMatch);

      if (destyStock !== null) {
        const previousStock = productDoc.data().stok;

        // Update stock in Carramica to match Desty
        await productDoc.ref.update({
          stok: destyStock,
          destyLastSync: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });

        console.log(`Stock updated: ${skuToMatch} from ${previousStock} to ${destyStock}`);

        // Log the update
        await firestore.collection("desty_stock_sync_logs").add({
          skuNumber: skuToMatch,
          productId: productDoc.id,
          productName: itemName,
          previousStock,
          newStock: destyStock,
          syncType: "settlement_order",
          syncedAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error(`Error syncing stock for SKU ${skuToMatch}:`, error);
    }
  }
}

// Get stock from Desty for a specific SKU
async function getDestyStock(skuNumber) {
  try {
    const accessToken = await getDestyAccessToken();
    console.log("Getting stock for SKU:", skuNumber);
    console.log("Token prefix check:", accessToken.substring(0, 10));
    const detailResponse = await axios.get(`${DESTY_API_BASE}/api/product/sku/detail`, {
      params: { skuNumber },
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (detailResponse.data.code === "0" && detailResponse.data.data) {
      const skuData = detailResponse.data.data;
      const masterInventory = skuData.masterInventoryList;

      if (masterInventory && masterInventory.length > 0) {
        // Get the first warehouse's stock (or sum all if multiple)
        const totalStock = masterInventory.reduce((sum, inv) => {
          return sum + (inv.onHandStock || 0);
        }, 0);
        return totalStock;
      }
    }

    return null;
  } catch (error) {
    console.error(`Error getting Desty stock for ${skuNumber}:`, error.message);
    return null;
  }
}

// Get SKU detail from Desty including weight (per Desty API: GET /api/product/sku/detail)
// Calculates "Stok Tersedia" = onHandStock - promotionStock - orderStock
async function getDestySkuDetail(skuNumber) {
  try {
    const accessToken = await getDestyAccessToken();
    console.log("Getting SKU detail for:", skuNumber);

    const detailResponse = await axios.get(`${DESTY_API_BASE}/api/product/sku/detail`, {
      params: { skuNumber },
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (detailResponse.data.code === "0" && detailResponse.data.data) {
      const skuData = detailResponse.data.data;

      // Extract stock - ONLY from Gudang Online warehouse
      const masterInventory = skuData.masterInventoryList || [];
      const gudangOnlineStock = masterInventory.find(inv => inv.externalWarehouseId === DESTY_WAREHOUSE_ID);

      // Calculate "Stok Tersedia" = onHandStock - promotionStock - orderStock
      // onHandStock: stok fisik
      // promotionStock: stok yang dikunci untuk promosi
      // orderStock: stok yang dikunci untuk pesanan belum dikirim
      let stock = 0;
      let onHandStock = 0;
      let promotionStock = 0;
      let orderStock = 0;

      if (gudangOnlineStock) {
        onHandStock = gudangOnlineStock.onHandStock || 0;
        promotionStock = gudangOnlineStock.promotionStock || 0;
        orderStock = gudangOnlineStock.orderStock || 0;
        const reservedStock = promotionStock + orderStock;
        stock = Math.max(0, onHandStock - reservedStock);

        console.log(`[DESTY] Gudang Online stock breakdown for ${skuNumber}:`);
        console.log(`  onHandStock: ${onHandStock}`);
        console.log(`  promotionStock: ${promotionStock}`);
        console.log(`  orderStock: ${orderStock}`);
        console.log(`  ReservedStock: ${reservedStock}`);
        console.log(`  Stok Tersedia: ${stock}`);
      } else {
        console.log(`[WARN] Gudang Online warehouse not found for ${skuNumber}`);
        // If Gudang Online not found, log all warehouses for debugging
        if (masterInventory.length > 0) {
          console.log(`[DESTY] Available warehouses:`);
          masterInventory.forEach(inv => {
            console.log(`  - ${inv.warehouseName}: externalId: ${inv.externalWarehouseId}, onHandStock: ${inv.onHandStock}`);
          });
        }
      }

      // Extract weight
      const weight = skuData.weight || null;

      return {
        stock: stock,
        onHandStock: onHandStock,
        promotionStock: promotionStock,
        orderStock: orderStock,
        weight: weight,
        warehouseStock: {
          warehouseId: gudangOnlineStock?.warehouseId || null,
          warehouseName: gudangOnlineStock?.warehouseName || null,
          stock: stock,
        },
        // Dimensions not available from Desty API
        length: null,
        width: null,
        height: null,
      };
    }

    console.log(`SKU ${skuNumber} not found in Desty response`);
    return null;
  } catch (error) {
    console.error(`Error getting Desty SKU detail for ${skuNumber}:`, error.message);
    return null;
  }
}

// Test function - just try to fetch products
exports.testDestyProducts = jakartaFn.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  try {
    console.log("=== TEST: Getting token ===");
    const tokenResponse = await axios.post(`${DESTY_API_BASE}/api/auth/token`, {
      applyId: DESTY_APPLY_ID,
      username: DESTY_USERNAME,
      mobile: DESTY_MOBILE,
    });
    console.log("Token response:", JSON.stringify(tokenResponse.data));

    if (tokenResponse.data.code !== "0") {
      return res.status(500).json({ error: "Failed to get token", data: tokenResponse.data });
    }

    const token = tokenResponse.data.data.accessToken;
    console.log("Got token:", token.substring(0, 50) + "...");

    console.log("=== TEST: Fetching products ===");
    const productsResponse = await axios.post(
      `${DESTY_API_BASE}/api/product/page`,
      { pageNumber: 1, pageSize: 5 },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log("Products response:", JSON.stringify(productsResponse.data).substring(0, 500));

    return res.status(200).json({
      success: productsResponse.data.code === "0",
      tokenGot: true,
      productsResponse: productsResponse.data
    });
  } catch (error) {
    console.error("Error:", error.message);
    console.error("Error response:", error.response?.data);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Test function for SKU Detail endpoint (separate from product/page)
exports.testDestySkuDetail = jakartaFn.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  try {
    const skuNumber = req.body?.skuNumber || 'CRM-DS-DHY';

    console.log("=== TEST: Getting token ===");
    const tokenResponse = await axios.post(`${DESTY_API_BASE}/api/auth/token`, {
      applyId: DESTY_APPLY_ID,
      username: DESTY_USERNAME,
      mobile: DESTY_MOBILE,
    });

    if (tokenResponse.data.code !== "0") {
      return res.status(500).json({
        success: false,
        error: "Failed to get token",
        data: tokenResponse.data
      });
    }

    const token = tokenResponse.data.data.accessToken;
    console.log("Got token, fetching SKU detail for:", skuNumber);

    // Test SKU Detail endpoint (GET)
    const skuDetailResponse = await axios.get(
      `${DESTY_API_BASE}/api/product/sku/detail`,
      {
        params: { skuNumber },
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("SKU Detail response code:", skuDetailResponse.data.code);

    if (skuDetailResponse.data.code !== "0") {
      return res.status(500).json({
        success: false,
        error: "Failed to get SKU detail",
        data: skuDetailResponse.data
      });
    }

    const skuData = skuDetailResponse.data.data;
    const weight = skuData?.weight || null;

    return res.status(200).json({
      success: true,
      skuNumber: skuData?.skuNumber,
      weight: weight,
      fullData: skuData
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Sync all product weights and stock from Desty (using existing products in Firestore)
exports.syncDestyWeightAll = jakartaFn.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  try {
    const syncStock = req.body?.syncStock !== false; // Default true
    console.log(`Starting Desty sync (weight & stock: ${syncStock})...`);

    // Step 1: Get token
    const tokenResponse = await axios.post(`${DESTY_API_BASE}/api/auth/token`, {
      applyId: DESTY_APPLY_ID,
      username: DESTY_USERNAME,
      mobile: DESTY_MOBILE,
    });

    if (tokenResponse.data.code !== "0") {
      throw new Error("Failed to get token: " + JSON.stringify(tokenResponse.data));
    }

    const token = tokenResponse.data.data.accessToken;
    console.log("Got token, fetching products from Firestore...");

    // Step 2: Get all products from Firestore that have Desty SKU
    const productsSnapshot = await firestore
      .collection("product")
      .get();

    // Filter products that have Desty connection (destySkuNumber, sku, or sku_rapin)
    const destyProducts = productsSnapshot.docs.filter(doc => {
      const data = doc.data();
      return data.destyConnected || data.isDestyProduct || data.destySkuNumber || data.sku || data.sku_rapin;
    });

    const results = {
      total: destyProducts.length,
      synced: 0,
      skipped: 0,
      errors: [],
    };

    console.log(`Found ${results.total} products with potential Desty connection`);

    // Step 3: Sync for each product
    for (const productDoc of destyProducts) {
      const product = productDoc.data();
      const skuNumber = product.destySkuNumber || product.sku_rapin || product.sku;

      if (!skuNumber) {
        results.skipped++;
        continue;
      }

      try {
        // Get SKU detail from Desty (GET /api/product/sku/detail)
        const skuDetailResponse = await axios.get(
          `${DESTY_API_BASE}/api/product/sku/detail`,
          {
            params: { skuNumber },
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (skuDetailResponse.data.code === "0" && skuDetailResponse.data.data) {
          const skuData = skuDetailResponse.data.data;
          const weight = skuData?.weight || null;

          // Get stock from Gudang Online warehouse ONLY (not sum of all warehouses)
          const masterInventory = skuData.masterInventoryList || [];
          const gudangOnlineStock = masterInventory.find(inv => inv.externalWarehouseId === DESTY_WAREHOUSE_ID);
          const stock = gudangOnlineStock ? (gudangOnlineStock.onHandStock || 0) : 0;

          if (!gudangOnlineStock && masterInventory.length > 0) {
            console.log(`[WARN] Gudang Online warehouse not found for ${skuNumber}. Available:`);
            masterInventory.forEach(inv => {
              console.log(`  - ${inv.warehouseName}: ${inv.warehouseId}, externalId: ${inv.externalWarehouseId}`);
            });
          }

          // Build update data
          const updateData = {
            destyLastSync: Timestamp.now(),
            updatedAt: Timestamp.now(),
          };

          // Update weight if provided
          if (weight && weight > 0) {
            updateData.weight = weight;
          }

          // Update stock from Gudang Online ONLY if syncStock is true
          if (syncStock && stock >= 0) {
            updateData.stok = stock;
            console.log(`[DESTY] Updating stock for ${skuNumber}: ${stock} (from Gudang Online only)`);
          }

          await productDoc.ref.update(updateData);
          results.synced++;
          console.log(`Synced ${skuNumber}: stock=${stock}, weight=${weight}g`);
        } else {
          results.skipped++;
          console.log(`SKU not found in Desty: ${skuNumber}`);
        }
      } catch (err) {
        results.errors.push({ skuNumber, error: err.message });
        console.error(`Error syncing ${skuNumber}:`, err.message);
      }
    }

    console.log("Sync completed:", results);

    // Log the sync
    await firestore.collection("desty_sync_logs").add({
      syncType: syncStock ? "weight_stock_all" : "weight_all",
      results,
      completedAt: Timestamp.now(),
      triggeredBy: "http-api",
    });

    return res.status(200).json({ success: true, results });
  } catch (error) {
    console.error("Sync error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Simple test function to verify Desty credentials
exports.testDestyCredentials = jakartaFn.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  try {
    console.log("Testing Desty credentials...");
    console.log("DESTY_API_BASE:", DESTY_API_BASE);
    console.log("DESTY_APPLY_ID:", DESTY_APPLY_ID);
    console.log("DESTY_USERNAME:", DESTY_USERNAME);
    console.log("DESTY_MOBILE:", DESTY_MOBILE);

    const response = await axios.post(`${DESTY_API_BASE}/api/auth/token`, {
      applyId: DESTY_APPLY_ID,
      username: DESTY_USERNAME,
      mobile: DESTY_MOBILE,
    });

    console.log("Response:", JSON.stringify(response.data));

    return res.status(200).json({
      success: response.data.code === "0",
      data: response.data,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Helper function to get Desty token
async function getDestyToken() {
  const tokenResponse = await axios.post(`${DESTY_API_BASE}/api/auth/token`, {
    applyId: DESTY_APPLY_ID,
    username: DESTY_USERNAME,
    mobile: DESTY_MOBILE,
  });

  if (tokenResponse.data.code !== "0") {
    throw new Error("Failed to get token: " + JSON.stringify(tokenResponse.data));
  }

  return tokenResponse.data.data.accessToken;
}

// Sync all products from Desty - HTTP Function (working version)
exports.syncDestyProductsHttp = jakartaFn.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  try {
    console.log("Starting Desty products sync...");

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      totalFetched: 0,
      syncedSkus: [] // Track synced SKU numbers for comparison
    };

    // Step 1: Get token
    let token = await getDestyToken();
    console.log("Got token, fetching products...");

    // Step 2: Fetch products page by page
    let pageNumber = 1;
    const pageSize = 50;
    let totalPages = 1;
    const MAX_RETRIES = 2;

    while (pageNumber <= totalPages) {
      console.log(`Fetching page ${pageNumber}/${totalPages}...`);

      let productsResponse;
      let retryCount = 0;
      let success = false;

      // Retry logic for token expiration
      while (!success && retryCount <= MAX_RETRIES) {
        try {
          productsResponse = await axios.post(
            `${DESTY_API_BASE}/api/product/page`,
            { pageNumber, pageSize },
            {
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              timeout: 30000 // 30 second timeout
            }
          );

          console.log(`Page ${pageNumber} response code: ${productsResponse.data.code}`);

          // Check if we got INVALID_TOKEN and need to refresh
          if (productsResponse.data.code === "INVALID_TOKEN" && retryCount < MAX_RETRIES) {
            console.log("Token invalid, refreshing...");
            token = await getDestyToken();
            retryCount++;
            continue;
          }

          if (productsResponse.data.code !== "0") {
            throw new Error("Failed to fetch products: " + JSON.stringify(productsResponse.data));
          }

          success = true;
        } catch (apiError) {
          if (apiError.response?.data?.code === "INVALID_TOKEN" && retryCount < MAX_RETRIES) {
            console.log("Token invalid (caught), refreshing...");
            token = await getDestyToken();
            retryCount++;
            continue;
          }
          throw apiError;
        }
      }

      const products = productsResponse.data.data.results || [];
      totalPages = productsResponse.data.data.totalPages || 1;
      const totalCount = productsResponse.data.data.totalCount || 0;
      results.totalFetched += products.length;
      console.log(`[INFO] Page ${pageNumber}/${totalPages}: ${products.length} products (total in Desty: ${totalCount})`);

      // Log sample of first product for debugging
      if (pageNumber === 1 && products.length > 0) {
        console.log(`[DEBUG] Sample first product from Desty:`);
        console.log(JSON.stringify(products[0], null, 2));
      }

      // Step 3: Process each product
      for (const destyProduct of products) {
        try {
          // Collect SKU numbers from skuInfoList
          if (destyProduct.skuInfoList && destyProduct.skuInfoList.length > 0) {
            destyProduct.skuInfoList.forEach(skuInfo => {
              if (skuInfo.skuNumber) {
                results.syncedSkus.push(skuInfo.skuNumber);
              }
            });
          }

          const result = await syncSingleDestyProduct(destyProduct, req.body || {});
          if (result === "created") results.created++;
          else if (result === "updated") results.updated++;
          else results.skipped++;
        } catch (err) {
          console.error(`[ERROR] Failed to sync product ${destyProduct.productName}:`, err.message);
          results.errors.push({ product: destyProduct.productName, error: err.message, stack: err.stack });
        }
      }

      pageNumber++;
    }

    console.log("Sync completed:", results);
    console.log(`[SUMMARY] Total fetched: ${results.totalFetched}, Created: ${results.created}, Updated: ${results.updated}, Skipped: ${results.skipped}, Errors: ${results.errors.length}`);
    if (results.errors.length > 0) {
      console.log("[ERRORS]", JSON.stringify(results.errors, null, 2));
    }

    // Log to Firestore
    await firestore.collection("desty_sync_logs").add({
      syncType: "products",
      results,
      completedAt: Timestamp.now(),
      triggeredBy: "http-api",
    });

    return res.status(200).json({ success: true, results });
  } catch (error) {
    console.error("Sync error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Sync all products from Desty - HTTP Callable Function (requires auth)
exports.syncDestyProducts = jakartaFn.https.onCall(async (data, context) => {
  try {
    console.log("Starting Desty products sync...");

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
    };

    // Get all products from Desty (paginated)
    let pageNumber = 1;
    const pageSize = 50;
    let hasMorePages = true;

    while (hasMorePages) {
      console.log(`Fetching Desty products page ${pageNumber}...`);

      const response = await destyApiRequest("/api/product/page", "POST", {
        pageNumber,
        pageSize,
      });

      if (response.code !== "0") {
        throw new Error(`Desty API error: ${JSON.stringify(response)}`);
      }

      const { results: products, totalPages, totalCount } = response.data;
      console.log(`Page ${pageNumber}: Found ${products?.length || 0} products (total: ${totalCount})`);

      if (!products || products.length === 0) {
        hasMorePages = false;
        break;
      }

      // Process each product from Desty
      for (const destyProduct of products) {
        try {
          const syncResult = await syncSingleDestyProduct(destyProduct, data);

          if (syncResult === "created") {
            results.created++;
          } else if (syncResult === "updated") {
            results.updated++;
          } else {
            results.skipped++;
          }
        } catch (error) {
          results.errors.push({
            product: destyProduct.productName,
            error: error.message,
          });
          console.error(`Error syncing product ${destyProduct.productName}:`, error);
        }
      }

      hasMorePages = pageNumber < totalPages;
      pageNumber++;
    }

    console.log("Desty products sync completed:", results);

    // Log the sync
    await firestore.collection("desty_sync_logs").add({
      syncType: "products",
      results,
      completedAt: Timestamp.now(),
      triggeredBy: context?.auth?.uid || "manual",
    });

    return {
      success: true,
      results,
    };
  } catch (error) {
    console.error("Error in syncDestyProducts:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Global counter for debug logging (to avoid log spam)
let debugProductCount = 0;
const DEBUG_PRODUCTS_LIMIT = 3;

// Sync a single product from Desty to Carramica
// OPTIMIZED: No longer calls getDestySkuDetail() for each product to avoid N+1 API problem
async function syncSingleDestyProduct(destyProduct, syncOptions = {}) {
  const { productName, spuId, skuInfoList } = destyProduct;

  if (!skuInfoList || skuInfoList.length === 0) {
    console.log(`[WARN] Product ${productName} has no SKU info, skipping`);
    return "skipped";
  }

  console.log(`[INFO] Processing product ${productName} with ${skuInfoList.length} SKU variant(s)`);

  // Track results
  let created = 0;
  let updated = 0;
  let skipped = 0;

  // Process each SKU variant
  for (const skuInfo of skuInfoList) {
    const {
      skuId,
      skuNumber,
      salesPrice,
      image,
      variantNameOptionList,
      masterInventoryList,
      weight: destyWeight,
    } = skuInfo;

    console.log(`[INFO] Checking SKU: ${skuNumber}`);

    if (!skuNumber) {
      console.log(`[WARN] SKU ${skuId} has no skuNumber, skipping`);
      skipped++;
      continue;
    }

    // Extract stock from Gudang Online warehouse and calculate "Stok Tersedia"
    // Rumus: Stok Tersedia = onHandStock - promotionStock - orderStock
    // onHandStock: stok fisik di gudang
    // promotionStock: stok yang dikunci untuk promosi
    // orderStock: stok yang dikunci untuk pesanan belum dikirim
    let stock = 0;
    let stockDetails = { onHandStock: 0, promotionStock: 0, orderStock: 0 };

    // Find Gudang Online warehouse by externalWarehouseId = DESTY_WAREHOUSE_ID
    const gudangOnlineStock = masterInventoryList?.find(
      (inv) => inv.externalWarehouseId === DESTY_WAREHOUSE_ID
    );

    if (gudangOnlineStock) {
      const onHandStock = gudangOnlineStock.onHandStock || 0;
      const promotionStock = gudangOnlineStock.promotionStock || 0;
      const orderStock = gudangOnlineStock.orderStock || 0;
      const reservedStock = promotionStock + orderStock;

      // Calculate "Stok Tersedia" (available stock)
      stock = Math.max(0, onHandStock - reservedStock);

      stockDetails = { onHandStock, promotionStock, orderStock };
      console.log(`[DESTY] Stock calculation for ${skuNumber}:`);
      console.log(`  Gudang Online - onHandStock: ${onHandStock}, promotionStock: ${promotionStock}, orderStock: ${orderStock}`);
      console.log(`  ReservedStock: ${reservedStock}, Stok Tersedia: ${stock}`);

      // Log marketplace stocks for reference
      if (skuInfo.bindingMarketplaceSkuList && skuInfo.bindingMarketplaceSkuList.length > 0) {
        skuInfo.bindingMarketplaceSkuList.forEach(mp => {
          const mpStock = mp.inventoryInfo?.[0]?.stock;
          console.log(`  Marketplace ${mp.platformName}: stock = ${mpStock}`);
        });
      }
    } else if (masterInventoryList && masterInventoryList.length > 0) {
      // Fallback: sum all warehouses with Stok Tersedia formula
      console.log(`[WARN] Gudang Online not found for ${skuNumber}, using all warehouses`);
      stock = masterInventoryList.reduce((sum, inv) => {
        const onHand = inv.onHandStock || 0;
        const promo = inv.promotionStock || 0;
        const order = inv.orderStock || 0;
        return sum + Math.max(0, onHand - promo - order);
      }, 0);
    }

    const productWeight = destyWeight || 0;
    const variantName = variantNameOptionList?.map(v => `${v.name}: ${v.option}`).join(", ") || "";

    // Check if product exists in Carramica
    let productSnapshot = await firestore
      .collection("product")
      .where("destySkuNumber", "==", skuNumber)
      .limit(1)
      .get();

    if (productSnapshot.empty) {
      productSnapshot = await firestore
        .collection("product")
        .where("sku", "==", skuNumber)
        .limit(1)
        .get();
    }

    if (productSnapshot.empty) {
      productSnapshot = await firestore
        .collection("product")
        .where("sku_rapin", "==", skuNumber)
        .limit(1)
        .get();
    }

    if (!productSnapshot.empty) {
      // Update existing product
      const productDoc = productSnapshot.docs[0];
      const existingProduct = productDoc.data();

      const updateData = {
        destyConnected: true,
        destySkuNumber: skuNumber,
        destySpuId: spuId,
        destyLastSync: Timestamp.now(),
        updatedAt: Timestamp.now(),
        nama: variantName ? `${productName} - ${variantName}` : productName,
        harga: salesPrice || existingProduct.harga || 0,
        thumbnail: [image || existingProduct.thumbnail?.[0] || ""],
        description: existingProduct.description || "",
        stok: stock,
        weight: productWeight || existingProduct.weight || 0,
        status: existingProduct.status || "Live",
        // Stock breakdown fields for table columns (Fisik, Promosi, Pesanan, Tersedia)
        onHandStock: stockDetails.onHandStock,
        promotionStock: stockDetails.promotionStock,
        orderStock: stockDetails.orderStock,
      };

      await productDoc.ref.set(updateData, { merge: true });
      console.log(`[SUCCESS] Updated product: ${skuNumber}`);
      updated++;
    } else {
      // Create new product
      const newProductId = firestore.collection("product").doc().id;

      await firestore.doc(`product/${newProductId}`).set({
        sku: skuNumber,
        sku_rapin: skuNumber,
        nama: variantName ? `${productName} - ${variantName}` : productName,
        harga: salesPrice || 0,
        stok: stock,
        thumbnail: image ? [image] : [],
        description: "",
        cogs: 0,
        weight: productWeight,
        warning_stock: 0,
        status: "Live",
        category: {},
        destyConnected: true,
        destySkuNumber: skuNumber,
        destySpuId: spuId,
        isDestyProduct: true,
        destyLastSync: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        qty_sold: 0,
        orderCount: 0,
        // Stock breakdown fields for table columns (Fisik, Promosi, Pesanan, Tersedia)
        onHandStock: stockDetails.onHandStock,
        promotionStock: stockDetails.promotionStock,
        orderStock: stockDetails.orderStock,
      });

      console.log(`[SUCCESS] Created product: ${skuNumber}`);
      created++;
    }
  }

  // Return the result of processing all variants
  if (created > 0) {
    return "created";
  } else if (updated > 0) {
    return "updated";
  } else {
    return "skipped";
  }
}

// Manual stock sync for a specific SKU (also syncs weight from Desty SKU Detail API)
exports.syncDestyStock = jakartaFn.https.onCall(async (data, context) => {
  try {
    const { skuNumber } = data;

    if (!skuNumber) {
      throw new functions.https.HttpsError("invalid-argument", "skuNumber is required");
    }

    console.log(`Syncing stock for SKU: ${skuNumber}`);

    // Get SKU detail from Desty (includes stock and weight)
    const skuDetail = await getDestySkuDetail(skuNumber);

    if (!skuDetail) {
      throw new Error(`Failed to get SKU detail from Desty for ${skuNumber}`);
    }

    const { stock: totalStock, weight: productWeight } = skuDetail;

    // Find and update product in Carramica
    let productSnapshot = await firestore
      .collection("product")
      .where("destySkuNumber", "==", skuNumber)
      .limit(1)
      .get();

    if (productSnapshot.empty) {
      productSnapshot = await firestore
        .collection("product")
        .where("sku", "==", skuNumber)
        .limit(1)
        .get();
    }

    if (productSnapshot.empty) {
      productSnapshot = await firestore
        .collection("product")
        .where("sku_rapin", "==", skuNumber)
        .limit(1)
        .get();
    }

    if (productSnapshot.empty) {
      throw new Error(`Product with SKU ${skuNumber} not found in Carramica`);
    }

    const productDoc = productSnapshot.docs[0];
    const previousStock = productDoc.data().stok;
    const previousWeight = productDoc.data().weight;

    // Build update data with stock and weight from Desty
    const updateData = {
      stok: totalStock,
      destyLastSync: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Update weight if provided by Desty
    if (productWeight && productWeight > 0) {
      updateData.weight = productWeight;
    }

    await productDoc.ref.update(updateData);

    // Log the sync (including weight if updated)
    await firestore.collection("desty_stock_sync_logs").add({
      skuNumber,
      productId: productDoc.id,
      previousStock,
      newStock: totalStock,
      previousWeight,
      newWeight: productWeight || previousWeight,
      syncType: "manual",
      syncedAt: Timestamp.now(),
      triggeredBy: context?.auth?.uid || "manual",
    });

    console.log(`Stock synced: ${skuNumber} | Previous: ${previousStock} -> New: ${totalStock} | Weight: ${productWeight} gram`);

    return {
      success: true,
      skuNumber,
      previousStock,
      newStock: totalStock,
      previousWeight,
      newWeight: productWeight || null,
    };
  } catch (error) {
    console.error("Error in syncDestyStock:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// HTTP version of syncDestyStock (no auth required)
exports.syncDestyStockHttp = jakartaFn.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  try {
    const { skuNumber, productId } = req.body || {};

    if (!skuNumber) {
      return res.status(400).json({ success: false, error: "skuNumber is required" });
    }

    console.log(`HTTP: Syncing stock for SKU: ${skuNumber}`);

    // Get SKU detail from Desty
    const skuDetail = await getDestySkuDetail(skuNumber);

    if (!skuDetail) {
      return res.status(500).json({ success: false, error: `Failed to get SKU detail from Desty for ${skuNumber}` });
    }

    const { stock: totalStock, weight: productWeight } = skuDetail;

    // Find and update product in Carramica
    let productDoc;
    let productSnapshot = await firestore
      .collection("product")
      .where("destySkuNumber", "==", skuNumber)
      .limit(1)
      .get();

    if (productSnapshot.empty && productId) {
      productDoc = await firestore.doc(`product/${productId}`).get();
    } else if (productSnapshot.empty) {
      productSnapshot = await firestore
        .collection("product")
        .where("sku", "==", skuNumber)
        .limit(1)
        .get();
    }

    if (productSnapshot.empty) {
      productSnapshot = await firestore
        .collection("product")
        .where("sku_rapin", "==", skuNumber)
        .limit(1)
        .get();
    }

    if (productSnapshot.empty && !productDoc?.exists) {
      return res.status(404).json({ success: false, error: `Product with SKU ${skuNumber} not found in Carramica` });
    }

    if (!productDoc) {
      productDoc = productSnapshot.docs[0];
    }

    const previousStock = productDoc.data().stok;
    const previousWeight = productDoc.data().weight;

    // Build update data
    const updateData = {
      stok: totalStock,
      destyLastSync: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Update weight if provided by Desty
    if (productWeight && productWeight > 0) {
      updateData.weight = productWeight;
    }

    await productDoc.ref.update(updateData);

    // Log the sync
    await firestore.collection("desty_stock_sync_logs").add({
      skuNumber,
      productId: productDoc.id,
      previousStock,
      newStock: totalStock,
      previousWeight,
      newWeight: productWeight || previousWeight,
      syncType: "manual_http",
      syncedAt: Timestamp.now(),
      triggeredBy: "http-api",
    });

    console.log(`HTTP: Stock synced: ${skuNumber} | Previous: ${previousStock} -> New: ${totalStock}`);

    return res.status(200).json({
      success: true,
      skuNumber,
      previousStock,
      newStock: totalStock,
      previousWeight,
      newWeight: productWeight || null,
    });
  } catch (error) {
    console.error("Error in syncDestyStockHttp:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Scheduled function to refresh Desty token (runs daily)
exports.refreshDestyToken = jakartaFn.pubsub
  .schedule("0 0 * * *")  // Run at midnight every day
  .timeZone("Asia/Jakarta")
  .onRun(async () => {
    try {
      console.log("Running scheduled Desty token refresh...");

      const response = await axios.post(`${DESTY_API_BASE}/api/auth/token`, {
        applyId: DESTY_APPLY_ID,
        username: DESTY_USERNAME,
        mobile: DESTY_MOBILE,
      });

      if (response.data.code === "0" && response.data.data) {
        const { accessToken, tokenType, expireTime } = response.data.data;

        await firestore.doc("desty_settings/token").set({
          accessToken,
          tokenType,
          expireTime,
          updatedAt: Timestamp.now(),
          lastScheduledRefresh: Timestamp.now(),
        });

        console.log("Desty token refreshed successfully via scheduled job");
      }

      return null;
    } catch (error) {
      console.error("Error in scheduled token refresh:", error);
      return null;
    }
  });

// Get Desty Products (for frontend integration)
exports.getDestyProducts = jakartaFn.https.onCall(async (data, context) => {
  try {
    const { pageNumber = 1, pageSize = 50 } = data || {};

    const response = await destyApiRequest("/api/product/page", "POST", {
      pageNumber,
      pageSize,
    });

    if (response.code !== "0") {
      throw new Error(`Desty API error: ${JSON.stringify(response)}`);
    }

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error in getDestyProducts:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Get connection status for products (for frontend display)
exports.getDestyConnectionStatus = jakartaFn.https.onCall(async (data, context) => {
  try {
    // Count products by desty connection status
    const allSnapshot = await firestore.collection("product").get();
    const connectedSnapshot = await firestore
      .collection("product")
      .where("destyConnected", "==", true)
      .get();
    const destyProductSnapshot = await firestore
      .collection("product")
      .where("isDestyProduct", "==", true)
      .get();

    // Products that are Desty connected or are Desty products
    const destyProductIds = new Set([
      ...connectedSnapshot.docs.map(d => d.id),
      ...destyProductSnapshot.docs.map(d => d.id),
    ]);

    return {
      success: true,
      stats: {
        totalProducts: allSnapshot.size,
        destyConnected: connectedSnapshot.size,
        isDestyProduct: destyProductSnapshot.size,
        ermOnly: allSnapshot.size - destyProductIds.size,
      },
    };
  } catch (error) {
    console.error("Error in getDestyConnectionStatus:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// ==========================================
// PAYMENT NOTIFICATION FUNCTIONS
// ==========================================

// Helper function to create payment notification
async function createPaymentNotification(paymentData) {
  try {
    const {
      invoiceId,
      orderId,
      amount,
      customerName,
      customerPhone,
      items,
      paymentMethod,
      source,
    } = paymentData;

    const notificationRef = firestore.collection("payment_notifications").doc();

    const notification = {
      id: notificationRef.id,
      invoiceId: invoiceId || orderId,
      orderId: orderId || invoiceId,
      amount: amount || 0,
      customerName: customerName || "Pelanggan",
      customerPhone: customerPhone || "",
      itemsCount: items || 0,
      paymentMethod: paymentMethod || "unknown",
      source: source || "system",
      type: "settlement",
      status: "new",
      createdAt: Timestamp.now(),
      readAt: null,
      readBy: null,
    };

    await notificationRef.set(notification);

    console.log(`Payment notification created: ${invoiceId} - Rp ${amount}`);

    // If FCM is configured, send push notification
    try {
      await sendPushNotificationToAdmins(notification);
    } catch (pushError) {
      console.log("Push notification skipped (FCM not configured):", pushError.message);
    }

    return notification;
  } catch (error) {
    console.error("Error creating payment notification:", error);
    throw error;
  }
}

// Send push notification to admin users (placeholder - requires FCM setup)
async function sendPushNotificationToAdmins(notification) {
  // This requires Firebase Cloud Messaging (FCM) setup
  // For now, we'll just log and the frontend will poll for new notifications
  console.log("Would send push notification:", notification.invoiceId);
}

// Callable function to get recent payment notifications
exports.getPaymentNotifications = jakartaFn.https.onCall(async (data, context) => {
  try {
    const { limit = 20, unreadOnly = false } = data || {};

    let query = firestore
      .collection("payment_notifications")
      .orderBy("createdAt", "desc")
      .limit(limit);

    if (unreadOnly) {
      query = query.where("status", "==", "new");
    }

    const snapshot = await query.get();

    const notifications = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      };
    });

    // Get unread count
    const unreadSnapshot = await firestore
      .collection("payment_notifications")
      .where("status", "==", "new")
      .count()
      .get();

    return {
      success: true,
      notifications,
      unreadCount: unreadSnapshot.data().count || 0,
    };
  } catch (error) {
    console.error("Error getting payment notifications:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Callable function to mark notification as read
exports.markNotificationRead = jakartaFn.https.onCall(async (data, context) => {
  try {
    const { notificationId } = data;

    if (!notificationId) {
      throw new functions.https.HttpsError("invalid-argument", "notificationId is required");
    }

    await firestore.doc(`payment_notifications/${notificationId}`).update({
      status: "read",
      readAt: Timestamp.now(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Callable function to mark all notifications as read
exports.markAllNotificationsRead = jakartaFn.https.onCall(async (data, context) => {
  try {
    const now = Timestamp.now();

    // Get all unread notifications
    const snapshot = await firestore
      .collection("payment_notifications")
      .where("status", "==", "new")
      .get();

    // Batch update all to read
    const batch = firestore.batch();
    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        status: "read",
        readAt: now,
      });
    });

    await batch.commit();

    return {
      success: true,
      markedCount: snapshot.size,
    };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// HTTP endpoint for Paper.id payment notifications (similar to Midtrans)
exports.paperPaymentWebhook = jakartaFn.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  try {
    const payload = req.body;
    console.log("Paper Payment Webhook received:", JSON.stringify(payload, null, 2));

    // Check if payment is settled/paid
    if (payload.status === "paid" || payload.status === "settlement") {
      const invoiceId = payload.invoice_id || payload.order_id;

      // Create payment notification
      await createPaymentNotification({
        invoiceId: invoiceId,
        orderId: invoiceId,
        amount: payload.amount || payload.total || payload.gross_amount || 0,
        customerName: payload.customer_name || payload.name || "Pelanggan",
        customerPhone: payload.customer_phone || payload.phone || "",
        items: payload.items?.length || 0,
        paymentMethod: "paper",
        source: "paper_webhook",
      });

      console.log(`Paper payment notification created for: ${invoiceId}`);
    }

    res.status(200).json({ status: "received" });
  } catch (error) {
    console.error("Error processing Paper payment webhook:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// HTTP endpoint for Desty payment notifications
exports.destyPaymentWebhook = jakartaFn.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  try {
    const payload = req.body;
    console.log("Desty Payment Webhook received:", JSON.stringify(payload, null, 2));

    // Check if order is paid (settlement)
    const isPaid = payload.hasPaid === true && (
      payload.orderStatusList?.includes("Completed") ||
      payload.orderStatusList?.includes("Ready_To_Ship") ||
      payload.orderStatusList?.includes("Shipping")
    );

    if (isPaid) {
      const orderId = payload.orderSn || payload.orderId;
      const totalAmount = payload.totalAmount || payload.amount || 0;

      await createPaymentNotification({
        invoiceId: orderId,
        orderId: orderId,
        amount: totalAmount,
        customerName: payload.customerName || payload.senderName || "Pelanggan Desty",
        customerPhone: payload.customerPhone || "",
        items: payload.itemList?.length || 0,
        paymentMethod: "desty",
        source: "desty_webhook",
      });

      console.log(`Desty payment notification created for: ${orderId}`);
    }

    res.status(200).json({ status: "received" });
  } catch (error) {
    console.error("Error processing Desty payment webhook:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// Push stock update to Desty (for sending Carramica stock to Desty)
exports.pushStockToDesty = jakartaFn.https.onCall(async (data, context) => {
  try {
    const { skuNumber, stock, productName, warehouseId } = data;

    if (!skuNumber || stock === undefined) {
      throw new functions.https.HttpsError("invalid-argument", "skuNumber and stock are required");
    }

    // Get warehouse ID from settings if not provided
    let destyWarehouseId = warehouseId;
    if (!destyWarehouseId) {
      const settingsDoc = await firestore.doc("desty_settings/config").get();
      if (settingsDoc.exists) {
        destyWarehouseId = settingsDoc.data().warehouseId;
      }
    }

    if (!destyWarehouseId) {
      throw new functions.https.HttpsError("invalid-argument", "warehouseId not configured");
    }

    console.log(`Pushing stock to Desty: SKU=${skuNumber}, Stock=${stock}`);

    const response = await destyApiRequest("/api/inventory/stock/sync", "POST", {
      warehouseId: destyWarehouseId,
      stocks: [
        {
          skuNumber,
          onHandStock: stock,
          productName: productName || "",
        },
      ],
    });

    console.log("Push to Desty response:", response);

    return {
      success: response.code === "0",
      response,
    };
  } catch (error) {
    console.error("Error in pushStockToDesty:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// ==========================================
// TEST AND DEBUG FUNCTIONS
// ==========================================

// Get list of warehouses from Desty
exports.getDestyWarehouses = jakartaFn.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  try {
    console.log("Getting Desty warehouse list...");

    const tokenResponse = await axios.post(`${DESTY_API_BASE}/api/auth/token`, {
      applyId: DESTY_APPLY_ID,
      username: DESTY_USERNAME,
      mobile: DESTY_MOBILE,
    });

    if (tokenResponse.data.code !== "0") {
      return res.status(500).json({
        success: false,
        error: "Failed to get token",
        data: tokenResponse.data
      });
    }

    const token = tokenResponse.data.data.accessToken;

    // Get warehouse list
    const warehouseResponse = await axios.post(
      `${DESTY_API_BASE}/api/warehouse/list`,
      { pageNumber: 1, pageSize: 50 },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    console.log("Warehouse response:", JSON.stringify(warehouseResponse.data));

    // Format and return the warehouse list
    let warehouses = [];
    if (warehouseResponse.data.results) {
      warehouses = warehouseResponse.data.results.map(w => ({
        externalWarehouseId: w.externalWarehouseId,
        name: w.name,
        address: w.address,
        city: w.city,
        province: w.province,
      }));
    }

    return res.status(200).json({
      success: true,
      totalCount: warehouseResponse.data.totalCount || 0,
      warehouses: warehouses,
      note: "Use externalWarehouseId for stock sync operations"
    });

  } catch (error) {
    console.error("Error getting warehouses:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.response?.data
    });
  }
});

// Direct test for stock push to Desty
exports.testDestyStockPush = jakartaFn.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  const { skuNumber, stock } = req.body || {};

  if (!skuNumber) {
    return res.status(400).json({
      success: false,
      error: "skuNumber is required"
    });
  }

  const results = {
    timestamp: new Date().toISOString(),
    skuNumber,
    stock: stock || 0,
    tests: [],
    finalResult: null
  };

  try {
    // Step 1: Get token
    results.tests.push({ step: "Get Token", status: "started" });
    const tokenResponse = await axios.post(`${DESTY_API_BASE}/api/auth/token`, {
      applyId: DESTY_APPLY_ID,
      username: DESTY_USERNAME,
      mobile: DESTY_MOBILE,
    });

    if (tokenResponse.data.code !== "0") {
      results.tests.push({
        step: "Get Token",
        status: "failed",
        error: tokenResponse.data
      });
      throw new Error("Failed to get token");
    }

    const token = tokenResponse.data.data.accessToken;
    results.tests.push({
      step: "Get Token",
      status: "success",
      data: { tokenPrefix: token.substring(0, 20) + "..." }
    });

    // Step 2: Test SYNC with warehouseId (internal ID)
    results.tests.push({ step: "Test SYNC with warehouseId (internal)", status: "started" });
    try {
      const syncResponse = await axios.post(
        `${DESTY_API_BASE}/api/inventory/stock/sync`,
        {
          warehouseId: DESTY_WAREHOUSE_ID,
          stocks: [{
            skuNumber: skuNumber,
            onHandStock: Math.max(0, stock),
            productName: "Test Product"
          }]
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          timeout: 30000
        }
      );

      results.tests.push({
        step: "Test SYNC with warehouseId (internal)",
        status: syncResponse.data.code === "0" ? "success" : "failed",
        data: syncResponse.data
      });

      if (syncResponse.data.code === "0") {
        results.finalResult = "success";
        results.finalMethod = "sync_warehouseId";
        return res.status(200).json(results);
      }
    } catch (syncError) {
      results.tests.push({
        step: "Test SYNC with warehouseId (internal)",
        status: "error",
        data: {
          error: syncError.message,
          errorData: syncError.response?.data
        }
      });
    }

    // Step 3: Test SYNC with externalWarehouseId
    results.tests.push({ step: "Test SYNC with externalWarehouseId", status: "started" });
    try {
      const syncResponse2 = await axios.post(
        `${DESTY_API_BASE}/api/inventory/stock/sync`,
        {
          externalWarehouseId: "crm-warehouse",
          stocks: [{
            skuNumber: skuNumber,
            onHandStock: Math.max(0, stock),
            productName: "Test Product"
          }]
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          timeout: 30000
        }
      );

      results.tests.push({
        step: "Test SYNC with externalWarehouseId",
        status: syncResponse2.data.code === "0" ? "success" : "failed",
        data: syncResponse2.data
      });

      if (syncResponse2.data.code === "0") {
        results.finalResult = "success";
        results.finalMethod = "sync_externalWarehouseId";
        return res.status(200).json(results);
      }
    } catch (syncError2) {
      results.tests.push({
        step: "Test SYNC with externalWarehouseId",
        status: "error",
        data: {
          error: syncError2.message,
          errorData: syncError2.response?.data
        }
      });
    }

    // Step 4: Test ADD endpoint
    results.tests.push({ step: "Test ADD with externalWarehouseId", status: "started" });
    try {
      const addResponse = await axios.post(
        `${DESTY_API_BASE}/api/inventory/stock/add`,
        {
          externalWarehouseId: "crm-warehouse",
          stocks: [{
            skuNumber: skuNumber,
            stockAdjustment: Math.max(0, stock),
            productName: "Test Product"
          }]
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          timeout: 30000
        }
      );

      results.tests.push({
        step: "Test ADD with externalWarehouseId",
        status: addResponse.data.code === "0" ? "success" : "failed",
        data: addResponse.data
      });

      if (addResponse.data.code === "0") {
        results.finalResult = "success";
        results.finalMethod = "add_externalWarehouseId";
        return res.status(200).json(results);
      }
    } catch (addError) {
      results.tests.push({
        step: "Test ADD with externalWarehouseId",
        status: "error",
        data: {
          error: addError.message,
          errorData: addError.response?.data
        }
      });
    }

    // Step 5: Test MINUS endpoint
    results.tests.push({ step: "Test MINUS with externalWarehouseId", status: "started" });
    try {
      const minusResponse = await axios.post(
        `${DESTY_API_BASE}/api/inventory/stock/minus`,
        {
          externalWarehouseId: "crm-warehouse",
          stocks: [{
            skuNumber: skuNumber,
            stockAdjustment: Math.max(0, stock),
            productName: "Test Product"
          }]
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          timeout: 30000
        }
      );

      results.tests.push({
        step: "Test MINUS with externalWarehouseId",
        status: minusResponse.data.code === "0" ? "success" : "failed",
        data: minusResponse.data
      });

      if (minusResponse.data.code === "0") {
        results.finalResult = "success";
        results.finalMethod = "minus_externalWarehouseId";
        return res.status(200).json(results);
      }
    } catch (minusError) {
      results.tests.push({
        step: "Test MINUS with externalWarehouseId",
        status: "error",
        data: {
          error: minusError.message,
          errorData: minusError.response?.data
        }
      });
    }

    results.finalResult = "failed";
    results.conclusion = "All stock endpoints failed. Please check authorization permissions for inventory management.";
    return res.status(200).json(results);

  } catch (error) {
    console.error("Error in testDestyStockPush:", error);
    results.finalResult = "error";
    results.error = error.message;
    return res.status(500).json(results);
  }
});

// Comprehensive test function for Desty webhook and stock push
exports.testDestyWebhook = jakartaFn.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  const results = {
    timestamp: new Date().toISOString(),
    steps: [],
    finalStatus: null,
    errors: [],
  };

  try {
    // Step 1: Get Desty Access Token
    results.steps.push({ step: "Get Desty Token", status: "started" });
    try {
      const tokenResponse = await axios.post(`${DESTY_API_BASE}/api/auth/token`, {
        applyId: DESTY_APPLY_ID,
        username: DESTY_USERNAME,
        mobile: DESTY_MOBILE,
      });

      if (tokenResponse.data.code !== "0") {
        results.steps.push({
          step: "Get Desty Token",
          status: "failed",
          error: tokenResponse.data
        });
        throw new Error("Failed to get token: " + JSON.stringify(tokenResponse.data));
      }

      const token = tokenResponse.data.data.accessToken;
      results.steps.push({
        step: "Get Desty Token",
        status: "success",
        data: {
          tokenType: tokenResponse.data.data.tokenType,
          expireTime: tokenResponse.data.data.expireTime,
        }
      });

      // Step 2: Get warehouse list
      results.steps.push({ step: "Get Warehouse List", status: "started" });

      try {
        const warehouseResponse = await axios.post(
          `${DESTY_API_BASE}/api/warehouse/list`,
          { pageNumber: 1, pageSize: 50 },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 30000,
          }
        );

        const warehouses = warehouseResponse.data.results || [];
        results.steps.push({
          step: "Get Warehouse List",
          status: "success",
          data: {
            totalCount: warehouseResponse.data.totalCount || 0,
            warehouses: warehouses.map(w => ({
              externalWarehouseId: w.externalWarehouseId,
              name: w.name,
            }))
          }
        });

        // If no warehouses, try to test with common IDs
        if (warehouses.length === 0) {
          results.steps.push({
            step: "Warehouse List",
            status: "warning",
            data: { message: "No warehouses found in Desty account" }
          });
        }
      } catch (warehouseError) {
        results.steps.push({
          step: "Get Warehouse List",
          status: "error",
          data: {
            error: warehouseError.message,
            errorData: warehouseError.response?.data
          }
        });
      }

      // Step 3: Test with original warehouse ID (warehouseId)
      results.steps.push({
        step: "Test Original Warehouse ID (warehouseId)",
        status: "started",
        data: { warehouseId: DESTY_WAREHOUSE_ID }
      });

      try {
        const testPayload1 = {
          warehouseId: DESTY_WAREHOUSE_ID,
          stocks: [{
            skuNumber: "TEST-SKU-123",
            onHandStock: 10,
          }],
        };

        const testResponse1 = await axios.post(
          `${DESTY_API_BASE}/api/inventory/stock/sync`,
          testPayload1,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 30000,
          }
        );

        results.steps.push({
          step: "Test Original Warehouse ID (warehouseId)",
          status: "success",
          data: { response: testResponse1.data }
        });
      } catch (testError1) {
        results.steps.push({
          step: "Test Original Warehouse ID (warehouseId)",
          status: "error",
          data: {
            error: testError1.message,
            httpStatus: testError1.response?.status,
            errorData: testError1.response?.data
          }
        });
      }

      // Step 4: Test with externalWarehouseId parameter
      results.steps.push({
        step: "Test externalWarehouseId Parameter",
        status: "started",
        data: { warehouseId: DESTY_WAREHOUSE_ID }
      });

      try {
        const testPayload2 = {
          externalWarehouseId: DESTY_WAREHOUSE_ID,
          stocks: [{
            skuNumber: "TEST-SKU-123",
            onHandStock: 10,
          }],
        };

        const testResponse2 = await axios.post(
          `${DESTY_API_BASE}/api/inventory/stock/sync`,
          testPayload2,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 30000,
          }
        );

        results.steps.push({
          step: "Test externalWarehouseId Parameter",
          status: "success",
          data: { response: testResponse2.data }
        });
      } catch (testError2) {
        results.steps.push({
          step: "Test externalWarehouseId Parameter",
          status: "error",
          data: {
            error: testError2.message,
            httpStatus: testError2.response?.status,
            errorData: testError2.response?.data
          }
        });
      }

      // Step 5: Get products and test with real SKU
      results.steps.push({ step: "Find Products with Valid Desty SKU", status: "started" });

      const allProductsSnapshot = await firestore
        .collection("product")
        .get();

      const destyProducts = [];
      allProductsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.destySkuNumber && data.destySkuNumber.trim() !== "") {
          destyProducts.push({
            id: doc.id,
            name: data.nama,
            sku: data.sku,
            destySkuNumber: data.destySkuNumber,
            currentStock: data.stok,
          });
        }
      });

      const testProducts = destyProducts.slice(0, 3);

      results.steps.push({
        step: "Find Products with Valid Desty SKU",
        status: "success",
        data: {
          totalProducts: allProductsSnapshot.size,
          withValidDestySku: destyProducts.length,
          testProducts: testProducts,
        }
      });

      // Step 6: Test stock sync with real product (using warehouseId)
      if (testProducts.length > 0) {
        const testProduct = testProducts[0];
        results.steps.push({
          step: `Test Real Product with warehouseId`,
          status: "started",
          data: {
            sku: testProduct.destySkuNumber,
            stock: testProduct.currentStock,
          }
        });

        try {
          const realPayload = {
            warehouseId: DESTY_WAREHOUSE_ID,
            stocks: [{
              skuNumber: testProduct.destySkuNumber,
              onHandStock: Math.max(0, testProduct.currentStock),
            }],
          };

          const realResponse = await axios.post(
            `${DESTY_API_BASE}/api/inventory/stock/sync`,
            realPayload,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              timeout: 30000,
            }
          );

          results.steps.push({
            step: `Test Real Product with warehouseId`,
            status: "success",
            data: {
              sku: testProduct.destySkuNumber,
              response: realResponse.data
            }
          });
        } catch (realError) {
          results.steps.push({
            step: `Test Real Product with warehouseId`,
            status: "error",
            data: {
              error: realError.message,
              httpStatus: realError.response?.status,
              errorData: realError.response?.data,
              suggestion: "Check if the product SKU exists in Desty"
            }
          });
        }
      }

      results.finalStatus = "completed";

    } catch (stepError) {
      results.steps.push({
        step: "Execution",
        status: "error",
        error: stepError.message,
      });
      results.errors.push(stepError.message);
      results.finalStatus = "failed";
    }

    return res.status(200).json(results);

  } catch (error) {
    console.error("Error in testDestyWebhook:", error);
    results.errors.push(error.message);
    results.finalStatus = "failed";
    return res.status(500).json(results);
  }
});

// Test pushing stock for a specific product
exports.testPushStockForProduct = jakartaFn.https.onCall(async (data, context) => {
  try {
    const { productId, skuNumber, testStock } = data;

    if (!productId && !skuNumber) {
      throw new functions.https.HttpsError("invalid-argument", "productId or skuNumber is required");
    }

    // Find the product
    let productDoc;
    if (productId) {
      productDoc = await firestore.doc(`product/${productId}`).get();
    }

    if (!productDoc?.exists && skuNumber) {
      // Try to find by destySkuNumber
      let snapshot = await firestore
        .collection("product")
        .where("destySkuNumber", "==", skuNumber)
        .limit(1)
        .get();

      if (snapshot.empty) {
        // Try by sku_rapin
        snapshot = await firestore
          .collection("product")
          .where("sku_rapin", "==", skuNumber)
          .limit(1)
          .get();
      }

      if (!snapshot.empty) {
        productDoc = snapshot.docs[0];
      }
    }

    if (!productDoc?.exists) {
      throw new Error(`Product not found: ${productId || skuNumber}`);
    }

    const product = productDoc.data();
    const destySku = product.destySkuNumber || product.sku_rapin || product.sku;
    const stockToPush = testStock !== undefined ? testStock : product.stok;

    console.log(`Testing stock push for product: ${productDoc.id}, SKU: ${destySku}, Stock: ${stockToPush}`);

    // Push to Desty
    const pushed = await pushStockToDesty(destySku, stockToPush, product.nama);

    return {
      success: pushed,
      productId: productDoc.id,
      skuNumber: destySku,
      stockPushed: stockToPush,
      previousStock: product.stok,
      source: "destySkuNumber" in product ? "destySkuNumber" : "sku_rapin" in product ? "sku_rapin" : "sku",
    };
  } catch (error) {
    console.error("Error in testPushStockForProduct:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Get stock push logs from Firestore
exports.getStockPushLogs = jakartaFn.https.onCall(async (data, context) => {
  try {
    const { limit = 50, status } = data;

    let query = firestore
      .collection("desty_stock_push_logs")
      .orderBy("timestamp", "desc")
      .limit(limit);

    if (status) {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.get();

    const logs = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      logs.push({
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate?.() || new Date(),
      });
    });

    return {
      success: true,
      count: logs.length,
      logs,
    };
  } catch (error) {
    console.error("Error in getStockPushLogs:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Get Desty webhook logs
exports.getWebhookLogs = jakartaFn.https.onCall(async (data, context) => {
  try {
    const { limit = 50 } = data;

    const snapshot = await firestore
      .collection("desty_order_logs")
      .orderBy("receivedAt", "desc")
      .limit(limit)
      .get();

    const logs = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      logs.push({
        id: doc.id,
        ...data,
        receivedAt: data.receivedAt?.toDate?.() || new Date(),
      });
    });

    return {
      success: true,
      count: logs.length,
      logs,
    };
  } catch (error) {
    console.error("Error in getWebhookLogs:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Clear/Delete stock push logs
exports.clearStockPushLogs = jakartaFn.https.onCall(async (data, context) => {
  try {
    const { olderThanDays } = data || {};

    let query = firestore.collection("desty_stock_push_logs");

    // If olderThanDays specified, only delete logs older than that
    if (olderThanDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      query = query.where("timestamp", "<", cutoffDate);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      return {
        success: true,
        deletedCount: 0,
        message: "No logs to delete"
      };
    }

    // Delete in batches of 500 (Firestore limit)
    const batchSize = 500;
    let deletedCount = 0;

    while (!snapshot.empty) {
      const batch = firestore.batch();
      const docsToDelete = snapshot.docs.slice(0, batchSize);

      docsToDelete.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      deletedCount += docsToDelete.length;

      // Get remaining docs for next batch
      if (snapshot.docs.length > batchSize) {
        const remainingDocs = snapshot.docs.slice(batchSize);
        snapshot.forEach(doc => {
          if (!docsToDelete.includes(doc)) {
            // This is a workaround - in reality we'd need to requery
          }
        });
        break; // For simplicity, just process one batch
      } else {
        break;
      }
    }

    console.log(`[CLEAR LOGS] Deleted ${deletedCount} stock push logs`);

    return {
      success: true,
      deletedCount,
      message: `Successfully deleted ${deletedCount} log entries`
    };
  } catch (error) {
    console.error("Error in clearStockPushLogs:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Clear/Delete webhook order logs
exports.clearWebhookLogs = jakartaFn.https.onCall(async (data, context) => {
  try {
    const { olderThanDays } = data || {};

    let query = firestore.collection("desty_order_logs");

    // If olderThanDays specified, only delete logs older than that
    if (olderThanDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      query = query.where("receivedAt", "<", cutoffDate);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      return {
        success: true,
        deletedCount: 0,
        message: "No logs to delete"
      };
    }

    // Delete in batches of 500 (Firestore limit)
    let deletedCount = 0;

    while (!snapshot.empty) {
      const batch = firestore.batch();
      const docsToDelete = snapshot.docs.slice(0, 500);

      docsToDelete.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      deletedCount += docsToDelete.length;
      break; // For simplicity, just process one batch
    }

    console.log(`[CLEAR LOGS] Deleted ${deletedCount} webhook logs`);

    return {
      success: true,
      deletedCount,
      message: `Successfully deleted ${deletedCount} log entries`
    };
  } catch (error) {
    console.error("Error in clearWebhookLogs:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Test desty webhook handler directly (for testing)
exports.testDestyWebhookHandler = jakartaFn.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  const payload = req.body;

  console.log("=== TEST: Simulating Desty Webhook ===");
  console.log("Payload:", JSON.stringify(payload, null, 2));

  try {
    // Call the internal handler
    await handleDestyOrderWebhook(payload);

    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      payload: payload
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get product stock from Firestore (for verification)
exports.getProductStock = jakartaFn.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  const { skuNumber } = req.body || {};

  try {
    // Find product by destySkuNumber, sku, or sku_rapin
    let snapshot = await firestore
      .collection("product")
      .where("destySkuNumber", "==", skuNumber)
      .limit(1)
      .get();

    if (snapshot.empty) {
      snapshot = await firestore
        .collection("product")
        .where("sku", "==", skuNumber)
        .limit(1)
        .get();
    }

    if (snapshot.empty) {
      snapshot = await firestore
        .collection("product")
        .where("sku_rapin", "==", skuNumber)
        .limit(1)
        .get();
    }

    if (snapshot.empty) {
      return res.status(404).json({
        success: false,
        error: `Product with SKU ${skuNumber} not found`
      });
    }

    const productDoc = snapshot.docs[0];
    const product = productDoc.data();

    return res.status(200).json({
      success: true,
      productId: productDoc.id,
      productName: product.nama,
      sku: product.sku,
      sku_rapin: product.sku_rapin,
      destySkuNumber: product.destySkuNumber,
      stock: product.stok,
      qty_sold: product.qty_sold
    });
  } catch (error) {
    console.error("Error getting product stock:", error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test webhook with stock verification
exports.testWebhookWithVerification = jakartaFn.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  const { skuNumber, quantity } = req.body || {};
  const results = { skuNumber, quantity, before: null, after: null, webhookResult: null };

  try {
    // Step 1: Get stock BEFORE
    let snapshot = await firestore
      .collection("product")
      .where("destySkuNumber", "==", skuNumber)
      .limit(1)
      .get();

    if (snapshot.empty) {
      snapshot = await firestore
        .collection("product")
        .where("sku_rapin", "==", skuNumber)
        .limit(1)
        .get();
    }

    if (snapshot.empty) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    const productDoc = snapshot.docs[0];
    const productBefore = productDoc.data();
    results.before = {
      productId: productDoc.id,
      productName: productBefore.nama,
      stock: productBefore.stok
    };

    // Step 2: Process webhook
    const webhookPayload = {
      orderId: "TEST-WEBHOOK-" + Date.now(),
      orderSn: "ORDER-TEST-" + Date.now(),
      orderStatusList: ["Completed"],
      hasPaid: true,
      itemList: [{
        itemCode: skuNumber,
        skuNumber: skuNumber,
        quantity: quantity || 1
      }]
    };

    try {
      await handleDestyOrderWebhook(webhookPayload);
      results.webhookResult = "success";
    } catch (err) {
      results.webhookResult = "error: " + err.message;
    }

    // Step 3: Get stock AFTER (with small delay)
    await new Promise(resolve => setTimeout(resolve, 1000));
    const afterSnapshot = await firestore.doc(`product/${productDoc.id}`).get();
    const productAfter = afterSnapshot.data();
    results.after = {
      stock: productAfter.stok,
      qty_sold: productAfter.qty_sold
    };

    return res.status(200).json({
      success: true,
      results: results
    });

  } catch (error) {
    console.error("Error in testWebhookWithVerification:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      results: results
    });
  }
});

// Force redeploy timestamp: 2026-08-30
// Force deploy


// ============================================================
// TEST FUNCTION: Verify Desty Stock
// Call this to check current stock in Desty for a SKU
// ============================================================
exports.testDestyStockVerification = jakartaFn.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  try {
    const { skuNumber } = req.body || {};
    
    if (!skuNumber) {
      return res.status(400).json({ error: "skuNumber is required" });
    }
    
    console.log(`[TEST] Verifying Desty stock for SKU: ${skuNumber}`);
    
    // Get token
    const token = await getDestyAccessToken();
    console.log(`[TEST] Token obtained`);
    
    // Fetch SKU detail from Desty
    const detailResponse = await axios.get(
      `${DESTY_API_BASE}/api/product/sku/detail`,
      {
        params: { skuNumber },
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    
    console.log(`[TEST] Desty response:`, JSON.stringify(detailResponse.data, null, 2));
    
    if (detailResponse.data.code === "0" && detailResponse.data.data) {
      const skuData = detailResponse.data.data;
      const masterInventory = skuData.masterInventoryList || [];
      
      // Find Gudang Online
      const gudangOnline = masterInventory.find(
        inv => inv.externalWarehouseId === DESTY_WAREHOUSE_ID
      );
      
      return res.status(200).json({
        success: true,
        skuNumber,
        skuData: {
          productName: skuData.productName,
          warehouseId: DESTY_WAREHOUSE_ID,
          onHandStock: gudangOnline?.onHandStock || 0,
          promotionStock: gudangOnline?.promotionStock || 0,
          orderStock: gudangOnline?.orderStock || 0,
          availableStock: skuData.stock || 0,
        },
        allWarehouses: masterInventory.map(inv => ({
          warehouseName: inv.warehouseName,
          externalWarehouseId: inv.externalWarehouseId,
          onHandStock: inv.onHandStock,
          promotionStock: inv.promotionStock,
          orderStock: inv.orderStock,
        })),
        rawResponse: detailResponse.data
      });
    } else {
      return res.status(404).json({
        success: false,
        error: "SKU not found in Desty",
        response: detailResponse.data
      });
    }
  } catch (error) {
    console.error(`[TEST] Error:`, error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Force redeploy timestamp: 2026-09-22
// Accurate Integration - Phase 1 Foundation

// ============================================================
// ACCURATE OAUTH CALLBACK
// Handles OAuth callback from Accurate
// Register this URL in Accurate Developer Console:
// https://asia-southeast2-carramica-prod.cloudfunctions.net/accurateOAuthCallback
// ============================================================
exports.accurateOAuthCallback = jakartaFn.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  try {
    const { code, error, error_description } = req.query;

    console.log("[ACCURATE-CB] Query params:", JSON.stringify(req.query));

    // Check for OAuth errors
    if (error) {
      console.error("[ACCURATE-CB] OAuth error:", error, error_description);
      return res.status(400).send(`
        <html>
          <body>
            <h1 style="color: red;">OAuth Error</h1>
            <p><strong>Error:</strong> ${error}</p>
            <p><strong>Description:</strong> ${error_description || 'N/A'}</p>
            <p>Please close this window and try again.</p>
            <script>
              setTimeout(() => window.close(), 10000);
            </script>
          </body>
        </html>
      `);
    }

    if (!code) {
      console.error("[ACCURATE-CB] No authorization code received");
      return res.status(400).send(`
        <html>
          <body>
            <h1 style="color: orange;">Missing Authorization Code</h1>
            <p>No authorization code received in callback.</p>
            <p>Please close this window and try again.</p>
            <script>
              setTimeout(() => window.close(), 10000);
            </script>
          </body>
        </html>
      `);
    }

    console.log("[ACCURATE-CB] Received authorization code, length:", code.length);

    // Import auth service dynamically
    const accurateAuth = require("./src/services/accurateAuth");
    console.log("[ACCURATE-CB] accurateAuth module loaded");

    // Exchange code for tokens
    console.log("[ACCURATE-CB] Calling exchangeCodeForToken...");
    const tokens = await accurateAuth.exchangeCodeForToken(code);
    console.log("[ACCURATE-CB] Tokens obtained - accessToken:", tokens.accessToken ? "EXISTS" : "MISSING", "refreshToken:", tokens.refreshToken ? "EXISTS" : "MISSING");

    // Store tokens in Firestore DIRECTLY in index.js
    console.log("[ACCURATE-CB] Storing tokens in Firestore...");
    let storeResult = false;
    let storeErrorMsg = "";

    try {
      const COLLECTION_ACCURATE_TOKENS = "accurate_settings/tokens";
      console.log("[ACCURATE-CB] Getting Firestore...");
      const db = getFirestore();
      console.log("[ACCURATE-CB] Got Firestore, type:", typeof db);

      if (!db) {
        storeErrorMsg = "Firestore is undefined";
        console.error("[ACCURATE-CB]", storeErrorMsg);
      } else {
        const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);
        const tokenDoc = {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenType: tokens.tokenType || "Bearer",
          expiresAt: Timestamp.fromDate(expiresAt),
          connectedAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };

        console.log("[ACCURATE-CB] Writing to Firestore...");
        // Store at accurate_settings/tokens (matching frontend: doc(firestore, "accurate_settings", "tokens"))
        // Path: collection "accurate_settings", document ID "tokens"
        const tokenRef = db.collection("accurate_settings").doc("tokens");
        await tokenRef.set(tokenDoc);
        console.log("[ACCURATE-CB] Write completed!");
        storeResult = true;
      }
    } catch (storeError) {
      storeErrorMsg = storeError.message;
      console.error("[ACCURATE-CB] Store error:", storeErrorMsg);
    }

    console.log("[ACCURATE-CB] Store result:", storeResult);

    // Open database to get session and host
    let dbInfo = null;
    if (storeResult) {
      try {
        dbInfo = await accurateAuth.openDatabase();
        console.log("[ACCURATE-CB] Database opened");
      } catch (dbError) {
        console.error("[ACCURATE-CB] openDatabase error:", dbError.message);
      }
    }

    // Return result page with ALL details
    return res.status(200).send(`
      <html>
        <body>
          <h1 style="color: ${storeResult ? 'green' : 'orange'}; font-size: 48px;">
            ${storeResult ? 'SUCCESS!' : 'PARTIAL SUCCESS'}
          </h1>
          <p style="font-size: 20px;">OAuth completed. Tokens ${storeResult ? 'stored' : 'NOT stored'}.</p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0; font-family: monospace;">
            <p><strong>Token stored:</strong> ${storeResult ? 'YES' : 'NO'}</p>
            ${dbInfo ? '<p><strong>Database:</strong> ' + dbInfo.databaseName + '</p><p><strong>Host:</strong> ' + dbInfo.host + '</p>' : ''}
            ${!storeResult ? '<p style="color: red;"><strong>Store Error:</strong> ' + storeErrorMsg + '</p>' : ''}
          </div>
          <hr>
          <p>Please CLOSE this window and check Firebase Firestore manually.</p>
          <p>Path to check: <code>accurate_settings/tokens/main</code></p>
          <script>
            console.log("Store result:", ${storeResult});
            console.log("Store error:", "${storeErrorMsg}");
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("[ACCURATE-CB] FULL ERROR:", error);
    return res.status(500).send(`
      <html>
        <body>
          <h1 style="color: red;">Error</h1>
          <p><strong>Message:</strong> ${error.message}</p>
        </body>
      </html>
    `);
  }
});

// ============================================================
// ACCURATE AUTH URL
// Returns the OAuth authorization URL for frontend to open
// ============================================================
exports.getAccurateAuthUrl = jakartaFn.https.onCall(async (data, context) => {
  const accurateAuth = require("./src/services/accurateAuth");

  try {
    const authUrl = accurateAuth.getAuthorizationUrl();
    console.log("[ACCURATE] Generated auth URL");

    return {
      success: true,
      authorizationUrl: authUrl,
    };
  } catch (error) {
    console.error("[ACCURATE] Error generating auth URL:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// ============================================================
// DISCONNECT ACCURATE
// Removes tokens from Firestore
// ============================================================
exports.disconnectAccurate = jakartaFn.https.onCall(async (data, context) => {
  const accurateAuth = require("./src/services/accurateAuth");

  try {
    await accurateAuth.disconnect();
    console.log("[ACCURATE] Disconnected");

    return {
      success: true,
      message: "Disconnected from Accurate",
    };
  } catch (error) {
    console.error("[ACCURATE] Error disconnecting:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// ============================================================
// TEST ACCURATE CONNECTION
// Tests the connection to Accurate API
// ============================================================
exports.testAccurateConnection = jakartaFn.https.onCall(async (data, context) => {
  const accurateApi = require("./src/services/accurateApi");

  try {
    console.log("[ACCURATE] Testing connection...");
    const result = await accurateApi.testConnection();
    console.log("[ACCURATE] Connection test result:", result);

    return result;
  } catch (error) {
    console.error("[ACCURATE] Error testing connection:", error);
    return {
      success: false,
      message: error.message,
    };
  }
});

// ============================================================
// SYNC STOCK FROM ACCURATE
// Syncs all product stock from Accurate to Firestore
// ============================================================
exports.syncStockFromAccurate = jakartaFn.https.onCall(async (data, context) => {
  const accurateSync = require("./src/services/accurateSync");

  try {
    const { dryRun = false, sku = null } = data || {};

    console.log("[ACCURATE] Starting stock sync. Dry run:", dryRun, "SKU:", sku);

    let result;
    if (sku) {
      result = await accurateSync.syncSingleProductStock(sku, dryRun);
    } else {
      result = await accurateSync.syncStockFromAccurate({ dryRun });
    }

    console.log("[ACCURATE] Stock sync result:", result);

    return result;
  } catch (error) {
    console.error("[ACCURATE] Error syncing stock:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

// ============================================================
// SYNC ORDERS FROM ACCURATE
// Syncs orders from Accurate to Firestore
// ============================================================
exports.syncOrdersFromAccurate = jakartaFn.https.onCall(async (data, context) => {
  const accurateSync = require("./src/services/accurateSync");

  try {
    const { dryRun = false, pageSize = 50 } = data || {};

    console.log("[ACCURATE] Starting order sync. Dry run:", dryRun);

    const result = await accurateSync.syncOrdersFromAccurate({ dryRun, pageSize });

    console.log("[ACCURATE] Order sync result:", result);

    return result;
  } catch (error) {
    console.error("[ACCURATE] Error syncing orders:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

// ============================================================
// CREATE ORDER IN ACCURATE
// Creates a sales order in Accurate from Carramica order
// ============================================================
exports.createOrderInAccurate = jakartaFn.https.onCall(async (data, context) => {
  const accurateSync = require("./src/services/accurateSync");

  try {
    const { orderId, orderData, dryRun = false } = data || {};

    if (!orderData) {
      throw new Error("orderData is required");
    }

    console.log("[ACCURATE] Creating order in Accurate. Order ID:", orderId);

    const result = await accurateSync.createOrderInAccurate(orderData, dryRun);

    console.log("[ACCURATE] Order creation result:", result);

    return result;
  } catch (error) {
    console.error("[ACCURATE] Error creating order:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

// ============================================================
// GET ACCURATE SYNC STATUS
// Gets current sync status and statistics
// ============================================================
exports.getAccurateSyncStatus = jakartaFn.https.onCall(async (data, context) => {
  const accurateSync = require("./src/services/accurateSync");

  try {
    console.log("[ACCURATE] Getting sync status...");

    const status = await accurateSync.getSyncStatus();

    console.log("[ACCURATE] Sync status:", status);

    return {
      success: true,
      ...status,
    };
  } catch (error) {
    console.error("[ACCURATE] Error getting sync status:", error);
    return {
      success: false,
      error: error.message,
    };
  }
});

// ============================================================
// SCHEDULED: AUTO SYNC STOCK FROM ACCURATE
// Runs every 5 minutes to sync stock
// ============================================================
exports.scheduledSyncAccurateStock = jakartaFn.pubsub
  .schedule("every 5 minutes")
  .timeZone("Asia/Jakarta")
  .onRun(async () => {
    const accurateSync = require("./src/services/accurateSync");

    console.log("[ACCURATE-SCHEDULED] Starting scheduled stock sync...");

    try {
      // Check if sync is enabled in config
      const config = await accurateSync.getConfig();

      if (!config.syncEnabled) {
        console.log("[ACCURATE-SCHEDULED] Sync is disabled in config, skipping...");
        return null;
      }

      if (!config.autoSyncStock) {
        console.log("[ACCURATE-SCHEDULED] Auto sync stock is disabled, skipping...");
        return null;
      }

      // Check if connected
      const accurateAuth = require("./src/services/accurateAuth");
      const isConnected = await accurateAuth.isConnected();

      if (!isConnected) {
        console.log("[ACCURATE-SCHEDULED] Not connected to Accurate, skipping...");
        return null;
      }

      // Run sync (dryRun based on config)
      const result = await accurateSync.syncStockFromAccurate({
        dryRun: config.dryRunMode || false,
      });

      console.log("[ACCURATE-SCHEDULED] Scheduled sync complete:", result);

      return result;
    } catch (error) {
      console.error("[ACCURATE-SCHEDULED] Error in scheduled sync:", error);
      return null;
    }
  });

// ============================================================
// HTTP ENDPOINT: Manual Stock Sync
// POST /syncAccurateStockHttp
// ============================================================
exports.syncAccurateStockHttp = jakartaFn.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).send('');
  }

  try {
    const { sku, dryRun } = req.body || {};

    const accurateSync = require("./src/services/accurateSync");

    let result;
    if (sku) {
      result = await accurateSync.syncSingleProductStock(sku, dryRun);
    } else {
      result = await accurateSync.syncStockFromAccurate({ dryRun: dryRun || false });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("[ACCURATE] Error in HTTP sync:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
