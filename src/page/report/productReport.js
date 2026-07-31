import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  getDocs,
  query,
  Timestamp,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { set } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { firestore } from "../../FirebaseFrovider";
import Loading from "../../components/Loading";
import { CSVLink } from "react-csv";
import { CloudArrowDown, ArrowDown, ArrowUp, ArrowLeft, ArrowRight } from "react-bootstrap-icons";

export default function ReportProdukTerjual() {
  const [orders, setOrders] = useState([]);
  const [productsMap, setProductsMap] = useState({});
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔥 For multi-column sorting
  const [sortField, setSortField] = useState("nama");
  const [sortOrder, setSortOrder] = useState("asc");

  // 🔥 Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const pageSizeOptions = [20, 50, 100, 200, "All"];

  // 🔹 Fetch orders
  useEffect(() => {
    async function fetchOrders() {
      if (!startDate || !endDate) return;
      setLoading(true);

      try {
        const startTimestamp = Timestamp.fromDate(startDate);
        const endTimestamp = Timestamp.fromDate(
          set(new Date(endDate), {
            hours: 23,
            minutes: 59,
            seconds: 59,
            milliseconds: 999,
          })
        );

        const q = query(
          collection(firestore, "orders"),
          where("paymentStatus", "==", "settlement"),
          where("createdAt", ">=", startTimestamp),
          where("createdAt", "<=", endTimestamp)
        );

        const snap = await getDocs(q);
        const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setOrders(list);

        await fetchProductDetails(list);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [startDate, endDate]);

  // 🔥 Fetch product docs only once (VERY FAST)
  async function fetchProductDetails(orderList) {
    const productIds = new Set();

    // Collect product IDs from orders
    orderList.forEach((order) => {
      order.orders?.forEach((ord) => {
        ord.products?.forEach((p) => {
          productIds.add(p.id);
        });
      });
    });

    const map = {};

    // Fetch all product docs
    await Promise.all(
      [...productIds].map(async (pid) => {
        const snap = await getDoc(doc(firestore, "products", pid));
        if (snap.exists()) {
          map[pid] = snap.data();
        }
      })
    );

    setProductsMap(map);
  }

  // 🔹 Aggregate products
  const filteredProducts = useMemo(() => {
    const allProducts = [];

    orders.forEach((order) => {
      order.orders?.forEach((ord) => {
        ord.products?.forEach((p) => {
          const realProduct = productsMap[p.id];

          allProducts.push({
            id: p.id,
            nama: realProduct?.nama || p.nama,
            sku: realProduct?.sku || p.sku,
            quantity: p.quantity,
            categoryName:
              realProduct?.category?.nama || p.category?.nama || "-",
          });
        });
      });
    });

    // Aggregate by product
    const productMap = new Map();
    allProducts.forEach((p) => {
      if (productMap.has(p.id)) {
        productMap.get(p.id).totalQty += p.quantity;
      } else {
        productMap.set(p.id, {
          nama: p.nama,
          sku: p.sku,
          totalQty: p.quantity,
          categoryName: p.categoryName,
        });
      }
    });

    const arr = Array.from(productMap.values());

    // ⭐ MULTI-COLUMN SORTING
    arr.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      // If sorting numeric (quantity)
      if (typeof valA === "number") {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }

      // Sorting text
      return sortOrder === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

    return arr;
  }, [orders, productsMap, sortField, sortOrder]);

  // 🔥 Pagination logic
  const totalItems = filteredProducts.length;
  const totalPages = pageSize === "All" ? 1 : Math.ceil(totalItems / pageSize);
  const startIndex = pageSize === "All" ? 0 : (currentPage - 1) * pageSize;
  const endIndex = pageSize === "All" ? totalItems : Math.min(startIndex + pageSize, totalItems);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when pageSize or filteredProducts changes
  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, filteredProducts.length]);

  // 🔥 Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <ArrowUp size={14} />
    ) : (
      <ArrowDown size={14} />
    );
  };

  // 🔹 Styles - Improved Design
  const styles = {
    container: {
      padding: 24,
      maxWidth: 1400,
      margin: "0 auto",
      backgroundColor: "#f8f9fa",
      minHeight: "calc(100vh - 100px)",
      borderRadius: 12,
    },
    card: {
      backgroundColor: "white",
      borderRadius: 12,
      padding: 24,
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      marginBottom: 24,
    },
    header: {
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 24,
      color: "#333",
      display: "flex",
      alignItems: "center",
      gap: 12,
    },
    filterContainer: {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "space-between",
      alignItems: "flex-end",
      gap: 16,
      marginBottom: 24,
    },
    filterGroup: {
      display: "flex",
      flexWrap: "wrap",
      gap: 16,
      alignItems: "flex-end",
    },
    filterItem: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
    },
    filterLabel: {
      fontSize: 14,
      fontWeight: 600,
      color: "#555",
    },
    dateInput: {
      padding: "10px 14px",
      borderRadius: 8,
      border: "1px solid #ddd",
      fontSize: 14,
      minWidth: 160,
    },
    rightSection: {
      display: "flex",
      alignItems: "center",
      gap: 16,
    },
    exportButton: {
      display: "flex",
      alignItems: "center",
      gap: 12,
    },
    totalBadge: {
      backgroundColor: "#3D5E54",
      color: "white",
      padding: "10px 20px",
      borderRadius: 8,
      display: "flex",
      alignItems: "center",
      gap: 8,
    },
    totalLabel: {
      fontSize: 14,
      fontWeight: 500,
    },
    totalValue: {
      fontSize: 18,
      fontWeight: "bold",
    },
    tableWrapper: {
      overflowX: "auto",
      borderRadius: 8,
      border: "1px solid #e0e0e0",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: 14,
      minWidth: 600,
    },
    th: {
      padding: "14px 16px",
      borderBottom: "2px solid #e0e0e0",
      backgroundColor: "#3D5E54",
      color: "white",
      cursor: "pointer",
      whiteSpace: "nowrap",
      fontWeight: 600,
      textAlign: "left",
      fontSize: 14,
    },
    td: {
      padding: "14px 16px",
      borderBottom: "1px solid #eee",
      fontSize: 14,
      color: "#333",
    },
    paginationContainer: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 20,
      padding: "16px 0",
      borderTop: "1px solid #eee",
      flexWrap: "wrap",
      gap: 16,
    },
    paginationInfo: {
      fontSize: 14,
      color: "#666",
    },
    paginationControls: {
      display: "flex",
      alignItems: "center",
      gap: 8,
    },
    pageButton: {
      padding: "8px 12px",
      border: "1px solid #ddd",
      backgroundColor: "white",
      borderRadius: 6,
      cursor: "pointer",
      fontSize: 14,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    pageButtonDisabled: {
      opacity: 0.5,
      cursor: "not-allowed",
    },
    pageNumber: {
      padding: "8px 14px",
      border: "1px solid #ddd",
      backgroundColor: "white",
      borderRadius: 6,
      cursor: "pointer",
      fontSize: 14,
      minWidth: 40,
    },
    pageNumberActive: {
      backgroundColor: "#3D5E54",
      color: "white",
      border: "1px solid #3D5E54",
    },
    pageSizeSelect: {
      padding: "8px 12px",
      border: "1px solid #ddd",
      borderRadius: 6,
      fontSize: 14,
      backgroundColor: "white",
      cursor: "pointer",
    },
    sortIcon: {
      marginLeft: 6,
      opacity: 0.7,
    },
    noDataText: {
      padding: "20px",
      textAlign: "center",
      color: "#666",
      fontSize: 14,
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>
        <span style={{
          backgroundColor: "#3D5E54",
          color: "white",
          padding: "8px 12px",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
        }}>
          📊
        </span>
        Product Report
      </h2>

      {/* Filter Card */}
      <div style={styles.card}>
        <div style={styles.filterContainer}>
          <div style={styles.filterGroup}>
            <div style={styles.filterItem}>
              <label style={styles.filterLabel}>From Date</label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                dateFormat="dd/MM/yyyy"
                placeholderText="Select start date"
                style={styles.dateInput}
                className="form-control"
              />
            </div>

            <div style={styles.filterItem}>
              <label style={styles.filterLabel}>To Date</label>
              <DatePicker
                selected={endDate}
                onChange={(date) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate}
                dateFormat="dd/MM/yyyy"
                placeholderText="Select end date"
                className="form-control"
              />
            </div>
          </div>

          {/* Right Section: Total Badge + Export Button */}
          <div style={styles.rightSection}>
            <div style={styles.totalBadge}>
              <span style={styles.totalLabel}>Total Products Sold:</span>
              <span style={styles.totalValue}>
                {filteredProducts.reduce((sum, p) => sum + p.totalQty, 0).toLocaleString()}
              </span>
            </div>

            <div style={styles.exportButton}>
              <CSVLink
                data={filteredProducts}
                separator=";"
                filename={"product_report.csv"}
                className="btn btn-success"
                style={{
                  backgroundColor: "#28a745",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: 8,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <CloudArrowDown /> Export CSV
              </CSVLink>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <Loading />
          </div>
        ) : (
          <>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={{...styles.th, borderTopLeftRadius: 8}} onClick={() => handleSort("nama")}>
                      Product Name
                      <span style={styles.sortIcon}>
                        <SortIcon field="nama" />
                      </span>
                    </th>

                    <th style={styles.th} onClick={() => handleSort("sku")}>
                      SKU
                      <span style={styles.sortIcon}>
                        <SortIcon field="sku" />
                      </span>
                    </th>

                    <th style={styles.th} onClick={() => handleSort("categoryName")}>
                      Category
                      <span style={styles.sortIcon}>
                        <SortIcon field="categoryName" />
                      </span>
                    </th>

                    <th style={{...styles.th, borderTopRightRadius: 8}} onClick={() => handleSort("totalQty")}>
                      Quantity Sold
                      <span style={styles.sortIcon}>
                        <SortIcon field="totalQty" />
                      </span>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedProducts.length > 0 ? (
                    paginatedProducts.map((item, idx) => (
                      <tr key={idx} style={{
                        backgroundColor: idx % 2 === 0 ? "white" : "#f9f9f9"
                      }}>
                        <td style={styles.td}>{item.nama}</td>
                        <td style={{...styles.td, fontFamily: "monospace", fontWeight: 500}}>{item.sku}</td>
                        <td style={styles.td}>
                          <span style={{
                            backgroundColor: "#e8f5e9",
                            color: "#2e7d32",
                            padding: "4px 10px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 500,
                          }}>
                            {item.categoryName}
                          </span>
                        </td>
                        <td style={{...styles.td, fontWeight: 700, color: "#3D5E54"}}>{item.totalQty}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} style={styles.noDataText}>
                        <div style={{ marginBottom: 8, fontSize: 24 }}>📦</div>
                        There is no data in this date range.
                        <br />
                        <small style={{ color: "#999" }}>Please select a date range to view product sales.</small>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalItems > 0 && (
              <div style={styles.paginationContainer}>
                <div style={styles.paginationInfo}>
                  Showing {startIndex + 1} to {endIndex} of {totalItems} entries
                </div>

                <div style={styles.paginationControls}>
                  {/* Page Size Selector */}
                  <select
                    style={styles.pageSizeSelect}
                    value={pageSize}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPageSize(value === "All" ? "All" : parseInt(value));
                    }}
                  >
                    {pageSizeOptions.map((size) => (
                      <option key={size} value={size}>
                        {size === "All" ? "All" : `${size} rows`}
                      </option>
                    ))}
                  </select>

                  {/* Prev Button */}
                  <button
                    style={{
                      ...styles.pageButton,
                      ...(currentPage === 1 ? styles.pageButtonDisabled : {}),
                    }}
                    disabled={currentPage === 1 || pageSize === "All"}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  >
                    <ArrowLeft size={16} />
                  </button>

                  {/* Page Numbers */}
                  {pageSize !== "All" && Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        style={{
                          ...styles.pageNumber,
                          ...(currentPage === pageNum ? styles.pageNumberActive : {}),
                        }}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  {/* Next Button */}
                  <button
                    style={{
                      ...styles.pageButton,
                      ...(currentPage === totalPages || pageSize === "All" ? styles.pageButtonDisabled : {}),
                    }}
                    disabled={currentPage === totalPages || pageSize === "All"}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
