import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics";

let firebaseConfig = {
  apiKey: "AIzaSyD2DV_h75TwPyuR2t-41mfPB1EagOTDoU8",
  authDomain: "charamica-8bb03.firebaseapp.com",
  projectId: "charamica-8bb03",
  storageBucket: "charamica-8bb03.firebasestorage.app",
  messagingSenderId: "1071156852912",
  appId: "1:1071156852912:web:7f6cb6a86cfa3fdb0ee375",
  measurementId: "G-4Q04T30L55"
};
console.log(process.env.REACT_APP_ENVIRONMENT === 'production')
if (process.env.REACT_APP_ENVIRONMENT === 'production') {
  firebaseConfig = {
    apiKey: "AIzaSyDmROB55jQKzWR9e6VUntO_E3eJ5PB4xTY",
    authDomain: "carramica-prod.firebaseapp.com",
    projectId: "carramica-prod",
    storageBucket: "carramica-prod.appspot.com",
    messagingSenderId: "276155974594",
    appId: "1:276155974594:web:28ac0d811ec22be3e28c5b",
    measurementId: "G-6NT1EELBP8"
  };
}
export default firebaseConfig;

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// const analytics = getAnalytics(app);

export { db };