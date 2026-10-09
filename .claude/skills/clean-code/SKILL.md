---
name: clean-code
description: Principios Clean Code y separación de responsabilidades para Recaudo-Pro-Admin (Next.js + TypeScript, arquitectura hexagonal por feature). Úsalo SIEMPRE antes de crear, modificar o refactorizar cualquier archivo .tsx/.ts en src/, al revisar código, o cuando el usuario pida limpiar, refactorizar o eliminar código muerto.
---

# Clean Code — Recaudo-Pro-Admin (Next.js)

## La Regla de Oro: Separación de Responsabilidades

> **Los archivos `.tsx` son exclusivamente de presentación (UI).**
> La lógica vive en **hooks** (`presentation/hooks/*.ts`) o en archivos **`.ts`** (use cases, services, repositories, utils).

| Capa | Ubicación | Qué contiene | Qué NO contiene |
|---|---|---|---|
| **Ruta** | `src/app/**/page.tsx` | Solo importa y renderiza la página del feature | Lógica, estado, fetch |
| **Presentación UI** | `features/*/presentation/{pages,components}/*.tsx` | JSX, props, llamada a un hook, estilos | `fetch`, `apiClient`, cálculos, filtros, transformaciones, `useEffect` con lógica de negocio |
| **Hooks** | `features/*/presentation/hooks/use*.ts` | Estado de UI, orquestación (swr/zustand), handlers | JSX, llamadas HTTP directas (usa use cases) |
| **Aplicación** | `features/*/application/useCases/*.ts` | Casos de uso: coordinan dominio + puerto | React, JSX, hooks |
| **Dominio** | `features/*/domain/{models,services,port}/*.ts` | Tipos, **funciones puras** de negocio (saldos, mora, totales), interfaces de repositorio | React, HTTP, `localStorage`, `Date.now()` implícito |
| **Infraestructura** | `features/*/infrastructure/repositories/*.ts` | Implementación del puerto con `apiClient`, mapeo DTO ↔ modelo | Lógica de negocio, React |
| **Compartido** | `src/shared/{utils,config,hooks,components}` | Utilidades genéricas reutilizables por 2+ features | Código específico de un feature |
| **Proxy API** | `src/app/api/**/route.ts` | Solo reenviar con `handleProxy` | Lógica de negocio |

### Ejemplo

```tsx
// ❌ MAL — lógica en el .tsx
export function CreditsPage() {
  const [credits, setCredits] = useState<Credit[]>([]);
  useEffect(() => { apiClient.get('/credits').then(r => setCredits(r.data)); }, []);
  const overdue = credits.filter(c => c.balance > 0 && new Date(c.dueDate) < new Date());
  return <Table data={overdue} />;
}

// ✅ BIEN — el .tsx solo pinta
export function CreditsPage() {
  const { overdueCredits, isLoading } = useOverdueCredits();
  if (isLoading) return <LoadingScreen />;
  return <Table data={overdueCredits} />;
}
```
```ts
// presentation/hooks/useOverdueCredits.ts
export function useOverdueCredits() {
  const { data = [], isLoading } = useSWR('credits', () => creditUseCase.getAll());
  return { overdueCredits: filterOverdue(data, new Date()), isLoading };
}

// domain/services/creditRules.ts — función pura, testeable
export const isOverdue = (c: Credit, today: Date) => c.balance > 0 && new Date(c.dueDate) < today;
export const filterOverdue = (credits: Credit[], today: Date) => credits.filter(c => isOverdue(c, today));
```

## Principios Clean Code Aplicados

1. **Funciones pequeñas y puras**
   - Una función hace **una sola cosa**. Objetivo ≤ 20 líneas, máximo 40.
   - Las reglas de negocio son **puras**: mismo input → mismo output, sin efectos secundarios. Fechas y "hoy" se reciben por parámetro.
   - Máximo 3 parámetros; si hay más, usar un objeto tipado.
