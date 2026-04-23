# Autenticación — Better Auth en Supastarter

Este documento describe cómo está configurado y cómo funciona el sistema de autenticación del proyecto.

---

## Librería utilizada

**Better Auth** — librería de autenticación moderna para Node.js con soporte nativo para Next.js App Router. Gestiona sesiones, tokens, OAuth, passkeys y plugins de forma modular.

---

## Dónde está cada pieza

| Archivo | Qué hace |
|---|---|
| [packages/auth/auth.ts](../packages/auth/auth.ts) | Configuración central de Better Auth |
| [packages/auth/config.ts](../packages/auth/config.ts) | Flags para habilitar/deshabilitar funcionalidades |
| [packages/auth/client.ts](../packages/auth/client.ts) | Cliente de auth para el navegador |
| `apps/saas/modules/auth/components/` | Formularios: login, signup, forgot-password, OTP |
| `apps/saas/modules/auth/hooks/` | Hooks: `useSession()`, mensajes de error |
| `apps/saas/modules/auth/lib/server.ts` | `getSession()` para Server Components |
| `apps/saas/app/api/[[...rest]]/route.ts` | Endpoint HTTP que expone la API de Better Auth |

---

## Métodos de autenticación configurados

Todos los métodos están **habilitados** en [packages/auth/config.ts](../packages/auth/config.ts):

| Flag | Valor | Descripción |
|---|---|---|
| `enableSignup` | `true` | Los usuarios pueden registrarse por su cuenta |
| `enablePasswordLogin` | `true` | Login con email y contraseña |
| `enableMagicLink` | `true` | Login sin contraseña mediante enlace por email |
| `enableSocialLogin` | `true` | Login con Google y GitHub (OAuth) |
| `enablePasskeys` | `true` | Login con WebAuthn / huella / Face ID |
| `enableTwoFactor` | `true` | Autenticación de dos factores (2FA/OTP) |

Para deshabilitar cualquier método, basta con cambiar el flag a `false`. Los formularios y rutas correspondientes se ocultan automáticamente.

---

## Configuración de sesión

```ts
sessionCookieMaxAge: 60 * 60 * 24 * 30  // 30 días
```

La sesión se almacena en una cookie y se sincroniza con la base de datos mediante Prisma.

---

## Configuración de organizaciones (multi-tenant)

| Flag | Valor | Descripción |
|---|---|---|
| `enable` | `true` | Sistema multi-tenant activo |
| `hideOrganization` | `false` | Las organizaciones son visibles en la UI |
| `enableUsersToCreateOrganizations` | `true` | Cualquier usuario puede crear una organización |
| `requireOrganization` | `false` | No es obligatorio pertenecer a una organización |
| `forbiddenOrganizationSlugs` | lista | Slugs reservados: `admin`, `settings`, `chatbot`... |

---

## Onboarding

```ts
users.enableOnboarding: true
```

Cuando está activo, los nuevos usuarios son redirigidos al flujo `/onboarding` tras registrarse.

---

## Plugins de Better Auth activos

Configurados en `packages/auth/auth.ts`:

| Plugin | Descripción |
|---|---|
| `username()` | Permite usar nombre de usuario además del email |
| `admin()` | Panel y permisos de administrador |
| `passkey()` | Autenticación con WebAuthn |
| `magicLink()` | Inicio de sesión por enlace en email |
| `organization()` | Gestión de organizaciones y miembros |
| `twoFactor()` | Autenticación de dos factores |
| `openAPI()` | Documentación automática de la API de auth |
| `invitationOnlyPlugin()` | Plugin personalizado para modo solo-invitación |

---

## Protección de rutas

No existe un `middleware.ts` en el proyecto. La protección se hace en el layout del grupo de rutas `(authenticated)`.

### Flujo de verificación

```
Usuario visita cualquier ruta protegida (ej: /dashboard)
        ↓
apps/saas/app/(authenticated)/layout.tsx
        ↓
getSession()  ←  packages/auth/lib/server.ts
        ↓
¿Hay sesión válida?
    No  →  redirect("/login")
    Sí  →  precarga datos y renderiza la página
```

### Qué hace el layout autenticado

```ts
// 1. Verifica sesión
const session = await getSession();
if (!session) redirect("/login");

// 2. Precarga datos en TanStack Query (evita waterfalls)
await queryClient.prefetchQuery({ queryKey: sessionQueryKey, queryFn: () => session });
await queryClient.prefetchQuery({ queryKey: organizationListQueryKey, queryFn: getOrganizationList });

// 3. Monta proveedores de contexto
<SessionProvider>
    <ActiveOrganizationProvider>
        <ConfirmationAlertProvider>
            {children}
        </ConfirmationAlertProvider>
    </ActiveOrganizationProvider>
</SessionProvider>
```

### Por qué layout en lugar de middleware

| Enfoque | Ventaja | Desventaja |
|---|---|---|
| **Layout (este proyecto)** | Acceso completo a la BD, puede precargar datos, lógica rica | Solo protege rutas de la app Next.js |
| **middleware.ts** | Se ejecuta en el Edge antes de cualquier renderizado | No puede acceder a la BD ni a Node.js APIs |

