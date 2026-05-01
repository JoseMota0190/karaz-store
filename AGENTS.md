# Karaz Store - Documentación para Agentes IA

## Estructura del Proyecto

```
karaz-store/
├── index.html          # Página principal del catálogo
├── product.html        # Detalle de producto
├── cart.html          # Carrito de compras
├── admin.html         # Panel de administración
├── app.js             # Lógica frontend (carrito, API, rendering)
├── styles.css         # Estilos principales
├── productos.json     # Datos locales (fallback)
├── imagenes/          # Assets estáticos locales
│   ├── logo_granate.png
│   ├── logo-hero.png
│   └── *.jpg
└── backend/
    ├── server.js      # API Express + MongoDB
    ├── package.json
    └── .env           # Variables de entorno (NO committing)
```

## Configuración del Entorno

### Variables requeridas (backend/.env)

```env
MONGODB_URI=mongodb+srv://...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
PORT=3000
SUPER_ADMIN_PASSWORD=supersecret
ADMIN_PASSWORD=karaz2024
```

### Store actual: `karaz`

El proyecto está configurado para la tienda "karaz" (hardcodeado en app.js línea 39).

## Comandos

### Backend

```bash
cd backend

# Instalar dependencias
npm install

# Iniciar servidor (desarrollo)
npm run dev

# Iniciar servidor (producción)
npm start
```

### Frontend

Simplemente abrir `index.html` en un navegador. No requiere build.

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/config?store=karaz` | Configuración de la tienda |
| GET | `/api/productos` | Listar productos activos |
| POST | `/api/productos` | Crear producto (admin) |
| PUT | `/api/productos/:id` | Actualizar producto (admin) |
| DELETE | `/api/productos/:id` | Eliminar producto (admin) |
| POST | `/api/login` | Autenticar admin |
| POST | `/api/ventas` | Registrar venta (admin) |
| GET | `/api/ventas` | Listar ventas (admin) |

### Headers requeridos

```http
x-store-id: karaz
x-admin-password: (password del admin)
```

## Características Implementadas

- [x] Catálogo multi-categoría (anillos, pulseras, collares, aretes, earcuffs, sets)
- [x] Carrito con localStorage (persistente entre sesiones)
- [x] Pedidos por WhatsApp (mensaje formateado con productos)
- [x] Panel admin (CRUD productos, ver ventas)
- [x] Imágenes en Cloudinary
- [x] Responsive (mobile-first)
- [x] Lightbox para galería de producto
- [x] Toast notifications
- [x] Sistema de ordenamiento de productos: destacados → recientes (4) → por visitas
- [x] Filtros de precio (Más relevantes, Menor-Mayor, Mayor-Menor)
- [x] Contador de visitas por producto
- [x] UI mejorada del admin: navbar granate, barra de categorías, logo, 3 botones (Nuevo/Editar/Eliminar)
- [x] Vista agrupada por categoría con ordenamiento por precio en modos editar/eliminar
- [x] Botones "Ver tienda" (verde) y "Salir" (rojo) de mayor tamaño
- [x] Favicon SVG en todas las páginas
- [x] Títulos dinámicos en cada página
- [x] Estilo mejorado en página del carrito (centrado, mejor tipografía, estado vacío)
- [x] Logo en página del carrito (K-karaz.png)
- [x] Tipografía Playfair Display para "Experiencia KARAZ"
- [x] **Sistema de productos destacados**: hasta 4 por categoría, con badge 🔥 y borde dorado
- [x] **Imagen de portada por categoría**: configurable desde admin, con fallback granate+dorado
- [x] **Paginación del catálogo**: 20 productos por página con navegación
- [x] **Skeleton loading**: placeholder animado mientras cargan productos
- [x] **Sanitización automática**: endpoint backend para limpiar destacados y portadas inválidas
- [x] **Optimización de imágenes**: resize automático con Cloudinary (400px, 800px, 1200px)
- [x] **Admin optimizado**: filtra por categoría para evitar lag con 200+ productos

## Schema de Base de Datos

El modelo de producto incluye los siguientes campos adicionales:

```javascript
{
  visitas: Number (default: 0),
  destacadoOrden: Number (default: 0),
  creadoAt: Date (default: Date.now)
}
```

### Endpoints adicionales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| PUT | `/api/productos/:id/visita` | Incrementar visitas del producto |
| PUT | `/api/productos/:id/destacado` | Actualizar destacadoOrden del producto |
| POST | `/api/sanitizar` | Limpiar destacados inválidos y portadas huérfanas |

## Pendiente / Mejoras Futuras

- [ ] Tests automatizados
- [ ] PWA (manifest, service worker)
- [ ] SEO (meta tags dinámicas)
- [ ] Autenticación de clientes
- [ ] Historial de pedidos
- [ ] Notificaciones por email
- [ ] Docker

## Migración a Cloudflare Pages (Próximo paso)

### Objetivo
Migrar el frontend de GitHub Pages a Cloudflare Pages para mayor velocidad (CDN global) y mejor control de cache.

### Ventajas de Cloudflare Pages vs GitHub Pages

| Característica | GitHub Pages | Cloudflare Pages |
|----------------|-------------|------------------|
| Velocidad | Buena | **Excelente** (CDN global) |
| Cache | Agresiva, a veces molesta | **Más control** |
| Deploy | Automático con push | Automático con push |
| SSL (https) | Forzado, a veces conflictos | **Nativo y perfecto** |
| Dominio custom | Funciona | **Funciona mejor** |

### Checklist para el día de la migración

#### Paso 1: Crear proyecto en Cloudflare Pages
1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Pages** → **Create a project**
2. Conectar con el repo `karaz-store` de GitHub
3. Build settings:
   - **Build command:** (dejar vacío, son archivos estáticos)
   - **Build output:** `/` (raíz)
4. Deploy

#### Paso 2: Conectar dominio `karazvzla.com`
1. En Cloudflare Pages → tu proyecto → **Custom domains**
2. Agregar: `karazvzla.com` y `www.karazvzla.com`
3. Cloudflare detecta que ya tenés el dominio en tu cuenta y configura DNS automáticamente

#### Paso 3: Verificar
- `https://karazvzla.com` → ¿Carga la tienda? ✅
- `https://www.karazvzla.com` → ¿Redirige a sin www? ✅
- Admin → ¿Funciona? ✅
- Backend API → ¿Responde? ✅

