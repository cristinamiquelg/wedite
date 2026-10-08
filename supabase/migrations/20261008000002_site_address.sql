-- Couples can now choose their public address (wedite.com/elenayjuan), so
-- addresses are no longer always random:
--  * more reserved words (every page of the site and a few role-like names);
--    keep this list in sync with RESERVED_SLUGS in src/lib/site-address.ts;
--  * uniqueness ignores case, so "ElenaYJuan" can't coexist with "elenayjuan".
alter table public.sites drop constraint if exists sites_slug_not_reserved;
alter table public.sites
  add constraint sites_slug_not_reserved
    check (lower(slug) <> all (array[
      'plantillas', 'guias', 'herramientas', 'api', 'personalizar', 'preview',
      'privacidad', 'terminos', 'quienes-somos', 'gracias', 'panel', 'editar',
      'admin', 'ops', 'respuestas', 'coming-soon', 'staging', 'www', 'wedite',
      'login', 'registro', 'rsvp', 'actions', 'health', 'dashboard', 'cuenta',
      'ayuda', 'soporte', 'contacto', 'precios', 'blog', 'app', 'mail', 'email',
      'static', 'assets', 'robots', 'sitemap', 'favicon', 'icon', 'opengraph-image',
      'privacy', 'terms', 'pricing', 'faq', 'help', 'support', 'about', 'account',
      'test', 'demo', 'ejemplo'
    ]));

create unique index if not exists sites_slug_lower_key on public.sites (lower(slug));
