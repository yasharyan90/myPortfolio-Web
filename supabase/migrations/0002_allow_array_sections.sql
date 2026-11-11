-- Fix: three sections (projects, education, socials) are JSON arrays, not objects.
-- The original check constraints rejected them, so seeding and saving those sections failed.
-- Run this once in the SQL editor if you ran 0001 before 2026-11-11 15:30 IST. Safe to run again.

alter table public.content drop constraint if exists content_published_is_object;
alter table public.content
  add constraint content_published_is_object
  check (published is null or jsonb_typeof(published) in ('object', 'array'));

alter table public.content_drafts drop constraint if exists content_draft_is_object;
alter table public.content_drafts
  add constraint content_draft_is_object
  check (jsonb_typeof(draft) in ('object', 'array'));
