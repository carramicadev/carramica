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
import { CloudArrowDown, ArrowDown, ArrowUp } from "react-bootstrap-icons";

export default function ReportProdukTerjual() {
  const [orders, setOrders] = useState([]);
  const [productsMap, setProductsMap] = useState({});
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔥 For multi-column sorting
  const [sortField, setSortField] = useState("nama");
  const [sortOrder, setSortOrder] = useState("asc");

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

  // 🔹 Styles
  const styles = {
    container: { padding: 16, maxWidth: 1200, margin: "0 auto" },
    header: {
      fontSize: 22,
      fontWeight: "bold",
      marginBottom: 16,
      textAlign: "center",
    },
    filterContainer: {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: 12,
      marginBottom: 20,
    },
    dateGroup: { display: "flex", flexWrap: "wrap", gap: 12 },
    exportButton: { display: "flex", alignItems: "flex-end" },
    tableWrapper: { overflowX: "auto" },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      border: "1px solid #ccc",
      fontSize: "10px",
      minWidth: 400,
    },
    th: {
      padding: 12,
      borderBottom: "1px solid #ddd",
      backgroundColor: "#3D5E54",
      color: "white",
      cursor: "pointer",
      whiteSpace: "nowrap",
    },
    td: { padding: 12, borderBottom: "1px solid #eee" },
    totalText: { marginTop: 20, textAlign: "right", fontWeight: "bold" },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Product Report</h2>

      {/* Date Filters */}
      <div style={styles.filterContainer}>
        <div style={styles.dateGroup}>
          <div>
            <label>From:</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              dateFormat="dd/MM/yyyy"
              placeholderText="Select start date"
              className="border p-2 rounded"
            />
          </div>

          <div>
            <label>To:</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              dateFormat="dd/MM/yyyy"
              placeholderText="Select end date"
              className="border p-2 rounded"
            />
          </div>
        </div>

        <div style={styles.exportButton}>
          <CSVLink
            data={filteredProducts}
            separator=";"
            filename={"produk_terjual.csv"}
            className="btn btn-outline-secondary"
          >
            <CloudArrowDown /> Export CSV
          </CSVLink>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Loading />
      ) : (
        <>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th} onClick={() => handleSort("nama")}>
                    Product Name <SortIcon field="nama" />
                  </th>

                  <th style={styles.th} onClick={() => handleSort("sku")}>
                    SKU <SortIcon field="sku" />
                  </th>

                  <th
                    style={styles.th}
                    onClick={() => handleSort("categoryName")}
                  >
                    Category <SortIcon field="categoryName" />
                  </th>

                  <th style={styles.th} onClick={() => handleSort("totalQty")}>
                    Quantity Sold <SortIcon field="totalQty" />
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((item, idx) => (
                    <tr key={idx}>
                      <td style={styles.td}>{item.nama}</td>
                      <td style={styles.td}>{item.sku}</td>
                      <td style={styles.td}>{item.categoryName}</td>
                      <td style={styles.td}>{item.totalQty}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td style={styles.td} colSpan={4} align="center">
                      There is no data in this date range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={styles.totalText}>
            Total Products Sold:{" "}
            {filteredProducts.reduce((sum, p) => sum + p.totalQty, 0)}
          </div>
        </>
      )}
    </div>
  );
}
