// Shared order money calculations.
//
// Rules (must match how each product's `amount` is computed in AddOrder /
// DialogEditOrder):
// - "%" discount applies to the whole line: price × quantity × discount%.
// - "Rp" discount (or any non-"%" type) is subtracted once per line, not per unit.
// Line discounts are rounded to whole rupiah so the stored total, the invoice and
// the Midtrans item_details (integers only) always add up to the same number.

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

// An empty quantity is treated as 1 (same as the original AddOrder behaviour).
export const lineQuantity = (prod) =>
  prod?.quantity === "" || prod?.quantity === undefined || prod?.quantity === null
    ? 1
    : toNumber(prod?.quantity);

// Price × quantity, before any discount.
export const lineGross = (prod) => toNumber(prod?.price) * lineQuantity(prod);

// Discount in rupiah for one product line.
export const lineDiscount = (prod) => {
  const discount = toNumber(prod?.discount);
  if (discount <= 0) return 0;
  if (prod?.discount_type === "%") {
    return Math.round((discount / 100) * lineGross(prod));
  }
  return Math.round(discount);
};

// Amount for one product line after its discount, in whole rupiah.
// Using the same rounded discount as the totals keeps Σ amount === total.
export const lineAmount = (prod) => lineGross(prod) - lineDiscount(prod);

// Totals for a whole order document (`orders` = array of sub-orders with products).
export const calcOrderTotals = (orders = [], additionalDiscount = 0) => {
  const products = (orders || []).flatMap((ord) => ord?.products || []);

  const subTotal = products.reduce((sum, prod) => sum + lineGross(prod), 0);
  const productDiscount = products.reduce(
    (sum, prod) => sum + lineDiscount(prod),
    0
  );
  // Math.trunc mirrors the parseInt() used when building Midtrans item_details,
  // so gross_amount always equals the sum of the items.
  const totalOngkir = (orders || []).reduce((sum, ord) => {
    const ongkir = toNumber(ord?.ongkir);
    return sum + (ongkir > 0 ? Math.trunc(ongkir) : 0);
  }, 0);
  const addDisc = Math.trunc(toNumber(additionalDiscount));

  return {
    subTotal, // Σ price × qty
    productDiscount, // Σ line discounts
    additionalDiscount: addDisc,
    totalDiscount: productDiscount + addDisc,
    totalOngkir,
    total: subTotal - productDiscount - addDisc + totalOngkir,
  };
};
