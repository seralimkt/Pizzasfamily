"use client"

import { initializeApp, getApps } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"
import { getAnalytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyCRpF-mK3jrw-g0C4bgTBcMhJDAxV7aD5U",
  authDomain: "brasas-de-san-cristobal.firebaseapp.com",
  projectId: "brasas-de-san-cristobal",
  storageBucket: "brasas-de-san-cristobal.firebasestorage.app",
  messagingSenderId: "339177347991",
  appId: "1:339177347991:web:e63387b548c2a5e6a042d2",
  measurementId: "G-NXLYWPEQRW",
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
