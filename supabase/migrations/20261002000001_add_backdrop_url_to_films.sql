-- =====================================================================
-- Migration: 20261002000001_add_backdrop_url_to_films.sql
-- Purpose: Add landscape backdrop_url to films table for cinema billboard & players
-- =====================================================================

alter table public.films
  add column if not exists backdrop_url text;

comment on column public.films.backdrop_url is 'Compulsory landscape 16:9 widescreen artwork used for hero billboards, watchroom backdrops, and widescreen previews.';
