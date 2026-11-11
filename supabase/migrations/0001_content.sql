-- Portfolio owner console — schema, policies, storage.
-- Run once in the Supabase SQL editor (Dashboard → SQL → New query → paste → Run),
-- or with the Supabase CLI: `supabase db push`. Safe to run again.

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

-- ── published content: one row per section, readable by everyone ─────────
-- Drafts live in a separate table on purpose: Realtime honours row policies but not column
-- grants, so keeping drafts out of this table is what keeps them private.
create table if not exists public.content (
  section      text primary key,
  published    jsonb,
  published_at timestamptz,
  updated_at   timestamptz not null default now(),
  updated_by   text,
  constraint content_published_is_object check (published is null or jsonb_typeof(published) = 'object')
);

-- ── drafts: owner only ───────────────────────────────────────────────────
create table if not exists public.content_drafts (
  section    text primary key,
  draft      jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text,
  constraint content_draft_is_object check (jsonb_typeof(draft) = 'object')
);

-- ── every publish, for history and rollback: owner only ──────────────────
create table if not exists public.content_versions (
  id           bigint generated always as identity primary key,
  section      text not null,
  snapshot     jsonb not null,
  published_at timestamptz not null default now(),
  published_by text,
  note         text
);
create index if not exists content_versions_section_idx on public.content_versions (section, published_at desc);

alter table public.content          enable row level security;
alter table public.content_drafts   enable row level security;
alter table public.content_versions enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.content to anon, authenticated;
grant insert, update, delete on public.content to authenticated;
revoke all on public.content_drafts from anon;
grant select, insert, update, delete on public.content_drafts to authenticated;
revoke all on public.content_versions from anon;
grant select, insert on public.content_versions to authenticated;

drop policy if exists "public reads published" on public.content;
create policy "public reads published" on public.content
  for select using (true);

drop policy if exists "owner writes content" on public.content;
create policy "owner writes content" on public.content
  for all using (public.is_owner()) with check (public.is_owner());

drop policy if exists "owner only drafts" on public.content_drafts;
create policy "owner only drafts" on public.content_drafts
  for all using (public.is_owner()) with check (public.is_owner());

drop policy if exists "owner reads versions" on public.content_versions;
create policy "owner reads versions" on public.content_versions
  for select using (public.is_owner());

drop policy if exists "owner writes versions" on public.content_versions;
create policy "owner writes versions" on public.content_versions
  for insert with check (public.is_owner());

-- keep updated_at / updated_by honest on both tables
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(auth.jwt() ->> 'email', new.updated_by);
  return new;
end $$;
drop trigger if exists content_touch on public.content;
create trigger content_touch before insert or update on public.content
  for each row execute function public.touch_updated_at();
drop trigger if exists content_drafts_touch on public.content_drafts;
create trigger content_drafts_touch before insert or update on public.content_drafts
  for each row execute function public.touch_updated_at();

-- ── publish: draft → published atomically, record a version, clear the draft ─
create or replace function public.publish_section(p_section text, p_note text default null)
returns public.content
language plpgsql
security invoker
as $$
declare
  d   jsonb;
  row public.content;
begin
  if not public.is_owner() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select draft into d from public.content_drafts where section = p_section;
  if d is null then
    -- nothing drafted: re-publish what is there (records a version)
    select published into d from public.content where section = p_section;
  end if;
  if d is null then
    raise exception 'nothing to publish for section %', p_section;
  end if;
  insert into public.content (section, published, published_at)
  values (p_section, d, now())
  on conflict (section) do update set published = excluded.published, published_at = excluded.published_at
  returning * into row;
  insert into public.content_versions (section, snapshot, published_by, note)
  values (p_section, d, auth.jwt() ->> 'email', p_note);
  delete from public.content_drafts where section = p_section;
  return row;
end $$;
grant execute on function public.publish_section(text, text) to authenticated;

-- ── restore an earlier version into the draft (then publish to go live) ──
create or replace function public.restore_version(p_version_id bigint)
returns public.content_drafts
language plpgsql
security invoker
as $$
declare
  v   public.content_versions;
  row public.content_drafts;
begin
  if not public.is_owner() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into v from public.content_versions where id = p_version_id;
  if v.id is null then raise exception 'unknown version %', p_version_id; end if;
  insert into public.content_drafts (section, draft) values (v.section, v.snapshot)
  on conflict (section) do update set draft = excluded.draft
  returning * into row;
  return row;
end $$;
grant execute on function public.restore_version(bigint) to authenticated;

-- ── realtime: the site hears publishes (published table only — never drafts) ─
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
