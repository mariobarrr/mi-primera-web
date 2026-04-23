# Componentes — supastarter for Next.js

Este documento describe los componentes de la interfaz de usuario, su ubicación y el desglose de cada parte.

---

## HeroSection

**Ruta:** `apps/marketing/modules/home/components/HeroSection.tsx`

Componente principal de la landing page. Es lo primero que ve el visitante al entrar al sitio público.

### Estructura visual

```
┌─────────────────────────────────────┐
│         [ Badge de novedad ]        │
│                                     │
│         Título principal (H1)       │
│                                     │
│              Subtítulo              │
│                                     │
│   [ Get Started → ]  [ Docs ]       │
│                                     │
│  ┌───────────────────────────────┐  │
│  │       Imagen del producto     │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Desglose por partes

#### `"use client"` (línea 1)
El componente se ejecuta en el navegador (no en el servidor) porque usa `useTranslations()`, que necesita contexto de cliente.

#### Contenedor con degradado de fondo
```tsx
<div className="relative max-w-full overflow-x-hidden bg-linear-to-t from-background via-primary/5 to-background">
```
El fondo tiene un **degradado vertical** que va del color de fondo → un toque del color primario (5% de opacidad) → fondo de nuevo. Crea un efecto sutil de "brillo" en el centro.

#### Badge de novedad
```tsx
<div className="px-3 py-1 ... rounded-full bg-muted">
    <span>{t("home.hero.new")}</span>
    <span>{t("home.hero.featureBadge")}</span>
</div>
```
La **píldora** de texto que aparece arriba del título (ej. *"New · Introducing feature X"*). El texto viene de los ficheros de traducción.

#### Título principal (H1)
```tsx
<h1 className="font-medium text-4xl md:text-5xl lg:text-6xl xl:text-7xl ...">
    {t("home.hero.title")}
</h1>
```
El **titular principal** de la página. El tamaño escala con el ancho de pantalla: 4xl en móvil → 7xl en pantallas grandes. `text-balance` hace que las líneas queden equilibradas visualmente.

#### Subtítulo
```tsx
<p className="mt-2 text-sm sm:text-lg ... text-foreground/60">
    {t("home.hero.subtitle")}
</p>
```
El **texto descriptivo** bajo el título, a un 60% de opacidad para que tenga menor peso visual que el H1.

#### Botones de llamada a la acción (CTA)
```tsx
<Button size="lg" variant="primary" asChild>
    <a href={config.saasUrl}>Get Started →</a>
</Button>

<Button variant="ghost" size="lg" asChild>
    <a href={config.docsUrl}>Documentation</a>
</Button>
```
Dos botones CTA:
- **"Get Started"** — lleva a la URL de la app SaaS (`config.saasUrl`), siempre visible.
- **"Documentation"** — lleva a los docs, solo aparece **si `config.docsUrl` está configurado**.

El prop `asChild` hace que el `Button` renderice un `<a>` en vez de un `<button>`, manteniendo los estilos.

#### Imagen del producto
```tsx
<Image src={heroImage}     className="block dark:hidden" priority />
<Image src={heroImageDark} className="hidden dark:block"  priority />
```
Muestra **dos imágenes distintas** según el modo de color:
- `hero-image.png` → modo claro
- `hero-image-dark.png` → modo oscuro

`priority` le dice a Next.js que precargue estas imágenes porque son visibles nada más cargar la página (mejora el LCP — Largest Contentful Paint).

### Textos traducibles

Todos los textos del componente se obtienen de los ficheros de traducción mediante `useTranslations()`. Las claves utilizadas son:

| Clave | Descripción |
|---|---|
| `home.hero.new` | Etiqueta de la píldora (ej. "New") |
| `home.hero.featureBadge` | Texto de novedad de la píldora |
| `home.hero.title` | Título principal |
| `home.hero.subtitle` | Subtítulo descriptivo |
| `home.hero.getStarted` | Texto del botón primario |
| `home.hero.documentation` | Texto del botón secundario |
| `home.hero.imageAlt` | Texto alternativo de la imagen (accesibilidad) |

### Dependencias externas

| Import | Procedencia | Para qué |
|---|---|---|
| `config` | `@config` | URLs de la app SaaS y docs |
| `Button` | `@repo/ui/components/button` | Componente de botón reutilizable |
| `ArrowRightIcon` | `lucide-react` | Icono de flecha en el botón CTA |
| `useTranslations` | `next-intl` | Textos en el idioma del usuario |
| `Image` | `next/image` | Imagen optimizada con lazy load y formatos modernos |