Supastarter usa el layout porque necesita hacer más que verificar un token — también precarga datos y configura contextos globales.

---

## Cómo usar la sesión en el código

### En Server Components

```typescript
import { getSession } from "@auth/lib/server";

export default async function Page() {
    const session = await getSession();
    // session.user.id, session.user.email, etc.
}
```

### En Client Components

```typescript
"use client";
import { useSession } from "@auth/hooks/use-session";

export function UserInfo() {
    const { user, loaded } = useSession();

    if (!loaded) return null;
    return <p>{user.email}</p>;
}
```

---

## Rutas de autenticación

Todas bajo el grupo `(unauthenticated)` en `apps/saas/app/`:

| URL | Descripción |
|---|---|
| `/login` | Inicio de sesión (contraseña o magic link) |
| `/signup` | Registro de nueva cuenta |
| `/forgot-password` | Solicitar recuperación de contraseña |
| `/reset-password` | Establecer nueva contraseña |
| `/verify` | Verificación de dos factores (2FA/OTP) |

---

## Dónde guarda Better Auth la sesión

Better Auth guarda la sesión en dos sitios a la vez: una **cookie en el navegador** y un **registro en la base de datos**.

### 1. Cookie en el navegador

Better Auth crea una cookie `better-auth.session_token` con el token de sesión. Es `httpOnly` (no accesible desde JavaScript), lo que la protege de ataques XSS.

### 2. Tabla `session` en PostgreSQL

Definida en [packages/database/prisma/schema.prisma](../packages/database/prisma/schema.prisma):

```prisma
model Session {
  id                   String    // ID único
  token                String    // El mismo token que va en la cookie
  userId               String    // FK → User
  expiresAt            DateTime  // Caduca en 30 días (sessionCookieMaxAge)
  ipAddress            String?   // IP del cliente
  userAgent            String?   // Navegador/dispositivo
  activeOrganizationId String?   // Organización activa en este momento
  impersonatedBy       String?   // Si un admin está suplantando al usuario
  createdAt            DateTime
  updatedAt            DateTime
}
```

### Flujo de verificación

```
Petición del navegador
        ↓
Cookie: better-auth.session_token = "abc123"
        ↓
getSession()  →  busca en BD WHERE token = "abc123"
        ↓
¿Existe y no ha expirado?
    No  →  redirect("/login")
    Sí  →  devuelve { user, session }
```

### Por qué base de datos y no solo JWT

A diferencia de un JWT (autocontenido e imposible de invalidar), almacenar la sesión en la BD permite:
- **Cerrar sesión real** — borra el registro, el token queda inválido inmediatamente
- **Ver sesiones activas** — el usuario puede ver desde qué dispositivos está conectado
- **Revocar acceso** — un admin puede invalidar sesiones de cualquier usuario al instante
- **Datos extra** — guarda la organización activa y si hay suplantación de identidad

---

## Diferencia entre email/contraseña y magic link

Son dos flujos distintos para llegar al mismo resultado: una sesión activa.

### Email + contraseña

El usuario elige y recuerda una contraseña. El servidor la almacena hasheada en la tabla `Account`.

```
1. Usuario introduce email + contraseña
2. Servidor hashea la contraseña y la compara con la BD
3. Si coincide → crea sesión → redirige al dashboard
```

### Magic link

No existe contraseña. El servidor genera un token de un solo uso y lo envía por email.

```
1. Usuario introduce solo su email
2. Servidor genera un token temporal y lo envía por email
3. Usuario hace clic en el enlace
4. Servidor valida el token → crea sesión → redirige al dashboard
```

El enlace tiene esta forma:
```
http://localhost:3000/api/auth/magic-link/verify?token=xyz123&callbackURL=/
```

### Comparativa

| | Email + contraseña | Magic link |
|---|---|---|
| **Lo que introduce el usuario** | Email + contraseña | Solo email |
| **Qué se guarda en BD** | Hash de la contraseña | Token temporal |
| **Requiere email externo** | Solo en el registro (verificación) | En cada login |
| **Expira** | No (hasta cambio de contraseña) | Sí, token de un solo uso |
| **Riesgo principal** | Contraseña débil o reutilizada | Acceso a la bandeja de entrada |
| **UX** | Fricción por recordar contraseña | Sin fricción, pero depende del email |

### Cómo coexisten en este proyecto

Ambos están habilitados simultáneamente. El `LoginForm` muestra un selector de pestañas (`LoginModeSwitch`) para que el usuario elija:

```ts
// packages/auth/auth.ts
emailAndPassword: { enabled: true }
magicLink({ disableSignUp: false })

// packages/auth/config.ts
enablePasswordLogin: true
enableMagicLink: true
```

---

## Variables de entorno necesarias

```bash
# Secreto para firmar sesiones y tokens
BETTER_AUTH_SECRET="cadena-aleatoria-segura"

# OAuth — Google
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# OAuth — GitHub
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
```
