import React, { useEffect, useState } from 'react';
// import { useCollectionData } from 'react-firebase-hooks/firestore';
import { Container, Button, ListGroup, ListGroupItem, Row, Col } from 'react-bootstrap';
// import PageLoading from '../../../components/loading/pageLoading';
import AddDialog from './addCategories';
// import { firestore } from '../../../components/FirebaseProvider';
import { arrayToTree } from 'performant-array-to-tree';
import { firestore } from '../../FirebaseFrovider';
import Header from '../../components/Header';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { JournalX, ThreeDotsVertical } from 'react-bootstrap-icons';

function Categories() {
    const [dataKategori, setDataKategori] = useState([]);
    useEffect(() => {
        // if () {
        // const fetchData = async () => {
        const getDoc = query(collection(firestore, "categories"), orderBy("createdAt", "desc"),);
        // const documentSnapshots = await getDocs(getDoc);
        const unsubscribe = onSnapshot(getDoc, (snapshot) => {
            const updatedData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setDataKategori(updatedData); // Update the state with the new data
        });
        return () => unsubscribe();
        // };
        // fetchData();
        // }
    }, []);
    const [dialog, setDialog] = useState({
        mode: 'Tambah',
        open: false,
        data: {},
        uid: {},
        parent: null,
        level: null,
    });

    // if (loadingKategori) {
    //     return <PageLoading />;
    // }

    const treeData = arrayToTree(dataKategori, {
        idField: 'id',
        parentId: 'parent',
        childrenField: 'sub',
        dataField: null,
    });

    const handleDelete = async (id, name) => {
        if (
            window.confirm(
                `Apakah Anda Yakin Ingin menghapus ${name}? Menghapus ini akan menghapus children dan grandchildren juga.`
            )
        ) {
            const docRef = doc(firestore, 'categories', id);
            await deleteDoc(docRef);
        }
    };
    console.log(dataKategori)
    const renderTree = (nodes, level = 1) => {
        return (
            <ListGroup>
                {
                    nodes.length < 1 ?
                        <div className='paper' style={{ backgroundColor: '#d0c294', marginLeft: 10, borderRadius: 5, height: '200px', justifyContent: 'center', alignItems: 'center', display: 'flex', }}>
                            <div style={{ textAlign: 'center', color: '#3d5e54', lineHeight: '50px' }}>
                                <JournalX size={70} />
                                <p>Category Not Found</p>
                            </div>

                        </div> :
                        nodes.map((node) => (
                            <ListGroupItem key={node.id} style={{ marginLeft: 10 * level, backgroundColor: level === 1 ? '#d0c294' : '#94abd0' }} className={`ml-${level * 3}`}>
                                <Row className="align-items-center">
                                    <Col md={6}><ThreeDotsVertical size={25} />{node.nama}</Col>
                                    <Col md={6} className="text-end" style={{ marginBottom: 10 }}>
                                        {
                                            level < 2 &&
                                            <Button
                                                style={{ backgroundColor: '#3d5e54', borderColor: '#3d5e54', }}
                                                variant="primary"
                                                size="sm"
                                                className="me-2"
                                                onClick={() =>
                                                    setDialog({
                                                        mode: 'Tambah',
                                                        open: true,
                                                        data: {},
                                                        parent: node.id,
                                                        level: level + 1,
                                                    })
                                                }
                                            >
                                                Add Sub Category - {node.nama}
                                            </Button>
                                        }
                                        <Button
                                            style={{ backgroundColor: '#aa6d38', borderColor: '#aa6d38', }}
                                            variant="success"
                                            size="sm"
                                            className="me-2"
                                            onClick={() =>
                                                setDialog({
                                                    mode: 'Edit',
                                                    open: true,
                                                    data: node,
                                                    id: node.id,
                                                })
                                            }
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleDelete(node.id, node.nama)}
                                        >
                                            Delete
                                        </Button>
                                    </Col>
                                </Row>
                                {node.sub && node.sub.length > 0 && renderTree(node.sub, level + 1)}
                            </ListGroupItem>
                        ))}
            </ListGroup>
        );
    };

    return (
        <div className="container">
            <Header />
            <h1 className="page-title">Daftar Kategori</h1>
            {renderTree(treeData)}
            <Button
                style={{ backgroundColor: '#3d5e54', borderColor: '#3d5e54', marginLeft: 10 }}
                color='#3d5e54'
                variant="primary"
                className="mt-3"
                onClick={() => setDialog({ mode: 'Tambah', open: true, data: {}, parent: null, level: 1 })}
            >
                Add Parent Category / Level 1
            </Button>

            <AddDialog
                kategori={dataKategori}
                dialog={dialog}
                handleClose={() => {
                    setDialog({ mode: 'Tambah', open: false, data: {}, level: null, parent: null });
                }}
            />
        </div>
    );
}

export default Categories;
