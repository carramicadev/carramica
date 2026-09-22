const admin = require('firebase-admin');
const fs = require('fs');
const serviceAccount = require('./firebase-admin-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();
async function exportCollectionToJsonl(collectionName, outputFile) {
    try {
        const snapshot = await db.collection(collectionName).get();
        if (snapshot.empty) {
            console.log(`No documents found in collection: ${collectionName}`);
            return;
        }

        const stream = fs.createWriteStream(outputFile, { flags: 'w' });

        snapshot.forEach(doc => {
            const jsonLine = JSON.stringify({ id: doc.id, ...doc.data() }) + '\n';
            stream.write(jsonLine);
        });

        stream.end(() => {
            console.log(`Exported ${snapshot.size} documents to ${outputFile}`);
        });

    } catch (error) {
        console.error('Error exporting collection:', error);
    }
}

// Example usage:
exportCollectionToJsonl('orders', 'output.jsonl');
