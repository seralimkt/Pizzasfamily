"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminNav } from "@/components/admin-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getBrandConfig, updateBrandConfig } from "@/lib/firebase/db"
import { Spinner } from "@/components/ui/spinner"
import { CheckCircle2, AlertCircle, X, Plus, Trash2, GripVertical } from "lucide-react"
import Image from "next/image"
import type { DeliveryZone } from "@/lib/firebase/types"

function SettingsContent() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>("")

  const [formData, setFormData] = useState({
    businessName: "Serali Food",
    whatsappNumber: "573117411194",
    primaryColor: "#F4C542",
    secondaryColor: "#E67E22",
    accentColor: "#C0392B",
    paymentCash: true,
    paymentTransfer: true,
    paymentCard: true,
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    deliveryPickup: true,
    deliveryHome: true,
    deliveryTable: true,
    logoUrl: "",
    emailEnabled: false,
    emailRequired: false,
    birthdayEnabled: false,
    birthdayRequired: false,
    deliveryZones: [] as DeliveryZone[], // Added delivery zones
  })

  useEffect(() => {
    getBrandConfig().then((config) => {
      if (config) {
        setFormData({
          businessName: config.businessName,
          whatsappNumber: config.whatsappNumber,
          primaryColor: config.primaryColor,
          secondaryColor: config.secondaryColor,
          accentColor: config.accentColor,
          logoUrl: config.logoUrl || "",
          paymentCash: config.paymentMethods?.cash ?? true,
          paymentTransfer: config.paymentMethods?.transfer ?? true,
          paymentCard: config.paymentMethods?.card ?? true,
          bankName: config.bankInfo?.bankName || "",
          accountNumber: config.bankInfo?.accountNumber || "",
          accountHolder: config.bankInfo?.accountHolder || "",
          deliveryPickup: config.deliveryTypes?.pickup ?? true,
          deliveryHome: config.deliveryTypes?.delivery ?? true,
          deliveryTable: config.deliveryTypes?.table ?? true,
          emailEnabled: config.customerFields?.emailEnabled ?? false,
          emailRequired: config.customerFields?.emailRequired ?? false,
          birthdayEnabled: config.customerFields?.birthdayEnabled ?? false,
          birthdayRequired: config.customerFields?.birthdayRequired ?? false,
          deliveryZones: config.deliveryZones || [], // Load zones from config
        })
        setLogoPreview(config.logoUrl || "")
      }
      setLoading(false)
    })
  }, [])

  const addDeliveryZone = () => {
    const newZone: DeliveryZone = {
      id: `zone-${Date.now()}`,
      name: "",
      price: 0,
      active: true,
      order: formData.deliveryZones.length,
    }
    setFormData({ ...formData, deliveryZones: [...formData.deliveryZones, newZone] })
  }

  const updateDeliveryZone = (id: string, updates: Partial<DeliveryZone>) => {
    setFormData({
      ...formData,
      deliveryZones: formData.deliveryZones.map((zone) => (zone.id === id ? { ...zone, ...updates } : zone)),
    })
  }

  const removeDeliveryZone = (id: string) => {
    setFormData({
      ...formData,
      deliveryZones: formData.deliveryZones.filter((zone) => zone.id !== id),
    })
  }

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 500 * 1024) {
      setError("La imagen es muy grande. Por favor usa una imagen menor a 500KB.")
      return
    }

    setLogoFile(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setLogoPreview(base64String)
      setFormData({ ...formData, logoUrl: base64String })
    }
    reader.readAsDataURL(file)
  }

  const clearLogo = () => {
    setLogoFile(null)
    setLogoPreview("")
    setFormData({ ...formData, logoUrl: "" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setSaving(true)

    try {
      if (formData.deliveryHome) {
        const activeZones = formData.deliveryZones.filter((z) => z.active)
        if (activeZones.length === 0) {
          throw new Error("Debes tener al menos una zona de entrega activa si el servicio a domicilio está habilitado")
        }
        for (const zone of activeZones) {
          if (!zone.name.trim()) {
            throw new Error("Todas las zonas activas deben tener un nombre")
          }
          if (zone.price < 0) {
            throw new Error("El precio de las zonas no puede ser negativo")
          }
        }
      }

      await updateBrandConfig({
        businessName: formData.businessName,
        whatsappNumber: formData.whatsappNumber,
        deliveryFee: 0, // Set to 0 as it's now deprecated
        deliveryZones: formData.deliveryZones, // Save delivery zones
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        accentColor: formData.accentColor,
        logoUrl: formData.logoUrl,
        paymentMethods: {
          cash: formData.paymentCash,
          transfer: formData.paymentTransfer,
          card: formData.paymentCard,
        },
        bankInfo: {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountHolder: formData.accountHolder,
        },
        deliveryTypes: {
          pickup: formData.deliveryPickup,
          delivery: formData.deliveryHome,
          table: formData.deliveryTable,
        },
        customerFields: {
          emailEnabled: formData.emailEnabled,
          emailRequired: formData.emailRequired,
          birthdayEnabled: formData.birthdayEnabled,
          birthdayRequired: formData.birthdayRequired,
        },
      })

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error("Error saving config:", err)
      setError(err.message || "Error al guardar la configuración. Intenta nuevamente.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {success && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">Configuración guardada exitosamente</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Información del Negocio</CardTitle>
          <CardDescription>Configura los datos básicos de tu negocio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Nombre del Negocio</Label>
            <Input
              id="businessName"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              required
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp">Número de WhatsApp</Label>
            <Input
              id="whatsapp"
              type="tel"
              placeholder="573117411194"
              value={formData.whatsappNumber}
              onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
              required
              disabled={saving}
            />
            <p className="text-xs text-muted-foreground">Formato: código de país + número (sin espacios ni guiones)</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tipos de Entrega</CardTitle>
          <CardDescription>Activa o desactiva los tipos de entrega disponibles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="deliveryPickup">Recoger en tienda</Label>
              <p className="text-sm text-muted-foreground">Permitir que los clientes recojan en tienda</p>
            </div>
            <Switch
              id="deliveryPickup"
              checked={formData.deliveryPickup}
              onCheckedChange={(checked) => setFormData({ ...formData, deliveryPickup: checked })}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="deliveryHome">Entrega a domicilio</Label>
              <p className="text-sm text-muted-foreground">Permitir entregas a domicilio</p>
            </div>
            <Switch
              id="deliveryHome"
              checked={formData.deliveryHome}
              onCheckedChange={(checked) => setFormData({ ...formData, deliveryHome: checked })}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="deliveryTable">Para Mesa</Label>
              <p className="text-sm text-muted-foreground">Permitir pedidos para consumir en mesa</p>
            </div>
            <Switch
              id="deliveryTable"
              checked={formData.deliveryTable}
              onCheckedChange={(checked) => setFormData({ ...formData, deliveryTable: checked })}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {formData.deliveryHome && (
        <Card>
          <CardHeader>
            <CardTitle>Zonas de Entrega</CardTitle>
            <CardDescription>
              Configura las zonas de entrega y sus precios. Los clientes deberán seleccionar su zona al hacer el pedido.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.deliveryZones.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="mb-4 text-sm text-muted-foreground">No hay zonas de entrega configuradas</p>
                <Button type="button" onClick={addDeliveryZone} size="sm" disabled={saving}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Primera Zona
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.deliveryZones.map((zone, index) => (
                  <div key={zone.id} className="flex items-start gap-3 rounded-lg border p-4">
                    <div className="flex items-center justify-center pt-2">
                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor={`zone-name-${zone.id}`}>Nombre de la Zona</Label>
                          <Input
                            id={`zone-name-${zone.id}`}
                            placeholder="Ej: Zona Centro, Zona Norte"
                            value={zone.name}
                            onChange={(e) => updateDeliveryZone(zone.id, { name: e.target.value })}
                            disabled={saving}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`zone-price-${zone.id}`}>Precio de Envío</Label>
                          <Input
                            id={`zone-price-${zone.id}`}
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={zone.price || ""}
                            onChange={(e) =>
                              updateDeliveryZone(zone.id, {
                                price: e.target.value === "" ? 0 : Number.parseFloat(e.target.value),
                              })
                            }
                            disabled={saving}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`zone-active-${zone.id}`}
                          checked={zone.active}
                          onCheckedChange={(checked) => updateDeliveryZone(zone.id, { active: checked })}
                          disabled={saving}
                        />
                        <Label htmlFor={`zone-active-${zone.id}`} className="text-sm">
                          Zona activa
                        </Label>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDeliveryZone(zone.id)}
                      disabled={saving}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" onClick={addDeliveryZone} size="sm" variant="outline" disabled={saving}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Otra Zona
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Métodos de Pago</CardTitle>
          <CardDescription>Activa o desactiva los métodos de pago disponibles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="paymentCash">Efectivo</Label>
              <p className="text-sm text-muted-foreground">Aceptar pagos en efectivo</p>
            </div>
            <Switch
              id="paymentCash"
              checked={formData.paymentCash}
              onCheckedChange={(checked) => setFormData({ ...formData, paymentCash: checked })}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="paymentTransfer">Transferencia</Label>
              <p className="text-sm text-muted-foreground">Aceptar transferencias bancarias</p>
            </div>
            <Switch
              id="paymentTransfer"
              checked={formData.paymentTransfer}
              onCheckedChange={(checked) => setFormData({ ...formData, paymentTransfer: checked })}
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="paymentCard">Pago con Tarjeta</Label>
              <p className="text-sm text-muted-foreground">Aceptar pagos con tarjeta (próximamente)</p>
            </div>
            <Switch
              id="paymentCard"
              checked={formData.paymentCard}
              onCheckedChange={(checked) => setFormData({ ...formData, paymentCard: checked })}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      {formData.paymentTransfer && (
        <Card>
          <CardHeader>
            <CardTitle>Información Bancaria</CardTitle>
            <CardDescription>Datos para recibir transferencias</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Nombre del Banco</Label>
              <Input
                id="bankName"
                placeholder="Ej: BBVA, Santander, Banorte"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Número de Cuenta</Label>
              <Input
                id="accountNumber"
                placeholder="0123456789"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountHolder">Titular de la Cuenta</Label>
              <Input
                id="accountHolder"
                placeholder="Nombre completo del titular"
                value={formData.accountHolder}
                onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                disabled={saving}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Identidad Visual</CardTitle>
          <CardDescription>Personaliza los colores y logo de tu marca</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Logo</Label>

            <div className="space-y-2">
              <Label htmlFor="logoFile" className="text-sm text-muted-foreground">
                Opción 1: Subir archivo de imagen
              </Label>
              <div className="flex gap-2">
                <Input
                  id="logoFile"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  disabled={saving}
                  className="flex-1"
                />
                {logoPreview && (
                  <Button type="button" variant="outline" size="icon" onClick={clearLogo} disabled={saving}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                La imagen se convertirá automáticamente y se guardará en la base de datos (máx. 500KB)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl" className="text-sm text-muted-foreground">
                Opción 2: Pegar URL de imagen
              </Label>
              <Input
                id="logoUrl"
                type="url"
                value={logoFile ? "" : formData.logoUrl}
                onChange={(e) => {
                  setFormData({ ...formData, logoUrl: e.target.value })
                  setLogoPreview(e.target.value)
                }}
                disabled={saving || !!logoFile}
                placeholder="https://ejemplo.com/logo.jpg"
              />
              <p className="text-xs text-muted-foreground">O pega la URL de una imagen ya alojada en línea</p>
            </div>

            {logoPreview && (
              <div className="relative h-32 w-32 overflow-hidden rounded-lg border bg-muted">
                <Image src={logoPreview || "/placeholder.svg"} alt="Logo" fill className="object-contain p-2" />
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="primaryColor">Color Primario</Label>
              <div className="flex gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  disabled={saving}
                  className="h-10 w-20"
                />
                <Input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  disabled={saving}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondaryColor">Color Secundario</Label>
              <div className="flex gap-2">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  disabled={saving}
                  className="h-10 w-20"
                />
                <Input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  disabled={saving}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accentColor">Color de Acento</Label>
              <div className="flex gap-2">
                <Input
                  id="accentColor"
                  type="color"
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  disabled={saving}
                  className="h-10 w-20"
                />
                <Input
                  type="text"
                  value={formData.accentColor}
                  onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                  disabled={saving}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campos de Cliente</CardTitle>
          <CardDescription>Configura qué información adicional solicitar a los clientes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="emailEnabled">Solicitar Correo Electrónico</Label>
                <p className="text-sm text-muted-foreground">Pedir email al cliente en el checkout</p>
              </div>
              <Switch
                id="emailEnabled"
                checked={formData.emailEnabled}
                onCheckedChange={(checked) => {
                  setFormData({
                    ...formData,
                    emailEnabled: checked,
                    emailRequired: checked ? formData.emailRequired : false,
                  })
                }}
                disabled={saving}
              />
            </div>

            {formData.emailEnabled && (
              <div className="flex items-center justify-between ml-6 pl-4 border-l-2">
                <div className="space-y-0.5">
                  <Label htmlFor="emailRequired">Email Obligatorio</Label>
                  <p className="text-sm text-muted-foreground">Hacer el email un campo requerido</p>
                </div>
                <Switch
                  id="emailRequired"
                  checked={formData.emailRequired}
                  onCheckedChange={(checked) => setFormData({ ...formData, emailRequired: checked })}
                  disabled={saving}
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="birthdayEnabled">Solicitar Fecha de Cumpleaños</Label>
                <p className="text-sm text-muted-foreground">Pedir fecha de cumpleaños al cliente</p>
              </div>
              <Switch
                id="birthdayEnabled"
                checked={formData.birthdayEnabled}
                onCheckedChange={(checked) => {
                  setFormData({
                    ...formData,
                    birthdayEnabled: checked,
                    birthdayRequired: checked ? formData.birthdayRequired : false,
                  })
                }}
                disabled={saving}
              />
            </div>

            {formData.birthdayEnabled && (
              <div className="flex items-center justify-between ml-6 pl-4 border-l-2">
                <div className="space-y-0.5">
                  <Label htmlFor="birthdayRequired">Cumpleaños Obligatorio</Label>
                  <p className="text-sm text-muted-foreground">Hacer el cumpleaños un campo requerido</p>
                </div>
                <Switch
                  id="birthdayRequired"
                  checked={formData.birthdayRequired}
                  onCheckedChange={(checked) => setFormData({ ...formData, birthdayRequired: checked })}
                  disabled={saving}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? (
            <>
              <Spinner className="mr-2 h-4 w-4" />
              Guardando...
            </>
          ) : (
            "Guardar Configuración"
          )}
        </Button>
      </div>
    </form>
  )
}

export default function AdminSettingsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <AdminNav />
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
            <p className="text-muted-foreground">Personaliza tu negocio y marca</p>
          </div>
          <SettingsContent />
        </div>
      </div>
    </ProtectedRoute>
  )
}
