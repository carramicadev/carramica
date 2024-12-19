import { collection, doc, getDocs, onSnapshot, orderBy, query, setDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import Autocomplete from 'react-autocomplete';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../AuthContext';
import { firestore } from '../../FirebaseFrovider';

export const FilterColumnDialog = ({ show, handleClose, setSelectColumn, dateTimestamp, setAllOrders, column, selectColumn, user, setColumn, newColumn }) => {
    const [checkedItems, setCheckedItems] = useState([]);
    const [checkedItemsAll, setCheckedItemsAll] = useState([]);
    const { currentUser } = useAuth();

    const findUser = user.find(itm => itm.userId === currentUser?.uid)
    // get set column
    const columnRef = doc(firestore, "settings", "rules", "column", currentUser?.uid);


    const handeCheckList = (value, i) => (e) => {
        const currentIndex = checkedItems.findIndex((col) => col.label === value.label);
        const newChecked = [...checkedItems];

        if (currentIndex === -1) {
            newChecked.push(value);
        } else {
            newChecked.splice(currentIndex, 1);
        }

        setCheckedItems(newChecked);

    }
    const handleSetColumn = async () => {
        try {
            setSelectColumn(checkedItems)
            // console.log(checkedItems)
            const label = checkedItems.map((ch) => ch?.label)
            await setDoc(columnRef, {
                columnOrder: label
            })
            handleClose()
        } catch (e) {
            console.log(e.message)
        }
    }

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setCheckedItems(column);
        } else {
            setCheckedItems([]);
        }
    };

    useEffect(() => {
        setCheckedItems(selectColumn)
    }, [selectColumn]);

    useEffect(() => {
        if (findUser?.rules === 'admin' || findUser?.rules === 'Head Of Sales') {
            setColumn([...column, newColumn])
        }
    }, [findUser?.rules])
    console.log(findUser)

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
                <Modal.Title>Custom Column</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form >
                    {/* <Form.Label>By Payment Status</Form.Label> */}
                    <Form.Check

                        type="checkbox"
                        label='Select All'
                        //    name="settlement"
                        checked={checkedItems?.length === column.length}
                        onChange={handleSelectAll} />
                    <Row>
                        {
                            column?.map((col, i) => {
                                const checked = checkedItems?.some?.((selectedCol) => selectedCol.label === col.label)
                                // console.log(checked)
                                return <Col sm={4} key={i}>
                                    <Form.Check

                                        type="checkbox"
                                        label={col?.label}
                                        //    name="settlement"
                                        checked={checked}
                                        onChange={handeCheckList(col)} />
                                </Col>
                            })
                        }
                    </Row>



                </Form>
            </Modal.Body>
            <Modal.Footer style={{ display: 'block' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>


                    <Button onClick={handleSetColumn}>
                        Filter
                    </Button>
                </div>
            </Modal.Footer>
        </Modal>
    );
};