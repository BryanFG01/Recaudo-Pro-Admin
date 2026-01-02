# Arquitectura Hexagonal por Feature - React + Vite + TypeScript + shadcn/ui

## 📋 Estructura del Proyecto

Este proyecto sigue una **Arquitectura Hexagonal (Ports & Adapters)** organizada por features, optimizada para React + Vite + TypeScript + Supabase.

```
src/
├── features/              # Módulos de negocio (features)
│   └── [feature-name]/   # Ej: agents, clients, credits, collections
│       ├── domain/        # QUÉ hace (entidades, reglas de negocio)
│       ├── infrastructure/ # CÓMO lo hace (APIs, DB, servicios externos)
│       ├── presentation/  # QUÉ muestra (componentes visuales)
│       └── hooks/         # LÓGICA de presentación (estado, efectos, orquestación)
│
├── shared/               # Código compartido entre features
│   ├── components/       # Componentes reutilizables (Layout, Sidebar, etc.)
│   ├── config/          # Configuración (Supabase, etc.)
│   ├── types/           # Tipos compartidos
│   └── utils/           # Utilidades compartidas
│
└── App.tsx              # Configuración de rutas y providers globales
```

---

## 🏗️ Estructura de un Feature

Cada feature debe seguir esta estructura estricta:

```
features/[feature-name]/
├── domain/                    # Capa de Dominio (QUÉ hace)
│   ├── models/               # Entidades y modelos de datos
│   │   ├── [Entity].ts      # Ej: Agent.ts, Client.ts
│   │   └── index.ts
│   ├── port/                 # Interfaces (contratos)
│   │   ├── I[Entity]Repository.ts
│   │   └── index.ts
│   ├── services/             # Servicios de dominio (reglas de negocio)
│   │   ├── [Entity]Service.ts
│   │   └── index.ts
│   └── index.ts
│
├── infrastructure/            # Capa de Infraestructura (CÓMO lo hace)
│   └── repositories/         # Implementación de repositorios
│       ├── [Entity]Repository.ts  # Implementación con Supabase
│       └── index.ts
│
├── presentation/             # Capa de Presentación (QUÉ muestra)
│   ├── pages/               # Páginas/Views
│   │   ├── [Entity]Page.tsx
│   │   └── index.ts
│   ├── components/           # Componentes específicos del feature
│   │   ├── [Entity]Form.tsx
│   │   └── index.ts
│   └── hooks/               # Hooks de presentación (LÓGICA de UI)
│       ├── use[Entity].ts   # Orquestación, estado, efectos
│       └── index.ts
│
└── index.ts                  # Exportaciones públicas del feature
```

---

## 📦 Capas de la Arquitectura

### 1. **Domain** (Dominio)

**Responsabilidad**: Contiene la lógica de negocio pura, sin dependencias externas.

- **`models/`**: Entidades y DTOs (Data Transfer Objects)

  - Define la estructura de datos
  - Tipos TypeScript puros
  - Sin dependencias de frameworks

- **`port/`**: Interfaces (contratos)

  - Define QUÉ se necesita hacer
  - No define CÓMO se hace
  - Ejemplo: `IAgentRepository`, `IClientRepository`

- **`services/`**: Servicios de dominio
  - Contiene reglas de negocio
  - Valida datos
  - Orquesta operaciones del dominio
  - NO tiene dependencias de infraestructura

**Ejemplo:**

```typescript
// domain/models/Agent.ts
export interface Agent {
  id: string
  name: string
  email: string
  business_id: string
  role: 'admin' | 'cobrador' | 'supervisor'
}

// domain/port/IAgentRepository.ts
export interface IAgentRepository {
  getAgents(businessId: string): Promise<Agent[]>
  createAgent(agent: CreateAgentRequest, businessId: string): Promise<Agent>
}

// domain/services/AgentService.ts
export class AgentService {
  constructor(private repository: IAgentRepository) {}

  async createAgent(request: CreateAgentRequest, businessId: string): Promise<Agent> {
    // Validaciones de negocio
    if (!request.email) throw new Error('Email requerido')
    // Lógica de negocio
    return this.repository.createAgent(request, businessId)
  }
}
```

---

### 2. **Infrastructure** (Infraestructura)

**Responsabilidad**: Implementa los contratos definidos en el dominio usando tecnologías específicas (Supabase).

