"use client"

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  type QueryConstraint,
} from "firebase/firestore"
import { db } from "./config"
import type { Category, Product, Order, BrandConfig, Banner } from "./types"

// Categories
export const categoriesCollection = () => collection(db, "categories")

export const getCategories = async (): Promise<Category[]> => {
  const q = query(categoriesCollection(), orderBy("order", "asc"))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as Category[]
}

export const subscribeToCategories = (callback: (categories: Category[]) => void) => {
  const q = query(categoriesCollection(), orderBy("order", "asc"))
  return onSnapshot(q, (snapshot) => {
    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Category[]
    callback(categories)
  })
}

export const addCategory = async (data: Omit<Category, "id" | "createdAt" | "updatedAt">): Promise<string> => {
  const docRef = await addDoc(categoriesCollection(), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  return docRef.id
}

export const updateCategory = async (categoryId: string, data: Partial<Category>): Promise<void> => {
  const docRef = doc(db, "categories", categoryId)
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  })
}

export const deleteCategory = async (categoryId: string): Promise<void> => {
  const docRef = doc(db, "categories", categoryId)
  await deleteDoc(docRef)
}

// Products
export const productsCollection = () => collection(db, "products")

export const getProducts = async (categoryId?: string): Promise<Product[]> => {
  const constraints: QueryConstraint[] = [orderBy("order", "asc")]
  if (categoryId) {
    constraints.unshift(where("categoryId", "==", categoryId))
  }
  const q = query(productsCollection(), ...constraints)
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as Product[]
}

export const subscribeToProducts = (callback: (products: Product[]) => void, categoryId?: string) => {
  const constraints: QueryConstraint[] = [orderBy("order", "asc")]
  if (categoryId) {
    constraints.unshift(where("categoryId", "==", categoryId))
  }
  const q = query(productsCollection(), ...constraints)
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Product[]
    callback(products)
  })
}

export const addProduct = async (data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<string> => {
  const docRef = await addDoc(productsCollection(), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  return docRef.id
}

export const updateProduct = async (productId: string, data: Partial<Product>): Promise<void> => {
  const docRef = doc(db, "products", productId)
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  })
}

export const deleteProduct = async (productId: string): Promise<void> => {
  const docRef = doc(db, "products", productId)
  await deleteDoc(docRef)
}

// Orders
export const ordersCollection = () => collection(db, "orders")

export const createOrder = async (orderData: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<string> => {
  const docRef = await addDoc(ordersCollection(), {
    ...orderData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  return docRef.id
}

export const updateOrder = async (orderId: string, data: Partial<Order>): Promise<void> => {
  const docRef = doc(db, "orders", orderId)
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  })
}

export const updateOrderStatus = async (orderId: string, status: Order["status"]): Promise<void> => {
  const docRef = doc(db, "orders", orderId)
  await updateDoc(docRef, {
    status,
    updatedAt: Timestamp.now(),
    ...(status === "completed" ? { completedAt: Timestamp.now() } : {}),
  })
}

export const subscribeToOrders = (callback: (orders: Order[]) => void) => {
  const q = query(ordersCollection(), orderBy("createdAt", "desc"))
  return onSnapshot(q, (snapshot) => {
    const orders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      completedAt: doc.data().completedAt?.toDate(),
    })) as Order[]
    callback(orders)
  })
}

// Brand Configuration
export const getBrandConfig = async (): Promise<BrandConfig | null> => {
  const docRef = doc(db, "config", "brand")
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
      updatedAt: docSnap.data().updatedAt?.toDate(),
    } as BrandConfig
  }
  return null
}

export const updateBrandConfig = async (data: Partial<BrandConfig>): Promise<void> => {
  const docRef = doc(db, "config", "brand")
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  })
}

export const subscribeToConfig = (callback: (config: BrandConfig | null) => void) => {
  const docRef = doc(db, "config", "brand")
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({
        id: snapshot.id,
        ...snapshot.data(),
        updatedAt: snapshot.data().updatedAt?.toDate(),
      } as BrandConfig)
    } else {
      callback(null)
    }
  })
}

// Banners
export const bannersCollection = () => collection(db, "banners")

export const getBanners = async (): Promise<Banner[]> => {
  const q = query(bannersCollection(), orderBy("order", "asc"))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as Banner[]
}

export const subscribeToBanners = (callback: (banners: Banner[]) => void) => {
  const q = query(bannersCollection(), orderBy("order", "asc"))
  return onSnapshot(q, (snapshot) => {
    const banners = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    })) as Banner[]
    callback(banners)
  })
}

export const addBanner = async (data: Omit<Banner, "id" | "createdAt" | "updatedAt">): Promise<string> => {
  const docRef = await addDoc(bannersCollection(), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
  return docRef.id
}

export const updateBanner = async (bannerId: string, data: Partial<Banner>): Promise<void> => {
  const docRef = doc(db, "banners", bannerId)
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  })
}

export const deleteBanner = async (bannerId: string): Promise<void> => {
  const docRef = doc(db, "banners", bannerId)
  await deleteDoc(docRef)
}
