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
| `EMAIL_FROM` | Remitente de los emails transaccionales, p. ej. `Wedite <hola@wedite.com>`. Hasta verificar el dominio en Resend (SPF y DKIM) solo funciona el remitente de pruebas `onboarding@resend.dev`, que entrega únicamente al dueño de la cuenta de Resend |
| `RSVP_IP_SALT` | Opcional: sal para el hash de IP del límite anti-abuso del RSVP |
| `SUPABASE_URL` | URL del proyecto de Supabase de ese entorno |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave **secreta** de Supabase (solo servidor; nunca en el cliente ni en el repositorio) |
| `STAGING_PUBLIC` | Solo en **Preview** y solo de forma temporal: con `1`, las páginas de staging se abren sin contraseña (para una auditoría externa). La API y el panel `/ops` siguen protegidos. Quítala al terminar y redespliega |
| `DASHBOARD_PATH_TOKEN` | Parte secreta de la URL del panel de analítica (`/ops/<token>`); mínimo 24 caracteres aleatorios |
| `DASHBOARD_STAGING_SUPABASE_URL` / `DASHBOARD_STAGING_SERVICE_ROLE_KEY` | Solo en **Production**: dan al panel acceso a la base de datos de staging para ver ambos entornos desde una única URL (`wedite.com/ops/<token>`). No pongas claves de producción en Preview |
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

### Email de compra y respuestas de los invitados

Cuando Stripe confirma el pago (webhook `checkout.session.completed`), la web de la
pareja se publica y se envía **un** email de bienvenida (`src/lib/order-confirmation.ts`; la factura
la manda Stripe): tarjeta con sus nombres y fecha, botón a su web, su dirección
con botones de compartir por WhatsApp y por email, y un enlace privado a la
tabla de respuestas. Si el envío
falla, el webhook responde 500 y Stripe reintenta; `orders.confirmation_email_sent_at`
evita duplicados.

Las respuestas del formulario RSVP se guardan (`POST /api/rsvp` → tabla `rsvps`, con
límite anti-abuso por IP hasheada). La pareja las ve en `/respuestas/<token>`
(una línea por persona, filtros, orden, totales y descarga en CSV). El token es secreto: del enlace solo se
guarda su hash (`sites.edit_token_hash`). Además la página pide un **código de acceso**
(`XXXX-XXXX`, también en el email; solo se guarda su hash en `sites.responses_code_hash`):
protege frente a un enlace que se filtre solo, no frente a reenviar el email entero.
Tras 5 fallos desde una IP (o 25 por hora en total) el formulario se bloquea.
No hay cuentas, así que si la pareja pierde el email todavía no hay forma de
recuperar el enlace (pendiente).

### Analítica y panel privado

Medición propia, sin cookies ni terceros: el navegador envía eventos
(`page_view`, `wizard_step`, `checkout_submit`) a `/api/track`, que los guarda en
la tabla `events` con un id aleatorio de pestaña (`sessionStorage`); no se guarda
IP ni navegador. El panel está en `/ops/<DASHBOARD_PATH_TOKEN>` (un token
incorrecto da un 404 normal), pide `DASHBOARD_PASSWORD`, limita los intentos
fallidos, lleva `noindex` y no aparece en `robots.txt`. Desde el propio panel se
puede excluir el navegador propio de las métricas. Para añadir un evento, súmalo
a `EVENT_NAMES` en `src/lib/analytics.ts` y llámalo con `trackEvent`.

El periodo se elige con atajos (hoy, ayer, 7/30/90 días, este mes, mes pasado) o
con un calendario de inicio y fin (`?r=<atajo>` o `?from=&to=`, días de Madrid).
La gráfica de visitas y los dos embudos se pueden segmentar por origen, idioma,
dispositivo o país (`?gb=<tipo>`; los 5 grupos mayores y «Otros»), lo que usa la
función SQL `dashboard_segments`.

El panel incluye: embudo de compra y embudo por pasos del asistente (con tiempo
medio por paso y último paso abierto de quien no llega al pago), filtro por
origen / idioma / dispositivo / país (uno a la vez, `?fk=<tipo>&fv=<valor>`),
campañas UTM, funciones que usan las webs (calculado desde la base de datos),
webs compradas editadas después del pago. Las visitas a las webs de las parejas
(`wedite.com/<nombre>`) no se miden: el panel solo mira a los clientes. Todo se
calcula en la función SQL `dashboard_stats`. Cuando exista la ruta del enlace
secreto de edición, debe llamar a `recordSiteEditOpen(siteId)`
(`src/lib/site-edit-tracking.ts`), que guarda solo la fecha, sin identificar a
nadie.

Por ahora todo el sitio, producción incluida, es no indexable (`noindex` en el
layout y `robots.txt` con `Disallow: /`); staging debe seguir siéndolo siempre.
