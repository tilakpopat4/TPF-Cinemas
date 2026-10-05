-- =====================================================================
-- Migration: 20261005000001_add_trailer_aspect_ratio_languages.sql
-- Purpose: Creator-controlled trailer link, content aspect ratio and
--          additional languages (audio / subtitle tracks) on films.
-- =====================================================================

alter table public.films
  add column if not exists trailer_ref text,
  add column if not exists aspect_ratio text not null default '16:9',
  add column if not exists extra_languages text[] not null default '{}';

comment on column public.films.trailer_ref is 'YouTube ID/URL (or direct stream URL) of the official trailer, streamed in the Watch Trailer player.';
comment on column public.films.aspect_ratio is 'Creator-declared aspect ratio of the content as W:H (e.g. 16:9, 2.39:1, 4:3, 9:16). Drives the player stage.';
comment on column public.films.extra_languages is 'Additional languages (dubs / subtitles) entered by the creator, besides the primary language.';

-- Public catalogue must be able to read the new columns.
grant select (trailer_ref, aspect_ratio, extra_languages) on public.films to anon, authenticated;

-- Filmmakers (draft / changes_requested rows only, enforced by RLS) can write them.
grant insert (trailer_ref, aspect_ratio, extra_languages) on public.films to authenticated;
grant update (trailer_ref, aspect_ratio, extra_languages) on public.films to authenticated;
