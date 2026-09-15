import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBoWWnNJWxQIpT1XRlXqdmsGMXdBa0YCEY",
  authDomain: "lendtrack-a5eb5.firebaseapp.com",
  projectId: "lendtrack-a5eb5",
  storageBucket: "lendtrack-a5eb5.firebasestorage.app",
  messagingSenderId: "401687978347",
  appId: "1:401687978347:web:46c3c396df22c8088fac2e",
  measurementId: "G-Q0GFNTTTHP"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);