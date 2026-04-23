# Server Components vs Client Components — Supastarter

Este documento explica la diferencia entre Server Components y Client Components en Next.js, cómo se usan en este proyecto, y cómo acceder a la sesión del usuario en cada caso.

---

## ¿Qué es un Server Component?

Un Server Component es un componente que **solo se ejecuta en el servidor**. Nunca llega al navegador del usuario como JavaScript.

- Puede leer directamente de la base de datos
- Puede leer cookies y headers de la petición HTTP
- No puede usar `useState`, `useEffect`, ni ningún hook de React
- No puede escuchar eventos del navegador (onClick, onChange, etc.)
- Es el tipo **por defecto** en Next.js App Router — si no pones `"use client"`, es un Server Component

```tsx
// Server Component — sin "use client" al principio
// Este componente solo existe en el servidor

export default async function MiPagina() {
    const sesion = await getSession(); // puede llamar funciones async del servidor

    return <h1>Hola {sesion?.user.name}</h1>;
}
```

---

## ¿Qué es un Client Component?

Un Client Component es un componente que **se ejecuta en el navegador**. Se marca con la directiva `"use client"` al inicio del archivo.

- Puede usar hooks de React (`useState`, `useEffect`, `useContext`, etc.)
- Puede responder a eventos del usuario (clicks, inputs, etc.)
- No puede hacer llamadas directas al servidor ni leer cookies
- Su código JavaScript **sí se envía al navegador**

```tsx
"use client"; // esta directiva lo convierte en Client Component

import { useState } from "react";

export function Contador() {
    const [count, setCount] = useState(0);

    return (
        <button onClick={() => setCount(count + 1)}>
            Clicks: {count}
        </button>
    );
}
```

---

## Cuándo usar cada uno

| Necesitas... | Usa |
|---|---|
| Leer de la base de datos | Server Component |
| Acceder a la sesión del usuario | Server Component (preferible) |
| Usar `useState` o `useEffect` | Client Component |
| Responder a clicks o inputs | Client Component |
| Mostrar datos estáticos o del servidor | Server Component |
| Mostrar datos que cambian en tiempo real | Client Component |
| Leer variables de entorno privadas | Server Component |

**Regla general:** empieza con Server Component. Solo añade `"use client"` si necesitas interactividad o hooks.

---

## Cómo acceder a la sesión en un Server Component

El proyecto expone la función `getSession()` en `apps/saas/modules/auth/lib/server.ts`.

```typescript
import "server-only"; // evita que este archivo se importe desde el cliente
import { auth } from "@repo/auth";
import { headers } from "next/headers";
import { cache } from "react";

export const getSession = cache(async () => {
    const session = await auth.api.getSession({
        headers: await headers(),
        query: {
            disableCookieCache: true,
        },
    });

    return session;
});
```

### Por qué usa `cache()` de React

`cache()` es una función de React que **deduplica llamadas idénticas dentro del mismo render**. Si cinco Server Components distintos llaman a `getSession()` en la misma petición, la función solo se ejecuta una vez — el resultado se reutiliza en las otras cuatro.

```
Petición HTTP
    │
    ├── Layout llama getSession()    → ejecuta la llamada real
    ├── Header llama getSession()    → devuelve el resultado cacheado
    └── Sidebar llama getSession()   → devuelve el resultado cacheado
```

Sin `cache()`, se harían tres llamadas a la base de datos para obtener lo mismo.

### Cómo usarlo en tus componentes

```tsx
import { getSession } from "@auth/lib/server";

export default async function MiPagina() {
    const sesion = await getSession();

    if (!sesion) {
        return <p>No estás autenticado</p>;
    }

    return (
        <div>
            <p>Nombre: {sesion.user.name}</p>
            <p>Email: {sesion.user.email}</p>
        </div>
    );
}
```

### Otras funciones disponibles en `server.ts`

Además de `getSession()`, el archivo expone más funciones del servidor:

