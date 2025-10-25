"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { addBanner, updateBanner } from "@/lib/firebase/db"
import type { Banner } from "@/lib/firebase/types"
import { Spinner } from "@/components/ui/spinner"
import { X } from "lucide-react"
import Image from "next/image"

interface BannerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  banner?: Banner | null
  maxOrder: number
}

export function BannerDialog({ open, onOpenChange, banner, maxOrder }: BannerDialogProps) {
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")

  const [formData, setFormData] = useState({
    title: "",
    imageUrl: "",
    link: "",
    order: maxOrder + 1,
    active: true,
  })

  useEffect(() => {
    if (banner) {
      setFormData({
        title: banner.title,
        imageUrl: banner.imageUrl,
        link: banner.link || "",
        order: banner.order,
        active: banner.active,
      })
      setImagePreview(banner.imageUrl)
    } else {
      setFormData({
        title: "",
        imageUrl: "",
        link: "",
        order: maxOrder + 1,
        active: true,
      })
      setImagePreview("")
    }
    setImageFile(null)
  }, [banner, maxOrder, open])

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 800 * 1024) {
      alert("La imagen es muy grande. Por favor usa una imagen menor a 800KB.")
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.imageUrl) {
      alert("Por favor sube una imagen o ingresa una URL para el banner")
      return
    }

    setLoading(true)

    try {
      const bannerData = {
        title: formData.title,
        imageUrl: formData.imageUrl,
        link: formData.link,
        order: formData.order,
        active: formData.active,
      }

      if (banner) {
        await updateBanner(banner.id, bannerData)
      } else {
        await addBanner(bannerData)
      }
      onOpenChange(false)
    } catch (error) {
      console.error("Error saving banner:", error)
      alert("Error al guardar el banner. Por favor intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{banner ? "Editar Banner" : "Nuevo Banner"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              disabled={loading}
              placeholder="Nombre del banner"
            />
          </div>

          <div className="space-y-2">
            <Label>Imagen del Banner *</Label>

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
                La imagen se convertirá automáticamente (máx. 800KB). Recomendado: 1200x400px
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
                placeholder="https://ejemplo.com/banner.jpg"
              />
              <p className="text-xs text-muted-foreground">O pega la URL de una imagen ya alojada en línea</p>
            </div>

            {imagePreview && (
              <div className="relative h-40 w-full overflow-hidden rounded-lg bg-muted">
                <Image src={imagePreview || "/placeholder.svg"} alt="Preview" fill className="object-cover" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">Enlace (opcional)</Label>
            <Input
              id="link"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              disabled={loading}
              placeholder="URL o ruta interna"
            />
            <p className="text-xs text-muted-foreground">Deja vacío si el banner es solo informativo</p>
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

          <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="active">Banner Activo</Label>
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
              {banner ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
