import { doc, getDoc, onSnapshot, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { usePDF } from 'react-to-pdf';
import './dialogDownload.css';
import { firestore, functions } from '../../FirebaseFrovider';
import { Form } from 'react-bootstrap';
import { useEffect, useState } from 'react';


export default function DialogEditShipDate(props) {
    const item = props?.show?.id;
    const [loading, setLoading] = useState(false)
    useEffect(() => {
        if (item) {
            const docRef = doc(firestore, 'orders', item);

            const unsubscribe = onSnapshot(
                docRef,
                (doc) => {
                    if (doc.exists()) {
                        setFormData({
                            ...formData,
                            day: doc.data()?.day,
                            month: doc.data()?.month,
                            year: doc.data()?.year,
                            shippingDate: doc.data()?.shippingDate
                        });
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
        }
    }, [item]);
    const [formData, setFormData] = useState({
        day: '',
        month: '',
        year: '',
        shippingDate: ''
    })

    const handleFormChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }
    // qontak
    const handleSave = async () => {
        try {
            // console.log(item?.senderName,
            //     item?.senderPhone,
            //     item?.harga.toString(),
            //     item?.link.toString());
            const shippingDateUpdate = `${formData?.year.toString()}-${formData?.month.toString().padStart(2, '0')}-${formData?.day.toString().padStart(2, '0')}`
            const shippingDateTimestampUpdate = Timestamp.fromDate(new Date(shippingDateUpdate));
            await setDoc(doc(firestore, 'orders', item), {
                ...formData,
                shippingDate: shippingDateTimestampUpdate
            }, { merge: true })
            props?.handleClose()
        } catch (e) {
            console.log(e.message)
        }
    }
    console.log(formData);

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
                overFlowY: 'auto',
                // paddingLeft: '20px'
            }}
            scrollable={true}
            // {...props}
            show={props?.show?.open}
            onHide={props?.handleClose}
            backdrop="static"
            keyboard={false}
        >
                <Modal.Header closeButton>
                    <Modal.Title>Edit Shipping Date</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{
                    overFlowY: 'auto',
                    maxHeight: 'calc(100vh - 210px)',

                }}>

                    <Form.Label className="label">Shipping Date</Form.Label>

                    <div className="form-container">
                        <div className="form-group" style={{ width: '100%' }}>
                            <Form.Label className="label">Day:</Form.Label>
                            <select name='day' className="input" value={formData?.day} onChange={handleFormChange}>
                                <option value="">Day</option>
                                {[...Array(31)].map((_, i) => (
                                    <option key={i} value={i + 1}>{(i + 1).toString().padStart(2, '0')}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group" style={{ width: '100%' }}>
                            <Form.Label className="label">Month:</Form.Label>
                            <select name='month' className="input" value={formData?.month} onChange={handleFormChange}>
                                <option value="">Month</option>
                                {[...Array(12)].map((_, i) => (
                                    <option key={i} value={i + 1}>{(i + 1).toString().padStart(2, '0')}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group" style={{ width: '100%' }}>
                            <Form.Label className="label">Year:</Form.Label>
                            <select name='year' className="input" value={formData?.year} onChange={handleFormChange}>
                                <option value="">Year</option>
                                {[...Array(121)].map((_, i) => (
                                    <option key={i} value={2024 + i}>{2024 + i}</option>
                                ))}
                            </select>
                        </div>
                    </div>                    {/* <MyDoc item={item} /> */}
                </Modal.Body>
                <Modal.Footer
                    style={{ display: 'flex' }}
                >
                    <button onClick={props?.handleClose} className="btn btn-outline-secondary" >
                        Close
                    </button>
                    <button onClick={handleSave} className="button button-primary" >Save</button>

                </Modal.Footer>
            </Modal>
        </div>
    );
}

