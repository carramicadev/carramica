// src/Login.js
import React, { useEffect, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, firestore } from "./FirebaseFrovider";
import 'bootstrap/dist/css/bootstrap.min.css';
import { redirect, useLocation, useNavigate } from "react-router-dom";
import logo from "./logo.svg"
import { useAuth } from "./AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
const Login = () => {
  const { currentUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const createUser = await signInWithEmailAndPassword(auth, email, password);
      // console.log(createUser)
      // await setDoc(doc(firestore, 'users', createUser?.user?.uid), {
      //   email: email,
      //   userId: createUser?.user?.uid
      // }, { merge: true })
      // navigate("/");
    } catch (err) {
      setError("Failed to sign in");
    }
  };

  // const [profile, setProfile] = useState({})
  console.log(process.env.REACT_APP_ENVIRONMENT)
  useEffect(() => {
    async function getUsers() {
      if (currentUser) {
        const docRef = doc(firestore, "users", currentUser?.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {

          // console.log(docSnap.data())
          if (docSnap.data().rules === 'admin') {
            navigate('/')
          } else if (docSnap.data().rules === 'shipping') {
            // console.log('run')
            navigate('/orders')
          } else if (docSnap.data().rules === 'sales') {
            navigate('/add-order')
          }
          // console.log("Document data:", docSnap.data());
        } else {
          // docSnap.data() will be undefined in this case
          console.log("No such document!");
        }

      }
    }
    getUsers()
  }, [currentUser]);
  // console.log(currentUser)
  useEffect(() => {
    if (currentUser?.uid) {
      navigate('/')
    }
  }, [currentUser?.uid])

  return (
    <div className="vh-100 d-flex align-items-center justify-content-center h-100">
      <div className="row w-100">

        <div className="vh-100 col-md-6 bg-light d-flex align-items-center justify-content-center">
          <div className="w-75">
            <h2 className="mb-4">Log in</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleLogin}>
              <div className="form-group mb-3">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                />
              </div>
              <div className="form-group mb-3">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }} className="form-check mb-3">
                <div>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="rememberMe"
                  />
                  <label className="form-check-label" htmlFor="rememberMe">
                    Remember me
                  </label>
                </div>
                <a href="#" className="float-right">Forgot password?</a>
              </div>
              <button type="submit" className="btn btn-dark w-100">Masuk</button>
            </form>
          </div>
        </div>
        <div style={{ backgroundColor: '#3D5E54' }} className="col-md-6 d-none d-md-block  text-white d-flex align-items-center justify-content-center">
          <div style={{ display: 'flex', justifyContent: 'center', height: '100vh' }}>
            <img src={logo} width={300} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
