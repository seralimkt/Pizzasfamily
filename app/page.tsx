"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { UtensilsCrossed } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { getBrandConfig } from "@/lib/firebase/db"
import Image from "next/image"

export default function HomePage() {
  const router = useRouter()
  const [logoUrl, setLogoUrl] = useState<string>("")

  useEffect(() => {
    getBrandConfig().then((config) => {
      if (config?.logoUrl) {
        setLogoUrl(config.logoUrl)
      }
    })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="mb-12 text-center">
          <div className="mb-4 flex justify-center">
            {logoUrl ? (
              <div className="relative h-32 w-32 overflow-hidden rounded-[10px] bg-white shadow-lg">
                <Image
                  src={logoUrl || "/placeholder.svg"}
                  alt="Logo Ownapp Latam"
                  fill
                  className="object-contain p-2"
                  priority
                />
              </div>
            ) : (
              <div className="rounded-full bg-primary p-6 shadow-lg">
                <UtensilsCrossed className="h-16 w-16 text-primary-foreground" />
              </div>
            )}
          </div>
          <h1 className="mb-3 text-balance text-5xl font-bold tracking-tight text-foreground md:text-6xl">
            Las Brasas de San Cristobal
          </h1>
          <p className="text-balance text-xl text-muted-foreground">Los mejores platillos de la región</p>
        </div>

        <div className="w-full max-w-md">
          <Card className="group cursor-pointer transition-all hover:shadow-xl hover:scale-105">
            <CardContent className="flex flex-col items-center gap-6 p-8">
              <div className="rounded-full bg-primary/10 p-6 transition-colors group-hover:bg-primary/20">
                <UtensilsCrossed className="h-12 w-12 text-primary" />
              </div>
              <div className="text-center">
                <h2 className="mb-2 text-2xl font-bold text-foreground">
                  Disfruta de nuestra gran variedad de platillos
                </h2>
                <p className="mb-6 text-balance text-muted-foreground">
                  Explora nuestro menú y realiza tu pedido en línea
                </p>
              </div>
              <Button
                size="lg"
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => router.push("/order")}
              >
                Ver Menú
              </Button>
            </CardContent>
          </Card>
        </div>

        <footer className="mt-16 text-center text-sm text-muted-foreground">
          <p>Sistema de pedidos en línea - Ownapp Latam</p>
          <Link
            href="/admin/login"
            className="mt-2 inline-block text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors underline"
          >
            Entrar como Administrador
          </Link>
        </footer>
      </div>
    </div>
  )
}
