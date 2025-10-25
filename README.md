# Tlayudas La Vid - Sistema de Pedidos

Plataforma completa de pedidos en línea para restaurante de comida oaxaqueña con panel de administración.

## Características

- **Para Clientes:**
  - Navegación por categorías de productos
  - Carrito de compras con variaciones de productos
  - Envío automático de pedidos por WhatsApp
  - Banners promocionales rotativos
  - Diseño moderno y responsivo

- **Para Administradores:**
  - Panel de control con estadísticas en tiempo real
  - Gestión de pedidos con notificaciones
  - CRUD completo de productos con variaciones
  - Gestión de categorías y banners
  - Configuración de marca y negocio
  - Reportes de ventas

## Configuración Inicial

### 1. Instalar Dependencias

\`\`\`bash
npm install
\`\`\`

### 2. Configurar Firebase

Las credenciales de Firebase ya están configuradas en `lib/firebase/config.ts`.

### 3. Configurar Reglas de Seguridad de Firestore

Ve a la consola de Firebase → Firestore Database → Rules y pega las reglas del archivo `firestore.rules`.

### 4. Poblar la Base de Datos

Para llenar Firestore con datos de ejemplo (categorías, productos, banners):

\`\`\`bash
npm run seed
\`\`\`

Este comando creará:
- 4 categorías (Tlayudas, Antojitos, Bebidas, Postres)
- 11 productos con variaciones
- 3 banners promocionales
- Configuración inicial del negocio

### 5. Crear Usuario Administrador

1. Ve a Firebase Console → Authentication
2. Agrega un usuario con email y contraseña
3. Usa estas credenciales para iniciar sesión en `/admin/login`

### 6. Iniciar el Servidor de Desarrollo

\`\`\`bash
npm run dev
\`\`\`

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Estructura del Proyecto

\`\`\`
├── app/
│   ├── admin/          # Panel de administración
│   ├── order/          # Flujo de pedidos del cliente
│   └── page.tsx        # Página de bienvenida
├── components/         # Componentes reutilizables
├── lib/
│   ├── firebase/       # Configuración y utilidades de Firebase
│   └── cart-context.tsx # Contexto del carrito
├── scripts/
│   └── seed-firestore.ts # Script para poblar datos
└── public/             # Imágenes estáticas
\`\`\`

## Uso

### Acceso de Cliente
1. Ir a la página principal
2. Hacer clic en "Ordenar Ahora"
3. Navegar por categorías y agregar productos al carrito
4. Seleccionar variaciones (tamaños, extras, etc.)
5. Proceder al checkout y llenar información
6. El pedido se enviará automáticamente por WhatsApp

### Acceso de Administrador
1. Ir a `/admin/login`
2. Iniciar sesión con credenciales de Firebase
3. Gestionar pedidos, productos, categorías y configuración

## Tecnologías

- **Frontend:** Next.js 15, React 19, Tailwind CSS
- **Backend:** Firebase (Firestore, Auth, Storage)
- **UI Components:** Radix UI, shadcn/ui
- **Iconos:** Lucide React

## Soporte

Para problemas o preguntas, contacta al equipo de desarrollo.