- **`repositories/`**: Implementación concreta
  - Usa Supabase para acceder a datos
  - Implementa las interfaces del dominio
  - Maneja errores de infraestructura

**Ejemplo:**

```typescript
// infrastructure/repositories/AgentRepository.ts
import { supabase } from '@/shared/config/supabase'
import { IAgentRepository } from '../../domain/port'
import { Agent } from '../../domain/models'

export class AgentRepository implements IAgentRepository {
  async getAgents(businessId: string): Promise<Agent[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('business_id', businessId)
      .eq('role', 'cobrador')

    if (error) throw new Error(`Error: ${error.message}`)
    return (data || []) as Agent[]
  }
}
```

---

### 3. **Presentation** (Presentación)

**Responsabilidad**: Interfaz de usuario y lógica de presentación.

- **`pages/`**: Páginas/Views

  - Componentes de página completos
  - Usan hooks para obtener datos
  - Renderizan componentes

- **`components/`**: Componentes específicos del feature

  - Componentes reutilizables dentro del feature
  - No deben usarse fuera del feature

- **`hooks/`**: Hooks de presentación
  - Orquestan la lógica de UI
  - Gestionan estado local
  - Llaman a servicios del dominio
  - Manejan efectos (useEffect, etc.)

**Ejemplo:**

```typescript
// presentation/hooks/useAgents.ts
import { useState, useEffect } from 'react'
import { AgentService } from '../../domain/services'
import { AgentRepository } from '../../infrastructure/repositories'

export const useAgents = (businessId: string) => {
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const repository = new AgentRepository()
        const service = new AgentService(repository)
        const data = await service.getAgents(businessId)
        setAgents(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setIsLoading(false)
      }
    }

    if (businessId) {
      loadAgents()
    }
  }, [businessId])

  return { agents, isLoading, error }
}

// presentation/pages/AgentsPage.tsx
export default function AgentsPage() {
  const { businessId } = useAuthStore()
  const { agents, isLoading, error } = useAgents(businessId)

  if (isLoading) return <div>Cargando...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h1>Agentes</h1>
      <DynamicTable data={agents} columns={agentColumns} />
    </div>
  )
}
```

---

## 🔐 Autenticación y Permisos Globales

### Estructura Global

```
src/
├── features/
│   └── auth/              # Feature de autenticación (GLOBAL)
│       ├── domain/
│       ├── infrastructure/
│       └── presentation/
│           ├── store/     # Zustand store global
│           ├── hooks/     # useAuth hook global
│           └── pages/      # LoginPage
│
└── shared/
    ├── components/
    │   └── Layout/        # Layout, Sidebar, Header (GLOBALES)
    │       ├── Layout.tsx
    │       ├── Sidebar.tsx # Navegación con permisos
    │       └── Header.tsx
    └── hooks/
        └── usePermissions.ts  # Hook de permisos global
```

### Sistema de Permisos

Los permisos se basan en el **rol del usuario** obtenido de Supabase:

```typescript
// shared/hooks/usePermissions.ts
export const usePermissions = () => {
  const { user } = useAuthStore()

  const canAccess = (requiredRole: string | string[]) => {
    if (!user) return false
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    return roles.includes(user.role)
  }

  return {
    isAdmin: user?.role === 'admin',
    isSupervisor: user?.role === 'supervisor',
    isCobrador: user?.role === 'cobrador',
    canAccess
  }
}
```

### Sidebar con Permisos

El Sidebar debe filtrar las opciones según los permisos del usuario:

```typescript
// shared/components/Layout/Sidebar.tsx
const menuItems = [
  {
    path: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'supervisor', 'cobrador'] // Todos pueden ver
  },
  {
    path: '/admin/users',
    label: 'Admin Usuarios',
    icon: UserCog,
    roles: ['admin'] // Solo admin
  }
  // ...
]
```

---

## 🎯 Reglas de Desarrollo

### ✅ DO (Hacer)

1. **Separación de responsabilidades**

   - Domain: Solo lógica de negocio
   - Infrastructure: Solo acceso a datos
   - Presentation: Solo UI y orquestación

2. **Dependencias unidireccionales**

   - Presentation → Domain → Infrastructure
   - Domain NO debe depender de Infrastructure
   - Domain NO debe depender de Presentation

3. **Uso de interfaces (Ports)**

   - Domain define interfaces
   - Infrastructure implementa interfaces
   - Presentation usa interfaces (no implementaciones)

