import { useFirestoreQueryData } from "@react-query-firebase/firestore";
import {
  collection,
  doc,
  endBefore,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  Timestamp,
  where,
} from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import DatePicker from "react-datepicker";
import TransactionChart from "./Charts";
import { firestore } from "../../FirebaseFrovider";
import Header from "../../components/Header";
import "react-datepicker/dist/react-datepicker.css";
import { currency } from "../../formatter";
import { set } from "date-fns";
import {
  BoxFill,
  CartCheck,
  CartFill,
  CartXFill,
  CashCoin,
  Clipboard2Pulse,
  Coin,
  CurrencyExchange,
  GraphUp,
  JournalX,
  KanbanFill,
  PeopleFill,
  ReceiptCutoff,
  Truck,
  XCircleFill,
  BarChart,
  Percent,
  EnvelopeOpen,
  ArrowUp,
  ArrowDown,
} from "react-bootstrap-icons";
import Loading from "../../components/Loading";
import RevenueGrowth from "./RevenueGrowth";

// Card styles for dashboard
const cardStyles = {
  wrapper: {
    borderRadius: "16px",
    border: "none",
    transition: "all 0.3s ease",
    cursor: "pointer",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  title: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#6c757d",
    margin: 0,
  },
  iconWrapper: (bgColor) => ({
    backgroundColor: bgColor,
    borderRadius: "12px",
    width: "48px",
    height: "48px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  }),
  value: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#212529",
    margin: 0,
    lineHeight: 1.2,
  },
  subValue: {
    fontSize: "12px",
    color: "#adb5bd",
    marginTop: "4px",
  },
};

// Section header component
const SectionHeader = ({ title, icon: Icon, color = "#198754" }) => (
  <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
    <div
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "10px",
        backgroundColor: color + "15",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Icon size={20} color={color} />
    </div>
    <div>
      <h4
        style={{
          margin: 0,
          fontSize: "18px",
          fontWeight: "600",
          color: "#212529",
        }}
      >
        {title}
      </h4>
      <small style={{ color: "#adb5bd", fontSize: "12px" }}>
        Real-time metrics overview
      </small>
    </div>
    <div
      style={{
        flex: 1,
        height: "1px",
        backgroundColor: "#e9ecef",
        marginLeft: "12px",
      }}
    />
  </div>
);

// Metric Card Component
const MetricCard = ({ title, value, subValue, icon: Icon, bgColor, iconColor, trend }) => (
  <div style={{
    transition: "box-shadow 0.3s ease",
    borderRadius: "16px",
  }}
  onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"}
  onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
  >
    <Card
      className="shadow-sm h-100"
      style={{
        ...cardStyles.wrapper,
        background: "#ffffff",
        border: "1px solid #e9ecef",
      }}
    >
      <Card.Body style={{ padding: "20px" }}>
        <div style={cardStyles.header}>
          <span style={cardStyles.title}>{title}</span>
          <div style={cardStyles.iconWrapper(bgColor)}>
            <Icon size={22} color={iconColor} />
          </div>
        </div>
        <div style={{ marginTop: "16px" }}>
          <h3 style={cardStyles.value}>{value}</h3>
          {subValue && <span style={cardStyles.subValue}>{subValue}</span>}
        </div>
        {trend !== undefined && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              marginTop: "8px",
              fontSize: "12px",
              color: trend >= 0 ? "#198754" : "#dc3545",
            }}
          >
            {trend >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            <span>{Math.abs(trend)}%</span>
            <span style={{ color: "#adb5bd" }}>vs last period</span>
          </div>
        )}
      </Card.Body>
    </Card>
  </div>
);

