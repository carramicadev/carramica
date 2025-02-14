import { set } from 'date-fns';
import { collection, getDocs, onSnapshot, orderBy, query, Timestamp, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import Autocomplete from 'react-autocomplete';
import { Modal, Button, Form } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import { firestore } from '../../FirebaseFrovider';
// import { firestore } from './FirebaseFrovider';

export const FilterProduct = ({ show, handleClose, setAllProducts, }) => {
    const [categories, setCateg] = useState([])
    const [stockUnder, setStockUnder] = useState(0);
    const [value, setValue] = useState('');
    const [selectedCateg, setSelectedCateg] = useState(null);
    const [status, setStatus] = useState('')
    const [loading, setLoading] = useState(false)
    const handleFilter = async () => {
        setLoading(true)
        try {

            const filters = [];
            if (stockUnder) {
                filters.push(where('stok', '<=', parseInt(stockUnder)));
            }
            if (selectedCateg) {
                filters.push(where('category.id', '==', selectedCateg.id));

            }
            if (status) {
                filters.push(where('status', '==', status));
            }
            const ref = query(collection(firestore, "product"), ...filters, orderBy('createdAt', 'desc')
                // where("createdAt", ">=", startTimestamp),
                // where("createdAt", "<=", endTimestamp)
            );
            // console.log(filters)
            // const querySnapshot = await getDocs(ref);
            const unsubscribe = onSnapshot(ref, (snapshot) => {
                const updatedData = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                // setList(updatedData); // Update the state with the new data
                setAllProducts(updatedData)
                handleClose()
                setLoading(false)
            });
            return () => unsubscribe();


        } catch (e) {
            setLoading(false)
            console.log(e.message)
        }
        setLoading(false)
    }



    useEffect(() => {
        const fetchData = async () => {
            const getDoc = query(collection(firestore, "categories"), where('level', '==', 2));
            const documentSnapshots = await getDocs(getDoc);
            var items = [];

            documentSnapshots.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() });
                // doc.data() is never undefined for query doc snapshots
            });
            // console.log('first item ', items[0])
            setCateg(items);
        };
        fetchData();
    }, []);

    // console.log(selectedCateg)
    return (
        <Modal style={{
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            width: 'auto',
            height: 'auto',
            overFlowY: 'auto'
        }} show={show} onHide={handleClose} centered>
            <Modal.Header closeButton>
                <Modal.Title>Filter Orders</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form >

                    <Form.Label style={{ marginTop: '20px' }}>Product Category</Form.Label>
                    <Autocomplete
                        wrapperProps={{ style: { display: 'block' } }}
                        getItemValue={(item) => item?.nama}
                        items={categories}
                        renderItem={(item, isHighlighted) =>
                            <div style={{ background: isHighlighted ? 'lightgray' : 'white' }}>
                                {item.nama}
                            </div>
                        }
                        fullWidth
                        value={value}
                        onChange={(e) => {
                            // console.log(e.target.value)
                            setValue(e.target.value)
                        }}
                        renderInput={(props) => (
                            <Form.Control
                                className="input"
                                // style={{ width: '100%', display: 'inline' }}

                                {...props}
                                placeholder="Find Category"
                            />
                        )}
                        renderMenu={(items, value) => (
                            <div>{items.length === 0 ? `No matches for ${value}` : items}</div>
                        )}
                        onSelect={(val, items) => {
                            // console.log(items)
                            setValue(val)
                            setSelectedCateg(categories.find(item => item.id === items.id));

                            // setSelected(item)
                        }}
                    />
                    <div style={{ marginTop: '30px' }} className="form-group">
                        <Form.Label className="label">Quantity Under</Form.Label>
                        <Form.Control className="input" type="number" name="email" placeholder={0} value={stockUnder} onChange={(e) => setStockUnder(e.target.value)} />
                    </div>

                    <div className="mb-3" style={{ alignItems: 'center', justifyContent: 'space-between', marginTop: '30px' }}>
                        <label className="form-label" for="product-status">
                            Product Status
                        </label>
                        <select style={{ width: '70%', }} className="form-select" id="product-status" name='status' value={status} onChange={(e) => setStatus(e.target.value)}>
                            <option selected hidden >Status</option>
                            <option value="Live">
                                Live
                            </option>
                            <option value="Hold">
                                Hold
                            </option>
                        </select>
                    </div>
                </Form>

            </Modal.Body>
            <Modal.Footer style={{ display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', }}>
                    <Button style={{ marginRight: '10px' }} disabled={!value && stockUnder < 1 && !status} variant="secondary" onClick={() => {
                        setValue('')
                        setSelectedCateg(null);
                        setStockUnder(0)
                        setStatus('')
                        // handleClearFilter()
                    }}>
                        Clear
                    </Button>
                    <Button disabled={loading} onClick={handleFilter}>
                        {`${loading ? 'loading' : 'Filter'}`}
                    </Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
};