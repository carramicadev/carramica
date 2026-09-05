// Script export Firestore collection to JSON
// Usage: node export-firestore-collection.js
// Default: exports desty_order_logs from production project
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const ENV = "prod"; // change to "dev" for development
const COLLECTION = "desty_order_logs"; // change collection name as needed
const OUTPUT_FILE = COLLECTION + "_export.json";

const prodPaths = ["../functions/firebase-admin-key-prod.json", "functions/firebase-admin-key-prod.json"];
const devPaths = ["../functions/firebase-admin-key.json", "functions/firebase-admin-key.json"];

const searchPaths = ENV === "dev" ? devPaths : prodPaths;

let serviceAccountPath = null;
for (const p of searchPaths) {
  try {
    fs.statSync(path.resolve(p));
    serviceAccountPath = path.resolve(p);
    break;
  } catch (_) {}
}

if (!serviceAccountPath) {
  console.error("Service account not found. Searched:");
  for (const p of searchPaths) console.error(" -", p);
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function run() {
  console.log("--- Firestore Export ---");
  console.log("Project env:", ENV);
  console.log("Collection:", COLLECTION);
  console.log("Output:", OUTPUT_FILE);
  console.log("Service account:", serviceAccountPath);

  const snapshot = await db.collection(COLLECTION).get();
  console.log("Total docs:", snapshot.size);

  if (snapshot.empty) {
    console.log("Collection empty or not found.");
    process.exit(0);
  }

  const docs = snapshot.docs.map(function(docSnap) {
    return { id: docSnap.id, _path: docSnap.ref.path, ...docSnap.data() };
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(docs, null, 2));
  const stats = fs.statSync(OUTPUT_FILE);

  console.log("\nExported:", docs.length, "documents");
  console.log("File:", OUTPUT_FILE, "(" + (stats.size/1024).toFixed(1) + " KB)");

  // Show summary
  console.log("\n--- Sample docs (first 3) ---");
  docs.slice(0, 3).forEach(function(doc, i) {
    console.log("\n[" + (i+1) + "] ID:", doc.id);
    if (doc.orderSn) console.log("    orderSn:", doc.orderSn);
    if (doc.orderStatusList) console.log("    orderStatusList:", doc.orderStatusList.join(", "));
    if (doc.hasPaid !== undefined) console.log("    hasPaid:", doc.hasPaid);
    if (doc.stockDeducted !== undefined) console.log("    stockDeducted:", doc.stockDeducted);
    if (doc.status) console.log("    status:", doc.status);
    if (doc.syncType) console.log("    syncType:", doc.syncType);
    if (doc.skuNumber) console.log("    skuNumber:", doc.skuNumber);
    if (doc.previousStock !== undefined) console.log("    previousStock:", doc.previousStock);
    if (doc.newStock !== undefined) console.log("    newStock:", doc.newStock);
    if (doc.quantity !== undefined) console.log("    quantity:", doc.quantity);
    if (doc.itemList && doc.itemList[0]) {
      const it = doc.itemList[0];
      if (it.onHandStock !== undefined) console.log("    [item] onHandStock:", it.onHandStock);
      if (it.quantity !== undefined) console.log("    [item] quantity:", it.quantity);
      if (it.skuNumber || it.itemCode) console.log("    [item] SKU:", it.skuNumber || it.itemCode);
    }
  });

  process.exit(0);
}

run().catch(function(err) {
  console.error("Error:", err.message);
  process.exit(1);
});
