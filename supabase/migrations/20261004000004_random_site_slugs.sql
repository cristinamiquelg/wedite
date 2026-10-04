-- Public site URLs are now random mixed-case alphanumeric strings (e.g. OSI3J4m3045939S),
-- so the slug check must allow upper case. Reserved words stay blocked (case-insensitive).
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.sites'::regclass and contype = 'c'
      and pg_get_constraintdef(oid) like '%slug%'
  loop
    execute format('alter table public.sites drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.sites
  add constraint sites_slug_format
    check (slug ~ '^[A-Za-z0-9]+(-[A-Za-z0-9]+)*$' and char_length(slug) between 3 and 40),
  add constraint sites_slug_not_reserved
    check (lower(slug) <> all (array[
      'plantillas', 'guias', 'herramientas', 'api', 'personalizar', 'preview',
      'privacidad', 'quienes-somos', 'gracias', 'panel', 'editar', 'admin',
      'coming-soon', 'staging', 'www', 'wedite', 'login', 'registro'
    ]));
