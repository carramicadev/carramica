import React, { useEffect, useRef, useState } from 'react';
import { Button, ButtonGroup, Card, Col, Form, OverlayTrigger, Row, Table, Tooltip } from 'react-bootstrap';
import { CSVLink } from 'react-csv';
import Header from './Header';
import { useFirestoreQuery, useFirestoreQueryData } from '@react-query-firebase/firestore';
import {
  query,
  collection,
  limit,
  orderBy,
  onSnapshot,
  getDocs,
  startAfter,
  endBefore,
  limitToLast,
  getDoc,
  doc,
  updateDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  deleteDoc,
  // limit,
  // QuerySnapshot,
  // DocumentData,
} from "firebase/firestore";
import { firestore, functions } from './FirebaseFrovider';
import DownloadPdfDialog from './DialogDonwloadPdf';
import formatDate, { currency } from './formatter';
import { BoxFill, CloudArrowDown, Filter, FilterSquare, GraphUp, PencilSquare, PeopleFill, TrashFill, Whatsapp, XCircleFill } from 'react-bootstrap-icons';
import DatePicker from 'react-datepicker';
import { set } from 'date-fns';
import { FilterDialog } from './FilterOrdersDialog';
import { httpsCallable } from 'firebase/functions';
import { useSnackbar } from 'notistack';
import { FilterColumnDialog } from './FilterColumnDialog';
import { useAuth } from './AuthContext';
import DownloadInvoiceDialog from './DialogInvoice';
import Scrollbars from 'react-custom-scrollbars-2';
// import RSC, { Scrollbar } from "react-scrollbars-custom";
import './orders.css';
import DialogSendWA from './DialogSendWA';
import EditOrders from './DialogEditOrder';

