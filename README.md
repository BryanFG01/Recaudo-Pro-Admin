# RecaudoPro Admin - Panel de Administración Web

Panel web de administración para RecaudoPro construido con React, TypeScript, Vite y arquitectura hexagonal.

## 🏗️ Arquitectura

Este proyecto sigue una arquitectura hexagonal (features first) con las siguientes capas:

- **Domain**: Lógica de negocio pura, sin dependencias externas
- **Application**: Casos de uso que orquestan el dominio
- **Infrastructure**: Implementaciones de adaptadores (API del backend)
- **Presentation**: Componentes React y hooks

## 🚀 Instalación

```bash
npm install
```

## ⚙️ Configuración

1. Copia `.env.example` a `.env` en la raíz: `cp .env.example .env`
2. Edita `.env` y asigna la URL de tu backend:

```env
VITE_BACK_URL=https://tu-backend.ejemplo.com
```

**Nota:** La web no tiene contacto directo con Supabase; Dashboard, Recaudos, Créditos, Clientes y Auth usan la API del backend (`VITE_BACK_URL`). Tras cambiar `.env`, reinicia el servidor (`pnpm run dev`).

### Endpoints que debe exponer el backend

El frontend llama a la base `VITE_BACK_URL` con estos recursos (ajusta paths/query si tu API es distinta):

- **Dashboard:** `GET /api/dashboard/stats?businessId=&startDate=&endDate=`
- **Clientes:** `GET /api/clients/business/:id?user_id=`, `POST /api/clients`, `PATCH /api/clients/:id`, `DELETE /api/clients/:id`
- **Créditos:** `GET /api/credits`, `GET /api/credits?businessId=&clientId=&startDate=&endDate=&userEmail=`, `GET /api/credits/:id`, `POST /api/credits`, `PATCH /api/credits/:id`
- **Recaudos:** `GET /api/collections`, `GET /api/collections?businessId=&clientId=&startDate=&endDate=&payment_method=&userEmail=`, `GET /api/collections?clientId=`, `GET /api/collections?creditId=`, `GET /api/collections?limit=`, `POST /api/collections`
- **Auth/Usuarios:** según tu implementación (ej. `/api/users/business/:id`, login, etc.)

## 🏃 Desarrollo

```bash
npm run dev
```

## 📦 Build

```bash
npm run build
```

## 🐳 Producción (Docker)

La imagen puede recibir la URL del backend **en tiempo de ejecución** (sin recompilar):

```bash
docker build -t recaudo-pro-admin .
docker run -p 80:80 -e VITE_BACK_URL=https://tu-backend.ejemplo.com recaudo-pro-admin
```

En **Dokploy** (tu VPS): definí la variable de entorno `VITE_BACK_URL` en el **servicio/contenedor** (no solo en build). El entrypoint reemplaza el placeholder en `index.html` al arrancar.

Si preferís fijar la URL en el build: pasá `--build-arg VITE_BACK_URL=https://...` al hacer `docker build`.

## 📋 Features

- ✅ Autenticación
- ✅ Dashboard con estadísticas
- ✅ Gestión de Clientes
- ✅ Gestión de Créditos
- ✅ Gestión de Recaudos
- ✅ Exportación a Excel
- ✅ Componentes dinámicos y reutilizables

