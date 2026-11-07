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
import { Button, ButtonGroup, Table } from "react-bootstrap";
import {
  Archive,
  CheckCircle,
  CloudArrowDown,
  FileEarmarkText,
  Filter,
  Grid,
  Images,
  PauseCircle,
  PencilSquare,
  Search,
  SlashCircle,
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

const STATUS_TABS = [
  { key: null, label: "Semua", Icon: Grid },
  { key: "Live", label: "Live", Icon: CheckCircle },
  { key: "Hold", label: "Hold", Icon: PauseCircle },
  { key: "Out of Stock", label: "Out of Stock", Icon: SlashCircle },
  { key: "Discontinued", label: "Discontinued", Icon: Archive },
  { key: "Draft", label: "Draft", Icon: FileEarmarkText },
];

// Soft badge colors per product status (background, text)
const STATUS_BADGE = {
  Live: { bg: "#e6f4ea", color: "#1e7a3c", Icon: CheckCircle },
  Hold: { bg: "#fdf3dc", color: "#946200", Icon: PauseCircle },
  "Out of Stock": { bg: "#fde8e8", color: "#b42318", Icon: SlashCircle },
  Discontinued: { bg: "#eef0f2", color: "#5b6470", Icon: Archive },
  Draft: { bg: "#e8f0fb", color: "#2f5fa7", Icon: FileEarmarkText },
};

const StatusBadge = ({ status }) => {
  const label = status || "Live";
  const { bg, color, Icon } = STATUS_BADGE[label] || STATUS_BADGE.Discontinued;
  return (
    <span className="status-badge" style={{ backgroundColor: bg, color }} title={label}>
      <Icon size={11} />
      <span>{label}</span>
    </span>
  );
};

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

  // Product status counts
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    Live: 0,
    Hold: 0,
    "Out of Stock": 0,
    Discontinued: 0,
    Draft: 0,
  });

  // Product status counts - calculated from all products
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

  // Reset page when pageSize changes
  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [search]);

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

  // Filter products by status
  const getFilteredByStatus = (products) => {
    if (selectedStatus) {
      return products.filter((p) => p.status === selectedStatus);
    }
    return products;
  };

  // Get all filtered data (before pagination)
  const getAllFilteredData = () => {
    if (search.length > 0) return search;
    return getFilteredByStatus(allOfProduct);
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

      {/* Legend for indicators */}
      <div style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}>
        <span>
          <span style={{ fontSize: "12px", marginRight: "3px" }}>📦</span>
          Ukuran belum diinput (input manual diperlukan)
        </span>
      </div>

      {/* Product Status Filter Tabs */}
      <div className="status-tabs" role="tablist">
        {STATUS_TABS.map(({ key, label, Icon }) => {
          const isActive = selectedStatus === key;
          return (
            <button
              key={label}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`status-tab${isActive ? " active" : ""}`}
              onClick={() => {
                setSelectedStatus(key);
                setPage(1);
              }}
            >
              <Icon size={14} />
              <span>{label}</span>
              <span className="status-tab-count">
                {key === null ? statusCounts.all : statusCounts[key]}
              </span>
            </button>
          );
        })}
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
              options={getFilteredByStatus(allOfProduct)}
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
            data={selectedData.length > 0 ? selectedData : getFilteredByStatus(allOfProduct)}
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
                fontSize: "11px",
              }}
              className="product-table"
            >
              <colgroup>
                <col style={{ width: "35px" }} />
                <col style={{ width: "50px" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "8%" }} />
                <col style={{ width: "7%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "6%" }} />
                <col style={{ width: "9%" }} />
                <col style={{ width: "11%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "9%" }} />
              </colgroup>
              <thead>
                <tr style={{ fontSize: "10px" }}>
                  <th style={{ textAlign: "center", verticalAlign: "middle", fontSize: "10px" }}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={selectedRows?.length === paginatedData?.length}
                      onChange={handleSelectAll}
                      id="flexCheckChecked"
                    />
                  </th>
                  <th style={{ textAlign: "center", verticalAlign: "middle", fontSize: "10px" }}>Img</th>
                  <th onClick={() => handleSort("nama")} style={{ verticalAlign: "middle", cursor: "pointer", fontSize: "10px" }}>
                    Product Name {renderSortIcon("nama")}
                  </th>
                  <th style={{ textAlign: "right", verticalAlign: "middle", fontSize: "10px" }}>Price</th>
                  <th style={{ textAlign: "right", verticalAlign: "middle", fontSize: "10px" }}>COGS</th>
                  <th style={{ textAlign: "center", verticalAlign: "middle", fontSize: "10px" }}>Stock</th>
                  <th style={{ textAlign: "center", verticalAlign: "middle", fontSize: "10px" }}>Qty Sold</th>
                  <th style={{ textAlign: "center", verticalAlign: "middle", fontSize: "10px" }}>Order</th>
                  <th style={{ textAlign: "right", verticalAlign: "middle", fontSize: "10px" }}>Revenue</th>
                  <th style={{ verticalAlign: "middle", fontSize: "10px" }}>SKU</th>
                  <th style={{ textAlign: "center", verticalAlign: "middle", fontSize: "10px" }}>Status</th>
                  <th style={{ textAlign: "center", verticalAlign: "middle", fontSize: "10px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedData?.map?.((item, i) => {
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
                        fontSize: "11px",
                      }}>
                        <span title={item?.nama} style={{ fontSize: "11px" }}>{item?.nama}</span>
                      </td>
                      <td style={{ textAlign: "right", verticalAlign: "middle", fontSize: "10px" }}>{currency(item?.harga)}</td>
                      <td style={{ textAlign: "right", verticalAlign: "middle", fontSize: "10px" }}>{item?.cogs ?? 0}</td>
                      <td style={{ textAlign: "center", verticalAlign: "middle", fontSize: "10px" }}>
                        {item?.stok ?? 0}
                        {/* Dimension indicator - needs manual input */}
                        {(!item?.length || !item?.width || !item?.height) && (
                          <span
                            title="⚠️ Ukuran (P x L x T) belum diinput. Input manual diperlukan."
                            style={{
                              display: "inline-block",
                              marginLeft: "2px",
                              cursor: "help",
                              fontSize: "10px"
                            }}
                          >
                            📦
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "center", verticalAlign: "middle", fontSize: "10px" }}>{item?.qty_sold ?? 0}</td>
                      <td style={{ textAlign: "center", verticalAlign: "middle", fontSize: "10px" }}>{item?.orderCount ?? 0}</td>
                      <td style={{ textAlign: "right", verticalAlign: "middle", fontSize: "10px" }}>
                        {item?.qty_sold > 0
                          ? currency(parseInt(item?.qty_sold) * parseInt(item?.harga))
                          : "Rp.0"}
                      </td>
                      <td style={{ fontSize: "10px", verticalAlign: "middle" }}>
                        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={item.sku || '-'}>
                          {item.sku || '-'}
                        </div>
                      </td>
                      <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                        <StatusBadge status={item?.status} />
                      </td>
                      <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                        <button
                          onClick={() => {
                            navigate(`/products/detailProduct/${item?.id}`);
                          }}
                          style={{ backgroundColor: "#998970", marginRight: "3px", padding: "3px 6px" }}
                          className="button button-primary"
                        >
                          <PencilSquare size={12} />
                        </button>
                        <button
                          style={{ backgroundColor: "red", padding: "3px 6px" }}
                          className="button button-primary"
                          onClick={() => handleDeleteClick(item?.id)}
                        >
                          <TrashFill size={12} />
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
        /* Status filter tabs */
        .status-tabs {
          display: flex;
          gap: 4px;
          overflow-x: auto;
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 16px;
        }
        .status-tab {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          margin-bottom: -1px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          color: #6b7280;
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
          cursor: pointer;
          transition: color 0.15s ease, border-color 0.15s ease;
        }
        .status-tab:hover {
          color: #3D5E54;
        }
        .status-tab:focus-visible {
          outline: 2px solid rgba(61, 94, 84, 0.4);
          outline-offset: -2px;
          border-radius: 4px;
        }
        .status-tab.active {
          color: #3D5E54;
          font-weight: 600;
          border-bottom-color: #3D5E54;
        }
        .status-tab-count {
          min-width: 22px;
          padding: 1px 7px;
          border-radius: 999px;
          background: #f1f3f2;
          color: #6b7280;
          font-size: 11px;
          font-weight: 600;
          text-align: center;
        }
        .status-tab.active .status-tab-count {
          background: #3D5E54;
          color: #fff;
        }
        /* Status badge in table */
        .product-table td .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          max-width: 100%;
          padding: 2px 7px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 600;
          line-height: 1.2;
          white-space: nowrap;
        }
        .product-table td .status-badge svg {
          flex-shrink: 0;
        }
        .product-table td .status-badge span {
          display: inline;
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
