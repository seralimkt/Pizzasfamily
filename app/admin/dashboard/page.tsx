"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { subscribeToOrders, updateOrderStatus, subscribeToConfig } from "@/lib/firebase/db"
import type { Order, BrandConfig } from "@/lib/firebase/types"
import { formatCurrency } from "@/lib/utils"
import {
  Package,
  Clock,
  CheckCircle2,
  DollarSign,
  Phone,
  MapPin,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Printer,
  ZoomIn,
} from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminNav } from "@/components/admin-nav"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AdminNav />
      <DashboardContent />
    </ProtectedRoute>
  )
}

function DashboardContent() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | Order["status"] | "table">("pending")
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default")
  const previousOrderCountRef = useRef(0)
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  const [config, setConfig] = useState<BrandConfig | null>(null)

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      try {
        const permission = await Notification.requestPermission()
        setNotificationPermission(permission)
        if (permission === "granted") {
          new Notification("Notificaciones Activadas", {
            body: "Recibirás alertas de nuevos pedidos",
            icon: "/favicon.ico",
            tag: "permission-granted",
          })
        }
      } catch (error) {
        console.error("[v0] Error requesting notification permission:", error)
      }
    }
  }

  const showOrderNotification = (orderNumber: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        const notification = new Notification("Nuevo Pedido Recibido", {
          body: `Pedido #${orderNumber} - Revisa el dashboard`,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          tag: `order-${orderNumber}`,
          requireInteraction: true,
          silent: false,
        })

        playNotificationSound()

        notification.onclick = () => {
          window.focus()
          notification.close()
        }
      } catch (error) {
        console.error("[v0] Error showing notification:", error)
      }
    }
  }

  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = "sine"

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.error("[v0] Error playing notification sound:", error)
    }
  }

  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission)
      if (Notification.permission === "default") {
        setTimeout(() => {
          requestNotificationPermission()
        }, 2000)
      }
    }

    const unsubscribe = subscribeToOrders((newOrders) => {
      setOrders(newOrders)
      setLoading(false)

      if (previousOrderCountRef.current > 0 && newOrders.length > previousOrderCountRef.current) {
        const latestOrder = newOrders[0]
        if (latestOrder && latestOrder.status === "pending") {
          showOrderNotification(latestOrder.orderNumber)
        }
      }
      previousOrderCountRef.current = newOrders.length
    })

    const unsubscribeConfig = subscribeToConfig((newConfig) => {
      setConfig(newConfig)
    })

    return () => {
      unsubscribe()
      unsubscribeConfig()
    }
  }, [])

  const handleStatusChange = async (orderId: string, newStatus: Order["status"]) => {
    try {
      await updateOrderStatus(orderId, newStatus)
    } catch (error) {
      console.error("[v0] Error updating order status:", error)
    }
  }

  const filteredOrders =
    filter === "all"
      ? orders
      : filter === "table"
        ? orders.filter((order) => order.deliveryType === "table")
        : orders.filter((order) => order.status === filter)

  const stats = {
    active: orders.filter((o) => o.status === "pending" || o.status === "preparing").length,
    completedToday: orders.filter(
      (o) => o.status === "completed" && new Date(o.createdAt).toDateString() === new Date().toDateString(),
    ).length,
    revenueToday: orders
      .filter((o) => o.status === "completed" && new Date(o.createdAt).toDateString() === new Date().toDateString())
      .reduce((sum, o) => sum + o.total, 0),
    avgTicket:
      orders.filter((o) => o.status === "completed").length > 0
        ? orders.filter((o) => o.status === "completed").reduce((sum, o) => sum + o.total, 0) /
          orders.filter((o) => o.status === "completed").length
        : 0,
  }

  const statusColors: Record<Order["status"], string> = {
    pending: "#eab308",
    preparing: "#3b82f6",
    ready: "#22c55e",
    completed: "#6b7280",
    cancelled: "#ef4444",
  }

  const statusBadgeColors: Record<Order["status"], string> = {
    pending: "bg-yellow-500",
    preparing: "bg-blue-500",
    ready: "bg-green-500",
    completed: "bg-gray-500",
    cancelled: "bg-red-500",
  }

  const statusLabels: Record<Order["status"], string> = {
    pending: "Pendiente",
    preparing: "En Preparación",
    ready: "Listo",
    completed: "Completado",
    cancelled: "Cancelado",
  }

  const deliveryTypeLabels: Record<string, string> = {
    pickup: "Recoger en tienda",
    delivery: "Entrega a domicilio",
    table: "Para Mesa",
  }

  const toggleOrderDetails = (orderId: string) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  const generateOrderPDF = (order: Order) => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const businessName = config?.businessName || "Tlayudas La Vid"

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pedido #${order.orderNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              color: #f97316;
            }
            .order-info {
              margin-bottom: 20px;
            }
            .order-info p {
              margin: 5px 0;
            }
            .items {
              margin: 20px 0;
            }
            .item {
              padding: 10px;
              border-bottom: 1px solid #ddd;
            }
            .item-variations {
              margin-left: 20px;
              font-size: 0.9em;
              color: #666;
            }
            .total {
              text-align: right;
              font-size: 1.5em;
              font-weight: bold;
              margin-top: 20px;
              padding-top: 20px;
              border-top: 2px solid #333;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${businessName}</h1>
            <p>Pedido #${order.orderNumber}</p>
          </div>
          
          <div class="order-info">
            <p><strong>Cliente:</strong> ${order.customerName}</p>
            <p><strong>Teléfono:</strong> ${order.customerPhone}</p>
            <p><strong>Tipo de entrega:</strong> ${deliveryTypeLabels[order.deliveryType]}</p>
            ${order.deliveryType === "delivery" && order.deliveryAddress ? `<p><strong>Dirección:</strong> ${order.deliveryAddress}</p>` : ""}
            ${order.deliveryType === "table" && order.numberOfPeople ? `<p><strong>Personas:</strong> ${order.numberOfPeople}</p>` : ""}
            ${order.paymentMethod ? `<p><strong>Método de pago:</strong> ${order.paymentMethod === "cash" ? "Efectivo" : order.paymentMethod === "transfer" ? "Transferencia" : "Tarjeta"}</p>` : ""}
            <p><strong>Fecha:</strong> ${new Date(order.createdAt).toLocaleString("es-MX")}</p>
            <p><strong>Estado:</strong> ${statusLabels[order.status]}</p>
          </div>
          
          <div class="items">
            <h3>Productos:</h3>
            ${order.items
              .map(
                (item) => `
              <div class="item">
                <p><strong>${item.quantity}x ${item.productName}</strong></p>
                ${
                  item.selectedVariations && item.selectedVariations.length > 0
                    ? `
                  <div class="item-variations">
                    ${item.selectedVariations
                      .map(
                        (v) => `
                      <p>• ${v.variationName}: ${v.optionName}${v.price > 0 ? ` (+$${v.price.toFixed(2)})` : ""}</p>
                    `,
                      )
                      .join("")}
                  </div>
                `
                    : ""
                }
                ${item.notes ? `<p class="item-variations">📝 ${item.notes}</p>` : ""}
              </div>
            `,
              )
              .join("")}
          </div>
          
          ${
            order.notes
              ? `
            <div style="margin: 20px 0;">
              <h3>Notas del pedido:</h3>
              <p>${order.notes}</p>
            </div>
          `
              : ""
          }
          
          <div class="total">
            Total: ${formatCurrency(order.total)}
          </div>
          
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        {notificationPermission !== "granted" && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-900">Activa las notificaciones</p>
                  <p className="text-sm text-yellow-700">
                    Recibe alertas de nuevos pedidos incluso con la pestaña minimizada
                  </p>
                </div>
              </div>
              <Button
                onClick={requestNotificationPermission}
                variant="outline"
                className="border-yellow-600 text-yellow-700 hover:bg-yellow-100 bg-transparent"
              >
                Activar
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-900">Pedidos Activos</CardTitle>
              <Package className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">{stats.active}</div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">Completados Hoy</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{stats.completedToday}</div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-900">Ingresos Hoy</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{formatCurrency(stats.revenueToday)}</div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-900">Ticket Promedio</CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">{formatCurrency(stats.avgTicket)}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pedidos</CardTitle>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                variant={filter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("pending")}
              >
                Pendientes ({orders.filter((o) => o.status === "pending").length})
              </Button>
              <Button
                variant={filter === "preparing" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("preparing")}
              >
                En Preparación ({orders.filter((o) => o.status === "preparing").length})
              </Button>
              <Button variant={filter === "ready" ? "default" : "outline"} size="sm" onClick={() => setFilter("ready")}>
                Listos ({orders.filter((o) => o.status === "ready").length})
              </Button>
              <Button variant={filter === "table" ? "default" : "outline"} size="sm" onClick={() => setFilter("table")}>
                Para Mesa ({orders.filter((o) => o.deliveryType === "table").length})
              </Button>
              <Button
                variant={filter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("completed")}
              >
                Completados ({orders.filter((o) => o.status === "completed").length})
              </Button>
              <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
                Todos ({orders.length})
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hay pedidos</p>
              ) : (
                filteredOrders.map((order) => (
                  <Card key={order.id} className="border-l-4" style={{ borderLeftColor: statusColors[order.status] }}>
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-lg">#{order.orderNumber}</span>
                            <Badge className={statusBadgeColors[order.status]}>{statusLabels[order.status]}</Badge>
                            <Badge variant="outline">{deliveryTypeLabels[order.deliveryType]}</Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleOrderDetails(order.id)}
                            className="flex items-center gap-1"
                          >
                            {expandedOrders.has(order.id) ? (
                              <>
                                Ocultar <ChevronUp className="h-4 w-4" />
                              </>
                            ) : (
                              <>
                                Detalles <ChevronDown className="h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </div>

                        {expandedOrders.has(order.id) && (
                          <div className="space-y-2 flex-1">
                            <div className="space-y-1 text-sm">
                              <p className="font-medium">{order.customerName}</p>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{order.customerPhone}</span>
                              </div>
                              {order.deliveryType === "delivery" && order.deliveryAddress && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  <span>{order.deliveryAddress}</span>
                                </div>
                              )}
                              {order.deliveryType === "table" && order.numberOfPeople && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <span>👥 {order.numberOfPeople} personas</span>
                                </div>
                              )}
                              {order.paymentMethod && (
                                <div className="text-muted-foreground">
                                  💳{" "}
                                  {order.paymentMethod === "cash"
                                    ? "Efectivo"
                                    : order.paymentMethod === "transfer"
                                      ? "Transferencia"
                                      : "Tarjeta"}
                                  {order.paymentMethod === "cash" && order.cashAmount && (
                                    <span>
                                      {" "}
                                      - Paga con: ${order.cashAmount.toFixed(2)} (Cambio: $
                                      {(order.cashAmount - order.total).toFixed(2)})
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="space-y-1">
                              <p className="font-semibold text-sm">Productos:</p>
                              {order.items.map((item, idx) => (
                                <div key={idx} className="text-sm">
                                  <p>
                                    {item.quantity}x {item.productName}
                                  </p>
                                  {item.selectedVariations && item.selectedVariations.length > 0 && (
                                    <div className="ml-4 text-muted-foreground text-xs">
                                      {item.selectedVariations.map((v, vIdx) => (
                                        <div key={vIdx}>
                                          • {v.variationName}: {v.optionName}
                                          {v.price > 0 && ` (+$${v.price.toFixed(2)})`}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {item.notes && (
                                    <div className="ml-4 text-muted-foreground text-xs">📝 {item.notes}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                            {order.notes && (
                              <div className="text-sm">
                                <p className="font-semibold">Notas del pedido:</p>
                                <p className="text-muted-foreground">{order.notes}</p>
                              </div>
                            )}
                            {order.paymentProofUrl && (
                              <div className="space-y-2">
                                <p className="font-semibold text-sm">Comprobante de pago:</p>
                                <div className="relative inline-block">
                                  <img
                                    src={order.paymentProofUrl || "/placeholder.svg"}
                                    alt="Comprobante de pago"
                                    className="max-w-xs rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => setZoomedImage(order.paymentProofUrl || null)}
                                  />
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="absolute top-2 right-2"
                                    onClick={() => setZoomedImage(order.paymentProofUrl || null)}
                                  >
                                    <ZoomIn className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                            <p className="font-bold text-lg text-primary">{formatCurrency(order.total)}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.createdAt).toLocaleString("es-MX")}
                            </p>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {order.status === "pending" && (
                            <Button size="sm" onClick={() => handleStatusChange(order.id, "preparing")}>
                              Iniciar Preparación
                            </Button>
                          )}
                          {order.status === "preparing" && (
                            <Button size="sm" onClick={() => handleStatusChange(order.id, "ready")}>
                              Marcar Listo
                            </Button>
                          )}
                          {order.status === "ready" && (
                            <>
                              <Button size="sm" onClick={() => handleStatusChange(order.id, "completed")}>
                                Completar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => generateOrderPDF(order)}
                                className="flex items-center gap-1"
                              >
                                <Printer className="h-4 w-4" />
                                Imprimir
                              </Button>
                            </>
                          )}
                          {(order.status === "pending" || order.status === "preparing") && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleStatusChange(order.id, "cancelled")}
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Comprobante de Pago</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <img
              src={zoomedImage || "/placeholder.svg"}
              alt="Comprobante de pago"
              className="max-w-full max-h-[80vh] rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
