import logo from './logo.svg';
import './App.css';
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import AddOrder from './AddOrder';
import OrderList from './OrderList';
import Product from './Product';
import Logistik from './Logistik';
import Contact from './Contact';
import Settings from './Settings';
import Login from './Login';
import Dashboard from './Dashboard';
import { AuthProvider, useAuth } from './AuthContext';
import PrivateRoute from './PrivateRoute';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from './FirebaseFrovider';

function App() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState({})
  const [checkList, setChcekList] = useState([])
  const comp = {
    home: Dashboard,
    addOrder: AddOrder,
    orders: OrderList,
    products: Product,
    logistic: Logistik,
    contact: Contact,
    settings: Settings

  }
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
      component: comp?.[role?.component],
    };
  });

  // console.log(process.env.REACT_APP_ENVIRONMENT)
  return (
    <Router>

      <Routes>
        {/* <Route path="/add-order" element={<PrivateRoute><AddOrder /></PrivateRoute>} />
        <Route path="/orders" element={<PrivateRoute><OrderList /></PrivateRoute>} />
        <Route path="/products" element={<PrivateRoute><Product /></PrivateRoute>} />
        <Route path="/logistic" element={<PrivateRoute><Logistik /></PrivateRoute>} />
        <Route path="/contact" element={<PrivateRoute><Contact /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        /> */}
        {
          akses?.map((acc) => {
            return <Route
              key={acc?.path}
              path={acc?.path}
              element={
                <PrivateRoute>
                  <acc.component profile={profile} /> {/* Render the component */}
                </PrivateRoute>
              }
            />
          })
        }
        <Route path="/login" element={<Login />} />
        {!currentUser && <Route path="*" element={<Navigate to='/login' />} />}

      </Routes>
    </Router>
  );
}

export default App;
