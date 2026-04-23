# Estructura del Proyecto — supastarter for Next.js

Este documento describe la organización del monorepo y el propósito de cada carpeta y fichero principal.

---

## Visión general

El proyecto es un **monorepo** gestionado con **pnpm workspaces** y orquestado con **Turborepo**. Contiene dos aplicaciones Next.js independientes y un conjunto de paquetes compartidos que proveen la lógica de negocio, la interfaz de usuario y los servicios de infraestructura.

```
/
├── apps/        → Aplicaciones Next.js que los usuarios visitan
├── packages/    → Código compartido: backend, UI, servicios
├── tooling/     → Configuración de herramientas de desarrollo
├── docs/        → Documentación del proyecto (este directorio)
├── turbo.json   → Orquestación del monorepo con Turborepo
├── pnpm-workspace.yaml → Declaración de paquetes del workspace
├── docker-compose.yml  → Base de datos local con Docker
└── .env.local   → Variables de entorno secretas (no se sube a git)
```

---

## `apps/` vs `packages/` — La distinción clave

Esta es la distinción más importante del monorepo:

### `apps/` — Se ejecutan, no se importan

Son aplicaciones completas que arrancan un servidor y sirven páginas web. **Consumen** código, no lo producen.

- Tienen rutas, páginas y layouts
- Se ejecutan con `next dev` / `next build`
- El usuario final las visita en el navegador
- **No pueden ser importadas** por otros paquetes

### `packages/` — Se importan, no se ejecutan

Son librerías internas. **Producen** código que las apps consumen. Por sí solos no hacen nada si los arrancas.

- No tienen rutas ni páginas
- Se importan con `import { algo } from "@repo/nombre"`
- Nunca interactúan directamente con el usuario
- **Pueden ser importados** por cualquier app o por otros paquetes

### Analogía

Piénsalo como una cocina:

- `packages/` son los **ingredientes y utensilios** (auth, base de datos, componentes UI...)
- `apps/` son los **platos terminados** que se sirven al cliente (el sitio de marketing, la app SaaS...)

### Por qué esta separación

Si la lógica de autenticación estuviera dentro de `apps/saas/`, la app de marketing no podría reutilizarla. Al vivir en `packages/auth/`, **cualquier app del monorepo puede importarla** sin duplicar código.

```
apps/marketing/  →  importa  →  packages/ui/
apps/saas/       →  importa  →  packages/auth/
apps/saas/       →  importa  →  packages/database/
apps/saas/       →  importa  →  packages/api/
```

---

## `apps/` — Aplicaciones

Cada app es un proyecto Next.js independiente con su propia configuración, rutas y dependencias.

### `apps/marketing/` — Sitio público · Puerto 3000

El sitio de cara al público. Es lo primero que ve un visitante.

**Contiene:**
- Landing page y páginas de producto
- Blog y changelog (contenido en MDX via `content-collections`)
- Páginas legales (privacidad, términos)
- Precios y planes
- Tests E2E con Playwright (`tests/`)

**Rutas:** `app/[locale]/` — soporta múltiples idiomas con prefijo de locale automático.

**Módulos:** `modules/home/`, `modules/blog/`, `modules/changelog/`, `modules/shared/`, `modules/analytics/`

---

### `apps/saas/` — Aplicación protegida · Puerto 3001

El producto en sí. Solo accesible para usuarios autenticados (salvo las rutas de login/registro).

**Rutas principales:**
- `app/(unauthenticated)/` — login, registro, recuperar contraseña, verificación 2FA
- `app/(authenticated)/` — todo el interior de la app: cuenta, organizaciones, ajustes, etc.
- `app/api/` — route handlers de Next.js (webhooks, etc.)

**Módulos:**
- `modules/auth/` — formularios y hooks de autenticación
- `modules/organizations/` — gestión de organizaciones (multi-tenant)
- `modules/settings/` — ajustes de usuario y cuenta
- `modules/payments/` — facturación y suscripciones
- `modules/admin/` — panel de administración
- `modules/ai/` — funcionalidades de IA
- `modules/onboarding/` — flujo de bienvenida para nuevos usuarios
- `modules/shared/` — componentes transversales (layout, navegación, notificaciones)
- `modules/i18n/` — configuración de idioma en la app

---

### `apps/docs/` — Sitio de documentación

