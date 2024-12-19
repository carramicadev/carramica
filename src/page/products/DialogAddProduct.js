import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { usePDF } from 'react-to-pdf';
import '../orders/dialogDownload.css';
// import logoFull from './logoFull.png';
// import sap from './sap.png'
// import lalamove from './lalamove.png'
import { addDoc, arrayUnion, collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../FirebaseFrovider';
import { useEffect, useState } from 'react';
import { Col, Form, Row } from 'react-bootstrap';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';

export default function DialogAddProduct(props) {

    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();
    useEffect(() => {
        if (props?.show?.mode === 'edit') {
            setFormData({ ...props?.show?.item })
        }
    }, [props?.show?.mode])
    const [formData, setFormData] = useState({
        weight: 0,
        height: 0,
        width: 0,
        length: 0,
        nama: '',
        sku: '',
        harga: 0,
        stok: 0
    });
    const [formError, setFormError] = useState({
        weight: '',
        height: '',
        width: '',
        length: '',
        nama: '',
        sku: '',
        harga: '',
        stok: ''
    });
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        if (e.target.type === 'number') {

            setFormData({ ...formData, [name]: parseInt(value) });


        } else {
            setFormData({ ...formData, [name]: value });
        }

        setFormError({
            ...formError,
            [name]: ''
        })

    };

    // validate
    const validate = () => {
        const newError = { ...formError };
        // console.log('er')

        if (!formData.width) {
            // console.log('er')
            newError.width = 'width is required';
        }

        if (!formData.height) {
            newError.height = 'height is required';
        }
        if (!formData.weight) {
            newError.weight = 'weight is required';
        }
        if (!formData.length) {
            newError.length = 'length is required';
        }
        if (!formData.nama) {
            newError.nama = 'nama is required';
        }
        if (!formData.sku) {
            newError.sku = 'sku is required';
        }
        if (!formData.harga) {
            newError.harga = 'harga is required';
        }
        if (!formData.stok) {
            newError.stok = 'stok is required';
        }



        return newError;
    }
    const handleAdd = async (e) => {
        e.preventDefault();
        const findErros = validate();
        if (Object.values(findErros).some((err) => err !== '')) {
            // console.log('Errors found:', findErros);
            setFormError(findErros);
        } else {
            try {
                if (props?.show?.mode === 'edit') {
                    await setDoc(doc(firestore, "product", props?.show?.item?.id), { ...formData, updatedAt: serverTimestamp() });
                    // console.log("Document written with ID: ",);
                    enqueueSnackbar(`sukses mengedit product ${formData?.nama}`, { variant: 'success' })

                    props.onHide()
                } else {
                    const tambahProduk = await addDoc(collection(firestore, "product"), { ...formData, createdAt: serverTimestamp() });
                    // console.log("Document written with ID: ",);
                    enqueueSnackbar(`sukses menambahkan product ${formData?.nama}`, { variant: 'success' })
                    navigate(`/products/detailProduct/${tambahProduk?.id}`)

                    props.onHide()
                }
                props?.setUpdate((prevValue) => !prevValue)

            } catch (e) {
                enqueueSnackbar(`gagal menambahkan product ${e.message}`, { variant: 'error' })

            }
        }

    }
    // console.log(formData)
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
                width: '500px',
                height: 'auto',
                overFlowY: 'auto'
            }}
            scrollable={true}
            // {...props}
            show={props?.show?.open}
            onHide={() => {
                props?.onHide()
                setFormData({})
            }}
            backdrop="static"
            keyboard={false}
        >
                <Modal.Header closeButton>
                    <Modal.Title>{props?.show?.mode === 'edit' ? 'Edit Product' : 'Add Produk'}</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{
                    overFlowY: 'auto',
                    maxHeight: 'calc(100vh - 210px)',

                }}><div>
                        <div className="form-group">
                            <label className="label">SKU</label>
                            <Form.Control isInvalid={formError.sku ? true : false}
                                className="input" type="text" name="sku" placeholder="P46YUJH" value={formData.sku} onChange={handleFormChange} />
                            {
                                formError.sku && <Form.Control.Feedback type="invalid">
                                    {formError.sku}
                                </Form.Control.Feedback>
                            }
                        </div>
                        <div className="form-group">
                            <label className="label">Product Name</label>
                            <Form.Control isInvalid={formError.nama ? true : false}
                                className="input" type="text" name="nama" placeholder="Gelas" value={formData.nama} onChange={handleFormChange} />
                            {
                                formError.nama && <Form.Control.Feedback type="invalid">
                                    {formError.nama}
                                </Form.Control.Feedback>
                            }
                        </div>

                        <Row>
                            <Col sm={3}>
                                <div className="form-group">
                                    <label className="label">Weight(gr)</label>
                                    <Form.Control isInvalid={formError.weight ? true : false}
                                        className="input" type="number" name="weight" placeholder="200" value={formData.weight} onChange={handleFormChange} />
                                    {
                                        formError.weight && <Form.Control.Feedback type="invalid">
                                            {formError.weight}
                                        </Form.Control.Feedback>
                                    }
                                </div>
                            </Col>
                            <Col sm={3}>
                                <div className="form-group">
                                    <label className="label">Length(cm)</label>
                                    <Form.Control isInvalid={formError.length ? true : false}
                                        className="input" type="number" name="length" placeholder="30" value={formData.length} onChange={handleFormChange} />
                                    {
                                        formError.length && <Form.Control.Feedback type="invalid">
                                            {formError.length}
                                        </Form.Control.Feedback>
                                    }
                                </div>
                            </Col>
                            <Col sm={3}>
                                <div className="form-group">
                                    <label className="label">Width(cm)</label>
                                    <Form.Control isInvalid={formError.width ? true : false}
                                        className="input" type="number" name="width" placeholder="10" value={formData.width} onChange={handleFormChange} />
                                    {
                                        formError.width && <Form.Control.Feedback type="invalid">
                                            {formError.width}
                                        </Form.Control.Feedback>
                                    }
                                </div>
                            </Col>
                            <Col sm={3}>
                                <div className="form-group">
                                    <label className="label">Height(cm)</label>
                                    <Form.Control isInvalid={formError.height ? true : false}
                                        className="input" type="number" name="height" placeholder="20" value={formData.height} onChange={handleFormChange} />
                                    {
                                        formError.height && <Form.Control.Feedback type="invalid">
                                            {formError.height}
                                        </Form.Control.Feedback>
                                    }
                                </div>
                            </Col>

                        </Row>
                        <div className="form-group">
                            <label className="label">Price</label>
                            <Form.Control isInvalid={formError.harga ? true : false}
                                className="input" type="number" name="harga" placeholder="10000" value={formData.harga} onChange={handleFormChange} />
                            {
                                formError.harga && <Form.Control.Feedback type="invalid">
                                    {formError.harga}
                                </Form.Control.Feedback>
                            }
                        </div>
                        <div className="form-group">
                            <label className="label">Stock</label>
                            <Form.Control isInvalid={formError.stok ? true : false}
                                className="input" type="number" name="stok" placeholder="100" value={formData.stok} onChange={handleFormChange} />
                            {
                                formError.stok && <Form.Control.Feedback type="invalid">
                                    {formError.stok}
                                </Form.Control.Feedback>
                            }
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer
                    style={{ display: 'flex' }}
                >
                    {/* <Button variant="secondary" >
                        Close
                    </Button> */}
                    <button onClick={handleAdd} className="button button-primary" >{props?.show?.mode === 'edit' ? 'Update' : 'Add'}</button>

                    {/* <button className="button button-primary" >Understood</button> */}
                </Modal.Footer>
            </Modal>
        </div>
    );
}