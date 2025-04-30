import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCu4Ojmch6v8e3kX6kIPlu57hQD79DFhoE",
  authDomain: "collaborative-doc-editor-9cda1.firebaseapp.com",
  projectId: "collaborative-doc-editor-9cda1",
  storageBucket: "collaborative-doc-editor-9cda1.appspot.com",
  messagingSenderId: "105371608627",
  appId: "1:105371608627:web:15a06b4bdeeb5fae97a546",
  measurementId: "G-YDWNHHPN50"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };