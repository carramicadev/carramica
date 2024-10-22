import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, doc, getDoc, setDoc, serverTimestamp, query, where, orderBy, increment, onSnapshot, runTransaction } from "firebase/firestore";
import Header from './Header';
import AddSalesModal from './AddSalesModal';
import { Typeahead } from 'react-bootstrap-typeahead';
import { httpsCallable } from "firebase/functions";

import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-phone-input-2/lib/style.css';
import 'react-bootstrap-typeahead/css/Typeahead.css';
// import 'react-bootstrap-typeahead/css/Typeahead.css';
import dataServiceLalamove from './kecamatan.json';
import Autocomplete from 'react-autocomplete';
import { firestore, functions } from './FirebaseFrovider';
import { SAPProduct } from './ShippingProduct';
import SaveInvoiceModal from './SaveInvoiceModal';
import RedirectToWa from './DialogRedirectToWA';
import { currency } from './formatter';
import MapComponent from './MapComponent';
import { useFirestoreDocument, useFirestoreDocumentData, useFirestoreQueryData } from '@react-query-firebase/firestore';
import { useAuth } from './AuthContext';
import { Form } from 'react-bootstrap';
import { useSnackbar } from 'notistack';
import PhoneInput from 'react-phone-input-2';

const AddOrder = () => {
  const { currentUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  // get settings doc
  // const settingsRef = collection(firestore, "settings");
  const settingsRef = doc(firestore, 'settings', 'counter');

  const [settings, setSettings] = useState({});
  const [update, setUpdate] = useState(false);

  useEffect(() => {
    // async function getUsers() {
    //   if (update) {
    //     const docRef = doc(firestore, "settings", 'counter');
    //     const docSnap = await getDoc(docRef);

    //     if (docSnap.exists()) {
    //       setSettings({
    //         ...docSnap.data()
    //       })
    //       console.log("Document data:", docSnap.data());
    //     } else {
    //       // docSnap.data() will be undefined in this case
    //       console.log("No such document!");
    //     }

    //   } else {
    //     const docRef = doc(firestore, "settings", 'counter');
    //     const docSnap = await getDoc(docRef);

    //     if (docSnap.exists()) {
    //       setSettings({
    //         ...docSnap.data()
    //       })
    //       console.log("Document data:", docSnap.data());
    //     } else {
    //       // docSnap.data() will be undefined in this case
    //       console.log("No such document!");
    //     }

    //   }
    // }
    // getUsers()
    const unsub = onSnapshot(settingsRef, (doc) => {
      const source = doc.metadata.hasPendingWrites ? "Local" : "Server";
      // console.log(source, " data: ", doc.data());
      setSettings({
        ...doc.data()
      })
    });
    return () => unsub
  }, []);
  // inv id ord id
  const invId = String(settings?.invoiceId).padStart(4, '0');
  const ordId = String(settings?.orderId).padStart(4, '0');
  // console.log(settings);

  const [formData, setFormData] = useState({
    email: '',
    salesName: '',
    senderName: '',
    senderPhone: '62',
    additionalDiscount: 0,
    deliveryFee: '',
  });

  const [formError, setFormError] = useState({
    email: '',
    salesName: '',
    senderName: '',
    senderPhone: '',
    additionalDiscount: '',
    deliveryFee: '',
  });

  const initialOrder = {

    receiverName: '',
    receiverPhone: '62',
    address: '',
    kecamatan: '',
    kurir: '',
    ongkir: 0,
    giftCard: '',
    kurirProduk: '',
    products: [{ nama: '', quantity: 1, price: '', discount: '', amount: '', discount_type: 'Rp' }]
  };

  useEffect(() => {
    if (invId && ordId) {
      setOrders([{
        ...initialOrder, ordId: `OS-${invId}-${ordId}`,
      }])
    }
  }, [])

  const initialOrderErr = {
    receiverName: '',
    receiverPhone: '',
    address: '',
    kecamatan: '',
    kurir: '',
    ongkir: '',
    giftCard: '',
    kurirProduk: '',
    products: [{ nama: '', quantity: '', price: '', discount: '', amount: '' }]
  };


  const [orders, setOrders] = useState([initialOrder]);
  const [ordersErr, setOrdersErr] = useState([initialOrderErr]);

  const [salesOptions, setSalesOptions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [kurirServic, setKurirService] = useState('');
  const [listService, setListService] = useState({});
  const [selectedService, setSelectedService] = useState('');
  const [ongkirError, setOngkirError] = useState({});
  const [linkMidtrans, setLinkMidtrans] = useState('');
  const [kurirAktif, setKurirAktif] = useState('');
  const [addressAktif, setAdressAktif] = useState('');
  const [indexOrder, setIndexOrder] = useState(0);
  // getKec
  const [selected, setSelected] = useState({});
  const [options, setOptions] = useState([]);
  const [value, setValue] = useState('');
  // const [allProduct, setProduct] = useState([]);
  const [modalShow, setModalShow] = useState(false);
  const [dialoglRedirectWAShow, setDialogRedirectWAShow] = useState({ open: false, id: '' });
  const [koordinateReceiver, setKoordinateReceiver] = useState({
    lat: '',
    lng: ''
  })
  // select kurir
  const [ListKurir, setListKurir] = useState(['Biteship', 'Dedicated']);
  const [newKurir, setNewKurir] = useState('');
  const handleAddOption = (e) => {
    if (e.target.value && !ListKurir.includes(e.target.value)) {
      setListKurir([...ListKurir, e.target.value]);
      setNewKurir(''); // Clear the input field after adding
    }
  };
  const [error, setError] = useState(null);


  // validate
  const validate = () => {
    const newError = { ...formError };
    // console.log('er')

    if (!formData.senderName) {
      // console.log('er')
      newError.senderName = 'Sender name is required';
    }

    if (formData.senderPhone.length <= 2) {
      newError.senderPhone = 'Sender phone is required';
    }



    return newError;
  }

  // validateOrder
  const validateOrd = () => {
    // console.log(indexOrder)
    const newErrors = [...ordersErr];
    const currentOrder = orders[indexOrder]; // Get the specific order to validate

    // Validate receiverName
    if (!currentOrder?.receiverName) {
      newErrors[indexOrder].receiverName = 'Receiver name is required';
    }

    // Validate receiverPhone
    if (!currentOrder?.receiverPhone || currentOrder?.receiverPhone.length <= 2) {
      newErrors[indexOrder].receiverPhone = 'Receiver phone number is required';
    }

    // Validate address
    if (!currentOrder?.address) {
      newErrors[indexOrder].address = 'Address is required';
    }

    if (!currentOrder?.kurir) {
      newErrors[indexOrder].kurir = 'kurir is required';
    }
    if (!currentOrder?.ongkir) {
      newErrors[indexOrder].ongkir = 'ongkir is required';
    }
    // console.log(indexOrder)

    newErrors[indexOrder].products = currentOrder?.products?.map?.((product, j) => {
      const productErrors = { ...newErrors[indexOrder].products[j] };

      if (!product?.nama) {
        productErrors.nama = 'Product name is required';
      }

      if (!product?.quantity || product?.quantity <= 0) {
        productErrors.quantity = 'Quantity is required and must be greater than 0';
      }



      return productErrors;
    });

    return newErrors;
  }


  // console.log(formData)
  // query coll product
  const ref = query(collection(firestore, "product"),
    // limit(10),
  );

  // Provide the query to the hook
  const { data: allProduct, isLoading: loadingProd, error: err } = useFirestoreQueryData(["product"], ref, {
    subscribe: true,
    idField: "id",
  });
  // console.log(err)
  // console.log(dataServiceLalamove?.services.map((ser) => {
  //   return ser?.key
  // }))
  // select service kurir
  // const handleSelectKurirProd = (e) => {
  //   setKurirService(e.target.value)
  // }
  // Fetch sales data from Firestore on component mount
  useEffect(() => {
    const fetchSales = async () => {
      const salesSnapshot = await getDocs(collection(db, "sales"));
      const salesList = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSalesOptions(salesList);
    };

    fetchSales();
  }, []);

  const handleChange = async (e, orderIndex, productIndex, prod) => {
    setIndexOrder(orderIndex)
    console.log(typeof e === 'object', !Array.isArray(e))

    const { name, value } = !Array.isArray(e) && typeof e === 'object' && e.target;

    // let selectedObj = {}
    if (name === 'kurirProduk') {
      setKurirService(value)
    }
    // else if (name === 'kurirService') {
    //   selectedObj = listService?.find?.(option => option?.courier_service_code === value);

    // } 
    else if (name === 'kurir' && value === 'LALAMOVE') {
      setKurirAktif(value)
      const serviceLalamove = dataServiceLalamove?.services.map((ser) => {
        return ser?.key
      })
      // setListService(serviceLalamove)
    } else if (name === 'address') {
      setAdressAktif(value)
    } else if (name === 'kurir') {

      setKurirAktif(value)
    }
    if (productIndex !== undefined) {

      const updatedOrders = orders.map((order, i) =>
        i === orderIndex ? {
          ...order,
          products: order.products.map((product, j) => {
            const hargaProd = product?.price;
            let hargaAmountAfterDiscon = parseInt(product?.price) * parseInt(product?.quantity);
            if (typeof e === 'object' && name === 'discount_type' && value === '%' && product?.discount) {
              console.log('%')
              hargaAmountAfterDiscon = (1 - (parseInt(product?.discount ? product?.discount : 0) / 100)) * hargaAmountAfterDiscon

            } else if (typeof e === 'object' && name === 'discount_type' && value === 'Rp' && product?.discount) {
              console.log('Rp')
              hargaAmountAfterDiscon = hargaAmountAfterDiscon - parseInt(product?.discount ? product?.discount : 0)
            } else if (typeof e === 'object' && name === 'discount' && product?.discount_type === '%') {
              hargaAmountAfterDiscon = (1 - (parseInt(value ? value : 0) / 100)) * hargaAmountAfterDiscon
            } else if (typeof e === 'object' && name === 'discount' && product?.discount_type === 'Rp') {
              console.log('Rp')
              hargaAmountAfterDiscon = hargaAmountAfterDiscon - parseInt(value ? value : 0)
            }
            // console.log(hargaAmountAfterDiscon)
            return j === productIndex ? Array.isArray(e) ? { ...product, prod: e, nama: e?.[0]?.nama, price: e?.[0]?.harga, weight: e?.[0]?.weight, height: e?.[0]?.height, width: e?.[0]?.width, length: e?.[0]?.length, amount: e?.[0]?.harga, sku: e?.[0]?.sku, id: e?.[0]?.id, stock: e?.[0]?.stok } : name === 'quantity' ? { ...product, [name]: parseInt(value), amount: product?.discount_type === '%' ? ((1 - (product?.discount / 100)) * (hargaProd * parseInt(value))) : hargaProd * parseInt(value) - parseInt(product?.discount ? product.discount : 0) } : name === 'discount_type' ? { ...product, [name]: value, amount: hargaAmountAfterDiscon } : { ...product, [name]: parseInt(value), amount: hargaAmountAfterDiscon } : product
          })
        } : order
      );
      // err
      const updatedOrdersErr = ordersErr.map((err, i) =>
        i === orderIndex ? {
          ...err,
          products: err.products.map((productErr, j) => {

            return j === productIndex ? { ...productErr, [name]: '' } : productErr
          })
        } : err
      );
      setOrders(updatedOrders);
      setOrdersErr(updatedOrdersErr)
    } else {
      // console.log(e, typeof e !== 'object')

      const selectedObj = listService?.[orderIndex]?.find?.(option => option?.courier_service_code === value);

      const updatedOrders = orders.map((order, i) =>
        i === orderIndex ? typeof e !== 'object' ? { ...order, receiverPhone: e } : name === 'kurir' ? { ...order, [name]: value, ongkir: '' } : name === 'kurirService' ? { ...order, [name]: selectedObj, ongkir: selectedObj?.price } : { ...order, ordId: `OS-${invId}-${ordId}`, [name]: value } : order
      );
      const updatedOrdersErr = ordersErr.map((err, i) =>
        i === orderIndex ? typeof e !== 'object' ? { ...err, receiverPhone: '' } : name === 'kurirService' ? { ...err, [name]: '', ongkir: '' } : { ...err, [name]: '' } : err
      );
      setOrders(updatedOrders);
      setOrdersErr(updatedOrdersErr)
    }
  };

  const handleFormChange = (e) => {
    if (typeof e !== 'object') {
      setFormData({
        ...formData,
        senderPhone: e
      })
      setFormError({
        ...formError,
        senderPhone: ''
      })
    } else {
      const { name, value } = e?.target;
      if (e.target.type === 'number') {
        setFormData({ ...formData, [name]: parseInt(value) });

      } else {
        setFormData({ ...formData, [name]: value });
      }
      setFormError({
        ...formError,
        [name]: ''
      })
    }


  };

  const handleSaveInvoice = async () => {
    try {
      const docRef = await addDoc(collection(db, "orders"), { ...formData, orders });
      // console.log("Document written with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  const addProductField = (orderIndex) => {
    const updatedOrders = orders.map((order, i) =>
      i === orderIndex ? {
        ...order,
        products: [...order.products, { nama: '', quantity: '', price: '', discount: '', amount: '', discount_type: 'Rp' }]
      } : order
    );
    setOrders(updatedOrders);
  };

  const deleteLastProductField = (orderIndex) => {
    const updatedOrders = orders.map((order, i) =>
      i === orderIndex ? {
        ...order,
        products: order.products.slice(0, -1)
      } : order
    );
    setOrders(updatedOrders);
  };

  const addOrderField = async (e) => {

    e.preventDefault();
    const findErros = validate();
    const findErrorsOrd = validateOrd();

    if (Object.values(findErros).some((err) => typeof err === 'string' && err !== '' || (typeof err === 'object' && Object.values(err).some((subErr) => subErr !== '')))) {
      alert('harap isi dulu field yang belum diisi!')
      // console.log('Errors found:', findErros);
      setFormError(findErros);
    } else if (findErrorsOrd.some((order) =>
      Object.values(order).some((err) =>
        typeof err === 'string' && err !== '' ||
        Array.isArray(err) && err.some((prodErr) => Object.values(prodErr).some((prodErrField) => prodErrField !== ''))
      )
    )) {
      // console.log('Errors found:', findErrorsOrd);
      alert('harap isi dulu field yang belum diisi!')

      setOrdersErr(findErrorsOrd)
    } else {
      try {
        setOrders([...orders, initialOrder]);
        setIndexOrder(indexOrder + 1)
        // await setDoc(settingsRef, {
        //   // invoiceId: increment(1),
        //   orderId: increment(1)
        // }, { merge: true })
        setUpdate((prevValue) => !prevValue)
        setOrdersErr(err => [...err, initialOrderErr])

      } catch (e) {
        console.log(e.message)
      }
    }

  };

  const duplicateOrderField = async (e) => {
    // setIndexOrder(indexOrder + 1)
    e.preventDefault();

    const findErros = validate();
    const findErrorsOrd = validateOrd();

    if (Object.values(findErros).some((err) => typeof err === 'string' && err !== '' || (typeof err === 'object' && Object.values(err).some((subErr) => subErr !== '')))) {
      alert('harap isi dulu field yang belum diisi!')
      setFormError(findErros);
    } else if (findErrorsOrd.some((order) =>
      Object.values(order).some((err) =>
        typeof err === 'string' && err !== '' ||
        Array.isArray(err) && err.some((prodErr) => Object.values(prodErr).some((prodErrField) => prodErrField !== ''))
      )
    )) {
      // console.log('Errors found:', findErrorsOrd);
      alert('harap isi dulu field yang belum diisi!')
      setOrdersErr(findErrorsOrd)
    } else {
      const lastOrder = orders[orders.length - 1];
      const duplicatedOrder = {
        ...lastOrder,
        receiverName: '',
        receiverPhone: '62',
        address: '',
        kecamatan: '',
        // kurir: '',
        // giftCard: '',
        kurirProduk: '',
        // products: [{ nama: '', quantity: '', price: '', discount: '', amount: '' }]
      };
      setOrders([...orders, duplicatedOrder]);
      setFormData({
        ...formData,

      })
      const lastService = listService?.[orders.length - 1]
      setListService({
        ...listService,
        [orders.length]: lastService
      })

      setIndexOrder(indexOrder + 1)

      // await setDoc(settingsRef, {
      //   // invoiceId: increment(1),
      //   orderId: increment(1)
      // }, { merge: true });
      setUpdate((prevValue) => !prevValue)
      setOrdersErr(err => [...err, initialOrderErr])

    }


  };

  const deleteLastOrderField = () => {
    setOrders(orders.slice(0, -1));
    setOrdersErr(ordersErr.slice(0, -1));
    setIndexOrder(indexOrder - 1)
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
    if (formData.senderPhone.length <= 2 && (e.key === 'Backspace' || e.key === 'Delete')) {
      e.preventDefault();
    }
  };

  // total harga
  const totalHarga = orders?.map((ord) => {
    return ord?.products?.map((prod) => {
      if (prod.quantity !== '') {
        return prod.price * prod.quantity
      } else {
        return prod.price
      }
    })
  })
  const hargaTotal = totalHarga?.map((tot) => {
    return tot.reduce((val, nilaiSekarang) => {
      return val + nilaiSekarang
    }, 0)
  })
  const totalAfterReduce = hargaTotal.reduce((val, nilaiSekarang) => {
    return val + nilaiSekarang
  }, 0)
  const totalAmount = orders?.map((ord) => {
    return ord?.products?.map((prod) => {
      return prod?.amount
    })
  })

  const hargaTotalAmount = totalAmount?.map((tot) => {
    return tot.reduce((val, nilaiSekarang) => {
      return val + nilaiSekarang
    }, 0)
  })
  const totalAmountAfterReduce = hargaTotalAmount.reduce((val, nilaiSekarang) => {
    return val + nilaiSekarang
  }, 0)
  console.log(totalAmountAfterReduce)


  // diskon
  const diskon = orders?.map((ord) => {
    return ord?.products?.map((prod) => {
      return prod?.discount > 0 ? parseInt(prod?.discount) : 0
    })
  })

  const diskonTotal = diskon?.map((tot) => {
    return tot.reduce((val, nilaiSekarang) => {
      return val + nilaiSekarang
    }, 0)
  })

  const diskonAfterReduce = diskonTotal?.reduce((val, nilaiSekarang) => {
    return val + nilaiSekarang
  }, 0)

  const ongkir = orders.map((ord) => ord.ongkir > 0 ? parseInt(ord.ongkir) : 0)
  const totalOngkir = ongkir?.reduce((val, nilaiSekarang) => {
    return val + nilaiSekarang
  }, 0)
  // total after ongkir & diskon
  const disc = diskonAfterReduce ? diskonAfterReduce : 0
  const addDisc = formData?.additionalDiscount ? formData.additionalDiscount : 0
  const totalAfterDiskonDanOngkir = parseInt(totalAfterReduce) - parseInt(disc) - parseInt(addDisc) + parseInt(totalOngkir)
  // console.log(totalOngkir, diskonAfterReduce, totalAfterReduce, totalAfterDiskonDanOngkir)

  // orderLalamove
  const handleOrderLalamove = async () => {
    const order = httpsCallable(functions, 'createOrderLalamove');
    try {
      const result = await order({
        quotationId: ongkir?.quotationId,
        sender: {
          stopId: ongkir?.stops[0]?.stopId,
          name: formData?.senderName,
          phone: `+${formData?.senderPhone}`
        },
        recipients: [
          {
            stopId: ongkir?.stops[1]?.stopId,
            name: orders[0]?.receiverName,
            phone: `+${orders[0]?.receiverPhone}`,
          }
        ],

      });
      // console.log(result.data?.items)
      // setOngkir(result.data?.items?.data);
    } catch (error) {
      console.error("Error calling function:", error);
      // setListService([]);
    }
  }

  // payment midtrans
  let product = []
  const productMap = orders.map((ord) =>
    ord.products.map((prod) => {

      product.push({
        name: prod.nama,
        id: prod?.sku,
        price: prod.price,
        quantity: prod.quantity
      })
      if (prod.discount > 0) {
        product.push({
          name: `discount-${prod.nama}`,
          id: prod?.sku,
          price: -prod.discount,
          quantity: 1
        })
      }
    })
  );
  // console.log(product);

  const handleShowSaveInvoice = (e) => {
    e.preventDefault();
    const findErros = validate();
    const findErrorsOrd = validateOrd();

    if (Object.values(findErros).some((err) => typeof err === 'string' && err !== '' || (typeof err === 'object' && Object.values(err).some((subErr) => subErr !== '')))) {
      // console.log('Errors found:', findErros);
      // enqueueSnackbar(`harap isi dulu field yang belum diisi `, { variant: 'error' })
      alert('harap isi dulu field yang belum diisi!')

      setFormError(findErros);
    } else if (findErrorsOrd.some((order) =>
      Object.values(order).some((err) =>
        typeof err === 'string' && err !== '' ||
        Array.isArray(err) && err.some((prodErr) => Object.values(prodErr).some((prodErrField) => prodErrField !== ''))
      )
    )) {
      // console.log('Errors found:', findErrorsOrd);
      // enqueueSnackbar(`harap isi dulu field yang belum diisi `, { variant: 'error' })
      alert('harap isi dulu field yang belum diisi!')

      setOrdersErr(findErrorsOrd)
    } else {
      setModalShow(true)
    }
  }
  const [loading, setLoading] = useState(false)
  const handlePayment = async () => {

    try {
      // console.log('run')
      setLoading(true);



      // inv id and order id
      if (formData?.additionalDiscount) {
        product.push({
          name: `addional discount`,
          id: 'additional-discount',
          price: -(parseInt(formData?.additionalDiscount)),
          quantity: 1
        })
      }

      // console.log(invId, ordId, totalOngkir, updateOrder)
      // orderLalamove
      // handleOrderLalamove();
      if (totalOngkir > 0) {
        product.push({
          name: 'ongkir',
          id: 'ongkir',
          price: totalOngkir,
          quantity: 1
        })
      }
      let customer_details = {
        first_name: formData.senderName,
        last_name: "test",
        email: formData.email || '',
        phone: formData.senderPhone,


      }
      if (!formData.email) {
        customer_details = {
          first_name: formData.senderName,
          last_name: "test",
          // email: formData.email || '',
          phone: formData.senderPhone,


        }
      }

      // checking order id
      const docRef = doc(firestore, "settings", 'counter');

      const newOrderId = await runTransaction(firestore, async (transaction) => {
        const counterDoc = await transaction.get(docRef);

        if (!counterDoc.exists()) {
          throw new Error('Counter document does not exist!');
        }

        // Get the current order count and increment by 1
        const currentCount = counterDoc.data().invoiceId || 0;
        const newCount = currentCount + 1;
        const newInvId = String(newCount).padStart(4, '0');

        // Update the counter in Firestore
        transaction.update(docRef, { invoiceId: newCount });

        // Return the new order ID
        return `INV-2024-${newInvId}`;  // Format the order ID as needed, e.g., "ORD_1", "ORD_2", etc.
      });


      const arrayOngkir = Object.values(ongkir);
      const updateOrder = await Promise.all(orders?.map(async (ord, i) => {
        const newOrderCount = await runTransaction(firestore, async (transaction) => {
          const counterDoc = await transaction.get(docRef);

          if (!counterDoc.exists()) {
            throw new Error('Counter document does not exist!');
          }

          // Get the current order count and increment by 1
          const currentCount = counterDoc.data().orderId || 0;
          const newCount = currentCount + 1;

          // Update the counter in Firestore
          transaction.update(docRef, { orderId: newCount });

          // Return the new order ID
          return newCount;
        });

        const orderIds = String(newOrderCount).padStart(4, '0');  // Format the order ID
        const newOrderId = `OS-${newOrderCount}-${orderIds}`;  // Example: "OS-1-0001"

        return {
          ...ord,
          ongkir: arrayOngkir?.[i],
          ordId: newOrderId
        };
      }));

      const orderRef = doc(firestore, "orders", newOrderId)

      // const orderDoc = await getDoc(orderRef);
      await setDoc(orderRef, {
        ...formData, orders: updateOrder, totalOngkir: totalOngkir, createdAt: serverTimestamp(),
        paymentStatus: 'pending',
        totalHargaProduk: totalAfterReduce,
        userId: currentUser?.uid,
        invoice_id: newOrderId,
        // firstOrdId: newOrderCount
      }, { merge: true });

      const payment = httpsCallable(functions, 'createOrder');
      const result = await payment({
        amount: totalAfterDiskonDanOngkir,
        id: newOrderId,
        item: product,
        customer_details: customer_details
      });
      await setDoc(orderRef, {
        midtrans: result.data.items,
      }, { merge: true });
      // console.log(result.data.items)
      setLinkMidtrans(result.data.items?.redirect_url)
      setDialogRedirectWAShow({ open: true, id: newOrderId });

      // if (orderDoc.exists()) {
      //   // console.log('exist')
      //   setUpdate((prevValue) => !prevValue);
      //   const docSnap = await getDoc(docRef);
      //   const newInvId = String(docSnap.data()?.invoiceId + 1).padStart(4, '0');
      //   const orderUpdate = orders.map((ord, i) => {
      //     const newOrdId = String(docSnap.data()?.orderId).padStart(4, '0');
      //     return {
      //       ...ord,
      //       ordId: `OS-${newInvId}-${newOrdId}`,
      //       ongkir: arrayOngkir?.[i]
      //     }
      //   });


      //   const newOrderRef = doc(firestore, "orders", `INV-2024-${newInvId}`)

      //   await setDoc(newOrderRef, {
      //     ...formData, orders: orderUpdate, totalOngkir: totalOngkir, createdAt: serverTimestamp(),
      //     paymentStatus: 'pending',
      //     totalHargaProduk: totalAfterReduce,
      //     userId: currentUser?.uid,
      //     invoice_id: `INV-2024-${newInvId}`,
      //     firstOrdId: docSnap.data()?.orderId
      //   }, { merge: true });
      //   //  settdoc
      //   await setDoc(settingsRef, {
      //     orderId: increment(orderUpdate.length),
      //     invoiceId: increment(1),
      //   }, { merge: true })
      //   const payment = httpsCallable(functions, 'createOrder');
      //   const result = await payment({
      //     amount: totalAfterDiskonDanOngkir,
      //     id: `INV-2024-${newInvId}`,
      //     item: product,
      //     customer_details: customer_details
      //   });
      //   await setDoc(newOrderRef, {
      //     midtrans: result.data.items,
      //   }, { merge: true });
      //   // console.log(result.data.items)
      //   setLinkMidtrans(result.data.items?.redirect_url)
      //   setDialogRedirectWAShow({ open: true, id: `INV-2024-${newInvId}` });

      // } else {
      //   // console.log('not')

      //   await setDoc(settingsRef, {
      //     invoiceId: increment(updateOrder.length),
      //     orderId: increment(1)
      //   }, { merge: true })
      //   await setDoc(orderRef, {
      //     ...formData, orders: updateOrder, totalOngkir: totalOngkir, createdAt: serverTimestamp(),
      //     paymentStatus: 'pending',
      //     totalHargaProduk: totalAfterReduce,
      //     userId: currentUser?.uid,
      //     invoice_id: `INV-2024-${invId}`,
      //     firstOrdId: settings?.orderId
      //   }, { merge: true });

      //   const payment = httpsCallable(functions, 'createOrder');
      //   const result = await payment({
      //     amount: totalAfterDiskonDanOngkir,
      //     id: `INV-2024-${invId}`,
      //     item: product,
      //     customer_details: customer_details
      //   });
      //   await setDoc(orderRef, {
      //     midtrans: result.data.items,
      //   }, { merge: true });
      //   // console.log(result.data.items)
      //   setLinkMidtrans(result.data.items?.redirect_url)
      //   setDialogRedirectWAShow({ open: true, id: `INV-2024-${invId}` });

      // }


      // console.log("Document written with ID: ", docRef.id);


      const contactRef = await setDoc(doc(firestore, "contact", formData?.senderPhone), { createdAt: serverTimestamp(), nama: formData.senderName, phone: formData.senderPhone, email: formData?.email || '', type: 'sender' });

      await Promise.all(orders?.map?.(async (data) => {


        await setDoc(doc(firestore, "contact", data?.receiverPhone), { createdAt: serverTimestamp(), nama: data.receiverName, phone: data.receiverPhone, email: '', type: 'receiver' });
      }));

      // kurangi stok
      // await Promise.all(orders?.map?.(async (data) => {

      //   Promise.all(data?.products.map(async (prod) => {
      //     await setDoc(doc(firestore, "product", prod?.id), {
      //       updatedAt: serverTimestamp(),
      //       stok: increment(-prod?.quantity)
      //     }, { merge: true });

      //   }))
      // }));




      setLoading(false)
      setModalShow(false)
      enqueueSnackbar(`order berhasil dibuat`, { variant: 'success' })
    } catch (e) {
      enqueueSnackbar(`order gagal dibuat, ${e.message}`, { variant: 'error' })

      console.log(e.message)
      setLoading(false)

    }
  }

  // call getDistrict
  useEffect(() => {
    if (value !== '') {
      const timer = setTimeout(() => {
        async function getKec() {
          const helloWorld = httpsCallable(functions, 'getDistrict');
          try {
            const result = await helloWorld({ value: value });
            // console.log(result.data?.items?.areas)
            setOptions(result.data?.items?.areas);
          } catch (error) {
            console.error("Error calling function:", error);
            setOptions([]);
          }
        }
        getKec()
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

    if (selected && orders?.[indexOrder]?.products?.length > 0 && koordinateReceiver?.lat && koordinateReceiver.lng) {
      const ordersProduct = orders?.[indexOrder].products?.map((prod) => {
        return {
          name: prod?.nama,
          sku: prod?.sku,
          weight: prod?.weight,
          height: prod?.height,
          width: prod?.width,
          length: prod?.length,
          quantity: prod?.quantity
        }
      })
      // console.log(ordersProduct)
      // console.log('run')
      async function getService() {
        const helloWorld = httpsCallable(functions, 'getRates');
        try {

          const updatedOrdersOng = orders.map((order, i) =>
            i === indexOrder ? {
              ...order, ongkir: '', kurirService: ''
            } : order)
          setOrders(updatedOrdersOng)
          setListService({ ...listService, [indexOrder]: [] });
          setLoadingRate(true)
          const result = await helloWorld({
            items: ordersProduct,
            origin_latitude: -6.197150,
            origin_longitude: 106.699000,
            destination_latitude: koordinateReceiver?.lat,
            destination_longitude: koordinateReceiver?.lng,
          });
          // console.log(result.data?.items)
          setListService({
            ...listService,
            [indexOrder]: result.data?.items?.pricing
          });
          setLoadingRate(false)
        } catch (error) {
          setLoadingRate(false)
          enqueueSnackbar(`gagal mendapatkan ongkir, ${error.message}`, { variant: 'error' })
          console.error("Error calling function:", error);
          setListService({ ...listService, [indexOrder]: [] });
        }
      }
      getService()

    }

  }, [selected, orders?.[indexOrder]?.products, koordinateReceiver?.lat, koordinateReceiver?.lng]);

  // // call getPrice SAP
  // useEffect(() => {
  //   console.log('run')

  //   if (selectedService && selected.district_code) {
  //     console.log('run')
  //     async function getPrice() {
  //       const helloWorld = httpsCallable(functions, 'getPrice');
  //       try {
  //         const result = await helloWorld({
  //           destination_district_code: selected?.district_code,
  //           service_type_code: selectedService,

  //         });
  //         console.log(result.data?.items?.data)
  //         setOngkir({ ...ongkir, [indexOrder]: result.data?.items?.data?.services?.[0]?.total_cost });
  //         setOngkirError({ ...ongkirError, [indexOrder]: '' })
  //         // setAllOngkir()
  //       } catch (error) {
  //         console.error("Error calling function:", error);
  //         // setListService([]);
  //       }
  //     }
  //     getPrice()

  //   }

  // }, [selectedService, selected.district_code]);

  // // getQuotation LAlamove
  // useEffect(() => {
  //   console.log('run')

  //   if (selectedService && kurirAktif === 'LALAMOVE' && addressAktif && koordinateReceiver) {
  //     console.log('run')
  //     async function getQuota() {
  //       const quotation = httpsCallable(functions, 'getQuotation');
  //       const coordinates = [
  //         {
  //           coordinates: { lat: '-6.197150', lng: '106.699000', },
  //           address: 'pagar warna hijau, sebelah kanan dari arah tol, Jl. H. Mansyur No.33, RT.002/RW.005, Gondrong, Kec. Karang Tengah, Kota Tangerang, Banten 15147'
  //         },
  //         {
  //           coordinates: { lat: koordinateReceiver.lat.toString(), lng: koordinateReceiver.lng.toString(), },
  //           address: addressAktif
  //         },
  //         // {
  //         //   "coordinates": {
  //         //     "lat": "22.33547351186244",
  //         //     "lng": "114.17615807116502"
  //         //   },
  //         //   "address": "Innocentre, 72 Tat Chee Ave, Kowloon Tong"
  //         // },
  //       ];
  //       try {
  //         const result = await quotation({
  //           coordinates: coordinates,
  //           serviceType: selectedService,
  //           language: 'en_ID'

  //         });
  //         console.log(result.data?.items)
  //         setOngkir({ ...ongkir, [indexOrder]: parseInt(result.data?.items?.data?.priceBreakdown?.total) });
  //         setOngkirError({ ...ongkirError, [indexOrder]: '' })
  //         // setOngkir(result.data?.items?.data);
  //       } catch (error) {
  //         console.error("Error calling function:", error);
  //         // setListService([]);
  //       }
  //     }
  //     getQuota()

  //   }

  // }, [selectedService, kurirAktif, addressAktif, koordinateReceiver]);
  const [typeahead, setTypehed] = useState([]);

  // check no hp
  const handleCheckPhone = async (phone) => {
    try {
      // console.log(phone)
      const docRef = doc(firestore, "contact", phone);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        if (window.confirm('Nomor ini sudah ada didalam contact, apakah anda ingin menggunakan data yang sudah ada?')) {
          // Save it!
          setFormData({
            email: docSnap.data()?.email,
            senderName: docSnap.data()?.nama,
            senderPhone: docSnap.data()?.phone,

          });
          setFormError({
            ...formError,
            email: '',
            senderName: '',
            senderPhone: '',

          })
          // console.log('Thing was saved to the database.');
        } else {
          // Do nothing!
          console.log('Thing was not saved to the database.');
        }
        // console.log("Document data:", docSnap.data());
      } else {
        // docSnap.data() will be undefined in this case
        console.log("No such document!");
      }

    } catch (e) {
      console.log(e.message)
    }
  }
  console.log(orders)
  // console.log(ordersErr)
  // if (loadingProd) {
  //   return 'loading...'
  // }
  return (
    <div className="container">
      <Header />
      <h1 className="page-title">Form Order</h1>
      <div className="form-container">
        <div className="form-section">
          <div className="salesField">
            {/* <div className="form-group sales-name">
              <Form.Label className="label">Sales</Form.Label>
              <Form.Select className="select" name="salesName" value={formData.salesName} onChange={handleFormChange}>
                <option>Pilih Nama Sales</option>
                {salesOptions.map(sales => (
                  <option key={sales.id} value={sales.name}>{sales.name}</option>
                ))}
              </Form.Select>
              <button className="button button-tertiary" onClick={openModal}>Tambah Sales</button>
            </div> */}
            <div className="form-group">
              <Form.Label className="label">Email Pengirim</Form.Label>
              <Form.Control className="input" type="text" name="email" placeholder="nashir@example.com" value={formData.email} onChange={handleFormChange} />
            </div>
            <div className="form-group">
              <Form.Label className="label">Nama Pengirim</Form.Label>
              <Form.Control required isInvalid={formError.senderName ? true : false} className="input" type="text" name="senderName" placeholder="Nashir" value={formData.senderName} onChange={handleFormChange} />
              {
                formError.senderName && <Form.Control.Feedback type="invalid">
                  {formError.senderName}
                </Form.Control.Feedback>
              }
            </div>

            <div className="form-group">
              <Form.Label className="label">No Hp Pengirim </Form.Label>
              <PhoneInput
                onBlur={(e) => handleCheckPhone(formData.senderPhone)}
                inputClass='input'
                inputStyle={{ width: '100%' }}
                name='senderPhone'
                country={'id'} // Set a default country
                value={formData.senderPhone}
                onChange={handleFormChange}
                enableSearch={true} // Enable search in the country dropdown
                placeholder="Enter phone number"
              />
              <Form.Control style={{ display: 'none' }} isInvalid={formError.senderPhone ? true : false} onBlur={handleCheckPhone} className="input" type="text" name="senderPhone" placeholder="081xxxxxxx" value={formData.senderPhone} onChange={handleFormChange} onKeyDown={handleKeyDown} />
              {
                formError.senderPhone && <div class="invalid-feedback">
                  {formError.senderPhone}
                </div>
              }
            </div>
          </div>

          {orders.map((order, orderIndex) => (
            <div key={orderIndex} id={`order-${orderIndex}`} className="orders">
              <h3>Orderan {orderIndex + 1}</h3>
              <div className="orderField">
                <div className="form-group">
                  <Form.Label className="label">Nama Penerima</Form.Label>
                  <Form.Control isInvalid={ordersErr?.[orderIndex]?.receiverName ? true : false} className="input" type="text" name="receiverName" placeholder="Nashir" value={order.receiverName} onChange={(e) => handleChange(e, orderIndex)} />
                  {
                    ordersErr?.[orderIndex]?.receiverName && <div class="invalid-feedback">
                      {ordersErr?.[orderIndex]?.receiverName}
                    </div>
                  }
                </div>

                <div className="form-group">

                  <Form.Label className="label">No Hp Penerima (format 62)</Form.Label>
                  <PhoneInput
                    inputClass='input'
                    inputStyle={{ width: '100%' }}
                    name='senderPhone'
                    country={'id'} // Set a default country
                    value={order.receiverPhone}
                    onChange={(e) => handleChange(e, orderIndex)}
                    // onBlur={(e) => handleCheckPhone(order.receiverPhone)}
                    enableSearch={true} // Enable search in the country dropdown
                    placeholder="Enter phone number"
                  />
                  <Form.Control style={{ display: 'none' }} isInvalid={ordersErr?.[orderIndex]?.receiverPhone ? true : false} className="input" type="text" name="receiverPhone" onKeyDown={handleKeyDown}
                    placeholder="081xxxxxxx" value={order.receiverPhone} onChange={(e) => handleChange(e, orderIndex)}

                  />
                  {
                    ordersErr?.[orderIndex]?.receiverPhone && <div class="invalid-feedback">
                      {ordersErr?.[orderIndex]?.receiverPhone}
                    </div>
                  }
                </div>

                <div className="form-group">
                  <Form.Label className="label">Alamat Beserta Kecamatan</Form.Label>
                  <Form.Control isInvalid={ordersErr?.[orderIndex]?.address ? true : false} as="textarea" rows={3} className="textarea" name="address" placeholder="Alamat Lengkap" value={order.address} onChange={(e) => handleChange(e, orderIndex)} />
                  <div className="input-note">Contoh : Kalibata City, 92, Jl. Raya Kalibata No.12, RT.9/RW.4, Rawajati, Kec. Pancoran, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12750</div>
                  {
                    ordersErr?.[orderIndex]?.address && <div class="invalid-feedback">
                      {ordersErr?.[orderIndex]?.address}
                    </div>
                  }
                </div>

                <h3>Produk</h3>

                {order.products.map((product, productIndex) => {

                  return <div key={productIndex} className="productField">
                    <Typeahead
                      id="basic-typeahead"
                      labelKey="nama"
                      onChange={(e) => {
                        handleChange(e, orderIndex, productIndex)
                      }} options={allProduct}
                      placeholder="Products..."
                      selected={product?.prod}
                      className="w-50"
                    />
                    {/* <div className="form-group">
                      <Form.Label className="label">Nama Produk</Form.Label>
                      <Form.Select isInvalid={ordersErr?.[orderIndex]?.products?.[productIndex]?.nama ? true : false} className="select" name="nama" value={product?.id} onChange={(e) => {
                        handleChange(e, orderIndex, productIndex)
                      }}>
                        <option selected hidden >Nama Produk</option>
                        {
                          allProduct?.map?.((prod) => {
                            return <option value={prod?.id} >{prod?.nama}</option>
                          })
                        }
                      </Form.Select>
                      {
                        ordersErr?.[orderIndex]?.products?.[productIndex]?.nama && <div class="invalid-feedback">
                          {ordersErr?.[orderIndex]?.products?.[productIndex]?.nama}
                        </div>
                      }
                    </div> */}

                    <div className="productInfo">
                      <div className="form-group">
                        <Form.Label className="label">Quantity</Form.Label>
                        <Form.Control max={product?.stock} style={{}} onWheel={(e) => e.target.blur()} isInvalid={ordersErr?.[orderIndex]?.products?.[productIndex]?.quantity ? true : false} className="input" type="number" name="quantity" placeholder="Quantity" value={product.quantity} onChange={(e) => handleChange(e, orderIndex, productIndex)} />
                        {
                          product?.stock &&
                          <Form.Label>Stock {product?.stock}</Form.Label>

                        }
                        {
                          ordersErr?.[orderIndex]?.products?.[productIndex]?.quantity && <div class="invalid-feedback">
                            {ordersErr?.[orderIndex]?.products?.[productIndex]?.quantity}
                          </div>
                        }
                      </div>

                      <div className="form-group">
                        <Form.Label className="label">Price</Form.Label>
                        <Form.Control className="input" type="text" name="price" placeholder="Price" disabled value={currency(product.price)} onChange={(e) => handleChange(e, orderIndex, productIndex)} />
                      </div>
                      <div className="form-group" style={{ marginRight: '-5px' }}>
                        <Form.Label className="label" style={{ whiteSpace: 'nowrap', width: '90px', }}>Type </Form.Label>
                        <Form.Select style={{ borderTopRightRadius: '0px', borderBottomRightRadius: '0px' }} className="select" name="discount_type" value={product?.discount_type} onChange={(e) => {
                          handleChange(e, orderIndex, productIndex)
                        }}>
                          <option selected hidden >Type</option>
                          {
                            ['%', 'Rp']?.map?.((prod) => {
                              return <option value={prod} >{prod}</option>
                            })
                          }
                        </Form.Select>
                      </div>
                      <div className="form-group" style={{ marginLeft: '-5px' }}>
                        <Form.Label className="label">Discount</Form.Label>
                        <Form.Control style={{ borderTopLeftRadius: '0px', borderBottomLeftRadius: '0px' }} onWheel={(e) => e.target.blur()} className="input" type="number" name="discount" placeholder="Discount" value={product.discount} onChange={(e) => handleChange(e, orderIndex, productIndex)} />
                      </div>

                      <div className="form-group">
                        <Form.Label className="label">Amount</Form.Label>
                        <Form.Control className="input" type="text" name="amount" placeholder="Amount" disabled value={currency(product.amount)} onChange={(e) => handleChange(e, orderIndex, productIndex)} />
                      </div>
                    </div>
                  </div>
                })}

                <button className="button button-tertiary" onClick={() => addProductField(orderIndex)}>Tambah Produk</button>
                {order.products.length > 1 && (
                  <button className="button button-red" onClick={() => deleteLastProductField(orderIndex)}>Delete Produk</button>
                )}



                <div className="form-group">
                  <Form.Label className="label">Kurir</Form.Label>

                  <Form.Select disabled={!order.products?.[0]?.nama} isInvalid={ordersErr?.[orderIndex]?.kurir ? true : false} defaultValue={order.kurir} defaultChecked={false} className="select" name="kurir" value={order.kurir} onChange={(e) => handleChange(e, orderIndex)}>
                    <option selected hidden >Kurir</option>

                    {
                      ListKurir?.map((kur) => {
                        return <option value={kur}>{kur}</option>
                      })
                    }
                    {/* <Form.Control placeholder='Tambah kurir baru' className='input' onBlur={handleAddOption} />    */}
                  </Form.Select>
                  {
                    ordersErr?.[orderIndex]?.kurir && <div class="invalid-feedback">
                      {ordersErr?.[orderIndex]?.kurir}
                    </div>
                  }
                  {
                    !order.products?.[0]?.nama &&
                    <div style={{ color: 'red', fontSize: '10px' }}>
                      Silahkan pilih produk terlebih dahulu
                    </div>
                  }
                </div>

                {order?.kurir === 'Biteship' ?
                  <>
                    <div className="form-group">
                      <MapComponent setKoordinateReceiver={setKoordinateReceiver} koordinateReceiver={koordinateReceiver} />

                    </div>
                    <div className="form-group">
                      <Form.Label className="label">Jenis Service</Form.Label>

                      <Form.Select className="select" name="kurirService"
                        disabled={loadingRate}
                        value={order?.kurirService?.courier_service_code}
                        // value={`${order?.kurirService?.courier_name}, ${order?.kurirService?.courier_service_name}, ${order?.kurirService?.duration}, Rp.${order?.kurirService?.price}` || ''}
                        onChange={(e, value) => {
                          // console.log(value)
                          handleChange(e, orderIndex,)

                        }}>
                        <option selected hidden >{loadingRate ? 'loading..' : 'Jenis Service'}</option>
                        {listService?.[orderIndex]?.map((kur) => {
                          return <option value={kur?.courier_service_code}><span>{kur?.courier_name}, {kur?.courier_service_name}, {kur?.duration}, Rp.{kur?.price}</span>

                          </option>;
                        })}
                      </Form.Select>
                    </div>
                    {/* <div className="form-group">

                      <Form.Label className="label">Service</Form.Label>
                      <Form.Select className="select" name="kurirProduk" value={order.kurirProduk} onChange={(e) => handleChange(e, orderIndex)}>
                        <option selected hidden >Service</option>
                        {SAPProduct?.map((kur) => {
                          return <option value={kur?.product_code}>{kur?.product_name}</option>;
                        })}
                      </Form.Select>
                    </div>
                  
                  </> : kurirAktif === 'LALAMOVE' ?
                    <><div className="form-group">
                      <Form.Label className="label">Jenis Service</Form.Label>

                      <Form.Select className="select" name="kurirService" value={order.kurirService} onChange={(e) => handleChange(e, orderIndex)}>
                        <option selected hidden >Jenis Service</option>
                        {listService?.map((kur) => {
                          return <option key={kur?.service_type_code ? kur?.service_type_code : kur || ''} value={kur?.service_type_code ? kur?.service_type_code : kur || ''}>{kur?.service_type_name ? kur?.service_type_name : kur || ''}</option>;
                        })}
                      </Form.Select>
                    </div> */}
                  </>
                  : null

                }
                <div className="form-group">
                  <Form.Label className="label">Ongkir</Form.Label>
                  <Form.Control onWheel={(e) => e.target.blur()} isInvalid={ordersErr?.[orderIndex]?.ongkir ? true : false} className="input" type="number" name="ongkir" onChange={(e) => {

                    handleChange(e, orderIndex,)
                  }} value={order?.ongkir} placeholder="Ongkir" />
                  {
                    ordersErr?.[orderIndex]?.ongkir && <Form.Control.Feedback type="invalid">
                      {ordersErr?.[orderIndex]?.ongkir}
                    </Form.Control.Feedback>
                  }
                </div>



                <div className="form-group">
                  <Form.Label className="label">Isi gift card</Form.Label>
                  <textarea className="textarea" type="text" name="giftCard" placeholder="Tulis disini" value={order.giftCard} onChange={(e) => handleChange(e, orderIndex)} />
                </div>
              </div>


            </div>
          ))}

          <div className="form-group button-action">
            <button disabled={orders.length >= 10} className="button button-tertiary" onClick={addOrderField}>Tambah Order</button>
            <button disabled={orders.length >= 10} className="button button-primary" onClick={duplicateOrderField}>Duplicate Order</button>
            {orders.length > 1 && (
              <button className="button button-red" onClick={deleteLastOrderField}>Delete Order</button>
            )}
          </div>
        </div>

        <div style={{
          position: 'sticky', top: 200,
          right: 0,
        }} className="summary-section">
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
            <Form.Control onWheel={(e) => e.target.blur()} className="input" type="number" name="additionalDiscount" placeholder="0" value={formData.additionalDiscount} onChange={handleFormChange} />
          </div>
          <div className="summary-item">
            <Form.Label>Delivery Fee</Form.Label>
            <span>{currency(totalOngkir)}</span>
          </div>
          {/* <div className="summary-item">
            <Form.Form.Label>Tax</Form.Label>
            <span>0.00</span>
          </div> */}
          <div className="summary-item">
            <Form.Label>Total</Form.Label>
            <span>{currency(totalAfterDiskonDanOngkir)}</span>
          </div>
          <div className="submit">
            <button className="button button-primary" onClick={handleShowSaveInvoice}>Save Invoice</button>

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
        onHide={() => setDialogRedirectWAShow({ open: false, id: '' })}
        data={{ ...formData, harga: totalAfterDiskonDanOngkir, link: linkMidtrans }}
      />
      <AddSalesModal isOpen={isModalOpen} onRequestClose={closeModal} />
    </div>
  );
};

export default AddOrder;