const { Firestore } = require('@google-cloud/firestore');
const fs = require('fs');

const db = new Firestore({
  projectId: 'carramica-prod',
  keyFilename: 'functions/firebase-admin-key-prod.json',
});

async function exportCollection() {
  const collectionName = 'desty_order_logs';
  const snapshot = await db.collection(collectionName).get();

  const docs = [];
  snapshot.forEach(doc => {
    docs.push({ id: doc.id, data: doc.data() });
  });

  const output = JSON.stringify(docs, null, 2);
  fs.writeFileSync('desty_order_logs_export.json', output);
  console.log('Total dokumen:', docs.length);
  console.log('File tersimpan: desty_order_logs_export.json');
}

exportCollection().catch(console.error);