// Large Metric Card Component
const LargeMetricCard = ({ title, value, subValue, icon: Icon, bgColor, iconColor, trend }) => (
  <div style={{
    transition: "box-shadow 0.3s ease",
    borderRadius: "16px",
  }}
  onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"}
  onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
  >
    <Card
      className="shadow-sm"
      style={{
        ...cardStyles.wrapper,
        background: "#ffffff",
        border: "1px solid #e9ecef",
      }}
    >
      <Card.Body style={{ padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <span style={{ ...cardStyles.title, fontSize: "16px", marginBottom: "12px", display: "block" }}>
            {title}
          </span>
          <h2 style={{ ...cardStyles.value, fontSize: "32px", marginBottom: "8px" }}>{value}</h2>
          {subValue && <span style={cardStyles.subValue}>{subValue}</span>}
          {trend !== undefined && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                marginTop: "12px",
                padding: "4px 10px",
                borderRadius: "20px",
                fontSize: "12px",
                backgroundColor: trend >= 0 ? "#d1e7dd" : "#f8d7da",
                color: trend >= 0 ? "#0f5132" : "#842029",
              }}
            >
              {trend >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
              {Math.abs(trend)}% growth
            </div>
          )}
        </div>
        <div style={{ ...cardStyles.iconWrapper(bgColor), width: "56px", height: "56px" }}>
          <Icon size={28} color={iconColor} />
        </div>
      </div>
    </Card.Body>
    </Card>
  </div>
);

// Sales Card Component
// Pastel color palette for sales cards
const pastelColors = [
  { bg: "#e8f5e9", accent: "#4caf50", lightAccent: "rgba(76, 175, 80, 0.15)" },    // Green
  { bg: "#fff3e0", accent: "#ff9800", lightAccent: "rgba(255, 152, 0, 0.15)" },     // Orange
  { bg: "#e3f2fd", accent: "#2196f3", lightAccent: "rgba(33, 150, 243, 0.15)" },   // Blue
  { bg: "#fce4ec", accent: "#e91e63", lightAccent: "rgba(233, 30, 99, 0.15)" },    // Pink
  { bg: "#f3e5f5", accent: "#9c27b0", lightAccent: "rgba(156, 39, 176, 0.15)" },   // Purple
  { bg: "#e0f7fa", accent: "#00bcd4", lightAccent: "rgba(0, 188, 212, 0.15)" },    // Cyan
  { bg: "#fff8e1", accent: "#ffc107", lightAccent: "rgba(255, 193, 7, 0.15)" },    // Amber
  { bg: "#efebe9", accent: "#795548", lightAccent: "rgba(121, 85, 72, 0.15)" },    // Brown
];

const SalesCard = ({ data, index, currency }) => {
  const colors = pastelColors[index % pastelColors.length];

  return (
  <Col key={index} md={3} sm={6} xs={12} className="mb-3">
    <div style={{
      transition: "box-shadow 0.3s ease, transform 0.3s ease",
      borderRadius: "16px",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
      e.currentTarget.style.transform = "translateY(-4px)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = "none";
      e.currentTarget.style.transform = "translateY(0)";
    }}
    >
      <Card
        style={{
          ...cardStyles.wrapper,
          background: colors.bg,
          border: `1px solid ${colors.lightAccent}`,
        }}
      >
        <Card.Body style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <h5
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#212529",
                  marginBottom: "12px",
                }}
              >
                {data?.nama}
              </h5>
              <small style={{ color: "#6c757d", fontSize: "12px" }}>
                {data?.jumlahOrder} orders
              </small>
            </div>
            <div
              style={{
                backgroundColor: colors.lightAccent,
                borderRadius: "8px",
                padding: "4px 8px",
                fontSize: "11px",
                fontWeight: "600",
                color: colors.accent,
              }}
            >
              #{index + 1}
            </div>
          </div>
          <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: `1px solid ${colors.lightAccent}` }}>
            <small style={{ color: "#6c757d", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Total Sales
            </small>
            <h4
              style={{
                margin: 0,
                fontSize: "18px",
                fontWeight: "700",
                color: colors.accent,
              }}
            >
              {currency(data?.amount)}
            </h4>
          </div>
        </Card.Body>
      </Card>
    </div>
  </Col>
  );
};

