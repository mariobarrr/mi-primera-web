# Routing — supastarter for Next.js

Este documento describe cómo está organizado el sistema de rutas en las dos aplicaciones del monorepo.

---

## Cómo funciona el routing

Ambas apps usan **Next.js App Router**. Las carpetas dentro de `app/` definen las rutas automáticamente. Convenciones clave:

| Convención | Ejemplo | Efecto |
|---|---|---|
| `(nombre)` | `(authenticated)` | **Route group** — agrupa rutas sin añadir ese segmento a la URL |
| `[param]` | `[organizationSlug]` | **Segmento dinámico** — captura un valor variable en la URL |
| `[...param]` | `[...path]` | **Catch-all** — captura múltiples segmentos de la URL |
| `[[...param]]` | `[[...rest]]` | **Catch-all opcional** — igual que el anterior pero también captura la ruta raíz |

---

## `apps/marketing` — Sitio público · `localhost:3001`

Todas las rutas están envueltas en `[locale]` para el soporte de múltiples idiomas. Con `localePrefix: "as-needed"`, el idioma por defecto no muestra prefijo (`/blog` en vez de `/en/blog`).

```
app/
└── [locale]/
    ├── (home)/
    │   └── page.tsx          → /
    ├── blog/
    │   ├── page.tsx          → /blog
    │   └── [...path]/
    │       └── page.tsx      → /blog/cualquier-post
    ├── changelog/
    │   └── page.tsx          → /changelog
    ├── contact/
    │   └── page.tsx          → /contact
    ├── legal/
    │   └── [...path]/
    │       └── page.tsx      → /legal/privacidad, /legal/terminos...
    └── [...rest]/
        └── page.tsx          → Cualquier ruta no definida (404 personalizado)
```

### Tabla de rutas

| Archivo | URL | Descripción |
|---|---|---|
| `[locale]/(home)/page.tsx` | `/` | Landing page principal |
| `[locale]/blog/page.tsx` | `/blog` | Listado de artículos del blog |
| `[locale]/blog/[...path]/page.tsx` | `/blog/mi-articulo` | Artículo individual del blog |
| `[locale]/changelog/page.tsx` | `/changelog` | Historial de cambios del producto |
| `[locale]/contact/page.tsx` | `/contact` | Formulario de contacto |
| `[locale]/legal/[...path]/page.tsx` | `/legal/privacidad` | Páginas legales (privacidad, términos...) |
| `[locale]/[...rest]/page.tsx` | Cualquier ruta | Página 404 personalizada |

---

## `apps/saas` — Aplicación protegida · `localhost:3000`

Las rutas se dividen en dos grandes grupos mediante route groups: `(unauthenticated)` para páginas públicas y `(authenticated)` para páginas protegidas. El layout de `(authenticated)` verifica la sesión y redirige a `/login` si no existe.

```
app/
├── (unauthenticated)/
│   ├── login/
│   ├── signup/
│   ├── forgot-password/
│   ├── reset-password/
│   └── verify/
├── (authenticated)/
│   ├── (main)/
│   │   ├── (account)/
│   │   │   ├── page.tsx                    → / (dashboard)
│   │   │   ├── chatbot/
│   │   │   ├── admin/
│   │   │   │   ├── users/
│   │   │   │   └── organizations/[id]/
│   │   │   └── settings/
│   │   │       ├── general/
│   │   │       ├── security/
│   │   │       ├── notifications/
│   │   │       └── billing/
│   │   └── (organizations)/
│   │       └── [organizationSlug]/
│   │           ├── page.tsx                → /mi-empresa
│   │           └── settings/
│   │               ├── general/
│   │               ├── members/
│   │               └── billing/
│   ├── onboarding/
│   ├── new-organization/
│   ├── choose-plan/
│   ├── checkout-return/
│   ├── organization-invitation/[invitationId]/
│   └── [...rest]/                          → 404 autenticado
└── api/
    ├── [[...rest]]/route.ts                → /api/* (Better Auth + oRPC)
    └── image-proxy/[...path]/route.ts      → /image-proxy/*
```

### Rutas públicas — `(unauthenticated)`

| Archivo | URL | Descripción |
|---|---|---|
| `login/page.tsx` | `/login` | Pantalla de inicio de sesión |
| `signup/page.tsx` | `/signup` | Registro de nueva cuenta |
| `forgot-password/page.tsx` | `/forgot-password` | Solicitud de recuperación de contraseña |
| `reset-password/page.tsx` | `/reset-password` | Formulario de nueva contraseña |
| `verify/page.tsx` | `/verify` | Verificación de dos factores (2FA/OTP) |

