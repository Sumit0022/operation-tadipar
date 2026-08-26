import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDlDMZuXsnQnTgwQaiq7Vh8-V3CY78dIuM",
  authDomain: "planner-dd1d0.firebaseapp.com",
  projectId: "planner-dd1d0",
  storageBucket: "planner-dd1d0.firebasestorage.app",
  messagingSenderId: "496730178934",
  appId: "1:496730178934:web:aca50f84755e05321ae657"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
