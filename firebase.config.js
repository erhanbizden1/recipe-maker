// Import the functions you need from the SDKs you need
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBpqraKX7ogmEeaiaANC0aBzkv-GBHtOKM",
  authDomain: "recipe-de9f4.firebaseapp.com",
  projectId: "recipe-de9f4",
  storageBucket: "recipe-de9f4.firebasestorage.app",
  messagingSenderId: "610595075973",
  appId: "1:610595075973:web:db676a758a84653b92b6ec",
  measurementId: "G-8DNZR74KMP",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
