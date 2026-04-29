# Karaz Store

E-commerce de bisutería artesanal con pedidos por WhatsApp.

## Quick Start

### 1. Backend

```bash
cd backend
npm install
# Crear .env con las variables requeridas (ver AGENTS.md)
npm run dev
```

### 2. Frontend

Simple abre `index.html` en tu navegador.

## Estructura

```
├── index.html      # Catálogo principal
├── product.html    # Detalle de producto
├── cart.html       # Carrito de compras
├── admin.html      # Panel admin (CRUD)
├── app.js          # Lógica JS
├── styles.css      # Estilos
└── backend/        # API Node.js
```

## Configuración

Ver `AGENTS.md` para detalles de configuración de variables de entorno y API.

## Tech Stack

- Frontend: Vanilla JS, CSS custom
- Backend: Express + MongoDB
- Imágenes: Cloudinary
- Payments: WhatsApp (manual)

## License

ISC