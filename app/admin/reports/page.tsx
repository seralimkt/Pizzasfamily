"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminNav } from "@/components/admin-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { subscribeToOrders } from "@/lib/firebase/db"
import type { Order } from "@/lib/firebase/types"
import { TrendingUp, DollarSign, ShoppingBag, Clock, Users } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

function ReportsContent() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | Order["status"]>("all")

  useEffect(() => {
    const unsubscribe = subscribeToOrders((newOrders) => {
      setOrders(newOrders)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  const filteredOrders = orders.filter((order) => {
    const orderDate = new Date(order.createdAt)
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    const matchesStartDate = !startDate || orderDate >= new Date(startDate)
    const matchesEndDate = !endDate || orderDate <= new Date(endDate + "T23:59:59")
    return matchesStatus && matchesStartDate && matchesEndDate
  })

  const totalOrders = filteredOrders.length
  const completedOrders = filteredOrders.filter((o) => o.status === "completed")
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0)
  const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0

  const today = new Date().toDateString()
  const todayOrders = filteredOrders.filter((o) => new Date(o.createdAt).toDateString() === today)
  const todayRevenue = todayOrders.filter((o) => o.status === "completed").reduce((sum, o) => sum + o.total, 0)

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekOrders = filteredOrders.filter((o) => new Date(o.createdAt) >= weekAgo)
  const weekRevenue = weekOrders.filter((o) => o.status === "completed").reduce((sum, o) => sum + o.total, 0)

  const monthAgo = new Date()
  monthAgo.setMonth(monthAgo.getMonth() - 1)
  const monthOrders = filteredOrders.filter((o) => new Date(o.createdAt) >= monthAgo)
  const monthRevenue = monthOrders.filter((o) => o.status === "completed").reduce((sum, o) => sum + o.total, 0)

  const ordersByStatus = {
    pending: filteredOrders.filter((o) => o.status === "pending").length,
    preparing: filteredOrders.filter((o) => o.status === "preparing").length,
    ready: filteredOrders.filter((o) => o.status === "ready").length,
    completed: filteredOrders.filter((o) => o.status === "completed").length,
    cancelled: filteredOrders.filter((o) => o.status === "cancelled").length,
  }

  const productCounts: Record<string, { name: string; count: number; revenue: number }> = {}
  completedOrders.forEach((order) => {
    order.items.forEach((item) => {
      if (!productCounts[item.productId]) {
        productCounts[item.productId] = { name: item.name, count: 0, revenue: 0 }
      }
      productCounts[item.productId].count += item.quantity
      productCounts[item.productId].revenue += item.price * item.quantity
    })
  })
  const topProducts = Object.values(productCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const clearFilters = () => {
    setStartDate("")
    setEndDate("")
    setStatusFilter("all")
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

  const customerMap = new Map<string, { birthday?: string }>()
  filteredOrders.forEach((order) => {
    if (!customerMap.has(order.customerPhone)) {
      customerMap.set(order.customerPhone, { birthday: order.customerBirthday })
    } else {
      const customer = customerMap.get(order.customerPhone)!
      if (order.customerBirthday && !customer.birthday) {
        customer.birthday = order.customerBirthday
      }
    }
  })

  const ageRanges = {
    "18-25": 0,
    "26-35": 0,
    "36-45": 0,
    "46-55": 0,
    "56+": 0,
    "Sin datos": 0,
  }

  Array.from(customerMap.values()).forEach((customer) => {
    const age = calculateAge(customer.birthday)
    if (age === null) {
      ageRanges["Sin datos"]++
    } else if (age >= 18 && age <= 25) {
      ageRanges["18-25"]++
    } else if (age >= 26 && age <= 35) {
      ageRanges["26-35"]++
    } else if (age >= 36 && age <= 45) {
      ageRanges["36-45"]++
    } else if (age >= 46 && age <= 55) {
      ageRanges["46-55"]++
    } else if (age >= 56) {
      ageRanges["56+"]++
    }
  })

  const totalCustomersWithData = customerMap.size

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha Inicio</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha Fin</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="preparing">En Preparación</SelectItem>
                  <SelectItem value="ready">Listo</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full bg-transparent">
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-2 text-2xl font-bold text-foreground">Resumen General</h2>
        <p className="text-sm text-muted-foreground">
          {startDate || endDate || statusFilter !== "all"
            ? "Estadísticas filtradas"
            : "Estadísticas de todos los tiempos"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">{completedOrders.length} completados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">De pedidos completados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averageOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Por pedido completado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Activos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredOrders.filter((o) => !["completed", "cancelled"].includes(o.status)).length}
            </div>
            <p className="text-xs text-muted-foreground">En proceso</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Hoy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Pedidos:</span>
              <span className="font-semibold">{todayOrders.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Ingresos:</span>
              <span className="font-semibold text-primary">${todayRevenue.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Última Semana</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Pedidos:</span>
              <span className="font-semibold">{weekOrders.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Ingresos:</span>
              <span className="font-semibold text-primary">${weekRevenue.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Último Mes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Pedidos:</span>
              <span className="font-semibold">{monthOrders.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Ingresos:</span>
              <span className="font-semibold text-primary">${monthRevenue.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pedidos por Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(ordersByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm capitalize text-muted-foreground">
                  {status === "pending"
                    ? "Pendiente"
                    : status === "preparing"
                      ? "En Preparación"
                      : status === "ready"
                        ? "Listo"
                        : status === "completed"
                          ? "Completado"
                          : "Cancelado"}
                  :
                </span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Productos Más Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          {topProducts.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">No hay datos disponibles</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium">{product.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{product.count} vendidos</div>
                    <div className="text-xs text-muted-foreground">${product.revenue.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle>Nuestro Público</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Total de clientes únicos: <span className="font-semibold text-foreground">{totalCustomersWithData}</span>
            </div>
            <div className="space-y-3">
              {Object.entries(ageRanges).map(([range, count]) => {
                const percentage =
                  totalCustomersWithData > 0 ? ((count / totalCustomersWithData) * 100).toFixed(1) : "0.0"
                return (
                  <div key={range} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{range} años</span>
                      <span className="text-muted-foreground">
                        {count} clientes ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-secondary/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminReportsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <AdminNav />
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Reportes</h1>
            <p className="text-muted-foreground">Análisis y estadísticas de ventas</p>
          </div>
          <ReportsContent />
        </div>
      </div>
    </ProtectedRoute>
  )
}
