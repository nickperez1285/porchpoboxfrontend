// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAOdV3pij-DeLIUwd0CWzkMYn9u3u_57a4",
    authDomain: "porchpobox-2025.firebaseapp.com",
    projectId: "porchpobox-2025",
    storageBucket: "porchpobox-2025.firebasestorage.app",
    messagingSenderId: "748966877426",
    appId: "1:748966877426:web:2434968dceafbd684e586b",
    measurementId: "G-RF23DRG2SZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);