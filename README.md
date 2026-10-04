# Wedite

Un site para que futuros novios elijan una web de boda moderna de un catálogo,
la vean en preview en directo, la personalicen con su información y la
contraten, todo a golpe de clic, sin llamadas ni correos intermedios.

Este repositorio es el **prototipo funcional en frontend**: catálogo,
preview en directo, personalización en vivo y un flujo de contratación
simulado (sin pagos ni backend reales todavía).

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4
- Sin backend: el borrador de cada boda se guarda en `localStorage` del
  navegador

## Cómo funciona el prototipo

- `/` — landing con la propuesta de valor.
- `/plantillas` — catálogo de plantillas (una plantilla, "Aurora", en esta
  primera versión).
- `/plantillas/[slug]` — ficha de la plantilla con preview en directo.
- `/personalizar/[slug]` — formulario multi-paso con vista previa en directo
  en pantalla partida (se sincroniza con un `<iframe>` vía `postMessage`).
- `/personalizar/[slug]/confirmar` — resumen y contratación simulada
  ("modo demo", sin cobro real).
- `/preview/[slug]` — renderiza la plantilla a pantalla completa, ya sea con
  datos de ejemplo o con el borrador guardado.

## Desarrollo

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

```bash
npm run lint      # eslint
npm run build     # build de producción
```

## Entornos

Hay dos entornos, cada uno con su rama y su dominio:

| Entorno | Rama | Dominio |
| --- | --- | --- |
| Producción | `main` | `wedite.com` (y `www.wedite.com`) |
| Staging | `staging` | `staging.wedite.com` |

Además, cada pull request genera una URL de preview temporal de Vercel.

Flujo de trabajo:

1. Se trabaja en una rama de funcionalidad y se abre un PR hacia `staging`.
2. Al fusionarlo, Vercel despliega `staging` y se prueba en `staging.wedite.com`.
3. Cuando está validado, se abre un PR de `staging` hacia `main`; al fusionarlo
   se despliega a producción.

Nada llega a `main` sin haber pasado antes por `staging`.

### Variables de entorno

Cada entorno tiene las suyas en Vercel (Settings → Environment Variables):
**Production** para `main` y **Preview** para `staging` (y los PRs). Usa claves
distintas en cada uno, por ejemplo una `OPENAI_API_KEY` de staging con límite de
gasto propio.

| Variable | Para qué |
| --- | --- |
| `OPENAI_API_KEY` | Ilustración de "Nuestra historia" (`/api/story-illustration`) |
| `OPENAI_IMAGE_MODEL` | Opcional: modelo de imagen (por defecto `gpt-image-1`) |
| `RESEND_API_KEY` | Envío del formulario de contacto |
| `SUPABASE_URL` | URL del proyecto de Supabase de ese entorno |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave **secreta** de Supabase (solo servidor; nunca en el cliente ni en el repositorio) |
| `DASHBOARD_PATH_TOKEN` | Parte secreta de la URL del panel de analítica (`/ops/<token>`); mínimo 24 caracteres aleatorios |
| `DASHBOARD_PASSWORD` | Contraseña del panel de analítica. Obligatoria en Production; en Preview es opcional (staging ya está tras su propia contraseña) |

### Base de datos (Supabase)

Un proyecto de Supabase por entorno, ambos en Irlanda (`eu-west-1`) por el RGPD:

| Entorno | Proyecto | Ref |
| --- | --- | --- |
| Staging (Vercel Preview) | `wedite-staging` | `lglyotjdmfyvnikjjsva` |
| Producción (Vercel Production) | `wedite-prod` | `hbtpmguhjfrflrwzsoqr` |

- El esquema vive en `supabase/migrations/` y se aplica primero a staging y,
  una vez probado, a producción. No se hacen cambios a mano en producción.
- Todas las tablas tienen RLS activado **sin políticas**: la clave pública no
  puede leer ni escribir nada. Solo el servidor, con
  `SUPABASE_SERVICE_ROLE_KEY`, accede a los datos.
- Sin cuentas por ahora: una pareja gestiona su web con un enlace de edición
  secreto enviado por email (en base de datos solo se guarda su hash).
- Los cobros (`payments`, `stripe_events`) llegan con la integración de Stripe.

### Analítica y panel privado

Medición propia, sin cookies ni terceros: el navegador envía eventos
(`page_view`, `wizard_step`, `checkout_submit`) a `/api/track`, que los guarda en
la tabla `events` con un id aleatorio de pestaña (`sessionStorage`); no se guarda
IP ni navegador. El panel está en `/ops/<DASHBOARD_PATH_TOKEN>` (un token
incorrecto da un 404 normal), pide `DASHBOARD_PASSWORD`, limita los intentos
fallidos, lleva `noindex` y no aparece en `robots.txt`. Desde el propio panel se
puede excluir el navegador propio de las métricas. Para añadir un evento, súmalo
a `EVENT_NAMES` en `src/lib/analytics.ts` y llámalo con `trackEvent`.

Por ahora todo el sitio, producción incluida, es no indexable (`noindex` en el
layout y `robots.txt` con `Disallow: /`); staging debe seguir siéndolo siempre.
