# Organizaciones (Multi-tenant) — Supastarter

Este documento explica qué es el sistema multi-tenant, cómo están implementadas las organizaciones en este proyecto y cómo acceder a los datos de la organización activa desde cualquier componente.

---

## ¿Qué es multi-tenant?

**Tenant** significa "inquilino". En una app multi-tenant, varios grupos independientes (empresas, equipos) usan la misma aplicación pero cada uno ve **solo sus propios datos**, como si tuvieran su propia instancia privada.

Ejemplo: Slack es multi-tenant. Cada empresa tiene su propio workspace aislado. Los empleados de Nike no ven los mensajes de Adidas, aunque ambas usen el mismo Slack.

En Supastarter, el equivalente al "workspace" se llama **Organization**.

---

## Cómo funciona en este proyecto

### La URL identifica la organización

Cada organización tiene un `slug` único que aparece directamente en la URL:

```
/mi-empresa         → dashboard de "mi-empresa"
/otra-empresa       → dashboard de "otra-empresa"
```

Esto lo maneja la ruta dinámica `[organizationSlug]`:

```
app/(authenticated)/(main)/(organizations)/[organizationSlug]/page.tsx
```

### Un usuario puede pertenecer a varias organizaciones

Un mismo usuario puede ser miembro de múltiples organizaciones con roles distintos en cada una. La sesión recuerda en cuál está trabajando mediante `activeOrganizationId`.

### Roles dentro de una organización

Cada miembro tiene un rol: `owner`, `admin` o `member`. El proyecto expone el flag `isOrganizationAdmin` para controlar qué puede ver o hacer cada usuario.

---

## Opciones de configuración

En `packages/auth/config.ts`:

```typescript
organizations: {
    enable: true,                           // activa el sistema de organizaciones
    hideOrganization: false,                // si true, oculta la UI de organizaciones
    enableUsersToCreateOrganizations: true, // si false, solo admins pueden crear orgs
    requireOrganization: false,             // si true, el usuario DEBE pertenecer a una org
}
```

Con `requireOrganization: false` (estado actual), las organizaciones son opcionales — un usuario puede usar la app sin crear ninguna.

---

## Flujo completo de un usuario nuevo

```
1. Se registra
        ↓
2. Ve la pantalla de inicio — puede crear una organización o usar la app sin ella
        ↓
3. Si crea "Hoilab" → su slug es /hoilab
        ↓
4. Invita a compañeros por email → reciben un link con el invitationId
        ↓
5. El compañero acepta → se une con el rol que el admin asignó
        ↓
6. Cada miembro ve /hoilab con sus propios permisos
```

---

## Cómo acceder a la organización activa

### Desde un Server Component

Usas `getActiveOrganization(slug)` pasándole el slug de la URL. Solo funciona en páginas dentro de `[organizationSlug]/` porque necesitas el slug como parámetro:

```typescript
import { getActiveOrganization } from "@auth/lib/server";

export default async function MiPagina({
    params,
}: {
    params: Promise<{ organizationSlug: string }>;
}) {
    const { organizationSlug } = await params;
    const org = await getActiveOrganization(organizationSlug);

    if (!org) return notFound();

    return (
        <div>
            <p>Organización: {org.name}</p>
            <p>Miembros: {org.members.length}</p>
        </div>
    );
}
```

### Desde un Client Component

Usas el hook `useActiveOrganization()`. No necesitas el slug — lee del contexto que ya tiene el proveedor cargado. Funciona en cualquier componente dentro de `(authenticated)`:

```typescript
"use client";
import { useActiveOrganization } from "@organizations/hooks/use-active-organization";

export function MiComponente() {
    const {
        activeOrganization,           // datos completos: id, name, slug, logo, members...
        activeOrganizationUserRole,   // "owner" | "admin" | "member" | null
        isOrganizationAdmin,          // true si es owner o admin
        setActiveOrganization,        // cambia la org activa
        loaded,                       // false mientras hidrata
    } = useActiveOrganization();

    if (!loaded) return null;

    if (!activeOrganization) {
        return <p>Sin organización activa</p>;
    }

    return (
        <div>
            <p>{activeOrganization.name}</p>
            {isOrganizationAdmin && <button>Ajustes de admin</button>}
        </div>
    );
}
```

### Qué contiene `activeOrganization`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `string` | ID único de la organización |
| `name` | `string` | Nombre visible |
| `slug` | `string` | Identificador en la URL |
| `logo` | `string \| null` | URL del logo |
| `members` | `Member[]` | Lista de miembros con sus roles |
| `metadata` | `object \| null` | Datos extra personalizables |

### Resumen rápido

| | Dónde | Cómo |
|---|---|---|
| Server Component | Páginas con `[organizationSlug]` en la URL | `getActiveOrganization(slug)` |
| Client Component | Cualquier sitio dentro de `(authenticated)` | `useActiveOrganization()` |

---

## Dónde están los archivos

```
packages/auth/
├── config.ts                                    ← opciones de organizaciones
└── auth.ts                                      ← plugin de organización de Better Auth

apps/saas/
├── app/(authenticated)/(main)/(organizations)/
│   └── [organizationSlug]/
│       ├── page.tsx                             ← dashboard de la organización
│       └── settings/
│           ├── general/page.tsx                 ← ajustes generales
│           ├── members/page.tsx                 ← gestión de miembros
│           └── billing/page.tsx                 ← facturación
└── modules/organizations/
    ├── components/
    │   ├── ActiveOrganizationProvider.tsx        ← proveedor del contexto
    │   ├── CreateOrganizationForm.tsx            ← formulario de creación
    │   ├── InviteMemberForm.tsx                  ← invitar miembros
    │   ├── OrganizationMembersList.tsx           ← lista de miembros
    │   └── OrganizationSelect.tsx               ← selector de organización activa
    ├── hooks/
    │   └── use-active-organization.ts            ← hook para Client Components
    └── lib/
        └── active-organization-context.ts        ← tipo del contexto
```
