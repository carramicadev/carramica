import { useFirestoreQueryData } from '@react-query-firebase/firestore';
import { collection, deleteDoc, doc, endBefore, getDocs, limit, limitToLast, orderBy, query, startAfter } from 'firebase/firestore';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { Button, ButtonGroup, Table } from 'react-bootstrap';
import { PencilSquare, TrashFill } from 'react-bootstrap-icons';
import DialogAddProduct from './DialogAddProduct';
import { firestore } from './FirebaseFrovider';
import Header from './Header';

const Product = () => {
  const { enqueueSnackbar } = useSnackbar();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRows, setSelectedRows] = useState([]);
  const [dialogAdd, setDialogAdd] = useState({
    open: false,
    data: {},
    mode: 'add'
  });
  const [page, setPage] = useState(1);
  const [update, setUpdate] = useState(false);
  const [allProduct, setAllProduct] = useState([])
  // query coll product
  useEffect(() => {
    if (page === 1) {
      const fetchData = async () => {
        const getDoc = query(collection(firestore, "product"), orderBy("createdAt", "desc"), limit(20));
        const documentSnapshots = await getDocs(getDoc);
        var items = [];

        documentSnapshots.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
          // doc.data() is never undefined for query doc snapshots
        });
        // console.log('first item ', items[0])
        setAllProduct(items);
      };
      fetchData();
    }
  }, [update]);
  const showNext = ({ item }) => {
    if (allProduct.length === 0) {
      alert("Thats all we have for now !")
    } else {
      const fetchNextData = async () => {
        const getDoc = query(collection(firestore, "product"), orderBy("createdAt", "desc"), startAfter(item.createdAt), limit(20));
        const documentSnapshots = await getDocs(getDoc);
        var items = [];

        documentSnapshots.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
          // doc.data() is never undefined for query doc snapshots
        });
        setAllProduct(items);
        setPage(page + 1)
      };
      fetchNextData();
    }
  };

  const showPrevious = ({ item }) => {
    const fetchPreviousData = async () => {
      const getDoc = query(collection(firestore, "product"), orderBy("createdAt", "desc"), endBefore(item.createdAt), limitToLast(20));
      const documentSnapshots = await getDocs(getDoc);
      var items = [];

      documentSnapshots.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
        // doc.data() is never undefined for query doc snapshots
      });
      setAllProduct(items);
      setPage(page - 1)
    };
    fetchPreviousData();
  };
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1)
  };
  const filteredData = allProduct?.filter?.(
    item =>
      item.nama?.toLowerCase?.().includes?.(searchTerm.toLowerCase()) ||
      item.sku?.toLowerCase?.().includes?.(searchTerm.toLowerCase())
  );
  // console.log(filteredData)
  // checkbox
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(filteredData.map(item => item.id));
    } else {
      setSelectedRows([]);
    }
  };
  const handleSelectRow = (e, id) => {
    if (e.target.checked) {
      setSelectedRows([...selectedRows, id]);
    } else {
      setSelectedRows(selectedRows.filter(rowId => rowId !== id));
    }
  };
  const selectedData = filteredData?.filter?.(item => selectedRows.includes(item.id));
  // dialog add
  const handleDeleteClick = async (id) => {
    if (window.confirm(' apakah anda yakin ingin menghapus product ini?')) {
      try {
        const docRef = doc(firestore, 'product', id);
        await deleteDoc(docRef);
        setUpdate((prevValue) => !prevValue)
        enqueueSnackbar(`Produk berhasil dihapus!.`, { variant: 'success' })
      } catch (e) {
        enqueueSnackbar(`Produk gagal dihapus!.`, { variant: 'error' })

        console.log(e.message)
      }
    } else {

    }

    // setData(data.filter((row) => row.id !== id));
  };
  const handleDeleteClickAll = async (allId) => {
    if (window.confirm(' apakah anda yakin ingin menghapus product ini?')) {
      try {
        await Promise.all(allId?.map?.(async (id) => {
          const docRef = doc(firestore, 'product', id);
          await deleteDoc(docRef);
        }));
        setUpdate((prevValue) => !prevValue)
        enqueueSnackbar(`Produk berhasil dihapus!.`, { variant: 'success' })
      } catch (e) {
        enqueueSnackbar(`Produk gagal dihapus!.`, { variant: 'error' })

        console.log(e.message)
      }
    } else {

    }

    // setData(data.filter((row) => row.id !== id));
  };
  // console.log(selectedRows)
  return (
    <div className="container">

      <Header />
      <h1 className="page-title">Produk</h1>
      <div className="form-container">
        <div className="form-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div>
              <input
                className="input"
                style={{ width: '300px', borderRadius: '5px', padding: '8px ' }}
                type="text"
                placeholder="Search by name or sku"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <div>
              {/* <CSVLink style={{ width: '120px', marginRight: '10px' }} data={mapData} separator={";"} filename={"table_data.csv"} className="btn btn-primary">
                Export CSV
              </CSVLink> */}
              {
                selectedRows.length > 0 &&
                <button style={{ backgroundColor: 'red' }} className="button button-primary" onClick={() => handleDeleteClickAll(selectedRows)}>
                  <TrashFill /> Delete
                </button>
              }
              <button onClick={() => setDialogAdd({ open: true, data: selectedData, mode: 'add' })} style={{ backgroundColor: '#998970' }} className="button button-primary">+Tambah Produk</button>
            </div>
          </div>
          {
            selectedRows.length > 0 &&
            <div>
              <p>{selectedRows.length} row selected</p>
            </div>
          }
          <Table striped bordered hover>
            <thead>
              <tr style={{ whiteSpace: 'nowrap' }}>
                <th>
                  <input className="form-check-input" type="checkbox" checked={selectedRows?.length === filteredData?.length}
                    onChange={handleSelectAll} id="flexCheckChecked" />
                </th>
                <th>Product Id</th>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Weight/gr</th>
                <th>Length</th>
                <th>Width</th>
                <th>Height</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Action</th>

              </tr>
            </thead>
            <tbody>
              {filteredData?.map?.((item, i) => {
                // console.log(item)
                return <tr key={item.id}>
                  <td>
                    <input type="checkbox"
                      checked={selectedRows.includes(item.id)}
                      onChange={(e) => handleSelectRow(e, item.id)} />
                  </td>
                  <td>{item?.id}</td>
                  <td>{item?.sku}</td>
                  <td>{item?.nama}</td>
                  <td>{item?.weight}</td>
                  <td>{item?.length}</td>
                  <td>{item?.width}</td>
                  <td>{item?.height}</td>
                  <td>{item?.harga}</td>
                  <td>{item?.stok}</td>
                  <td>              <button onClick={() => setDialogAdd({ open: true, data: selectedData, mode: 'edit', item: item })} style={{ backgroundColor: '#998970' }} className="button button-primary"><PencilSquare /></button>
                    <button style={{ backgroundColor: 'red' }} className="button button-primary" onClick={() => handleDeleteClick(item?.id)}>
                      <TrashFill />
                    </button>
                  </td>
                </tr>
              })}
            </tbody>
          </Table>
          <ButtonGroup style={{ textAlign: 'center', float: 'right' }}>
            {/* //show previous button only when we have items */}
            <Button disabled={page === 1} style={{ marginRight: '10px', whiteSpace: 'nowrap', backgroundColor: '#3D5E54', border: 'none' }} onClick={() => showPrevious({ item: allProduct[0] })}>{'<-Prev'}</Button>
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
            <Button disabled={filteredData.length < 20} style={{ whiteSpace: 'nowrap', backgroundColor: '#3D5E54', border: 'none' }} onClick={() => showNext({ item: filteredData[filteredData.length - 1] })}>{'Next->'}</Button>
          </ButtonGroup>
          <DialogAddProduct
            show={dialogAdd}
            onHide={() => setDialogAdd({ open: false, data: {} })}
            // enqueueSnackbar={enqueueSnackbar}
            setUpdate={setUpdate}
          // handlePayment={handlePayment}
          // loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default Product;