import Modal from 'react-bootstrap/Modal';
import '../orders/dialogDownload.css';
import { addDoc, arrayUnion, collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { firestore, functions } from '../../FirebaseFrovider';
import { useEffect, useState } from 'react';
import { Button, Col, Form, Row } from 'react-bootstrap';
import { httpsCallable } from 'firebase/functions';
import { useSnackbar } from 'notistack';

export default function DialogAddAgen({ show, handleClose, setUpdate }) {
    const { enqueueSnackbar } = useSnackbar();
    const [warehouseOptions, setWarehouseOptions] = useState([]);
    useEffect(() => {
        const fetchSales = async () => {
            const salesSnapshot = await getDocs(collection(firestore, "warehouse"));
            const salesList = salesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setWarehouseOptions(salesList);
            // const findDefaultWH = salesList.find(sal => sal?.id === 'SSUWQwC374ZY3pg4gPEt');
            // if (findDefaultWH?.name) {
            //     setFormData({
            //         ...formData,
            //         warehouse: findDefaultWH?.name
            //     })
            //     setKoordinateOrigin({
            //         lat: findDefaultWH?.coordinates?.lat,
            //         lng: findDefaultWH?.coordinates?.lng
            //     })
            // }
        };

        fetchSales();
    }, []);
    const ListRules = ['agen'];
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        rules: 'agen',
        phone: '62',
        warehouse: ''
    });
    const [formError, setFormError] = useState({
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        rules: '',
        phone: '',
        warehouse: ''
    });

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

        if (!formData.email) {
            // console.log('er')
            newError.email = 'email is required';
        }
        if (!formData.password) {
            // console.log('er')
            newError.password = 'password is required';
        }
        if (!formData.rules) {
            // console.log('er')
            newError.rules = 'rules is required';
        }
        if (!formData.warehouse) {
            // console.log('er')
            newError.warehouse = 'warehouse is required';
        }
        if (formData.phone.length <= 2) {
            newError.phone = 'Sender phone is required';
        }
        // console.log(newError)



        return newError;
    }
    const handleAdd = async (e) => {
        e.preventDefault();
        const findErros = validate();
        if (Object.values(findErros).some((err) => err !== '')) {
            // console.log('Errors found:', findErros);
            setFormError(findErros);
        } else {
            setLoading(true)
            try {
                const createUser = httpsCallable(functions, 'createUser');
                const result = await createUser({
                    email: formData.email,
                    password: formData.password
                });
                await setDoc(doc(firestore, 'users', result.data.uid), {
                    email: formData.email,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    rules: formData.rules,
                    userId: result.data.uid,
                    createdAt: serverTimestamp(),
                    warehouse: formData?.warehouse
                }, { merge: true })
                // console.log(result)
                setFormData({
                    email: '',
                    firstName: '',
                    lastName: '',
                    password: '',
                    rules: 'agen',
                    phone: '62',
                    warehouse: ''
                })
                // setUpdate((prevValue) => !prevValue)

                enqueueSnackbar(`sukses menambahkan user ${formData?.firstName}`, { variant: 'success' })

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
            show={show} onHide={handleClose}
            backdrop="static"
            keyboard={false}
        >
                <Modal.Header closeButton>
                    <Modal.Title>Add Agen</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{
                    overFlowY: 'auto',
                    maxHeight: 'calc(100vh - 210px)',

                }}>
                    <Form>
                        <Form.Group as={Row} controlId="formFirstName">
                            <Col sm={6}>
                                <Form.Label >First Name</Form.Label>

                                <Form.Control
                                    type="text"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleFormChange} />
                            </Col>
                            <Col sm={6}>
                                <Form.Label >Last Name</Form.Label>

                                <Form.Control
                                    type="text"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleFormChange} />
                            </Col>
                        </Form.Group>

                        {/* <Form.Group as={Row} controlId="formLastName">

                    </Form.Group> */}

                        <Form.Group as={Row} controlId="formPhone">
                            <Col sm={12}>
                                <Form.Label >Phone</Form.Label>

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
                                <Form.Label >Email</Form.Label>

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
                                <Form.Label >Password</Form.Label>

                                <Form.Control
                                    isInvalid={formError.password ? true : false}
                                    type="text"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleFormChange} />
                                {
                                    formError.password && <Form.Control.Feedback type="invalid">
                                        {formError.password}
                                    </Form.Control.Feedback>
                                }
                            </Col>
                        </Form.Group>

                        <Form.Group as={Row} controlId="formRules">
                            <Col sm={12}>
                                <Form.Label >Rules</Form.Label>

                                <Form.Select isInvalid={formError.rules ? true : false} defaultValue={formData.rules} defaultChecked={false} className="select" name="rules" value={formData.rules} onChange={handleFormChange}>
                                    <option selected hidden >Rules</option>

                                    {
                                        ListRules?.map((rule) => {
                                            return <option value={rule}>{rule}</option>
                                        })
                                    }
                                </Form.Select>
                                {
                                    formError.rules && <Form.Control.Feedback type="invalid">
                                        {formError.rules}
                                    </Form.Control.Feedback>
                                }
                            </Col>
                        </Form.Group>
                        <Form.Group as={Row} controlId="formWarehouse">
                            <Col sm={12}>
                                <Form.Label >Rules</Form.Label>

                                <Form.Select isInvalid={formError.warehouse ? true : false} defaultValue={formData.warehouse} defaultChecked={false} className="select" name="warehouse" value={formData.warehouse} onChange={handleFormChange}>
                                    <option selected hidden >Warehouse</option>

                                    {
                                        warehouseOptions?.map((wh) => {
                                            return <option value={wh?.id}>{wh?.name}</option>
                                        })
                                    }
                                </Form.Select>
                                {
                                    formError.warehouse && <Form.Control.Feedback type="invalid">
                                        {formError.warehouse}
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
                    <button disabled={loading} onClick={handleAdd} className="button button-primary" >Add</button>

                    {/* <button className="button button-primary" >Understood</button> */}
                </Modal.Footer>
            </Modal>
        </div>
    );
}