const OrderList = () => {
  const { currentUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allFilters, setAllFilters] = useState([]);

  const [modalDownload, setModalDownload] = useState({
    open: false,
    data: [],
    userId: currentUser?.uid,
  });
  const [invoiceDialog, setInvoiceDialog] = useState({
    open: false,
    data: []
  });
  const [sendWADialog, setSendWADialog] = useState({
    open: false,
    data: [],
    type: '',
    message: ''
  });
  const [editDialog, setEditDialog] = useState({
    open: false,
    data: {},
    userId: currentUser?.uid,
  });
  const [user, setUser] = useState([]);

  // get settings doc
  // const settingsRef = collection(firestore, "settings");
  const settingsRef = doc(firestore, 'settings', 'counter');

  const [settings, setSettings] = useState({});

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

  // query coll orders
  const [list, setList] = useState([]);
  const [page, setPage] = useState(1);
  const [update, setUpdate] = useState(false);
  const [edit, setEdit] = useState(null);
  const [length, setLength] = useState(20);
  const listLength = [5, 10, 20, 50];
  const handleChangeLength = (e) => {
    setLength(e.target.value)
    if (startDate && endDate) {
      // console.log('run')
      filterByDate(startDate, endDate, e.target.value)
    }
    setPage(1)
  }
  // filter
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [dateTimestamp, setDateTimestamp] = useState({
    start: null,
    end: null
  })
  const [filterDialog, setFilterDialog] = useState(false);
  const [filterColomDialog, setFilterColomDialog] = useState(false)
  // get total order
  const [allOrders, setAllOrders] = useState([]);
  const lengthAll = allOrders.length

  const paidLength = allOrders.filter(ord => ord?.paymentStatus === 'settlement').length
  useEffect(() => {
    // const fetchData = async () => {
    const getDoc = query(collection(firestore, "orders"), where('totalHargaProduk', '!=', ''));
    const unsubscribe = onSnapshot(getDoc, (snapshot) => {
      const updatedData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllOrders(updatedData); // Update the state with the new data
    });
    return () => unsubscribe();
    // };
    // fetchData();
  }, []);
  // console.log(lengthAll)
  // getUserColl
  useEffect(() => {
    const fetchData = async () => {
      const getDoc = query(collection(firestore, "users"));
      const documentSnapshots = await getDocs(getDoc);
      var items = [];

      documentSnapshots.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
        // doc.data() is never undefined for query doc snapshots
      });
      // console.log('first item ', items[0])
      setUser(items);
    };
    fetchData();
  }, []);
  // getordersColl
  useEffect(() => {
    const getDoc = query(collection(firestore, "orders"), orderBy("createdAt", "desc"), limit(length));
    const unsubscribe = onSnapshot(getDoc, (snapshot) => {
      const updatedData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setList(updatedData); // Update the state with the new data
    });
    return () => unsubscribe();
  }, [length]);
  // console.log(list)
  const showNext = ({ item }) => {
    if (list.length === 0) {
      alert("Thats all we have for now !")
    } else {
      let filter = []
      if (dateTimestamp.end) {
        filter.push(where("createdAt", ">=", dateTimestamp?.start), where("createdAt", "<=", dateTimestamp?.end))
      }
      const getDoc = query(collection(firestore, "orders"), ...filter, ...allFilters, orderBy("createdAt", "desc"), startAfter(item.createdAt), limit(length));
      const unsubscribe = onSnapshot(getDoc, (snapshot) => {
        const updatedData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setList(updatedData); // Update the state with the new data
      });
      setPage(page + 1)
      return () => unsubscribe();

    }
  };

  const showPrevious = ({ item }) => {
    const getDoc = query(collection(firestore, "orders"), ...allFilters, orderBy("createdAt", "desc"), endBefore(item.createdAt), limitToLast(length));
    const unsubscribe = onSnapshot(getDoc, (snapshot) => {
      const updatedData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setList(updatedData); // Update the state with the new data
    });
    setPage(page - 1)
    return () => unsubscribe();

  };
  // console.log(new Date().getTime().toString())

  // filter by date
  const handleSelect = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
    if (start && end) {
      filterByDate(start, end)

    }
  };
  const filterByDate = async (start, end) => {
    try {
      const yearStart = start.getFullYear();
      const monthStart = String(start.getMonth() + 1).padStart(2, '0'); // Months are 0-based
      const dayStart = String(start.getDate()).padStart(2, '0');
      const formattedDateStart = `${yearStart}-${monthStart}-${dayStart}`;
      // end
      const yearEnd = end.getFullYear();
      const monthEnd = String(end.getMonth() + 1).padStart(2, '0'); // Months are 0-based
      const dayEnd = String(end.getDate()).padStart(2, '0');
      const formattedDateEnd = `${yearEnd}-${monthEnd}-${dayEnd}`;
      // 
      const startTimestamp = Timestamp.fromDate(new Date(formattedDateStart));
      const endTimestamp = Timestamp.fromDate(set(new Date(formattedDateEnd), {
        hours: 23,
        minutes: 59,
        seconds: 59,
        milliseconds: 999

      }));
      const ref = query(collection(firestore, "orders"), where("createdAt", ">=", startTimestamp), where("createdAt", "<=", endTimestamp), orderBy('createdAt', 'desc'), limit(length));
      const unsubscribe = onSnapshot(ref, (snapshot) => {
        const updatedData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setList(updatedData); // Update the state with the new data
      });
      // orders
      const refOrd = query(collection(firestore, "orders"), where("createdAt", ">=", startTimestamp), where("createdAt", "<=", endTimestamp), orderBy('createdAt', 'desc'));
      const querySnapshotOrd = await getDocs(refOrd);
      const documentsOrd = querySnapshotOrd.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllOrders(documentsOrd)
      setDateTimestamp({
        start: startTimestamp,
        end: endTimestamp
      })
      setPage(1)
      return () => unsubscribe();
    } catch (e) {
      console.log(e.message)
    }
  }
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1)
  };


  let mapData = []
  const reBuildData = list?.map?.((item, idx) => {
    // console.log(JSON.stringify(item?.invoices))

    return item?.orders?.map((ord, i) => {
      const discount = ord?.products?.map(prod => prod?.discount > 0 ? parseInt(prod?.discount) : 0);
      const allDiscount = discount?.reduce((val, nilaiSekarang) => {
        return val + nilaiSekarang
      }, 0);
      const gross = ord?.products?.map(prod => parseInt(prod?.amount));
      const allGross = gross?.reduce((val, nilaiSekarang) => {
        return val + nilaiSekarang
      }, 0);
      const calculate = parseInt(allGross) + parseInt(ord?.ongkir);

      // find user
      const userData = user.find(itm => itm.userId === item.userId);
      const resiCreatedBy = user.find(itm => itm.userId === ord.resiCreatedBy);
      const downloadedBy = user.find(itm => itm.userId === ord.downloadedBy);
      const TruncatedText = ({ text, maxLength }) => {
        // If the text is longer than maxLength, truncate it and add ellipsis
        const truncated = text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;

        return truncated;
      };
      const ordId = String(settings?.orderId - (i + idx)).padStart(4, '0');

      mapData.push({
        invoice_id: item?.invoice_id,
        id: item?.id,
        senderName: item?.senderName,
        senderPhone: item?.senderPhone,
        receiverName: ord?.receiverName,
        receiverPhone: ord?.receiverPhone,
        nama: ord?.products?.map((prod, i) => `${prod?.nama}X${ord?.products?.[i]?.quantity}, `),
        // quantity: ord?.products?.map(prod => `${prod?.quantity}, `),
        createdAt: item?.createdAt,
        paymentStatus: item?.paymentStatus,
        paidAt: item?.midtransRes?.settlement_time,
        dueDate: item?.midtransRes?.expiry_time,
        discount: allDiscount,
        grossRevenue: calculate,
        kurir: ord?.kurirService ? ord?.kurirService?.courier_name : ord?.kurir,
        resi: ord?.resi,
        resiUpdate: item?.[`resiUpdate${[i]}`],
        address: <TruncatedText text={ord?.address} maxLength={20} />,
        giftCard: ord?.giftCard,
        unixId: `${item.id}_${i}`,
        original: { ...ord, id: `${item.id}_${i}` },
        isDownloaded: ord?.isDownloaded,
        pdf: item?.invoice?.pdf_url,
        isInvWASent: item?.isInvWASent,
        isResiWASent: ord?.isResiWASent,
        isResiSentToWASender: ord?.isResiSentToWASender,
        link: item?.midtrans?.redirect_url,
        harga: item?.totalHargaProduk + item?.totalOngkir,
        ordId: ord?.orderId ?? ord?.ordId,
        sales: `${userData?.firstName || ''} ${userData?.lastName || ''}`,
        resiCreatedBy: `${resiCreatedBy?.firstName || ''} ${resiCreatedBy?.lastName || ''}`,
        downloadedBy: `${downloadedBy?.firstName || ''} ${downloadedBy?.lastName || ''}`,
        hargaAfterDiscProd: allGross,
        shippingCost: ord?.ongkir

      })

    })
  });
  // const mapData = mapData.map((ord, i) => {
  //   const invId = ord?.invoice_id?.split('-')?.[2]
  //   const ordId = String(settings?.orderId - i).padStart(4, '0');

  //   return {
  //     ...ord,
  //     ordId: `OS-${invId}-${ordId}`
  //   }
  // })
  console.log(allOrders)
  const filteredData = mapData?.filter?.(
    item =>
      item.senderName?.toLowerCase?.().includes?.(searchTerm.toLowerCase()) ||
      item.senderPhone?.toLowerCase?.().includes?.(searchTerm.toLowerCase()) ||
      item.nama?.toString()?.toLowerCase?.().includes?.(searchTerm.toLowerCase()) ||
      item.receiverName?.toLowerCase?.().includes?.(searchTerm.toLowerCase()) ||
      item.receiverPhone?.toLowerCase?.().includes?.(searchTerm.toLowerCase())

  );

  const paidOrd = allOrders?.filter(ord => ord?.paymentStatus === 'settlement')
  const arrayHarga = paidOrd.map((data) => data.totalHargaProduk)
  const totalOmset = arrayHarga?.reduce((val, nilaiSekarang) => {
    return val + nilaiSekarang
  }, 0);

  // checkbox
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(mapData.map(item => item.unixId));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (e, unixId) => {
    if (e.target.checked) {
      setSelectedRows([...selectedRows, unixId]);
    } else {
      setSelectedRows(selectedRows.filter(rowId => rowId !== unixId));
    }
  };

  // get invoice
  const handleCLickInvoice = async (e) => {
    try {

    } catch (e) {

    }
  }

  const selectedData = mapData?.filter?.(item => selectedRows.includes(item.unixId));
  const filterForDownloadAll = selectedData.filter(item => !item.isDownloaded && item.paymentStatus === 'settlement')
  // console.log(arrayHarga);

  // change resi
  const handleChange = async (e, unixId) => {
    try {
      if (e.target.value !== '') {
        // console.log(e.target.value, unixId);

        const idOrder = unixId?.split('_')?.[0]
        const indexOrder = parseInt(unixId?.split('_')?.[1])
        // console.log(idOrder, indexOrder)

        const getDocOrd = doc(firestore, 'orders', idOrder);
        const getDataOrd = await getDoc(getDocOrd)
        const arrayField = getDataOrd.data().orders

        // console.log(currentUser)
        // Update the specific item
        arrayField[indexOrder] = { ...arrayField[indexOrder], resi: e.target.value, resiCreatedBy: currentUser?.uid };

        // Update the document with the modified array
        await updateDoc(getDocOrd, { orders: arrayField, updatedAt: serverTimestamp(), [`resiUpdate${indexOrder}`]: serverTimestamp() });
        setEdit(null)
        setUpdate((prevValue) => !prevValue)
      }



    } catch (e) {
      console.log(e.message)
    }
    // setUpdate(false)
  }

  // wa
  const sendMessage = async (data) => {
    try {
      const message = `Halo ${data?.senderName},\n
Thank you for purchasing our product!.\n
Total pembayaran Anda adalah Rp. ${data?.harga}\n\n

Silahkan melakukan pembayaran melalui link berikut : ${data?.link}\n\n

Kabarin ya jika ada kendala. Harap konfirmasi jika telah berhasil.\n 
Thank you 😊`
      const url = `https://wa.me/${data?.senderPhone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');

      await setDoc(doc(firestore, 'orders', data.id), {
        isInvWASent: true
      }, { merge: true });
      // console.log('run')
      setUpdate((prevValue) => !prevValue)

    } catch (e) {
      console.log(e.message)
    }
  };

  const sendMessageResi = async (data) => {
    try {
      const message = `Halo ${data?.receiverName},\n\n
Berikut resi pembelian produk Carramica dari ${data?.senderName}. untuk order id ${data?.unixId}.\n\n
 ${data?.resi}\n
Menggunakan kurir: ${data?.kurir}\n\n

Thank you :)`
      const url = `https://wa.me/${data?.receiverPhone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');

      const indexOrder = parseInt(data?.unixId?.split('_')?.[1])
      const getDocOrd = doc(firestore, 'orders', data?.id);
      const getDataOrd = await getDoc(getDocOrd)
      const arrayField = getDataOrd.data().orders


      // if (itemIndex !== -1) {
      // Update the specific item
      arrayField[indexOrder] = { ...arrayField[indexOrder], isResiWASent: true };

      // Update the document with the modified array
      await updateDoc(getDocOrd, { orders: arrayField });
      setUpdate((prevValue) => !prevValue)

    } catch (e) {
      console.log(e.message)
    }
  };

  const sendResiToSender = async (data) => {
    try {
      const message = `Halo ${data?.senderName}, berikut resi pengiriman kamu untuk produk Carramica atas nama ${data?.receiverName}. \n\n
 ${data?.resi}\n
 Kurir: ${data?.kurir}\n\n

Thank you :)`
      const url = `https://wa.me/${data?.senderPhone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');

      const indexOrder = parseInt(data?.unixId?.split('_')?.[1])
      const getDocOrd = doc(firestore, 'orders', data?.id);
      const getDataOrd = await getDoc(getDocOrd)
      const arrayField = getDataOrd.data().orders


      // if (itemIndex !== -1) {
      // Update the specific item
      arrayField[indexOrder] = { ...arrayField[indexOrder], isResiSentToWASender: true };

      // Update the document with the modified array
      await updateDoc(getDocOrd, { orders: arrayField });
      setUpdate((prevValue) => !prevValue)

    } catch (e) {
      console.log(e.message)
    }
  };

  // create invoice
  const handlecreateInv = async (id) => {
    try {
      const invoice = httpsCallable(functions, 'createInvoice');
      const result = await invoice({
        id: id,

      });
      setUpdate((prevValue) => !prevValue)
      enqueueSnackbar('invoice berhasil dibuat, silahkan cklick ulang invoice id untuk melihat invoice!', { variant: 'success' })
    } catch (e) {
      console.log(e.message)
    }
  }

  // qontak
  const sendWAToSender = async ({ data }) => {
    try {
      const getToken = httpsCallable(functions, 'qontakSendWAToSender');
      const result = await getToken({
        no: data?.receiverName
      });
      console.log(result)
    } catch (e) {

    }
  }

  // delete
  const handleDeleteClick = async (id) => {
    if (window.confirm(' apakah anda yakin ingin menghapus product ini?')) {
      try {
        const docRef = doc(firestore, 'orders', id);
        await deleteDoc(docRef);
        setUpdate((prevValue) => !prevValue)
        enqueueSnackbar(`Order berhasil dihapus!.`, { variant: 'success' })
      } catch (e) {
        enqueueSnackbar(`Order gagal dihapus!.`, { variant: 'error' })

        console.log(e.message)
      }
    } else {

    }

    // setData(data.filter((row) => row.id !== id));
  };
  // header 
  // console.log(edit)
  const [column, setColumn] = useState([
    {
      label: 'Invoice Id', key: (item, i, idOrder) => idOrder === 0 && <a href='#'
        // onClick={() => { item?.pdf ? window.open(item.pdf) : item?.dueDate && handlecreateInv(item?.id) }} 
        onClick={() => setInvoiceDialog({ open: true, data: [item], })}
        style={
          // !item?.dueDate ? { color: 'lightgray', pointerEvents: 'none' } : 
          { color: 'black' }}>{item?.invoice_id}</a>, style: {}
    },
    { label: "Order Id", key: (item) => item?.ordId, style: {} },
    { label: "Nama pengirim", key: (item) => item?.senderName, style: {} },
    { label: "No Pengirim", key: (item) => item?.isInvWASent ? <p style={{ color: 'gray' }}>{item?.senderPhone}</p> : <a style={{ textDecoration: 'underline' }} href='#' onClick={() => setSendWADialog({ open: true, data: item, type: 'pembayaran', message: 'Kirim link pembayaran ke pengirim?' })}>{item?.senderPhone}</a>, style: {} },
    { label: "Nama Penerima", key: (item) => item?.receiverName, style: {} },
    { label: "No Penerima", key: (item) => item?.isResiWASent ? <p style={{ color: 'gray' }}>{item?.receiverPhone}</p> : item?.resi ? <a style={{ textDecoration: 'underline' }} href='#' onClick={() => setSendWADialog({ open: true, data: item, type: 'resi_to_receiver', message: 'Kirim resi ke pemerima?' })}>{item?.receiverPhone}</a> : item?.receiverPhone, style: {} },
    { label: "Alamat", key: (item) => item?.address, style: {} },

    {
      label: "Product", key: (item) => item?.nama?.map((line, index) => (
        <div key={index}>{line}</div>
      )), style: {}
    },
    { label: "Date Order", key: (item) => formatDate(item?.createdAt?.toDate()), style: {} },
    { label: "Payment Status", key: (item, i, idOrder, style) => <li style={style}>{item?.resi ? 'Sent' : item?.paymentStatus === 'settlement' ? 'Processing' : 'Unpaid'}</li>, style: {} },
    { label: "Paid At", key: (item) => item?.paidAt, style: {} },
    { label: "Due Date", key: (item) => item?.dueDate, style: {} },
    { label: "Discount", key: (item) => item?.discount, style: {} },
    { label: "Gross Revenue", key: (item) => currency(item?.grossRevenue), style: {} },
    { label: "Shipping Info", key: (item) => item?.kurir, style: {} },
    { label: "Shipping Cost", key: (item) => currency(item?.shippingCost), style: {} },
    {
      label: "Resi", key: (item, i, idOrder, style, edit) => item.resi && edit !== i ? <div style={{ display: 'flex', justifyContent: 'space-between' }}><button disabled={item?.isResiSentToWASender} className='btn btn-outline-secondary' onClick={() => setSendWADialog({ open: true, data: item, type: 'resi_to_sender', message: 'Kirim resi ke pengirim?' })
      } style={item?.isResiSentToWASender ? { padding: '0px', width: '20px', margin: '0px 2px 0px 0px', backgroundColor: 'lightgray' } : { padding: '0px', width: '20px', margin: '0px 2px 0px 0px' }} size='sm'><Whatsapp size={12} color={item?.isResiSentToWASender ? 'gray' : 'green'} /></button>{item.resi} <Button onClick={() => setEdit(i)} style={{ padding: '0px', width: '20px', margin: '0px 0px 0px 2px' }} size='sm'><PencilSquare size={12} /></Button> </div> : edit === i ? <input style={{ whiteSpace: 'nowrap', width: '60px', fontSize: '8px', padding: '3px' }} className='input'
        // value={item?.resi || ''}
        placeholder="Input Resi"
        defaultValue={item?.resi}
        // onChange={(e) => handleChange(e, 'age')}
        onBlur={(e) => handleChange(e, item.unixId)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleChange(e, item.unixId)
          }
        }}
      /> : <input disabled={item?.paymentStatus !== 'settlement'} style={{ whiteSpace: 'nowrap', width: '60px', fontSize: '8px', padding: '3px' }} className='input'
        // value={item?.resi || ''}
        placeholder="Input Resi"
        // onChange={(e) => handleChange(e, 'age')}
        onBlur={(e) => handleChange(e, item.unixId)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleChange(e, item.unixId)
          }
        }}
      />, style: {}
    },
    { label: "Resi Update", key: (item) => item.resiUpdate ? formatDate(item?.resiUpdate?.toDate()) : '', style: {} },
    { label: "Resi Crated By", key: (item) => item.resiCreatedBy, style: {} },
    {
      label: "Download ", key: (item, i) => <button style={item.isDownloaded ? { backgroundColor: 'lightgray', padding: '5px' } : item?.paymentStatus === 'settlement' ? { padding: '5px' } : { backgroundColor: 'red', padding: '5px' }} disabled={item?.isDownloaded || item?.paymentStatus !== 'settlement'} onClick={() => {
        setLoading(true)
        setModalDownload({ userId: currentUser?.uid, open: true, data: [item], index: i, userId: currentUser?.uid })
      }} className="button button-primary">{item.isDownloaded ? 'Downloaded' : 'Download'}</button>, style: {}
    },
    { label: "Downloaded By", key: (item) => item.downloadedBy, style: {} },
    { label: "Ceated By", key: (item) => item?.sales, style: {} },


  ]);
  const newColumn = {
    label: "Action", key: (item) => <>
      {/* <button style={{ backgroundColor: '#998970' }} onClick={() => setEditDialog({ open: true, data: item })} className="button button-primary"><PencilSquare /></button> */}
      <button style={{ backgroundColor: 'red' }} className="button button-primary" onClick={() => handleDeleteClick(item?.id)}>
        <TrashFill />
      </button></>, style: {}
  }

  const findUser = user.find(itm => itm.userId === currentUser?.uid)

  const [selectColumn, setSelectColumn] = useState(column)

  const columnRef = doc(firestore, "settings", "rules", "column", currentUser?.uid);

  useEffect(() => {
    const unsub = onSnapshot(columnRef, (doc) => {
      const source = doc.metadata.hasPendingWrites ? "Local" : "Server";
      // console.log(source, " data: ", doc.data());
      const selectedData = column?.filter?.(item => doc.data()?.columnOrder?.includes(item.label));
      if (selectedData.length > 0) {
        setSelectColumn(selectedData)
        if (doc.data()?.columnOrder?.find(itm => itm === 'Action')) {
          setSelectColumn(prevCol => [...prevCol, newColumn]);
        }
      }
      // console.log(selectedData)
    });
    return () => unsub
  }, []);
  // if (loadng) {
  //   return 'loadng...'
  // }



  // test scroll
  const tableContainerRef = useRef(null);
  const verticalScrollRef = useRef(null);

  useEffect(() => {
    const tableContainer = tableContainerRef.current;
    const verticalScroll = verticalScrollRef.current;

    if (tableContainer && verticalScroll) {
      const syncScroll = () => {
        verticalScroll.scrollLeft = tableContainer.scrollLeft;
      };

      tableContainer.addEventListener("scroll", syncScroll);
      verticalScroll.addEventListener("scroll", () => {
        tableContainer.scrollLeft = verticalScroll.scrollLeft;
      });

      // Show or hide the vertical scroll based on table visibility
      const toggleVerticalScroll = () => {
        const rect = tableContainer.getBoundingClientRect();
        verticalScroll.style.display =
          rect.top <= window.innerHeight && rect.bottom >= window.innerHeight
            ? "block"
            : "none";
      };

      window.addEventListener("scroll", toggleVerticalScroll);

      // Initial check
      toggleVerticalScroll();

      return () => {
        tableContainer.removeEventListener("scroll", syncScroll);
        window.removeEventListener("scroll", toggleVerticalScroll);
      };
    }
  }, []);
  return (
    <div className="container">

      <Header />
      <h1 className="page-title">Order</h1>
      {/* <div className="form-container"> */}

      {/* <div className="form-section"> */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
        <DatePicker
          style={{ borderRadius: '10px' }}
          selected={startDate}
          onChange={handleSelect}
          startDate={startDate}
          endDate={endDate}
          selectsRange
          showIcon
        // icon
        // inline
        />
      </div>
      <Row className="mb-4">
        <Col md={3}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  Total Order
                </div>
                <div style={{ backgroundColor: 'rgb(229 228 255)', borderRadius: '35%', width: '50px', height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <PeopleFill color="#8280FF" />
                </div>

              </Card.Title>
              <Card.Text>
                <h3 style={{ margin: '0px' }}>{lengthAll}</h3>
                {/* <small className="text-success">↑ 8.5% Up from last month</small> */}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  Total Paid Order
                </div>
                <div style={{ backgroundColor: 'rgb(255 243 217)', borderRadius: '35%', width: '50px', height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <BoxFill color="#FEC53D" />
                </div>

              </Card.Title>
              <Card.Text>
                <h3 style={{ margin: '0px' }}>{paidLength}</h3>
                {/* <small className="text-success">↑ 1.3% Up from last month</small> */}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  Revenue
                </div>
                <div style={{ backgroundColor: '#d9f7e8', borderRadius: '35%', width: '50px', height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <GraphUp color="#4AD991" />
                </div>

              </Card.Title>
              <Card.Text>
                <h3 style={{ margin: '0px' }}>{currency(totalOmset)}</h3>
                {/* <small className="text-danger">↓ 4.3% Down from last month</small> */}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  Unpaid
                </div>
                <div style={{ backgroundColor: '#ffded1', borderRadius: '35%', width: '50px', height: '50px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <XCircleFill color="#FF9066" />
                </div>

              </Card.Title>
              <Card.Text>
                <h3 style={{ margin: '0px' }}>{lengthAll - paidLength}</h3>
                {/* <small className="text-danger">↓ 4.3% Unpaid</small> */}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex' }}>
          <div>
            <input
              className="input"
              style={{ width: '300px', borderRadius: '5px', padding: '9px ', marginTop: '10px' }}
              type="text"
              placeholder="Search by name, phone, or product"
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <div style={{ display: 'flex', marginTop: '10px' }}>
            <OverlayTrigger
              delay={{ hide: 450, show: 300 }}
              overlay={(props) => (
                <Tooltip {...props}>
                  Filter
                </Tooltip>
              )}
              placement="bottom"
            >
              <button style={{
                // marginTop: '0px',
                marginLeft: '10px',
                // padding: '0px',
              }} onClick={() => setFilterDialog(true)} className="btn btn-outline-secondary btn-sm" variant='secondary'><Filter /></button>
            </OverlayTrigger>
            {/* <FilterSquare size={60} /> */}
            <button style={{
              // marginTop: '0px',
              marginLeft: '10px',
              whiteSpace: 'nowrap'
            }} onClick={() => setFilterColomDialog(true)} className="btn btn-outline-secondary btn-sm" variant='secondary'>Custom Column</button>
          </div>
        </div>
        <div style={{}}>
          <CSVLink style={{ width: '150px', marginRight: '10px', whiteSpace: 'nowrap' }} data={selectedData.length > 0 ? selectedData : mapData} separator={";"} filename={"table_orders.csv"} className="btn btn-outline-secondary">
            <CloudArrowDown /> Export As CSV
          </CSVLink>
          <button onClick={() => {
            setLoading(true)
            setModalDownload({ userId: currentUser?.uid, open: true, data: filterForDownloadAll, })
          }} className="button button-primary">Download</button>
        </div>
      </div>
      <div >
        <div
          // ref={scrollRef}
          // onWheel={handleWheel} 
          style={{ maxWidth: '100vw', overflowX: 'scroll', }}
        >
          {/* <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0
        }}>
          swn
        </div> */}
          {/* <Scrollbar elementRef={scrollRef} id="RSC-Example" style={{ width: "100vw", height: "60%" }}> */}
          {/* {renderAmountOfParagraphs(25, { style: { width: "249%" } })} */}
          {/* <Scrollbars style={{ width: '100vw', height: 250 }}> */}

          {/* Section 3: Table */}
          <div className="section-table" id="table-section">
            <div className="table-container" ref={tableContainerRef}>
              <Table style={{ fontSize: '10px', position: 'sticky', bottom: '20px' }} striped bordered hover>

                <thead>
                  <tr style={{ whiteSpace: 'nowrap' }}>
                    <th>
                      <input className="form-check-input" type="checkbox" checked={selectedRows.length === mapData.length}
                        onChange={handleSelectAll} id="flexCheckChecked" />
                    </th>
                    {
                      selectColumn.map((col, i) => (
                        <th key={i}>{col?.label}</th>
                      ))
                    }
                  </tr>
                </thead>
                <tbody>
                  {filteredData?.map?.((item, i) => {
                    // console.log(i === edit)
                    const idOrder = parseInt(item.unixId.split('_')?.[1]);
                    let style = {
                      borderRadius: '20px', backgroundColor: '#FBD5D5', padding: '5px', textAlign: 'center', color: '#C81E1E'
                    }
                    if (item.paymentStatus === 'pending') {
                      style = {
                        borderRadius: '20px', backgroundColor: '#E5E9FC', padding: '5px', textAlign: 'center', color: '#141BBA'
                      }
                    } else if (item.paymentStatus === 'paid' || item.paymentStatus === 'settlement') {
                      style = {
                        borderRadius: '20px', backgroundColor: '#ECFDF3', padding: '5px', textAlign: 'center', color: '#14BA6D'
                      }
                    }
                    return <tr key={item.unixId} style={{ whiteSpace: 'nowrap' }}>
                      <td>
                        <input type="checkbox"
                          checked={selectedRows.includes(item.unixId)}
                          onChange={(e) => handleSelectRow(e, item.unixId)} />
                      </td>
                      {selectColumn.map((col, colIndex) => (
                        <td key={colIndex} style={col.style}>{col.key(item, i, idOrder, style, edit)}</td>
                      ))}

                    </tr>
                  })}
                </tbody>
              </Table>
            </div>
          </div>

          {/* Fixed vertical scrollbar under the table */}
          <div
            id="table-vertical-scroll"
            className="table-vertical-scroll"
            ref={verticalScrollRef}
          >
            <div
              id="table-vertical-scroll-content"
              className="table-vertical-scroll-content"
            ></div>
          </div>
          {/* </Scrollbars> */}
          {/* </ Scrollbar> */}
          {/* <div style={styles.scrollbarWrapper}>
            <div style={styles.horizontalScrollbar} onScroll={handleScroll}>
              <div style={styles.fakeContent}></div>
            </div>
          </div> */}
        </div>
        {/* Fixed Horizontal Scrollbar */}

      </div>

      <ButtonGroup style={{ textAlign: 'center', float: 'right' }}>
        <div>
          <Form.Select style={{
            width: 'auto',
            marginTop: '10px',
            marginRight: '10px',
            // fontSize: '10px'
          }} defaultChecked={false} className="select" name="length" onChange={handleChangeLength} value={length}>
            {/* <option selected hidden >Kurir</option> */}

            {
              listLength?.map((kur) => {
                return <option value={kur}>{kur} Rows </option>
              })
            }
            {/* <Form.Control placeholder='Tambah kurir baru' className='input' onBlur={handleAddOption} />    */}
          </Form.Select>
        </div>
        {/* //show previous button only when we have items */}
        <Button disabled={page === 1} style={{ marginRight: '10px', whiteSpace: 'nowrap', backgroundColor: '#3D5E54', border: 'none' }} onClick={() => showPrevious({ item: list[0] })}>{'<-Prev'}</Button>
        <input value={page} className="input" disabled style={{
          padding: '0px',
          width: '40px',
          marginRight: '10px',
          textAlign: 'center',
          border: 'none',
          marginBottom: '8px',
          marginTop: '8px'
        }} />
        {/* //show next button only when we have items */}
        <Button disabled={filteredData.length < 20} style={{ whiteSpace: 'nowrap', backgroundColor: '#3D5E54', border: 'none' }} onClick={() => showNext({ item: filteredData[filteredData.length - 1] })}>{'Next->'}</Button>
      </ButtonGroup>

      <DownloadPdfDialog
        setUpdate={setUpdate}
        show={modalDownload}
        onHide={() => setModalDownload({ userId: currentUser?.uid, open: false, data: [], index: '' })}
        loading={loading}
        setLoading={setLoading}
      // handlePayment={handlePayment}
      // loading={loading}
      />
      <DownloadInvoiceDialog
        setUpdate={setUpdate}
        show={invoiceDialog}
        allOrders={allOrders}
        onHide={() => setInvoiceDialog({ open: false, data: [], index: '' })}
      // handlePayment={handlePayment}
      // loading={loading}
      />
      <DialogSendWA
        // setUpdate={setUpdate}
        show={sendWADialog}
        // allOrders={allOrders}
        onHide={() => setSendWADialog({ open: false, data: [], index: '' })}
      // handlePayment={handlePayment}
      // loading={loading}
      />
      <FilterDialog
        show={filterDialog}
        handleClose={() => setFilterDialog(false)}
        setList={setList}
        dateTimestamp={dateTimestamp}
        setAllOrders={setAllOrders}
        length={length}
        setAllFilters={setAllFilters}
        setPage={setPage}
      />
      <FilterColumnDialog
        show={filterColomDialog}
        handleClose={() => setFilterColomDialog(false)}
        setSelectColumn={setSelectColumn}
        dateTimestamp={dateTimestamp}
        setAllOrders={setAllOrders}
        column={column}
        selectColumn={selectColumn}
        user={user}
        setColumn={setColumn}
        newColumn={newColumn}
      />
      <EditOrders
        show={editDialog}
        handleClose={() => setEditDialog({ open: false, data: {} })}

      />
      {/* </div> */}
      {/* </div> */}
    </div>
  );
};
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'relative',
  },
  scrollableWrapper: {
    flexGrow: 1,
    overflowY: 'auto', // Allow vertical scrolling for content
  },
  scrollbarWrapper: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    // width: '100%',
    backgroundColor: 'white',
    zIndex: 200, // Make sure it's above the content
    paddingTop: '5px',
  },
  horizontalScrollbar: {
    // width: '100%',
    height: '20px',
    overflowX: 'auto',
  },
  fakeContent: {
    width: '2000px', // Match the content width to ensure the scrollbar appears
    height: '1px', // Small height so it's only for the scrollbar
  },
};

export default OrderList;