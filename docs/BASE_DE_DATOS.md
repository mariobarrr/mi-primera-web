# Base de datos y Prisma — Supastarter

Este documento describe qué es Prisma, cómo funciona en el proyecto y qué tablas existen en la base de datos.

---

## ¿Qué es un ORM?

Un **ORM** (Object-Relational Mapper) es una capa de software que traduce entre dos mundos que hablan idiomas distintos:

- **La base de datos** habla SQL y trabaja con tablas, filas y columnas
- **Tu código** habla TypeScript y trabaja con objetos y clases

El ORM hace la traducción automáticamente para que no tengas que escribir SQL a mano.

### Sin ORM vs con ORM

**Sin ORM — escribes SQL directamente:**
```typescript
const result = await pool.query(
    `SELECT * FROM "note" WHERE "userId" = $1 ORDER BY "createdAt" DESC`,
    [userId]
);
const notas = result.rows; // tipado: any[]
```

**Con Prisma (ORM) — escribes TypeScript:**
```typescript
const notas = await db.note.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
});
// tipado automático: Note[]
```

El resultado en la base de datos es idéntico. La diferencia es cómo llegas a él.

### Qué problemas resuelve

**1. No tienes que aprender SQL profundo**
Las operaciones habituales (buscar, crear, actualizar, borrar) las escribes en el mismo lenguaje que el resto de tu código.

**2. Tipado automático**
Prisma genera los tipos TypeScript desde el schema. Si `Note` tiene `title: String`, TypeScript sabe que `nota.title` es un `string`. Si escribes `nota.tituloInventado`, el compilador avisa antes de ejecutar.

**3. Refactoring seguro**
Si renombras un campo en el schema y ejecutas la migración, TypeScript marca en rojo todos los sitios del código que usan el nombre antiguo. Con SQL en strings esto no ocurre — el error solo aparece en tiempo de ejecución.

**4. Protección contra SQL injection**
Con SQL manual es fácil cometer este error:
```typescript
// ❌ Vulnerable — el usuario podría inyectar SQL malicioso
`SELECT * FROM user WHERE email = '${emailDelUsuario}'`
```
Prisma parametriza las queries automáticamente — nunca concatena valores directamente en el SQL.

### La analogía más simple

Un ORM es como un **traductor simultáneo** entre tú y la base de datos. Tú hablas TypeScript, la base de datos habla SQL, y el ORM traduce en ambas direcciones sin que tengas que aprender el idioma del otro.

---

## ¿Qué es Prisma?

Prisma es el **ORM** que usa este proyecto. Está construido para Node.js y TypeScript, y actúa de intermediario entre el código y la base de datos.

### Sin Prisma vs con Prisma

**Sin Prisma — SQL directo:**
```sql
SELECT * FROM "user" WHERE email = 'mario@gmail.com' LIMIT 1;
```

**Con Prisma — TypeScript:**
```typescript
const user = await db.user.findFirst({
    where: { email: "mario@gmail.com" }
});
```

El resultado es el mismo, pero con Prisma tienes **autocompletado**, **tipado automático** y sin riesgo de errores de sintaxis SQL.

---

## Cómo funciona — las tres piezas

### 1. El Schema (`schema.prisma`)
Define la estructura de la base de datos en el lenguaje propio de Prisma:

```prisma
model User {
    id        String   @id @default(cuid())
    email     String   @unique
    name      String
    createdAt DateTime
}
```

### 2. El generador
Al ejecutar `prisma migrate dev`, Prisma hace dos cosas:
- Crea la **migración SQL** real en la base de datos
- **Genera el cliente TypeScript** en `prisma/generated/` con todos los tipos y métodos

```
schema.prisma
      ↓  prisma migrate dev
Base de datos (tablas reales) + Cliente TypeScript generado
```

### 3. El cliente (`db`)
Objeto con un método por cada modelo del schema:

```typescript
db.user.findFirst()    // buscar uno (o null)
db.user.findMany()     // buscar varios
db.user.create()       // insertar
db.user.update()       // actualizar
db.user.delete()       // eliminar
db.user.count()        // contar
db.user.upsert()       // insertar o actualizar (si existe, actualiza; si no, crea)
```

El mismo patrón aplica para cualquier modelo: `db.organization`, `db.member`, `db.purchase`, etc.

---

## El tipado automático — la gran ventaja

Prisma genera los tipos TypeScript desde el schema. Si el modelo `User` tiene `email: String`, TypeScript sabe que `user.email` es un `string`. Si intentas acceder a un campo inexistente, el compilador avisa antes de ejecutar.

