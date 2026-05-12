# mi-primera-web

Aplicación SaaS fullstack construida con **Supastarter** como proyecto final del curso. Incluye autenticación, notas personales y un buscador de repositorios de GitHub con sistema de favoritos.

## Funcionalidades

- Registro e inicio de sesión con verificación de email (Better Auth + Resend)
- Redirección automática tras el login a la página solicitada
- **Mis notas** — CRUD completo: crear, editar y eliminar notas personales
- **Buscador de GitHub** — busca repositorios por nombre usando la API pública de GitHub
- **Favoritos** — guarda y elimina repositorios favoritos, con contador en tiempo real
- Navegación por pestañas con persistencia del criterio de búsqueda al cambiar de vista

## Tecnologías

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript 6 |
| Estilos | Tailwind CSS 4 |
| Base de datos | PostgreSQL + Prisma 7 |
| Autenticación | Better Auth 1.5 |
| Correo | Resend |
| Monorepo | Turborepo + pnpm workspaces |
| UI | React 19 + Lucide React |
| Deploy | Vercel + Neon |

## Estructura del proyecto

```
mi-primera-web/
├── apps/
│   ├── saas/          # App principal (autenticación, notas, GitHub)
│   └── marketing/     # Landing page pública
└── packages/
    ├── database/      # Schema Prisma, migraciones y queries
    ├── ui/            # Componentes compartidos
    └── mail/          # Configuración del proveedor de correo
```

## Instalación

### Requisitos previos

- Node.js 20 o superior
- pnpm 9 o superior
- PostgreSQL (local o en la nube)

### 1. Clona el repositorio

```bash
git clone https://github.com/mariobarrr/mi-primera-web.git
cd mi-primera-web
```

### 2. Instala las dependencias

```bash
pnpm install
```

### 3. Configura las variables de entorno

Copia el archivo de ejemplo:

```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus valores (ver sección siguiente).

### 4. Aplica las migraciones de la base de datos

```bash
pnpm --filter @repo/database migrate
```

### 5. Arranca el servidor de desarrollo

```bash
pnpm dev
```

La app SaaS estará en `http://localhost:3000` y el sitio de marketing en `http://localhost:3001`.

## Variables de entorno

### Obligatorias

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Connection string de PostgreSQL. En local: `postgresql://postgres:postgres@localhost:5432/supastarter` |
| `BETTER_AUTH_SECRET` | Secreto para firmar las sesiones. Genera uno con `openssl rand -base64 32` |
| `NEXT_PUBLIC_SAAS_URL` | URL pública de la app SaaS. En local: `http://localhost:3000` |
| `NEXT_PUBLIC_MARKETING_URL` | URL pública del sitio de marketing. En local: `http://localhost:3001` |

### Para el envío de correos (registro y verificación de email)

| Variable | Descripción |
|---|---|
| `RESEND_API_KEY` | API key de Resend (resend.com) |
| `MAIL_FROM` | Dirección remitente. Sin dominio propio verificado: `onboarding@resend.dev` |

### Opcionales (desactivan la feature si están vacías)

| Variable | Feature |
|---|---|
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Login con GitHub |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Login con Google |
| `OPENAI_API_KEY` | Chatbot de IA |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Pagos con Stripe |

## Deploy en Vercel

### 1. Base de datos de producción

Crea un proyecto gratuito en [neon.tech](https://neon.tech) y copia la connection string.

Aplica las migraciones apuntando a la base de datos de producción:

```bash
DATABASE_URL="tu-url-de-neon" pnpm --filter @repo/database migrate
```

### 2. Importar en Vercel

1. Conecta tu cuenta de GitHub en [vercel.com](https://vercel.com)
2. Importa el repositorio
3. Establece **Root Directory** como `apps/saas`
4. Añade las variables de entorno obligatorias
5. Despliega

Repite el proceso para `apps/marketing` como segundo proyecto.

### 3. Variables de entorno en producción

Añade en Vercel las mismas variables que en local, sustituyendo:

- `DATABASE_URL` → tu URL de Neon
- `NEXT_PUBLIC_SAAS_URL` → la URL que Vercel asigne al proyecto
- `NEXT_PUBLIC_MARKETING_URL` → la URL que Vercel asigne al sitio de marketing

## Flujo de trabajo con Claude Code

Este proyecto se desarrolló usando **Claude Code** como copiloto de programación.

### Cómo se trabajó

Cada feature se construyó en conversación con Claude Code, describiendo el objetivo y dejando que Claude generara el código, explicara las decisiones y corrigiera los errores en tiempo real.

Ejemplos de prompts utilizados durante el curso:

```
"Crea un Server Component en apps/saas que reciba una query como prop,
llame a la API de GitHub y muestre los resultados con TypeScript tipado"

"Añade un modelo FavoriteRepo al schema de Prisma con los campos necesarios
y crea las queries para guardar y eliminar favoritos"

"¿Por qué tipamos la respuesta en lugar de usar any?"
```

### Lo que Claude Code hizo

- Generó componentes, Server Actions y queries de Prisma
- Explicó conceptos: Server vs Client Components, ORM, caché de Next.js, migraciones
- Detectó y corrigió errores de TypeScript y de build en tiempo real
- Propuso la arquitectura de cada feature antes de implementarla
- Redactó los mensajes de commit siguiendo Conventional Commits

### Historial de commits

```bash
git log --oneline --graph
```

## Licencia

MIT