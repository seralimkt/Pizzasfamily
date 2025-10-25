"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { db } from "@/lib/firebase/config"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"

export default function SeedPage() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const seedDatabase = async () => {
    setIsSeeding(true)
    setProgress(0)
    setError(null)
    setCompleted(false)

    try {
      console.log("[v0] Iniciando configuración de base de datos...")

      // Step 1: Create Categories
      setCurrentStep("Creando categorías...")
      setProgress(10)

      const categories = [
        {
          id: "cat-tlayudas",
          name: "Tlayudas",
          description: "Tlayudas tradicionales oaxaqueñas",
          order: 1,
          active: true,
        },
        {
          id: "cat-antojitos",
          name: "Antojitos",
          description: "Quesadillas, memelas y más",
          order: 2,
          active: true,
        },
        {
          id: "cat-bebidas",
          name: "Bebidas",
          description: "Aguas frescas, refrescos y más",
          order: 3,
          active: true,
        },
        {
          id: "cat-postres",
          name: "Postres",
          description: "Postres tradicionales",
          order: 4,
          active: true,
        },
      ]

      for (const category of categories) {
        console.log(`[v0] Creando categoría: ${category.name}`)
        await setDoc(doc(db, "categories", category.id), {
          ...category,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }

      setProgress(25)

      // Step 2: Create products directly without uploading images
      setCurrentStep("Creando productos...")

      const products = [
        {
          id: "prod-tlayuda-tradicional",
          categoryId: "cat-tlayudas",
          name: "Tlayuda Tradicional",
          description: "Tlayuda con asiento, frijoles, quesillo, tasajo y chapulines",
          price: 120,
          imageUrl: "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=800&q=80",
          active: true,
          order: 1,
          variations: [
            {
              id: "var-size",
              name: "Tamaño",
              required: true,
              multiSelect: false,
              options: [
                { id: "opt-individual", name: "Individual", price: 0 },
                { id: "opt-grande", name: "Grande (para compartir)", price: 80 },
              ],
            },
            {
              id: "var-protein",
              name: "Proteína",
              required: true,
              multiSelect: false,
              options: [
                { id: "opt-tasajo", name: "Tasajo", price: 0 },
                { id: "opt-cecina", name: "Cecina", price: 10 },
                { id: "opt-chorizo", name: "Chorizo", price: 10 },
                { id: "opt-mixta", name: "Mixta", price: 20 },
              ],
            },
            {
              id: "var-extras",
              name: "Extras",
              required: false,
              multiSelect: true,
              options: [
                { id: "opt-aguacate", name: "Aguacate", price: 15 },
                { id: "opt-chapulines", name: "Chapulines extra", price: 20 },
                { id: "opt-quesillo", name: "Quesillo extra", price: 15 },
              ],
            },
          ],
        },
        {
          id: "prod-tlayuda-vegetariana",
          categoryId: "cat-tlayudas",
          name: "Tlayuda Vegetariana",
          description: "Tlayuda con frijoles, quesillo, aguacate, tomate y lechuga",
          price: 100,
          imageUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80",
          active: true,
          order: 2,
          variations: [
            {
              id: "var-size",
              name: "Tamaño",
              required: true,
              multiSelect: false,
              options: [
                { id: "opt-individual", name: "Individual", price: 0 },
                { id: "opt-grande", name: "Grande (para compartir)", price: 60 },
              ],
            },
          ],
        },
        {
          id: "prod-quesadillas",
          categoryId: "cat-antojitos",
          name: "Quesadillas Oaxaqueñas",
          description: "Quesadillas de maíz con quesillo oaxaqueño",
          price: 60,
          imageUrl: "https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=800&q=80",
          active: true,
          order: 1,
          variations: [
            {
              id: "var-filling",
              name: "Relleno",
              required: true,
              multiSelect: false,
              options: [
                { id: "opt-quesillo", name: "Solo Quesillo", price: 0 },
                { id: "opt-hongos", name: "Hongos", price: 10 },
                { id: "opt-flor", name: "Flor de Calabaza", price: 10 },
                { id: "opt-huitlacoche", name: "Huitlacoche", price: 15 },
              ],
            },
            {
              id: "var-quantity",
              name: "Cantidad",
              required: true,
              multiSelect: false,
              options: [
                { id: "opt-3", name: "3 piezas", price: 0 },
                { id: "opt-5", name: "5 piezas", price: 40 },
              ],
            },
          ],
        },
        {
          id: "prod-memelas",
          categoryId: "cat-antojitos",
          name: "Memelas Oaxaqueñas",
          description: "Memelas con frijoles, quesillo y salsa",
          price: 50,
          imageUrl: "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=800&q=80",
          active: true,
          order: 2,
          variations: [
            {
              id: "var-topping",
              name: "Con",
              required: true,
              multiSelect: false,
              options: [
                { id: "opt-quesillo", name: "Quesillo", price: 0 },
                { id: "opt-tasajo", name: "Tasajo", price: 20 },
                { id: "opt-cecina", name: "Cecina", price: 20 },
              ],
            },
          ],
        },
        {
          id: "prod-tacos-dorados",
          categoryId: "cat-antojitos",
          name: "Tacos Dorados",
          description: "Tacos dorados de pollo con lechuga, crema y queso",
          price: 70,
          imageUrl: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800&q=80",
          active: true,
          order: 3,
          variations: [
            {
              id: "var-quantity",
              name: "Cantidad",
              required: true,
              multiSelect: false,
              options: [
                { id: "opt-4", name: "4 piezas", price: 0 },
                { id: "opt-6", name: "6 piezas", price: 35 },
              ],
            },
          ],
        },
        {
          id: "prod-agua-fresca",
          categoryId: "cat-bebidas",
          name: "Agua Fresca",
          description: "Aguas frescas naturales del día",
          price: 25,
          imageUrl: "https://images.unsplash.com/photo-1546173159-315724a31696?w=800&q=80",
          active: true,
          order: 1,
          variations: [
            {
              id: "var-flavor",
              name: "Sabor",
              required: true,
              multiSelect: false,
              options: [
                { id: "opt-jamaica", name: "Jamaica", price: 0 },
                { id: "opt-horchata", name: "Horchata", price: 0 },
                { id: "opt-tamarindo", name: "Tamarindo", price: 0 },
                { id: "opt-limon", name: "Limón", price: 0 },
              ],
            },
            {
              id: "var-size",
              name: "Tamaño",
              required: true,
              multiSelect: false,
              options: [
                { id: "opt-chico", name: "Chico", price: 0 },
                { id: "opt-grande", name: "Grande", price: 10 },
                { id: "opt-litro", name: "Litro", price: 35 },
              ],
            },
          ],
        },
        {
          id: "prod-refresco",
          categoryId: "cat-bebidas",
          name: "Refresco",
          description: "Refrescos embotellados",
          price: 20,
          imageUrl: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=800&q=80",
          active: true,
          order: 2,
          variations: [],
        },
        {
          id: "prod-cerveza",
          categoryId: "cat-bebidas",
          name: "Cerveza",
          description: "Cervezas nacionales",
          price: 35,
          imageUrl: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=800&q=80",
          active: true,
          order: 3,
          variations: [
            {
              id: "var-brand",
              name: "Marca",
              required: true,
              multiSelect: false,
              options: [
                { id: "opt-corona", name: "Corona", price: 0 },
                { id: "opt-modelo", name: "Modelo", price: 0 },
                { id: "opt-victoria", name: "Victoria", price: -5 },
              ],
            },
          ],
        },
        {
          id: "prod-flan",
          categoryId: "cat-postres",
          name: "Flan Napolitano",
          description: "Flan casero estilo napolitano",
          price: 45,
          imageUrl: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=800&q=80",
          active: true,
          order: 1,
          variations: [],
        },
        {
          id: "prod-gelatina",
          categoryId: "cat-postres",
          name: "Gelatina de Mosaico",
          description: "Gelatina de colores con crema",
          price: 35,
          imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80",
          active: true,
          order: 2,
          variations: [],
        },
        {
          id: "prod-pay-queso",
          categoryId: "cat-postres",
          name: "Pay de Queso",
          description: "Pay de queso cremoso con base de galleta",
          price: 50,
          imageUrl: "https://images.unsplash.com/photo-1533134242820-b4f6b6a4c0b7?w=800&q=80",
          active: true,
          order: 3,
          variations: [],
        },
      ]

      for (let i = 0; i < products.length; i++) {
        const product = products[i]
        setCurrentStep(`Creando producto ${i + 1} de ${products.length}...`)
        console.log(`[v0] Creando producto: ${product.name}`)

        await setDoc(doc(db, "products", product.id), {
          categoryId: product.categoryId,
          name: product.name,
          description: product.description,
          price: product.price,
          imageUrl: product.imageUrl,
          active: product.active,
          order: product.order,
          variations: product.variations,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        setProgress(25 + (i + 1) * (45 / products.length))
      }

      // Step 3: Create Banners
      setCurrentStep("Creando banners promocionales...")
      setProgress(70)

      const banners = [
        {
          id: "banner-1",
          title: "Tlayudas Tradicionales",
          imageUrl: "https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=1200&q=80",
          order: 1,
          active: true,
          link: "",
        },
        {
          id: "banner-2",
          title: "Antojitos Oaxaqueños",
          imageUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200&q=80",
          order: 2,
          active: true,
          link: "",
        },
        {
          id: "banner-3",
          title: "Bebidas Refrescantes",
          imageUrl: "https://images.unsplash.com/photo-1546173159-315724a31696?w=1200&q=80",
          order: 3,
          active: true,
          link: "",
        },
      ]

      for (let i = 0; i < banners.length; i++) {
        const banner = banners[i]
        setCurrentStep(`Creando banner ${i + 1} de ${banners.length}...`)
        console.log(`[v0] Creando banner: ${banner.title}`)

        await setDoc(doc(db, "banners", banner.id), {
          title: banner.title,
          imageUrl: banner.imageUrl,
          order: banner.order,
          active: banner.active,
          link: banner.link,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        setProgress(70 + (i + 1) * (15 / banners.length))
      }

      setProgress(85)

      // Step 4: Create Brand Configuration
      setCurrentStep("Configurando información del negocio...")
      console.log("[v0] Creando configuración de marca...")

      await setDoc(doc(db, "config", "brand"), {
        businessName: "Tlayudas La Vid",
        phone: "+573235111621",
        address: "Oaxaca de Juárez, Oaxaca",
        deliveryFee: 30,
        primaryColor: "#F4C542",
        secondaryColor: "#E67E22",
        accentColor: "#C0392B",
        logoUrl: "",
        updatedAt: serverTimestamp(),
      })

      setProgress(100)
      setCurrentStep("¡Base de datos configurada exitosamente!")
      console.log("[v0] ✅ Configuración completada exitosamente!")
      setCompleted(true)
      setIsSeeding(false)
    } catch (error) {
      console.error("[v0] ❌ Error al configurar la base de datos:", error)
      setError(
        error instanceof Error
          ? error.message
          : "Error desconocido al conectar con Firebase. Verifica que las reglas de Firestore estén configuradas correctamente.",
      )
      setIsSeeding(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Inicializar Base de Datos</CardTitle>
          <CardDescription>
            Haz clic en el botón para llenar automáticamente la base de datos con categorías, productos, banners y
            configuración inicial.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!completed && !error && (
            <Button
              onClick={seedDatabase}
              disabled={isSeeding}
              size="lg"
              className="w-full bg-gradient-to-r from-primary via-secondary to-accent"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Configurando...
                </>
              ) : (
                "Inicializar Base de Datos"
              )}
            </Button>
          )}

          {isSeeding && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{currentStep}</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
          )}

          {completed && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">¡Configuración completada!</p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    La base de datos ha sido inicializada con todos los datos de ejemplo. Ahora puedes ir al dashboard
                    para ver los productos y pedidos.
                  </p>
                </div>
              </div>
              <Button onClick={() => (window.location.href = "/admin/dashboard")} className="w-full">
                Ir al Dashboard
              </Button>
            </div>
          )}

          {error && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-900 dark:text-red-100">Error al configurar</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                    Asegúrate de haber configurado las reglas de Firestore correctamente en la consola de Firebase.
                  </p>
                </div>
              </div>
              <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                Intentar de nuevo
              </Button>
            </div>
          )}

          <div className="pt-4 border-t">
            <h3 className="font-medium mb-2">¿Qué se va a crear?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 4 categorías (Tlayudas, Antojitos, Bebidas, Postres)</li>
              <li>• 11 productos con variaciones y precios</li>
              <li>• 3 banners promocionales</li>
              <li>• Configuración inicial del negocio</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
