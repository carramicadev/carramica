import { useEffect, useRef, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../FirebaseFrovider";

// What Biteship needs to price one sub-order, or null when it can't be priced
// yet. `key` holds only the inputs that change the shipping cost, so a new key
// means "this order's ongkir must be recalculated".
export const buildRateRequest = (order, destination, origin) => {
  if (order?.kurir !== "Biteship") return null;
  if (!destination?.lat || !destination?.lng) return null;
  if (!origin?.lat || !origin?.lng) return null;
  const products = order?.products || [];
  if (products.length === 0) return null;
  const ready = products.every((prod) => {
    const qty = Number(prod?.quantity);
    return (
      prod?.nama && prod?.quantity !== "" && Number.isInteger(qty) && qty > 0
    );
  });
  if (!ready) return null;

  const items = products.map((prod) => ({
    name: prod?.nama,
    sku: prod?.sku,
    weight: prod?.weight,
    height: prod?.height,
    width: prod?.width,
    length: prod?.length,
    quantity: Number(prod?.quantity),
  }));
  const payload = {
    items,
    origin_latitude: origin.lat,
    origin_longitude: origin.lng,
    destination_latitude: destination.lat,
    destination_longitude: destination.lng,
  };
  return { key: JSON.stringify(payload), payload };
};

export const RATE_DEBOUNCE_MS = 500;

// Biteship rates, per sub-order.
// Every sub-order is priced on its own: its own products, its own receiver map
// pin, and the (shared) warehouse origin. Rates are fetched again only for the
// order whose shipping input actually changed, so typing in another order (or
// changing a discount) never resets a chosen service, and one order's pin is
// never used to price another order.
export default function useBiteshipRates({
  orders,
  setOrders,
  setListService,
  origin,
  enqueueSnackbar,
}) {
  // receiver map point per order index: { [orderIndex]: { lat, lng } }
  const [receiverCoords, setReceiverCoords] = useState({});
  const [loadingRate, setLoadingRate] = useState({});
  const rateKeysRef = useRef({}); // last shipping input priced, per order index
  const rateTimersRef = useRef({}); // debounce timers, per order index

  const setReceiverCoordsFor = (orderIndex, coords) =>
    setReceiverCoords((prev) => ({ ...prev, [orderIndex]: coords }));

  // forget everything rate-related for one order index (order removed)
  const forgetRates = (orderIndex) => {
    clearTimeout(rateTimersRef.current[orderIndex]);
    delete rateTimersRef.current[orderIndex];
    delete rateKeysRef.current[orderIndex];
    const without = (prev) => {
      const next = { ...prev };
      delete next[orderIndex];
      return next;
    };
    setListService(without);
    setLoadingRate(without);
    setReceiverCoords(without);
  };

  useEffect(() => {
    const timers = rateTimersRef.current;
    return () => Object.values(timers).forEach(clearTimeout);
  }, []);

  useEffect(() => {
    orders.forEach((order, orderIndex) => {
      const request = buildRateRequest(
        order,
        receiverCoords?.[orderIndex],
        origin
      );
      // not ready (not Biteship, no pin, product not chosen, qty being typed…)
      // → keep whatever was priced last
      if (!request || request.key === rateKeysRef.current[orderIndex]) return;
      rateKeysRef.current[orderIndex] = request.key;

      // the shipping input of THIS order changed → its old service/ongkir are
      // no longer valid
      setOrders((prev) =>
        prev.map((o, i) =>
          i === orderIndex ? { ...o, kurirService: "", ongkir: "" } : o
        )
      );
      setListService((prev) => ({ ...prev, [orderIndex]: [] }));
      setLoadingRate((prev) => ({ ...prev, [orderIndex]: true }));

      // debounce: typing qty "12" should cost one request, not two
      clearTimeout(rateTimersRef.current[orderIndex]);
      rateTimersRef.current[orderIndex] = setTimeout(async () => {
        const isStale = () => rateKeysRef.current[orderIndex] !== request.key;
        try {
          const getRates = httpsCallable(functions, "getRates");
          const result = await getRates(request.payload);
          if (isStale()) return; // a newer request for this order is running
          setListService((prev) => ({
            ...prev,
            [orderIndex]: result.data?.items?.pricing || [],
          }));
        } catch (error) {
          if (isStale()) return;
          console.error("Error calling function:", error);
          enqueueSnackbar(
            `Order ${orderIndex + 1}: gagal mendapatkan ongkir, ${
              error.message
            }`,
            { variant: "error" }
          );
          setListService((prev) => ({ ...prev, [orderIndex]: [] }));
        }
        setLoadingRate((prev) => ({ ...prev, [orderIndex]: false }));
      }, RATE_DEBOUNCE_MS);
    });
    // setOrders / setListService / enqueueSnackbar are stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders, receiverCoords, origin?.lat, origin?.lng]);

  return { receiverCoords, setReceiverCoordsFor, loadingRate, forgetRates };
}
