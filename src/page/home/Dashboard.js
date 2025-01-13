import { useFirestoreQueryData } from "@react-query-firebase/firestore";
import { collection, doc, endBefore, getDoc, getDocs, orderBy, query, startAfter, Timestamp, where } from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import DatePicker from "react-datepicker";
import TransactionChart from "./Charts";
import { firestore } from "../../FirebaseFrovider";
import Header from "../../components/Header";
import "react-datepicker/dist/react-datepicker.css";
import { currency } from "../../formatter";
import { set } from "date-fns";
import { BoxFill, GraphUp, KanbanFill, PeopleFill, XCircleFill } from "react-bootstrap-icons";
import Loading from "../../components/Loading";

// bg random
const generateColor = (index) => {
  const hue = (index * 137) % 360;
  return `hsl(${hue}, 70%, 80%)`;
};
const Dashboard = ({ profile }) => {
  const today = new Date();
  const last30Days = new Date();
  last30Days.setDate(today.getDate() - 30);
  const [startDate, setStartDate] = useState(last30Days);
  const [endDate, setEndDate] = useState(today);
  const [allOrders, setAllOrders] = useState([])
  const [user, setUser] = useState([])
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    const fetchData = async () => {
      const getDoc = query(collection(firestore, "users"), orderBy("createdAt", "desc"));
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

  // Provide the query to the hook
  // useEffect(() => {
  //   const fetchData = async () => {
  //     const getDoc = query(collection(firestore, "orders"), orderBy("createdAt", "asc"));
  //     const documentSnapshots = await getDocs(getDoc);
  //     var items = [];

  //     documentSnapshots.forEach((doc) => {
  //       items.push({ id: doc.id, ...doc.data() });
  //       // doc.data() is never undefined for query doc snapshots
  //     });
  //     setAllOrders(items);
  //   };
  //   fetchData();
  // }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const getDoc = query(collection(firestore, "orders"), orderBy("createdAt", "asc"));
      const documentSnapshots = await getDocs(getDoc);
      var items = [];

      documentSnapshots.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
        // doc.data() is never undefined for query doc snapshots
      });
      setAllOrders(items);
      setStartDate(null);
      setEndDate(null);
      setLoading(false)
    } catch (e) {
      setLoading(false);
      console.log(e.message)
    }
  }

  const filterByDate = useCallback(async (start, end) => {
    try {
      setLoading(true)
      const yearStart = start.getFullYear();
      const monthStart = String(start.getMonth() + 1).padStart(2, '0'); // Months are 0-based
      const dayStart = String(start.getDate()).padStart(2, '0');
      const formattedDateStart = `${yearStart}-${monthStart}-${dayStart}`;
      // end
      const yearEnd = end.getFullYear();
      const monthEnd = String(end.getMonth() + 1).padStart(2, '0'); // Months are 0-based
      const dayEnd = String(end.getDate()).padStart(2, '0');
      const formattedDateEnd = `${yearEnd}-${monthEnd}-${dayEnd}`;
      // 
      const startTimestamp = Timestamp.fromDate(new Date(formattedDateStart));
      const endTimestamp = Timestamp.fromDate(set(new Date(formattedDateEnd), {
        hours: 23,
        minutes: 59,
        seconds: 59,
        milliseconds: 999

      }));
      const ref = query(collection(firestore, "orders"), where("createdAt", ">=", startTimestamp), where("createdAt", "<=", endTimestamp));
      const querySnapshot = await getDocs(ref);
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // console.log()
      setAllOrders(documents);
      setLoading(false)
    } catch (e) {
      setLoading(false)
      console.log(e.message)
    }
  }, [])

  useEffect(() => {
    filterByDate(startDate, endDate)
  }, [])

  // date picker


  const handleSelect = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
    if (start && end) {
      filterByDate(start, end)

    }
  };


  const ordersFilterd = allOrders.filter((all) => {
    return all?.totalHargaProduk && all?.totalHargaProduk
  });
  const orderSettlement = ordersFilterd?.filter?.((ord) => ord.paymentStatus === 'settlement');
  const orderPending = ordersFilterd?.filter?.((ord) => ord.paymentStatus === 'pending');

  const arrayTotal = orderSettlement.map((all) => all?.totalHargaProduk)
  // console.log(arrayTotal?.reduce((val, nilaiSekarang) => {
  //   return val + nilaiSekarang
  // }, 0));
  const totalOmset = arrayTotal?.reduce((val, nilaiSekarang) => {
    return val + nilaiSekarang
  }, 0)

  const groupedData = Object?.values?.(orderSettlement?.reduce?.((acc, item) => {
    if (!acc[item.userId]) {
      acc[item.userId] = { userId: item.userId, items: [] };
    }
    acc[item.userId].items.push(item);
    return acc;
  }, {}));
  const mapData = groupedData?.map((ord) => {
    const amountAll = ord?.items?.map((d) => d?.totalHargaProduk || 0);
    const amountTot = amountAll?.reduce((val, nilaiSekarang) => {
      return val + nilaiSekarang
    }, 0);

    const dataUser = user.find(item => item.userId === ord?.userId)
    // const docRef = doc(firestore, "users", ord?.userId);
    // const docSnap = await getDoc(docRef);
    return {
      amount: amountTot,
      sender: ord?.userId,
      nama: `${dataUser?.firstName} ${dataUser?.lastName}`,
      jumlahOrder: ord?.items?.length
    }
  })


  // let grouped = []
  // const grupingOrders = Object.values(groupedData)?.map?.((all) => {
  //   return all?.map((ord) => {
  //     return ord?.totalHargaProduk
  //   })
  // })
  // console.log();
  // console.log(profile)

  return (
    <div className="container">
      <Header />
      <h1 className="page-title">Dashboard</h1>

      <Container fluid>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px', whiteSpace: 'nowrap', }}>
          <button onClick={fetchAllData} style={{ backgroundColor: '#998970' }} className="button button-primary"><KanbanFill /> Load All Orders</button>

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
        {
          profile?.rules === 'admin' &&
          <><Row className="mb-4">
            <Col md={3}>
              <Card className="shadow-sm">
                <Card.Body>
                  <Card.Title style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      Total Invoice
                    </div>
                    <div style={{ backgroundColor: 'rgb(229 228 255)', borderRadius: '50%', width: '35px', height: '35px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <PeopleFill color="#8280FF" />
                    </div>

                  </Card.Title>
                  <Card.Text>
                    <h3>{loading ? <Loading /> : ordersFilterd?.length}</h3>
                    {/* <small className="text-success">↑ 8.5% Up from last month</small> */}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="shadow-sm">
                <Card.Body>
                  <Card.Title style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      Total Invoice Paid
                    </div>
                    <div style={{ backgroundColor: 'rgb(255 243 217)', borderRadius: '50%', width: '35px', height: '35px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <BoxFill color="#FEC53D" />
                    </div>

                  </Card.Title>
                  <Card.Text>
                    <h3>{loading ? <Loading /> : orderSettlement?.length}</h3>
                    {/* <small className="text-success">↑ 1.3% Up from last month</small> */}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="shadow-sm">
                <Card.Body>
                  <Card.Title style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      Revenue
                    </div>
                    <div style={{ backgroundColor: '#d9f7e8', borderRadius: '50%', width: '35px', height: '35px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <GraphUp color="#4AD991" />
                    </div>

                  </Card.Title>
                  <Card.Text>
                    <h3>{loading ? <Loading /> : currency(totalOmset)}</h3>
                    {/* <small className="text-danger">↓ 4.3% Down from last month</small> */}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="shadow-sm">
                <Card.Body>
                  <Card.Title style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      Unpaid
                    </div>
                    <div style={{ backgroundColor: '#ffded1', borderRadius: '50%', width: '35px', height: '35px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      <XCircleFill color="#FF9066" />
                    </div>

                  </Card.Title>
                  <Card.Text>
                    <h3>{loading ? <Loading /> : orderPending?.length}</h3>
                    {/* <small className="text-danger">↓ 4.3% Unpaid</small> */}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row><Row className="mb-4">
              <Col>
                <Card className="shadow-sm">
                  <Card.Body>
                    <Card.Title>Transaction</Card.Title>
                    <div className="chart">
                      {/* Add a chart component here or use an image */}
                      {loading ? <Loading /> : <TransactionChart allOrders={allOrders} />}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row></>
        }
        <div>
          <h1 className="page-title">Seles</h1>
        </div>
        <Row>
          {loading ?
            <Loading /> :
            mapData?.map((data, index) => {
              return <Col md={3} sm={6} xs={12} className="mb-3">
                <Card style={{ backgroundColor: generateColor(index) }}>
                  <Card.Body>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Card.Title>{data?.nama}</Card.Title>
                      <div>
                        <Card.Text style={{ whiteSpace: 'nowrap', marginLeft: '5px' }}>Order Total</Card.Text>
                        <Card.Text style={{ float: 'right' }}> {data?.jumlahOrder}</Card.Text>
                      </div>
                    </div>
                    <h6>Sale</h6>
                    <h3>{currency(data?.amount)}</h3>
                  </Card.Body>
                </Card>
              </Col>
            })
          }
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
