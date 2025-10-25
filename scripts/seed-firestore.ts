import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, setDoc, doc } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyCRpF-mK3jrw-g0C4bgTBcMhJDAxV7aD5U",
  authDomain: "brasas-de-san-cristobal.firebaseapp.com",
  projectId: "brasas-de-san-cristobal",
  storageBucket: "brasas-de-san-cristobal.firebasestorage.app",
  messagingSenderId: "339177347991",
  appId: "1:339177347991:web:e63387b548c2a5e6a042d2",
  measurementId: "G-NXLYWPEQRW",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function seedFirestore() {
  console.log("[v0] Starting Firestore seed...")

  try {
    // 1. Seed Brand Configuration
    console.log("[v0] Creating brand configuration...")
    await setDoc(doc(db, "brandConfig", "main"), {
      businessName: "OwnApp",
      whatsappNumber: "+573235111621",
      email: "Brasassancristobal@gmail.com",
      deliveryFee: 30,
      primaryColor: "#F4C542",
      secondaryColor: "#E67E22",
      accentColor: "#C0392B",
      logoUrl: "",
      updatedAt: new Date().toISOString(),
    })

    // 2. Seed Categories
    console.log("[v0] Creating categories...")
    const categories = [
      { name: "Tlayudas", description: "Tlayudas tradicionales oaxaqueñas", order: 1, active: true },
      { name: "Antojitos", description: "Antojitos mexicanos", order: 2, active: true },
      { name: "Bebidas", description: "Bebidas refrescantes", order: 3, active: true },
      { name: "Postres", description: "Postres caseros", order: 4, active: true },
    ]

    const categoryIds: { [key: string]: string } = {}
    for (const category of categories) {
      const docRef = await addDoc(collection(db, "categories"), {
        ...category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      categoryIds[category.name] = docRef.id
      console.log(`[v0] Created category: ${category.name}`)
    }

    // 3. Seed Products with Variations
    console.log("[v0] Creating products...")
    const products = [
      // Tlayudas
      {
        categoryId: categoryIds["Tlayudas"],
        name: "Tlayuda Tradicional",
        description: "Tlayuda con asiento, frijoles, quesillo, lechuga, tomate y aguacate",
        price: 85,
        imageUrl: "/tlayuda-tradicional-oaxaque-a.jpg",
        active: true,
        order: 1,
        variations: [
          {
            id: "size",
            name: "Tamaño",
            required: true,
            multiSelect: false,
            options: [
              { name: "Individual", price: 0 },
              { name: "Grande", price: 35 },
            ],
          },
          {
            id: "protein",
            name: "Proteína",
            required: true,
            multiSelect: false,
            options: [
              { name: "Tasajo", price: 0 },
              { name: "Cecina", price: 0 },
              { name: "Chorizo", price: 0 },
              { name: "Mixta", price: 15 },
            ],
          },
          {
            id: "extras",
            name: "Extras",
            required: false,
            multiSelect: true,
            options: [
              { name: "Quesillo extra", price: 15 },
              { name: "Aguacate extra", price: 10 },
              { name: "Chapulines", price: 20 },
            ],
          },
        ],
      },
      {
        categoryId: categoryIds["Tlayudas"],
        name: "Tlayuda Vegetariana",
        description: "Tlayuda con frijoles, quesillo, champiñones, calabaza, lechuga y aguacate",
        price: 75,
        imageUrl: "/tlayuda-vegetariana.jpg",
        active: true,
        order: 2,
        variations: [
          {
            id: "size",
            name: "Tamaño",
            required: true,
            multiSelect: false,
            options: [
              { name: "Individual", price: 0 },
              { name: "Grande", price: 30 },
            ],
          },
        ],
      },
      // Antojitos
      {
        categoryId: categoryIds["Antojitos"],
        name: "Quesadillas",
        description: "Quesadillas de maíz con quesillo oaxaqueño",
        price: 45,
        imageUrl: "/quesadillas-oaxaque-as.jpg",
        active: true,
        order: 1,
        variations: [
          {
            id: "filling",
            name: "Relleno",
            required: true,
            multiSelect: false,
            options: [
              { name: "Solo quesillo", price: 0 },
              { name: "Quesillo con champiñones", price: 10 },
              { name: "Quesillo con flor de calabaza", price: 12 },
              { name: "Quesillo con huitlacoche", price: 15 },
            ],
          },
          {
            id: "quantity",
            name: "Cantidad",
            required: true,
            multiSelect: false,
            options: [
              { name: "3 piezas", price: 0 },
              { name: "5 piezas", price: 30 },
            ],
          },
        ],
      },
      {
        categoryId: categoryIds["Antojitos"],
        name: "Memelas",
        description: "Memelas con frijoles, quesillo y salsa",
        price: 40,
        imageUrl: "/memelas-oaxaque-as.jpg",
        active: true,
        order: 2,
        variations: [
          {
            id: "topping",
            name: "Con",
            required: false,
            multiSelect: true,
            options: [
              { name: "Tasajo", price: 15 },
              { name: "Cecina", price: 15 },
              { name: "Chorizo", price: 15 },
            ],
          },
        ],
      },
      {
        categoryId: categoryIds["Antojitos"],
        name: "Tacos",
        description: "Tacos dorados con lechuga, crema y queso",
        price: 50,
        imageUrl: "/tacos-dorados-mexicanos.jpg",
        active: true,
        order: 3,
        variations: [
          {
            id: "filling",
            name: "Relleno",
            required: true,
            multiSelect: false,
            options: [
              { name: "Pollo", price: 0 },
              { name: "Papa", price: 0 },
              { name: "Requesón", price: 5 },
            ],
          },
        ],
      },
      // Bebidas
      {
        categoryId: categoryIds["Bebidas"],
        name: "Agua Fresca",
        description: "Aguas frescas naturales del día",
        price: 25,
        imageUrl: "/agua-fresca-mexicana.jpg",
        active: true,
        order: 1,
        variations: [
          {
            id: "flavor",
            name: "Sabor",
            required: true,
            multiSelect: false,
            options: [
              { name: "Jamaica", price: 0 },
              { name: "Horchata", price: 0 },
              { name: "Tamarindo", price: 0 },
              { name: "Limón", price: 0 },
            ],
          },
          {
            id: "size",
            name: "Tamaño",
            required: true,
            multiSelect: false,
            options: [
              { name: "Chico", price: 0 },
              { name: "Grande", price: 10 },
            ],
          },
        ],
      },
      {
        categoryId: categoryIds["Bebidas"],
        name: "Refresco",
        description: "Refrescos embotellados",
        price: 20,
        imageUrl: "/refresco-mexicano.jpg",
        active: true,
        order: 2,
        variations: [
          {
            id: "brand",
            name: "Marca",
            required: true,
            multiSelect: false,
            options: [
              { name: "Coca-Cola", price: 0 },
              { name: "Sprite", price: 0 },
              { name: "Fanta", price: 0 },
              { name: "Manzanita", price: 0 },
            ],
          },
        ],
      },
      {
        categoryId: categoryIds["Bebidas"],
        name: "Cerveza",
        description: "Cervezas nacionales",
        price: 35,
        imageUrl: "/cerveza-mexicana.jpg",
        active: true,
        order: 3,
        variations: [
          {
            id: "brand",
            name: "Marca",
            required: true,
            multiSelect: false,
            options: [
              { name: "Corona", price: 0 },
              { name: "Victoria", price: 0 },
              { name: "Modelo", price: 5 },
              { name: "Indio", price: 0 },
            ],
          },
        ],
      },
      // Postres
      {
        categoryId: categoryIds["Postres"],
        name: "Flan Napolitano",
        description: "Flan casero estilo napolitano",
        price: 35,
        imageUrl: "/flan-napolitano.jpg",
        active: true,
        order: 1,
        variations: [],
      },
      {
        categoryId: categoryIds["Postres"],
        name: "Gelatina",
        description: "Gelatina de leche con fruta",
        price: 30,
        imageUrl: "/gelatina-de-leche.jpg",
        active: true,
        order: 2,
        variations: [
          {
            id: "flavor",
            name: "Sabor",
            required: true,
            multiSelect: false,
            options: [
              { name: "Fresa", price: 0 },
              { name: "Mosaico", price: 0 },
              { name: "Rompope", price: 5 },
            ],
          },
        ],
      },
    ]

    for (const product of products) {
      await addDoc(collection(db, "products"), {
        ...product,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      console.log(`[v0] Created product: ${product.name}`)
    }

    // 4. Seed Banners
    console.log("[v0] Creating banners...")
    const banners = [
      {
        title: "Bienvenido a Tlayudas La Vid",
        imageUrl: "/banner-tlayudas-oaxaque-as-restaurante.jpg",
        link: "",
        order: 1,
        active: true,
      },
      {
        title: "Promoción Especial",
        imageUrl: "/promocion-comida-mexicana-descuento.jpg",
        link: "",
        order: 2,
        active: true,
      },
      {
        title: "Nuevos Sabores",
        imageUrl: "/antojitos-mexicanos-variedad.jpg",
        link: "",
        order: 3,
        active: true,
      },
    ]

    for (const banner of banners) {
      await addDoc(collection(db, "banners"), {
        ...banner,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      console.log(`[v0] Created banner: ${banner.title}`)
    }

    console.log("[v0] ✅ Firestore seed completed successfully!")
    console.log("[v0] Created:")
    console.log("[v0] - 1 brand configuration")
    console.log("[v0] - 4 categories")
    console.log("[v0] - 11 products with variations")
    console.log("[v0] - 3 banners")
  } catch (error) {
    console.error("[v0] ❌ Error seeding Firestore:", error)
    throw error
  }
}

// Run the seed function
seedFirestore()
  .then(() => {
    console.log("[v0] Seed script finished")
    process.exit(0)
  })
  .catch((error) => {
    console.error("[v0] Seed script failed:", error)
    process.exit(1)
  })
