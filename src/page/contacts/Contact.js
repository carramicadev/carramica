import { set } from "date-fns";
import {
  collection,
  deleteDoc,
  doc,
  endBefore,
  getDocs,
  limit,
  limitToLast,
  orderBy,
  query,
  startAfter,
  Timestamp,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Button, ButtonGroup, Card, Col, Row } from "react-bootstrap";
import {
  BoxFill,
  CloudArrowDown,
  GraphUp,
  PencilSquare,
  PeopleFill,
  PersonSquare,
  TrashFill,
  XCircleFill,
} from "react-bootstrap-icons";
import { CSVLink } from "react-csv";
import DatePicker from "react-datepicker";
import DialogAddContact from "./DialogAddContact";
import { firestore } from "../../FirebaseFrovider";
import formatDate, { currency, decimal } from "../../formatter";
import Header from "../../components/Header";
import Loading from "../../components/Loading";

const Contact = () => {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [allContacts, setAllContacts] = useState([]);
  const [page, setPage] = useState(1);
  const [lengthContact, setLength] = useState(0);
  const [update, setUpdate] = useState(false);
  const [dialogAdd, setDialogAdd] = useState({
    open: false,
    data: {},
    mode: "add",
  });
  const [loading, setLoading] = useState(true);
  // query order
  const [allOrders, setAllOrders] = useState([]);
  useEffect(() => {
    if (page === 1) {
      const fetchData = async () => {
        try {
          // setLoading(true);
          const getDoc = query(
            collection(firestore, "orders"),
            orderBy("createdAt", "desc")
          );
          const documentSnapshots = await getDocs(getDoc);
          var items = [];

          documentSnapshots.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
            // doc.data() is never undefined for query doc snapshots
          });
          // console.log('first item ', items[0])
          setAllOrders(items);
          setLoading(false);
        } catch (e) {}
      };
      fetchData();
    }
  }, []);
  // Provide the query to the hook
  useEffect(() => {
    if (page === 1) {
      // setLoading(true);
      const fetchData = async () => {
        const getDoc = query(
          collection(firestore, "contact"),
          orderBy("createdAt", "desc")
        );
        const documentSnapshots = await getDocs(getDoc);
        var items = [];

        documentSnapshots.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
          // doc.data() is never undefined for query doc snapshots
        });
        // console.log('first item ', items[0])
        setLength(items.length);
      };
      fetchData();
      // setLoading(false);
    }
  }, [update]);
  useEffect(() => {
    if (page === 1) {
      // setLoading(true);
      const fetchData = async () => {
        const getDoc = query(
          collection(firestore, "contact"),
          orderBy("createdAt", "desc"),
          limit(20)
        );
        const documentSnapshots = await getDocs(getDoc);
        var items = [];

        documentSnapshots.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
          // doc.data() is never undefined for query doc snapshots
        });
        // console.log('first item ', items[0])
        setAllContacts(items);
      };
      fetchData();
      // setLoading(false);
    }
  }, [update]);
  const showNext = ({ item }) => {
    if (allContacts.length === 0) {
      alert("Thats all we have for now !");
    } else {
      const fetchNextData = async () => {
        const getDoc = query(
          collection(firestore, "contact"),
          orderBy("createdAt", "desc"),
          startAfter(item.createdAt),
          limit(20)
        );
        const documentSnapshots = await getDocs(getDoc);
        var items = [];

        documentSnapshots.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
          // doc.data() is never undefined for query doc snapshots
        });
        setAllContacts(items);
        setPage(page + 1);
      };
      fetchNextData();
    }
  };

  const showPrevious = ({ item }) => {
    const fetchPreviousData = async () => {
      const getDoc = query(
        collection(firestore, "contact"),
        orderBy("createdAt", "desc"),
        endBefore(item.createdAt),
        limitToLast(20)
      );
      const documentSnapshots = await getDocs(getDoc);
      var items = [];

      documentSnapshots.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
        // doc.data() is never undefined for query doc snapshots
      });
      setAllContacts(items);
      setPage(page - 1);
    };
    fetchPreviousData();
  };
  const filterByDate = async (start, end) => {
    try {
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
        collection(firestore, "contact"),
        where("createdAt", ">=", startTimestamp),
        where("createdAt", "<=", endTimestamp),
        limit(20)
      );
      const querySnapshot = await getDocs(ref);
      const documents = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      // console.log()
      setAllContacts(documents);
      // orders
      const refOrd = query(
        collection(firestore, "orders"),
        where("createdAt", ">=", startTimestamp),
        where("createdAt", "<=", endTimestamp)
      );
      const querySnapshotOrd = await getDocs(refOrd);
      const documentsOrd = querySnapshotOrd.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllOrders(documentsOrd);
    } catch (e) {
      console.log(e.message);
    }
  };

  // const orderSettlement = allContacts?.filter?.((ord) => ord.paymentStatus === 'settlement');
  // const orderPending = allContacts?.filter?.((ord) => ord.paymentStatus === 'pending');

  // date picker

  const handleSelect = (dates) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
    if (start && end) {
      filterByDate(start, end);
    }
  };

  // find average order
  const groupedDataAll = allOrders.reduce((acc, item) => {
    const key = item.senderPhone;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});

  const jumlahPembeliAll = Object.keys(groupedDataAll).length;

  // finc arpc/arpu
  const paidOrder = allOrders.filter(
    (all) => all?.paymentStatus === "settlement"
  );
  const arrayHarga = paidOrder.map((all) => all?.totalHargaProduk);
  const jumlahOrder = arrayHarga?.reduce((val, nilaiSekarang) => {
    return val + nilaiSekarang;
  }, 0);

  const groupedData = paidOrder.reduce((acc, item) => {
    const key = item.senderPhone;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});

  const jumlahPembeli = Object.keys(groupedData).length;
  const ARPC = parseFloat((jumlahOrder / jumlahPembeli).toFixed(3));

  // delete contact
  const handleDeleteClick = async (id) => {
    if (window.confirm(" apakah anda yakin ingin menghapus contact?")) {
      try {
        // console.log(id)
        const docRef = doc(firestore, "contact", id);
        await deleteDoc(docRef);
        setUpdate((prevValue) => !prevValue);

        // setData(data.filter((row) => row.id !== id));
      } catch (e) {
        console.log(e.message);
      }
    } else {
    }
  };
  console.log(loading);

  return (
    <div className="container">
      <Header />
      <h1 className="page-title">Contact</h1>
      {/* <div class="container mt-5"> */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "10px",
        }}
      >
        <DatePicker
          style={{ borderRadius: "10px" }}
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
      <Row className="mb-4">
        <Col md={3}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <div>Total Contact</div>
                <div
                  style={{
                    backgroundColor: "rgb(229 228 255)",
                    borderRadius: "35%",
                    width: "50px",
                    height: "50px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <PeopleFill color="#8280FF" />
                </div>
              </Card.Title>
              <Card.Text>
                <h3 style={{ margin: "0px" }}>
                  {loading ? <Loading /> : lengthContact}
                </h3>
                {/* <small className="text-success">↑ 8.5% Up from last month</small> */}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <div>Total Customer</div>
                <div
                  style={{
                    backgroundColor: "rgb(255 243 217)",
                    borderRadius: "35%",
                    width: "50px",
                    height: "50px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <BoxFill color="#FEC53D" />
                </div>
              </Card.Title>
              <Card.Text>
                <h3 style={{ margin: "0px" }}>
                  {loading ? <Loading /> : jumlahPembeliAll}
                </h3>
                {/* <small className="text-success">↑ 1.3% Up from last month</small> */}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <div>Average Order</div>
                <div
                  style={{
                    backgroundColor: "#d9f7e8",
                    borderRadius: "35%",
                    width: "50px",
                    height: "50px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <GraphUp color="#4AD991" />
                </div>
              </Card.Title>
              <Card.Text>
                <h3 style={{ margin: "0px" }}>
                  {loading ? (
                    <Loading />
                  ) : (
                    parseFloat((allOrders.length / jumlahPembeliAll).toFixed(2))
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
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                <div>ARPC/ARPU</div>
                <div
                  style={{
                    backgroundColor: "#ffded1",
                    borderRadius: "35%",
                    width: "50px",
                    height: "50px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <XCircleFill color="#FF9066" />
                </div>
              </Card.Title>
              <Card.Text>
                <h3 style={{ margin: "0px" }}>
                  {loading ? <Loading /> : decimal(ARPC)}
                </h3>
                {/* <small className="text-danger">↓ 4.3% Unpaid</small> */}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "10px",
        }}
      >
        <div style={{ display: "flex" }}>
          <CSVLink
            style={{
              width: "150px",
              marginRight: "10px",
              whiteSpace: "nowrap",
            }}
            data={allContacts}
            separator={";"}
            filename={"contact.csv"}
            className="btn btn-outline-secondary"
          >
            <CloudArrowDown /> Export As CSV
          </CSVLink>
          <button
            onClick={() => setDialogAdd({ open: true, data: {}, mode: "add" })}
            style={{
              whiteSpace: "nowrap",
              backgroundColor: "#3D5E54",
              border: "none",
              marginLeft: "10px",
            }}
            className="btn btn-primary"
          >
            +Add Contact
          </button>
        </div>
      </div>
      <div className="table-responsive">
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>NAME</th>
              <th>EMAIL</th>
              <th>PHONE</th>
              <th>PAID ORDERS</th>
              <th>LIFETIME VALUE (LTV)</th>
              <th>DATE ORDERS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <Loading />
            ) : (
              allContacts?.map((cont) => {
                const arrayInv = groupedData?.[cont?.phone]?.map(
                  (data) => data?.totalHargaProduk + data?.totalOngkir
                );
                // console.log(arrayInv)
                const lfitemeValue = arrayInv?.reduce((val, nilaiSekarang) => {
                  return val + nilaiSekarang;
                }, 0);
                return (
                  <tr style={{ whiteSpace: "nowrap" }} key={cont.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className="me-2">
                          <PersonSquare
                            color={
                              cont?.type === "sender" ? "#3D5E54" : "#998970"
                            }
                          />
                          {/* <img src="icon.png" alt="icon" style="width: 20px;"> */}
                        </span>
                        {cont?.nama}
                      </div>
                    </td>
                    <td>{cont?.email}</td>
                    <td>{cont?.id}</td>
                    <td>{groupedData?.[cont?.phone]?.length || 0}</td>
                    <td>{currency(lfitemeValue)}</td>
                    <td>
                      {formatDate(
                        groupedData?.[cont?.phone]?.[
                          groupedData?.[cont?.phone]?.length - 1
                        ]?.createdAt.toDate()
                      )}
                    </td>
                    <td>
                      <button
                        onClick={() =>
                          setDialogAdd({
                            open: true,
                            data: {},
                            mode: "edit",
                            item: cont,
                          })
                        }
                        style={{ backgroundColor: "#998970" }}
                        className="button button-primary"
                      >
                        <PencilSquare />
                      </button>
                      <button
                        style={{ backgroundColor: "red" }}
                        className="button button-primary"
                        onClick={() => handleDeleteClick(cont?.id)}
                      >
                        <TrashFill />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <ButtonGroup style={{ textAlign: "center", float: "right" }}>
          {/* //show previous button only when we have items */}
          <Button
            disabled={page === 1}
            style={{
              marginRight: "10px",
              whiteSpace: "nowrap",
              backgroundColor: "#3D5E54",
              border: "none",
            }}
            onClick={() => showPrevious({ item: allContacts[0] })}
          >
            {"<-Prev"}
          </Button>
          <input
            value={page}
            className="input"
            disabled
            style={{
              padding: "0px",
              width: "40px",
              marginRight: "10px",
              textAlign: "center",
              border: "none",
              marginBottom: "8px",
              marginTop: "8px",
            }}
          />
          {/* //show next button only when we have items */}
          <Button
            disabled={allContacts.length < 20}
            style={{
              whiteSpace: "nowrap",
              backgroundColor: "#3D5E54",
              border: "none",
            }}
            onClick={() =>
              showNext({ item: allContacts[allContacts.length - 1] })
            }
          >
            {"Next->"}
          </Button>
        </ButtonGroup>
      </div>
      <DialogAddContact
        show={dialogAdd}
        onHide={() => setDialogAdd({ open: false, data: {} })}
        setUpdate={setUpdate}
        // handlePayment={handlePayment}
        // loading={loading}
      />
    </div>
    // </div>
  );
};

export default Contact;
