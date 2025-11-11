import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { collection, onSnapshot } from "firebase/firestore";
import { format, parseISO } from "date-fns";
import { firestore } from "../../FirebaseFrovider";
import Loading from "../../components/Loading";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const RevenueGrowth = () => {
  const [orders, setOrders] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [yearlyRevenue, setYearlyRevenue] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);

  // ✅ Realtime listener from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(firestore, "orders"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => doc.data());
        setOrders(data);
      }
    );
    return () => unsubscribe();
  }, []);

  // ✅ Process data when orders update
  useEffect(() => {
    if (!orders.length) return;

    const monthlyMap = {};
    const yearlyMap = {};

    orders.forEach((order) => {
      const settlementTime =
        order?.midtransRes?.settlement_time ||
        order?.midtransRes?.transaction_time ||
        (order?.createdAt?.seconds
          ? new Date(order.createdAt.seconds * 1000).toISOString()
          : null);

      if (!settlementTime) return;

      const date = parseISO(settlementTime.replace(" ", "T"));
      const monthKey = format(date, "yyyy-MM");
      const yearKey = format(date, "yyyy");
      const total = Number(order.totalAfterDiskonDanOngkir || 0);

      monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + total;
      yearlyMap[yearKey] = (yearlyMap[yearKey] || 0) + total;
    });

    const monthly = Object.entries(monthlyMap)
      .sort(([a], [b]) => new Date(a) - new Date(b))
      .map(([month, total]) => ({ month, total }));

    const yearly = Object.entries(yearlyMap)
      .sort(([a], [b]) => a - b)
      .map(([year, total]) => ({ year, total }));

    setMonthlyRevenue(monthly);
    setYearlyRevenue(yearly);

    // ✅ Filter all pending orders
    const pending = orders.filter((o) => o.paymentStatus === "pending");
    setPendingOrders(pending);
  }, [orders]);
  console.log(pendingOrders);
  // ✅ Calculate growths
  const monthlyGrowth = monthlyRevenue.map((item, i) => {
    if (i === 0) return 0;
    const prev = monthlyRevenue[i - 1].total;
    const growth = prev ? ((item.total - prev) / prev) * 100 : 0;
    return +growth.toFixed(2);
  });

  const yearlyGrowth = yearlyRevenue.map((item, i) => {
    if (i === 0) return 0;
    const prev = yearlyRevenue[i - 1].total;
    const growth = prev ? ((item.total - prev) / prev) * 100 : 0;
    return +growth.toFixed(2);
  });

  // ✅ MoM chart data
  const momData = {
    labels: monthlyRevenue.map((d) => d.month),
    datasets: [
      {
        label: "Revenue (IDR)",
        data: monthlyRevenue.map((d) => d.total),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
      },
      {
        label: "MoM Growth (%)",
        data: monthlyGrowth,
        type: "line",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 2,
        tension: 0.3,
        yAxisID: "percentage",
      },
    ],
  };

  const momOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: "📈 Month-over-Month (MoM) Revenue Growth",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Revenue (IDR)" },
      },
      percentage: {
        position: "right",
        beginAtZero: true,
        title: { display: true, text: "Growth (%)" },
        grid: { drawOnChartArea: false },
      },
    },
  };

  // ✅ YoY chart data
  const yoyData = {
    labels: yearlyRevenue.map((d) => d.year),
    datasets: [
      {
        label: "Revenue (IDR)",
        data: yearlyRevenue.map((d) => d.total),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
      {
        label: "YoY Growth (%)",
        data: yearlyGrowth,
        type: "line",
        borderColor: "rgba(255, 206, 86, 1)",
        borderWidth: 2,
        tension: 0.3,
        yAxisID: "percentage",
      },
    ],
  };

  const yoyOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "📊 Year-over-Year (YoY) Revenue Growth" },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Revenue (IDR)" },
      },
      percentage: {
        position: "right",
        beginAtZero: true,
        title: { display: true, text: "Growth (%)" },
        grid: { drawOnChartArea: false },
      },
    },
  };

  // ✅ Pending orders chart (all, not by month)
  const pendingData = {
    labels: pendingOrders.map((o, i) => o.customerName || `Order ${i + 1}`),
    datasets: [
      {
        label: "Pending Orders",
        data: pendingOrders.map((o) => o.totalAfterDiskonDanOngkir || 0),
        backgroundColor: "rgba(255, 159, 64, 0.6)",
      },
    ],
  };

  const pendingOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "🕒 Pending Orders (All)" },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: "Total (IDR)" },
      },
    },
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>📉 Real-Time Revenue Growth Dashboard</h2>

      {!orders.length ? (
        <>
          <Loading />
          <p>Loading live data from Firestore...</p>
        </>
      ) : (
        <>
          <div style={{ marginTop: "3rem" }}>
            <Bar data={momData} options={momOptions} />
          </div>

          <div style={{ marginTop: "3rem" }}>
            <Bar data={yoyData} options={yoyOptions} />
          </div>

          {/* <div style={{ marginTop: "3rem" }}>
            <Bar data={pendingData} options={pendingOptions} />
          </div> */}
        </>
      )}
    </div>
  );
};

export default RevenueGrowth;