```typescript
// Organización activa por slug (para rutas como /mi-empresa/...)
const org = await getActiveOrganization("mi-empresa");

// Lista de todas las organizaciones del usuario
const orgs = await getOrganizationList();

// Métodos de autenticación vinculados (email, Google, GitHub...)
const accounts = await getUserAccounts();

// Passkeys registradas (huella dactilar, Face ID)
const passkeys = await getUserPasskeys();
```

Todas usan `cache()` por el mismo motivo: evitar llamadas duplicadas.

---

## Cómo acceder a la sesión en un Client Component

En el cliente no puedes llamar directamente a `getSession()` porque es una función de servidor. En su lugar, el proyecto provee el hook `useSession`.

### Cómo funciona por dentro

El sistema tiene tres piezas:

```
apps/saas/modules/auth/
├── hooks/
│   └── use-session.ts        ← el hook que usas en tus componentes
├── lib/
│   └── session-context.ts    ← define el tipo de datos disponibles
└── components/
    └── SessionProvider.tsx   ← el proveedor que alimenta los datos
```

**`session-context.ts`** — define la forma de los datos:

```typescript
export const SessionContext = React.createContext<{
    session: Session["session"] | null;
    user: Session["user"] | null;
    loaded: boolean;
    reloadSession: () => Promise<void>;
} | undefined>(undefined);
```

**`SessionProvider.tsx`** — llama a la API de Better Auth y rellena el contexto:

```typescript
"use client";

export function SessionProvider({ children }) {
    const { data: session } = useSessionQuery(); // llama a la API
    const [loaded, setLoaded] = useState(!!session);

    useEffect(() => {
        if (session && !loaded) setLoaded(true);
    }, [session]);

    return (
        <SessionContext.Provider value={{
            loaded,
            session: session?.session ?? null,
            user: session?.user ?? null,
            reloadSession: async () => { /* refresca sin caché */ },
        }}>
            {children}
        </SessionContext.Provider>
    );
}
```

Este proveedor ya está configurado en el layout de las rutas autenticadas. No necesitas añadirlo tú.

**`use-session.ts`** — el hook que lee el contexto:

```typescript
export const useSession = () => {
    const sessionContext = useContext(SessionContext);

    if (sessionContext === undefined) {
        throw new Error("useSession must be used within SessionProvider");
    }

    return sessionContext;
};
```

### Cómo usarlo en tus componentes

```tsx
"use client";
import { useSession } from "@auth/hooks/use-session";

export function MiComponente() {
    const { user, session, loaded, reloadSession } = useSession();

    // Mientras no carguen los datos, no renderices nada
    if (!loaded) return null;

    return (
        <div>
            <p>Hola, {user?.name}</p>
            <p>Email: {user?.email}</p>
            <button onClick={reloadSession}>Refrescar sesión</button>
        </div>
    );
}
```

### Qué devuelve `useSession`

| Campo | Tipo | Para qué sirve |
|---|---|---|
| `user` | `User \| null` | Nombre, email, imagen, rol del usuario |
| `session` | `Session \| null` | Token, expiración, organización activa |
| `loaded` | `boolean` | `false` mientras hidrata, `true` cuando ya hay datos |
| `reloadSession()` | `() => Promise<void>` | Fuerza una nueva llamada a la API sin caché |

### Por qué existe `loaded`

En el primer render del cliente, los datos aún no han llegado del servidor. `loaded` empieza como `false` y pasa a `true` cuando la sesión ya está disponible. Si muestras `user?.name` sin esperar a `loaded`, el componente mostrará un parpadeo de contenido vacío.

---

## Ejemplo real: componente `UserGreeting`

`UserGreeting` muestra `Hola, [nombre]` si el usuario está autenticado. No tiene interactividad, así que el patrón correcto es **Server Component**.

```tsx
// apps/saas/modules/shared/components/UserGreeting.tsx
import { getSession } from "@auth/lib/server";

export async function UserGreeting() {
	const session = await getSession();

	if (!session) {
		return null;
	}

	return <p>Hola, {session.user.name}</p>;
}
```

### Por qué Server Component y no Client Component