Documentación técnica del producto, construida también con Next.js.

---

### `apps/mail-preview/` — Previsualización de emails

Herramienta de desarrollo para visualizar en el navegador las plantillas de email transaccionales antes de enviarlas. Muy útil al diseñar o modificar emails.

---

## `packages/` — Paquetes compartidos

Son librerías internas importadas desde las apps con el alias `@repo/*`. Ninguna es una app por sí misma; solo exportan código para ser consumido.

### `packages/api/` — Capa de API

Define todos los **procedimientos RPC** del backend usando **oRPC** (type-safe RPC). Cada módulo de negocio tiene sus propios procedimientos organizados en:

```
packages/api/modules/[feature]/
├── procedures/   → Implementación de cada acción (create, list, update…)
└── types.ts      → Schemas Zod y tipos TypeScript del módulo
```

**Tipos de procedimiento:**
- `publicProcedure` — sin autenticación
- `protectedProcedure` — requiere sesión activa
- `adminProcedure` — requiere rol de administrador

---

### `packages/auth/` — Autenticación

Configuración completa de **Better Auth**. Incluye:
- Login con email/contraseña
- Magic links (enlace por email)
- Passkeys (WebAuthn)
- OAuth (Google, GitHub)
- Autenticación de dos factores (2FA/OTP)
- Gestión de organizaciones y miembros
- Helpers de sesión para servidor (`getSession()`) y cliente (`useSession()`)

---

### `packages/database/` — Base de datos

Contiene el **esquema de la base de datos** y las queries. Soporta dos ORMs:
- **Prisma** — para proyectos que prefieren un ORM tradicional
- **Drizzle** — alternativa más ligera y type-safe

Las queries se organizan en `[orm]/queries/` y nunca se instancia el cliente directamente desde las apps; siempre se importa desde este paquete.

---

### `packages/ui/` — Componentes de interfaz

Librería de componentes visuales basada en **Shadcn UI** y **Radix UI**. Todos los componentes son accesibles por defecto. Se encuentran en `packages/ui/components/`.

| Componente | Descripción |
|---|---|
| `button.tsx` | Botón con variantes (`primary`, `secondary`, `outline`, `ghost`, `destructive`, `link`) y tamaños |
| `input.tsx` | Campo de texto |
| `textarea.tsx` | Campo de texto multilínea |
| `input-otp.tsx` | Campo para códigos OTP / 2FA |
| `form.tsx` | Wrapper para React Hook Form (labels, mensajes de error, etc.) |
| `label.tsx` | Etiqueta de formulario |
| `select.tsx` | Desplegable de selección |
| `switch.tsx` | Toggle on/off |
| `alert.tsx` | Mensajes de alerta (success, error, info) |
| `alert-dialog.tsx` | Diálogo de confirmación con overlay |
| `dialog.tsx` | Modal genérico |
| `sheet.tsx` | Panel lateral deslizante |
| `dropdown-menu.tsx` | Menú contextual desplegable |
| `popover.tsx` | Contenido flotante anclado a un elemento |
| `tooltip.tsx` | Tooltip al hacer hover |
| `tabs.tsx` | Navegación por pestañas |
| `accordion.tsx` | Secciones expandibles/colapsables |
| `card.tsx` | Tarjeta contenedora con header/body/footer |
| `avatar.tsx` | Avatar de usuario |
| `badge.tsx` | Etiqueta/chip de estado |
| `table.tsx` | Tabla de datos |
| `progress.tsx` | Barra de progreso |
| `skeleton.tsx` | Placeholder de carga (shimmer) |
| `spinner.tsx` | Indicador de carga giratorio |
| `chart.tsx` | Gráficos (basado en Recharts) |
| `toast.tsx` | Notificaciones flotantes (Sonner) |
| `logo.tsx` | Logo de la aplicación |

Se importan con:

```typescript
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Card } from "@repo/ui/components/card";
```

---

### `packages/payments/` — Pagos

Integración con **Stripe** (u otros proveedores). Gestiona:
- Suscripciones y planes
- Webhooks de Stripe
- Verificación de acceso según plan activo

---

### `packages/mail/` — Emails transaccionales

Plantillas de email (React Email) y configuración del proveedor de envío. Cubre emails de:
- Bienvenida / verificación de cuenta
- Recuperación de contraseña
- Notificaciones
- Invitaciones a organizaciones

