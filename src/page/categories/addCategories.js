import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
// import { firestore, FieldValue, storage } from '../../../components/FirebaseProvider';
import { useSnackbar } from 'notistack';
import { firestore } from '../../FirebaseFrovider';
import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';

function AddDialog({ dialog: { mode, open, data, id, parent, level }, handleClose }) {
    const { enqueueSnackbar } = useSnackbar();
    console.log(data)
    const [form, setForm] = useState({
        nama: '',
        icon: '',
        products_counter: ''
    });

    const [error, setError] = useState({
        nama: '',
        icon: '',
        products_counter: ''
    });

    const [isSubmitting, setSubmitting] = useState(false);

    useEffect(() => {
        const defaultData = {
            nama: '',
            icon: '',
            products_counter: ''
        };

        const defaultError = {
            nama: '',
            icon: '',
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

    // const handleUploadIcon = async (e) => {
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
