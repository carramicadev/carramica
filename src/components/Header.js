import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { NavDropdown } from 'react-bootstrap';
import { EnvelopeAtFill, PersonCircle } from 'react-bootstrap-icons';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { auth, firestore } from '../FirebaseFrovider';
import { LogoutDialog } from './logoutDialog';

const Header = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState({})
  const [checkList, setChcekList] = useState([])
  // const comp = {
  //   home: Dashboard,
  //   addOrder: AddOrder,
  //   orders: OrderList,
  //   products: Product,
  //   logistic: Logistik,
  //   contact: Contact,
  //   settings: Settings

  // }
  useEffect(() => {
    async function getUsers() {
      if (currentUser) {
        const docRef = doc(firestore, "users", currentUser?.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProfile({
            ...docSnap.data()
          })
          // console.log("Document data:", docSnap.data());
        } else {
          // docSnap.data() will be undefined in this case
          console.log("No such document!");
        }

      }
    }
    getUsers()
  }, [currentUser]);

  useEffect(() => {
    const fetchData = async () => {
      if (profile?.rules) {
        const docRef = doc(firestore, "settings", "rules", "menu", profile?.rules);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          // console.log(docSnap.data())
          setChcekList(docSnap.data()?.akses)
        } else {
          // docSnap.data() will be undefined in this case
          console.log("No such document!");
        }
      }

    };
    fetchData();
  }, [profile?.rules]);

  const akses = checkList?.map((role) => {

    return {
      path: role?.path,
      name: role?.name,
      // component: comp?.[role?.component],
    };
  });

  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const handleShowLogoutDialog = () => setShowLogoutDialog(true);

  const handleLogout = () => {

    auth.signOut();
  };

  const style = {
    backgroundColor: '#00000026', padding: '10px', borderRadius: '7px'
  }
  const location = useLocation();
  const path = location.pathname
  // console.log(checkList);
  return (
    <header style={{ color: 'white', zIndex: 1 }} className="header">
      <div className="header-container">
        <div className="logo">CARRAMICA</div>
        <div className="nav-links">
          {
            akses.map((acc) => (
              <Link key={acc?.path} style={path === '/products' && acc?.path === '/products/*' ? style : path === acc?.path ? style : { padding: '10px', }} className="nav-link" to={acc?.path === '/products/*' ? '/products' : acc?.path}>{acc?.name}</Link>

            ))
          }
          {/* <Link style={path === '/' ? style : { padding: '10px', }} className="nav-link" to="/">Dashboard</Link>
          <Link style={path === '/add-order' ? style : { padding: '10px', }} className="nav-link" to="/add-order">Bikin Order</Link>
          <Link style={path === '/orders' ? style : { padding: '10px', }} className="nav-link" to="/orders">Order</Link>
          <Link style={path === '/products' ? style : { padding: '10px', }} className="nav-link" to="/products">Product</Link>
          <Link style={path === '/logistic' ? style : { padding: '10px', }} className="nav-link" to="/logistic">Logistik</Link>
          <Link style={path === '/contact' ? style : { padding: '10px', }} className="nav-link" to="/contact">Contact</Link>
          <Link style={path === '/settings' ? style : { padding: '10px', }} className="nav-link" to="/settings">Settings</Link> */}
        </div>
        <div className="user-icon">

          <NavDropdown title={<img src="./user-icon.svg" alt="User Icon" />} id="basic-nav-dropdown">

            <NavDropdown.ItemText style={{ whiteSpace: 'nowrap' }}><PersonCircle size={20} style={{ marginRight: '5px' }} />{profile?.firstName} {profile?.lastName}</NavDropdown.ItemText>
            <NavDropdown.ItemText style={{ whiteSpace: 'nowrap' }}><EnvelopeAtFill size={20} style={{ marginRight: '5px', }} />{profile?.email}</NavDropdown.ItemText>
            <NavDropdown.Divider />
            <NavDropdown.Item onClick={handleShowLogoutDialog} style={{ color: 'red' }}>
              Logout
            </NavDropdown.Item>
          </NavDropdown>
        </div>
        <LogoutDialog
          show={showLogoutDialog}
          handleClose={() => setShowLogoutDialog(false)}
          handleLogout={handleLogout}
        />
      </div>
    </header>
  );
};

export default Header;