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
- [x] Sistema de ordenamiento de productos: destacados (2 por categoría) → recientes (4) → por visitas
- [x] Filtros de precio (Más relevantes, Menor-Mayor, Mayor-Menor)
- [x] Imágenes de cabecera por categoría (del primer producto)
- [x] Contador de visitas por producto
- [x] UI mejorada del admin: navbar granate, barra de categorías, logo, 3 botones (Nuevo/Editar/Eliminar)
- [x] Vista agrupada por categoría con ordenamiento por precio en modos editar/eliminar
- [x] Botones "Ver tienda" (verde) y "Salir" (rojo) de mayor tamaño
- [x] Favicon SVG en todas las páginas
- [x] Títulos dinámicos en cada página
- [x] Estilo mejorado en página del carrito (centrado, mejor tipografía, estado vacío)
- [x] Logo en página del carrito (K-karaz.png)
- [x] Tipografía Playfair Display para "Experiencia KARAZ"

## Schema de Base de Datos

El modelo de producto incluye los siguientes campos adicionales:

```javascript
{
  visitas: Number (default: 0),
  destacadoOrden: Number (default: 0),
  creadoAt: Date (default: Date.now)
}
```

### Endpoint adicional

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| PUT | `/api/productos/:id/visita` | Incrementar visitas del producto |

## Pendiente / Mejoras Futuras

- [ ] Tests automatizados
- [ ] PWA (manifest, service worker)
- [ ] SEO (meta tags dinámicas)
- [ ] Autenticación de clientes
- [ ] Historial de pedidos
- [ ] Notificaciones por email
- [ ] Docker

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