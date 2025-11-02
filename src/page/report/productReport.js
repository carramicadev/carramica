import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { fromUnixTime, isWithinInterval, set } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { firestore } from "../../FirebaseFrovider";
import Loading from "../../components/Loading";
import { CSVLink } from "react-csv";
import { CloudArrowDown } from "react-bootstrap-icons";

export default function ReportProdukTerjual() {
  const [orders, setOrders] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [loading, setLoading] = useState(false);

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
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(list);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [startDate, endDate]);

  // 🔹 Aggregate products
  const filteredProducts = useMemo(() => {
    const allProducts = [];
    orders.forEach((order) => {
      order.orders?.forEach((ord) => {
        ord.products?.forEach((p) => {
          allProducts.push({
            id: p.id,
            nama: p.nama,
            sku: p.sku,
            quantity: p.quantity,
          });
        });
      });
    });

    const productMap = new Map();
    allProducts.forEach((p) => {
      if (productMap.has(p.id)) {
        productMap.get(p.id).totalQty += p.quantity;
      } else {
        productMap.set(p.id, {
          nama: p.nama,
          sku: p.sku,
          totalQty: p.quantity,
        });
      }
    });

    return Array.from(productMap.values());
  }, [orders]);

  // 🔹 Styles
  const styles = {
    container: {
      padding: 16,
      maxWidth: 1200,
      margin: "0 auto",
    },
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
    dateGroup: {
      display: "flex",
      flexWrap: "wrap",
      gap: 12,
    },
    exportButton: {
      display: "flex",
      alignItems: "flex-end",
    },
    tableWrapper: {
      overflowX: "auto", // ✅ makes table scrollable on mobile
    },
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
      textAlign: "left",
      backgroundColor: "#3D5E54",
      color: "white",
      whiteSpace: "nowrap",
    },
    td: {
      padding: 12,
      borderBottom: "1px solid #eee",
    },
    totalText: {
      marginTop: 20,
      textAlign: "right",
      fontWeight: "bold",
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>Product Report</h2>

      {/* Date Range Picker + Export */}
      <div style={styles.filterContainer}>
        <div style={styles.dateGroup}>
          <div>
            <label style={{ display: "block" }}>From:</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              dateFormat="dd/MM/yyyy"
              placeholderText="Pilih tanggal mulai"
              className="border p-2 rounded"
            />
          </div>
          <div>
            <label style={{ display: "block" }}>To:</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              dateFormat="dd/MM/yyyy"
              placeholderText="Pilih tanggal akhir"
              className="border p-2 rounded"
            />
          </div>
        </div>
        <div style={styles.exportButton}>
          <CSVLink
            data={filteredProducts}
            separator={";"}
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
                  <th style={styles.th}>Product Name</th>
                  <th style={styles.th}>Product Code (SKU)</th>
                  <th style={styles.th}>Quantity Sold</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((item, idx) => (
                    <tr key={idx}>
                      <td style={styles.td}>{item.nama}</td>
                      <td style={styles.td}>{item.sku}</td>
                      <td style={styles.td}>{item.totalQty}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      style={{ textAlign: "center", padding: 16 }}
                    >
                      There is no data in this date range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={styles.totalText}>
            Total Products Sold (Qty):{" "}
            {filteredProducts.reduce((sum, p) => sum + p.totalQty, 0)}
          </div>
        </>
      )}
    </div>
  );
}
