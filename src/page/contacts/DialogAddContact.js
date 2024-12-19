import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { usePDF } from 'react-to-pdf';
import '../orders/dialogDownload.css';
// import logoFull from './logoFull.png';
// import sap from './sap.png'
// import lalamove from './lalamove.png'
import { addDoc, arrayUnion, collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
// import { firestore } from './FirebaseFrovider';
import { useEffect, useState } from 'react';
import { Col, Row } from 'react-bootstrap';
import { useSnackbar } from 'notistack';
import { firestore } from '../../FirebaseFrovider';

export default function DialogAddContact(props) {
    const { enqueueSnackbar } = useSnackbar();

    useEffect(() => {
        if (props?.show?.mode === 'edit') {
            setFormData({ ...props?.show?.item })
        }
    }, [props?.show?.mode])
    const [formData, setFormData] = useState({
        nama: '',
        phone: '',
        email: '',

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
                await setDoc(doc(firestore, "contact", props?.show?.item?.phone), { ...formData, updatedAt: serverTimestamp() });
                // console.log("Document written with ID: ",);
                enqueueSnackbar(`sukses mengedit contact ${formData?.nama}`, { variant: 'success' })

                props.onHide()
            } else {
                await setDoc(doc(firestore, "contact", formData?.phone), { ...formData, createdAt: serverTimestamp(), type: 'receiver' });
                // console.log("Document written with ID: ",);
                enqueueSnackbar(`sukses menambahkan contact ${formData?.nama}`, { variant: 'success' })

                props.onHide()
            }
            props?.setUpdate((prevValue) => !prevValue)

        } catch (e) {
            enqueueSnackbar(`gagal menambahkan contact ${e.message}`, { variant: 'error' })

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
                    <Modal.Title>{props?.show?.mode === 'edit' ? 'Update Contact' : 'Add Contact'}</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{
                    overFlowY: 'auto',
                    maxHeight: 'calc(100vh - 210px)',

                }}><div>

                        <div className="form-group">
                            <label className="label">Name </label>
                            <input className="input" type="text" name="nama" placeholder="Serah" value={formData.nama} onChange={handleFormChange} />
                        </div>


                        <div className="form-group">
                            <label className="label">Email</label>
                            <input className="input" type="text" name="email" placeholder="test@example.com" value={formData.email} onChange={handleFormChange} />
                        </div>
                        <div className="form-group">
                            <label className="label">Phone</label>
                            <input className="input" type="text" name="phone" placeholder="6283xxxxxx" value={formData.phone} onChange={handleFormChange} />
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