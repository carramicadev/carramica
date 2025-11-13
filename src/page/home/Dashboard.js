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
} from "react-bootstrap-icons";
import Loading from "../../components/Loading";
import RevenueGrowth from "./RevenueGrowth";

// bg random
const generateColor = (index) => {
  const hue = (index * 137) % 360;
  // Pastel colors: low saturation (40–60%), high lightness (85–90%)
  return `hsl(${hue}, 55%, 88%)`;
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
        // doc.data() is never undefined for query doc snapshots
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
        // doc.data() is never undefined for query doc snapshots
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

      // useEffect(() => {
      const unsub = onSnapshot(settingsRef, (doc) => {
        // console.log(" data: ", doc.data());
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
      const monthStart = String(start.getMonth() + 1).padStart(2, "0"); // Months are 0-based
      const dayStart = String(start.getDate()).padStart(2, "0");
      const formattedDateStart = `${yearStart}-${monthStart}-${dayStart}`;
      // end
      const yearEnd = end.getFullYear();
      const monthEnd = String(end.getMonth() + 1).padStart(2, "0"); // Months are 0-based
      const dayEnd = String(end.getDate()).padStart(2, "0");
      const formattedDateEnd = `${yearEnd}-${monthEnd}-${dayEnd}`;
      //
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
      // console.log()
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

  // date picker

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

  const arrayTotal = orderSettlement.map((all) => all?.totalHargaProduk);
  const totalOmset = arrayTotal?.reduce((val, nilaiSekarang) => {
    return val + nilaiSekarang;
  }, 0);
  // net revenue
  const arrayTotalNet = orderSettlement.map(
    (all) => all?.totalAfterDiskonDanOngkir
  );
  const totalOmsetNet = arrayTotalNet?.reduce((val, nilaiSekarang) => {
    return val + nilaiSekarang;
  }, 0);
  console.log(arrayTotalNet);

  // total orders count
  const totalOrdersCount = ordersFilterd?.reduce?.((total, doc) => {
    return total + (doc.orders?.length || 0);
  }, 0);

  //total paid orders
  const orderSettlementAll = allOrders?.filter?.(
    (ord) => ord.paymentStatus === "settlement"
  );
  const totalOrdersCountPaid = orderSettlementAll?.reduce?.((total, doc) => {
    return total + (doc.orders?.length || 0);
  }, 0);

  // unpaid revenue
  const arrayTotalUnpaid = orderPending.map(
    (all) => all?.totalAfterDiskonDanOngkir
  );
  const totalOmsetUnpaid = arrayTotalUnpaid?.reduce((val, nilaiSekarang) => {
    return val + nilaiSekarang;
  }, 0);

  // shipping cost
  const arrayTotalOngkir = orderSettlement.map((all) => all?.totalOngkir);
  const totalOngkir = arrayTotalOngkir?.reduce((val, nilaiSekarang) => {
    return val + nilaiSekarang;
  }, 0);

  //shipping delivery
  const orderDelivery = ordersFilterd?.filter?.(
    (ord) => ord.orderStatus === "processing"
  );

  // refund order
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
      // const docRef = doc(firestore, "users", ord?.userId);
      // const docSnap = await getDoc(docRef);
      return {
        amount: amountTot,
        sender: ord?.userId,
        nama: `${dataUser?.firstName} ${dataUser?.lastName}`,
        jumlahOrder: ord?.items?.length,
      };
    })
    ?.sort((a, b) => b.amount - a.amount);

  // let grouped = []
  // const grupingOrders = Object.values(groupedData)?.map?.((all) => {
  //   return all?.map((ord) => {
  //     return ord?.totalHargaProduk
  //   })
  // })
  // console.log();
  // console.log(profile)

  return (
    <div className="container" style={{ paddingTop: "100px" }}>
      <Header />
      <h1 className="page-title">Dashboard</h1>

      <Container fluid>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginBottom: "10px",
            whiteSpace: "nowrap",
          }}
        >
          <button
            onClick={fetchAllData}
            style={{ backgroundColor: "#998970" }}
            className="button button-primary"
          >
            <KanbanFill /> Load All Orders
          </button>

          <DatePicker
            // style={{ bor }}
            selected={startDate}
            onChange={handleSelect}
            startDate={startDate}
            endDate={endDate}
            selectsRange
            showIcon

            // icon
            // inline
          />
        </div>
        {profile?.rules === "admin" && (
          <>
            <Row className="mb-4">
              <p className="fw-bold text-success fs-5">Performance Overview</p>
              <Col md={3}>
                <Card className="shadow-sm">
                  <Card.Body>
                    <Card.Title
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>Gross Revenue</div>
                      <div
                        style={{
                          backgroundColor: "rgb(229 228 255)",
                          borderRadius: "50%",
                          width: "35px",
                          height: "35px",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Coin color="#8280FF" />
                      </div>
                    </Card.Title>
                    <Card.Text>
                      <h3>{loading ? <Loading /> : currency(totalOmset)}</h3>
                      {/* <small className="text-success">↑ 8.5% Up from last month</small> */}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="shadow-sm">
                  <Card.Body>
                    <Card.Title
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>Net Revenue</div>
                      <div
                        style={{
                          backgroundColor: "rgb(255 243 217)",
                          borderRadius: "50%",
                          width: "35px",
                          height: "35px",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <CashCoin color="#FEC53D" />
                      </div>
                    </Card.Title>
                    <Card.Text>
                      <h3>{loading ? <Loading /> : currency(totalOmsetNet)}</h3>
                      {/* <small className="text-success">↑ 1.3% Up from last month</small> */}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="shadow-sm">
                  <Card.Body>
                    <Card.Title
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>Total Orders</div>
                      <div
                        style={{
                          backgroundColor: "#d9f7e8",
                          borderRadius: "50%",
                          width: "35px",
                          height: "35px",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <CartFill color="#4AD991" />
                      </div>
                    </Card.Title>
                    <Card.Text>
                      <h3>
                        {loading ? (
                          <Loading />
                        ) : (
                          totalOrdersCountsall ?? totalOrdersCount
                        )}
                      </h3>
                      {/* <small className="text-danger">↓ 4.3% Down from last month</small> */}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="shadow-sm">
                  <Card.Body>
                    <Card.Title
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>Conversion Rate</div>
                      <div
                        style={{
                          backgroundColor: "#ffded1",
                          borderRadius: "50%",
                          width: "35px",
                          height: "35px",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <GraphUp color="#FF9066" />
                      </div>
                    </Card.Title>
                    <Card.Text>
                      <h3>
                        {loading ? (
                          <Loading />
                        ) : (
                          (
                            (orderSettlement?.length / allOrders?.length) *
                            100
                          )?.toFixed(3)
                        )}
                        %
                      </h3>
                      {/* <small className="text-danger">↓ 4.3% Unpaid</small> */}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            <Row className="mb-4">
              <p className="fw-bold text-success fs-5">
                Sales & Transaction Metrics
              </p>
              <Col md={6} className="h-100">
                <Card className="shadow-sm h-100">
                  <Card.Body>
                    <Card.Title>Transaction</Card.Title>
                    <div>
                      {/* Add a chart component here or use an image */}
                      {loading ? (
                        <Loading />
                      ) : (
                        <TransactionChart allOrders={allOrders} />
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Row className="mb-4 gy-4">
                  <Col md={6}>
                    <Card className="shadow-sm">
                      <Card.Body>
                        <Card.Title
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <div>Total Paid Orders</div>
                          <div
                            style={{
                              backgroundColor: "#d9f7e8",
                              borderRadius: "50%",
                              width: "35px",
                              height: "35px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <CartCheck color="#4AD991" />
                          </div>
                        </Card.Title>
                        <Card.Text>
                          <h3>
                            {loading ? (
                              <Loading />
                            ) : (
                              totalOrdersPaidCount ?? totalOrdersCountPaid
                            )}
                          </h3>
                          {/* <small className="text-success">↑ 8.5% Up from last month</small> */}
                        </Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="shadow-sm">
                      <Card.Body>
                        <Card.Title
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <div>Average Order Value</div>
                          <div
                            style={{
                              backgroundColor: "rgb(255 243 217)",
                              borderRadius: "50%",
                              width: "35px",
                              height: "35px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <Clipboard2Pulse color="#FEC53D" />
                          </div>
                        </Card.Title>
                        <Card.Text>
                          <h3>
                            {loading ? (
                              <Loading />
                            ) : (
                              currency(totalOmsetNet / orderSettlement.length)
                            )}
                          </h3>
                          {/* <small className="text-success">↑ 1.3% Up from last month</small> */}
                        </Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="shadow-sm">
                      <Card.Body>
                        <Card.Title
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <div>Total Invoice</div>
                          <div
                            style={{
                              backgroundColor: "rgb(229 228 255)",
                              borderRadius: "50%",
                              width: "35px",
                              height: "35px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <ReceiptCutoff color="#8280FF" />
                          </div>
                        </Card.Title>
                        <Card.Text>
                          <h3>{loading ? <Loading /> : allOrders?.length}</h3>
                          {/* <small className="text-danger">↓ 4.3% Down from last month</small> */}
                        </Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card className="shadow-sm">
                      <Card.Body>
                        <Card.Title
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <div>Unpaid Revenue</div>
                          <div
                            style={{
                              backgroundColor: "#ffded1",
                              borderRadius: "50%",
                              width: "35px",
                              height: "35px",
                              display: "flex",
                              justifyContent: "center",
                              alignItems: "center",
                            }}
                          >
                            <JournalX color="#FF9066" />
                          </div>
                        </Card.Title>
                        <Card.Text>
                          <h3>
                            {loading ? <Loading /> : currency(totalOmsetUnpaid)}
                          </h3>
                          {/* <small className="text-danger">↓ 4.3% Unpaid</small> */}
                        </Card.Text>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </Col>
            </Row>

            <Row className="mb-4">
              <p className="fw-bold text-success fs-5">
                Logistics & Fulfillment
              </p>
              <Col md={4}>
                <Card className="shadow-sm">
                  <Card.Body>
                    <Card.Title
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>Total Shipping Cost</div>
                      <div
                        style={{
                          backgroundColor: "rgb(229 228 255)",
                          borderRadius: "50%",
                          width: "35px",
                          height: "35px",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <CurrencyExchange color="#8280FF" />
                      </div>
                    </Card.Title>
                    <Card.Text>
                      <h3>
                        {loading ? (
                          <Loading />
                        ) : (
                          currency(totalOngkirAll ?? totalOngkir)
                        )}
                      </h3>
                      {/* <small className="text-success">↑ 8.5% Up from last month</small> */}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="shadow-sm">
                  <Card.Body>
                    <Card.Title
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>Shipping Delivery</div>
                      <div
                        style={{
                          backgroundColor: "rgb(255 243 217)",
                          borderRadius: "50%",
                          width: "35px",
                          height: "35px",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Truck color="#FEC53D" />
                      </div>
                    </Card.Title>
                    <Card.Text>
                      <h3>{loading ? <Loading /> : orderDelivery?.length}</h3>
                      {/* <small className="text-success">↑ 1.3% Up from last month</small> */}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="shadow-sm">
                  <Card.Body>
                    <Card.Title
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>Refund Rate</div>
                      <div
                        style={{
                          backgroundColor: "#ffded1",
                          borderRadius: "50%",
                          width: "35px",
                          height: "35px",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <CartXFill color="#FF9066" />
                      </div>
                    </Card.Title>
                    <Card.Text>
                      <h3>
                        {loading ? (
                          <Loading />
                        ) : (
                          (
                            (orderRefund.length / allOrders.length) *
                            100
                          ).toFixed(3)
                        )}
                        %
                      </h3>
                      {/* <small className="text-danger">↓ 4.3% Down from last month</small> */}
                    </Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row className="mb-4">
              <p className="fw-bold text-success fs-5">
                Finacial Health & Growth
              </p>
              <Col>
                <RevenueGrowth />
              </Col>
            </Row>
          </>
        )}
        <div>
          <h1 className="page-title">Seles</h1>
        </div>
        <Row>
          {loading ? (
            <Loading />
          ) : (
            mapData?.map((data, index) => {
              return (
                <Col key={index} md={3} sm={6} xs={12} className="mb-3">
                  <Card style={{ backgroundColor: generateColor(index) }}>
                    <Card.Body>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Card.Title>{data?.nama}</Card.Title>
                        <div>
                          <Card.Text
                            style={{ whiteSpace: "nowrap", marginLeft: "5px" }}
                          >
                            Order Total
                          </Card.Text>
                          <Card.Text style={{ float: "right" }}>
                            {" "}
                            {data?.jumlahOrder}
                          </Card.Text>
                        </div>
                      </div>
                      <h6>Sale</h6>
                      <h3>{currency(data?.amount)}</h3>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })
          )}
          {/* <Col md={3} sm={6} xs={12} className="mb-3">
            <Card className="shadow-sm text-white bg-warning">
              <Card.Body>
                <Card.Title>Harun 1</Card.Title>
                <Card.Text>Jumlah Order +10</Card.Text>
                <h5>Penjualan</h5>
                <h3>Rp22.312.321</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} sm={6} xs={12} className="mb-3">
            <Card className="shadow-sm text-white bg-primary">
              <Card.Body>
                <Card.Title>Nashir 2</Card.Title>
                <Card.Text>Jumlah Order +10</Card.Text>
                <h5>Penjualan</h5>
                <h3>Rp22.312.321</h3>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} sm={6} xs={12} className="mb-3">
            <Card className="shadow-sm text-white bg-primary">
              <Card.Body>
                <Card.Title>Nashir 2</Card.Title>
                <Card.Text>Jumlah Order +10</Card.Text>
                <h5>Penjualan</h5>
                <h3>Rp22.312.321</h3>
              </Card.Body>
            </Card>
          </Col> */}
          {/* Add more cards as needed */}
        </Row>
      </Container>
    </div>
  );
};

export default Dashboard;
