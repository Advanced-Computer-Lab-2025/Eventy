// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // we’ll use this for login/signup


const firebaseConfig = {
  apiKey: "AIzaSyAh4y6ZPfUUboWFlDSZVnHN8Y9v6XFU-sk",
  authDomain: "eventy-febcc.firebaseapp.com",
  projectId: "eventy-febcc",
  storageBucket: "eventy-febcc.firebasestorage.app",
  messagingSenderId: "448849288425",
  appId: "1:448849288425:web:3a085c60453cd664cbe478",
  measurementId: "G-7N2WK94221",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
