import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-phone-input-2/lib/style.css';
import 'react-bootstrap-typeahead/css/Typeahead.css';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { arrayRemove, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { firestore, storage } from '../../FirebaseFrovider';
import { deleteObject, getDownloadURL, ref, uploadString } from 'firebase/storage';
import { Button } from 'react-bootstrap';
import { Border, PlusLg, XCircle, XCircleFill } from 'react-bootstrap-icons';
import { useSnackbar } from 'notistack';

export default function DetailProduct() {
    const { productId } = useParams();
    const fileInputRef = useRef();
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };
    const [form, setForm] = useState({
        weight: 0,
        height: 0,
        width: 0,
        length: 0,
        nama: '',
        sku: '',
        harga: 0,
        stok: 0,
        thumbnail: [],
        description: ''
    });
    const [error, setError] = useState({
        weight: '',
        height: '',
        width: '',
        length: '',
        nama: '',
        sku: '',
        harga: '',
        stok: '',
        thumbnail: '',
        description: ''
    });

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        if (e.target.type === 'number') {

            setForm({ ...form, [name]: parseInt(value) });


        } else {
            setForm({ ...form, [name]: value });
        }

        setError({
            ...error,
            [name]: ''
        })

    };
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const docRef = doc(firestore, 'product', productId);

        const unsubscribe = onSnapshot(
            docRef,
            (doc) => {
                if (doc.exists()) {
                    setForm(doc.data());
                } else {
                    // setError("Document does not exist");
                }
                setLoading(false);
            },
            (error) => {
                // setError(error.message);
                setLoading(false);
            }
        );

        // Cleanup subscription on component unmount
        return () => unsubscribe();
    }, [productId]);

    // thumbnail
    const handleUploadProduct = async (e) => {
        const file = e.target.files[0];
        const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
        const maxFileSize = 512000; // 500 KB

        if (!allowedTypes.includes(file.type)) {
            setError((prev) => ({
                ...prev,
                thumbnail: `Tipe file tidak didukung: ${file.type}`,
            }));
            return;
        }

        if (file.size >= maxFileSize) {
            setError((prev) => ({
                ...prev,
                thumbnail: `Ukuran file terlalu besar > 500KB`,
            }));
            return;
        }

        const reader = new FileReader();

        reader.onabort = () => {
            setError((prev) => ({
                ...prev,
                thumbnail: `Proses pembacaan file dibatalkan`,
            }));
        };

        reader.onerror = () => {
            setError((prev) => ({
                ...prev,
                thumbnail: "File tidak bisa dibaca",
            }));
        };

        reader.onload = async () => {
            setError((prev) => ({
                ...prev,
                thumbnail: "",
            }));
            setLoading(true);

            try {
                // Prepare Storage Reference
                const thumbnailExt = file.name.substring(file.name.lastIndexOf("."));
                const thumbnailPath = `products/${productId}/thumbnail_${Date.now()}${thumbnailExt}`;
                const thumbnailRef = ref(storage, thumbnailPath);

                // Upload File
                await uploadString(thumbnailRef, reader.result, "data_url");

                // Get Download URL
                const thumbnailUrl = await getDownloadURL(thumbnailRef);

                // Update Firestore
                const prodDocRef = doc(firestore, "product", productId);
                const updatedThumbnail = [...(form?.thumbnail ?? []), thumbnailUrl];

                await setDoc(
                    prodDocRef,
                    {
                        ...form,
                        thumbnail: updatedThumbnail,
                        updatedAt: serverTimestamp(),
                    },
                    { merge: true }
                );

                // Update Local State
                setForm((currentForm) => ({
                    ...currentForm,
                    thumbnail: updatedThumbnail,
                }));
            } catch (error) {
                setError((prev) => ({
                    ...prev,
                    thumbnail: error.message,
                }));
            } finally {
                setLoading(false);
            }
        };

        reader.readAsDataURL(file);
    };

    const handleDeleteThumb = (thumb) => async (e) => {
        e.preventDefault(); // Prevent the default behavior (e.g., form submission or page refresh)
        console.log(thumb);
        if (window.confirm("Anda yakin ingin menghapus thumbnail ini?")) {
            if (thumb) {
                try {
                    setLoading(true)
                    const storageRef = ref(storage, thumb);
                    await deleteObject(storageRef);
                    console.log("Thumbnail deleted from storage!");

                    // Update Firestore document to remove the thumbnail
                    const prodDocRef = doc(firestore, "product", productId); // Adjust collection and doc ID as needed
                    await updateDoc(prodDocRef, {
                        thumbnail: arrayRemove(thumb),
                    });
                    setForm((prodForm) => ({
                        ...prodForm,
                        thumbnail: prodForm.thumbnail.filter((m) => m !== thumb),
                    }));
                    setLoading(false)
                } catch (e) {
                    setLoading(false)
                    console.log(e.message);
                }
            }
        }
    };
    // validate
    const validate = () => {
        const newError = { ...error };
        // console.log('er')

        if (!form.width) {
            // console.log('er')
            newError.width = 'width is required';
        }

        if (!form.height) {
            newError.height = 'height is required';
        }
        if (!form.weight) {
            newError.weight = 'weight is required';
        }
        if (!form.length) {
            newError.length = 'length is required';
        }
        if (!form.nama) {
            newError.nama = 'nama is required';
        }
        if (!form.sku) {
            newError.sku = 'sku is required';
        }
        if (!form.harga) {
            newError.harga = 'harga is required';
        }
        if (!form.stok) {
            newError.stok = 'stok is required';
        }



        return newError;
    }
    const handleSubmit = async (e) => {
        e.preventDefault();
        const findErros = validate();
        if (Object.values(findErros).some((err) => err !== '')) {
            console.log('Errors found:', findErros);
            setError(findErros);
        } else {
            try {
                await setDoc(doc(firestore, "product", productId), { ...form, updatedAt: serverTimestamp() });
                // console.log("Document written with ID: ",);
                enqueueSnackbar(`sukses mengedit product ${form?.nama}`, { variant: 'success' })

                navigate(`/products`)



            } catch (e) {
                enqueueSnackbar(`gagal menambahkan product ${e.message}`, { variant: 'error' })

            }
        }
    }

    console.log(form);
    return <div className="container">
        <div className='card' style={{ padding: '20px' }}>
            <h2 style={{ fontWeight: 'bold' }}>
                Edit Product
            </h2>
            <form style={{ padding: '10px', }}>
                <div className='card' style={{ padding: '20px', marginBottom: '20px' }}>
                    <div className="section-title">
                        <h5 style={{ fontWeight: 'bold' }}>
                            Product Information
                        </h5>
                    </div>
                    <div className="mb-3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label className="form-label" for="sku">
                            SKU
                        </label>
                        <div className="" style={{ width: '70%', }}>
                            <input disabled className="form-control" id="sku" readonly="" type="text" value={form?.sku} />

                            <p style={{ fontSize: '10px', color: 'red' }}> SKU tidak bisa di edit setelah terjadi pembelian</p>
                        </div>
                    </div>
                    <div className="mb-3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label className="form-label" for="name">
                            Name
                        </label>
                        <input onChange={handleFormChange} name='nama' style={{ width: '70%', }} className="form-control" id="name" type="text" value={form?.nama} />
                    </div>
                    <div className="mb-3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label className="form-label" for="category">
                            Category
                        </label>
                        <div style={{ width: '70%', }}>
                            <select disabled style={{}} className="form-select" id="category">
                                <option selected="">
                                    Special Edition &gt; Christmast 2024
                                </option>
                            </select>
                            <p style={{ fontSize: '10px', color: 'red' }}> Belum tersedia</p>

                        </div>
                    </div>
                </div>
                <div className='card' style={{ padding: '20px', marginBottom: '20px' }}>
                    <div className="section-title">
                        <h5 style={{ fontWeight: 'bold' }}>
                            Product Detail
                        </h5>
                    </div>
                    <div className="mb-3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label className="form-label" for="product-photo">
                            Product photo
                        </label>
                        <div id="product-photo" style={{ width: '70%', }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'flex-start',
                                    flexWrap: 'wrap',
                                    marginBottom: '4px',
                                    marginTop: '2px',
                                    '& img': {
                                        padding: 3,
                                        // margin: '20px'
                                    }
                                }}>
                                    {form.thumbnail?.map((thumb) => {
                                        const position = thumb?.lastIndexOf?.(".");
                                        const thumbnail300 =
                                            thumb?.substring(0, position) +
                                            "_300x300" +
                                            thumb?.substring(position, position?.length);
                                        // console.log(thumb);
                                        return (
                                            <div className='' style={{ display: 'flex', alignItems: 'flex-start' }}>
                                                <img
                                                    key={thumb}
                                                    src={thumb}
                                                    width="100px"
                                                    height="100px"
                                                    alt=""
                                                    style={{ borderRadius: '7px', }}
                                                />
                                                <button onClick={handleDeleteThumb(thumb)} style={{
                                                    // position: 'absolute',

                                                    marginTop: '-12px',
                                                    marginLeft: '-10px',
                                                    color: 'gray',
                                                    backgroundColor: 'transparent',
                                                    padding: '0px 0px 0px 0px',
                                                    '& :hover': {
                                                        color: '#aaa',
                                                        backgroundColor: '#ddd',
                                                        borderRadius: '50%',
                                                        padding: 3,
                                                    },
                                                    border: 'none',
                                                    borderRadius: '50%',
                                                    marginRight: '5px'
                                                }}>
                                                    <XCircleFill color='red' />
                                                    {/* <HighlightOffIcon
                                                            onClick={handleDeleteThumb(thumb)}
                                                        /> */}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                                {
                                    form?.thumbnail?.length < 10 &&
                                    <div >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            style={{ display: "none" }}
                                            onChange={handleUploadProduct}
                                        />
                                        {/* Custom Bootstrap button */}
                                        <Button style={{ backgroundColor: 'transparent', border: '2px dashed #000', width: '98px', height: '98px' }} disabled={loading} variant="primary" onClick={handleButtonClick}>
                                            <PlusLg color='black' size={30} />
                                        </Button>

                                        {error.thumbnail && (
                                            <p color="error">
                                                {error.thumbnail}
                                            </p>
                                        )}
                                    </div>
                                }
                            </div>

                        </div>
                    </div>
                    <div className="mb-3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label className="form-label" for="description">
                            Description
                        </label>
                        <textarea onChange={handleFormChange} name='description' style={{ width: '70%', }} className="form-control" id="description" rows="5" value={form?.description} />
                    </div>
                </div>
                <div className='card' style={{ padding: '20px', marginBottom: '20px' }}>
                    <div className="section-title">
                        <h5 style={{ fontWeight: 'bold' }}>
                            Harga
                        </h5>
                    </div>
                    <div className="mb-3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label className="form-label" for="harga-satuan">
                            Harga Satuan
                        </label>
                        <input onChange={handleFormChange} name='harga' style={{ width: '70%', }} className="form-control" id="harga-satuan" type="number" value={form?.harga} />
                    </div>
                    <div className="mb-3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label className="form-label" for="cogs">
                            COGS
                        </label>
                        <input style={{ width: '70%', }} className="form-control" id="cogs" type="text" value="RP. 199.000" />
                    </div>
                </div>
                <div className='card' style={{ padding: '20px', marginBottom: '20px' }}>
                    <div className="section-title">
                        <h5 style={{ fontWeight: 'bold' }}>
                            Product Management
                        </h5>
                    </div>
                    <div className="mb-3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label className="form-label" for="product-status">
                            Product Status
                        </label>
                        <select style={{ width: '70%', }} className="form-select" id="product-status">
                            <option selected="">
                                Live
                            </option>
                        </select>
                    </div>
                    <div className="mb-3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label className="form-label" for="product-stock">
                            Product Stock
                        </label>
                        <input onChange={handleFormChange} name='stok' style={{ width: '70%', }} className="form-control" id="product-stock" type="number" value={form?.stok} />
                    </div>
                    <div className="mb-3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label className="form-label" for="warning-stock">
                            Warning Stock
                        </label>
                        <input style={{ width: '70%', }} className="form-control" id="warning-stock" type="number" value="10" />
                    </div>
                </div>
                <div className='card' style={{ padding: '20px', marginBottom: '20px' }}>
                    <div className="section-title">
                        <h5 style={{ fontWeight: 'bold' }}>
                            Berat &amp; Pengiriman
                        </h5>
                    </div>
                    <div className="mb-3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label className="form-label" for="product-weight">
                            Product Weight
                        </label>
                        <input onChange={handleFormChange} name='weight' style={{ width: '70%', }} className="form-control" id="product-weight" type="number" value={form?.weight} />
                    </div>
                    <div className="mb-3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label className="form-label" for="product-size" >
                            Product Size (P x L x T)
                        </label>
                        <div style={{ width: '70%', display: 'flex' }} className='form-container' id="product-size">
                            <input onChange={handleFormChange} name='length' className="form-control d-inline-block" placeholder='Panjang' type="number" value={form?.length} />
                            <input onChange={handleFormChange} name='width' className="form-control d-inline-block" placeholder='Lebar' type="number" value={form?.width} />
                            <input onChange={handleFormChange} name='height' className="form-control d-inline-block" placeholder='Tinggi' type="number" value={form?.height} />
                        </div>
                    </div>
                </div>
                <div className="d-flex justify-content-end">
                    <button onClick={() => navigate('/products')} className="button button-primary" style={{ backgroundColor: '#F05252' }} type="button">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="button button-primary" type="submit">
                        Save
                    </button>
                </div>
            </form>
        </div >
    </div >
}