4. **Hooks para lógica de UI**

   - Toda la lógica de presentación en hooks
   - Páginas solo renderizan
   - Hooks orquestan servicios

5. **Supabase en Infrastructure**
   - Solo repositorios acceden a Supabase
   - Usar funciones RPC cuando sea posible
   - Manejar errores de RLS

### ❌ DON'T (No hacer)

1. **NO mezclar capas**

   - NO poner lógica de negocio en componentes
   - NO acceder a Supabase desde páginas
   - NO poner validaciones en repositorios

2. **NO crear dependencias circulares**

   - Features NO deben importarse entre sí
   - Usar `shared/` para código compartido

3. **NO duplicar código**

   - Componentes comunes en `shared/components/`
   - Utilidades en `shared/utils/`
   - Tipos compartidos en `shared/types/`

4. **NO hardcodear valores**
   - Usar constantes
   - Configuración en `shared/config/`

---

## 📝 Ejemplo Completo: Feature "Agents"

```
features/agents/
├── domain/
│   ├── models/
│   │   ├── Agent.ts
│   │   └── index.ts
│   ├── port/
│   │   ├── IAgentRepository.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── AgentService.ts
│   │   └── index.ts
│   └── index.ts
│
├── infrastructure/
│   └── repositories/
│       ├── AgentRepository.ts
│       └── index.ts
│
├── presentation/
│   ├── pages/
│   │   ├── AgentsPage.tsx
│   │   └── index.ts
│   ├── components/
│   │   ├── AgentForm.tsx
│   │   └── index.ts
│   └── hooks/
│       ├── useAgents.ts
│       └── index.ts
│
└── index.ts
```

---

## 🔄 Flujo de Datos

```
Usuario → Page → Hook → Service → Repository → Supabase
                ↓
            Estado Local
                ↓
            Componentes
```

1. **Usuario interactúa** con la página
2. **Página** llama a un hook
3. **Hook** crea servicio y repositorio
4. **Servicio** valida y orquesta
5. **Repositorio** accede a Supabase
6. **Datos** fluyen de vuelta al hook
7. **Hook** actualiza estado
8. **Página** re-renderiza

---

## 🛠️ Integración con Supabase

### Configuración

```typescript
// shared/config/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### Uso en Repositorios

```typescript
// infrastructure/repositories/AgentRepository.ts
import { supabase } from '@/shared/config/supabase'

export class AgentRepository implements IAgentRepository {
  async getAgents(businessId: string): Promise<Agent[]> {
    // Intentar RPC primero (bypasea RLS)
    try {
      const { data, error } = await supabase.rpc('get_agents_by_business_id', {
        p_business_id: businessId
      })
      if (!error && data) return data as Agent[]
    } catch (err) {
      console.warn('RPC no disponible, usando consulta directa')
    }

    // Fallback: consulta directa
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('business_id', businessId)
      .eq('role', 'cobrador')

    if (error) throw new Error(`Error: ${error.message}`)
    return (data || []) as Agent[]
  }
}
```

---

## 📚 Componentes Globales

### Layout y Sidebar

- **`shared/components/Layout/`**: Componentes globales de layout
  - `Layout.tsx`: Wrapper principal
  - `Sidebar.tsx`: Navegación con permisos
  - `Header.tsx`: Header de la aplicación

### Componentes Compartidos

- **`shared/components/DynamicTable/`**: Tabla reutilizable
- **`shared/components/Filters/`**: Filtros reutilizables
- **`shared/components/StatsCard/`**: Tarjetas de estadísticas

---

## 🚀 Crear un Nuevo Feature

1. **Crear estructura de carpetas**

   ```bash
   mkdir -p features/[feature-name]/{domain/{models,port,services},infrastructure/repositories,presentation/{pages,components,hooks}}
   ```

2. **Definir modelos** (`domain/models/`)
3. **Definir interfaces** (`domain/port/`)
4. **Implementar servicios** (`domain/services/`)
5. **Implementar repositorio** (`infrastructure/repositories/`)
6. **Crear hooks** (`presentation/hooks/`)
7. **Crear páginas** (`presentation/pages/`)
8. **Agregar rutas** en `App.tsx`
9. **Agregar al Sidebar** (con permisos)

---

## 📖 Referencias

- [Arquitectura Hexagonal](https://alistair.cockburn.us/hexagonal-architecture/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Supabase Docs](https://supabase.com/docs)
