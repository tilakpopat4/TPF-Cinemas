-- =====================================================================
-- TPF Cinemas: Seed Data
-- =====================================================================

-- Starter Genres
insert into public.genres (name, slug) values
  ('Drama', 'drama'),
  ('Comedy', 'comedy'),
  ('Thriller', 'thriller'),
  ('Horror', 'horror'),
  ('Romance', 'romance'),
  ('Documentary', 'documentary'),
  ('Animation', 'animation'),
  ('Experimental', 'experimental'),
  ('Sci-fi', 'sci-fi'),
  ('Family', 'family')
on conflict (slug) do nothing;
