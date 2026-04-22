# Interfaces TypeScript — Tipar respuestas de APIs externas

Este documento explica por qué y cómo tipar las respuestas de APIs externas en TypeScript, usando la API de GitHub como ejemplo práctico.

---

## ¿Por qué tipar en lugar de usar `any`?

`any` desactiva TypeScript completamente para ese valor.

### Con `any` — TypeScript no ayuda

```typescript
const data: any = await res.json();

// TypeScript no avisa de ninguno de estos errores:
console.log(data.iteems);            // typo — undefined en runtime
console.log(data.items[0].starz);    // campo inexistente
console.log(data.total_count.map()); // total_count es number, no array
```

Todos estos errores solo aparecen cuando el código ya está corriendo. El compilador no dice nada.

### Con la interfaz — TypeScript avisa antes de ejecutar

```typescript
const data: GitHubSearchResponse = await res.json();

console.log(data.iteems);            // ❌ Error: Property 'iteems' does not exist
console.log(data.items[0].starz);    // ❌ Error: Property 'starz' does not exist
console.log(data.total_count.map()); // ❌ Error: map is not a function on number
```

El editor subraya el error en rojo antes de que ejecutes nada.

### La ventaja práctica: el autocompletado

Con `any` el editor no sabe qué campos existen. Con la interfaz, al escribir `data.items[0].` el editor muestra todos los campos disponibles:

```
data.items[0].
               ├── id
               ├── name
               ├── full_name
               ├── description
               ├── stargazers_count
               └── ...
```

### Resumen

| | `any` | Interfaz tipada |
|---|---|---|
| Errores de typo | Solo en runtime | En compilación |
| Autocompletado | No | Sí |
| Refactoring seguro | No | Sí |
| Documentación viva | No | Sí |

`any` es útil como escape rápido mientras prototipas, pero en código que va a producción cuesta más de lo que ahorra — un error que TypeScript habría detectado en segundos puede tardarse horas en encontrar en producción.

---

## Ejemplo real: API de búsqueda de GitHub

Endpoint: `https://api.github.com/search/repositories?q={query}`

### Las interfaces

```typescript
// La respuesta raíz del endpoint /search/repositories
interface GitHubSearchResponse {
    total_count: number;         // total de repos que coinciden (no solo los devueltos)
    incomplete_results: boolean; // true si GitHub cortó la búsqueda por tiempo
    items: GitHubRepository[];   // los repos devueltos (máx 30 por página por defecto)
}

// Un repositorio individual
interface GitHubRepository {
    id: number;
    name: string;                // nombre del repo: "react"
    full_name: string;           // owner/repo: "facebook/react"
    description: string | null;
    html_url: string;            // URL en github.com
    url: string;                 // URL de la API REST

    owner: GitHubOwner;

    stargazers_count: number;    // estrellas
    forks_count: number;         // forks
    watchers_count: number;
    open_issues_count: number;

    language: string | null;     // lenguaje principal detectado por GitHub
    topics: string[];            // etiquetas del repo: ["react", "javascript"]

    visibility: "public" | "private";
    default_branch: string;      // "main" | "master" | ...

    created_at: string;          // ISO 8601: "2013-05-24T16:15:54Z"
    updated_at: string;
    pushed_at: string;           // último push

    license: GitHubLicense | null;
}

interface GitHubOwner {
    id: number;
    login: string;               // nombre de usuario: "facebook"
    avatar_url: string;
    html_url: string;
    type: "User" | "Organization";
}

interface GitHubLicense {
    key: string;                 // "mit" | "apache-2.0" | ...
    name: string;                // "MIT License"
    spdx_id: string;             // "MIT"
}
```

### Cómo usarlo en Next.js

```typescript
async function buscarRepositorios(query: string): Promise<GitHubSearchResponse> {
    const res = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}`,
        {
            headers: {
                Accept: "application/vnd.github+json",
            },
            next: { revalidate: 60 }, // caché de Next.js: 60 segundos
        }
    );

    if (!res.ok) {
        throw new Error(`GitHub API error: ${res.status}`);
    }

    return res.json() as Promise<GitHubSearchResponse>;
}
```

---

## Qué campos incluir o no

**Incluir siempre:**
- `id`, `full_name`, `html_url` — identificación y enlace
- `description`, `language`, `topics` — presentación
- `stargazers_count`, `forks_count` — métricas populares
- `owner.login`, `owner.avatar_url` — para mostrar el autor

**Omitir si no los necesitas:**
- `url`, `watchers_count` — redundantes con otros campos
- `pushed_at` vs `updated_at` — elige uno según lo que quieras mostrar (`pushed_at` es más relevante para actividad reciente)
- `open_issues_count` — solo si construyes algo orientado a contribuidores

**Cuidado con los nullables:**
- `description` y `language` pueden ser `null` — tiparlo así evita errores en runtime
- `total_count` puede ser muy alto aunque `items` solo devuelva 30 — úsalo para paginación, no como longitud del array

---

## Cómo Next.js cachea las peticiones `fetch`

El comportamiento del caché cambió entre versiones. Este proyecto usa **Next.js 16**.

### Next.js 13/14 — caché activado por defecto

`fetch` cacheaba todo automáticamente. Había que desactivarlo explícitamente:

```typescript
fetch("...", { cache: "no-store" });       // sin caché
fetch("...", { next: { revalidate: 60 } }); // caché de 60 segundos
```

### Next.js 15/16 — sin caché por defecto

`fetch` **no cachea nada por defecto**. Hay que activarlo explícitamente:

```typescript
// Sin caché — petición nueva en cada render (comportamiento por defecto)
fetch("...", { cache: "no-store" });

