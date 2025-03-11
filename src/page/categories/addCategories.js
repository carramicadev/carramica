import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
// import { firestore, FieldValue, storage } from '../../../components/FirebaseProvider';
import { useSnackbar } from 'notistack';
import { firestore, storage } from '../../FirebaseFrovider';
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { PlusLg } from 'react-bootstrap-icons';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';

function AddDialog({ dialog: { mode, open, data, id, parent, level }, handleClose }) {
    const { enqueueSnackbar } = useSnackbar();
    console.log(data)
    const [form, setForm] = useState({
        nama: '',
        thumbnail: '',
        products_counter: ''
    });

    const [error, setError] = useState({
        nama: '',
        thumbnail: '',
        products_counter: ''
    });

    const [isSubmitting, setSubmitting] = useState(false);
    const fileInputRef = useRef();
const handleButtonClick = () => {
        fileInputRef.current?.click();
    };
    useEffect(() => {
        const defaultData = {
            nama: '',
            thumbnail: '',
            products_counter: ''
        };

        const defaultError = {
            nama: '',
            thumbnail: '',
            products_counter: ''
        };

        if (mode === 'Tambah') {
            setForm(defaultData);
            setError(defaultError);
        } else if (mode === 'Edit') {
            setForm(data);
            setError(defaultError);
        }
    }, [mode, data]);

    const handleChange = (e) => {
        let value = e.target.value;
        if (e.target.type === 'number') {
            value = parseInt(value);
        }

        setForm({
            ...form,
            [e.target.name]: value,
        });

        setError({
            ...error,
            [e.target.name]: ''
        });
    };

    const validate = () => {
        const newError = {};

        if (!form.nama) {
            newError.nama = 'Nama Kategori wajib diisi';
        }


        return newError;
    };

    // thumbnail
    const [loading,setLoading]=useState(false)
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
                const thumbnailPath = `categories/${form?.nama}/thumbnail_${Date.now()}${thumbnailExt}`;
                const thumbnailRef = ref(storage, thumbnailPath);

                // Upload File
                await uploadString(thumbnailRef, reader.result, "data_url");

                // Get Download URL
                const thumbnailUrl = await getDownloadURL(thumbnailRef);
console.log(thumbnailUrl)
                // Update Firestore
                // const prodDocRef = doc(firestore, "product", productId);
                // const updatedThumbnail =  thumbnailUrl;

                // await setDoc(
                //     prodDocRef,
                //     {
                //         ...form,
                //         thumbnail: updatedThumbnail,
                //         updatedAt: serverTimestamp(),
                //     },
                //     { merge: true }
                // );

                // Update Local State
                setForm((currentForm) => ({
                    ...currentForm,
                    thumbnail: thumbnailUrl,
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


    const handleSimpan = async (e) => {
        e.preventDefault();

        const findErrors = validate();
        if (Object.values(findErrors).some(err => err !== '')) {
            setError(findErrors);
        } else {
            setSubmitting(true);
            try {
                // const kategoriCol = firestore.collection(`categories`);

                if (mode === 'Tambah') {
                    addDoc(collection(firestore, "categories"), {
                        ...form,
                        parent,
                        level,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                    // await kategoriCol.add({
                    //     ...form,
                    //     parent,
                    //     level,
                    //     created_at: serverTimestamp(),
                    //     updated_at: serverTimestamp()
                    // });
                } else if (mode === 'Edit') {
                    await setDoc(doc(firestore, "categories", data?.id), { ...form, updatedAt: serverTimestamp() });

                    // await kategoriCol.doc(id).set({
                    //     ...form,
                    //     updated_at: serverTimestamp()
                    // }, { merge: true });

                    enqueueSnackbar('Kategori Berhasil Diperbarui', { variant: "success" });
                }

                handleClose();
            } catch (e) {
                console.log(e.message)
                enqueueSnackbar(e.message, { variant: "error" });
            }
            setSubmitting(false);
        }
    };

    // const handleUploadthumbnail = async (e) => {
    //     const file = e.target.files[0];

    //     if (!['image/svg+xml'].includes(file.type)) {
    //         setError(error => ({
    //             ...error,
    //             icon: `Tipe file tidak didukung: ${file.type}`
    //         }));
    //     } else if (file.size >= 512000) {
    //         setError(error => ({
    //             ...error,
    //             icon: `Ukuran file terlalu besar > 500KB`
    //         }));
    //     } else {
    //         const reader = new FileReader();

    //         reader.onabort = () => {
    //             setError(error => ({
    //                 ...error,
    //                 icon: `Proses pembacaan file dibatalkan`
    //             }));
    //         };

    //         reader.onerror = () => {
    //             setError(error => ({
    //                 ...error,
    //                 icon: 'File tidak bisa dibaca'
    //             }));
    //         };

    //         reader.onload = async () => {
    //             setError(error => ({
    //                 ...error,
    //                 icon: ''
    //             }));
    //             setSubmitting(true);
    //             try {
    //                 const categoriesStorageRef = storage.ref(`categories`);
    //                 const iconExt = file.name.substring(file.name.lastIndexOf('.'));
    //                 const iconRef = categoriesStorageRef.child(`${form.nama}/icon_${Date.now()}${iconExt}`);
    //                 const iconSnapshot = await iconRef.putString(reader.result, 'data_url');
    //                 const iconUrl = await iconSnapshot.ref.getDownloadURL();

    //                 setForm(currentForm => ({
    //                     ...currentForm,
    //                     icon: iconUrl
    //                 }));
    //             } catch (e) {
    //                 setError(error => ({
    //                     ...error,
    //                     icon: e.message
    //                 }));
    //             }
    //             setSubmitting(false);
    //         };

    //         reader.readAsDataURL(file);
    //     }
    // };
console.log(error)
    return (
        <Modal style={{
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            width: '500px',
            height: 'auto',
            overFlowY: 'auto'
        }} show={open} onHide={handleClose} backdrop={isSubmitting ? 'static' : true} keyboard={!isSubmitting}>
            <Modal.Header closeButton>
                <Modal.Title>{mode === "Edit" ? "Edit Kategori" : "Buat Kategori Baru"}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group controlId="nama">
                        <Form.Label>Nama Kategori</Form.Label>
                        <Form.Control
                            type="text"
                            name="nama"
                            value={form.nama}
                            onChange={handleChange}
                            isInvalid={!!error.nama}
                            disabled={isSubmitting}
                        />
                        <Form.Control.Feedback type="invalid">
                            {error.nama}
                        </Form.Control.Feedback>
                    </Form.Group>

                    {/* <Form.Group controlId="icon" className="mt-3">
                        <Form.Label>Icon</Form.Label>
                        <div className="d-flex align-items-center">
                            {form.icon && <img src={form.icon} alt="Preview" style={{ width: '50px', marginRight: '10px' }} />}
                            <Form.Control
                                type="file"
                                accept="image/svg+xml"
                                onChange={handleUploadIcon}
                                isInvalid={!!error.icon}
                                disabled={isSubmitting}
                            />
                        </div>
                        {error.icon && <Alert variant="danger" className="mt-2">{error.icon}</Alert>}
                    </Form.Group> */}

                    {/* <Form.Group controlId="products_counter" className="mt-3">
                        <Form.Label>Products Counter</Form.Label>
                        <Form.Control
                            type="number"
                            name="products_counter"
                            value={form.products_counter}
                            onChange={handleChange}
                            isInvalid={!!error.products_counter}
                            disabled={isSubmitting}
                        />
                        <Form.Control.Feedback type="invalid">
                            {error.products_counter}
                        </Form.Control.Feedback>
                    </Form.Group> */}
                     <Form.Label>Thumbnail</Form.Label>
                     <div>
                         {form.thumbnail&&
                          <img
                                                    key={form?.thumbnail}
                                                    src={form?.thumbnail}
                                                    width="180px"
                                                    height="98"
                                                    alt=""
                                                    style={{ borderRadius: '7px', marginBottom:'10px'}}
                                                />}
                     </div>
                      <div >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            style={{ display: "none" }}
                                            onChange={handleUploadProduct}
                                        />
                                        {/* Custom Bootstrap button */}
                                    {form.thumbnail?
                                    <Button style={{ border: '2px dashed #000',}} variant='outline' onClick={handleButtonClick}>Change</Button>
                                    :
                                        <Button style={{ backgroundColor: 'transparent', border: '2px dashed #000', width: '180px', height: '98px' }} disabled={loading} variant="primary" onClick={handleButtonClick}>
                                            <PlusLg color='black' size={30} />
                                        </Button>}

                                        {error.thumbnail && (
                                            <p color="error">
                                                {error.thumbnail}
                                            </p>
                                        )}
                                    </div>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>Batal</Button>
                <Button variant="primary" onClick={handleSimpan} disabled={isSubmitting}>
                    {isSubmitting ? <Spinner as="span" animation="border" size="sm" /> : mode === 'Edit' ? 'Update' : "Simpan"}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

AddDialog.propTypes = {
    dialog: PropTypes.shape({
        mode: PropTypes.string,
        open: PropTypes.bool,
        data: PropTypes.object,
        id: PropTypes.string,
        parent: PropTypes.string,
        level: PropTypes.number
    }).isRequired,
    handleClose: PropTypes.func.isRequired
};

export default AddDialog;