```typescript
const user = await db.user.findFirst({
    where: { email: "mario@gmail.com" }
});

user.email      // ✅ TypeScript sabe que es string
user.telefono   // ❌ Error en compilación — ese campo no existe
```

---

## Ciclo de trabajo con Prisma

```
1. Modificas schema.prisma      (añades un modelo o campo)
        ↓
2. pnpm --filter @repo/database migrate
        ↓
3. Prisma crea el SQL y lo ejecuta en la BD
        ↓
4. Prisma regenera el cliente TypeScript
        ↓
5. Ya puedes usar db.nuevoModelo.findMany() en el código
```

---

## Dónde está Prisma en el proyecto

```
packages/database/
├── prisma/
│   ├── schema.prisma       ← definición de modelos y BD
│   ├── client.ts           ← instancia singleton del cliente
│   ├── index.ts            ← exporta todo: cliente, queries, tipos, zod
│   ├── generated/          ← código generado automáticamente (no editar)
│   ├── migrations/         ← historial de migraciones SQL
│   ├── queries/            ← queries reutilizables (users, orgs, purchases)
│   └── zod/                ← schemas Zod generados desde el schema
└── index.ts                ← re-exporta todo desde prisma/
```

---

## El patrón Singleton — qué es y por qué existe

El singleton es un patrón de diseño que garantiza que **una clase solo tenga una instancia** en toda la aplicación, y que esa instancia sea reutilizada siempre.

### El problema que resuelve

Sin singleton, cada vez que se importa el cliente se crea una nueva instancia:

```typescript
// Archivo A
const db = new PrismaClient(); // conexión 1

// Archivo B
const db = new PrismaClient(); // conexión 2

// Archivo C
const db = new PrismaClient(); // conexión 3
```

Con Prisma esto es un problema grave — cada `new PrismaClient()` abre una nueva conexión a PostgreSQL. En desarrollo, Next.js recarga el servidor con cada cambio de código, lo que crearía decenas de conexiones abiertas hasta agotar el límite de la base de datos.

### Cómo lo resuelve

```typescript
// packages/database/prisma/client.ts

const prisma = globalThis.prisma ?? new PrismaClient();
//              ↑                    ↑
//    si ya existe, reutiliza       si no existe, crea una nueva

if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = prisma; // guarda la instancia en el objeto global
}

export { prisma as db };
```

La clave es `globalThis` — un objeto que **sobrevive a los hot reloads** de Next.js. El código de los módulos se recarga, pero `globalThis` no se borra:

```
Primera carga:
  globalThis.prisma → undefined → crea new PrismaClient() → lo guarda en globalThis

Segunda carga (hot reload):
  globalThis.prisma → ya existe → lo reutiliza, no crea uno nuevo
```

En producción no hay hot reloads, así que guardar en `globalThis` no es necesario — por eso el `if` solo aplica fuera de producción.

### Resumen en una frase

El singleton es un "si ya existe úsalo, si no créalo" — no importa cuántas veces importes `db` en el código, siempre es el mismo objeto con la misma conexión.

Usa **`PrismaPg`** como adaptador — conecta directamente a PostgreSQL sin necesidad del motor binario de Prisma.

---

## Cómo se importa desde las apps

Nunca se instancia Prisma directamente en las apps. Siempre se importa desde `@repo/database`:

```typescript
// El cliente
import { db } from "@repo/database";

// Queries predefinidas
import { getUserById, getUserByEmail } from "@repo/database";

// Tipos generados
import type { Prisma } from "@repo/database";

// Enums
import { NotificationType, NotificationTarget } from "@repo/database";
```

**Query directa:**
```typescript
const user = await db.user.findFirst({
    where: { email: "mario@ejemplo.com" },
});
```

**Query predefinida** (preferible cuando existe):
```typescript
import { getUserByEmail } from "@repo/database";

const user = await getUserByEmail("mario@ejemplo.com");
```

Las queries predefinidas están en `packages/database/prisma/queries/` — úsalas siempre que existan para no duplicar lógica.

---

## Tablas del schema

### Tablas de autenticación

| Tabla | Modelo | Descripción |
|---|---|---|
| `user` | `User` | Usuarios registrados |
| `session` | `Session` | Sesiones activas |
| `account` | `Account` | Métodos de autenticación por usuario |
| `verification` | `Verification` | Tokens temporales de un solo uso |
| `passkey` | `Passkey` | Credenciales WebAuthn |
| `twoFactor` | `TwoFactor` | Secretos 2FA y códigos de respaldo |

