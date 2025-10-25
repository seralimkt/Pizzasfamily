"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { AdminNav } from "@/components/admin-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { subscribeToCategories, subscribeToProducts, deleteCategory, deleteProduct } from "@/lib/firebase/db"
import type { Category, Product } from "@/lib/firebase/types"
import { CategoryDialog } from "@/components/category-dialog"
import { ProductDialog } from "@/components/product-dialog"
import { Plus, Edit, Trash2, FolderOpen } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
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

function ProductsContent() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [productDialogOpen, setProductDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteType, setDeleteType] = useState<"category" | "product">("product")
  const [deleteId, setDeleteId] = useState<string>("")

  useEffect(() => {
    const unsubscribeCategories = subscribeToCategories((cats) => {
      setCategories(cats)
      setLoading(false)
    })

    const unsubscribeProducts = subscribeToProducts(setProducts)

    return () => {
      unsubscribeCategories()
      unsubscribeProducts()
    }
  }, [])

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryDialogOpen(true)
  }

  const handleAddCategory = () => {
    setEditingCategory(null)
    setCategoryDialogOpen(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductDialogOpen(true)
  }

  const handleAddProduct = () => {
    setEditingProduct(null)
    setProductDialogOpen(true)
  }

  const handleDeleteCategory = async () => {
    try {
      await deleteCategory(deleteId)
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error("[v0] Error deleting category:", error)
    }
  }

  const handleDeleteProduct = async () => {
    try {
      await deleteProduct(deleteId)
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error("[v0] Error deleting product:", error)
    }
  }

  const filteredProducts =
    selectedCategory === "all" ? products : products.filter((p) => p.categoryId === selectedCategory)

  const maxCategoryOrder = categories.length > 0 ? Math.max(...categories.map((c) => c.order)) : 0
  const maxProductOrder = products.length > 0 ? Math.max(...products.map((p) => p.order)) : 0

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Categorías</h2>
          <p className="text-sm text-muted-foreground">Gestiona las categorías del menú</p>
        </div>
        <Button onClick={handleAddCategory}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Categoría
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <FolderOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {products.filter((p) => p.categoryId === category.id).length} productos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={category.active ? "default" : "secondary"}>
                  {category.active ? "Activa" : "Inactiva"}
                </Badge>
                <Button variant="ghost" size="icon" onClick={() => handleEditCategory(category)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setDeleteType("category")
                    setDeleteId(category.id)
                    setDeleteDialogOpen(true)
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between pt-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Productos</h2>
          <p className="text-sm text-muted-foreground">Gestiona los productos del menú</p>
        </div>
        <Button onClick={handleAddProduct}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all">Todos ({products.length})</TabsTrigger>
          {categories.map((cat) => (
            <TabsTrigger key={cat.id} value={cat.id}>
              {cat.name} ({products.filter((p) => p.categoryId === cat.id).length})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          {filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No hay productos en esta categoría</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <Card key={product.id}>
                  <CardContent className="p-0">
                    {product.imageUrl ? (
                      <div className="relative aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
                        <Image
                          src={product.imageUrl || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video w-full rounded-t-lg bg-muted" />
                    )}
                    <div className="p-4">
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground">{product.name}</h3>
                        <Badge variant={product.active ? "default" : "secondary"}>
                          {product.active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">${product.price.toFixed(2)}</span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDeleteType("product")
                              setDeleteId(product.id)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={editingCategory}
        maxOrder={maxCategoryOrder}
      />

      <ProductDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        product={editingProduct}
        categories={categories}
        maxOrder={maxProductOrder}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Esto eliminará permanentemente{" "}
              {deleteType === "category" ? "la categoría" : "el producto"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={deleteType === "category" ? handleDeleteCategory : handleDeleteProduct}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function AdminProductsPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <AdminNav />
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Gestión de Productos</h1>
            <p className="text-muted-foreground">Administra categorías y productos del menú</p>
          </div>
          <ProductsContent />
        </div>
      </div>
    </ProtectedRoute>
  )
}
