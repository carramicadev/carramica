import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register components for Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const TransactionCart = ({ allOrders }) => {
  // all order
  const filterDate = allOrders?.filter(
    (all) => all.createdAt && all.createdAt !== undefined
  );

  const allDate = filterDate?.map((all) => {
    const date = all?.createdAt?.toDate();
    // Get day, month, and year
    const day = String(date?.getDate()).padStart(2, "0");
    const month = String(date?.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
    const year = date?.getFullYear();
    return `${day}/${month}/${year}`;
  });
  const groupedDates = filterDate?.reduce((acc, item) => {
    const dateObj = item?.createdAt?.toDate();
    if (!dateObj) return acc;

    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    const date = `${day}/${month}/${year}`;

    const totalOrders = item.orders?.length || 0;

    acc[date] = (acc[date] || 0) + totalOrders;
    return acc;
  }, {});
  const convertDate = Object.entries(groupedDates).reduce(
    (acc, [date, count]) => {
      acc[date] = { count, date };
      return acc;
    },
    {}
  );
  const fixDate = Object.values(convertDate).map((date) => {
    return date?.date;
  });
  const fixAllOrder = Object.values(convertDate).map((date) => {
    return { date: date?.date, count: date?.count };
  });

  // paid
  const filterDatePaid = allOrders?.filter(
    (all) => all.createdAt && all.paymentStatus === "settlement"
  );

  const allDatePaid = filterDatePaid?.map((all) => {
    const date = all?.createdAt?.toDate();
    // Get day, month, and year
    const day = String(date?.getDate()).padStart(2, "0");
    const month = String(date?.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
    const year = date?.getFullYear();
    return `${day}/${month}/${year}`;
  });
  const groupedDatesPaid = filterDatePaid?.reduce((acc, item) => {
    const dateObj = item?.createdAt?.toDate();
    if (!dateObj) return acc;

    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    const date = `${day}/${month}/${year}`;

    const totalOrders = item.orders?.length || 0;

    acc[date] = (acc[date] || 0) + totalOrders;
    return acc;
  }, {});

  //   console.log(groupedDatesPaid);
  const convertDatePaid = Object.entries(groupedDatesPaid).reduce(
    (acc, [date, count]) => {
      acc[date] = { count, date };
      return acc;
    },
    {}
  );
  const fixPaid = Object.values(convertDatePaid).map((date) => {
    return { date: date?.date, count: date?.count };
  });

  //
  const mapDataToLabels = (data, labels) => {
    return labels.map((label) => {
      const monthData = data.find((item) => item.date === label);
      return monthData ? monthData.count : 0;
    });
  };

  // Transform data1 and data2
  const dataset1 = mapDataToLabels(fixAllOrder, fixDate);
  const dataset2 = mapDataToLabels(fixPaid, fixDate);
  // console.log(dataset2)
  // Example data for 30 days
  const data = {
    labels: fixDate,
    datasets: [
      {
        label: "All Order",
        data: dataset1,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Paid Order",
        data: dataset2,
        borderColor: "rgba(153, 102, 255, 1)",
        backgroundColor: "rgba(153, 102, 255, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };
  // console.log(data)
  // Configuration options for the chart
  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      title: {
        display: true,
        text: " Sales Data",
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Days",
        },
      },
      y: {
        title: {
          display: true,
          text: "Sales",
        },
        beginAtZero: true,
      },
    },
  };

  return <Line height={245} data={data} options={options} />;
};

export default TransactionCart;
