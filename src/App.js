import logo from "./logo.svg";
import "./App.css";
import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import AddOrder from "./page/orders/AddOrder";
// import OrderList from './OrderList';
// import Product from './page/product/Product';
// import Logistik from './Logistik';
import Contact from "./page/contacts/Contact";
// import Settings from './Settings';
import Login from "./Login";
import Dashboard from "./page/home/Dashboard";
import { AuthProvider, useAuth } from "./AuthContext";
import PrivateRoute from "./PrivateRoute";
import { doc, getDoc, onSnapshot, collection, query, orderBy, limit } from "firebase/firestore";
import { firestore } from "./FirebaseFrovider";
import Logistik from "./page/logistic";
import OrderList from "./page/orders/OrderList";
import Settings from "./page/settings";
import Product from "./page/products";
import PaymentRedirect from "./PaymentRedirect";
import Categories from "./page/categories";
import ReportPage from "./page/report";
import { NotificationProvider, NotificationFloatingButton, usePaymentNotification } from "./components/PaymentNotification";
import { functions } from "./FirebaseFrovider";
import { httpsCallable } from "firebase/functions";

// Notification Listener Component (must be inside NotificationProvider)
const NotificationListener = () => {
  const { showPaymentNotification } = usePaymentNotification();
  const { currentUser } = useAuth();
  const [lastNotificationId, setLastNotificationId] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    const notificationsQuery = query(
      collection(firestore, "payment_notifications"),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      if (!snapshot.empty) {
        const latestNotification = snapshot.docs[0];
        const notificationId = latestNotification.id;

        if (notificationId !== lastNotificationId) {
          const notificationData = latestNotification.data();
          const createdAt = notificationData.createdAt?.toDate?.() || new Date();
          const thirtySecondsAgo = new Date(Date.now() - 30000);

          if (createdAt > thirtySecondsAgo) {
            showPaymentNotification({
              invoiceId: notificationData.invoiceId,
              orderId: notificationData.orderId,
              amount: notificationData.amount,
              customerName: notificationData.customerName,
              paymentMethod: notificationData.paymentMethod,
            });
            setLastNotificationId(notificationId);
          }
        }
      }
    }, (error) => {
      console.log("Payment notification listener error:", error);
    });

    return () => unsubscribe();
  }, [currentUser, showPaymentNotification, lastNotificationId]);

  return null;
};

function App() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState({});
  const [checkList, setChcekList] = useState([]);

  const comp = {
    home: Dashboard,
    addOrder: AddOrder,
    orders: OrderList,
    products: Product,
    logistic: Logistik,
    contact: Contact,
    settings: Settings,
    categories: Categories,
    report: ReportPage,
  };
  useEffect(() => {
    async function getUsers() {
      if (currentUser) {
        const docRef = doc(firestore, "users", currentUser?.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProfile({
            ...docSnap.data(),
          });
        } else {
          console.log("No such document!");
        }
      }
    }
    getUsers();
  }, [currentUser]);

  useEffect(() => {
    const fetchData = async () => {
      if (profile?.rules) {
        const docRef = doc(
          firestore,
          "settings",
          "rules",
          "menu",
          profile?.rules
        );
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setChcekList(docSnap.data()?.akses);
        } else {
          console.log("No such document!");
        }
      }
    };
    fetchData();
  }, [profile?.rules]);
  const akses = checkList?.map((role) => {
    if (role?.subMenu) {
      return {
        path: role?.path,
        name: role?.name,
        component: comp?.[role?.component],
        subMenu: role?.subMenu?.map((sub) => {
          return {
            path: sub?.path,
            name: sub?.name,
            component: comp?.[sub?.component],
          };
        }),
      };
    }
    return {
      path: role?.path,
      name: role?.name,
      component: comp?.[role?.component],
    };
  });

  return (
    <NotificationProvider>
      <NotificationListener />
      <Router>
        <Routes>
        {akses?.map((acc) => {
          return (
            <>
              <Route
                key={acc?.path}
                path={acc?.path}
                element={
                  <PrivateRoute>
                    <acc.component profile={profile} />
                  </PrivateRoute>
                }
              />
              {acc?.subMenu &&
                acc.subMenu?.map((sub) => {
                  return (
                    <Route
                      key={sub?.path}
                      path={sub?.path}
                      element={
                        <PrivateRoute>
                          <sub.component profile={profile} />
                        </PrivateRoute>
                      }
                    />
                  );
                })}
            </>
          );
        })}
        <Route path="/login" element={<Login />} />
        {!currentUser && <Route path="*" element={<Navigate to="/login" />} />}
        <Route path="/payment-redirect/:id" element={<PaymentRedirect />} />
      </Routes>
    </Router>
    </NotificationProvider>
  );
}

export default App;
