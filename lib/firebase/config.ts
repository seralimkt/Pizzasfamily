"use client"

import { initializeApp, getApps } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"
import { getAnalytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyDcCVPn8QbvMj6W6AlGfjHOHs9TnUVj1YA",
  authDomain: "pizzas-family.firebaseapp.com",
  projectId: "pizzas-family",
  storageBucket: "pizzas-family.firebasestorage.app",
  messagingSenderId: "607427601731",
  appId: "1:607427601731:web:80ff8bf75f118a2bb27bf6",
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0]

// Initialize services
const db = getFirestore(app)
const auth = getAuth(app)
const storage = getStorage(app)

// Initialize Analytics (only in browser)
let analytics
if (typeof window !== "undefined") {
  analytics = getAnalytics(app)
}

export { db, auth, storage, analytics }