- No necesita `useState`, `useEffect` ni eventos del navegador
- Solo lee datos — no los modifica
- Si otra parte de la página ya llamó a `getSession()`, `cache()` reutiliza el resultado sin una segunda llamada a la BD
- Cero JavaScript enviado al navegador

### Cómo usarlo en una página

```tsx
// apps/saas/app/(authenticated)/dashboard/page.tsx
import { UserGreeting } from "@shared/components/UserGreeting";

export default function DashboardPage() {
    return (
        <main>
            <UserGreeting />
        </main>
    );
}
```

### Cuándo usarías la versión Client Component

Si el nombre del usuario pudiera cambiar sin recargar la página (por ejemplo, el usuario lo edita en ajustes y quieres que el saludo se actualice al instante), entonces usarías `useSession()`. Para un saludo estático, el Server Component es suficiente y más eficiente.

---

## Comparación directa

| | Server Component | Client Component |
|---|---|---|
| Función | `getSession()` | `useSession()` |
| Importación | `@auth/lib/server` | `@auth/hooks/use-session` |
| Async/await | Sí | No (es síncrono con estado) |
| Deduplicación | `cache()` de React | TanStack Query |
| Estado de carga | No aplica | `loaded: boolean` |
| Refresco manual | No aplica | `reloadSession()` |

---

## Por qué `fetch` en un Server Component no necesita `useEffect`

`useEffect` existe para sincronizar con el ciclo de vida del navegador, y un Server Component nunca llega al navegador.

### El problema que resuelve `useEffect`

En un Client Component, el componente se renderiza primero sin datos y luego hay que pedirlos al montarse:

```typescript
"use client";

export function Resultados() {
    const [repos, setRepos] = useState([]);

    useEffect(() => {
        // 1. El componente renderiza vacío
        // 2. Se monta en el navegador
        // 3. useEffect dispara el fetch
        // 4. Llegan los datos
        // 5. setState → re-render con datos
        fetch("https://api.github.com/...")
            .then(r => r.json())
            .then(data => setRepos(data.items));
    }, []);

    return <ul>{repos.map(...)}</ul>;
}
```

El flujo tiene 5 pasos y el usuario ve un parpadeo: primero vacío, luego con datos.

### Por qué en un Server Component no hace falta

```typescript
// Sin "use client", sin useEffect, sin useState
export async function GitHubRepositoryList({ query }: { query: string }) {
    // fetch ocurre en el servidor, antes de enviar nada al navegador
    const res = await fetch(`https://api.github.com/search/repositories?q=${query}`);
    const data = await res.json();

    // El HTML ya llega con los datos — el navegador no hace ninguna llamada adicional
    return <ul>{data.items.map(...)}</ul>;
}
```

El componente es una función `async` normal. `await` espera a que lleguen los datos y solo entonces genera el HTML. El navegador recibe la página ya completa.

### La diferencia visual

```
Client Component con useEffect:
  Servidor  → envía HTML vacío
  Navegador → monta el componente
  Navegador → ejecuta useEffect → fetch a GitHub
  GitHub    → devuelve datos
  Navegador → re-renderiza con datos
  Usuario   → ve contenido  (2 viajes de red)

Server Component con async/await:
  Servidor  → fetch a GitHub
  GitHub    → devuelve datos
  Servidor  → genera HTML con datos
  Navegador → recibe HTML completo
  Usuario   → ve contenido  (1 viaje de red)
```

### Resumen

`useEffect` es el mecanismo de React para hacer cosas **después** de que el componente se monta en el navegador. Un Server Component nunca se monta en el navegador — se ejecuta en el servidor como una función normal y devuelve HTML. Por eso `async/await` directo es suficiente y `useEffect` ni siquiera existe en ese contexto.

---

## Dónde están los archivos

```
apps/saas/modules/auth/
├── lib/
│   ├── server.ts             ← getSession() y otras funciones del servidor
│   └── session-context.ts    ← tipo del contexto de sesión
├── hooks/
│   └── use-session.ts        ← hook para Client Components
└── components/
    └── SessionProvider.tsx   ← proveedor que envuelve las rutas autenticadas
```
