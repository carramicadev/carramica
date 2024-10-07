import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { usePDF } from 'react-to-pdf';
import './dialogDownload.css';
import logoFull from './logoFull.png';
import sap from './sap.png'
import lalamove from './lalamove.png'
import { addDoc, arrayUnion, collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { firestore } from './FirebaseFrovider';
import { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { useSnackbar } from 'notistack';

export default function DialogAddProduct(props) {

    const { enqueueSnackbar } = useSnackbar();

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

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        if (e.target.type === 'number') {

            setFormData({ ...formData, [name]: parseInt(value) });


        } else {
            setFormData({ ...formData, [name]: value });
        }

    };
    const handleAdd = async () => {
        try {
            if (props?.show?.mode === 'edit') {
                await setDoc(doc(firestore, "product", props?.show?.item?.id), { ...formData, updatedAt: serverTimestamp() });
                // console.log("Document written with ID: ",);
                enqueueSnackbar(`sukses mengedit product ${formData?.nama}`, { variant: 'success' })

                props.onHide()
            } else {
                await addDoc(collection(firestore, "product"), { ...formData, createdAt: serverTimestamp() });
                // console.log("Document written with ID: ",);
                enqueueSnackbar(`sukses menambahkan product ${formData?.nama}`, { variant: 'success' })

                props.onHide()
            }
            props?.setUpdate((prevValue) => !prevValue)

        } catch (e) {
            enqueueSnackbar(`gagal menambahkan product ${e.message}`, { variant: 'error' })

        }
    }
    // console.log(props)
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
                            <input className="input" type="text" name="sku" placeholder="P46YUJH" value={formData.sku} onChange={handleFormChange} />
                        </div>
                        <div className="form-group">
                            <label className="label">Product Name</label>
                            <input className="input" type="text" name="nama" placeholder="Gelas" value={formData.nama} onChange={handleFormChange} />
                        </div>

                        <Row>
                            <Col sm={3}>
                                <div className="form-group">
                                    <label className="label">Weight(gr)</label>
                                    <input className="input" type="number" name="weight" placeholder="200" value={formData.weight} onChange={handleFormChange} />
                                </div>
                            </Col>
                            <Col sm={3}>
                                <div className="form-group">
                                    <label className="label">Length(cm)</label>
                                    <input className="input" type="number" name="length" placeholder="30" value={formData.length} onChange={handleFormChange} />
                                </div>
                            </Col>
                            <Col sm={3}>
                                <div className="form-group">
                                    <label className="label">Width(cm)</label>
                                    <input className="input" type="number" name="width" placeholder="10" value={formData.width} onChange={handleFormChange} />
                                </div>
                            </Col>
                            <Col sm={3}>
                                <div className="form-group">
                                    <label className="label">Height(cm)</label>
                                    <input className="input" type="number" name="height" placeholder="20" value={formData.height} onChange={handleFormChange} />
                                </div>
                            </Col>

                        </Row>
                        <div className="form-group">
                            <label className="label">Price</label>
                            <input className="input" type="number" name="harga" placeholder="10000" value={formData.harga} onChange={handleFormChange} />
                        </div>
                        <div className="form-group">
                            <label className="label">Stock</label>
                            <input className="input" type="number" name="stok" placeholder="100" value={formData.stok} onChange={handleFormChange} />
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