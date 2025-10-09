import { useFirestoreQueryData } from "@react-query-firebase/firestore";
import {
  collection,
  deleteDoc,
  doc,
  endBefore,
  getDocs,
  limit,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  startAfter,
} from "firebase/firestore";
import { useSnackbar } from "notistack";
import React, { useEffect, useState } from "react";
import { Button, ButtonGroup, Table } from "react-bootstrap";
import {
  CloudArrowDown,
  Filter,
  Images,
  PencilSquare,
  Search,
  SortAlphaDown,
  SortAlphaDownAlt,
  SortDown,
  TrashFill,
} from "react-bootstrap-icons";
import { Typeahead } from "react-bootstrap-typeahead";
import DialogAddProduct from "./DialogAddProduct";
import { firestore } from "../../FirebaseFrovider";
import Header from "../../components/Header";
import { useNavigate } from "react-router-dom";
import { FilterProduct } from "./filterDialog";
import { currency } from "../../formatter";
import { CSVLink } from "react-csv";

const ListProduct = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [filterDialog, setFilterDialog] = useState(false);

  const [search, setSearch] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [dialogAdd, setDialogAdd] = useState({
    open: false,
    data: {},
    mode: "add",
  });
  const [page, setPage] = useState(1);
  const [update, setUpdate] = useState(false);
  const [allProduct, setAllProduct] = useState([]);
  const [allOfProduct, setAllOfProduct] = useState([]);

  // query coll product
  useEffect(() => {
    if (page === 1) {
      // const fetchData = async () => {
      const getDoc = query(
        collection(firestore, "product"),
        orderBy("createdAt", "desc")
      );
      // const documentSnapshots = await getDocs(getDoc);
      const unsubscribe = onSnapshot(getDoc, (snapshot) => {
        const updatedData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllOfProduct(updatedData); // Update the state with the new data
      });
      return () => unsubscribe();
      // };
      // fetchData();
    }
  }, []);
  useEffect(() => {
    if (page === 1) {
      // const fetchData = async () => {
      const getDoc = query(
        collection(firestore, "product"),
        orderBy("createdAt", "desc"),
        limit(20)
      );
      // const documentSnapshots = await getDocs(getDoc);
      const unsubscribe = onSnapshot(getDoc, (snapshot) => {
        const updatedData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllProduct(updatedData); // Update the state with the new data
      });
      return () => unsubscribe();
      // };
      // fetchData();
    }
  }, [update]);
  const showNext = ({ item }) => {
    if (allProduct.length === 0) {
      alert("Thats all we have for now !");
    } else {
      // const fetchNextData = async () => {
      const getDoc = query(
        collection(firestore, "product"),
        orderBy("createdAt", "desc"),
        startAfter(item.createdAt),
        limit(20)
      );
      const unsubscribe = onSnapshot(getDoc, (snapshot) => {
        const updatedData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllProduct(updatedData); // Update the state with the new data
      });
      setPage(page + 1);
      return () => unsubscribe();
      // };
      // fetchNextData();
    }
  };

  const showPrevious = ({ item }) => {
    // const fetchPreviousData = async () => {
    const getDoc = query(
      collection(firestore, "product"),
      orderBy("createdAt", "desc"),
      endBefore(item.createdAt),
      limitToLast(20)
    );
    const unsubscribe = onSnapshot(getDoc, (snapshot) => {
      const updatedData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllProduct(updatedData); // Update the state with the new data
    });
    setPage(page - 1);
    return () => unsubscribe();
  };
  //   fetchPreviousData();
  // };
  // const handleSearch = (e) => {
  //   setSearchTerm(e.target.value);
  //   setPage(1)
  // };
  const filteredData = search.length > 0 ? search : allProduct;
  // console.log(filteredData)
  // checkbox
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(filteredData.map((item) => item.id));
    } else {
      setSelectedRows([]);
    }
  };
  const handleSelectRow = (e, id) => {
    if (e.target.checked) {
      setSelectedRows([...selectedRows, id]);
    } else {
      setSelectedRows(selectedRows.filter((rowId) => rowId !== id));
    }
  };
  // dialog add
  const handleDeleteClick = async (id) => {
    if (window.confirm(" apakah anda yakin ingin menghapus product ini?")) {
      try {
        const docRef = doc(firestore, "product", id);
        await deleteDoc(docRef);
        setUpdate((prevValue) => !prevValue);
        enqueueSnackbar(`Produk berhasil dihapus!.`, { variant: "success" });
      } catch (e) {
        enqueueSnackbar(`Produk gagal dihapus!.`, { variant: "error" });

        console.log(e.message);
      }
    } else {
    }

    // setData(data.filter((row) => row.id !== id));
  };
  const handleDeleteClickAll = async (allId) => {
    if (window.confirm(" apakah anda yakin ingin menghapus product ini?")) {
      try {
        await Promise.all(
          allId?.map?.(async (id) => {
            const docRef = doc(firestore, "product", id);
            await deleteDoc(docRef);
          })
        );
        setUpdate((prevValue) => !prevValue);
        enqueueSnackbar(`Produk berhasil dihapus!.`, { variant: "success" });
      } catch (e) {
        enqueueSnackbar(`Produk gagal dihapus!.`, { variant: "error" });

        console.log(e.message);
      }
    } else {
    }

    // setData(data.filter((row) => row.id !== id));
  };
  // console.log(allProduct)
  // sort
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });

  const sortedData = React.useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);
  const selectedData = sortedData?.filter?.((item) =>
    selectedRows.includes(item.id)
  );

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };
  const renderSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "asc" ? (
        <SortAlphaDown />
      ) : (
        <SortAlphaDownAlt />
      );
    }
    return <SortDown />;
  };
  return (
    <div className="container">
      <Header />
      <h1 className="page-title">Product</h1>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Typeahead
            id="basic-typeahead"
            labelKey="nama"
            onChange={setSearch}
            options={allOfProduct}
            placeholder="Search Products..."
            selected={search}
            // className="w-50"
            style={{ marginRight: "10px" }}
          />
          <Search size={25} />
        </div>
        {/* <div>
              
            </div> */}
        <div>
          <CSVLink
            style={{
              width: "150px",
              marginRight: "10px",
              whiteSpace: "nowrap",
            }}
            data={selectedData.length > 0 ? selectedData : allOfProduct}
            separator={";"}
            filename={"table_orders.csv"}
            className="btn btn-outline-secondary"
          >
            <CloudArrowDown /> Export As CSV
          </CSVLink>
          <button
            style={{
              // marginTop: '0px',
              marginRight: "10px",
              // padding: '0px',
            }}
            onClick={() => setFilterDialog(true)}
            className="btn btn-outline-secondary "
            variant="secondary"
          >
            <Filter />
            Filter
          </button>
          {/* <CSVLink style={{ width: '120px', marginRight: '10px' }} data={mapData} separator={";"} filename={"table_data.csv"} className="btn btn-primary">
                Export CSV
              </CSVLink> */}
          {selectedRows.length > 0 && (
            <button
              style={{ backgroundColor: "red" }}
              className="button button-primary"
              onClick={() => handleDeleteClickAll(selectedRows)}
            >
              <TrashFill /> Delete
            </button>
          )}
          <button
            onClick={() =>
              setDialogAdd({ open: true, data: selectedData, mode: "add" })
            }
            style={{ backgroundColor: "#998970" }}
            className="button button-primary"
          >
            +Add Product
          </button>
        </div>
      </div>
      <div
        className="form-container"
        style={{
          width: "100%",
          overflowX: "auto",
          overflowY: "hidden",
        }}
      >
        <div className="form-section">
          <div>
            {selectedRows.length > 0 && (
              <div>
                <p>{selectedRows.length} row selected</p>
              </div>
            )}
            <Table striped bordered hover style={{ minWidth: "900px" }}>
              <thead>
                <tr style={{ whiteSpace: "nowrap" }}>
                  <th>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={selectedRows?.length === filteredData?.length}
                      onChange={handleSelectAll}
                      id="flexCheckChecked"
                    />
                  </th>
                  <th>Image</th>
                  {/* <th>Product Id</th> */}
                  {/* <th>SKU</th> */}
                  <th onClick={() => handleSort("nama")}>
                    Product Name {renderSortIcon("nama")}
                  </th>
                  {/* <th>Category</th>
                <th>Weight/gr</th>
                <th>Length</th>
                <th>Width</th>
                <th>Height</th> */}
                  <th>Price</th>
                  <th>COGS</th>
                  <th>Inventory</th>
                  <th>QTY Sold</th>
                  <th>Order</th>
                  <th>Net Revenue</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedData?.map?.((item, i) => {
                  console.log(item?.qty_sold);
                  return (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(item.id)}
                          onChange={(e) => handleSelectRow(e, item.id)}
                        />
                      </td>
                      <td>
                        {item?.thumbnail?.length > 0 ? (
                          <img
                            src={item?.thumbnail?.[0]}
                            alt=""
                            height={50}
                            width={50}
                            style={{ borderRadius: "5px" }}
                          />
                        ) : (
                          <Images size={50} />
                        )}
                      </td>

                      {/* <td>{item?.sku}</td> */}
                      <td>{item?.nama}</td>
                      {/* <td>{item?.category?.nama}</td>
                  <td>{item?.weight}</td>
                  <td>{item?.length}</td>
                  <td>{item?.width}</td>
                  <td>{item?.height}</td> */}
                      <td>{currency(item?.harga)}</td>
                      <td>{item?.cogs ?? 0}</td>
                      <td>{item?.stok}</td>
                      <td>{item?.qty_sold ?? 0}</td>
                      <td>{item?.orderCount ?? 0}</td>
                      <td>
                        {item?.qty_sold > 0
                          ? currency(
                              parseInt(item?.qty_sold) * parseInt(item?.harga)
                            )
                          : "Rp.0"}
                      </td>
                      <td>
                        {" "}
                        <button
                          onClick={() => {
                            navigate(`/products/detailProduct/${item?.id}`);
                            // setDialogAdd({ open: true, data: selectedData, mode: 'edit', item: item })
                          }}
                          style={{ backgroundColor: "#998970" }}
                          className="button button-primary"
                        >
                          <PencilSquare />
                        </button>
                        <button
                          style={{ backgroundColor: "red" }}
                          className="button button-primary"
                          onClick={() => handleDeleteClick(item?.id)}
                        >
                          <TrashFill />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
          <ButtonGroup style={{ textAlign: "center", float: "right" }}>
            {/* //show previous button only when we have items */}
            <Button
              disabled={page === 1}
              style={{
                marginRight: "10px",
                whiteSpace: "nowrap",
                backgroundColor: "#3D5E54",
                border: "none",
              }}
              onClick={() => showPrevious({ item: allProduct[0] })}
            >
              {"<-Prev"}
            </Button>
            <input
              value={page}
              className="input"
              disabled
              style={{
                padding: "0px",
                width: "40px",
                marginRight: "10px",
                textAlign: "center",
                border: "none",
                marginBottom: "8px",
                marginTop: "8px",
              }}
            />
            {/* //show next button only when we have items */}
            <Button
              disabled={filteredData.length < 20}
              style={{
                whiteSpace: "nowrap",
                backgroundColor: "#3D5E54",
                border: "none",
              }}
              onClick={() =>
                showNext({ item: filteredData[filteredData.length - 1] })
              }
            >
              {"Next->"}
            </Button>
          </ButtonGroup>
          <DialogAddProduct
            show={dialogAdd}
            onHide={() => setDialogAdd({ open: false, data: {} })}
            // enqueueSnackbar={enqueueSnackbar}
            setUpdate={setUpdate}
            // handlePayment={handlePayment}
            // loading={loading}
          />
          <FilterProduct
            show={filterDialog}
            handleClose={() => setFilterDialog(false)}
            setAllProducts={setAllProduct}
          />
        </div>
      </div>
    </div>
  );
};

export default ListProduct;
