const Typesense = require('typesense');
const fs = require('fs').promises; // Use fs.promises for async/await
const documents = require('./output.jsonl');

const client = new Typesense.Client({
    nodes: [
        {
            host: 'y5apuifswvrl74bhp-1.a1.typesense.net', // Replace with your Typesense host
            port: '443',
            protocol: 'https'
        }
    ],
    apiKey: 'OvdKtPQfBDayVPAihYPuHIuTZr2kX40Y', // Replace with your API key
    connectionTimeoutSeconds: 5
});

async function restoreFirebaseToTypesense() {
    try {
        console.log('Reading documents from JSONL file...');
        const documentsInJsonl = await fs.readFile(documents); // Read file as UTF-8 string

        console.log('Importing documents to Typesense...');
        const result = await client
            .collections('orders')
            .documents()
            .import(documentsInJsonl, { action: 'create' });

        console.log('Import result:', result);
    } catch (error) {
        console.error('Error during restoration:', error.message);
    }
}

restoreFirebaseToTypesense();
