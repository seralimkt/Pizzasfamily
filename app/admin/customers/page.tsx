"use client"

import { useEffect, useState } from "react"
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import type { Order, Customer } from "@/lib/firebase/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Phone, ShoppingBag, DollarSign, Calendar, User, Cake } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminNav } from "@/components/admin-nav"

export default function CustomersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        completedAt: doc.data().completedAt?.toDate(),
      })) as Order[]

      setOrders(ordersData)

      // Aggregate orders by customer phone
      const customerMap = new Map<string, Customer>()

      ordersData.forEach((order) => {
        const phone = order.customerPhone
        if (!customerMap.has(phone)) {
          customerMap.set(phone, {
            phone,
            name: order.customerName,
            email: order.customerEmail, // Include email from order
            birthday: order.customerBirthday, // Include birthday from order
            totalOrders: 0,
            totalSpent: 0,
            lastOrderDate: order.createdAt,
            orders: [],
          })
        }

        const customer = customerMap.get(phone)!
        customer.totalOrders++
        customer.totalSpent += order.total
        customer.orders.push(order)

        if (order.createdAt > customer.lastOrderDate) {
          customer.lastOrderDate = order.createdAt
          customer.name = order.customerName
          if (order.customerEmail) customer.email = order.customerEmail
          if (order.customerBirthday) customer.birthday = order.customerBirthday
        }
      })

      const customersArray = Array.from(customerMap.values()).sort((a, b) => b.totalOrders - a.totalOrders)

      setCustomers(customersArray)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const filteredCustomers = customers.filter(
    (customer) => customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || customer.phone.includes(searchTerm),
  )

  const getStatusColor = (status: Order["status"]) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmed: "bg-blue-100 text-blue-800 border-blue-200",
      preparing: "bg-purple-100 text-purple-800 border-purple-200",
      ready: "bg-green-100 text-green-800 border-green-200",
      delivered: "bg-gray-100 text-gray-800 border-gray-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    }
    return colors[status]
  }

  const getStatusLabel = (status: Order["status"]) => {
    const labels = {
      pending: "Pendiente",
      confirmed: "Confirmado",
      preparing: "Preparando",
      ready: "Listo",
      delivered: "Entregado",
      cancelled: "Cancelado",
    }
    return labels[status]
  }

  const calculateAge = (birthday: string | undefined): number | null => {
    if (!birthday) return null
    const birthDate = new Date(birthday)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const getBirthdayCustomers = () => {
    const currentMonth = new Date().getMonth()
    return customers.filter((customer) => {
      if (!customer.birthday) return false
      const birthDate = new Date(customer.birthday)
      return birthDate.getMonth() === currentMonth
    })
  }

  const birthdayCustomers = getBirthdayCustomers()

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <AdminNav />
        <div className="container mx-auto p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Clientes
            </h1>
            <p className="text-muted-foreground mt-1">Gestiona y visualiza el historial de tus clientes</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Estadísticas Generales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <User className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Total Clientes</p>
                    <p className="text-2xl font-bold text-blue-900">{customers.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                  <ShoppingBag className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-green-600 font-medium">Total Pedidos</p>
                    <p className="text-2xl font-bold text-green-900">{orders.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <DollarSign className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Promedio por Cliente</p>
                    <p className="text-2xl font-bold text-purple-900">
                      $
                      {customers.length > 0
                        ? Math.round(customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.length)
                        : 0}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {birthdayCustomers.length > 0 && (
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Cake className="h-5 w-5 text-primary" />
                  <CardTitle>Cumpleañeros del Mes</CardTitle>
                </div>
                <CardDescription>Clientes que cumplen años este mes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {birthdayCustomers.map((customer) => {
                    const birthDate = customer.birthday ? new Date(customer.birthday) : null
                    const age = calculateAge(customer.birthday)
                    return (
                      <div
                        key={customer.phone}
                        className="flex items-center justify-between p-4 bg-background rounded-lg border border-primary/10"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-semibold">{customer.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                <span>{customer.phone}</span>
                              </div>
                              {customer.email && (
                                <div className="flex items-center gap-1">
                                  <span>📧</span>
                                  <span>{customer.email}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-primary">
                            {birthDate ? birthDate.toLocaleDateString("es-MX", { day: "numeric", month: "long" }) : ""}
                          </p>
                          {age !== null && <p className="text-xs text-muted-foreground">Cumple {age + 1} años</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lista de Clientes</CardTitle>
                  <CardDescription>Haz clic en un cliente para ver su historial completo</CardDescription>
                </div>
              </div>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Cargando clientes...</div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchTerm ? "No se encontraron clientes" : "No hay clientes registrados"}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.phone}
                      onClick={() => setSelectedCustomer(customer)}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{customer.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Phone className="h-3 w-3" />
                            <span>{customer.phone}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-semibold text-lg">{customer.totalOrders}</p>
                          <p className="text-muted-foreground">Pedidos</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-lg">${customer.totalSpent.toFixed(2)}</p>
                          <p className="text-muted-foreground">Total</p>
                        </div>
                        <div className="text-center min-w-[100px]">
                          <p className="text-xs text-muted-foreground">Último pedido</p>
                          <p className="text-xs font-medium">
                            {formatDistanceToNow(customer.lastOrderDate, { addSuffix: true, locale: es })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg">
                    {selectedCustomer?.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl">{selectedCustomer?.name}</h2>
                    <p className="text-sm text-muted-foreground font-normal">{selectedCustomer?.phone}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              {selectedCustomer && (
                <div className="space-y-6 mt-4">
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                          <ShoppingBag className="h-5 w-5 text-primary mx-auto" />
                          <p className="text-sm text-muted-foreground">Pedidos Totales</p>
                          <p className="text-xl font-bold truncate">{selectedCustomer.totalOrders}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                          <DollarSign className="h-5 w-5 text-green-600 mx-auto" />
                          <p className="text-sm text-muted-foreground">Gasto Total</p>
                          <p className="text-xl font-bold truncate">${selectedCustomer.totalSpent.toFixed(2)}</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                          <Calendar className="h-5 w-5 text-blue-600 mx-auto" />
                          <p className="text-sm text-muted-foreground">Promedio</p>
                          <p className="text-xl font-bold truncate">
                            ${(selectedCustomer.totalSpent / selectedCustomer.totalOrders).toFixed(0)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Información Adicional</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Correo Electrónico:</span>
                        <span className="text-sm font-medium">{selectedCustomer.email || "Sin datos"}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Fecha de Cumpleaños:</span>
                        <span className="text-sm font-medium">
                          {selectedCustomer.birthday
                            ? new Date(selectedCustomer.birthday).toLocaleDateString("es-MX", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })
                            : "Sin datos"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Edad:</span>
                        <span className="text-sm font-medium">
                          {calculateAge(selectedCustomer.birthday) !== null
                            ? `${calculateAge(selectedCustomer.birthday)} años`
                            : "Sin datos"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <div>
                    <h3 className="font-semibold mb-3">Historial de Pedidos</h3>
                    <div className="space-y-3">
                      {selectedCustomer.orders.map((order) => (
                        <Card key={order.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold">Pedido #{order.orderNumber}</p>
                                  <Badge className={getStatusColor(order.status)}>{getStatusLabel(order.status)}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {order.createdAt.toLocaleDateString("es-MX", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                              <p className="font-bold text-lg">${order.total.toFixed(2)}</p>
                            </div>
                            <div className="space-y-2">
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">
                                    {item.quantity}x {item.productName}
                                    {item.variations && item.variations.length > 0 && (
                                      <span className="text-xs ml-2">
                                        ({item.variations.map((v) => `${v.variationName}: ${v.optionName}`).join(", ")})
                                      </span>
                                    )}
                                  </span>
                                  <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </ProtectedRoute>
  )
}
