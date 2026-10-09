# Recaudo Pro Admin — Guía de diseño

> Adaptación para el panel administrativo del sistema editorial-brutalista de la web (`RecaudoProWebStatic/DESIGN.MD`).
> Monocromo, plano y con la tipografía como protagonista, ajustado a un dashboard con tablas y formularios.

**Tema por defecto:** claro. El oscuro existe como alternativa (botón de tema).

## 1. Dónde vive cada token

| Qué | Archivo |
|---|---|
| Colores (variables shadcn en HSL) | `src/index.css` → `:root` y `.dark` |
| Fuentes, radios, acentos `mint`/`voltage`, sombras planas | `tailwind.config.js` |
| Carga de fuentes (`next/font`) | `src/app/layout.tsx` |

**Nunca uses colores fijos** (`text-white`, `bg-blue-500`, `#0a0a0b`…) en features. Usa los tokens: `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `bg-accent`, `bg-mint`.

## 2. Colores

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `background` | `#e5e5e5` canvas | `#000000` | Fondo de página |
| `card` / `popover` | `#ffffff` | `#1a1a1a` | Tarjetas, tablas, modales |
| `foreground` | `#000000` | `#ffffff` | Texto principal |
| `muted-foreground` | `#444444` slate | `#979797` smoke | Texto secundario, etiquetas |
| `secondary` / `muted` | `#f3f3f3` mist | `#2f2f2f` graphite | Paneles internos, cabecera de tabla, inputs |
| `primary` | `#000000` | `#d1ffca` mint | CTA principal |
| `accent` | `#d1ffca` mint | `#2f2f2f` | Hover, selección |
| `input` / `border` | `#c6c6c6` / `#dedede` | graphite | Bordes de inputs y separadores de tabla |
| `sidebar-*` | Bloque negro, activo en mint | Igual | Navegación lateral (Inverted Card) |

**Excepción del dashboard:** `success`, `warning`, `error` y `destructive` se mantienen porque comunican estado financiero (al día, en mora, error). Úsalos solo en indicadores pequeños, nunca como fondos grandes.

## 3. Tipografía

| Rol | Clase | Fuente |
|---|---|---|
| Título de página (`h1`) | Automático (estilo base en `index.css`) | Barlow Condensed 700, MAYÚSCULAS. **Es el único texto en mayúsculas.** |
| Título de sección (`h2`) | `text-lg font-semibold` | Inter 600, tipo oración ("Saldos por cobrador") |
| Cifras de KPI | `text-3xl font-semibold tracking-tight tabular-nums` | Inter 600 |
| Etiquetas de tarjeta, cabeceras de tabla, labels de formulario | `text-sm font-medium text-muted-foreground` | Inter 500, tipo oración |
| Texto secundario, ayudas | `text-sm text-muted-foreground` (mínimo `text-xs`) | Inter 400 |
| Referencias e IDs (nº de transacción, códigos) | `font-mono text-xs` | JetBrains Mono, **solo aquí** |

**Tono "humano", no robótico.** Por eso está prohibido en etiquetas lo siguiente:
- Mayúsculas forzadas (`uppercase`).
- Espaciado extremo (`tracking-widest`, `tracking-[0.2em]`).
- Textos de 8 a 11 px.
- `font-black`.

Escribe los textos como se hablan: "Clientes en mora", no "CLIENTES EN MORA".

## 4. Formas y elevación

- **Sin sombras.** La escala `shadow-*` está neutralizada en `tailwind.config.js`. No uses `shadow-[...]` arbitrarios.
- **Sin degradados ni blur** (`bg-gradient-*`, `backdrop-blur-*`, glows).
- **Profundidad por contraste de superficie:** canvas → tarjeta blanca → bloque negro.
- **Radios:**
  - `rounded-card`: tarjetas, 24px.
  - `rounded-tag`: píldoras y badges, 64px.
  - `rounded-lg`: botones e inputs, 8px.
- **Tarjetas sin borde.** Usa bordes solo como separadores en tablas y en inputs.

## 5. Componentes

| Componente | Regla |
|---|---|
| `Button` default | Negro sobre canvas (mint en oscuro), radio 8px |
| `Button` outline | Ghost Border: 1.5px slate; al pasar el mouse se invierte |
| `Badge` | Píldora mint, `text-xs font-medium`, sin mayúsculas |
| `Card` | Blanca, radio 24px, sin borde ni sombra |
| `StatsCard` | **Modelo único de tarjeta de KPI** (Dashboard, Flujo…). Arriba va el icono en un chip mint (o del color del estado) con la etiqueta; abajo, la cifra grande y el detalle. `premium-dark` es la tarjeta invertida (negra) para el KPI principal. No crees tarjetas KPI propias en las páginas |
| `DynamicTable` | Cabecera mist con etiquetas en tipo oración; filas con separadores finos; número de página activo en negro |
| `AppSidebar` | Bloque negro, logo condensado, ítems en tipo oración, ítem activo con icono mint |
| Login | Mitad izquierda en bloque negro con titular gigante; formulario en tarjeta blanca sobre canvas |

## 6. Checklist al crear o modificar una pantalla

- [ ] Sin colores fijos: solo tokens.
- [ ] Sin `shadow-*`, degradados ni blur.
- [ ] `h1` de página sin clases de fuente: el estilo base ya lo pone condensado y en mayúsculas.
- [ ] Etiquetas y cabeceras en tipo oración (Inter), sin `uppercase` ni `tracking-widest`, y sin texto menor a 12px.
- [ ] Los KPI usan `StatsCard`, no una tarjeta propia.
- [ ] Funciona en tema claro y oscuro.
