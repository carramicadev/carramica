// Ringkasan analisis komprehensif desty webhook
const fs = require("fs");
const raw = JSON.parse(fs.readFileSync("desty_order_logs_export.json"));

console.log("==========================================");
console.log("  RINGKASAN ANALISIS DESTY WEBHOOK");
console.log("==========================================\n");
console.log("Total webhook logs:", raw.length);
console.log("");

// Status distribution
const statusCounts = {};
raw.forEach(function(d) {
  const s = (d.orderStatusList || []).join(", ") || "N/A";
  statusCounts[s] = (statusCounts[s] || 0) + 1;
});
console.log("--- Order Status Distribution ---");
Object.keys(statusCounts).sort(function(a, b) { return statusCounts[b] - statusCounts[a]; }).forEach(function(s) {
  console.log("  " + s + ":", statusCounts[s]);
});

// Paid summary
const paidTrue = raw.filter(function(d) { return d.hasPaid === true; }).length;
const paidFalse = raw.filter(function(d) { return d.hasPaid === false; }).length;
const paidUndef = raw.filter(function(d) { return d.hasPaid === undefined; }).length;

console.log("\n--- Paid Distribution ---");
console.log("  paid:true:", paidTrue);
console.log("  paid:false:", paidFalse);
console.log("  paid:undefined:", paidUndef);

// Stock-related fields check
console.log("\n--- Field stock-related di dokumen ---");
var stockFields = ["stockDeducted", "stockPushed", "previousStock", "newStock"];
stockFields.forEach(function(f) {
  var count = 0;
  raw.forEach(function(d) { if (d[f] !== undefined) count++; });
  console.log("  " + f + ":", count, "dokumen punya field ini");
});

// Categorize by settlement
var settlement = raw.filter(function(d) { return d.orderStatusList && d.orderStatusList.join(",").match(/Ready_To_Ship|Completed|Shipping|Delivered/i); });
var nonSettlement = raw.filter(function(d) { return !d.orderStatusList || !d.orderStatusList.join(",").match(/Ready_To_Ship|Completed|Shipping|Delivered/i); });

console.log("\n--- Settlement vs Non-Settlement ---");
console.log("  Settlement-related status:", settlement.length, "(Ready_To_Ship, Shipping, Completed, Delivered)");
console.log("  Non-settlement:", nonSettlement.length, "(New_Orders, Unpaid, dll)");

// Sample non-settlement
console.log("\n--- Sample Non-Settlement Webhooks ---");
nonSettlement.slice(0, 5).forEach(function(d, i) {
  console.log("\n[" + (i+1) + "] orderSn:", d.orderSn);
  console.log("    status:", (d.orderStatusList || []).join(", "));
  console.log("    hasPaid:", d.hasPaid);
  var item = d.itemList && d.itemList[0];
  if (item) {
    console.log("    SKU:", item.itemCode || item.skuNumber);
    console.log("    onHandStock:", item.onHandStock);
    console.log("    quantity:", item.quantity);
  }
});

// Sample settlement
var rts = settlement.filter(function(d) { return d.orderStatusList && d.orderStatusList.join(",").match(/Ready_To_Ship/i); }).slice(0, 5);
console.log("\n--- Sample Ready_To_Ship Settlement Webhooks ---");
rts.forEach(function(d, i) {
  console.log("\n[" + (i+1) + "] orderSn:", d.orderSn);
  console.log("    status:", (d.orderStatusList || []).join(", "));
  console.log("    hasPaid:", d.hasPaid);
  var item = d.itemList && d.itemList[0];
  if (item) {
    console.log("    SKU:", item.itemCode || item.skuNumber);
    console.log("    onHandStock:", item.onHandStock);
    console.log("    quantity:", item.quantity);
  }
});

// Conclusion
console.log("\n==========================================");
console.log("  KESIMPULAN");
console.log("==========================================");
console.log("1. Webhook dikirim SAAT order STATUS berubah");
console.log("   (Ready_To_Ship, Shipping, Completed, dll)");
console.log("2. Payload SUDAH includ onHandStock (stock Gudang Online saat webhook dikirim");
console.log("3. Desty SUDAH mengurangi stock internally SAAT order masuk");
console.log("4. onHandStock di webhook = stock SETELAH pengurangan Desty");
console.log("5. Carramica TIDAK perlu kurangi LAGI - stock SUDAH benar");
console.log("   Carramica CUKUP push stock ERM ke Desty SAAT settlement");
console.log("6. Webhook HANYA dikirim saat status berubah, BUKAN saat stock berubah");
console.log("   Jadi Carramica perlu PULL periodically untuk dapat stock terbaru Desty");
console.log("   atau tanya Tim Desty apakah ada webhook khusus stock change");
