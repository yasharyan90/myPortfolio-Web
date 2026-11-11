-- Portfolio owner console — schema, policies, storage.
-- Run once in the Supabase SQL editor (Dashboard → SQL → New query → paste → Run),
-- or with the Supabase CLI: `supabase db push`.

-- ── who may edit ─────────────────────────────────────────────────────────
create table if not exists public.owners (
  email text primary key,
  added_at timestamptz not null default now()
);
alter table public.owners enable row level security;
-- nobody reads or writes this through the API; it is only consulted by is_owner()
revoke all on public.owners from anon, authenticated;

insert into public.owners (email) values ('yasharyanchunar90@gmail.com')
on conflict (email) do nothing;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.owners
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function public.is_owner() from public;
grant execute on function public.is_owner() to anon, authenticated;

-- ── content: one row per section, draft + published JSON ─────────────────
create table if not exists public.content (
  section      text primary key,
  draft        jsonb,
  published    jsonb,
  published_at timestamptz,
  updated_at   timestamptz not null default now(),
  updated_by   text,
  constraint content_draft_is_object     check (draft is null or jsonb_typeof(draft) = 'object'),
  constraint content_published_is_object check (published is null or jsonb_typeof(published) = 'object')
);

create table if not exists public.content_versions (
  id           bigint generated always as identity primary key,
  section      text not null references public.content(section) on delete cascade,
  snapshot     jsonb not null,
  published_at timestamptz not null default now(),
  published_by text,
  note         text
);
create index if not exists content_versions_section_idx on public.content_versions (section, published_at desc);

alter table public.content enable row level security;
alter table public.content_versions enable row level security;

-- visitors: may read only the published columns (column grants hide drafts even with a permissive policy)
revoke all on public.content from anon, authenticated;
grant select (section, published, published_at) on public.content to anon;
grant select on public.content to authenticated;
grant insert, update, delete on public.content to authenticated;
grant select, insert on public.content_versions to authenticated;
grant usage on schema public to anon, authenticated;

drop policy if exists "public reads published" on public.content;
create policy "public reads published" on public.content
  for select using (auth.role() = 'anon' or public.is_owner());

drop policy if exists "owner writes content" on public.content;
create policy "owner writes content" on public.content
  for all using (public.is_owner()) with check (public.is_owner());

drop policy if exists "owner reads versions" on public.content_versions;
create policy "owner reads versions" on public.content_versions
  for select using (public.is_owner());

drop policy if exists "owner writes versions" on public.content_versions;
create policy "owner writes versions" on public.content_versions
  for insert with check (public.is_owner());

-- keep updated_at honest
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(auth.jwt() ->> 'email', new.updated_by);
  return new;
end $$;
drop trigger if exists content_touch on public.content;
create trigger content_touch before update on public.content
  for each row execute function public.touch_updated_at();

-- ── publish: copy draft → published atomically and record a version ──────
create or replace function public.publish_section(p_section text, p_note text default null)
returns public.content
language plpgsql
security invoker
as $$
declare
  row public.content;
begin
  if not public.is_owner() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  update public.content
     set published = coalesce(draft, published),
         published_at = now()
   where section = p_section
   returning * into row;
  if row.section is null then
    raise exception 'unknown section %', p_section;
  end if;
  insert into public.content_versions (section, snapshot, published_by, note)
  values (row.section, row.published, auth.jwt() ->> 'email', p_note);
  return row;
end $$;
grant execute on function public.publish_section(text, text) to authenticated;

-- ── restore an earlier version into the draft (then publish to go live) ──
create or replace function public.restore_version(p_version_id bigint)
returns public.content
language plpgsql
security invoker
as $$
declare
  v public.content_versions;
  row public.content;
begin
  if not public.is_owner() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into v from public.content_versions where id = p_version_id;
  if v.id is null then raise exception 'unknown version %', p_version_id; end if;
  update public.content set draft = v.snapshot where section = v.section returning * into row;
  return row;
end $$;
grant execute on function public.restore_version(bigint) to authenticated;

-- ── realtime: let the site hear publishes ────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'content'
  ) then
    alter publication supabase_realtime add table public.content;
  end if;
end $$;

-- ── storage: media bucket (covers, portrait, résumé PDF) ──────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 8388608, array['image/png','image/jpeg','image/webp','image/gif','image/svg+xml','application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects
  for select using (bucket_id = 'media');

drop policy if exists "media owner write" on storage.objects;
create policy "media owner write" on storage.objects
  for insert with check (bucket_id = 'media' and public.is_owner());

drop policy if exists "media owner update" on storage.objects;
create policy "media owner update" on storage.objects
  for update using (bucket_id = 'media' and public.is_owner()) with check (bucket_id = 'media' and public.is_owner());

drop policy if exists "media owner delete" on storage.objects;
create policy "media owner delete" on storage.objects
  for delete using (bucket_id = 'media' and public.is_owner());
