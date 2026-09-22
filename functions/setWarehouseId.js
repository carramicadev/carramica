// Script untuk set warehouse ID di Firestore
const admin = require('firebase-admin');
const readline = require('readline');

// Use service account credentials
const serviceAccount = require('./firebase-admin-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('Warehouse ID yang terlihat dari products Desty: 2042620805094079444 (Master Warehouse)');
console.log('');

rl.question('Masukkan Warehouse ID Desty: ', async (warehouseId) => {
  try {
    await db.doc('desty_settings/config').set({
      warehouseId: warehouseId,
      warehouseName: 'Manual Set',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`Warehouse ID "${warehouseId}" berhasil disimpan!`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
});