// Caché con tiempo de expiración
fetch("...", { next: { revalidate: 60 } });

// Caché permanente hasta el próximo deploy
fetch("...", { cache: "force-cache" });
```

### Las tres opciones

| Opción | Comportamiento | Cuándo usarla |
|---|---|---|
| `cache: "no-store"` | Nueva petición en cada render | Datos que cambian constantemente (precios, mensajes) |
| `next: { revalidate: N }` | Cachea N segundos, luego renueva | Datos que cambian pero no en tiempo real (repos de GitHub, artículos) |
| `cache: "force-cache"` | Cachea hasta el próximo deploy | Datos que casi nunca cambian (configuración, catálogos) |

### Por qué `GitHubRepositoryList` usa `revalidate: 60`

```typescript
const res = await fetch(
    `https://api.github.com/search/repositories?q=${query}`,
    {
        next: { revalidate: 60 },
    }
);
```

Los resultados de GitHub no cambian cada segundo — tiene sentido servir la misma respuesta durante un minuto en lugar de llamar a la API en cada visita. Sin ese parámetro en Next.js 16, cada visita haría una nueva llamada y podría agotar el rate limit de la API rápidamente.

---

## Qué pasa si la API tarda mucho

`fetch` nativo no tiene timeout — si la API no responde, la petición espera indefinidamente y bloquea el render de la página entera.

### La solución: `AbortController`

```typescript
async function searchRepositories(query: string) {
    const controller = new AbortController();

    // Cancela la petición si tarda más de 5 segundos
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
        const res = await fetch(
            `https://api.github.com/search/repositories?q=${query}`,
            {
                signal: controller.signal,
                next: { revalidate: 60 },
            }
        );

        if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);

        return res.json();
    } finally {
        clearTimeout(timeout); // limpia el timer si la petición terminó antes
    }
}
```

Si la petición supera 5 segundos, `controller.abort()` la cancela y `fetch` lanza un error con nombre `AbortError`.

### Cómo distinguir el timeout en el componente

```typescript
export async function GitHubRepositoryList({ query }: { query: string }) {
    try {
        const data = await searchRepositories(query);
        return <ul>{data.items.map(...)}</ul>;
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            return <p>La búsqueda tardó demasiado. Inténtalo de nuevo.</p>;
        }
        return <p>No se pudieron cargar los resultados.</p>;
    }
}
```

### Resumen de comportamientos

| Situación | Sin timeout | Con `AbortController` |
|---|---|---|
| API responde en 200ms | ✅ Normal | ✅ Normal |
| API tarda 10 segundos | ⏳ Espera 10s bloqueado | ❌ Cancela a los 5s → muestra error |
| API no responde nunca | ⏳ Espera indefinidamente | ❌ Cancela a los 5s → muestra error |

---

## Para qué sirve `loading.tsx`

`loading.tsx` es un archivo especial de Next.js que muestra una UI de carga **inmediatamente** mientras el Server Component está esperando datos. Internamente usa React `Suspense`.

### Sin `loading.tsx`

```
Usuario navega a /dashboard/mis-notas
        ↓
El servidor ejecuta page.tsx — espera a que fetch() termine
        ↓        (el usuario ve la página anterior o blanco)
Fetch termina (2 segundos después)
        ↓
El servidor envía el HTML completo al navegador
        ↓
El usuario ve la página
```

### Con `loading.tsx`

```
Usuario navega a /dashboard/mis-notas
        ↓
Next.js envía loading.tsx al navegador INMEDIATAMENTE
        ↓
El usuario ve el skeleton/spinner al instante
        ↓
El servidor termina de ejecutar page.tsx (fetch completo)
        ↓
Next.js reemplaza loading.tsx con el contenido real
```

### Cómo se crea

```tsx
// app/(authenticated)/(main)/(account)/dashboard/mis-notas/loading.tsx

export default function Loading() {
    return (
        <div className="space-y-4">
            <div className="h-8 w-48 rounded bg-muted animate-pulse" />
            <div className="h-32 rounded-lg border bg-muted animate-pulse" />
            <div className="h-32 rounded-lg border bg-muted animate-pulse" />
        </div>
    );
}
```

### `loading.tsx` y `AbortController` son complementarios

| | Qué hace |
|---|---|
| `loading.tsx` | Muestra feedback visual mientras se espera |
| `AbortController` | Cancela la petición si tarda demasiado |

Sin `loading.tsx`, el usuario espera en blanco hasta que el timeout cancela la petición. Con `loading.tsx`, el usuario ve un skeleton inmediatamente — y si el timeout se dispara, el skeleton desaparece y aparece el mensaje de error del `catch`.

### Scope de `loading.tsx`

Aplica a toda la ruta donde está colocado. Si lo pones en `(account)/loading.tsx` cubre todas las páginas de ese grupo. Si lo pones en `dashboard/mis-notas/loading.tsx` solo cubre esa página.