---

### `packages/notifications/` — Sistema de notificaciones

Notificaciones **in-app** y **por email**. Las preferencias del usuario controlan qué canales se activan. La API vive en `packages/api/modules/notifications` y la UI en `apps/saas/modules/shared`.

---

### `packages/ai/` — Integraciones de IA

Conexión con modelos de lenguaje (LLMs). Utiliza el **AI SDK de Vercel** para gestionar streams y herramientas.

---

### `packages/i18n/` — Internacionalización

Configuración de idiomas, locales, traducciones y utilidades para `next-intl`. Las traducciones están divididas por scope: `marketing`, `saas`, `mail` y `shared`.

---

### `packages/storage/` — Almacenamiento de archivos

Integración con **S3** (o compatible, como Supabase Storage). Gestiona subida, descarga y URLs firmadas de ficheros.

---

### `packages/logs/` — Logging

Configuración centralizada de logging para todas las apps y paquetes.

---

### `packages/utils/` — Utilidades genéricas

Funciones de utilidad compartidas que no pertenecen a ningún dominio concreto.

---

## `tooling/` — Herramientas de desarrollo compartidas

Configuraciones base que heredan todas las apps y paquetes del monorepo.

### `tooling/tailwind/`

- `theme.css` — Define los **tokens de diseño** (colores, radios, sombras) del sistema de diseño. Aquí se configuran los colores `primary`, `secondary`, `background`, etc. tanto para modo claro como oscuro.
- `tailwind-animate.css` — Animaciones de Tailwind.
- Configuración base de Tailwind CSS reutilizable.

### `tooling/typescript/`

Configuraciones base de `tsconfig.json` que extienden todas las apps y paquetes. Garantiza consistencia en el tipado TypeScript en todo el monorepo.

### `tooling/scripts/`

Scripts auxiliares de desarrollo: migraciones de base de datos, seeds, generación de código, etc.

---

## Ficheros raíz importantes

| Fichero | Descripción |
|---------|-------------|
| `turbo.json` | Define el pipeline de tareas de Turborepo: qué se puede ejecutar en paralelo, qué depende de qué, y qué salidas se cachean |
| `pnpm-workspace.yaml` | Declara qué carpetas forman parte del monorepo y gestiona versiones de dependencias compartidas (`catalog:`) |
| `docker-compose.yml` | Levanta una instancia local de **PostgreSQL** para desarrollo |
| `package.json` | Scripts globales: `pnpm dev` arranca todas las apps, `pnpm build` construye todo, `pnpm lint` valida el código |
| `.env.local` | Variables de entorno secretas (URLs, claves API). **Nunca se sube a git** |
| `agents.md` | Guía de convenciones para agentes de IA que trabajen en este repositorio |
| `tsconfig.json` | tsconfig raíz del monorepo |

---

## Convenciones de imports

Las apps usan aliases para importar de los paquetes compartidos:

```typescript
import { auth } from "@repo/auth";           // paquete auth
import { db } from "@repo/database";         // paquete database
import { Button } from "@repo/ui/components/button"; // componente UI
import { config } from "@config";            // config de la app actual
```

---

## Comandos principales

```bash
pnpm dev       # Arranca todas las apps en paralelo (marketing:3000, saas:3001)
pnpm build     # Construye todos los paquetes y apps
pnpm lint      # Valida el código con Oxlint
pnpm format    # Formatea el código con Oxfmt
pnpm test      # Ejecuta todos los tests
```

---

## Stack tecnológico resumido

| Área | Tecnología |
|------|-----------|
| Framework | Next.js 15+ (App Router) |
| Lenguaje | TypeScript (modo estricto) |
| Estilos | Tailwind CSS v4 + Shadcn UI |
| Componentes base | Radix UI |
| API | oRPC (type-safe RPC) |
| Autenticación | Better Auth |
| Base de datos | PostgreSQL + Prisma / Drizzle |
| Formularios | React Hook Form + Zod |
| Data fetching | TanStack Query |
| Emails | React Email |
| Pagos | Stripe |
| IA | Vercel AI SDK |
| i18n | next-intl |
| Monorepo | pnpm + Turborepo |
| Linting | Oxlint + Oxfmt |
| Tests E2E | Playwright |
| Tests unitarios | Vitest |
