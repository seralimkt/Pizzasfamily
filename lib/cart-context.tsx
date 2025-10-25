"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import type { CartItem, Product } from "./firebase/types"

interface CartContextType {
  items: CartItem[]
  addItem: (product: Product, quantity?: number, notes?: string, selectedVariations?: any[]) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  updateNotes: (productId: string, notes: string) => void
  clearCart: () => void
  total: number
  itemCount: number
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  updateNotes: () => {},
  clearCart: () => {},
  total: 0,
  itemCount: 0,
})

export const useCart = () => useContext(CartContext)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  useEffect(() => {
    const savedCart = localStorage.getItem("cart")
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (error) {
        console.error("Error loading cart:", error)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items))
  }, [items])

  const addItem = (product: Product, quantity = 1, notes = "", selectedVariations: any[] = []) => {
    setItems((prev) => {
      return [...prev, { product, quantity, notes, selectedVariations }]
    })
  }

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }
    setItems((prev) => prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item)))
  }

  const updateNotes = (productId: string, notes: string) => {
    setItems((prev) => prev.map((item) => (item.product.id === productId ? { ...item, notes } : item)))
  }

  const clearCart = () => {
    setItems([])
  }

  const total = items.reduce((sum, item) => {
    const basePrice = item.product.price * item.quantity
    const variationsPrice = (item.selectedVariations?.reduce((vSum, v) => vSum + v.price, 0) || 0) * item.quantity
    return sum + basePrice + variationsPrice
  }, 0)

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        updateNotes,
        clearCart,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}
