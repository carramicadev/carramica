import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  increment,
  onSnapshot,
  runTransaction,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import Header from "../../components/Header";
import AddSalesModal from "../../AddSalesModal";
import { Typeahead } from "react-bootstrap-typeahead";
import { httpsCallable } from "firebase/functions";

import "bootstrap/dist/css/bootstrap.min.css";
import "react-phone-input-2/lib/style.css";
import "react-bootstrap-typeahead/css/Typeahead.css";
// import 'react-bootstrap-typeahead/css/Typeahead.css';
import dataServiceLalamove from "../../kecamatan.json";
import Autocomplete from "react-autocomplete";
import { firestore, functions } from "../../FirebaseFrovider";
// import { SAPProduct } from '../../ShippingProduct';
import SaveInvoiceModal from "./SaveInvoiceModal";
import RedirectToWa from "./DialogRedirectToWA";
import { currency } from "../../formatter";
import MapComponent from "../../components/MapComponent";
import {
  useFirestoreDocument,
  useFirestoreDocumentData,
  useFirestoreQueryData,
} from "@react-query-firebase/firestore";
import { useAuth } from "../../AuthContext";
import { Form } from "react-bootstrap";
import { useSnackbar } from "notistack";
import PhoneInput from "react-phone-input-2";
import { useNavigate } from "react-router-dom";

