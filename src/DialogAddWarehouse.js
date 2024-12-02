import Modal from 'react-bootstrap/Modal';
import './dialogDownload.css';
import { addDoc, arrayUnion, collection, doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { firestore, functions } from './FirebaseFrovider';
import { useEffect, useState } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';
import { httpsCallable } from 'firebase/functions';
import { useSnackbar } from 'notistack';
import MapComponent from './MapComponent';

export default function DialogAddWarehouse({ show, handleClose, setUpdate }) {
    const { enqueueSnackbar } = useSnackbar();
    useEffect(() => {
        if (show?.mode === 'edit') {
            setFormData({ ...show?.item })
            setKoordinateReceiver({
                lat: show?.item?.coordinates?.lat,
                lng: show?.item?.coordinates?.lng
            })
        }
    }, [show?.mode])
    const ListRules = ['admin', 'sales', 'shipping', 'Head Of Sales'];
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        // lastName: '',
        address: '',
        coordinates: {},
        phone: '62'
    });
    const [formError, setFormError] = useState({
        email: '',
        name: '',
        // lastName: '',
        address: '',
        coordinates: '',
        phone: ''
    });

    const [koordinateReceiver, setKoordinateReceiver] = useState({
        lat: '',
        lng: ''
    })
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        if (e.target.type === 'number') {
            if (name === 'berat') {
                // console.log(value)
                setFormData({ ...formData, [name]: parseFloat(value) });

            } else {
                setFormData({ ...formData, [name]: parseInt(value) });

            }

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
        if (!formData.name) {
            // console.log('er')
            newError.name = 'name is required';
        }
        if (!formData.email) {
            // console.log('er')
            newError.email = 'email is required';
        }
        if (!formData.address) {
            // console.log('er')
            newError.address = 'address is required';
        }
        if (!koordinateReceiver.lat) {
            // console.log('er')
            newError.coordinates = 'coordinates is required';
        }
        if (formData.phone.length <= 2) {
            newError.phone = ' phone is required';
        }
        // console.log(newError)



        return newError;
    }
    console.log(formError)
    const handleAdd = async (e) => {
        e.preventDefault();
        const findErros = validate();
        if (Object.values(findErros).some((err) => err !== '')) {
            // console.log('Errors found:', findErros);
            setFormError(findErros);
        } else {
            setLoading(true)
            try {
                // const createUser = httpsCallable(functions, 'createUser');
                // const result = await createUser({
                //     email: formData.email,
                //     address: formData.address
                // });
                if (show?.mode === 'edit') {
                    await setDoc(doc(firestore, 'warehouse', show?.item?.id), {
                        ...formData,
                        coordinates: koordinateReceiver,
                        // userId: result.data.uid,
                        updateAt: serverTimestamp()
                    }, { merge: true })
                } else {
                    await addDoc(collection(firestore, 'warehouse',), {
                        ...formData,
                        coordinates: koordinateReceiver,
                        // userId: result.data.uid,
                        createdAt: serverTimestamp()
                    }, { merge: true })
                }

                // console.log(result)
                setFormData({
                    email: '',
                    name: '',
                    // lastName: '',
                    address: '',
                    coordinates: '',
                    phone: '62'
                })
                // setUpdate((prevValue) => !prevValue)

                enqueueSnackbar(`sukses menambahkan user ${formData?.name}`, { variant: 'success' })

                handleClose()
                // props.onHide()
            } catch (e) {
                enqueueSnackbar(`gagal menambahkan user, ${e?.message}`, { variant: 'error' })

                console.log(e.message)
            }
            setLoading(false)
        }

    }

    //format phone number 
    const handleKeyDown = (e) => {
        if (formData.phone.length <= 2 && (e.key === 'Backspace' || e.key === 'Delete')) {
            e.preventDefault();
        }
    };

    useEffect(() => {
        if (koordinateReceiver.lat && koordinateReceiver.lng) {
            setFormError({
                ...formError,
                coordinates: ''
            })
        }
    }, [koordinateReceiver.lat, koordinateReceiver.lng])
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
            show={show?.open} onHide={handleClose}
            backdrop="static"
            keyboard={false}
        >
                <Modal.Header closeButton>
                    <Modal.Title>{show?.mode === 'edit' ? 'Edit Warehouse' : 'Add Warehouse'}</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{
                    overFlowY: 'auto',
                    maxHeight: 'calc(100vh - 210px)',

                }}>
                    <Form style={{ lineHeight: '35px' }}>
                        <Form.Group as={Row} controlId="formFirstName">
                            <Col sm={12}>
                                <label > Name</label>
                                <Form.Control
                                    isInvalid={formError.name ? true : false}
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleFormChange} />
                                {
                                    formError.name && <Form.Control.Feedback type="invalid">
                                        {formError.name}
                                    </Form.Control.Feedback>
                                }
                            </Col>

                        </Form.Group>

                        {/* <Form.Group as={Row} controlId="formLastName">

                    </Form.Group> */}

                        <Form.Group as={Row} controlId="formPhone">
                            <Col sm={12}>
                                <label >Phone</label>

                                <Form.Control
                                    isInvalid={formError.phone ? true : false}
                                    type="number"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleFormChange}
                                    onKeyDown={handleKeyDown} />
                                {
                                    formError.phone && <Form.Control.Feedback type="invalid">
                                        {formError.phone}
                                    </Form.Control.Feedback>
                                }
                            </Col>
                        </Form.Group>

                        <Form.Group as={Row} controlId="formEmail">
                            <Col sm={12}>
                                <label >Email</label>

                                <Form.Control
                                    isInvalid={formError.email ? true : false}
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    placeholder='example@gmail.com'
                                    onChange={handleFormChange} />
                                {
                                    formError.email && <Form.Control.Feedback type="invalid">
                                        {formError.email}
                                    </Form.Control.Feedback>
                                }
                            </Col>
                        </Form.Group>

                        <Form.Group as={Row} controlId="formPassword">
                            <Col sm={12}>
                                <label >Address</label>

                                <Form.Control
                                    isInvalid={formError.address ? true : false}
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleFormChange} />
                                {
                                    formError.address && <Form.Control.Feedback type="invalid">
                                        {formError.address}
                                    </Form.Control.Feedback>
                                }
                            </Col>
                        </Form.Group>

                        <Form.Group as={Row} controlId="formEmail">
                            <Col sm={12}>
                                {/* <label  >coordinates</label> */}

                                <Form.Select style={{ display: 'none' }} isInvalid={formError.coordinates ? true : false} defaultValue={formData.coordinates} defaultChecked={false} className="select" name="coordinates" value={formData.coordinates} onChange={handleFormChange}>
                                    <option selected hidden >coordinates</option>

                                    {
                                        ListRules?.map((rule) => {
                                            return <option value={rule}>{rule}</option>
                                        })
                                    }
                                </Form.Select>
                                <MapComponent setKoordinateReceiver={setKoordinateReceiver} koordinateReceiver={koordinateReceiver} />
                                {
                                    formError.coordinates && <Form.Control.Feedback type="invalid">
                                        {formError.coordinates}
                                    </Form.Control.Feedback>
                                }
                            </Col>
                        </Form.Group>


                    </Form>
                </Modal.Body>
                <Modal.Footer
                    style={{ display: 'flex' }}
                >
                    {/* <Button variant="secondary" >
                        Close
                    </Button> */}
                    <button disabled={loading} onClick={handleAdd} className="button button-primary" >{show?.mode === 'edit' ? 'Edit ' : 'Add '}</button>

                    {/* <button className="button button-primary" >Understood</button> */}
                </Modal.Footer>
            </Modal>
        </div>
    );
}