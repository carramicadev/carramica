const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
const serviceAccount = require("./firebase-admin-key.json");
const serviceAccountProd = require("./firebase-admin-key-prod.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountProd),
});

const db = admin.firestore();
async function restoreMissingFields(orderId) {
  const backupRef = db.collection("orders-backup").doc(orderId);
  const targetRef = db.collection("orders").doc(orderId);

  const [backupSnap, targetSnap] = await Promise.all([
    backupRef.get(),
    targetRef.get(),
  ]);

  if (!backupSnap.exists) {
    console.log("❌ Backup document not found:", orderId);
    return;
  }

  if (!targetSnap.exists) {
    console.log("❌ Target document does not exist:", orderId);
    return;
  }

  const backupData = backupSnap.data();
  const targetData = targetSnap.data();

  const fieldsToRestore = {};

  for (const key in backupData) {
    // restore ONLY if field is missing
    if (!(key in targetData)) {
      fieldsToRestore[key] = backupData[key];
    }
  }

  if (Object.keys(fieldsToRestore).length === 0) {
    console.log("✅ No missing fields to restore");
    return;
  }

  await targetRef.set(fieldsToRestore, { merge: true });

  console.log("✅ Restored missing fields:", Object.keys(fieldsToRestore));
}

// usage
restoreMissingFields("INV-2025-8829").catch(console.error);
