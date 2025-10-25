import type React from "react"
import { CartProvider } from "@/lib/cart-context"

export default function OrderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <CartProvider>{children}</CartProvider>
}
