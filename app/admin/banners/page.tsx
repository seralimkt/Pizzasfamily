"use client"

import { useState, useEffect } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminNav } from "@/components/admin-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { subscribeToBanners, deleteBanner } from "@/lib/firebase/db"
import type { Banner } from "@/lib/firebase/types"
import { BannerDialog } from "@/components/banner-dialog"
import { Spinner } from "@/components/ui/spinner"
import { Plus, Pencil, Trash2, ImageIcon } from "lucide-react"
import Image from "next/image"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"

function BannersContent() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeToBanners((data) => {
      setBanners(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const handleEdit = (banner: Banner) => {
    setSelectedBanner(banner)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setSelectedBanner(null)
    setDialogOpen(true)
  }

  const handleDeleteClick = (banner: Banner) => {
    setBannerToDelete(banner)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (bannerToDelete) {
      await deleteBanner(bannerToDelete.id)
      setDeleteDialogOpen(false)
      setBannerToDelete(null)
    }
  }

  const maxOrder = banners.length > 0 ? Math.max(...banners.map((b) => b.order)) : 0

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Banners</h1>
          <p className="text-muted-foreground">Gestiona los banners promocionales de la app</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Banner
        </Button>
      </div>

      {banners.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No hay banners</h3>
            <p className="mb-4 text-sm text-muted-foreground">Crea tu primer banner promocional</p>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Banner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {banners.map((banner) => (
            <Card key={banner.id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="relative h-24 w-40 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={banner.imageUrl || "/placeholder.svg"}
                      alt={banner.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{banner.title}</h3>
                        <Badge variant={banner.active ? "default" : "secondary"}>
                          {banner.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      {banner.link && <p className="text-sm text-muted-foreground">Enlace: {banner.link}</p>}
                      <p className="text-xs text-muted-foreground">Orden: {banner.order}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(banner)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteClick(banner)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <BannerDialog open={dialogOpen} onOpenChange={setDialogOpen} banner={selectedBanner} maxOrder={maxOrder} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar banner?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El banner será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default function AdminBannersPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <AdminNav />
        <div className="container mx-auto px-4 py-6">
          <BannersContent />
        </div>
      </div>
    </ProtectedRoute>
  )
}