### Rutas protegidas — `(authenticated)/(main)/(account)`

Rutas de cuenta personal del usuario autenticado.

| Archivo | URL | Descripción |
|---|---|---|
| `page.tsx` | `/` | Dashboard principal |
| `chatbot/page.tsx` | `/chatbot` | Asistente de IA |
| `admin/users/page.tsx` | `/admin/users` | Panel de administración — usuarios |
| `admin/organizations/page.tsx` | `/admin/organizations` | Panel de administración — organizaciones |
| `admin/organizations/[id]/page.tsx` | `/admin/organizations/123` | Detalle de una organización (admin) |
| `settings/general/page.tsx` | `/settings/general` | Ajustes generales del perfil |
| `settings/security/page.tsx` | `/settings/security` | Seguridad: contraseña, 2FA, passkeys |
| `settings/notifications/page.tsx` | `/settings/notifications` | Preferencias de notificaciones |
| `settings/billing/page.tsx` | `/settings/billing` | Facturación y suscripción personal |

### Rutas protegidas — `(authenticated)/(main)/(organizations)`

Rutas de contexto de organización (multi-tenant). El `[organizationSlug]` es el identificador único de cada organización.

| Archivo | URL | Descripción |
|---|---|---|
| `[organizationSlug]/page.tsx` | `/mi-empresa` | Dashboard de la organización |
| `[organizationSlug]/settings/general/page.tsx` | `/mi-empresa/settings/general` | Ajustes generales de la organización |
| `[organizationSlug]/settings/members/page.tsx` | `/mi-empresa/settings/members` | Gestión de miembros y roles |
| `[organizationSlug]/settings/billing/page.tsx` | `/mi-empresa/settings/billing` | Facturación de la organización |

### Rutas protegidas — flujos especiales

| Archivo | URL | Descripción |
|---|---|---|
| `onboarding/page.tsx` | `/onboarding` | Flujo de bienvenida para nuevos usuarios |
| `new-organization/page.tsx` | `/new-organization` | Crear una nueva organización |
| `choose-plan/page.tsx` | `/choose-plan` | Selección de plan de pago |
| `checkout-return/page.tsx` | `/checkout-return` | Retorno tras completar el pago |
| `organization-invitation/[invitationId]/page.tsx` | `/organization-invitation/abc123` | Aceptar invitación a una organización |

### API

| Archivo | URL | Descripción |
|---|---|---|
| `api/[[...rest]]/route.ts` | `/api/*` | Catch-all para Better Auth y oRPC |
| `image-proxy/[...path]/route.ts` | `/image-proxy/*` | Proxy de imágenes externas |

---

## Cómo funciona la protección de rutas

Cuando alguien visita una ruta protegida como `/dashboard/mis-notas`, Next.js ejecuta los layouts de arriba hacia abajo antes de llegar a la página. La protección está resuelta en el primer layout:

```
app/
└── (authenticated)/
    │   layout.tsx  ← 1. Llama a getSession(). Si no hay sesión → redirect("/login")
    └── (main)/
        │   layout.tsx  ← 2. Añade AppWrapper (sidebar, navbar)
        └── (account)/
            │   layout.tsx  ← 3. Envuelve con AppWrapper
            └── dashboard/
                └── mis-notas/
                    └── page.tsx  ← 4. Solo se ejecuta si pasó el paso 1
```

El layout de `(authenticated)` hace esto:

```typescript
// apps/saas/app/(authenticated)/layout.tsx
const session = await getSession();

if (!session) {
    redirect("/login"); // protege TODAS las rutas dentro de (authenticated)
}
```

**Consecuencia práctica:** cualquier `page.tsx` que crees dentro de `(authenticated)/` queda protegido automáticamente. No necesitas añadir la redirección en cada página — el layout padre ya lo hace.

---

## Cómo añadir una nueva ruta

### En `apps/marketing`
Crear la carpeta y el `page.tsx` dentro de `app/[locale]/`:
```
app/[locale]/nueva-pagina/page.tsx  →  /nueva-pagina
```

### En `apps/saas` (ruta protegida)
Crear dentro de `app/(authenticated)/(main)/(account)/`:
```
app/(authenticated)/(main)/(account)/nueva-pagina/page.tsx  →  /nueva-pagina
```

### En `apps/saas` (ruta pública)
Crear dentro de `app/(unauthenticated)/`:
```
app/(unauthenticated)/nueva-pagina/page.tsx  →  /nueva-pagina
```
