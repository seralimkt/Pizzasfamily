"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addProduct, updateProduct } from "@/lib/firebase/db"
import type { Product, Category, ProductVariation } from "@/lib/firebase/types"
import { Spinner } from "@/components/ui/spinner"
import { Plus, Trash2, X } from "lucide-react"
import Image from "next/image"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  categories: Category[]
  maxOrder: number
}

export function ProductDialog({ open, onOpenChange, product, categories, maxOrder }: ProductDialogProps) {
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")

  const [formData, setFormData] = useState({
    categoryId: "",
    name: "",
    description: "",
    price: 0,
    imageUrl: "",
    order: maxOrder + 1,
    active: true,
    variations: [] as ProductVariation[],
  })

  useEffect(() => {
    if (product) {
      setFormData({
        categoryId: product.categoryId,
        name: product.name,
        description: product.description,
        price: product.price,
        imageUrl: product.imageUrl || "",
        order: product.order,
        active: product.active,
        variations: product.variations || [],
      })
      setImagePreview(product.imageUrl || "")
    } else {
      setFormData({
        categoryId: categories[0]?.id || "",
        name: "",
        description: "",
        price: 0,
        imageUrl: "",
        order: maxOrder + 1,
        active: true,
        variations: [],
      })
      setImagePreview("")
    }
    setImageFile(null)
  }, [product, categories, maxOrder, open])

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 500 * 1024) {
      alert("La imagen es muy grande. Por favor usa una imagen menor a 500KB.")
      return
    }

    setImageFile(file)

    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result as string
      setImagePreview(base64String)
      setFormData({ ...formData, imageUrl: base64String })
    }
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview("")
    setFormData({ ...formData, imageUrl: "" })
  }

  const addVariation = () => {
    setFormData({
      ...formData,
      variations: [
        ...formData.variations,
        {
          id: Date.now().toString(),
          name: "",
          options: [],
          required: false,
          multiSelect: false,
        },
      ],
    })
  }

  const updateVariation = (index: number, updates: Partial<ProductVariation>) => {
    const newVariations = [...formData.variations]
    newVariations[index] = { ...newVariations[index], ...updates }
    setFormData({ ...formData, variations: newVariations })
  }

  const removeVariation = (index: number) => {
    setFormData({
      ...formData,
      variations: formData.variations.filter((_, i) => i !== index),
    })
  }

  const addOption = (variationIndex: number) => {
    const newVariations = [...formData.variations]
    newVariations[variationIndex].options.push({
      id: Date.now().toString(),
      name: "",
      price: 0,
    })
    setFormData({ ...formData, variations: newVariations })
  }

  const updateOption = (variationIndex: number, optionIndex: number, field: string, value: any) => {
    const newVariations = [...formData.variations]
    newVariations[variationIndex].options[optionIndex] = {
      ...newVariations[variationIndex].options[optionIndex],
      [field]: value,
    }
    setFormData({ ...formData, variations: newVariations })
  }

  const removeOption = (variationIndex: number, optionIndex: number) => {
    const newVariations = [...formData.variations]
    newVariations[variationIndex].options = newVariations[variationIndex].options.filter((_, i) => i !== optionIndex)
    setFormData({ ...formData, variations: newVariations })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const productData = {
        categoryId: formData.categoryId,
        name: formData.name,
        description: formData.description,
        price: formData.price,
        imageUrl: formData.imageUrl,
        order: formData.order,
        active: formData.active,
        variations: formData.variations,
      }

      if (product) {
        await updateProduct(product.id, productData)
      } else {
        await addProduct(productData)
      }
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error saving product:", error)
      alert(error.message || "Error al guardar el producto. Por favor intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Categoría *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Precio Base *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price || ""}
                onChange={(e) => {
                  const value = e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
                  setFormData({ ...formData, price: isNaN(value) ? 0 : value })
                }}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Orden</Label>
              <Input
                id="order"
                type="number"
                min="0"
                value={formData.order || ""}
                onChange={(e) => {
                  const value = e.target.value === "" ? 0 : Number.parseInt(e.target.value)
                  setFormData({ ...formData, order: isNaN(value) ? 0 : value })
                }}
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Imagen del Producto</Label>

            <div className="space-y-2">
              <Label htmlFor="imageFile" className="text-sm text-muted-foreground">
                Opción 1: Subir archivo de imagen
              </Label>
              <div className="flex gap-2">
                <Input
                  id="imageFile"
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  disabled={loading}
                  className="flex-1"
                />
                {imagePreview && (
                  <Button type="button" variant="outline" size="icon" onClick={clearImage} disabled={loading}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                La imagen se convertirá automáticamente y se guardará en la base de datos (máx. 500KB)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="text-sm text-muted-foreground">
                Opción 2: Pegar URL de imagen
              </Label>
              <Input
                id="imageUrl"
                type="url"
                value={imageFile ? "" : formData.imageUrl}
                onChange={(e) => {
                  setFormData({ ...formData, imageUrl: e.target.value })
                  setImagePreview(e.target.value)
                }}
                disabled={loading || !!imageFile}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
              <p className="text-xs text-muted-foreground">O pega la URL de una imagen ya alojada en línea</p>
            </div>

            {imagePreview && (
              <div className="relative h-48 w-full overflow-hidden rounded-lg bg-muted">
                <Image src={imagePreview || "/placeholder.svg"} alt="Preview" fill className="object-cover" />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base">Variaciones (Extras, Tamaños, etc.)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addVariation} disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Variación
              </Button>
            </div>

            {formData.variations.map((variation, vIndex) => (
              <Card key={variation.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <Input
                        placeholder="Nombre de la variación (ej: Tamaño, Extras)"
                        value={variation.name}
                        onChange={(e) => updateVariation(vIndex, { name: e.target.value })}
                        disabled={loading}
                      />
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 text-sm">
                          <Switch
                            checked={variation.required}
                            onCheckedChange={(checked) => updateVariation(vIndex, { required: checked })}
                            disabled={loading}
                          />
                          Obligatorio
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <Switch
                            checked={variation.multiSelect}
                            onCheckedChange={(checked) => updateVariation(vIndex, { multiSelect: checked })}
                            disabled={loading}
                          />
                          Selección múltiple
                        </label>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVariation(vIndex)}
                      disabled={loading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {variation.options.map((option, oIndex) => (
                    <div key={option.id} className="flex gap-2">
                      <Input
                        placeholder="Opción (ej: Grande, Queso extra)"
                        value={option.name}
                        onChange={(e) => updateOption(vIndex, oIndex, "name", e.target.value)}
                        disabled={loading}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="Precio"
                        min="0"
                        step="0.01"
                        value={option.price || ""}
                        onChange={(e) => {
                          const value = e.target.value === "" ? 0 : Number.parseFloat(e.target.value)
                          updateOption(vIndex, oIndex, "price", isNaN(value) ? 0 : value)
                        }}
                        disabled={loading}
                        className="w-28"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(vIndex, oIndex)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addOption(vIndex)}
                    disabled={loading}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Opción
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="active">Producto Activo</Label>
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Spinner className="mr-2 h-4 w-4" /> : null}
              {product ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