#### Paso 4: Invalidar cache (CRÍTICO)
Cambiar versión de assets para forzar recarga en todos los clientes:
```html
<!-- En index.html, product.html, cart.html, admin.html -->
<link rel="stylesheet" href="styles.css?v=37">
<script src="app.js?v=4"></script>
```

#### Paso 5: Redirigir GitHub Pages viejo (opcional)
Agregar en el repo `karaz-store` un archivo `index.html` en la raíz que redirija:
```html
<meta http-equiv="refresh" content="0; url=https://karazvzla.com">
```

### ⚠️ Precauciones
- Hacer la migración en **horario tranquilo** (ej: domingo a la mañana)
- **No en horario de ventas**
- Si algo sale mal, se puede volver a GitHub Pages en 5 minutos cambiando el DNS
- Avisar a la dueña que puede haber 5-30 minutos de indisponibilidad

### Flujo completo del proyecto

| Etapa | Estado | Fecha estimada |
|-------|--------|----------------|
| Coming soon en `karazvzla.com` | ✅ Hecho | Abril 2026 |
| Carga de productos (admin) | 🔄 En curso | 1-2 semanas |
| Migración a Cloudflare Pages | ⏳ Pendiente | Cuando estén los 200 productos |
| Go live oficial | ⏳ Pendiente | Post-migración |

## Notas de Desarrollo

### Repositorios (¡IMPORTANTE!)

Hay **DOS repositorios** separados:

| Repo | URL | Contenido | Deploy |
|------|-----|-----------|--------|
| `karaz-store` | `github.com/JoseMota0190/karaz-store` | Frontend (HTML, CSS, JS) | GitHub Pages |
| `jm-catalogos-web` | `github.com/JoseMota0190/jm-catalogos-web` | Backend (server.js, API) | Render |

**Para hacer push del backend:**
```bash
# Crear rama temporal desde backend remote
git checkout -b backend-deploy backend/main
# Copiar cambios del backend desde main
git checkout main -- backend/server.js
git commit -m "fix: ..."
git push backend backend-deploy:main
# Volver a main
git checkout main
```

**Para deploy manual en Render:**
1. Andá a [dashboard.render.com](https://dashboard.render.com)
2. Servicio: `aguamarina-backend-q7gd`
3. Tocá "Manual Deploy" → "Clear build cache & deploy"

### Configuración general

- El frontend usa fetch al backend en `https://aguamarina-backend-q7gd.onrender.com`
- Si el backend no responde, usa fallback a `productos.json` local
- El precio se formatea como `Ref. XX$` (línea 54 app.js)
- El idioma es español hardcodeado
- El admin tiene 3 modos: Nuevo producto, Editar (con modal y grouped view), Eliminar ( grouped view)