import { collection, deleteDoc, doc, getDocs, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { Button, ButtonGroup } from "react-bootstrap"
import { PencilSquare, PersonSquare, TrashFill } from "react-bootstrap-icons"
import DialogAddUsers from "./DialogAddUsers"
import DialogAddWarehouse from "./DialogAddWarehouse";
import { firestore } from "./FirebaseFrovider";

export default function Warehouse() {
    const [list, setList] = useState([]);
    const [page, setPage] = useState(1);
    const [openAddDialog, setOpenAddDialog] = useState({ open: false, item: {}, mode: 'add' });
    useEffect(() => {
        const getDoc = query(collection(firestore, "warehouse"), orderBy("createdAt", "desc"), limit(20));
        const unsubscribe = onSnapshot(getDoc, (snapshot) => {
            const updatedData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));
            setList(updatedData); // Update the state with the new data
        });
        return () => unsubscribe();

    }, []);
    const showNext = ({ item }) => {
        if (list.length === 0) {
            alert("Thats all we have for now !")
        } else {
            // const fetchNextData = async () => {
            //     const getDoc = query(collection(firestore, "users"), orderBy("createdAt", "desc"), startAfter(item.createdAt), limit(20));
            //     const documentSnapshots = await getDocs(getDoc);
            //     var items = [];

            //     documentSnapshots.forEach((doc) => {
            //         items.push({ id: doc.id, ...doc.data() });
            //         // doc.data() is never undefined for query doc snapshots
            //     });
            //     setList(items);
            //     setPage(page + 1)
            // };
            // fetchNextData();
        }
    };

    const showPrevious = ({ item }) => {
        // const fetchPreviousData = async () => {
        //     const getDoc = query(collection(firestore, "users"), orderBy("createdAt", "desc"), endBefore(item.createdAt), limitToLast(20));
        //     const documentSnapshots = await getDocs(getDoc);
        //     var items = [];

        //     documentSnapshots.forEach((doc) => {
        //         items.push({ id: doc.id, ...doc.data() });
        //         // doc.data() is never undefined for query doc snapshots
        //     });
        //     setList(items);
        //     setPage(page - 1)
        // };
        // fetchPreviousData();
    };
    const { enqueueSnackbar } = useSnackbar();

    const handleDeleteClick = async (id) => {
        if (window.confirm(' apakah anda yakin ingin menghapus warehouse ini?')) {
            try {
                // console.log(id)
                // const deleteUser = httpsCallable(functions, 'deleteUser');
                // await deleteUser({
                //     id: id,
                // });
                const docRef = doc(firestore, 'users', id);
                await deleteDoc(docRef);
                // setUpdate((prevValue) => !prevValue)
                enqueueSnackbar(`berhasil menghapus sales`, { variant: 'success' })
                // setData(data.filter((row) => row.id !== id));
            } catch (e) {
                // enqueueSnackbar(`gagal menghapus sales, ${e.message}`, { variant: 'error' })

                console.log(e.message)
            }
        } else {

        }

    };
    const TruncatedText = ({ text, maxLength }) => {
        // If the text is longer than maxLength, truncate it and add ellipsis
        const truncated = text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;

        return truncated;
    };
    return <div className="table-responsive">
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex' }}>
                <button style={{ whiteSpace: 'nowrap', backgroundColor: '#3D5E54', border: 'none', marginLeft: '10px' }} className="btn btn-primary" onClick={() => setOpenAddDialog({ open: true, item: {}, mode: 'add' })}>+Add Warehouse</button>
            </div>
        </div>
        <table className="table table-bordered">
            <thead>
                <tr>
                    <th>NAME</th>
                    <th>EMAIL</th>
                    <th>PHONE</th>
                    <th>ADRESS</th>
                    <th>COORDINATES</th>
                    <th>ACTIONS</th>
                </tr>
            </thead>
            <tbody>

                {
                    list?.map((user) => {
                        return <tr>
                            <td>
                                {user?.name}
                                {/* <div className="d-flex align-items-center">
                                    <span className="me-2">
                                        <PersonSquare color='#3D5E54' />
                                    </span>
                                    {user?.firstName} {user?.lastName}
                                </div> */}
                            </td>
                            <td>{user?.email}</td>
                            <td>{user?.phone}</td>
                            <td><TruncatedText text={user?.address} maxLength={25} /></td>
                            <td>{user?.coordinates?.lat},{user?.coordinates?.lng}</td>
                            <td>
                                <button onClick={() => setOpenAddDialog({ open: true, mode: 'edit', item: user })} style={{ backgroundColor: '#998970' }} className="button button-primary"><PencilSquare /></button>
                                <button style={{ backgroundColor: 'red' }} className="button button-primary" onClick={() => handleDeleteClick(user?.id)}>
                                    <TrashFill />
                                </button>
                            </td>
                        </tr>
                    })
                }
            </tbody>
        </table>
        <ButtonGroup style={{ textAlign: 'center', float: 'right' }}>
            {/* //show previous button only when we have items */}
            <Button disabled={page === 1} style={{ marginRight: '10px', whiteSpace: 'nowrap', backgroundColor: '#3D5E54', border: 'none' }} onClick={() => showPrevious({ item: list[0] })}>{'<-Prev'}</Button>
            <input value={page} className="input" disabled style={{
                padding: '0px',
                width: '40px',
                marginRight: '10px',
                textAlign: 'center',
                border: 'none',
                marginBottom: '8px',
                marginTop: '8px'
            }} />
            {/* //show next button only when we have items */}
            <Button disabled={list.length < 20} style={{ whiteSpace: 'nowrap', backgroundColor: '#3D5E54', border: 'none' }} onClick={() => showNext({ item: list[list.length - 1] })}>{'Next->'}</Button>
        </ButtonGroup>
        <DialogAddWarehouse
            show={openAddDialog}
            handleClose={() => setOpenAddDialog({ open: false, item: {}, mode: '' })}
        // setUpdate={setUpdate}
        />
    </div>
}