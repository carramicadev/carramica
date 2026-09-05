import {
  collection,
  deleteDoc,
  doc,
  endBefore,
  getDoc,
  getDocs,
  limit,
  limitToLast,
  orderBy,
  query,
  setDoc,
  startAfter,
  where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useSnackbar } from "notistack";
import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Nav,
  Tab,
  Form,
  Button,
  Tabs,
  ButtonGroup,
} from "react-bootstrap";
import { PencilSquare, PersonSquare, TrashFill } from "react-bootstrap-icons";
import DialogAddUsers from "./DialogAddUsers";
// import DialogAddContact from './DialogAddContact';
import { firestore, functions } from "../../FirebaseFrovider";
import ProfilePage from "./settingsProfil";
import "./settings.css";
import Warehouse from "./warehouse";
import Layout from "../../components/Layout";
import Agen from "./agen";
import DestySettings from "./DestySettings";
import { usePaymentNotification } from "../../components/PaymentNotification";

const Settings = (props) => {
  const { enqueueSnackbar } = useSnackbar();
  const [update, setUpdate] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState({
    open: false,
    mode: "add",
    data: {},
  });
  const [selectedRules, setSelectedRules] = React.useState("sales");
  const rules = ["sales", "admin", "shipping", "Head Of Sales", "agen"];
  // const [selectedOptions, setSelectedOptions] = useState([]);
  const options = [
    { component: "home", name: "Home", path: "/" },
    { component: "addOrder", name: "Add Order", path: "/add-order" },
    { component: "orders", name: "Orders", path: "/orders" },
    {
      component: "products",
      name: "Products",
      path: "/products/*",
      subMenu: [
        {
          component: "products",
          name: "Products",
          path: "/products/*",
        },
        {
          component: "categories",
          name: "Categories",
          path: "/categories",
        },
      ],
    },
    { component: "logistic", name: "Logistic", path: "/logistic" },
    { component: "contact", name: "Contact", path: "/contact" },
    { component: "report", name: "Report", path: "/report" },
    { component: "settings", name: "Settings", path: "/settings" },
  ];

  const [checkList, setChcekList] = useState([]);

  const handeCheckList = (value, i) => (e) => {
    const currentIndex = checkList.findIndex(
      (check) => check.component === value.component
    );
    // console.log(currentIndex)
    const newChecked = [...checkList];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChcekList(newChecked);
  };
  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(firestore, "settings", "rules", "menu", selectedRules);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setChcekList(docSnap.data().akses);
      }
    };
    fetchData();
  }, [selectedRules]);
  // console.log(checkList)
  // query coll users
  const [list, setList] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      const getDoc = query(
        collection(firestore, "users"),
        where("rules", "!=", "agen"),
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
      setList(items);
    };
    fetchData();
  }, [update]);
  // console.log(list)
  const showNext = ({ item }) => {
    if (list.length === 0) {
      alert("Thats all we have for now !");
    } else {
      const fetchNextData = async () => {
        const getDoc = query(
          collection(firestore, "users"),
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
        setList(items);
        setPage(page + 1);
      };
      fetchNextData();
    }
  };

  const showPrevious = ({ item }) => {
    const fetchPreviousData = async () => {
      const getDoc = query(
        collection(firestore, "users"),
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
      setList(items);
      setPage(page - 1);
    };
    fetchPreviousData();
  };

  const handleSave = async () => {
    try {
      await setDoc(doc(firestore, "settings", "rules", "menu", selectedRules), {
        akses: checkList,
      });
      // console.log('Saved settings:',);
      enqueueSnackbar("settings berhasil disimpan!.", { variant: "success" });
      // alert('Settings saved successfully!');
    } catch (e) {
      console.log(e.message);
    }
  };
  // delete contact
  const handleDeleteClick = async (id) => {
    if (window.confirm(" apakah anda yakin ingin menghapus sales ini?")) {
      try {
        // console.log(id)
        const deleteUser = httpsCallable(functions, "deleteUser");
        await deleteUser({
          id: id,
        });
        const docRef = doc(firestore, "users", id);
        await deleteDoc(docRef);
        setUpdate((prevValue) => !prevValue);
        enqueueSnackbar(`berhasil menghapus sales`, { variant: "success" });
        // setData(data.filter((row) => row.id !== id));
      } catch (e) {
        enqueueSnackbar(`gagal menghapus sales, ${e.message}`, {
          variant: "error",
        });

        console.log(e.message);
      }
    } else {
    }
  };

  const [key, setKey] = useState(
    props?.profile?.rules === "admin" ? "settings" : "profile"
  );
  const [subKey, setSubKey] = useState("users");
  // console.log(props?.profile)
  // style
  const defaultTabStyle = {
    padding: "10px 20px",
    borderRadius: "50%",
    color: "#3D5E54",
  };

  const activeTabStyle = {
    backgroundColor: "#3D5E54",
    color: "#fff",
  };

  const inactiveTabStyle = {
    backgroundColor: "transparent",
    color: "#3D5E54",
  };
  return (
    <Layout>
    <div className="container">
      <Row>
        <Col>
          <h1>Settings</h1>
        </Col>
      </Row>
      <Tabs
        id="controlled-tab-example"
        activeKey={key}
        onSelect={(k) => setKey(k)}
        className="mb-3"
        style={{ color: "#3D5E54" }}
      >
        {props?.profile?.rules === "admin" && (
          <Tab
            tabClassName="custom-tab"
            style={{ color: "#3D5E54", borderRadius: "50%" }}
            eventKey="settings"
            title="Settings"
          >
            <Tab.Container
              defaultActiveKey={subKey}
              onSelect={(k) => setSubKey(k)}
            >
              <Row>
                <Col sm={3}>
                  <Nav variant="pills" className="flex-column">
                    <Nav.Item style={{ marginBottom: "10px" }}>
                      <Nav.Link
                        style={
                          subKey === "users"
                            ? { backgroundColor: "grey" }
                            : { backgroundColor: "lightgray", color: "black" }
                        }
                        eventKey="users"
                      >
                        Users
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item style={{ marginBottom: "10px" }}>
                      <Nav.Link
                        style={
                          subKey === "control"
                            ? { backgroundColor: "grey" }
                            : { backgroundColor: "lightgray", color: "black" }
                        }
                        eventKey="control"
                      >
                        Control
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item style={{ marginBottom: "10px" }}>
                      <Nav.Link
                        style={
                          subKey === "notification"
                            ? { backgroundColor: "grey" }
                            : { backgroundColor: "lightgray", color: "black" }
                        }
                        eventKey="notification"
                      >
                        Notification
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>
                </Col>
                <Col sm={9}>
                  <Tab.Content>
                    <Tab.Pane eventKey="control">
                      <h2>Control</h2>
                      <Form>
                        <Form.Group>
                          <Form.Label>Rules</Form.Label>
                          <Form.Control
                            as="select"
                            value={selectedRules}
                            onChange={(e) => setSelectedRules(e.target.value)}
                          >
                            {rules.map((rule) => (
                              <option value={rule}>{rule}</option>
                            ))}
                          </Form.Control>
                        </Form.Group>
                        <Form.Group>
                          <Form.Label>Tidak dapat melihat</Form.Label>

                          {options.map((option) => {
                            // console.log(checkList.find(check => check.id === option.id))
                            return (
                              <Form.Check
                                key={option?.component}
                                name={option?.component}
                                label={`Halaman ${option?.name}`}
                                type="checkbox"
                                checked={
                                  checkList.find(
                                    (check) =>
                                      check.component === option.component
                                  )
                                    ? true
                                    : false
                                }
                                onChange={handeCheckList(option)}
                                disableRipple
                                // inputProps={{ 'aria-labelledby': option?.id }}
                                defaultChecked
                              />
                            );
                          })}
                        </Form.Group>
                        <Button
                          style={{
                            backgroundColor: "#3D5E54",
                            border: "none",
                            width: "100%",
                          }}
                          onClick={handleSave}
                        >
                          Save
                        </Button>
                      </Form>
                    </Tab.Pane>
                    <Tab.Pane eventKey="notification">
                      <NotificationSettings />
                    </Tab.Pane>
                    <Tab.Pane eventKey="users">
                      <div className="table-responsive">
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                          <div style={{ display: "flex" }}>
                            <button
                              style={{
                                whiteSpace: "nowrap",
                                backgroundColor: "#3D5E54",
                                border: "none",
                                marginLeft: "10px",
                              }}
                              className="btn btn-primary"
                              onClick={() =>
                                setOpenAddDialog({
                                  open: true,
                                  mode: "add",
                                  data: {},
                                })
                              }
                            >
                              +Add Sales
                            </button>
                          </div>
                        </div>
                        <table className="table table-bordered">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>NAME</th>
                              <th>EMAIL</th>
                              <th>PHONE</th>
                              <th>RULES</th>
                              <th>ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {list?.map((user) => {
                              return (
                                <tr>
                                  <td style={{ fontFamily: "monospace", fontSize: "12px" }}>
                                    {user?.userId}
                                  </td>
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <span className="me-2">
                                        <PersonSquare color="#3D5E54" />
                                      </span>
                                      {user?.firstName} {user?.lastName}
                                    </div>
                                  </td>
                                  <td>{user?.email}</td>
                                  <td>{user?.phone}</td>
                                  <td>{user?.rules}</td>

                                  <td>
                                    <button
                                      onClick={() => {
                                        setOpenAddDialog({
                                          open: true,
                                          mode: "edit",
                                          data: user,
                                        });
                                        // setDialogAdd({ open: true, data: selectedData, mode: 'edit', item: item })
                                      }}
                                      style={{ backgroundColor: "#998970" }}
                                      className="button button-primary"
                                    >
                                      <PencilSquare />
                                    </button>
                                    <button
                                      style={{ backgroundColor: "red" }}
                                      className="button button-primary"
                                      onClick={() =>
                                        handleDeleteClick(user?.userId)
                                      }
                                    >
                                      <TrashFill />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <ButtonGroup
                          style={{ textAlign: "center", float: "right" }}
                        >
                          {/* //show previous button only when we have items */}
                          <Button
                            disabled={page === 1}
                            style={{
                              marginRight: "10px",
                              whiteSpace: "nowrap",
                              backgroundColor: "#3D5E54",
                              border: "none",
                            }}
                            onClick={() => showPrevious({ item: list[0] })}
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
                            disabled={list.length < 20}
                            style={{
                              whiteSpace: "nowrap",
                              backgroundColor: "#3D5E54",
                              border: "none",
                            }}
                            onClick={() =>
                              showNext({ item: list[list.length - 1] })
                            }
                          >
                            {"Next->"}
                          </Button>
                        </ButtonGroup>
                        <DialogAddUsers
                          show={openAddDialog}
                          handleClose={() =>
                            setOpenAddDialog({
                              open: false,
                              mode: "add",
                              data: {},
                            })
                          }
                          setUpdate={setUpdate}
                        />
                      </div>
                    </Tab.Pane>
                  </Tab.Content>
                </Col>
              </Row>
            </Tab.Container>{" "}
          </Tab>
        )}

        {/* Admin-only Warehouse Tab */}
        {props?.profile?.rules === "admin" && (
          <Tab eventKey="warehouse" title="Warehouse">
            <Warehouse />
          </Tab>
        )}

        {/* Admin-only Agen Tab */}
        {props?.profile?.rules === "admin" && (
          <Tab eventKey="agen" title="Agen">
            <Agen />
          </Tab>
        )}


        {/* Desty Integration Tab - only carramicadev@gmail.com */}
        {props?.profile?.email === "carramicadev@gmail.com" && (
          <Tab eventKey="desty" title="Desty Integration">
            <DestySettings />
          </Tab>
        )}
        <Tab eventKey="profile" title="Profile">
          <ProfilePage enqueueSnackbar={enqueueSnackbar} />
        </Tab>
      </Tabs>
    </div>
    </Layout>
  );
};

export default Settings;

// Notification Settings Component
const NotificationSettings = () => {
  const { enqueueSnackbar } = useSnackbar();
  const {
    isEnabled,
    soundEnabled,
    permissionStatus,
    requestPermission,
    disableNotifications,
    setSoundEnabled,
    showPaymentNotification,
    toasts,
    clearAllToasts,
  } = usePaymentNotification();

  const handleTestNotification = () => {
    showPaymentNotification({
      invoiceId: "TEST-" + Date.now(),
      amount: 250000,
      customerName: "Test Customer",
      paymentMethod: "test",
    });
    enqueueSnackbar("Test notification sent!", { variant: "info" });
  };

  return (
    <div>
      <h2>Pengaturan Notifikasi</h2>
      <p className="text-muted mb-4">
        Atur notifikasi pembayaran untuk menerima pemberitahuan saat ada customer yang melakukan pembayaran.
      </p>

      {/* Browser Notification Section */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: isEnabled
                  ? "linear-gradient(135deg, #3D5E54 0%, #4a7c6f 100%)"
                  : "#e9ecef",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                marginRight: "12px",
              }}
            >
              {isEnabled ? "🔔" : "🔕"}
            </div>
            <div style={{ flex: 1 }}>
              <h5 className="mb-1">Notifikasi Browser</h5>
              <p className="mb-0 text-muted" style={{ fontSize: "13px" }}>
                Tampilkan notifikasi di kanan atas layar saat ada pembayaran baru
              </p>
            </div>
            <div>
              {permissionStatus === "denied" ? (
                <span className="badge bg-danger">Diblokir</span>
              ) : isEnabled ? (
                <span className="badge bg-success">Aktif</span>
              ) : (
                <span className="badge bg-secondary">Nonaktif</span>
              )}
            </div>
          </div>

          {permissionStatus === "denied" ? (
            <div className="alert alert-warning">
              <strong>Notifikasi diblokir!</strong>
              <p className="mb-0 mt-2">
                Pengaturan browser memblokir notifikasi. Silakan aktifkan di pengaturan browser Anda.
              </p>
            </div>
          ) : !isEnabled ? (
            <button
              onClick={requestPermission}
              className="btn btn-primary w-100"
              style={{ backgroundColor: "#3D5E54", border: "none" }}
            >
              Aktifkan Notifikasi
            </button>
          ) : (
            <button
              onClick={disableNotifications}
              className="btn btn-outline-danger w-100"
            >
              Matikan Notifikasi
            </button>
          )}
        </div>
      </div>

      {/* Sound Section */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center">
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: soundEnabled
                  ? "linear-gradient(135deg, #3D5E54 0%, #4a7c6f 100%)"
                  : "#e9ecef",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                marginRight: "12px",
              }}
            >
              {soundEnabled ? "🔊" : "🔇"}
            </div>
            <div style={{ flex: 1 }}>
              <h5 className="mb-1">Suara Notifikasi</h5>
              <p className="mb-0 text-muted" style={{ fontSize: "13px" }}>
                Mainkan suara kasir saat ada pembayaran baru
              </p>
            </div>
            <div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                style={{
                  background: soundEnabled ? "#d4edda" : "#e9ecef",
                  border: "none",
                  borderRadius: "20px",
                  width: "56px",
                  height: "28px",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 0.2s ease",
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: "#fff",
                    position: "absolute",
                    top: "2px",
                    left: soundEnabled ? "30px" : "2px",
                    transition: "left 0.2s ease",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                  }}
                >
                  {soundEnabled ? "🔔" : "🔕"}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Test Notification Section */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #ffc107 0%, #ff9800 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                marginRight: "12px",
              }}
            >
              🧪
            </div>
            <div style={{ flex: 1 }}>
              <h5 className="mb-1">Tes Notifikasi</h5>
              <p className="mb-0 text-muted" style={{ fontSize: "13px" }}>
                Kirim notifikasi test untuk memastikan pengaturan bekerja dengan benar
              </p>
            </div>
          </div>
          <button
            onClick={handleTestNotification}
            className="btn btn-warning w-100"
            style={{ border: "none" }}
          >
            📨 Kirim Notifikasi Test
          </button>
        </div>
      </div>

      {/* Recent Notifications */}
      {toasts.length > 0 && (
        <div className="card">
          <div className="card-body">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="mb-0">
                💰 Notifikasi Terbaru ({toasts.length})
              </h5>
              <button
                onClick={clearAllToasts}
                className="btn btn-sm btn-outline-secondary"
              >
                Hapus Semua
              </button>
            </div>
            <div className="list-group">
              {toasts.map((toast) => (
                <div
                  key={toast.id}
                  className="list-group-item d-flex justify-content-between align-items-center"
                  style={{
                    background: "linear-gradient(135deg, #1a472a 0%, #2d5a3d 100%)",
                    color: "#fff",
                    border: "none",
                    marginBottom: "8px",
                    borderRadius: "8px",
                  }}
                >
                  <div>
                    <strong>{toast.customerName}</strong>
                    <br />
                    <small style={{ color: "#ffd700" }}>
                      {toast.invoiceId}
                    </small>
                  </div>
                  <div className="text-end">
                    <strong style={{ color: "#ffd700" }}>
                      Rp {toast.amount?.toLocaleString("id-ID")}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
