"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import type { Product } from "@/lib/firebase/types"
import { useCart } from "@/lib/cart-context"
import { Plus, Minus } from "lucide-react"
import Image from "next/image"

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product
}

export function ProductDialog({ open, onOpenChange, product }: ProductDialogProps) {
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState("")
  const [selectedVariations, setSelectedVariations] = useState<Record<string, string[]>>({})

  const handleVariationChange = (variationId: string, optionId: string, multiSelect: boolean) => {
    setSelectedVariations((prev) => {
      if (multiSelect) {
        const current = prev[variationId] || []
        const updated = current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId]
        return { ...prev, [variationId]: updated }
      } else {
        return { ...prev, [variationId]: [optionId] }
      }
    })
  }

  const calculateTotal = () => {
    let total = product.price
    product.variations?.forEach((variation) => {
      const selected = selectedVariations[variation.id] || []
      selected.forEach((optionId) => {
        const option = variation.options.find((o) => o.id === optionId)
        if (option) total += option.price
      })
    })
    return total * quantity
  }

  const handleAddToCart = () => {
    const variationsForCart = product.variations
      ?.flatMap((variation) => {
        const selected = selectedVariations[variation.id] || []
        return selected.map((optionId) => {
          const option = variation.options.find((o) => o.id === optionId)
          return option
            ? {
                variationId: variation.id,
                variationName: variation.name,
                optionId: option.id,
                optionName: option.name,
                price: option.price,
              }
            : null
        })
      })
      .filter(Boolean) as any[]

    addItem(product, quantity, notes, variationsForCart)
    onOpenChange(false)
    setQuantity(1)
    setNotes("")
    setSelectedVariations({})
  }

  const canAddToCart = () => {
    return product.variations?.every((variation) => {
      if (!variation.required) return true
      const selected = selectedVariations[variation.id] || []
      return selected.length > 0
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{product.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {product.imageUrl && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
              <Image src={product.imageUrl || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
            </div>
          )}

          <div>
            <p className="text-muted-foreground">{product.description}</p>
            <p className="mt-2 text-2xl font-bold text-primary">${product.price.toFixed(2)}</p>
          </div>

          {product.variations && product.variations.length > 0 && (
            <div className="space-y-6">
              {product.variations.map((variation) => (
                <div key={variation.id} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-bold">{variation.name}</Label>
                    {variation.required && <span className="text-xs font-medium text-destructive">Obligatorio</span>}
                  </div>

                  {variation.multiSelect ? (
                    <div className="space-y-2">
                      {variation.options.map((option) => (
                        <div key={option.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={option.id}
                              checked={(selectedVariations[variation.id] || []).includes(option.id)}
                              onCheckedChange={() => handleVariationChange(variation.id, option.id, true)}
                            />
                            <label htmlFor={option.id} className="text-sm font-medium cursor-pointer">
                              {option.name}
                            </label>
                          </div>
                          {option.price > 0 && (
                            <span className="text-sm font-semibold">+${option.price.toFixed(2)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <RadioGroup
                      value={(selectedVariations[variation.id] || [])[0]}
                      onValueChange={(value) => handleVariationChange(variation.id, value, false)}
                    >
                      {variation.options.map((option) => (
                        <div key={option.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value={option.id} id={option.id} />
                            <label htmlFor={option.id} className="text-sm font-medium cursor-pointer">
                              {option.name}
                            </label>
                          </div>
                          {option.price > 0 && (
                            <span className="text-sm font-semibold">+${option.price.toFixed(2)}</span>
                          )}
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notas especiales (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Ej: Sin cebolla, extra salsa..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <Label className="text-base font-bold">Cantidad</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center text-lg font-bold">{quantity}</span>
              <Button variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total:</span>
            <span className="text-2xl text-primary">${calculateTotal().toFixed(2)}</span>
          </div>
          <Button
            className="w-full bg-primary text-primary-foreground"
            size="lg"
            onClick={handleAddToCart}
            disabled={!canAddToCart()}
          >
            Agregar al carrito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