function findUndefinedOrEmptyFields(obj, path = "") {
  let result = [];

  // Iterate through each key in the object
  for (const key in obj) {
    const value = obj[key];
    const currentPath = path ? `${path}.${key}` : key; // Track path for nested keys

    if (value === undefined) {
      result.push(currentPath); // Add to result if undefined or empty
    } else if (typeof value === "object" && value !== null) {
      // Recurse if the value is a nested object or array
      result = result.concat(findUndefinedOrEmptyFields(value, currentPath));
    }
  }

  return result;
}
const AddOrder = () => {
  const { currentUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  // dedicated courier
  const dedicatedCourier = [
    "Lalamove",
    "Paxel Regular",
    "Paxel Big",
    "SAP Regular",
    "SAP Cargo",
  ];
  // get settings doc
  // const settingsRef = collection(firestore, "settings");
  const settingsRef = doc(firestore, "settings", "counter");

  const [settings, setSettings] = useState({});
  const [update, setUpdate] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(settingsRef, (doc) => {
      const source = doc.metadata.hasPendingWrites ? "Local" : "Server";
      // console.log(source, " data: ", doc.data());
      setSettings({
        ...doc.data(),
      });
    });
    return () => unsub;
  }, []);
  // inv id ord id
  const invId = String(settings?.invoiceId).padStart(4, "0");
  const ordId = String(settings?.orderId).padStart(4, "0");
  const now = new Date();
  const hour = now.getHours();
  // Add 1 day
  const tomorrow = new Date(now);

  // Get the day of the month
  const tomorrowDay = tomorrow.getDate();

  const bulan = new Date(now).getMonth() + 1;
  const tahun = new Date(now).getFullYear();
  // console.log(hour);
  const shippingDate = `${tahun.toString()}-${bulan
    .toString()
    .padStart(2, "0")}-${tomorrowDay.toString().padStart(2, "0")}`;
  const shippingDateTimestamp = Timestamp.fromDate(new Date(shippingDate));
  const bulanFixed = bulan.toString().padStart(2, "0");
  const [formData, setFormData] = useState({
    email: "",
    warehouse: "",
    senderName: "",
    senderPhone: "62",
    additionalDiscount: 0,
    deliveryFee: "",
    day: tomorrowDay,
    month: bulan,
    year: tahun.toString(),
    shippingDate: shippingDateTimestamp,
    notes: "",
  });
  // console.log(orders)

  useEffect(() => {
    setTimeout(() => {
      if (hour > 14) {
        const nowN = new Date();
        const tomorrowUpdate = new Date(nowN);
        tomorrowUpdate.setDate(now.getDate() + 1);
        const tomorrowDayUpdate = tomorrowUpdate?.getDate();
        const bulanNew = new Date(nowN).getMonth() + 1;
        const shippingDateUpdate = `${tahun.toString()}-${bulan
          .toString()
          .padStart(2, "0")}-${tomorrowDayUpdate?.toString().padStart(2, "0")}`;
        const shippingDateTimestampUpdate = Timestamp.fromDate(
          new Date(shippingDateUpdate)
        );
        // console.log('newdate', tomorrowDayUpdate)
        setFormData((prev) => ({
          ...prev,
          day: tomorrowDayUpdate,
          // month: bulanNew.toString().padStart(2, '0'),
          shippingDate: shippingDateTimestampUpdate,
        }));
      }
    }, 500);
  }, [hour]);
  const [formError, setFormError] = useState({
    email: "",
    warehouse: "",
    senderName: "",
    senderPhone: "",
    additionalDiscount: "",
    deliveryFee: "",
  });

  const initialOrder = {
    receiverName: "",
    receiverPhone: "62",
    address: "",
    kecamatan: "",
    kurir: "",
    ongkir: 0,
    giftCard: "",
    kurirProduk: "",
    products: [
      {
        nama: "",
        quantity: 1,
        price: "",
        discount: "",
        amount: "",
        discount_type: "Rp",
      },
    ],
  };

  useEffect(() => {
    if (invId && ordId) {
      setOrders([
        {
          ...initialOrder,
          ordId: `OS-${invId}-${ordId}`,
        },
      ]);
    }
  }, []);

  const initialOrderErr = {
    receiverName: "",
    receiverPhone: "",
    address: "",
    kecamatan: "",
    kurir: "",
    ongkir: "",
    giftCard: "",
    kurirProduk: "",
    products: [{ nama: "", quantity: "", price: "", discount: "", amount: "" }],
  };

  const [orders, setOrders] = useState([initialOrder]);
  const [ordersErr, setOrdersErr] = useState([initialOrderErr]);

  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [kurirServic, setKurirService] = useState("");
  const [listService, setListService] = useState({});
  const [selectedService, setSelectedService] = useState("");
  const [ongkirError, setOngkirError] = useState({});
  const [linkMidtrans, setLinkMidtrans] = useState("");
  const [kurirAktif, setKurirAktif] = useState("");
  const [addressAktif, setAdressAktif] = useState("");
  const [indexOrder, setIndexOrder] = useState(0);
  // getKec
  const [selected, setSelected] = useState({});
  const [options, setOptions] = useState([]);
  const [value, setValue] = useState("");
  // const [allProduct, setProduct] = useState([]);
  const [modalShow, setModalShow] = useState(false);
  const [dialoglRedirectWAShow, setDialogRedirectWAShow] = useState({
    open: false,
    id: "",
  });
  const [koordinateReceiver, setKoordinateReceiver] = useState({
    lat: "",
    lng: "",
  });
  const [koordinateOrigin, setKoordinateOrigin] = useState({
    lat: "",
    lng: "",
  });
  // select kurir
  const [ListKurir, setListKurir] = useState(["Biteship", "Dedicated"]);

  // validate
  const validate = () => {
    const newError = { ...formError };
    // console.log('er')

    if (!formData.senderName) {
      // console.log('er')
      newError.senderName = "Sender name is required";
    }

    if (formData.senderPhone.length <= 2) {
      newError.senderPhone = "Sender phone is required";
    }

    return newError;
  };

  // validateOrder
  const validateOrd = () => {
    // console.log(indexOrder)
    const newErrors = [...ordersErr];
    const currentOrder = orders[indexOrder]; // Get the specific order to validate

    // Validate receiverName
    if (!currentOrder?.receiverName) {
      newErrors[indexOrder].receiverName = "Receiver name is required";
    }

    // Validate receiverPhone
    if (
      !currentOrder?.receiverPhone ||
      currentOrder?.receiverPhone.length <= 2
    ) {
      newErrors[indexOrder].receiverPhone = "Receiver phone number is required";
    }

    // Validate address
    if (!currentOrder?.address) {
      newErrors[indexOrder].address = "Address is required";
    }

    if (!currentOrder?.kurir) {
      newErrors[indexOrder].kurir = "kurir is required";
    }
    if (!currentOrder?.ongkir) {
      newErrors[indexOrder].ongkir = "ongkir is required";
    }
    // console.log(indexOrder)

    newErrors[indexOrder].products = currentOrder?.products?.map?.(
      (product, j) => {
        const productErrors = { ...newErrors[indexOrder].products[j] };

        if (!product?.nama) {
          productErrors.nama = "Product name is required";
        }

        if (!product?.quantity || product?.quantity <= 0) {
          productErrors.quantity =
            "Quantity is required and must be greater than 0";
        }

        return productErrors;
      }
    );

    return newErrors;
  };

  console.log(koordinateOrigin);
  // query coll product
  const ref = query(
    collection(firestore, "product"),
    where("stok", ">", 0)
    // limit(10),
  );

  // Provide the query to the hook
  const {
    data: allProduct,
    isLoading: loadingProd,
    error: err,
  } = useFirestoreQueryData(["product"], ref, {
    subscribe: true,
    idField: "id",
  });

  useEffect(() => {
    const fetchSales = async () => {
      const salesSnapshot = await getDocs(collection(firestore, "warehouse"));
      const salesList = salesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setWarehouseOptions(salesList);
      const idWH =
        process.env.REACT_APP_ENVIRONMENT === "production"
          ? "wThhs7RSqV3JOBClZFzs"
          : "SSUWQwC374ZY3pg4gPEt";
      const findDefaultWH = salesList.find((sal) => sal?.id === idWH);
      console.log(findDefaultWH?.id);
      if (findDefaultWH?.id) {
        setFormData({
          ...formData,
          warehouse: findDefaultWH?.id,
        });
        setKoordinateOrigin({
          lat: findDefaultWH?.coordinates?.lat,
          lng: findDefaultWH?.coordinates?.lng,
        });
      }
    };

    fetchSales();
  }, []);

  const handleChange = async (e, orderIndex, productIndex, prod) => {
    setIndexOrder(orderIndex);
    // console.log(typeof e === 'object', !Array.isArray(e))

    const { name, value } =
      !Array.isArray(e) && typeof e === "object" && e.target;

    // let selectedObj = {}
    if (name === "kurirProduk") {
      setKurirService(value);
    }
    // else if (name === 'kurirService') {
    //   selectedObj = listService?.find?.(option => option?.courier_service_code === value);

    // }
    else if (name === "kurir" && value === "LALAMOVE") {
      setKurirAktif(value);
      const serviceLalamove = dataServiceLalamove?.services.map((ser) => {
        return ser?.key;
      });
      // setListService(serviceLalamove)
    } else if (name === "address") {
      setAdressAktif(value);
    } else if (name === "kurir") {
      setKurirAktif(value);
    }
    if (productIndex !== undefined) {
      const updatedOrders = orders.map((order, i) =>
        i === orderIndex
          ? {
              ...order,
              products: order.products.map((product, j) => {
                const hargaProd = product?.price;
                let hargaAmountAfterDiscon =
                  parseInt(product?.price) * parseInt(product?.quantity);
                if (
                  typeof e === "object" &&
                  name === "discount_type" &&
                  value === "%" &&
                  product?.discount
                ) {
                  // console.log('%')
                  hargaAmountAfterDiscon =
                    (1 -
                      parseInt(product?.discount ? product?.discount : 0) /
                        100) *
                    hargaAmountAfterDiscon;
                } else if (
                  typeof e === "object" &&
                  name === "discount_type" &&
                  value === "Rp" &&
                  product?.discount
                ) {
                  // console.log('Rp')
                  hargaAmountAfterDiscon =
                    hargaAmountAfterDiscon -
                    parseInt(product?.discount ? product?.discount : 0);
                } else if (
                  typeof e === "object" &&
                  name === "discount" &&
                  product?.discount_type === "%"
                ) {
                  hargaAmountAfterDiscon =
                    (1 - parseInt(value ? value : 0) / 100) *
                    hargaAmountAfterDiscon;
                } else if (
                  typeof e === "object" &&
                  name === "discount" &&
                  product?.discount_type === "Rp"
                ) {
                  // console.log('Rp')
                  hargaAmountAfterDiscon =
                    hargaAmountAfterDiscon - parseInt(value ? value : 0);
                }
                // console.log(hargaAmountAfterDiscon)
                return j === productIndex
                  ? Array.isArray(e)
                    ? {
                        ...product,
                        prod: e,
                        nama: e?.[0]?.nama,
                        price: e?.[0]?.harga,
                        weight: e?.[0]?.weight,
                        height: e?.[0]?.height,
                        width: e?.[0]?.width,
                        length: e?.[0]?.length,
                        amount: e?.[0]?.harga,
                        sku: e?.[0]?.sku,
                        id: e?.[0]?.id,
                        stock: e?.[0]?.stok,
                      }
                    : name === "quantity"
                    ? {
                        ...product,
                        [name]: parseInt(value),
                        amount:
                          product?.discount_type === "%"
                            ? (1 - product?.discount / 100) *
                              (hargaProd * parseInt(value))
                            : hargaProd * parseInt(value) -
                              parseInt(
                                product?.discount ? product.discount : 0
                              ),
                      }
                    : name === "discount_type"
                    ? {
                        ...product,
                        [name]: value,
                        amount: hargaAmountAfterDiscon,
                      }
                    : {
                        ...product,
                        [name]: parseInt(value),
                        amount: hargaAmountAfterDiscon,
                      }
                  : product;
              }),
            }
          : order
      );
      // err
      const updatedOrdersErr = ordersErr.map((err, i) =>
        i === orderIndex
          ? {
              ...err,
              products: err.products.map((productErr, j) => {
                return j === productIndex
                  ? { ...productErr, [name]: "" }
                  : productErr;
              }),
            }
          : err
      );
      setOrders(updatedOrders);
      setOrdersErr(updatedOrdersErr);
    } else {
      // console.log(e, typeof e !== 'object')

      const selectedObj = listService?.[orderIndex]?.find?.(
        (option) => option?.courier_service_code === value
      );

      const updatedOrders = orders.map((order, i) =>
        i === orderIndex
          ? typeof e !== "object"
            ? { ...order, receiverPhone: e }
            : name === "kurir"
            ? { ...order, [name]: value, ongkir: "" }
            : name === "kurirService"
            ? {
                ...order,
                [name]: selectedObj ?? value,
                ongkir: selectedObj?.price,
              }
            : { ...order, ordId: `OS-${invId}-${ordId}`, [name]: value }
          : order
      );
      const updatedOrdersErr = ordersErr.map((err, i) =>
        i === orderIndex
          ? typeof e !== "object"
            ? { ...err, receiverPhone: "" }
            : name === "kurirService"
            ? { ...err, [name]: "", ongkir: "" }
            : { ...err, [name]: "" }
          : err
      );
      setOrders(updatedOrders);
      setOrdersErr(updatedOrdersErr);
    }
  };

  const handleFormChange = (e) => {
    if (typeof e !== "object") {
      setFormData({
        ...formData,
        senderPhone: e,
      });
      setFormError({
        ...formError,
        senderPhone: "",
      });
    } else {
      const { name, value } = e?.target;
      if (e.target.type === "number") {
        setFormData({ ...formData, [name]: parseInt(value) });
      } else if (name === "warehouse") {
        setFormData({ ...formData, [name]: value });
        const findWH = warehouseOptions?.find((wh) => wh?.name === value);
        setKoordinateOrigin({
          lat: findWH?.coordinates?.lat,
          lng: findWH?.coordinates?.lng,
        });
      } else {
        setFormData({ ...formData, [name]: value });
      }
      setFormError({
        ...formError,
        [name]: "",
      });
    }
  };

  const handleSaveInvoice = async () => {
    try {
      const docRef = await addDoc(collection(db, "orders"), {
        ...formData,
        orders,
      });
      // console.log("Document written with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  const addProductField = (orderIndex) => {
    const updatedOrders = orders.map((order, i) =>
      i === orderIndex
        ? {
            ...order,
            products: [
              ...order.products,
              {
                nama: "",
                quantity: "",
                price: "",
                discount: "",
                amount: "",
                discount_type: "Rp",
              },
            ],
          }
        : order
    );
    setOrders(updatedOrders);
  };

  const deleteLastProductField = (orderIndex) => {
    const updatedOrders = orders.map((order, i) =>
      i === orderIndex
        ? {
            ...order,
            products: order.products.slice(0, -1),
          }
        : order
    );
    setOrders(updatedOrders);
  };

  const addOrderField = async (e) => {
    e.preventDefault();
    const findErros = validate();
    const findErrorsOrd = validateOrd();

    if (
      Object.values(findErros).some(
        (err) =>
          (typeof err === "string" && err !== "") ||
          (typeof err === "object" &&
            Object.values(err).some((subErr) => subErr !== ""))
      )
    ) {
      alert("harap isi dulu field yang belum diisi!");
      // console.log('Errors found:', findErros);
      setFormError(findErros);
    } else if (
      findErrorsOrd.some((order) =>
        Object.values(order).some(
          (err) =>
            (typeof err === "string" && err !== "") ||
            (Array.isArray(err) &&
              err.some((prodErr) =>
                Object.values(prodErr).some(
                  (prodErrField) => prodErrField !== ""
                )
              ))
        )
      )
    ) {
      // console.log('Errors found:', findErrorsOrd);
      alert("harap isi dulu field yang belum diisi!");

      setOrdersErr(findErrorsOrd);
    } else {
      try {
        setOrders([...orders, initialOrder]);
        setIndexOrder(indexOrder + 1);
        // await setDoc(settingsRef, {
        //   // invoiceId: increment(1),
        //   orderId: increment(1)
        // }, { merge: true })
        setUpdate((prevValue) => !prevValue);
        setOrdersErr((err) => [...err, initialOrderErr]);
      } catch (e) {
        console.log(e.message);
      }
    }
  };

  const duplicateOrderField = async (e) => {
    // setIndexOrder(indexOrder + 1)
    e.preventDefault();

    const findErros = validate();
    const findErrorsOrd = validateOrd();

    if (
      Object.values(findErros).some(
        (err) =>
          (typeof err === "string" && err !== "") ||
          (typeof err === "object" &&
            Object.values(err).some((subErr) => subErr !== ""))
      )
    ) {
      alert("harap isi dulu field yang belum diisi!");
      setFormError(findErros);
    } else if (
      findErrorsOrd.some((order) =>
        Object.values(order).some(
          (err) =>
            (typeof err === "string" && err !== "") ||
            (Array.isArray(err) &&
              err.some((prodErr) =>
                Object.values(prodErr).some(
                  (prodErrField) => prodErrField !== ""
                )
              ))
        )
      )
    ) {
      // console.log('Errors found:', findErrorsOrd);
      alert("harap isi dulu field yang belum diisi!");
      setOrdersErr(findErrorsOrd);
    } else {
      const lastOrder = orders[orders.length - 1];
      const duplicatedOrder = {
        ...lastOrder,
        receiverName: "",
        receiverPhone: "62",
        address: "",
        kecamatan: "",
        // kurir: '',
        // giftCard: '',
        kurirProduk: "",
        // products: [{ nama: '', quantity: '', price: '', discount: '', amount: '' }]
      };
      setOrders([...orders, duplicatedOrder]);
      setFormData({
        ...formData,
      });
      const lastService = listService?.[orders.length - 1];
      setListService({
        ...listService,
        [orders.length]: lastService,
      });

      setIndexOrder(indexOrder + 1);

      // await setDoc(settingsRef, {
      //   // invoiceId: increment(1),
      //   orderId: increment(1)
      // }, { merge: true });
      setUpdate((prevValue) => !prevValue);
      setOrdersErr((err) => [...err, initialOrderErr]);
    }
  };

  const deleteLastOrderField = () => {
    setOrders(orders.slice(0, -1));
    setOrdersErr(ordersErr.slice(0, -1));
    setIndexOrder(indexOrder - 1);
    // setOrdersErr(err => [...err, initialOrderErr])
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };
  const suggestions = [
    "Apple",
    "Banana",
    "Cherry",
    "Date",
    "Elderberry",
    "Fig",
    "Grape",
    "Honeydew",
  ];

  //format phone number
  const handleKeyDown = (e) => {
    if (
      formData.senderPhone.length <= 2 &&
      (e.key === "Backspace" || e.key === "Delete")
    ) {
      e.preventDefault();
    }
  };

  // total harga
  const totalHarga = orders?.map((ord) => {
    return ord?.products?.map((prod) => {
      if (prod.quantity !== "") {
        return prod.price * prod.quantity;
      } else {
        return prod.price;
      }
    });
  });
  const hargaTotal = totalHarga?.map((tot) => {
    return tot.reduce((val, nilaiSekarang) => {
      return val + nilaiSekarang;
    }, 0);
  });
  const totalAfterReduce = hargaTotal.reduce((val, nilaiSekarang) => {
    return val + nilaiSekarang;
  }, 0);
  const totalAmount = orders?.map((ord) => {
    return ord?.products?.map((prod) => {
      return prod?.amount;
    });
  });

  const hargaTotalAmount = totalAmount?.map((tot) => {
    return tot.reduce((val, nilaiSekarang) => {
      return val + nilaiSekarang;
    }, 0);
  });
  const totalAmountAfterReduce = hargaTotalAmount.reduce(
    (val, nilaiSekarang) => {
      return val + nilaiSekarang;
    },
    0
  );
  // console.log(totalAmountAfterReduce)

  // diskon
  const diskon = orders?.map((ord) => {
    return ord?.products?.map((prod) => {
      return prod?.discount > 0
        ? prod?.discount_type === "%"
          ? (parseInt(prod?.discount) / 100) * prod?.price
          : parseInt(prod?.discount)
        : 0;
    });
  });

  const diskonTotal = diskon?.map((tot) => {
    return tot.reduce((val, nilaiSekarang) => {
      return val + nilaiSekarang;
    }, 0);
  });

  const diskonAfterReduce = diskonTotal?.reduce((val, nilaiSekarang) => {
    return val + nilaiSekarang;
  }, 0);

  const ongkir = orders.map((ord) =>
    ord.ongkir > 0 ? parseInt(ord.ongkir) : 0
  );
  const totalOngkir = ongkir?.reduce((val, nilaiSekarang) => {
    return val + nilaiSekarang;
  }, 0);
  // total after ongkir & diskon
  const disc = diskonAfterReduce ? diskonAfterReduce : 0;
  const addDisc = formData?.additionalDiscount
    ? formData.additionalDiscount
    : 0;
  const totalAfterDiskonDanOngkir =
    parseInt(totalAfterReduce) -
    parseInt(disc) -
    parseInt(addDisc) +
    parseInt(totalOngkir);
  // console.log(totalOngkir, diskonAfterReduce, totalAfterReduce, totalAfterDiskonDanOngkir)

  // orderLalamove
  const handleOrderLalamove = async () => {
    const order = httpsCallable(functions, "createOrderLalamove");
    try {
      const result = await order({
        quotationId: ongkir?.quotationId,
        sender: {
          stopId: ongkir?.stops[0]?.stopId,
          name: formData?.senderName,
          phone: `+${formData?.senderPhone}`,
        },
        recipients: [
          {
            stopId: ongkir?.stops[1]?.stopId,
            name: orders[0]?.receiverName,
            phone: `+${orders[0]?.receiverPhone}`,
          },
        ],
      });
      // console.log(result.data?.items)
      // setOngkir(result.data?.items?.data);
    } catch (error) {
      console.error("Error calling function:", error);
      // setListService([]);
    }
  };

  // payment midtrans
  let product = [];
  const productMap = orders.map((ord) =>
    ord.products.map((prod) => {
      product.push({
        name: prod.nama,
        id: prod?.sku,
        price: prod.price,
        quantity: prod.quantity,
      });
      if (prod.discount > 0 && prod?.discount_type == "%") {
        product.push({
          name: `discount-${prod.nama}`,
          id: prod?.sku,
          price: -((prod.discount / 100) * prod.price),
          quantity: 1,
        });
      } else if (prod.discount > 0 && prod?.discount_type == "Rp") {
        product.push({
          name: `discount-${prod.nama}`,
          id: prod?.sku,
          price: -prod.discount,
          quantity: 1,
        });
      }
    })
  );
  // console.log(product);

  const handleShowSaveInvoice = (e) => {
    e.preventDefault();
    const findErros = validate();
    const findErrorsOrd = validateOrd();

    if (
      Object.values(findErros).some(
        (err) =>
          (typeof err === "string" && err !== "") ||
          (typeof err === "object" &&
            Object.values(err).some((subErr) => subErr !== ""))
      )
    ) {
      // console.log('Errors found:', findErros);
      // enqueueSnackbar(`harap isi dulu field yang belum diisi `, { variant: 'error' })
      alert("harap isi dulu field yang belum diisi!");

      setFormError(findErros);
    } else if (
      findErrorsOrd.some((order) =>
        Object.values(order).some(
          (err) =>
            (typeof err === "string" && err !== "") ||
            (Array.isArray(err) &&
              err.some((prodErr) =>
                Object.values(prodErr).some(
                  (prodErrField) => prodErrField !== ""
                )
              ))
        )
      )
    ) {
      // console.log('Errors found:', findErrorsOrd);
      // enqueueSnackbar(`harap isi dulu field yang belum diisi `, { variant: 'error' })
      alert("harap isi dulu field yang belum diisi!");

      setOrdersErr(findErrorsOrd);
    } else {
      setModalShow(true);
    }
  };

  const undefinedOrEmptyFields = orders?.flatMap((item) =>
    findUndefinedOrEmptyFields(item)
  );
  // console.log(formData)
  const [loading, setLoading] = useState(false);
  const handlePayment = async (e) => {
    e.preventDefault();
    let orderRef;
    try {
      // console.log('run')
      setLoading(true);

      // inv id and order id
      if (formData?.additionalDiscount) {
        product.push({
          name: `addional discount`,
          id: "additional-discount",
          price: -parseInt(formData?.additionalDiscount),
          quantity: 1,
        });
      }

      // console.log(invId, ordId, totalOngkir, updateOrder)
      // orderLalamove
      // handleOrderLalamove();
      if (totalOngkir > 0) {
        product.push({
          name: "ongkir",
          id: "ongkir",
          price: totalOngkir,
          quantity: 1,
        });
      }
      let customer_details = {
        first_name: formData.senderName,
        last_name: "",
        email: formData.email || "",
        phone: formData.senderPhone,
      };
      if (!formData.email) {
        customer_details = {
          first_name: formData.senderName,
          last_name: "",
          // email: formData.email || '',
          phone: formData.senderPhone,
        };
      }

      // checking order id
      const docRef = doc(firestore, "settings", "counter");

      const newOrderId = await runTransaction(
        firestore,
        async (transaction) => {
          const counterDoc = await transaction.get(docRef);

          if (!counterDoc.exists()) {
            throw new Error("Counter document does not exist!");
          }

          // Get the current order count and increment by 1
          const currentCount = counterDoc.data().invoiceId || 0;
          const newCount = currentCount + 1;
          const newInvId = String(newCount).padStart(4, "0");
          const currentYear = new Date().getFullYear();

          // Update the counter in Firestore
          transaction.update(docRef, { invoiceId: newCount });

          // Return the new order ID
          return `INV-${currentYear}-${newInvId}`; // Format the order ID as needed, e.g., "ORD_1", "ORD_2", etc.
        }
      );

      if (newOrderId) {
        const arrayOngkir = Object.values(ongkir);
        const updateOrder = [];
        let currentOrderId;

        for (let index = 0; index < orders.length; index++) {
          try {
            const order = orders[index];

            // Get the current order ID (sequentially)
            const counterDoc = await getDoc(docRef);

            if (!counterDoc.exists()) {
              throw new Error("Counter document does not exist!");
            }

            currentOrderId = counterDoc.data().orderId || 0;
            const orderIdUpdate = currentOrderId + 1;

            // Update Firestore with the incremented count
            await setDoc(docRef, { orderId: orderIdUpdate }, { merge: true });

            // Format the order ID with leading zeros
            const formattedOrderId = String(orderIdUpdate).padStart(4, "0");

            // Construct the new order ID
            const invoiceNumberPart = newOrderId?.split?.("-")?.[2] || "0";
            const newOrdId = `OS-${invoiceNumberPart}-${formattedOrderId}`;

            // // update shipping date
            // const shippingDateUpdate = `${order?.year}-${order?.month}-${order?.day}`
            // const shippingDateTimestampUpdate = Timestamp.fromDate(new Date(shippingDateUpdate));
            // Add the updated order to the array
            updateOrder.push({
              ...order,
              shippingCost: arrayOngkir?.[index] ?? 0,
              orderId: newOrdId ?? "error",
              // shippingDate: shippingDateTimestampUpdate ?? ''
            });
          } catch (error) {
            console.error(`Error updating order at index ${index}:`, error);
            updateOrder.push({
              ...orders[index],
              shippingCost: arrayOngkir?.[index] ?? 0,
            });
          }
        }

        const undefinedOrEmptyFields = updateOrder?.flatMap((item) =>
          findUndefinedOrEmptyFields(item)
        );

        if (undefinedOrEmptyFields.length < 1) {
          orderRef = doc(firestore, "orders", newOrderId);
          // update shipping date
          const shippingDate = `${formData?.year.toString()}-${formData?.month
            .toString()
            .padStart(2, "0")}-${formData?.day.toString().padStart(2, "0")}`;
          const shippingDateTimestamp = Timestamp.fromDate(
            new Date(shippingDate)
          );

          // const orderDoc = await getDoc(orderRef);
          await setDoc(
            orderRef,
            {
              ...formData,
              orders: updateOrder ?? [],
              totalOngkir: totalOngkir ?? 0,
              createdAt: serverTimestamp(),
              paymentStatus: "pending",
              orderStatus: "pending",
              totalHargaProduk: totalAfterReduce ?? 0,
              userId: currentUser?.uid ?? "",
              invoice_id: newOrderId ?? "",
              shippingDate: shippingDateTimestamp,
              totalAfterDiskonDanOngkir: totalAfterDiskonDanOngkir ?? 0,
            },
            { merge: true }
          );

          const payment = httpsCallable(functions, "createOrder");
          const result = await payment({
            amount: totalAfterDiskonDanOngkir,
            id: newOrderId,
            item: product,
            customer_details: customer_details,
          });

          // console.log(result.data.items)
          setLinkMidtrans(result.data.items?.redirect_url);
          // setDialogRedirectWAShow({ open: true, id: newOrderId });
          const getToken = httpsCallable(functions, "qontakSendWAToSender");
          await getToken({
            name: formData?.senderName,
            no: formData?.senderPhone,
            price: totalAfterDiskonDanOngkir?.toString(),
            link: result.data.items?.redirect_url,
            type: "pembayaran",
          });

          await setDoc(
            orderRef,
            {
              midtrans: result?.data?.items ?? {},
              isInvWASent: true,
            },
            { merge: true }
          );

          // backup
          await setDoc(
            doc(firestore, "orders-backup", newOrderId),
            {
              ...formData,
              orders: updateOrder ?? [],
              totalOngkir: totalOngkir ?? 0,
              createdAt: serverTimestamp(),
              paymentStatus: "pending",
              orderStatus: "pending",
              totalHargaProduk: totalAfterReduce ?? 0,
              userId: currentUser?.uid ?? "",
              invoice_id: newOrderId ?? "",
              shippingDate: shippingDateTimestamp,
              totalAfterDiskonDanOngkir: totalAfterDiskonDanOngkir ?? 0,
              midtrans: result?.data?.items ?? {},
              isInvWASent: true,
            },
            { merge: true }
          );
          const contactRef = await setDoc(
            doc(firestore, "contact", formData?.senderPhone),
            {
              createdAt: serverTimestamp(),
              nama: formData.senderName,
              phone: formData.senderPhone,
              email: formData?.email || "",
              type: "sender",
            }
          );

          await Promise.all(
            orders?.map?.(async (data) => {
              await setDoc(doc(firestore, "contact", data?.receiverPhone), {
                createdAt: serverTimestamp(),
                nama: data.receiverName,
                phone: data.receiverPhone,
                email: "",
                type: "receiver",
              });
            })
          );
        } else {
          enqueueSnackbar(
            `order gagal dibuat, ada field yg undefined, ${undefinedOrEmptyFields}`,
            { variant: "error" }
          );
        }
      }

      navigate("/orders");

      setLoading(false);
      setModalShow(false);
      enqueueSnackbar(`order berhasil dibuat`, { variant: "success" });
    } catch (e) {
      if (orderRef) {
        try {
          await deleteDoc(orderRef);
          console.log(
            "Document deleted from Firestore due to Qontak API error"
          );
        } catch (deleteError) {
          console.error("Error deleting document:", deleteError);
        }
      }
      enqueueSnackbar(`order gagal dibuat, ${e.message}`, { variant: "error" });

      console.log("error", e);
      setLoading(false);
      window.location.reload();
    }
  };

  // call getDistrict
  useEffect(() => {
    if (value !== "") {
      const timer = setTimeout(() => {
        async function getKec() {
          const helloWorld = httpsCallable(functions, "getDistrict");
          try {
            const result = await helloWorld({ value: value });
            // console.log(result.data?.items?.areas)
            setOptions(result.data?.items?.areas);
          } catch (error) {
            console.error("Error calling function:", error);
            setOptions([]);
          }
        }
        getKec();
      }, 2000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [value]);

  // call getRate
  const [loadingRate, setLoadingRate] = useState(false);
  useEffect(() => {
    // console.log('run')

    if (
      selected &&
      orders?.[indexOrder]?.products?.length > 0 &&
      koordinateReceiver?.lat &&
      koordinateReceiver.lng &&
      koordinateOrigin?.lat &&
      koordinateOrigin.lng
    ) {
      const ordersProduct = orders?.[indexOrder].products?.map((prod) => {
        return {
          name: prod?.nama,
          sku: prod?.sku,
          weight: prod?.weight,
          height: prod?.height,
          width: prod?.width,
          length: prod?.length,
          quantity: prod?.quantity,
        };
      });
      // console.log(ordersProduct)
      // console.log('run')
      async function getService() {
        const helloWorld = httpsCallable(functions, "getRates");
        try {
          const updatedOrdersOng = orders.map((order, i) =>
            i === indexOrder
              ? {
                  ...order,
                  ongkir: "",
                  kurirService: "",
                }
              : order
          );
          setOrders(updatedOrdersOng);
          setListService({ ...listService, [indexOrder]: [] });
          setLoadingRate(true);
          const result = await helloWorld({
            items: ordersProduct,
            origin_latitude: koordinateOrigin?.lat,
            origin_longitude: koordinateOrigin?.lng,
            destination_latitude: koordinateReceiver?.lat,
            destination_longitude: koordinateReceiver?.lng,
          });
          // console.log(result.data?.items)
          setListService({
            ...listService,
            [indexOrder]: result.data?.items?.pricing,
          });
          setLoadingRate(false);
        } catch (error) {
          setLoadingRate(false);
          enqueueSnackbar(`gagal mendapatkan ongkir, ${error.message}`, {
            variant: "error",
          });
          console.error("Error calling function:", error);
          setListService({ ...listService, [indexOrder]: [] });
        }
      }
      getService();
    }
  }, [
    selected,
    orders?.[indexOrder]?.products,
    koordinateReceiver?.lat,
    koordinateReceiver?.lng,
    koordinateOrigin?.lat,
    koordinateOrigin?.lng,
  ]);

  const [typeahead, setTypehed] = useState([]);

  // check no hp
  const handleCheckPhone = async (phone) => {
    try {
      // console.log(phone)
      const docRef = doc(firestore, "contact", phone);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        if (
          window.confirm(
            "Nomor ini sudah ada didalam contact, apakah anda ingin menggunakan data yang sudah ada?"
          )
        ) {
          // Save it!
          setFormData({
            ...formData,
            email: docSnap.data()?.email ?? "",
            senderName: docSnap.data()?.nama ?? "",
            senderPhone: docSnap.data()?.phone ?? "",
          });
          setFormError({
            ...formError,
            email: "",
            senderName: "",
            senderPhone: "",
          });
          // console.log('Thing was saved to the database.');
        } else {
          // Do nothing!
          console.log("Thing was not saved to the database.");
        }
        // console.log("Document data:", docSnap.data());
      } else {
        // docSnap.data() will be undefined in this case
        console.log("No such document!");
      }
    } catch (e) {
      console.log(e.message);
    }
  };
  // console.log(koordinateOrigin)
  // console.log(orders)
  // if (loadingProd) {
  //   return 'loading...'
  // }

  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  return (
    <div className="container">
      <Header />
      <h1 className="page-title">Form Order</h1>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          alignItems: "flex-start",
        }}
        className="form-container"
      >
        <div className="form-section">
          <div className="salesField">
            <div className="form-group ">
              <Form.Label className="label">Warehouse</Form.Label>
              <Form.Select
                className="select"
                name="warehouse"
                value={formData.warehouse}
                onChange={handleFormChange}
              >
                <option selected hidden>
                  Pilih Nama Warehouse
                </option>
                {warehouseOptions.map((warehouse) => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </Form.Select>
              {/* <button className="button button-tertiary" onClick={openModal}>Tambah Sales</button> */}
            </div>
            <div className="form-group">
              <Form.Label className="label">Email Pengirim</Form.Label>
              <Form.Control
                className="input"
                type="text"
                name="email"
                placeholder="nashir@example.com"
                value={formData.email}
                onChange={handleFormChange}
              />
            </div>
            <div className="form-group">
              <Form.Label className="label">Nama Pengirim</Form.Label>
              <Form.Control
                required
                isInvalid={formError.senderName ? true : false}
                className="input"
                type="text"
                name="senderName"
                placeholder="Nashir"
                value={formData.senderName}
                onChange={handleFormChange}
              />
              {formError.senderName && (
                <Form.Control.Feedback type="invalid">
                  {formError.senderName}
                </Form.Control.Feedback>
              )}
            </div>

            <div className="form-group">
              <Form.Label className="label">No Hp Pengirim </Form.Label>
              <PhoneInput
                onBlur={(e) => handleCheckPhone(formData.senderPhone)}
                inputClass="input"
                inputStyle={{ width: "100%" }}
                name="senderPhone"
                country={"id"} // Set a default country
                value={formData.senderPhone}
                onChange={handleFormChange}
                enableSearch={true} // Enable search in the country dropdown
                placeholder="Enter phone number"
              />
              <Form.Control
                style={{ display: "none" }}
                isInvalid={formError.senderPhone ? true : false}
                onBlur={handleCheckPhone}
                className="input"
                type="text"
                name="senderPhone"
                placeholder="081xxxxxxx"
                value={formData.senderPhone}
                onChange={handleFormChange}
                onKeyDown={handleKeyDown}
              />
              {formError.senderPhone && (
                <div class="invalid-feedback">{formError.senderPhone}</div>
              )}
            </div>
          </div>
          <Form.Label className="label">Shipping Date</Form.Label>

          <div className="form-container">
            <div className="form-group" style={{ width: "100%" }}>
              <Form.Label className="label">Day:</Form.Label>
              <select
                name="day"
                className="input"
                value={formData?.day}
                onChange={handleFormChange}
              >
                <option value="">Day</option>
                {[...Array(31)].map((_, i) => (
                  <option key={i} value={i + 1}>
                    {(i + 1).toString().padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ width: "100%" }}>
              <Form.Label className="label">Month:</Form.Label>
              <select
                name="month"
                className="input"
                value={formData.month}
                onChange={handleFormChange}
              >
                <option>Month</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i} value={i + 1}>
                    {(i + 1).toString().padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ width: "100%" }}>
              <Form.Label className="label">Year:</Form.Label>
              <select
                name="year"
                className="input"
                value={formData?.year}
                onChange={handleFormChange}
              >
                <option value="">Year</option>
                {[...Array(121)].map((_, i) => (
                  <option key={i} value={2024 + i}>
                    {2024 + i}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {orders.map((order, orderIndex) => (
            <div key={orderIndex} id={`order-${orderIndex}`} className="orders">
              <h3>Orderan {orderIndex + 1}</h3>
              <div className="orderField">
                <div className="form-group">
                  <Form.Label className="label">Nama Penerima</Form.Label>
                  <Form.Control
                    isInvalid={
                      ordersErr?.[orderIndex]?.receiverName ? true : false
                    }
                    className="input"
                    type="text"
                    name="receiverName"
                    placeholder="Tulis Nama Penerima"
                    value={order.receiverName}
                    onChange={(e) => handleChange(e, orderIndex)}
                  />
                  {ordersErr?.[orderIndex]?.receiverName && (
                    <div class="invalid-feedback">
                      {ordersErr?.[orderIndex]?.receiverName}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <Form.Label className="label">
                    No Hp Penerima (format 62)
                  </Form.Label>
                  <PhoneInput
                    inputClass="input"
                    inputStyle={{ width: "100%" }}
                    name="senderPhone"
                    country={"id"} // Set a default country
                    value={order.receiverPhone}
                    onChange={(e) => handleChange(e, orderIndex)}
                    // onBlur={(e) => handleCheckPhone(order.receiverPhone)}
                    enableSearch={true} // Enable search in the country dropdown
                    placeholder="Enter phone number"
                  />
                  <Form.Control
                    style={{ display: "none" }}
                    isInvalid={
                      ordersErr?.[orderIndex]?.receiverPhone ? true : false
                    }
                    className="input"
                    type="text"
                    name="receiverPhone"
                    onKeyDown={handleKeyDown}
                    placeholder="081xxxxxxx"
                    value={order.receiverPhone}
                    onChange={(e) => handleChange(e, orderIndex)}
                  />
                  {ordersErr?.[orderIndex]?.receiverPhone && (
                    <div class="invalid-feedback">
                      {ordersErr?.[orderIndex]?.receiverPhone}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <Form.Label className="label">
                    Alamat Beserta Kecamatan
                  </Form.Label>
                  <Form.Control
                    isInvalid={ordersErr?.[orderIndex]?.address ? true : false}
                    as="textarea"
                    rows={3}
                    className="textarea"
                    name="address"
                    placeholder="Alamat Lengkap"
                    value={order.address}
                    onChange={(e) => handleChange(e, orderIndex)}
                  />
                  <div className="input-note">
                    Contoh : Kalibata City, 92, Jl. Raya Kalibata No.12,
                    RT.9/RW.4, Rawajati, Kec. Pancoran, Kota Jakarta Selatan,
                    Daerah Khusus Ibukota Jakarta 12750
                  </div>
                  {ordersErr?.[orderIndex]?.address && (
                    <div class="invalid-feedback">
                      {ordersErr?.[orderIndex]?.address}
                    </div>
                  )}
                </div>

                <h3>Produk</h3>

                {order.products.map((product, productIndex) => {
                  return (
                    <div key={productIndex} className="productField">
                      <Typeahead
                        id="basic-typeahead"
                        labelKey="nama"
                        onChange={(e) => {
                          handleChange(e, orderIndex, productIndex);
                        }}
                        options={allProduct}
                        placeholder="Products..."
                        selected={product?.prod}
                        className="w-50"
                      />

                      <div className="productInfo">
                        <div className="form-group">
                          <Form.Label className="label">Quantity</Form.Label>
                          <Form.Control
                            max={product?.stock}
                            style={{}}
                            onWheel={(e) => e.target.blur()}
                            isInvalid={
                              ordersErr?.[orderIndex]?.products?.[productIndex]
                                ?.quantity
                                ? true
                                : false
                            }
                            className="input"
                            type="number"
                            name="quantity"
                            placeholder="Quantity"
                            value={product.quantity}
                            onChange={(e) =>
                              handleChange(e, orderIndex, productIndex)
                            }
                          />
                          {product?.stock && (
                            <Form.Label>Stock {product?.stock}</Form.Label>
                          )}
                          {ordersErr?.[orderIndex]?.products?.[productIndex]
                            ?.quantity && (
                            <div class="invalid-feedback">
                              {
                                ordersErr?.[orderIndex]?.products?.[
                                  productIndex
                                ]?.quantity
                              }
                            </div>
                          )}
                        </div>

                        <div className="form-group">
                          <Form.Label className="label">Price</Form.Label>
                          <Form.Control
                            className="input"
                            type="text"
                            name="price"
                            placeholder="Price"
                            disabled
                            value={currency(product.price)}
                            onChange={(e) =>
                              handleChange(e, orderIndex, productIndex)
                            }
                          />
                        </div>
                        <div
                          className="form-group"
                          style={{ marginRight: "-5px" }}
                        >
                          <Form.Label
                            className="label"
                            style={{ whiteSpace: "nowrap", width: "90px" }}
                          >
                            Type{" "}
                          </Form.Label>
                          <Form.Select
                            style={{
                              borderTopRightRadius: "0px",
                              borderBottomRightRadius: "0px",
                            }}
                            className="select"
                            name="discount_type"
                            value={product?.discount_type}
                            onChange={(e) => {
                              handleChange(e, orderIndex, productIndex);
                            }}
                          >
                            <option selected hidden>
                              Type
                            </option>
                            {["%", "Rp"]?.map?.((prod) => {
                              return <option value={prod}>{prod}</option>;
                            })}
                          </Form.Select>
                        </div>
                        <div
                          className="form-group"
                          style={{ marginLeft: "-5px" }}
                        >
                          <Form.Label className="label">Discount</Form.Label>
                          <Form.Control
                            style={{
                              borderTopLeftRadius: "0px",
                              borderBottomLeftRadius: "0px",
                            }}
                            onWheel={(e) => e.target.blur()}
                            className="input"
                            type="number"
                            name="discount"
                            placeholder="Discount"
                            value={product.discount}
                            onChange={(e) =>
                              handleChange(e, orderIndex, productIndex)
                            }
                          />
                        </div>

                        <div className="form-group">
                          <Form.Label className="label">Amount</Form.Label>
                          <Form.Control
                            className="input"
                            type="text"
                            name="amount"
                            placeholder="Amount"
                            disabled
                            value={currency(product.amount)}
                            onChange={(e) =>
                              handleChange(e, orderIndex, productIndex)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button
                  className="button button-tertiary"
                  onClick={() => addProductField(orderIndex)}
                >
                  Tambah Produk
                </button>
                {order.products.length > 1 && (
                  <button
                    className="button button-red"
                    onClick={() => deleteLastProductField(orderIndex)}
                  >
                    Delete Produk
                  </button>
                )}

                <div className="form-group">
                  <Form.Label className="label">Kurir</Form.Label>

                  <Form.Select
                    disabled={!order.products?.[0]?.nama}
                    isInvalid={ordersErr?.[orderIndex]?.kurir ? true : false}
                    defaultValue={order.kurir}
                    defaultChecked={false}
                    className="select"
                    name="kurir"
                    value={order.kurir}
                    onChange={(e) => handleChange(e, orderIndex)}
                  >
                    <option selected hidden>
                      Kurir
                    </option>

                    {ListKurir?.map((kur) => {
                      return <option value={kur}>{kur}</option>;
                    })}
                    {/* <Form.Control placeholder='Tambah kurir baru' className='input' onBlur={handleAddOption} />    */}
                  </Form.Select>
                  {ordersErr?.[orderIndex]?.kurir && (
                    <div class="invalid-feedback">
                      {ordersErr?.[orderIndex]?.kurir}
                    </div>
                  )}
                  {!order.products?.[0]?.nama && (
                    <div style={{ color: "red", fontSize: "10px" }}>
                      Silahkan pilih produk terlebih dahulu
                    </div>
                  )}
                </div>

                {order?.kurir === "Biteship" ? (
                  <>
                    <div className="form-group">
                      <MapComponent
                        setKoordinateReceiver={setKoordinateReceiver}
                        koordinateReceiver={koordinateReceiver}
                      />
                    </div>
                    <div className="form-group">
                      <Form.Label className="label">Jenis Service</Form.Label>

                      <Form.Select
                        className="select"
                        name="kurirService"
                        disabled={loadingRate}
                        value={order?.kurirService?.courier_service_code}
                        // value={`${order?.kurirService?.courier_name}, ${order?.kurirService?.courier_service_name}, ${order?.kurirService?.duration}, Rp.${order?.kurirService?.price}` || ''}
                        onChange={(e, value) => {
                          // console.log(value)
                          handleChange(e, orderIndex);
                        }}
                      >
                        <option selected hidden>
                          {loadingRate ? "loading.." : "Jenis Service"}
                        </option>
                        {listService?.[orderIndex]?.map((kur) => {
                          return (
                            <option value={kur?.courier_service_code}>
                              <span>
                                {kur?.courier_name}, {kur?.courier_service_name}
                                , {kur?.duration}, Rp.{kur?.price}
                              </span>
                            </option>
                          );
                        })}
                      </Form.Select>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <Form.Label className="label">Jenis Service</Form.Label>

                      <Form.Select
                        className="select"
                        name="kurirService"
                        disabled={loadingRate}
                        value={order?.kurirService}
                        // value={`${order?.kurirService?.courier_name}, ${order?.kurirService?.courier_service_name}, ${order?.kurirService?.duration}, Rp.${order?.kurirService?.price}` || ''}
                        onChange={(e, value) => {
                          // console.log(value)
                          handleChange(e, orderIndex);
                        }}
                      >
                        <option selected hidden>
                          {loadingRate ? "loading.." : "Jenis Service"}
                        </option>
                        {dedicatedCourier?.map((kur) => {
                          return (
                            <option key={kur} value={kur}>
                              <span>{kur}</span>
                            </option>
                          );
                        })}
                      </Form.Select>
                    </div>
                  </>
                )}
                <div className="form-group">
                  <Form.Label className="label">Ongkir</Form.Label>
                  <Form.Control
                    onWheel={(e) => e.target.blur()}
                    isInvalid={ordersErr?.[orderIndex]?.ongkir ? true : false}
                    className="input"
                    type="number"
                    name="ongkir"
                    onChange={(e) => {
                      handleChange(e, orderIndex);
                    }}
                    value={order?.ongkir}
                    placeholder="Ongkir"
                  />
                  {ordersErr?.[orderIndex]?.ongkir && (
                    <Form.Control.Feedback type="invalid">
                      {ordersErr?.[orderIndex]?.ongkir}
                    </Form.Control.Feedback>
                  )}
                </div>

                <div className="form-group">
                  <Form.Label className="label">Isi gift card</Form.Label>
                  <textarea
                    className="textarea"
                    type="text"
                    name="giftCard"
                    placeholder="Tulis disini"
                    value={order.giftCard}
                    onChange={(e) => handleChange(e, orderIndex)}
                  />
                </div>
              </div>
            </div>
          ))}

          <div className="form-group button-action">
            <button
              disabled={orders.length >= 10}
              className="button button-tertiary"
              onClick={addOrderField}
            >
              Tambah Order
            </button>
            <button
              disabled={orders.length >= 10}
              className="button button-primary"
              onClick={duplicateOrderField}
            >
              Duplicate Order
            </button>
            {orders.length > 1 && (
              <button
                className="button button-red"
                onClick={deleteLastOrderField}
              >
                Delete Order
              </button>
            )}
          </div>
          <div className="form-group">
            <Form.Label className="label">Notes</Form.Label>
            <textarea
              className="textarea"
              maxLength={700}
              type="text"
              name="notes"
              placeholder="Tulis disini"
              value={formData.notes}
              onChange={handleFormChange}
            />
          </div>
        </div>

        <div
          style={{
            position: "sticky",
            top: 200,
            right: 0,
          }}
          className="summary-section"
        >
          <div className="summary-item">
            <Form.Label>Subtotal</Form.Label>
            <span>{currency(totalAfterReduce)}</span>
          </div>
          <div className="summary-item">
            <Form.Label>Total Discount</Form.Label>
            <span>{currency(diskonAfterReduce)}</span>
          </div>
          <div className="summary-item">
            <Form.Label>Additional Discount</Form.Label>
            <Form.Control
              onWheel={(e) => e.target.blur()}
              className="input"
              type="number"
              name="additionalDiscount"
              placeholder="0"
              value={formData.additionalDiscount}
              onChange={handleFormChange}
            />
          </div>
          <div className="summary-item">
            <Form.Label>Delivery Fee</Form.Label>
            <span>{currency(totalOngkir)}</span>
          </div>
          <div className="summary-item">
            <Form.Label>Total</Form.Label>
            <span>{currency(totalAfterDiskonDanOngkir)}</span>
          </div>
          <div className="submit">
            <button
              className="button button-primary"
              onClick={handleShowSaveInvoice}
            >
              Save Invoice
            </button>
          </div>
        </div>
      </div>
      {/* modal */}
      <SaveInvoiceModal
        show={modalShow}
        onHide={() => setModalShow(false)}
        handlePayment={handlePayment}
        loading={loading}
      />
      <RedirectToWa
        show={dialoglRedirectWAShow}
        onHide={() => setDialogRedirectWAShow({ open: false, id: "" })}
        data={{
          ...formData,
          harga: totalAfterDiskonDanOngkir,
          link: linkMidtrans,
        }}
      />
      <AddSalesModal isOpen={isModalOpen} onRequestClose={closeModal} />
    </div>
  );
};

export default AddOrder;
