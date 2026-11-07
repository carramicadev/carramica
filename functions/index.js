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

admin.initializeApp();
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

      // if (notification.transaction_status === 'pending') {
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
// exports.sendPaymentReminders = jakartaFn.pubsub
//   .schedule("every 24 hours")
//   .onRun(async () => {
//     const now = admin.firestore.Timestamp.now();

//     try {
//       const ordersSnapshot = await firestore
//         .collection("orders")
//         .where("paymentStatus", "==", "pending") // Check only pending payments
//         .get();

//       for (const doc of ordersSnapshot.docs) {
//         const orderData = doc.data();
//         const createdAt = orderData.createdAt?.toDate();
//         const currentDate = now.toDate();

//         // Log dates for debugging
//         console.log("createdAt:", createdAt);
//         console.log("currentDate:", currentDate);

//         const daysSinceCreation = Math.floor(
//           (currentDate - createdAt) / (1000 * 60 * 60 * 24)
//         );

//         // Log daysSinceCreation for debugging
//         console.log("daysSinceCreation:", daysSinceCreation);

//         // Qontak API configuration
//         const baseUrl = functions.config().qontak.baseurl;
//         const token = functions.config().qontak.token;
//         const channel = functions.config().qontak.channel;
//         const reminderH1 = functions.config().qontak.reminder.h1;
//         const reminderH5 = functions.config().qontak.reminder.h5;

//         // Log reminder flags for debugging
//         console.log("reminders.day1:", orderData?.reminders?.day1);
//         console.log("reminders.day5:", orderData?.reminders?.day5);

//         // H+1 Day Reminder
//         if (daysSinceCreation === 1 && !orderData?.reminders?.day1) {
//           console.log(`Sending H+1 reminder for order: ${doc.id}`);

//           try {
//             await axios.post(
//               baseUrl,
//               {
//                 to_number: orderData.senderPhone,
//                 to_name: orderData.senderName,
//                 message_template_id: reminderH1,
//                 channel_integration_id: channel,
//                 language: {
//                   code: "id",
//                 },
//                 parameters: {
//                   body: [
//                     {
//                       key: "1",
//                       value: "link",
//                       value_text: orderData?.midtrans?.redirect_url,
//                     },
//                   ],
//                 },
//               },
//               {
//                 headers: {
//                   Authorization: `Bearer ${token}`,
//                 },
//               }
//             );

//             // Mark reminder as sent
//             await doc.ref.update({ "reminders.day1": true });
//             console.log(`H+1 reminder sent for order: ${doc.id}`);
//           } catch (error) {
//             console.error(
//               `Error sending H+1 reminder for order: ${doc.id}`,
//               error
//             );
//           }
//         }

//         // H+5 Day Reminder
//         if (daysSinceCreation === 5 && !orderData?.reminders?.day5) {
//           console.log(`Sending H+5 reminder for order: ${doc.id}`);

//           try {
//             await axios.post(
//               baseUrl,
//               {
//                 to_number: orderData.senderPhone,
//                 to_name: orderData.senderName,
//                 message_template_id: reminderH5,
//                 channel_integration_id: channel,
//                 language: {
//                   code: "id",
//                 },
//                 parameters: {
//                   body: [
//                     {
//                       key: "1",
//                       value: "link",
//                       value_text: orderData?.midtrans?.redirect_url,
//                     },
//                   ],
//                 },
//               },
//               {
//                 headers: {
//                   Authorization: `Bearer ${token}`,
//                 },
//               }
//             );

//             // Mark reminder as sent
//             await doc.ref.update({ "reminders.day5": true });
//             console.log(`H+5 reminder sent for order: ${doc.id}`);
//           } catch (error) {
//             console.error(
//               `Error sending H+5 reminder for order: ${doc.id}`,
//               error
//             );
//           }
//         }

//         // Add a delay between processing orders
//         await new Promise((resolve) => setTimeout(resolve, 5000));
//       }

