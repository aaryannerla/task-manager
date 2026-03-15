import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCZw6xYk3WCDCHr9WR6ad5RvoHxWwXqEjo",
  authDomain: "task-manager-1e2cd.firebaseapp.com",
  projectId: "task-manager-1e2cd",
  storageBucket: "task-manager-1e2cd.firebasestorage.app",
  messagingSenderId: "875583467906",
  appId: "1:875583467906:web:6eca33440f0d4fa2a01f9b"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);