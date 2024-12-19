import { useFirestoreQueryData } from "@react-query-firebase/firestore";
import { collection, doc, getDoc, query, runTransaction } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import PhoneInput from 'react-phone-input-2';
import MapComponent from "../../components/MapComponent";
import { firestore, functions } from "../../FirebaseFrovider";
import { currency } from "../../formatter";
// import MapComponent from "./MapComponent";

export default function EditOrders(props) {
    const { enqueueSnackbar } = useSnackbar();

    const [ListKurir, setListKurir] = useState(['Biteship', 'Dedicated']);
    const [koordinateReceiver, setKoordinateReceiver] = useState({
        lat: '',
        lng: ''
    })
    const [loadingRate, setLoadingRate] = useState(false);
    const [listService, setListService] = useState([]);

    // const { toPDF, targetRef } = usePDF({ filename: 'page.pdf' });
    const item = props?.show?.data;
    // console.log(props?.show?.userId)
    const [order, setOrder] = useState({
        receiverName: '',
        receiverPhone: '62',
        address: '',
        kecamatan: '',
        kurir: '',
        ongkir: 0,
        giftCard: '',
        kurirProduk: '',
        products: [{ nama: '', quantity: 1, price: '', discount: '', amount: '' }]
    });
    const [ordersErr, setOrdersErr] = useState({
        receiverName: '',
        receiverPhone: '',
        address: '',
        kecamatan: '',
        kurir: '',
        ongkir: '',
        giftCard: '',
        kurirProduk: '',
        products: [{ nama: '', quantity: '', price: '', discount: '', amount: '' }]
    });
    const handleChange = async (e, productIndex) => {
        const { name, value, type } = !Array.isArray(e) && e.target;
        if (productIndex !== undefined) {
            const docRef = name === 'nama' ? doc(firestore, "product", value) : doc(firestore, "product", 'value');
            const docSnap = await getDoc(docRef);
            // console.log("Document data:", docSnap?.data());

            if (docSnap.exists()) {
                // console.log("Document data:", docSnap.data());
            } else {
                // docSnap.data() will be undefined in this case
                console.log("No such document!");
            }
            const products = order.products.map((product, j) => {
                const hargaProd = product?.price;
                let hargaAmountAfterDiscon = parseInt(product?.price) * parseInt(product?.quantity);
                if (name === 'discount_type' && value === '%' && product?.discount) {
                    console.log('%')
                    hargaAmountAfterDiscon = (1 - (parseInt(product?.discount ? product?.discount : 0) / 100)) * hargaAmountAfterDiscon

                } else if (name === 'discount_type' && value === 'Rp' && product?.discount) {
                    console.log('Rp')
                    hargaAmountAfterDiscon = hargaAmountAfterDiscon - parseInt(product?.discount ? product?.discount : 0)
                } else if (name === 'discount' && product?.discount_type === '%') {
                    hargaAmountAfterDiscon = (1 - (parseInt(value ? value : 0) / 100)) * hargaAmountAfterDiscon
                } else if (name === 'discount' && product?.discount_type === 'Rp') {
                    console.log('Rp')
                    hargaAmountAfterDiscon = hargaAmountAfterDiscon - parseInt(value ? value : 0)
                }
                // console.log(hargaAmountAfterDiscon)
                return j === productIndex ? Array.isArray(e) ? { ...product, prod: e, nama: e?.[0]?.nama, price: e?.[0]?.harga, weight: e?.[0]?.weight, height: e?.[0]?.height, width: e?.[0]?.width, length: e?.[0]?.length, amount: e?.[0]?.harga, sku: e?.[0]?.sku, id: e?.[0]?.id, stock: e?.[0]?.stok, discount: 0, discount_type: '', quantity: 1 } : name === 'quantity' ? { ...product, [name]: parseInt(value), amount: product?.discount_type === '%' ? ((1 - (product?.discount / 100)) * (hargaProd * parseInt(value))) : hargaProd * parseInt(value) - parseInt(product?.discount ? product.discount : 0) } : name === 'discount_type' ? { ...product, [name]: value, amount: hargaAmountAfterDiscon } : { ...product, [name]: parseInt(value), amount: hargaAmountAfterDiscon } : product
            });
            setOrder({
                ...order,
                products: products
            })
        } else {
            const selectedObj = listService?.find?.(option => option?.courier_service_code === value);
            const updateOrder = typeof e !== 'object' ? { ...order, receiverPhone: e } : name === 'kurir' ? { ...order, [name]: value, ongkir: '' } : name === 'kurirService' ? { ...order, [name]: selectedObj, ongkir: selectedObj?.price } : { ...order, [name]: value }
            setOrder(updateOrder)
        }


        setOrdersErr({
            ...ordersErr,
            [name]: ''
        })
    };

    const ref = query(collection(firestore, "product"),
        // limit(10),
    );

    // Provide the query to the hook
    const { data: allProduct, isLoading: loadingProd, error: err } = useFirestoreQueryData(["product"], ref, {
        subscribe: true,
        idField: "id",
    });
    // console.log(allProduct)
    const addProductField = () => {
        setOrder({
            ...order,
            products: [...order.products, { nama: '', quantity: '', price: '', discount: '', amount: '' }]
        })
    };

    const deleteLastProductField = () => {
        setOrder({
            ...order,
            products: order.products.slice(0, -1)
        })
    };
    const updateOrder = async () => {
        try {

            const indexOrder = parseInt(item?.unixId?.split('_')?.[1], 10);
            const getDocOrd = doc(firestore, 'orders', item?.id);

            // Use Firestore transaction to ensure consistent updates
            await runTransaction(firestore, async (transaction) => {
                const getDataOrd = await transaction.get(getDocOrd);

                if (!getDataOrd.exists()) {
                    throw new Error(`Document with ID ${item?.id} does not exist`);
                }

                const arrayField = getDataOrd.data().orders;

                // Update only if the array element is not already marked as downloaded
                if (!arrayField[indexOrder]?.isDownloaded) {
                    arrayField[indexOrder] = { ...arrayField[indexOrder], ...order };

                    // console.log('Updated orders array:', arrayField);

                    // Perform the update within the transaction
                    transaction.update(getDocOrd, { orders: arrayField });
                }
            });

            // Trigger UI updates
            // props?.setUpdate((prevValue) => !prevValue);
            props?.handleClose();

        } catch (e) {
            console.log(`Error updating document: ${e.message}`);
        }
    };
    useEffect(() => {
        if (props?.show?.data?.original) {
            setOrder(props?.show?.data?.original)
        }
    }, [props?.show?.data?.original]);
    // console.log(order);

    useEffect(() => {
        // console.log('run')

        if (order.products?.length > 0 && koordinateReceiver?.lat && koordinateReceiver.lng) {
            const ordersProduct = order.products?.map((prod) => {
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


                    setOrder({
                        ...order,
                        ongkir: '', kurirService: ''
                    })
                    setListService([]);
                    setLoadingRate(true)
                    const result = await helloWorld({
                        items: ordersProduct,
                        origin_latitude: -6.197150,
                        origin_longitude: 106.699000,
                        destination_latitude: koordinateReceiver?.lat,
                        destination_longitude: koordinateReceiver?.lng,
                    });
                    // console.log(result.data?.items)
                    setListService(result.data?.items?.pricing);
                    setLoadingRate(false)
                } catch (error) {
                    setLoadingRate(false)
                    enqueueSnackbar(`gagal mendapatkan ongkir, ${error.message}`, { variant: 'error' })
                    console.log("Error calling function:", error.message);
                    setListService([]);
                }
            }
            getService()

        }

    }, [order?.products, koordinateReceiver?.lat, koordinateReceiver?.lng]);

    // const arrayId = item?.map((ord) => ord?.unixId);
    const nameOfPdf = item?.length > 1 ? new Date().toLocaleString().replace(/ /g, '_').replace(',', '').replace('/', '-').replace('/', '-').replace(/:/g, '-') : item?.[0]?.unixId
    // console.log(new Date().toLocaleString().replace(/ /g, '_').replace(',', '').replace('/', '-').replace('/', '-'))
    return (
        <div
            className="modal show"
            style={{ display: 'block', position: 'initial' }}
        > <Modal
            size='lg'
            style={{
                top: '50%',
                left: '50%',
                right: 'auto',
                bottom: 'auto',
                marginRight: '-50%',
                transform: 'translate(-50%, -50%)',
                width: 'auto',
                height: 'auto',
                overFlowY: 'auto'
            }}
            scrollable={true}
            // {...props}
            show={props?.show?.open}
            onHide={props?.handleClose}
            backdrop="static"
            keyboard={false}
        >
                <Modal.Header closeButton>
                    <Modal.Title>Edit Order </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{
                    overFlowY: 'auto',
                    maxHeight: 'calc(100vh - 210px)',

                }}>


                    <div className="orderField">
                        <div className="form-group">
                            <Form.Label className="label">Nama Penerima</Form.Label>
                            <Form.Control isInvalid={ordersErr?.receiverName ? true : false} className="input" type="text" name="receiverName" placeholder="Nashir" value={order.receiverName} onChange={handleChange} />
                            {
                                ordersErr?.receiverName && <div class="invalid-feedback">
                                    {ordersErr?.receiverName}
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
                                onChange={handleChange}
                                // onBlur={(e) => handleCheckPhone(order.receiverPhone)}
                                enableSearch={true} // Enable search in the country dropdown
                                placeholder="Enter phone number"
                            />
                            <Form.Control style={{ display: 'none' }} isInvalid={ordersErr?.receiverPhone ? true : false} className="input" type="text" name="receiverPhone"
                                placeholder="081xxxxxxx" value={order.receiverPhone} onChange={handleChange}

                            />
                            {
                                ordersErr?.receiverPhone && <div class="invalid-feedback">
                                    {ordersErr?.receiverPhone}
                                </div>
                            }
                        </div>

                        <div className="form-group">
                            <Form.Label className="label">Alamat Beserta Kecamatan</Form.Label>
                            <Form.Control isInvalid={ordersErr?.address ? true : false} as="textarea" rows={3} className="textarea" name="address" placeholder="Alamat Lengkap" value={order.address} onChange={handleChange} />
                            <div className="input-note">Contoh : Kalibata City, 92, Jl. Raya Kalibata No.12, RT.9/RW.4, Rawajati, Kec. Pancoran, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12750</div>
                            {
                                ordersErr?.address && <div class="invalid-feedback">
                                    {ordersErr?.address}
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
                                        handleChange(e, productIndex)
                                    }} options={allProduct}
                                    placeholder="Products..."
                                    selected={product?.prod}
                                    className="w-50"
                                />
                                {/* <div className="form-group">
                                    <Form.Label className="label">Nama Produk</Form.Label>
                                    <Form.Select isInvalid={ordersErr?.products?.[productIndex]?.nama ? true : false} className="select" name="nama" value={product?.id} onChange={(e) => {
                                        handleChange(e, productIndex)
                                    }}>
                                        <option selected hidden >Nama Produk</option>
                                        {
                                            allProduct?.map?.((prod) => {
                                                return <option value={prod?.id} >{prod?.nama}</option>
                                            })
                                        }
                                    </Form.Select>
                                    {
                                        ordersErr?.products?.[productIndex]?.nama && <div class="invalid-feedback">
                                            {ordersErr?.products?.[productIndex]?.nama}
                                        </div>
                                    }
                                </div> */}

                                <div className="productInfo">
                                    <div className="form-group">
                                        <Form.Label className="label">Quantity</Form.Label>
                                        <Form.Control max={product?.stock} style={{}} onWheel={(e) => e.target.blur()} isInvalid={ordersErr?.products?.[productIndex]?.quantity ? true : false} className="input" type="number" name="quantity" placeholder="Quantity" value={product.quantity} onChange={(e) => handleChange(e, productIndex)} />
                                        {
                                            product?.stock &&
                                            <Form.Label>Stock {product?.stock}</Form.Label>

                                        }
                                        {
                                            ordersErr?.products?.[productIndex]?.quantity && <div class="invalid-feedback">
                                                {ordersErr?.products?.[productIndex]?.quantity}
                                            </div>
                                        }
                                    </div>

                                    <div className="form-group">
                                        <Form.Label className="label">Price</Form.Label>
                                        <Form.Control className="input" type="text" name="price" placeholder="Price" disabled value={currency(product.price)} onChange={(e) => handleChange(e, productIndex)} />
                                    </div>

                                    <div className="form-group" style={{ marginRight: '-5px' }}>
                                        <Form.Label className="label">Discount</Form.Label>
                                        <Form.Control style={{ borderTopRightRadius: '0px', borderBottomRightRadius: '0px' }} onWheel={(e) => e.target.blur()} className="input" type="number" name="discount" placeholder="Discount" value={product.discount} onChange={(e) => handleChange(e, productIndex)} />
                                    </div>
                                    <div className="form-group" style={{ marginLeft: '-5px' }}>
                                        <Form.Label className="label" style={{ whiteSpace: 'nowrap', width: '90px', }}>Type </Form.Label>
                                        <Form.Select style={{ borderTopLeftRadius: '0px', borderBottomLeftRadius: '0px' }} className="select" name="discount_type" value={product?.discount_type} onChange={(e) => {
                                            handleChange(e, productIndex)
                                        }}>
                                            <option selected hidden >Type</option>
                                            {
                                                ['%', 'Rp']?.map?.((prod) => {
                                                    return <option value={prod} >{prod}</option>
                                                })
                                            }
                                        </Form.Select>
                                    </div>
                                    <div className="form-group">
                                        <Form.Label className="label">Amount</Form.Label>
                                        <Form.Control className="input" type="text" name="amount" placeholder="Amount" disabled value={currency(product.amount)} onChange={(e) => handleChange(e, productIndex)} />
                                    </div>
                                </div>
                            </div>
                        })}

                        <button className="button button-tertiary" onClick={() => addProductField()}>Tambah Produk</button>
                        {order.products.length > 1 && (
                            <button className="button button-red" onClick={() => deleteLastProductField()}>Delete Produk</button>
                        )}



                        <div className="form-group">
                            <Form.Label className="label">Kurir</Form.Label>

                            <Form.Select disabled={!order.products?.[0]?.nama} isInvalid={ordersErr?.kurir ? true : false} defaultValue={order.kurir} defaultChecked={false} className="select" name="kurir" value={order.kurir} onChange={handleChange}>
                                <option selected hidden >Kurir</option>

                                {
                                    ListKurir?.map((kur) => {
                                        return <option value={kur}>{kur}</option>
                                    })
                                }
                                {/* <Form.Control placeholder='Tambah kurir baru' className='input' onBlur={handleAddOption} />    */}
                            </Form.Select>
                            {
                                ordersErr?.kurir && <div class="invalid-feedback">
                                    {ordersErr?.kurir}
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
                                <div className="form-group" style={{ position: 'relative', zIndex: 10000 }}>
                                    <MapComponent setKoordinateReceiver={setKoordinateReceiver} koordinateReceiver={koordinateReceiver} />

                                </div>
                                <div className="form-group">
                                    <Form.Label className="label">Jenis Service</Form.Label>

                                    <Form.Select className="select" name="kurirService"
                                        disabled={loadingRate}
                                        value={order?.kurirService?.courier_service_code}
                                        // value={`${order?.kurirService?.courier_name}, ${order?.kurirService?.courier_service_name}, ${order?.kurirService?.duration}, Rp.${order?.kurirService?.price}` || ''}
                                        onChange={handleChange}>
                                        <option selected hidden >{loadingRate ? 'loading..' : 'Jenis Service'}</option>
                                        {listService?.map((kur) => {
                                            return <option value={kur?.courier_service_code}><span>{kur?.courier_name}, {kur?.courier_service_name}, {kur?.duration}, Rp.{kur?.price}</span>

                                            </option>;
                                        })}
                                    </Form.Select>
                                </div>
                                {/* <div className="form-group">

                      <Form.Label className="label">Service</Form.Label>
                      <Form.Select className="select" name="kurirProduk" value={order.kurirProduk} onChange={handleChange}>
                        <option selected hidden >Service</option>
                        {SAPProduct?.map((kur) => {
                          return <option value={kur?.product_code}>{kur?.product_name}</option>;
                        })}
                      </Form.Select>
                    </div>
                  
                  </> : kurirAktif === 'LALAMOVE' ?
                    <><div className="form-group">
                      <Form.Label className="label">Jenis Service</Form.Label>

                      <Form.Select className="select" name="kurirService" value={order.kurirService} onChange={handleChange}>
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
                            <Form.Control onWheel={(e) => e.target.blur()} isInvalid={ordersErr?.ongkir ? true : false} className="input" type="number" name="ongkir" onChange={handleChange} value={order?.ongkir} placeholder="Ongkir" />
                            {
                                ordersErr?.ongkir && <Form.Control.Feedback type="invalid">
                                    {ordersErr?.ongkir}
                                </Form.Control.Feedback>
                            }
                        </div>



                        <div className="form-group">
                            <Form.Label className="label">Isi gift card</Form.Label>
                            <textarea className="textarea" type="text" name="giftCard" placeholder="Tulis disini" value={order.giftCard} onChange={handleChange} />
                        </div>
                    </div>                </Modal.Body>
                <Modal.Footer
                    style={{ display: 'flex' }}
                >
                    <Button variant="secondary" onClick={updateOrder}>
                        Update
                    </Button>
                    {/* <button onClick={downloadPdf} className="button button-primary" >DownloadPdf</button> */}

                </Modal.Footer>
            </Modal>
        </div>
    );
}