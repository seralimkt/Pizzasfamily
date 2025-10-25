"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/lib/cart-context"
import { createOrder } from "@/lib/firebase/db"
import { sendOrderToWhatsApp } from "@/lib/whatsapp"
import { getBrandConfig } from "@/lib/firebase/db"
import type { BrandConfig, Order } from "@/lib/firebase/types"
import { ArrowLeft, AlertCircle, CheckCircle2, Upload } from "lucide-react"
import { useRouter } from "next/navigation"
import { Spinner } from "@/components/ui/spinner"

export default function CheckoutPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { items, total, clearCart, itemCount } = useCart()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [brandConfig, setBrandConfig] = useState<BrandConfig | null>(null)
  const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null)
  const [paymentProofPreview, setPaymentProofPreview] = useState<string>("")

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "", // Added email field
    customerBirthday: "", // Added birthday field
    deliveryType: "pickup" as "pickup" | "delivery" | "table",
    deliveryAddress: "",
    numberOfPeople: "2",
    customPeople: "",
    paymentMethod: "cash" as "cash" | "transfer" | "card",
    cashAmount: "",
    notes: "",
  })

  useEffect(() => {
    if (itemCount === 0 && !success) {
      router.push("/order")
    }
  }, [itemCount, success, router])

  useEffect(() => {
    getBrandConfig().then(setBrandConfig)
  }, [])

  const handlePaymentProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          // Create canvas to resize image
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")

          // Max dimensions to keep file size under 500KB
          const maxWidth = 800
          const maxHeight = 800
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height
              height = maxHeight
            }
          }

          canvas.width = width
          canvas.height = height
          ctx?.drawImage(img, 0, 0, width, height)

          // Convert to Base64 with compression
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7)
          setPaymentProofPreview(compressedBase64)
          setPaymentProofFile(file)
        }
        img.src = event.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Validate form
      if (!formData.customerName.trim()) {
        throw new Error("Por favor ingresa tu nombre")
      }
      if (!formData.customerPhone.trim()) {
        throw new Error("Por favor ingresa tu teléfono")
      }
      if (
        brandConfig?.customerFields?.emailEnabled &&
        brandConfig?.customerFields?.emailRequired &&
        !formData.customerEmail.trim()
      ) {
        throw new Error("Por favor ingresa tu correo electrónico")
      }
      if (
        brandConfig?.customerFields?.birthdayEnabled &&
        brandConfig?.customerFields?.birthdayRequired &&
        !formData.customerBirthday
      ) {
        throw new Error("Por favor ingresa tu fecha de cumpleaños")
      }
      if (formData.deliveryType === "delivery" && !formData.deliveryAddress.trim()) {
        throw new Error("Por favor ingresa tu dirección de entrega")
      }
      if (formData.paymentMethod === "transfer" && !paymentProofPreview) {
        throw new Error("Por favor sube el comprobante de pago")
      }

      const deliveryFee = formData.deliveryType === "delivery" ? brandConfig?.deliveryFee || 0 : 0
      const orderTotal = total + deliveryFee

      // Generate order number
      const orderNumber = `ORD-${Date.now().toString().slice(-8)}`

      const numberOfPeople =
        formData.deliveryType === "table"
          ? formData.numberOfPeople === "more"
            ? Number.parseInt(formData.customPeople) || 1
            : Number.parseInt(formData.numberOfPeople)
          : undefined

      let paymentProofUrl: string | undefined
      if (formData.paymentMethod === "transfer" && paymentProofPreview) {
        console.log("[v0] Storing payment proof as Base64")
        paymentProofUrl = paymentProofPreview
        console.log("[v0] Payment proof stored, size:", paymentProofUrl.length, "bytes")
      }

      // Create order object
      const orderData: Omit<Order, "id" | "createdAt" | "updatedAt"> = {
        orderNumber,
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        ...(formData.customerEmail.trim() && { customerEmail: formData.customerEmail.trim() }),
        ...(formData.customerBirthday && { customerBirthday: formData.customerBirthday }),
        deliveryType: formData.deliveryType,
        ...(formData.deliveryType === "delivery" &&
          formData.deliveryAddress.trim() && {
            deliveryAddress: formData.deliveryAddress.trim(),
          }),
        ...(formData.deliveryType === "table" && numberOfPeople && { numberOfPeople }),
        paymentMethod: formData.paymentMethod,
        ...(formData.paymentMethod === "cash" &&
          formData.cashAmount && {
            cashAmount: Number.parseFloat(formData.cashAmount),
          }),
        ...(formData.paymentMethod === "transfer" &&
          paymentProofUrl && {
            paymentProofUrl,
          }),
        items: items.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          notes: item.notes,
          selectedVariations: item.selectedVariations,
        })),
        subtotal: total,
        deliveryFee,
        total: orderTotal,
        status: "pending",
        ...(formData.notes.trim() && { notes: formData.notes.trim() }),
      }

      // Save order to Firebase
      const orderId = await createOrder(orderData)
      console.log("[v0] Order created:", orderId)

      // Create complete order object for WhatsApp
      const completeOrder: Order = {
        ...orderData,
        id: orderId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Send to WhatsApp
      const whatsappNumber = brandConfig?.whatsappNumber || "573235111621"
      sendOrderToWhatsApp(completeOrder, whatsappNumber, brandConfig)

      // Clear cart and show success
      clearCart()
      setSuccess(true)

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push("/")
      }, 3000)
    } catch (err: any) {
      console.error("[v0] Checkout error:", err)
      setError(err.message || "Error al procesar el pedido. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <div className="rounded-full bg-primary/10 p-4">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Pedido Enviado</h2>
            <p className="text-balance text-center text-muted-foreground">
              Tu pedido ha sido enviado por WhatsApp. Te redirigiremos al inicio en unos segundos.
            </p>
            <Button
              onClick={() => router.push("/")}
              size="lg"
              className="mt-4 w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Ir al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const deliveryFee = formData.deliveryType === "delivery" ? brandConfig?.deliveryFee || 0 : 0
  const orderTotal = total + deliveryFee

  const enabledPaymentMethods = brandConfig?.paymentMethods || { cash: true, transfer: true, card: true }
  const enabledDeliveryTypes = brandConfig?.deliveryTypes || { pickup: true, delivery: true, table: true }

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/order/cart")} disabled={loading}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Confirmar Pedido</h1>
            <p className="text-sm text-muted-foreground">Completa tus datos</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Información de Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre completo *</Label>
                <Input
                  id="name"
                  placeholder="Juan Pérez"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="9241234567"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              {brandConfig?.customerFields?.emailEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico {brandConfig?.customerFields?.emailRequired && "*"}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    required={brandConfig?.customerFields?.emailRequired}
                    disabled={loading}
                  />
                </div>
              )}

              {brandConfig?.customerFields?.birthdayEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="birthday">
                    Fecha de Cumpleaños {brandConfig?.customerFields?.birthdayRequired && "*"}
                  </Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={formData.customerBirthday}
                    onChange={(e) => setFormData({ ...formData, customerBirthday: e.target.value })}
                    required={brandConfig?.customerFields?.birthdayRequired}
                    disabled={loading}
                    max={new Date().toISOString().split("T")[0]}
                  />
                  <p className="text-xs text-muted-foreground">
                    {brandConfig?.customerFields?.birthdayRequired
                      ? "Campo obligatorio"
                      : "Opcional - para enviarte sorpresas en tu cumpleaños"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tipo de Entrega</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={formData.deliveryType}
                onValueChange={(value: "pickup" | "delivery" | "table") =>
                  setFormData({ ...formData, deliveryType: value })
                }
                disabled={loading}
              >
                {enabledDeliveryTypes.pickup && (
                  <div className="flex items-center space-x-2 rounded-lg border p-4">
                    <RadioGroupItem value="pickup" id="pickup" />
                    <Label htmlFor="pickup" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Recoger en tienda</div>
                      <div className="text-sm text-muted-foreground">Sin costo adicional</div>
                    </Label>
                  </div>
                )}
                {enabledDeliveryTypes.delivery && (
                  <div className="flex items-center space-x-2 rounded-lg border p-4">
                    <RadioGroupItem value="delivery" id="delivery" />
                    <Label htmlFor="delivery" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Entrega a domicilio</div>
                      <div className="text-sm text-muted-foreground">Costo: ${deliveryFee.toFixed(2)}</div>
                    </Label>
                  </div>
                )}
                {enabledDeliveryTypes.table && (
                  <div className="flex items-center space-x-2 rounded-lg border p-4">
                    <RadioGroupItem value="table" id="table" />
                    <Label htmlFor="table" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Para Mesa</div>
                      <div className="text-sm text-muted-foreground">Consumir en el restaurante</div>
                    </Label>
                  </div>
                )}
              </RadioGroup>

              {formData.deliveryType === "delivery" && (
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección de entrega *</Label>
                  <Textarea
                    id="address"
                    placeholder="Calle, número, colonia, referencias..."
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                    required={formData.deliveryType === "delivery"}
                    disabled={loading}
                    className="min-h-[80px]"
                  />
                </div>
              )}

              {formData.deliveryType === "table" && (
                <div className="space-y-2">
                  <Label htmlFor="people">Número de personas *</Label>
                  <Select
                    value={formData.numberOfPeople}
                    onValueChange={(value) => setFormData({ ...formData, numberOfPeople: value })}
                    disabled={loading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona cantidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(10)].map((_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {i + 1} {i + 1 === 1 ? "persona" : "personas"}
                        </SelectItem>
                      ))}
                      <SelectItem value="more">Más de 10</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.numberOfPeople === "more" && (
                    <Input
                      type="number"
                      min="11"
                      placeholder="Ingresa el número"
                      value={formData.customPeople}
                      onChange={(e) => setFormData({ ...formData, customPeople: e.target.value })}
                      required
                      disabled={loading}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Método de Pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup
                value={formData.paymentMethod}
                onValueChange={(value: "cash" | "transfer" | "card") =>
                  setFormData({ ...formData, paymentMethod: value })
                }
                disabled={loading}
              >
                {enabledPaymentMethods.cash && (
                  <div className="flex items-center space-x-2 rounded-lg border p-4">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Efectivo</div>
                      <div className="text-sm text-muted-foreground">Pago en efectivo al recibir</div>
                    </Label>
                  </div>
                )}
                {enabledPaymentMethods.transfer && (
                  <div className="flex items-center space-x-2 rounded-lg border p-4">
                    <RadioGroupItem value="transfer" id="transfer" />
                    <Label htmlFor="transfer" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Transferencia</div>
                      <div className="text-sm text-muted-foreground">Transferencia bancaria</div>
                    </Label>
                  </div>
                )}
                {enabledPaymentMethods.card && (
                  <div className="flex items-center space-x-2 rounded-lg border p-4">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Pago con Tarjeta</div>
                      <div className="text-sm text-muted-foreground">Próximamente disponible</div>
                    </Label>
                  </div>
                )}
              </RadioGroup>

              {formData.paymentMethod === "cash" && (
                <div className="space-y-2">
                  <Label htmlFor="cashAmount">¿Con cuánto vas a pagar? (Opcional)</Label>
                  <Input
                    id="cashAmount"
                    type="number"
                    min={orderTotal}
                    step="0.01"
                    placeholder={`Mínimo $${orderTotal.toFixed(2)}`}
                    value={formData.cashAmount}
                    onChange={(e) => setFormData({ ...formData, cashAmount: e.target.value })}
                    disabled={loading}
                  />
                  {formData.cashAmount && Number.parseFloat(formData.cashAmount) > orderTotal && (
                    <p className="text-sm text-muted-foreground">
                      Cambio: ${(Number.parseFloat(formData.cashAmount) - orderTotal).toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              {formData.paymentMethod === "transfer" && brandConfig?.bankInfo && (
                <div className="space-y-3 rounded-lg bg-muted p-4">
                  <p className="font-semibold">Datos para transferencia:</p>
                  <div className="space-y-1 text-sm">
                    <p>
                      <span className="font-medium">Banco:</span> {brandConfig.bankInfo.bankName}
                    </p>
                    <p>
                      <span className="font-medium">Cuenta:</span> {brandConfig.bankInfo.accountNumber}
                    </p>
                    <p>
                      <span className="font-medium">Titular:</span> {brandConfig.bankInfo.accountHolder}
                    </p>
                    <p className="font-medium text-primary">Monto a transferir: ${orderTotal.toFixed(2)}</p>
                  </div>
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="paymentProof">Comprobante de pago *</Label>
                    <div className="flex flex-col gap-3">
                      {paymentProofPreview && (
                        <div className="relative h-32 w-32 overflow-hidden rounded-lg border">
                          <img
                            src={paymentProofPreview || "/placeholder.svg"}
                            alt="Comprobante"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <Input
                        id="paymentProof"
                        type="file"
                        accept="image/*"
                        onChange={handlePaymentProofChange}
                        disabled={loading}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("paymentProof")?.click()}
                        disabled={loading}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {paymentProofPreview ? "Cambiar comprobante" : "Subir comprobante"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {formData.paymentMethod === "card" && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>El pago con tarjeta estará disponible próximamente.</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notas Adicionales (Opcional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Instrucciones especiales, alergias, etc."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                disabled={loading}
                className="min-h-[80px]"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumen del Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.product.id} className="border-b pb-3 last:border-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium">
                      {item.product.name} x{item.quantity}
                    </span>
                    <span className="font-semibold">${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                  {item.selectedVariations && item.selectedVariations.length > 0 && (
                    <div className="text-sm text-muted-foreground ml-2">
                      {item.selectedVariations.map((variation, idx) => (
                        <div key={idx}>
                          • {variation.variationName}: {variation.optionName}
                          {variation.price > 0 && ` (+$${variation.price.toFixed(2)})`}
                        </div>
                      ))}
                    </div>
                  )}
                  {item.notes && (
                    <div className="text-sm text-muted-foreground ml-2 mt-1">
                      <span className="font-medium">Nota:</span> {item.notes}
                    </div>
                  )}
                </div>
              ))}
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${total.toFixed(2)}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Envío</span>
                    <span className="font-medium">${deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">${orderTotal.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            size="lg"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={loading || (formData.paymentMethod === "card" && enabledPaymentMethods.card)}
            onClick={(e) => {
              if (formData.paymentMethod === "card") {
                e.preventDefault()
                toast({
                  title: "Próximamente",
                  description: "El pago con tarjeta estará disponible pronto.",
                })
              }
            }}
          >
            {loading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Procesando...
              </>
            ) : (
              "Enviar Pedido por WhatsApp"
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
