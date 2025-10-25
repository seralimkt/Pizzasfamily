# Configuración de Reglas de Seguridad de Firestore

## Instrucciones para Aplicar las Reglas

### Paso 1: Acceder a Firebase Console
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **brasas-de-san-cristobal**
3. En el menú lateral, haz clic en **Firestore Database**
4. Ve a la pestaña **Reglas** (Rules)

### Paso 2: Copiar las Reglas
1. Abre el archivo `firestore.rules` en tu proyecto
2. Copia todo el contenido del archivo
3. Pégalo en el editor de reglas de Firebase Console
4. Haz clic en **Publicar** (Publish)

### Paso 3: Configurar Autenticación
Para que las reglas funcionen correctamente, necesitas configurar Firebase Authentication:

1. En Firebase Console, ve a **Authentication** en el menú lateral
2. Haz clic en **Comenzar** (Get Started) si es la primera vez
3. Ve a la pestaña **Sign-in method**
4. Habilita **Correo electrónico/contraseña** (Email/Password)
5. Ve a la pestaña **Users**
6. Haz clic en **Agregar usuario** (Add user)
7. Ingresa:
   - **Correo electrónico**: Brasassancristobal@gmail.com
   - **Contraseña**: (elige una contraseña segura)
8. Haz clic en **Agregar usuario**

### Paso 4: Verificar las Reglas
Después de publicar las reglas, puedes probarlas:

1. En la pestaña **Reglas**, haz clic en **Simulador de reglas** (Rules Playground)
2. Prueba diferentes operaciones para verificar que funcionan correctamente

## Reglas de Firestore para Copiar

Copia las siguientes reglas y pégalas en Firebase Console:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Categories collection
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if isAuthenticated();
    }
    
    // Products collection
    match /products/{productId} {
      allow read: if true;
      allow write: if isAuthenticated();
    }
    
    // Orders collection
    match /orders/{orderId} {
      allow create: if true;
      allow read, update, delete: if isAuthenticated();
    }
    
    // Banners collection
    match /banners/{bannerId} {
      allow read: if true;
      allow write: if isAuthenticated();
    }
    
    // Config collection
    match /config/{document=**} {
      allow read: if true;
      allow write: if isAuthenticated();
    }
  }
}

## Resumen de las Reglas de Seguridad

### Permisos por Colección

#### 📁 **categories** (Categorías)
- ✅ **Lectura pública**: Solo categorías activas
- 🔒 **Lectura admin**: Todas las categorías
- 🔒 **Escritura**: Solo admin

#### 📁 **products** (Productos)
- ✅ **Lectura pública**: Solo productos activos
- 🔒 **Lectura admin**: Todos los productos
- 🔒 **Escritura**: Solo admin

#### 📁 **orders** (Órdenes)
- ✅ **Crear**: Cualquier usuario (clientes sin autenticación)
- 🔒 **Leer/Actualizar/Eliminar**: Solo admin

#### 📁 **banners** (Banners)
- ✅ **Lectura pública**: Solo banners activos
- 🔒 **Lectura admin**: Todos los banners
- 🔒 **Escritura**: Solo admin

#### 📁 **config** (Configuración)
- ✅ **Lectura pública**: Toda la configuración (necesaria para el frontend)
- 🔒 **Escritura**: Solo admin
- ❌ **Eliminar**: Nadie (protección de datos críticos)

### Usuario Administrador

**Correo**: Brasassancristobal@gmail.com

Este correo tiene permisos completos para:
- Leer todas las colecciones (incluyendo elementos inactivos)
- Crear, actualizar y eliminar categorías, productos y banners
- Leer y actualizar órdenes
- Actualizar configuración

### Seguridad

Las reglas implementan:
- ✅ Acceso público solo a datos activos y necesarios
- ✅ Protección de datos administrativos
- ✅ Validación de autenticación para operaciones sensibles
- ✅ Prevención de eliminación accidental de configuración
- ✅ Bloqueo de acceso a colecciones no especificadas

## Notas Importantes

⚠️ **IMPORTANTE**: Después de aplicar estas reglas, el acceso público estará restringido. Asegúrate de:
1. Haber creado el usuario admin en Firebase Authentication
2. Haber inicializado la base de datos con los datos necesarios (usa el seed)
3. Probar el login admin antes de aplicar las reglas en producción

## Solución de Problemas

### Error: "Missing or insufficient permissions"
- Verifica que el usuario admin esté creado en Firebase Authentication
- Asegúrate de estar autenticado con el correo correcto
- Revisa que las reglas estén publicadas correctamente

### Los clientes no pueden ver productos/categorías
- Verifica que los productos/categorías tengan `active: true`
- Revisa que las reglas estén publicadas
- Limpia la caché del navegador

### No puedo crear órdenes desde el frontend
- Verifica que la colección `orders` exista
- Revisa la consola del navegador para ver errores específicos
- Asegúrate de que los datos de la orden cumplan con la estructura esperada