const Dashboard = ({ profile }) => {
  const today = new Date();
  const last30Days = new Date();
  last30Days.setDate(today.getDate() - 30);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [allOrders, setAllOrders] = useState([]);
  const [user, setUser] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalOrdersCountsall, setTotalOrdersCount] = useState(0);
  const [totalOrdersPaidCount, setTotalOrdersPaidCount] = useState(0);
  const [totalOngkirAll, setTotalOngkir] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const getDoc = query(
        collection(firestore, "users"),
        orderBy("createdAt", "desc")
      );
      const documentSnapshots = await getDocs(getDoc);
      var items = [];

      documentSnapshots.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setUser(items);
    };
    fetchData();
  }, []);
  // query order

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const getDoc = query(
        collection(firestore, "orders"),
        orderBy("createdAt", "asc")
      );
      const documentSnapshots = await getDocs(getDoc);
      var items = [];

      documentSnapshots.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setAllOrders(items);
      setStartDate(null);
      setEndDate(null);

      const settingsRef = doc(
        firestore,
        "settings",
        "counter",
        "orders",
        "counter"
      );

      const unsub = onSnapshot(settingsRef, (doc) => {
        setTotalOrdersCount(doc.data()?.totalOrder);
        setTotalOrdersPaidCount(doc.data()?.paidOrder);
        setTotalOngkir(doc.data()?.totalOngkir);
      });
      setLoading(false);
      return () => unsub;
    } catch (e) {
      setLoading(false);
      console.log(e.message);
    }
  };

  const filterByDate = useCallback(async (start, end) => {
    try {
      setLoading(true);
      setTotalOrdersCount();
      setTotalOrdersPaidCount();
      setTotalOngkir();
      const yearStart = start.getFullYear();
      const monthStart = String(start.getMonth() + 1).padStart(2, "0");
      const dayStart = String(start.getDate()).padStart(2, "0");
      const formattedDateStart = `${yearStart}-${monthStart}-${dayStart}`;
      const yearEnd = end.getFullYear();
      const monthEnd = String(end.getMonth() + 1).padStart(2, "0");
      const dayEnd = String(end.getDate()).padStart(2, "0");
      const formattedDateEnd = `${yearEnd}-${monthEnd}-${dayEnd}`;
      const startTimestamp = Timestamp.fromDate(new Date(formattedDateStart));
      const endTimestamp = Timestamp.fromDate(
        set(new Date(formattedDateEnd), {
          hours: 23,
          minutes: 59,
          seconds: 59,
          milliseconds: 999,
        })
      );
      const ref = query(
        collection(firestore, "orders"),
        where("createdAt", ">=", startTimestamp),
        where("createdAt", "<=", endTimestamp)
      );
      const querySnapshot = await getDocs(ref);
      const documents = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllOrders(documents);
      setLoading(false);
    } catch (e) {
      setLoading(false);
      console.log(e.message);
    }
  }, []);

  useEffect(() => {
    filterByDate(startDate, endDate);
  }, []);

  const handleSelect = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
    if (start && end) {
      filterByDate(start, end);
    }
  };

  const ordersFilterd = allOrders.filter((all) => {
    return (
      all?.totalHargaProduk &&
      all?.totalHargaProduk &&
      all?.totalAfterDiskonDanOngkir
    );
  });
  const orderSettlement = ordersFilterd?.filter?.(
    (ord) => ord.paymentStatus === "settlement"
  );
  const orderPending = ordersFilterd?.filter?.(
    (ord) => ord.paymentStatus === "pending"
  );

  const arrayTotal = orderSettlement.map(
    (all) => all?.totalHargaProduk + all?.totalOngkir
  );
  const totalOmset = arrayTotal?.reduce((val, nilaiSekarang) => {
    return val + nilaiSekarang;
  }, 0);
  const arrayTotalNet = orderSettlement.map(
    (all) => all?.totalAfterDiskonDanOngkir - all?.totalOngkir
  );
  const totalOmsetNet = arrayTotalNet?.reduce((val, nilaiSekarang) => {
    return val + nilaiSekarang;
  }, 0);

  const totalOrdersCount = ordersFilterd?.reduce?.((total, doc) => {
    return total + (doc.orders?.length || 0);
  }, 0);

  const orderSettlementAll = allOrders?.filter?.(
    (ord) => ord.paymentStatus === "settlement"
  );
  const totalOrdersCountPaid = orderSettlementAll?.reduce?.((total, doc) => {
    return total + (doc.orders?.length || 0);
  }, 0);

  const arrayTotalUnpaid = orderPending.map(
    (all) => all?.totalAfterDiskonDanOngkir
  );
  const totalOmsetUnpaid = arrayTotalUnpaid?.reduce((val, nilaiSekarang) => {
    return val + nilaiSekarang;
  }, 0);

  const arrayTotalOngkir = orderSettlement.map((all) => all?.totalOngkir);
  const totalOngkir = arrayTotalOngkir?.reduce((val, nilaiSekarang) => {
    return val + nilaiSekarang;
  }, 0);

  const orderDelivery = ordersFilterd?.filter?.(
    (ord) => ord.orderStatus === "processing"
  );

  const orderRefund = ordersFilterd?.filter?.(
    (ord) => ord.orderStatus === "refund"
  );

  const groupedData = Object?.values?.(
    orderSettlement?.reduce?.((acc, item) => {
      if (!acc[item.userId]) {
        acc[item.userId] = { userId: item.userId, items: [] };
      }
      acc[item.userId].items.push(item);
      return acc;
    }, {})
  );
  const mapData = groupedData
    ?.map((ord) => {
      const amountAll = ord?.items?.map((d) => d?.totalHargaProduk || 0);
      const amountTot = amountAll?.reduce((val, nilaiSekarang) => {
        return val + nilaiSekarang;
      }, 0);

      const dataUser = user.find((item) => item.userId === ord?.userId);
      return {
        amount: amountTot,
        sender: ord?.userId,
        nama: `${dataUser?.firstName} ${dataUser?.lastName}`,
        jumlahOrder: ord?.items?.length,
      };
    })
    ?.sort((a, b) => b.amount - a.amount);

  const conversionRate = allOrders?.length > 0
    ? ((orderSettlement?.length / allOrders?.length) * 100)?.toFixed(2)
    : 0;

  const refundRate = allOrders?.length > 0
    ? ((orderRefund.length / allOrders.length) * 100)?.toFixed(2)
    : 0;

  const avgOrderValue = orderSettlement?.length > 0
    ? totalOmsetNet / orderSettlement.length
    : 0;

  return (
    <div className="container" style={{ paddingTop: "100px", paddingBottom: "50px" }}>
      <Header />

      {/* Header Row: Dashboard title and Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: "0px" }}>Dashboard</h1>
          <p style={{ color: "#6c757d", margin: 0, fontSize: "14px" }}>
            Selamat datang, <strong>{profile?.firstName || "User"} {profile?.lastName || ""}</strong>
          </p>
        </div>

        {/* Top Actions */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={fetchAllData}
            style={{
              backgroundColor: "#198754",
              color: "white",
              border: "none",
              borderRadius: "10px",
              padding: "10px 20px",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(25, 135, 84, 0.3)",
            }}
          >
            <KanbanFill /> Load All Orders
          </button>

          <DatePicker
            selected={startDate}
            onChange={handleSelect}
            startDate={startDate}
            endDate={endDate}
            selectsRange
            showIcon
            style={{ borderRadius: "10px" }}
          />
        </div>
      </div>

      <Container fluid>

        {profile?.rules === "admin" && (
          <>
            {/* Performance Overview Section */}
            <section style={{ marginBottom: "40px" }}>
              <SectionHeader title="Performance Overview" icon={BarChart} color="#198754" />
              <Row className="gy-4">
                <Col md={3}>
                  <MetricCard
                    title="Gross Revenue"
                    value={loading ? <Loading /> : currency(totalOmset)}
                    icon={Coin}
                    bgColor="rgba(130, 128, 255, 0.15)"
                    iconColor="#8280FF"
                  />
                </Col>
                <Col md={3}>
                  <MetricCard
                    title="Net Revenue"
                    value={loading ? <Loading /> : currency(totalOmsetNet)}
                    icon={CashCoin}
                    bgColor="rgba(254, 197, 61, 0.2)"
                    iconColor="#FEC53D"
                  />
                </Col>
                <Col md={3}>
                  <MetricCard
                    title="Total Orders"
                    value={loading ? <Loading /> : (totalOrdersCountsall ?? totalOrdersCount)}
                    icon={CartFill}
                    bgColor="rgba(74, 217, 145, 0.15)"
                    iconColor="#4AD991"
                  />
                </Col>
                <Col md={3}>
                  <MetricCard
                    title="Conversion Rate"
                    value={loading ? <Loading /> : `${conversionRate}%`}
                    // subValue="Orders converted to paid"
                    icon={Percent}
                    bgColor="rgba(255, 144, 102, 0.15)"
                    iconColor="#FF9066"
                  />
                </Col>
              </Row>
            </section>

            {/* Sales & Transaction Section */}
            <section style={{ marginBottom: "40px" }}>
              <SectionHeader title="Sales & Transaction" icon={GraphUp} color="#0d6efd" />
              <Row className="gy-4">
                <Col md={8}>
                  <div style={{
                    transition: "box-shadow 0.3s ease",
                    borderRadius: "16px",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
                  >
                    <Card className="shadow-sm h-100" style={{ ...cardStyles.wrapper, minHeight: "400px", background: "#ffffff", border: "1px solid #e9ecef" }}>
                      <Card.Body style={{ padding: "24px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                          <h5 style={{ margin: 0, fontWeight: "600", color: "#212529" }}>Transaction History</h5>
                          <span style={{
                            backgroundColor: "#e7f5ff",
                            color: "#0d6efd",
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "500"
                          }}>
                            Last 30 Days
                          </span>
                        </div>
                        {loading ? <Loading /> : <TransactionChart allOrders={allOrders} />}
                      </Card.Body>
                    </Card>
                  </div>
                </Col>
                <Col md={4}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <LargeMetricCard
                      title="Total Paid Orders"
                      value={loading ? <Loading /> : (totalOrdersPaidCount ?? totalOrdersCountPaid)}
                      icon={CartCheck}
                      bgColor="rgba(74, 217, 145, 0.15)"
                      iconColor="#4AD991"
                    />
                    <LargeMetricCard
                      title="Average Order Value"
                      value={loading ? <Loading /> : currency(avgOrderValue)}
                      icon={Clipboard2Pulse}
                      bgColor="rgba(254, 197, 61, 0.2)"
                      iconColor="#FEC53D"
                    />
                    <LargeMetricCard
                      title="Total Invoice"
                      value={loading ? <Loading /> : allOrders?.length}
                      subValue="All time invoices"
                      icon={ReceiptCutoff}
                      bgColor="rgba(130, 128, 255, 0.15)"
                      iconColor="#8280FF"
                    />
                    <LargeMetricCard
                      title="Unpaid Revenue"
                      value={loading ? <Loading /> : currency(totalOmsetUnpaid)}
                      subValue="Pending payments"
                      icon={JournalX}
                      bgColor="rgba(255, 144, 102, 0.15)"
                      iconColor="#FF9066"
                    />
                  </div>
                </Col>
              </Row>
            </section>

            {/* Logistics Section */}
            <section style={{ marginBottom: "40px" }}>
              <SectionHeader title="Logistics & Fulfillment" icon={Truck} color="#fd7e14" />
              <Row className="gy-4">
                <Col md={4}>
                  <MetricCard
                    title="Total Shipping Cost"
                    value={loading ? <Loading /> : currency(totalOngkirAll ?? totalOngkir)}
                    icon={CurrencyExchange}
                    bgColor="rgba(130, 128, 255, 0.15)"
                    iconColor="#8280FF"
                  />
                </Col>
                <Col md={4}>
                  <MetricCard
                    title="Shipping Delivery"
                    value={loading ? <Loading /> : orderDelivery?.length}
                    subValue="Orders in process"
                    icon={Truck}
                    bgColor="rgba(254, 197, 61, 0.2)"
                    iconColor="#FEC53D"
                  />
                </Col>
                <Col md={4}>
                  <MetricCard
                    title="Refund Rate"
                    value={loading ? <Loading /> : `${refundRate}%`}
                    subValue={`${orderRefund.length} refund orders`}
                    icon={CartXFill}
                    bgColor="rgba(255, 144, 102, 0.15)"
                    iconColor="#FF9066"
                  />
                </Col>
              </Row>
            </section>

            {/* Financial Health Section */}
            <section style={{ marginBottom: "40px" }}>
              <SectionHeader title="Financial Health & Growth" icon={EnvelopeOpen} color="#20c997" />
              <div style={{
                transition: "box-shadow 0.3s ease",
                borderRadius: "16px",
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
              >
                <Card className="shadow-sm" style={{ ...cardStyles.wrapper, background: "#ffffff", border: "1px solid #e9ecef" }}>
                  <Card.Body style={{ padding: "24px" }}>
                    {loading ? <Loading /> : <RevenueGrowth />}
                  </Card.Body>
                </Card>
              </div>
            </section>
          </>
        )}

        {/* Sales Performance Section */}
        <section>
          <SectionHeader title="Sales Performance by Staff" icon={PeopleFill} color="#6f42c1" />
          <Row>
            {loading ? (
              <Loading />
            ) : (
              mapData?.map((data, index) => (
                <SalesCard
                  key={index}
                  data={data}
                  index={index}
                  currency={currency}
                />
              ))
            )}
          </Row>
        </section>
      </Container>
    </div>
  );
};

export default Dashboard;
