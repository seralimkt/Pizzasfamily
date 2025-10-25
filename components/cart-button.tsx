"use client"

import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { useRouter } from "next/navigation"

export function CartButton() {
  const { itemCount, total } = useCart()
  const router = useRouter()

  if (itemCount === 0) return null

  return (
    <Button
      size="lg"
      className="fixed bottom-6 right-6 z-50 h-16 gap-3 rounded-full bg-primary px-6 text-primary-foreground shadow-2xl hover:bg-primary/90"
      onClick={() => router.push("/order/cart")}
    >
      <ShoppingCart className="h-5 w-5" />
      <div className="flex flex-col items-start">
        <span className="text-xs font-medium">{itemCount} productos</span>
        <span className="text-sm font-bold">${total.toFixed(2)}</span>
      </div>
    </Button>
  )
}
