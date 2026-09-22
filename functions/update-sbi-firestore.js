const fs = require("fs");
const admin = require("firebase-admin");
const soal = require("./soal2.json");
const serviceAccountProd = require("./firebase-admin-key-sbi.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountProd),
});

const db = admin.firestore();

async function uploadLatihan() {
  const latihanId = "latihan1";
  const latihanRef = db.collection("latihan").doc(latihanId);

  // create latihan metadata first
  await latihanRef.set({
    judul: "Latihan Bahasa Indonesia 1",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  console.log(`📘 Created latihan document: ${latihanId}`);

  // then upload soal as subcollection
  const soalDenganId = soal.map((s, index) => ({
    id: index + 1,
    ...s,
  }));

  const batch = db.batch();
  soalDenganId.forEach((item) => {
    const soalRef = latihanRef.collection("soal").doc(String(item.id));
    batch.set(soalRef, item);
  });

  await batch.commit();

  console.log(
    `✅ ${soalDenganId.length} soal uploaded to latihan/${latihanId}/soal`
  );
}

uploadLatihan().catch(console.error);
