const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
const serviceAccount = require("./firebase-admin-key.json");
const serviceAccountProd = require("./firebase-admin-key-prod.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountProd),
});

const db = admin.firestore();
async function backupCollection(source, destination) {
  const snapshot = await db.collection(source).get();

  if (snapshot.empty) {
    console.log(`No documents in collection: ${source}`);
    return;
  }

  const maxBatchSize = 500;
  const maxPayloadSize = 9 * 1024 * 1024; // 9MB safety limit

  let batch = db.batch();
  let operationCount = 0;
  let currentSize = 0;

  const commitBatch = async () => {
    await batch.commit();
    console.log(`Committed ${operationCount} documents`);
    batch = db.batch();
    operationCount = 0;
    currentSize = 0;
  };

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const dataSize = Buffer.byteLength(JSON.stringify(data));

    if (
      operationCount >= maxBatchSize ||
      currentSize + dataSize >= maxPayloadSize
    ) {
      await commitBatch();
    }

    batch.set(db.collection(destination).doc(doc.id), data);
    operationCount++;
    currentSize += dataSize;
  }

  if (operationCount > 0) {
    await commitBatch();
  }

  console.log(`Backup from '${source}' to '${destination}' completed.`);
}

// Call function
backupCollection("orders", "orders-backup")
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Backup failed:", err);
    process.exit(1);
  });
