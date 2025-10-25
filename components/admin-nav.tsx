"use client"

import { Button } from "@/components/ui/button"
import { useRouter, usePathname } from "next/navigation"
import { signOut } from "@/lib/firebase/auth"
import { LayoutDashboard, Package, Settings, BarChart3, LogOut, ImageIcon, Database, Users, Menu } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useState, useEffect } from "react"
import { subscribeToConfig } from "@/lib/firebase/db"
import type { BrandConfig } from "@/lib/firebase/types"

export function AdminNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [config, setConfig] = useState<BrandConfig | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeToConfig((brandConfig) => {
      setConfig(brandConfig)
    })
    return () => unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await signOut()
    router.push("/admin/login")
  }

  const navItems = [
    { href: "/admin/dashboard", label: "Pedidos", icon: LayoutDashboard },
    { href: "/admin/products", label: "Productos", icon: Package },
    { href: "/admin/banners", label: "Banners", icon: ImageIcon },
    { href: "/admin/customers", label: "Clientes", icon: Users },
    { href: "/admin/reports", label: "Reportes", icon: BarChart3 },
    { href: "/admin/settings", label: "Configuración", icon: Settings },
    { href: "/admin/seed", label: "Inicializar DB", icon: Database },
  ]

  const handleMobileNavigation = (href: string) => {
    router.push(href)
    setMobileMenuOpen(false)
  }

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            {config?.logoUrl ? (
              <img
                src={config.logoUrl || "/placeholder.svg"}
                alt="Logo"
                className="h-10 w-10 rounded-lg object-cover"
                style={{ borderRadius: "10px" }}
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70">
                <span className="text-lg font-bold text-primary-foreground">TL</span>
              </div>
            )}
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold leading-none text-foreground">
                {config?.businessName || "Las Brasas de San Cristobal"}
              </h1>
              <p className="text-xs text-muted-foreground">Panel de Administración</p>
            </div>
          </div>
          <div className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Button
                  key={item.href}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => router.push(item.href)}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              )
            })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  {config?.logoUrl ? (
                    <img
                      src={config.logoUrl || "/placeholder.svg"}
                      alt="Logo"
                      className="h-10 w-10 rounded-lg object-cover"
                      style={{ borderRadius: "10px" }}
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70">
                      <span className="text-lg font-bold text-primary-foreground">TL</span>
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-bold leading-none">{config?.businessName || "OwnApp Latam"}</div>
                    <div className="text-xs font-normal text-muted-foreground">Admin</div>
                  </div>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Button
                      key={item.href}
                      variant={isActive ? "secondary" : "ghost"}
                      onClick={() => handleMobileNavigation(item.href)}
                      className="w-full justify-start gap-3"
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Button>
                  )
                })}
                <div className="my-4 border-t" />
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="w-full justify-start gap-3 text-destructive hover:text-destructive"
                >
                  <LogOut className="h-5 w-5" />
                  Cerrar Sesión
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-xs text-primary-foreground">AD</AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="hidden gap-2 lg:flex">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </div>
    </nav>
  )
}
