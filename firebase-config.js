import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBqxEwqQsZAV_ulO_Zxn1KuF4XDeY5LgT8",
  authDomain: "akare2---deney.firebaseapp.com",
  projectId: "akare2---deney",
  storageBucket: "akare2---deney.firebasestorage.app",
  messagingSenderId: "191891795838",
  appId: "1:191891795838:web:a416b2d434f398347e4d2f",
  measurementId: "G-EYNB1SXBXZ",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
// Storage'ı sildik.
