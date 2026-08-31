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

  // Status filter state
  const [selectedStatus, setSelectedStatus] = useState(null); // null = all, or 'Live', 'Hold', 'Out of Stock', 'Discontinued', 'Draft'

  // Desty sync state
  const [syncing, setSyncing] = useState(false);
  const [syncStats, setSyncStats] = useState({
    totalProducts: 0,
    destyConnected: 0,
    isDestyProduct: 0,
    ermOnly: 0,
  });
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'desty' | 'erm'

  // Product status counts
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    Live: 0,
    Hold: 0,
    "Out of Stock": 0,
    Discontinued: 0,
    Draft: 0,
  });

  // Calculate status counts from all products
  useEffect(() => {
    const counts = {
      all: allOfProduct.length,
      Live: 0,
      Hold: 0,
      "Out of Stock": 0,
      Discontinued: 0,
      Draft: 0,
    };
    allOfProduct.forEach((product) => {
      const status = product.status || "Live";
      if (counts.hasOwnProperty(status)) {
        counts[status]++;
      }
    });
    setStatusCounts(counts);
  }, [allOfProduct]);

  // Reset page when tab changes
  useEffect(() => {
    setPage(1);
    setSearch([]); // Clear search when switching tabs
  }, [activeTab]);

  // Reset page when pageSize changes
  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

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
      const response = await fetch("https://asia-southeast2-carramica-prod.cloudfunctions.net/syncDestyWeightAll", {
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

  // Handle Desty sync (sync weight only for existing connected products)
  const handleSyncDesty = async () => {
    if (!window.confirm("Apakah Anda yakin ingin sync berat dari Desty? Berat produk yang terhubung dengan Desty akan di-sync.")) {
      return;
    }

    setSyncing(true);
    try {
      // Use syncDestyWeightAll - this syncs weight only for existing Desty-connected products
      const response = await fetch("https://asia-southeast2-carramica-prod.cloudfunctions.net/syncDestyWeightAll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updateStock: false })
      });

      const result = await response.json();

      if (result.success) {
        const { synced, skipped, total } = result.results;
        enqueueSnackbar(
          `Sinkronisasi berat berhasil! Disync: ${synced}, Dilewati: ${skipped} (dari total ${total} produk)`,
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

  // Handle Desty produk sync (sync ALL products from Desty - create new, update existing)
  const handleSyncProdukDesty = async () => {
    if (!window.confirm("Apakah Anda yakin ingin sync SEMUA produk dari Desty? Produk baru akan di-create, produk yang ada akan di-update.")) {
      return;
    }

    setSyncing(true);
    try {
      // Use syncDestyProductsHttp - this fetches ALL products from Desty and syncs to Firestore
      const response = await fetch("https://asia-southeast2-carramica-prod.cloudfunctions.net/syncDestyProductsHttp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });

      const result = await response.json();

      if (result.success) {
        const { created, updated, skipped, totalFetched, errors } = result.results;
        enqueueSnackbar(
          `Sync berhasil! Created: ${created}, Updated: ${updated}, Total fetched: ${totalFetched}${errors.length > 0 ? `, Errors: ${errors.length}` : ''}`,
          { variant: "success" }
        );
        // Refresh data
        setUpdate((prev) => !prev);
      } else {
        enqueueSnackbar(`Sync gagal: ${result.error || 'Unknown error'}`, { variant: "error" });
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

  // Filter products by tab and status
  const getFilteredByTab = (products) => {
    // First filter by source (tab)
    let filtered = products;
    if (activeTab === "desty") {
      // Products connected to Desty (either from sync or created from Desty)
      filtered = products.filter(
        (p) => p.destyConnected === true || p.isDestyProduct === true
      );
    } else if (activeTab === "erm") {
      // Products that are NOT connected to Desty
      filtered = products.filter(
        (p) => p.destyConnected !== true && p.isDestyProduct !== true
      );
    }

    // Then filter by status
    if (selectedStatus) {
      filtered = filtered.filter((p) => p.status === selectedStatus);
    }

    return filtered;
  };

  // Get all filtered data (before pagination)
  const getAllFilteredData = () => {
    if (search.length > 0) return search;
    return getFilteredByTab(allOfProduct);
  };

  // Get paginated data for display
  const getPaginatedData = () => {
    const allFiltered = getAllFilteredData();
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return allFiltered.slice(startIndex, endIndex);
  };

  const paginatedData = getPaginatedData();

  // Total count for pagination info
  const totalFilteredCount = getAllFilteredData().length;
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

        {/* Sync Buttons */}
        <div className="d-flex gap-2">
          {/* Sync Produk Desty - sync all products from /api/product/page */}
          <Button
            variant="outline-success"
            onClick={handleSyncProdukDesty}
            disabled={syncing}
            title="Sinkronisasi semua produk dari Desty (stok & data produk)"
          >
            <CloudArrowDown className={syncing ? "spin" : ""} />
            {syncing ? " Sync..." : " Sync Produk Desty"}
          </Button>

          {/* Sync Berat Desty - sync weight only */}
          <Button
            variant="outline-primary"
            onClick={handleSyncDesty}
            disabled={syncing}
            title="Sinkronisasi berat produk dari Desty"
          >
            <ArrowCounterclockwise className={syncing ? "spin" : ""} />
            {syncing ? " Sync..." : " Sync Berat Desty"}
          </Button>
        </div>
      </div>

      {/* Legend for indicators */}
      <div style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}>
        <span style={{ marginRight: "15px" }}>
          <span style={{ fontSize: "14px", marginRight: "3px" }}>⚠️</span>
          Berat belum di-sync dari Desty (klik produk → sync manual)
        </span>
        <span>
          <span style={{ fontSize: "12px", marginRight: "3px" }}>📦</span>
          Ukuran belum diinput (input manual diperlukan)
        </span>
      </div>

      {/* Product Status Filter Buttons */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "15px" }}>
        {/* All Status Button */}
        <Button
          variant={selectedStatus === null ? "primary" : "outline-secondary"}
          size="sm"
          onClick={() => {
            setSelectedStatus(null);
            setPage(1);
          }}
          style={{
            fontWeight: selectedStatus === null ? "bold" : "normal",
          }}
        >
          Semua ({statusCounts.all})
        </Button>

        {/* Live */}
        <Button
          variant={selectedStatus === "Live" ? "success" : "outline-success"}
          size="sm"
          onClick={() => {
            setSelectedStatus(selectedStatus === "Live" ? null : "Live");
            setPage(1);
          }}
          style={{
            fontWeight: selectedStatus === "Live" ? "bold" : "normal",
          }}
        >
          🟢 Live ({statusCounts.Live})
        </Button>

        {/* Hold */}
        <Button
          variant={selectedStatus === "Hold" ? "warning" : "outline-warning"}
          size="sm"
          onClick={() => {
            setSelectedStatus(selectedStatus === "Hold" ? null : "Hold");
            setPage(1);
          }}
          style={{
            fontWeight: selectedStatus === "Hold" ? "bold" : "normal",
          }}
        >
          🟡 Hold ({statusCounts.Hold})
        </Button>

        {/* Out of Stock */}
        <Button
          variant={selectedStatus === "Out of Stock" ? "danger" : "outline-danger"}
          size="sm"
          onClick={() => {
            setSelectedStatus(selectedStatus === "Out of Stock" ? null : "Out of Stock");
            setPage(1);
          }}
          style={{
            fontWeight: selectedStatus === "Out of Stock" ? "bold" : "normal",
          }}
        >
          🔴 Out of Stock ({statusCounts["Out of Stock"]})
        </Button>

        {/* Discontinued */}
        <Button
          variant={selectedStatus === "Discontinued" ? "secondary" : "outline-secondary"}
          size="sm"
          onClick={() => {
            setSelectedStatus(selectedStatus === "Discontinued" ? null : "Discontinued");
            setPage(1);
          }}
          style={{
            fontWeight: selectedStatus === "Discontinued" ? "bold" : "normal",
          }}
        >
          ⚫ Discontinued ({statusCounts.Discontinued})
        </Button>

        {/* Draft */}
        <Button
          variant={selectedStatus === "Draft" ? "info" : "outline-info"}
          size="sm"
          onClick={() => {
            setSelectedStatus(selectedStatus === "Draft" ? null : "Draft");
            setPage(1);
          }}
          style={{
            fontWeight: selectedStatus === "Draft" ? "bold" : "normal",
          }}
        >
          📝 Draft ({statusCounts.Draft})
        </Button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "15px",
          alignItems: "center",
          marginBottom: "15px",
        }}
      >
        {/* Search Bar */}
        <div className="search-container" style={{ flex: "1", maxWidth: "400px", minWidth: "250px" }}>
          <div className="search-wrapper" style={{ position: "relative" }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#6c757d",
                zIndex: 1,
              }}
            />
            <Typeahead
              id="product-search"
              labelKey="nama"
              onChange={setSearch}
              options={getFilteredByTab(allOfProduct)}
              placeholder="Cari produk..."
              selected={search}
              maxResults={20}
              highlightOnlyResult={true}
              className="product-search-input"
              renderMenuItemResults={(option, props) => option.nama}
              bodyContainer={true}
              style={{ width: "100%" }}
            />
            {/* Clear button when search is active */}
            {search.length > 0 && (
              <button
                type="button"
                onClick={() => setSearch([])}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0",
                  color: "#6c757d",
                  fontSize: "18px",
                  lineHeight: 1,
                }}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
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
                      <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                        {item?.stok}
                        {/* Weight indicator */}
                        {(!item?.weight || item?.weight === 0) && isDestyConnected && (
                          <span
                            title="⚠️ Berat belum disinkronisasi. Klik produk ini untuk sync berat dari Desty."
                            style={{
                              display: "inline-block",
                              marginLeft: "5px",
                              cursor: "pointer",
                              fontSize: "14px"
                            }}
                            onClick={() => navigate(`/products/detailProduct/${item?.id}`)}
                          >
                            ⚠️
                          </span>
                        )}
                        {/* Dimension indicator - needs manual input */}
                        {(!item?.length || !item?.width || !item?.height) && (
                          <span
                            title="⚠️ Ukuran (P x L x T) belum diinput. Input manual diperlukan."
                            style={{
                              display: "inline-block",
                              marginLeft: "2px",
                              cursor: "help",
                              fontSize: "12px"
                            }}
                          >
                            📦
                          </span>
                        )}
                      </td>
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
                        {/* SKU Match Status Indicator */}
                        {(() => {
                          const rapinMatch = item.sku_rapin && item.destySkuNumber && item.sku_rapin === item.destySkuNumber;
                          const crmMatch = item.sku && item.destySkuNumber && item.sku === item.destySkuNumber;
                          const allMatch = rapinMatch && crmMatch;
                          const anyMatch = rapinMatch || crmMatch;
                          const noMatch = !anyMatch && (item.sku_rapin || item.sku || item.destySkuNumber);

                          if (allMatch) {
                            return <Badge bg="success" className="mt-1" title="Semua SKU cocok">Match</Badge>;
                          }
                          if (rapinMatch && !crmMatch) {
                            return <Badge bg="info" className="mt-1" title="SKU Rapin = SKU Desty, CRM berbeda">Rapin ✓</Badge>;
                          }
                          if (crmMatch && !rapinMatch) {
                            return <Badge bg="primary" className="mt-1" title="SKU CRM = SKU Desty, Rapin berbeda">CRM ✓</Badge>;
                          }
                          if (noMatch) {
                            return <Badge bg="danger" className="mt-1" title="Semua SKU tidak cocok">No Match</Badge>;
                          }
                          return null;
                        })()}
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
        /* Search Input Styling */
        .search-container {
          width: 100%;
        }
        .search-wrapper {
          position: relative;
        }
        .product-search-input .rbt-input-main {
          padding: 8px 40px 8px 40px !important;
          border-radius: 20px !important;
          border: 1px solid #ced4da !important;
          font-size: 14px !important;
          width: 100% !important;
          transition: all 0.2s ease !important;
        }
        .product-search-input .rbt-input-main:focus {
          border-color: #3D5E54 !important;
          box-shadow: 0 0 0 3px rgba(61, 94, 84, 0.15) !important;
          outline: none !important;
        }
        .product-search-input .rbt-input-main::placeholder {
          color: #adb5bd !important;
        }
        /* Dropdown menu styling */
        .product-search-input .rbt-menu {
          border-radius: 8px !important;
          border: 1px solid #e9ecef !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
          margin-top: 4px !important;
          max-height: 300px !important;
          overflow-y: auto !important;
        }
        .product-search-input .rbt-menu-item {
          padding: 10px 12px !important;
          border-bottom: 1px solid #f1f3f4 !important;
          transition: background 0.15s ease !important;
        }
        .product-search-input .rbt-menu-item:hover {
          background-color: #f8f9fa !important;
        }
        .product-search-input .rbt-menu-item.active {
          background-color: #3D5E54 !important;
          color: white !important;
        }
        .product-search-input .rbt-menu-item.selected {
          background-color: #e8f4f1 !important;
        }
        .product-search-input .rbt-menu-item highlight {
          background-color: #fff3cd !important;
          font-weight: 600 !important;
        }
        /* Token/pill styling for selected items */
        .product-search-input .rbt-token {
          background-color: #3D5E54 !important;
          color: white !important;
          border-radius: 12px !important;
          padding: 2px 8px !important;
          font-size: 12px !important;
        }
        .product-search-input .rbt-token-close-btn {
          color: white !important;
        }
        /* Close button hover */
        button[title="Clear search"]:hover {
          color: #dc3545 !important;
        }
      `}</style>
    </div>
    </Layout>
  );
};

export default ListProduct;