//       console.log("Payment reminders sent successfully.");
//     } catch (error) {
//       console.error("Error in sendPaymentReminders function:", error);
//     }
//   });


exports.sendPaymentReminders = jakartaFn
  .runWith({ timeoutSeconds: 300 })
  .pubsub.schedule("every 24 hours")
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const currentDate = now.toDate();

    const qontakConfig = functions.config().qontak;
    const {
      baseurl: baseUrl,
      token,
      channel,
      reminder: {
        h1: reminderH1,
        h5: reminderH5,
      },
    } = qontakConfig;

    console.log("Starting sendPaymentReminders");

    try {
      const ordersSnapshot = await firestore
        .collection("orders")
        .where("paymentStatus", "==", "pending")
        .get();

      console.log(
        `Found ${ordersSnapshot.size} pending orders`
      );

      let sentCount = 0;
      let skippedCount = 0;
      let errorCount = 0;

      for (const doc of ordersSnapshot.docs) {
        const orderData = doc.data();

        try {
          // Validate creation date
          const createdAt = orderData.createdAt?.toDate?.();

          if (!createdAt || Number.isNaN(createdAt.getTime())) {
            console.warn(
              `Skipping order ${doc.id}: invalid createdAt`
            );
            skippedCount++;
            continue;
          }

          // Validate required recipient and payment link
          if (
            !orderData.senderPhone ||
            !orderData.senderName ||
            !orderData.midtrans?.redirect_url
          ) {
            console.warn(
              `Skipping order ${doc.id}: missing phone, name, or payment URL`
            );
            skippedCount++;
            continue;
          }

          const daysSinceCreation = Math.floor(
            (currentDate.getTime() - createdAt.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          const reminders = orderData.reminders || {};

          console.log(
            `Order ${doc.id}: age=${daysSinceCreation} days, ` +
            `day1=${reminders.day1}, day5=${reminders.day5}`
          );

          if (daysSinceCreation < 1) {
            skippedCount++;
            continue;
          }

          // H+1 reminder: send once, including if overdue
          if (!reminders.day1) {
            console.log(`Sending H+1 reminder: ${doc.id}`);

            await axios.post(
              baseUrl,
              {
                to_number: orderData.senderPhone,
                to_name: orderData.senderName,
                message_template_id: reminderH1,
                channel_integration_id: channel,
                language: { code: "id" },
                parameters: {
                  body: [
                    {
                      key: "1",
                      value: "link",
                      value_text: orderData.midtrans.redirect_url,
                    },
                  ],
                },
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                timeout: 15000,
              }
            );

            await doc.ref.update({
              "reminders.day1": true,
              "reminders.day1SentAt": admin.firestore.FieldValue.serverTimestamp(),
            });

            sentCount++;
            console.log(`H+1 sent successfully: ${doc.id}`);
          }

          // H+5 reminder: send once, including if overdue
          if (daysSinceCreation >= 5 && !reminders.day5) {
            console.log(`Sending H+5 reminder: ${doc.id}`);

            await axios.post(
              baseUrl,
              {
                to_number: orderData.senderPhone,
                to_name: orderData.senderName,
                message_template_id: reminderH5,
                channel_integration_id: channel,
                language: { code: "id" },
                parameters: {
                  body: [
                    {
                      key: "1",
                      value: "link",
                      value_text: orderData.midtrans.redirect_url,
                    },
                  ],
                },
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                timeout: 15000,
              }
            );

            await doc.ref.update({
              "reminders.day5": true,
              "reminders.day5SentAt": admin.firestore.FieldValue.serverTimestamp(),
            });

            sentCount++;
            console.log(`H+5 sent successfully: ${doc.id}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`Reminder error for order ${doc.id}:`, {
            message: error.message,
            status: error.response?.status,
            response: error.response?.data,
          });
        }
      }

      console.log("sendPaymentReminders completed", {
        totalOrders: ordersSnapshot.size,
        sentCount,
        skippedCount,
        errorCount,
      });
    } catch (error) {
      console.error("sendPaymentReminders failed:", error);
      throw error;
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
