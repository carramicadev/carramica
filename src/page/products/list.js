import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { useSnackbar } from "notistack";
import React, { useEffect, useState } from "react";
import { Button, ButtonGroup, Table, Badge, Nav } from "react-bootstrap";
import {
  ArrowCounterclockwise,
  CloudArrowDown,
  Filter,
  Images,
  Link as LinkIcon,
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
import Layout from "../../components/Layout";
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
  const [pageSize, setPageSize] = useState(20);
  const [update, setUpdate] = useState(false);
  const [allOfProduct, setAllOfProduct] = useState([]);

  // Desty sync state
  const [syncing, setSyncing] = useState(false);
  const [syncStats, setSyncStats] = useState({
    totalProducts: 0,
    destyConnected: 0,
    isDestyProduct: 0,
    ermOnly: 0,
  });
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'desty' | 'erm'

  // Reset page when tab changes
  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  // Reset page when pageSize changes
  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  // Calculate stats from local products (no external fetch needed)
  const calculateLocalStats = (products) => {
    const destyProducts = products.filter(p => p.destyConnected === true || p.isDestyProduct === true);
    const ermOnly = products.filter(p => p.destyConnected !== true && p.isDestyProduct !== true);
    return {
      totalProducts: products.length,
      destyConnected: destyProducts.length,
      isDestyProduct: 0,
      ermOnly: ermOnly.length,
    };
  };

  // Update stats when products change
  useEffect(() => {
    if (allOfProduct.length > 0) {
      const stats = calculateLocalStats(allOfProduct);
      setSyncStats(stats);
    }
  }, [allOfProduct]);

  // Fetch Desty connection statistics (manual only)
  const fetchDestyStats = async () => {
    // Use HTTP endpoint instead of callable
    try {
      const response = await fetch("https://asia-southeast2-charamica-8bb03.cloudfunctions.net/syncDestyProductsHttp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      const result = await response.json();
      if (result.success) {
        setSyncStats((prev) => ({ ...prev, lastSync: new Date() }));
        enqueueSnackbar("Sinkronisasi berhasil!", { variant: "success" });
      }
    } catch (error) {
      console.warn("HTTP sync skipped:", error);
    }
  };

  // Handle Desty sync
  const handleSyncDesty = async () => {
    if (!window.confirm("Apakah Anda yakin ingin melakukan sinkronisasi dengan Desty? Produk yang ada di Desty akan di-sync ke Carramica.")) {
      return;
    }

    setSyncing(true);
    try {
      // Use HTTP endpoint
      const response = await fetch("https://asia-southeast2-charamica-8bb03.cloudfunctions.net/syncDestyProductsHttp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updateStock: false })
      });

      const result = await response.json();

      if (result.success) {
        const { created, updated, skipped } = result.results;
        enqueueSnackbar(
          `Sinkronisasi berhasil! Dibuat: ${created}, Diupdate: ${updated}, Dilewati: ${skipped}`,
          { variant: "success" }
        );
        // Refresh data
        setUpdate((prev) => !prev);
      } else {
        enqueueSnackbar(`Sinkronisasi gagal: ${result.error || 'Unknown error'}`, { variant: "error" });
      }
    } catch (error) {
      console.error("Sync error:", error);
      enqueueSnackbar(`Gagal sinkronisasi: ${error.message}`, { variant: "error" });
    } finally {
      setSyncing(false);
    }
  };

  // Load all products (used for all tabs with client-side pagination)
  useEffect(() => {
    const getDoc = query(
      collection(firestore, "product"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(getDoc, (snapshot) => {
      const updatedData = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setAllOfProduct(updatedData);
    });
    return () => unsubscribe();
  }, [update]);
  //   fetchPreviousData();
  // };
  // const handleSearch = (e) => {
  //   setSearchTerm(e.target.value);
  //   setPage(1)
  // };

  // Filter products by tab
  const getFilteredByTab = (products) => {
    if (activeTab === "all") {
      // Show ALL products
      return products;
    }
    if (activeTab === "desty") {
      // Products connected to Desty (either from sync or created from Desty)
      return products.filter(
        (p) => p.destyConnected === true || p.isDestyProduct === true
      );
    }
    if (activeTab === "erm") {
      // Products that are NOT connected to Desty
      // Use !== true to handle undefined, null, false, "false", 0
      return products.filter(
        (p) => p.destyConnected !== true && p.isDestyProduct !== true
      );
    }
    return products;
  };

  // Get all filtered data (before pagination)
  const getAllFilteredData = () => {
    if (search.length > 0) return search;
    return getFilteredByTab(allOfProduct);
  };

  // Get paginated data for display (client-side pagination for all tabs)
  const getPaginatedData = () => {
    const filtered = getFilteredByTab(allOfProduct);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filtered.slice(startIndex, endIndex);
  };

  const paginatedData = getPaginatedData();

  // Total count for pagination info
  const totalFilteredCount = getFilteredByTab(allOfProduct).length;
  const totalPages = Math.ceil(totalFilteredCount / pageSize);
  // console.log(filteredData)
  // checkbox
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(paginatedData.map((item) => item.id));
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
    let sortableItems = [...paginatedData];
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
  }, [paginatedData, sortConfig]);
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
    <Layout>
    <div className="container">
      <h1 className="page-title">Product</h1>

      {/* Tab Navigation for Product Source */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
          <Nav.Item>
            <Nav.Link eventKey="all">
              Semua Produk
              {syncStats && (
                <Badge bg="secondary" className="ms-2">{syncStats.totalProducts}</Badge>
              )}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="desty">
              <LinkIcon className="me-1" />
              Produk Desty
              {syncStats && (
                <Badge bg="success" className="ms-2">
                  {(syncStats.destyConnected || 0) + (syncStats.isDestyProduct || 0)}
                </Badge>
              )}
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="erm">
              Produk ERM Carramica
              {syncStats && (
                <Badge bg="info" className="ms-2">{syncStats.ermOnly}</Badge>
              )}
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {/* Sync Button */}
        <Button
          variant="outline-primary"
          onClick={handleSyncDesty}
          disabled={syncing}
          title="Sinkronisasi produk dan stok dari Desty"
        >
          <ArrowCounterclockwise className={syncing ? "spin" : ""} />
          {syncing ? " Sinkronisasi..." : " Sinkronisasi Desty"}
        </Button>
      </div>

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
            options={getFilteredByTab(allOfProduct)}
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
            data={selectedData.length > 0 ? selectedData : getFilteredByTab(allOfProduct)}
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
      <div className="form-container">
        <div className="form-section">
          <div>
            {selectedRows.length > 0 && (
              <div>
                <p>{selectedRows.length} row selected</p>
              </div>
            )}
            <Table
              striped
              bordered
              hover
              style={{
                tableLayout: "fixed",
                width: "100%",
                fontSize: "13px",
              }}
              className="product-table"
            >
              <colgroup>
                <col style={{ width: "40px" }} />
                <col style={{ width: "60px" }} />
                <col style={{ width: "18%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "8%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ textAlign: "center", verticalAlign: "middle" }}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={selectedRows?.length === paginatedData?.length}
                      onChange={handleSelectAll}
                      id="flexCheckChecked"
                    />
                  </th>
                  <th style={{ textAlign: "center", verticalAlign: "middle" }}>Image</th>
                  <th onClick={() => handleSort("nama")} style={{ verticalAlign: "middle", cursor: "pointer" }}>
                    Product Name {renderSortIcon("nama")}
                  </th>
                  <th style={{ textAlign: "right", verticalAlign: "middle" }}>Price</th>
                  <th style={{ textAlign: "right", verticalAlign: "middle" }}>COGS</th>
                  <th style={{ textAlign: "center", verticalAlign: "middle" }}>Inventory</th>
                  <th style={{ textAlign: "center", verticalAlign: "middle" }}>QTY Sold</th>
                  <th style={{ textAlign: "center", verticalAlign: "middle" }}>Order</th>
                  <th style={{ textAlign: "right", verticalAlign: "middle" }}>Net Revenue</th>
                  <th style={{ verticalAlign: "middle" }}>SKU Info</th>
                  <th style={{ textAlign: "center", verticalAlign: "middle" }}>Desty</th>
                  <th style={{ textAlign: "center", verticalAlign: "middle" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedData?.map?.((item, i) => {
                  const isDestyConnected = item.destyConnected === true || item.isDestyProduct === true;
                  return (
                    <tr key={item.id}>
                      <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(item.id)}
                          onChange={(e) => handleSelectRow(e, item.id)}
                        />
                      </td>
                      <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                        {item?.thumbnail?.length > 0 ? (
                          <img
                            src={item?.thumbnail?.[0]}
                            alt=""
                            height={40}
                            width={40}
                            style={{ borderRadius: "5px", objectFit: "cover" }}
                          />
                        ) : (
                          <Images size={30} />
                        )}
                      </td>

                      <td style={{
                        verticalAlign: "middle",
                        whiteSpace: "normal",
                        wordWrap: "break-word",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}>
                        <span title={item?.nama}>{item?.nama}</span>
                      </td>
                      <td style={{ textAlign: "right", verticalAlign: "middle" }}>{currency(item?.harga)}</td>
                      <td style={{ textAlign: "right", verticalAlign: "middle" }}>{item?.cogs ?? 0}</td>
                      <td style={{ textAlign: "center", verticalAlign: "middle" }}>{item?.stok}</td>
                      <td style={{ textAlign: "center", verticalAlign: "middle" }}>{item?.qty_sold ?? 0}</td>
                      <td style={{ textAlign: "center", verticalAlign: "middle" }}>{item?.orderCount ?? 0}</td>
                      <td style={{ textAlign: "right", verticalAlign: "middle" }}>
                        {item?.qty_sold > 0
                          ? currency(parseInt(item?.qty_sold) * parseInt(item?.harga))
                          : "Rp.0"}
                      </td>
                      <td style={{ fontSize: "11px", verticalAlign: "middle" }}>
                        {/* SKU Info */}
                        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={`SKU Rapin: ${item.sku_rapin || '-'}`}>
                          Rapin: <code>{item.sku_rapin || '-'}</code>
                        </div>
                        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={`SKU CRM: ${item.sku || '-'}`}>
                          CRM: <code>{item.sku || '-'}</code>
                        </div>
                        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={`SKU Desty: ${item.destySkuNumber || '-'}`}>
                          Desty: <code>{item.destySkuNumber || '-'}</code>
                        </div>
                        {/* Matching indicator */}
                        {(item.sku_rapin === item.destySkuNumber || item.sku === item.destySkuNumber) ? (
                          <Badge bg="warning" className="mt-1" title="SKU ERM = SKU Desty">Match</Badge>
                        ) : null}
                      </td>
                      <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                        {/* Desty Connection Indicator */}
                        {isDestyConnected ? (
                          <Badge
                            bg="success"
                            title={`Terhubung dengan Desty (SKU: ${item.destySkuNumber || item.sku_rapin || item.sku})`}
                            style={{ cursor: "pointer" }}
                            onClick={() => {
                              if (item.destyLastSync) {
                                enqueueSnackbar(
                                  `Terakhir sync: ${new Date(item.destyLastSync.seconds * 1000).toLocaleString("id-ID")}`,
                                  { variant: "info" }
                                );
                              }
                            }}
                          >
                            <LinkIcon /> Desty
                          </Badge>
                        ) : (
                          <Badge bg="secondary" title="Tidak terhubung dengan Desty">
                            ERM Only
                          </Badge>
                        )}
                      </td>
                      <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                        <button
                          onClick={() => {
                            navigate(`/products/detailProduct/${item?.id}`);
                          }}
                          style={{ backgroundColor: "#998970", marginRight: "5px" }}
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
          {/* Pagination Controls */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "15px" }}>
            {/* Page Size Selector */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "14px", color: "#666" }}>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                style={{
                  padding: "5px 10px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "14px",
                  cursor: "pointer"
                }}
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span style={{ fontSize: "14px", color: "#666" }}>
                Showing {Math.min((page - 1) * pageSize + 1, totalFilteredCount || 1)} - {Math.min(page * pageSize, totalFilteredCount)} of {totalFilteredCount}
              </span>
            </div>

            {/* Page Navigation */}
            <ButtonGroup style={{ textAlign: "center" }}>
              <Button
                disabled={page === 1}
                style={{
                  marginRight: "5px",
                  whiteSpace: "nowrap",
                  backgroundColor: "#3D5E54",
                  border: "none",
                }}
                onClick={() => setPage(page - 1)}
              >
                {"<-Prev"}
              </Button>
              <input
                value={`${page} / ${Math.max(1, totalPages)}`}
                className="input"
                disabled
                style={{
                  padding: "5px 10px",
                  width: "70px",
                  marginRight: "5px",
                  textAlign: "center",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              />
              <Button
                disabled={page >= totalPages}
                style={{
                  whiteSpace: "nowrap",
                  backgroundColor: "#3D5E54",
                  border: "none",
                }}
                onClick={() => setPage(page + 1)}
              >
                {"Next->"}
              </Button>
            </ButtonGroup>
          </div>
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
            setAllProducts={setAllOfProduct}
          />
        </div>
      </div>

      {/* Custom CSS */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        /* Table styling */
        .product-table {
          table-layout: fixed;
          overflow: hidden;
        }
        .product-table td {
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .product-table td span {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        /* Remove horizontal scroll on table container */
        .form-container {
          overflow-x: visible !important;
        }
        /* Button styling */
        .button {
          padding: 4px 8px !important;
          font-size: 12px !important;
        }
      `}</style>
    </div>
    </Layout>
  );
};

export default ListProduct;
