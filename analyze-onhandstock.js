// Analisis pattern onHandStock di webhook desty_order_logs
// Cek apakah onHandStock di webhook SUDAH dikurangi order atau BELUM
const fs = require("fs");
const data = JSON.parse(fs.readFileSync("desty_order_logs_export.json"));

// Group by SKU
const skuMap = {};
data.forEach(function(doc) {
  if (!doc.itemList) return;
  doc.itemList.forEach(function(item) {
    const sku = item.skuNumber || item.itemCode || "UNKNOWN";
    if (!skuMap[sku]) skuMap[sku] = [];
    skuMap[sku].push({
      orderSn: doc.orderSn,
      orderStatusList: doc.orderStatusList,
      hasPaid: doc.hasPaid,
      quantity: item.quantity,
      onHandStock: item.onHandStock,
      locationId: item.locationId,
      locationName: item.locationName,
      timestamp: doc.receivedAt || doc.receivedAt || doc.createTime || doc._createdAt,
    });
  });
});

console.log("=== ANALISIS PATTERN onHandStock ===\n");
console.log("Total documents:", data.length);
console.log("Total SKUs:", Object.keys(skuMap).length);

// Analisis per SKU
console.log("\n=== ANALISIS PER SKU ===");
Object.keys(skuMap).slice(0, 10).forEach(function(sku) {
  const entries = skuMap[sku].sort(function(a, b) {
    return new Date(a.timestamp) - new Date(b.timestamp);
  });
  console.log("\nSKU:", sku);
  console.log("Jumlah order:", entries.length);
  console.log("History onHandStock:");
  entries.forEach(function(e) {
    console.log("  [" + e.orderSn + "] onHandStock:" + e.onHandStock + " qty:" + e.quantity + " status:" + (e.orderStatusList || []).join(",") + " paid:" + e.hasPaid);
  });
});

// Cek pattern: apakah onHandStock turun sesuai quantity?
console.log("\n=== CEK DEDUCTION ===");
let deductedCorrectly = 0;
let notDeducted = 0;
let ambiguous = 0;
Object.keys(skuMap).forEach(function(sku) {
  const entries = skuMap[sku].sort(function(a, b) {
    return new Date(a.timestamp) - new Date(b.timestamp);
  });
  // Cek apakah onHandStock berkuran sesuai quantity ordered
  for (let i = 1; i < entries.length; i++) {
    const prev = entries[i-1];
    const curr = entries[i];
    const diff = (prev.onHandStock || 0) - (curr.onHandStock || 0);
    const expected = curr.quantity || 0;
    if (diff === expected || diff === 0) {
      deductedCorrectly++;
    } else if (diff !== 0) {
      notDeducted++;
      console.log("ANOMALI [" + sku + "] #" + i + ": prev=" + prev.onHandStock + " curr=" + curr.onHandStock + " diff=" + diff + " qtyordered=" + expected + " orderSn=" + curr.orderSn);
    }
  }
});
console.log("\nDeduction pattern correct:", deductedCorrectly, "| Anomali:", notDeducted);