#### `user`
Además de los campos básicos (email, nombre, imagen) incluye: `onboardingComplete` para saber si pasó el flujo de bienvenida, `lastActiveOrganizationId` para recordar en qué organización estaba, `twoFactorEnabled`, `role` para distinguir admins, y `paymentsCustomerId` para vincularlo con Stripe.

#### `session`
Cada inicio de sesión crea un registro. Contiene el `token` que viaja en la cookie del navegador, `expiresAt` (30 días), y la `activeOrganizationId` para saber en qué organización está trabajando.

#### `account`
Vincula un usuario con un método de autenticación. Un usuario puede tener varias filas: una para email/contraseña (con el hash en `password`), otra para Google, otra para GitHub. El campo `providerId` identifica el proveedor (`credential`, `google`, `github`).

#### `verification`
Tokens temporales para verificación de email, magic links y recuperación de contraseña. Caducan automáticamente con `expiresAt`.

#### `passkey`
Credenciales WebAuthn (huella dactilar, Face ID, llave física). Cada dispositivo registrado genera una fila con su `publicKey` y `credentialID` únicos.

#### `twoFactor`
Secreto TOTP para 2FA. El `secret` genera los códigos de 6 dígitos y `backupCodes` son los códigos de recuperación.

---

### Tablas de organizaciones (multi-tenant)

| Tabla | Modelo | Descripción |
|---|---|---|
| `organization` | `Organization` | Empresas o equipos |
| `member` | `Member` | Relación usuario ↔ organización |
| `invitation` | `Invitation` | Invitaciones pendientes |

#### `organization`
Cada empresa o equipo. Tiene un `slug` único que aparece en la URL (`/mi-empresa/...`) y un `paymentsCustomerId` para vincularlo con Stripe si la suscripción es por organización.

#### `member`
Tabla de unión entre `user` y `organization`. Cada fila indica que un usuario pertenece a una organización con un `role` concreto (`owner`, `admin`, `member`). Un usuario puede ser miembro de varias organizaciones.

#### `invitation`
Invitaciones pendientes. Cuando un admin invita a alguien, se crea un registro con `status` (`pending`, `accepted`, `rejected`) y `expiresAt`. Si el email no tiene cuenta, al registrarse se asocia automáticamente.

---

### Tablas de pagos

| Tabla | Modelo | Descripción |
|---|---|---|
| `purchase` | `Purchase` | Compras y suscripciones activas |

#### `purchase`
Registra cada compra o suscripción. Puede estar asociada a un `userId` (billing por usuario) o a un `organizationId` (billing por organización). El `type` distingue `SUBSCRIPTION` de `ONE_TIME`, y `subscriptionId` es el ID de Stripe para sincronizar el estado via webhooks.

---

### Tablas de notificaciones

| Tabla | Modelo | Descripción |
|---|---|---|
| `notification` | `Notification` | Notificaciones in-app y por email |
| `user_notification_preference` | `UserNotificationPreference` | Preferencias por usuario y canal |

#### `notification`
Notificaciones para cada usuario. El campo `type` (`WELCOME`, `APP_UPDATE`) identifica la plantilla, `data` es JSON con datos variables, `read` indica si el usuario la ha visto y `link` es una URL opcional de destino.

#### `user_notification_preference`
Preferencias de cada usuario sobre qué notificaciones quiere recibir y por qué canal (`IN_APP` o `EMAIL`). Si no existe una fila para un tipo concreto, se usa el comportamiento por defecto.

---

### Resumen visual

```
Autenticación          Organizaciones       Pagos         Notificaciones
─────────────          ──────────────       ─────         ──────────────
user                   organization         purchase      notification
session                member                             user_notification_preference
account                invitation
verification
passkey
twoFactor
```

---

## Cómo leer un archivo de migración SQL

Cuando Prisma genera una migración, crea un archivo `.sql` con instrucciones que PostgreSQL ejecuta en orden. Este es el archivo generado para el modelo `Note`:

```sql
-- CreateTable
CREATE TABLE "note" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "note_userId_idx" ON "note"("userId");

-- AddForeignKey
ALTER TABLE "note" ADD CONSTRAINT "note_userId_fkey"
  FOREIGN KEY ("userId")
  REFERENCES "user"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
```

### `CREATE TABLE`

Crea la tabla `note` con sus columnas:

- **`"id" TEXT NOT NULL`** — columna de texto obligatoria. Prisma usa `TEXT` para los `String` del schema. Los cuid son strings como `clx3k2j0p0000...`
- **`"title" TEXT NOT NULL`** — texto obligatorio. El `NOT NULL` viene de que en el schema `title` no tiene `?`
- **`"content" TEXT`** — texto opcional. Sin `NOT NULL` porque en el schema es `String?` — puede ser `NULL` en la base de datos
- **`"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP`** — fecha obligatoria. `TIMESTAMP(3)` guarda milisegundos (3 decimales). `DEFAULT CURRENT_TIMESTAMP` la rellena automáticamente al insertar — viene del `@default(now())` del schema
- **`"updatedAt" TIMESTAMP(3) NOT NULL`** — fecha obligatoria sin default aquí porque Prisma la gestiona desde el código con `@updatedAt`, no desde SQL
- **`CONSTRAINT "note_pkey" PRIMARY KEY ("id")`** — declara `id` como clave primaria. Garantiza que no haya dos filas con el mismo `id` y acelera las búsquedas por él

### `CREATE INDEX`

```sql
CREATE INDEX "note_userId_idx" ON "note"("userId");
```

Crea un índice sobre la columna `userId`. Sin índice, buscar todas las notas de un usuario haría un **full table scan** — recorrer toda la tabla fila a fila. Con el índice, PostgreSQL va directo a las filas del usuario como si fuera el índice de un libro. Viene del `@@index([userId])` del schema.

### `ALTER TABLE` — clave foránea

```sql
ALTER TABLE "note" ADD CONSTRAINT "note_userId_fkey"
  FOREIGN KEY ("userId")
  REFERENCES "user"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
```

- **`ALTER TABLE "note"`** — modifica la tabla `note` ya creada
- **`ADD CONSTRAINT "note_userId_fkey"`** — añade una restricción con nombre `note_userId_fkey` (fkey = foreign key)
- **`FOREIGN KEY ("userId") REFERENCES "user"("id")`** — declara que el valor de `userId` en `note` debe existir como `id` en la tabla `user`. Hace imposible crear una nota con un `userId` que no corresponda a ningún usuario real
- **`ON DELETE CASCADE`** — si el usuario se borra, sus notas se borran automáticamente. Viene del `onDelete: Cascade` del schema
- **`ON UPDATE CASCADE`** — si el `id` del usuario cambia, el `userId` de sus notas se actualiza automáticamente

---

## `prisma migrate dev` vs `prisma db push`

Hay dos comandos para aplicar cambios del schema a la base de datos y se usan en situaciones distintas.

| | `prisma migrate dev` | `prisma db push` |
|---|---|---|
| Crea archivo en `migrations/` | ✅ Sí | ❌ No |
| Historial de cambios | ✅ Sí | ❌ No |
| Requiere advisory lock | ✅ Sí | ❌ No |
| Útil para | Producción y equipos | Prototipado rápido |

### `prisma migrate dev` — el comando correcto para el proyecto

```bash
pnpm --filter @repo/database migrate
```

Crea un archivo SQL en `prisma/migrations/` con un nombre como `20260417000000_add_note_model/migration.sql`. Este archivo queda guardado en git y permite que cualquier miembro del equipo reproduzca exactamente el mismo historial de cambios en su base de datos.

Es el comando que debes usar siempre salvo que haya un bloqueo.

### `prisma db push` — solo para prototipado

```bash
pnpm --filter @repo/database push
```

Sincroniza el schema directamente con la base de datos **sin crear archivos de migración**. Es útil cuando estás explorando el diseño de un modelo y no quieres acumular migraciones a medio terminar. El problema es que no deja historial, así que si otro desarrollador descarga el proyecto y ejecuta las migraciones, no tendrá la tabla nueva.

### El advisory lock

`prisma migrate dev` necesita adquirir un **advisory lock** de PostgreSQL — un mecanismo que evita que dos migraciones corran al mismo tiempo y corrompan el historial. Si hay conexiones activas a la base de datos (servidor de desarrollo corriendo, pgAdmin abierto, etc.), el lock no se puede adquirir y la migración falla con error `P1002`.

**Solución:** parar el servidor de desarrollo y cerrar pgAdmin antes de ejecutar la migración.

---

## Variables de entorno necesarias

```bash
# Conexión a PostgreSQL
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/supastarter"

# Solo necesario con algunos adaptadores
DIRECT_URL=""
```
