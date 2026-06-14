-- =====================================================================
--  Zentro — Supabase setup
--  Run this whole file in: Supabase Dashboard -> SQL Editor -> New query
-- =====================================================================

-- 1) Downloads history table -----------------------------------------
create table if not exists public.downloads (
  id           uuid primary key default gen_random_uuid(),
  source_url   text        not null,
  platform     text        not null,            -- youtube | instagram | tiktok | twitter | reddit | unknown
  title        text,
  file_size    bigint      default 0,
  quality      text        default 'best',      -- best | 1080p | 720p | 480p | audio
  status       text        default 'completed', -- completed | failed
  storage_path text,                            -- nullable: set only when file is cached in Storage
  created_at   timestamptz not null default now()
);

-- Helpful indexes for history listing + cache lookups
create index if not exists downloads_created_at_idx on public.downloads (created_at desc);
create index if not exists downloads_cache_lookup_idx
  on public.downloads (source_url, quality, status, created_at desc);

-- 2) Row Level Security ----------------------------------------------
-- The backend uses the SERVICE ROLE key, which bypasses RLS. We still enable
-- RLS (Supabase best practice) so the anon/public key cannot read or write.
alter table public.downloads enable row level security;

-- (No anon policies are created on purpose — only the service role can touch it.)

-- 3) Storage bucket for cached media ---------------------------------
-- Private bucket; the backend serves files via short-lived signed URLs.
insert into storage.buckets (id, name, public)
values ('media-cache', 'media-cache', false)
on conflict (id) do nothing;

-- Done. The backend's SERVICE ROLE key has full access to this bucket,
-- so no extra storage RLS policies are required for personal use.
