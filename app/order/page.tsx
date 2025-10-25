"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { subscribeToCategories, subscribeToProducts, subscribeToBanners } from "@/lib/firebase/db"
import type { Category, Product, Banner } from "@/lib/firebase/types"
import { useCart } from "@/lib/cart-context"
import { CartButton } from "@/components/cart-button"
import { ArrowLeft, Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Spinner } from "@/components/ui/spinner"
import { ProductDialog } from "@/components/product-detail-dialog"

export default function OrderPage() {
  const router = useRouter()
  const { addItem } = useCart()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentBanner, setCurrentBanner] = useState(0)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productDialogOpen, setProductDialogOpen] = useState(false)

  useEffect(() => {
    const unsubscribeCategories = subscribeToCategories((cats) => {
      const activeCats = cats.filter((c) => c.active)
      setCategories(activeCats)
      setLoading(false)
    })

    const unsubscribeProducts = subscribeToProducts((prods) => {
      setProducts(prods.filter((p) => p.active))
    })

    const unsubscribeBanners = subscribeToBanners((bans) => {
      setBanners(bans.filter((b) => b.active))
    })

    return () => {
      unsubscribeCategories()
      unsubscribeProducts()
      unsubscribeBanners()
    }
  }, [])

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBanner((prev) => (prev + 1) % banners.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [banners.length])

  const filteredProducts = selectedCategory ? products.filter((p) => p.categoryId === selectedCategory.id) : []

  const handleProductClick = (product: Product) => {
    if (product.variations && product.variations.length > 0) {
      setSelectedProduct(product)
      setProductDialogOpen(true)
    } else {
      addItem(product, 1)
    }
  }

  const nextBanner = () => {
    setCurrentBanner((prev) => (prev + 1) % banners.length)
  }

  const prevBanner = () => {
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 pb-24">
      <header className="sticky top-0 z-40 border-b bg-card/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto flex items-center gap-4 px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => (selectedCategory ? setSelectedCategory(null) : router.push("/"))}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">
              {selectedCategory ? selectedCategory.name : "Nuestro Menú"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {selectedCategory ? selectedCategory.description : "Selecciona una categoría"}
            </p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {banners.length > 0 && (
          <div className="relative overflow-hidden rounded-2xl shadow-lg">
            <div className="relative aspect-[3/1] w-full">
              <Image
                src={banners[currentBanner].imageUrl || "/placeholder.svg"}
                alt={banners[currentBanner].title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h2 className="text-balance text-2xl font-bold text-white drop-shadow-lg">
                  {banners[currentBanner].title}
                </h2>
              </div>
            </div>
            {banners.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 hover:bg-white"
                  onClick={prevBanner}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 hover:bg-white"
                  onClick={nextBanner}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentBanner(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentBanner ? "w-8 bg-white" : "w-2 bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {!selectedCategory ? (
          // Category selection view
          categories.length === 0 ? (
            <Card className="shadow-md">
              <CardContent className="flex flex-col items-center gap-4 py-12">
                <p className="text-center text-muted-foreground">No hay categorías disponibles en este momento.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {categories.map((category) => (
                <Card
                  key={category.id}
                  className="group cursor-pointer overflow-hidden shadow-md transition-all hover:shadow-xl hover:-translate-y-1"
                  onClick={() => setSelectedCategory(category)}
                >
                  <CardContent className="p-0">
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center p-4">
                          <div className="mb-2 text-4xl">
                            {category.name === "Tlayudas" && "🫓"}
                            {category.name === "Antojitos" && "🌮"}
                            {category.name === "Bebidas" && "🥤"}
                            {category.name === "Postres" && "🍰"}
                            {!["Tlayudas", "Antojitos", "Bebidas", "Postres"].includes(category.name) && "🍽️"}
                          </div>
                          <h3 className="text-xl font-bold text-foreground">{category.name}</h3>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <div className="p-4">
                      <p className="text-pretty text-sm text-muted-foreground text-center line-clamp-2">
                        {category.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : // Products view
        filteredProducts.length === 0 ? (
          <Card className="shadow-md">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No hay productos disponibles en esta categoría.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="group overflow-hidden shadow-md transition-all hover:shadow-xl hover:-translate-y-1"
              >
                <CardContent className="p-0">
                  {product.imageUrl ? (
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                      <Image
                        src={product.imageUrl || "/placeholder.svg"}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[4/3] w-full bg-gradient-to-br from-muted to-muted/50" />
                  )}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-balance text-lg font-bold text-foreground leading-tight">{product.name}</h3>
                      <Badge className="flex-shrink-0 bg-primary text-primary-foreground font-bold">
                        ${product.price.toFixed(2)}
                      </Badge>
                    </div>
                    <p className="text-pretty text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                    {product.variations && product.variations.length > 0 && (
                      <p className="text-xs text-primary font-medium">Personalizable</p>
                    )}
                    <Button
                      className="w-full rounded-xl bg-primary font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                      onClick={() => handleProductClick(product)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CartButton />

      {selectedProduct && (
        <ProductDialog open={productDialogOpen} onOpenChange={setProductDialogOpen} product={selectedProduct} />
      )}
    </div>
  )
}
