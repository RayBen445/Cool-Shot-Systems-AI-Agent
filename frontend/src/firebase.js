import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyCmsDJQqlbFY1RUvDQWNqJPD5YMRPYYSNc",
    authDomain: "lautech-economic-class29.firebaseapp.com",
    databaseURL: "https://lautech-economic-class29-default-rtdb.firebaseio.com",
    projectId: "lautech-economic-class29",
    storageBucket: "lautech-economic-class29.firebasestorage.app",
    messagingSenderId: "521432549782",
    appId: "1:521432549782:web:57fbd0ea3e584b7bb2f5b7",
    measurementId: "G-SW8XP5QMHK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