2. **Componentes pequeños**
   - Un `.tsx` con más de ~150 líneas se divide en subcomponentes.
   - Las columnas, modales y formularios van en su propio archivo dentro de `components/`.
3. **Nombres que explican**
   - `calculateRemainingBalance`, no `calc`. Los booleanos llevan prefijo `is/has/can`.
   - Los hooks empiezan con `use`, los use cases terminan en `UseCase`, los repositorios en `Repository`.
4. **Sin duplicación (DRY)**
   - Si la misma lógica aparece 2 veces, se extrae a `domain/services` (negocio) o a `shared/utils` (genérica).
5. **Tipado estricto**
   - Prohibido `any`; usar `unknown` + type guards.
   - Los modelos de dominio son distintos de los DTO del API; el mapeo se hace en el repositorio.
6. **Sin efectos ocultos**
   - Nada de `setInterval`/`setTimeout` que manipulen el DOM.
   - Nada de `document.querySelector` en componentes.
7. **Errores explícitos**
   - Los repositorios lanzan errores tipados y los hooks exponen `error`.
   - Nunca `catch {}` vacío.
8. **Sin ruido**
   - No commitear `console.log`, código comentado ni TODOs sin ticket.

## Código Sucio: lo que no funciona se limpia

Si algo está muerto, roto o duplicado, **se elimina, no se comenta**. Pendientes conocidos en este repo:

- [ ] Restos de Vite: `nginx.conf`, `docker-entrypoint.sh`, `src/vite-env.d.ts`, `dist/` y los `ARG VITE_*` del Dockerfile.
- [ ] Dependencias sin uso: `@supabase/supabase-js`, `zod`, `@hookform/resolvers`, `click-to-react-component`.
- [ ] Archivos de log en el repo: `build_log*.txt`, `install_log.txt`, `out.txt`.
- [ ] Lógica de cálculo dentro de `CashSessionFlowPage.tsx` y `DashboardRepository.ts`: moverla a `domain/services`.
- [ ] Páginas con carga de datos dentro del `.tsx` (ej. `ClientMapPage.tsx`, `WithdrawalsPage.tsx`, `LoginPage.tsx`): moverla a hooks.

Sesión del panel (no romper): los tokens viven en cookies httpOnly (`src/shared/server/session.ts`);
el navegador nunca maneja tokens. El proxy (`src/shared/utils/apiProxy.ts`) adjunta el token y renueva
la sesión; `src/middleware.ts` protege `/admin`. Nunca guardar tokens en `localStorage` ni en zustand.

## Refactorización Limpia: Separación Estricta

Al refactorizar un archivo:

1. **Identifica** las responsabilidades mezcladas: UI, estado, HTTP, reglas, formato.
2. **Extrae primero las funciones puras** a `domain/services/*.ts` y nómbralas por lo que hacen.
3. **Mueve el estado y los efectos** a un hook `use<Feature><Acción>.ts`.
4. **Mueve el acceso al API** al repository e invócalo desde un use case.
5. **Deja el `.tsx`** solo con: hook → condiciones de render (loading/error/empty) → JSX.
6. **No cambies el comportamiento** en el mismo paso: refactor y feature van en commits separados.
7. **Verifica:** `pnpm exec tsc --noEmit` sin errores y la pantalla funciona igual.

## Checklist antes de terminar

- [ ] Ningún `.tsx` importa `apiClient`, `fetch` ni repositorios.
- [ ] Ningún `.tsx` contiene `.filter/.reduce/.map` de negocio, cálculos ni formateo complejo (eso va al hook o a una utilidad).
- [ ] Las funciones nuevas son pequeñas, con nombre descriptivo, y las de negocio son puras.
- [ ] No hay `any`, `console.log`, código comentado ni imports sin uso.
- [ ] El código muerto que tocaste quedó eliminado.
- [ ] `tsc --noEmit` pasa.
