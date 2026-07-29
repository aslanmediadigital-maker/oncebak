-- Run this migration manually in the Supabase SQL Editor.
-- It keeps the legacy menu_url column intact for backwards compatibility.

alter table public.businesses
  add column if not exists menu_images text[] not null default '{}',
  add column if not exists menu_updated_at timestamptz;
