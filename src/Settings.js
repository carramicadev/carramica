import { collection, deleteDoc, doc, endBefore, getDoc, getDocs, limit, limitToLast, orderBy, query, setDoc, startAfter } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useSnackbar } from 'notistack';
import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Nav, Tab, Form, Button, Tabs, ButtonGroup } from 'react-bootstrap';
import { PersonSquare, TrashFill } from 'react-bootstrap-icons';
import DialogAddUsers from './DialogAddUsers';
// import DialogAddContact from './DialogAddContact';
import { firestore, functions } from './FirebaseFrovider';
import Header from './Header';
import ProfilePage from './settingsProfil';
import './settings.css';

const Settings = (props) => {
  const { enqueueSnackbar } = useSnackbar();
  const [update, setUpdate] = useState(false);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [selectedRules, setSelectedRules] = React.useState('sales');
  const rules = ['sales', 'admin', 'shipping', 'Head Of Sales']
  // const [selectedOptions, setSelectedOptions] = useState([]);
  const options = [
    { component: 'home', name: 'Home', path: '/' },
    { component: 'addOrder', name: 'Add Order', path: '/add-order' },
    { component: 'orders', name: 'Orders', path: '/orders' },
    { component: 'products', name: 'Products', path: '/products' },
    { component: 'logistic', name: 'Logistic', path: '/logistic' },
    { component: 'contact', name: 'Contact', path: '/contact' },
    { component: 'settings', name: 'Settings', path: '/settings' },
  ];

  const [checkList, setChcekList] = useState([])

  const handeCheckList = (value, i) => (e) => {
    const currentIndex = checkList.findIndex(check => check.component === value.component);
    // console.log(currentIndex)
    const newChecked = [...checkList];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChcekList(newChecked);

  }
  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(firestore, "settings", "rules", "menu", selectedRules);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setChcekList(docSnap.data().akses)
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
      const getDoc = query(collection(firestore, "users"), orderBy("createdAt", "desc"), limit(20));
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
      alert("Thats all we have for now !")
    } else {
      const fetchNextData = async () => {
        const getDoc = query(collection(firestore, "users"), orderBy("createdAt", "desc"), startAfter(item.createdAt), limit(20));
        const documentSnapshots = await getDocs(getDoc);
        var items = [];

        documentSnapshots.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
          // doc.data() is never undefined for query doc snapshots
        });
        setList(items);
        setPage(page + 1)
      };
      fetchNextData();
    }
  };

  const showPrevious = ({ item }) => {
    const fetchPreviousData = async () => {
      const getDoc = query(collection(firestore, "users"), orderBy("createdAt", "desc"), endBefore(item.createdAt), limitToLast(20));
      const documentSnapshots = await getDocs(getDoc);
      var items = [];

      documentSnapshots.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
        // doc.data() is never undefined for query doc snapshots
      });
      setList(items);
      setPage(page - 1)
    };
    fetchPreviousData();
  };


  const handleSave = async () => {
    try {
      await setDoc(doc(firestore, "settings", "rules", "menu", selectedRules), {
        akses: checkList
      })
      // console.log('Saved settings:',);
      enqueueSnackbar('settings berhasil disimpan!.', { variant: 'success' })
      // alert('Settings saved successfully!');
    } catch (e) {
      console.log(e.message)
    }
  };
  // delete contact
  const handleDeleteClick = async (id) => {
    if (window.confirm(' apakah anda yakin ingin menghapus sales ini?')) {
      try {
        // console.log(id)
        const deleteUser = httpsCallable(functions, 'deleteUser');
        await deleteUser({
          id: id,
        });
        const docRef = doc(firestore, 'users', id);
        await deleteDoc(docRef);
        setUpdate((prevValue) => !prevValue)
        enqueueSnackbar(`berhasil menghapus sales`, { variant: 'success' })
        // setData(data.filter((row) => row.id !== id));
      } catch (e) {
        enqueueSnackbar(`gagal menghapus sales, ${e.message}`, { variant: 'error' })

        console.log(e.message)
      }
    } else {

    }

  };

  const [key, setKey] = useState(props?.profile?.rules === 'admin' ? 'settings' : 'profile');
  const [subKey, setSubKey] = useState('users')
  // console.log(props?.profile)
  // style
  const defaultTabStyle = {
    padding: '10px 20px',
    borderRadius: '50%',
    color: '#3D5E54',
  };

  const activeTabStyle = {
    backgroundColor: '#3D5E54',
    color: '#fff',
  };

  const inactiveTabStyle = {
    backgroundColor: 'transparent',
    color: '#3D5E54',
  };
  return (
    <div className="container">
      <Header />
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
        style={{ color: '#3D5E54' }}
      >
        {
          props?.profile?.rules === 'admin' &&
          <Tab tabClassName="custom-tab" style={{ color: '#3D5E54', borderRadius: '50%' }} eventKey="settings" title="Settings">
            <Tab.Container defaultActiveKey={subKey} onSelect={(k) => setSubKey(k)}>
              <Row>
                <Col sm={3}>
                  <Nav variant="pills" className="flex-column">
                    <Nav.Item style={{ marginBottom: '10px' }}>
                      <Nav.Link style={subKey === 'users' ? { backgroundColor: 'grey' } : { backgroundColor: 'lightgray', color: 'black' }} eventKey="users">Users</Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link style={subKey === 'control' ? { backgroundColor: 'grey' } : { backgroundColor: 'lightgray', color: 'black' }} eventKey="control">Control</Nav.Link>
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
                          <Form.Control as="select" value={selectedRules} onChange={(e) => setSelectedRules(e.target.value)}>
                            {
                              rules.map((rule) => (
                                <option value={rule}>{rule}</option>

                              ))
                            }

                          </Form.Control>
                        </Form.Group>
                        <Form.Group>
                          <Form.Label>Tidak dapat melihat</Form.Label>


                          {options.map((option) => {
                            // console.log(checkList.find(check => check.id === option.id))
                            return <Form.Check
                              key={option?.component}
                              name={option?.component}
                              label={`Halaman ${option?.name}`}

                              type="checkbox"
                              checked={checkList.find(check => check.component === option.component) ? true : false}
                              onChange={handeCheckList(option)}
                              disableRipple
                              // inputProps={{ 'aria-labelledby': option?.id }}
                              defaultChecked


                            />
                          })}
                        </Form.Group>
                        <Button style={{ backgroundColor: '#3D5E54', border: 'none', width: '100%' }} onClick={handleSave}>
                          Save
                        </Button>
                      </Form>
                    </Tab.Pane>
                    <Tab.Pane eventKey="users">
                      <div className="table-responsive">
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <div style={{ display: 'flex' }}>
                            <button style={{ whiteSpace: 'nowrap', backgroundColor: '#3D5E54', border: 'none', marginLeft: '10px' }} className="btn btn-primary" onClick={() => setOpenAddDialog(true)}>+Add Sales</button>
                          </div>
                        </div>
                        <table className="table table-bordered">
                          <thead>
                            <tr>
                              <th>NAME</th>
                              <th>EMAIL</th>
                              <th>PHONE</th>
                              <th>RULES</th>
                              <th>ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody>

                            {
                              list?.map((user) => {
                                return <tr>
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <span className="me-2">
                                        <PersonSquare color='#3D5E54' />
                                      </span>
                                      {user?.firstName} {user?.lastName}
                                    </div>
                                  </td>
                                  <td>{user?.email}</td>
                                  <td>{user?.phone}</td>
                                  <td>{user?.rules}</td>

                                  <td>
                                    <button style={{ backgroundColor: 'red' }} className="button button-primary" onClick={() => handleDeleteClick(user?.userId)}>
                                      <TrashFill />
                                    </button>
                                  </td>
                                </tr>
                              })
                            }
                          </tbody>
                        </table>
                        <ButtonGroup style={{ textAlign: 'center', float: 'right' }}>
                          {/* //show previous button only when we have items */}
                          <Button disabled={page === 1} style={{ marginRight: '10px', whiteSpace: 'nowrap', backgroundColor: '#3D5E54', border: 'none' }} onClick={() => showPrevious({ item: list[0] })}>{'<-Prev'}</Button>
                          <input value={page} className="input" disabled style={{
                            padding: '0px',
                            width: '40px',
                            marginRight: '10px',
                            textAlign: 'center',
                            border: 'none',
                            marginBottom: '8px',
                            marginTop: '8px'
                          }} />
                          {/* //show next button only when we have items */}
                          <Button disabled={list.length < 20} style={{ whiteSpace: 'nowrap', backgroundColor: '#3D5E54', border: 'none' }} onClick={() => showNext({ item: list[list.length - 1] })}>{'Next->'}</Button>
                        </ButtonGroup>
                        <DialogAddUsers
                          show={openAddDialog}
                          handleClose={() => setOpenAddDialog(false)}
                          setUpdate={setUpdate}
                        />
                      </div>
                    </Tab.Pane>
                  </Tab.Content>
                </Col>
              </Row>
            </Tab.Container>        </Tab>
        }
        <Tab eventKey="profile" title="Profile">
          <ProfilePage enqueueSnackbar={enqueueSnackbar} />
        </Tab>

      </Tabs>

    </div>
  );
};

export default Settings;
