# RecaudoPro Admin - Panel de Administración Web

Panel web de administración para RecaudoPro construido con React, TypeScript, Vite y arquitectura hexagonal.

## 🏗️ Arquitectura

Este proyecto sigue una arquitectura hexagonal (features first) con las siguientes capas:

- **Domain**: Lógica de negocio pura, sin dependencias externas
- **Application**: Casos de uso que orquestan el dominio
- **Infrastructure**: Implementaciones de adaptadores (Supabase, APIs)
- **Presentation**: Componentes React y hooks

## 🚀 Instalación

```bash
npm install
```

## ⚙️ Configuración

1. Crea un archivo `.env` en la raíz del proyecto
2. Agrega las siguientes variables de entorno:

```env
VITE_SUPABASE_URL=https://zuksfgjhfdrgeoxtvvyn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1a3NmZ2poZmRyZ2VveHR2dnluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwNzAyODAsImV4cCI6MjA3ODY0NjI4MH0.rPZWKSJA5vHScr-o4f5e4gwNs1cxpRMYjPV-X6CkNxo
```

**Nota:** Después de crear o modificar el archivo `.env`, debes reiniciar el servidor de desarrollo (`npm run dev`).

## 🏃 Desarrollo

```bash
npm run dev
```

## 📦 Build

```bash
npm run build
```

## 📋 Features

- ✅ Autenticación
- ✅ Dashboard con estadísticas
- ✅ Gestión de Clientes
- ✅ Gestión de Créditos
- ✅ Gestión de Recaudos
- ✅ Exportación a Excel
- ✅ Componentes dinámicos y reutilizables

