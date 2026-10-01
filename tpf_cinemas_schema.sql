-- =====================================================================
-- TPF Cinemas: database schema, roles and privileges
-- Target: Supabase (PostgreSQL 15+). Run in the SQL Editor, top to bottom.
--
-- HOW ACCESS CONTROL WORKS (three layers)
--   1. Postgres roles     anon (logged out), authenticated (logged in),
--                         service_role (server only, bypasses everything).
--   2. App roles          viewer, filmmaker, curator, admin.
--                         Stored in profiles.role and checked by RLS policies.
--   3. Column grants +    Sensitive changes (publishing, featuring, role changes,
--      functions          status changes) are NOT possible with plain UPDATEs.
--                         They only happen through the functions in section 7.
--
-- NEVER put the service_role key in the website or app. Server-side only.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. TYPES
-- ---------------------------------------------------------------------
create type public.app_role        as enum ('viewer', 'filmmaker', 'curator', 'admin');
create type public.film_status     as enum ('draft', 'submitted', 'changes_requested',
                                            'approved', 'published', 'rejected', 'archived');
create type public.video_provider  as enum ('youtube', 'mux');
create type public.review_decision as enum ('approved', 'changes_requested', 'rejected');
-- Indian OTT self-classification categories. Confirm current rules with a lawyer.
create type public.age_rating      as enum ('U', 'UA7+', 'UA13+', 'UA16+', 'A');


-- ---------------------------------------------------------------------
-- 2. TABLES
-- ---------------------------------------------------------------------

-- One row per signed-up user. Created automatically (see section 4).
create table public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  role             public.app_role not null default 'viewer',
  display_name     text not null default '' check (char_length(display_name) <= 80),
  bio              text check (char_length(bio) <= 600),
  avatar_url       text,
  city             text,
  website_url      text,
  instagram_handle text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.genres (
  id   smallint generated always as identity primary key,
  name text not null unique,
  slug text not null unique
);

create table public.films (
  id              uuid primary key default gen_random_uuid(),
  -- Deleting a user with films is blocked on purpose (licences must be kept).
  -- Handle those accounts manually as an admin.
  filmmaker_id    uuid not null references public.profiles (id) on delete restrict,
  title           text not null check (char_length(title) between 1 and 120),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  synopsis        text check (char_length(synopsis) <= 1500),
  director_note   text check (char_length(director_note) <= 1500),
  runtime_minutes smallint check (runtime_minutes between 1 and 240),
  language        text not null,
  release_year    smallint check (release_year between 1990 and 2100),
  age_rating      public.age_rating,
  poster_url      text,
  video_provider  public.video_provider not null default 'youtube',
  video_ref       text,                       -- YouTube video ID or Mux playback ID
  is_debut        boolean not null default false,   -- self-declared, curators verify
  is_featured     boolean not null default false,
  status          public.film_status not null default 'draft',
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint published_needs_video
    check (status <> 'published' or (video_ref is not null and published_at is not null))
);

create table public.film_genres (
  film_id  uuid     not null references public.films (id) on delete cascade,
  genre_id smallint not null references public.genres (id) on delete restrict,
  primary key (film_id, genre_id)
);

create table public.film_credits (
  id          uuid primary key default gen_random_uuid(),
  film_id     uuid not null references public.films (id) on delete cascade,
  person_name text not null,
  credit_role text not null,                  -- e.g. Director, Editor, Music
  sort_order  smallint not null default 0
);

-- Review history. Filmmakers can read the feedback on their own films.
create table public.film_reviews (
  id          uuid primary key default gen_random_uuid(),
  film_id     uuid not null references public.films (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id),
  decision    public.review_decision not null,
  notes       text,
  created_at  timestamptz not null default now(),
  constraint feedback_required
    check (decision = 'approved' or char_length(coalesce(notes, '')) > 0)
);

-- The non-exclusive licence: filmmakers keep all rights (festivals stay open).
create table public.licence_agreements (
  id             uuid primary key default gen_random_uuid(),
  film_id        uuid not null unique references public.films (id) on delete cascade,
  filmmaker_id   uuid not null references public.profiles (id),
  licence_type   text not null default 'non_exclusive' check (licence_type = 'non_exclusive'),
  territory      text not null default 'worldwide',
  term_months    smallint not null default 24 check (term_months between 6 and 120),
  music_cleared  boolean not null default false,    -- filmmaker's declaration
  terms_version  text not null,
  agreement_path text,                              -- path in the private 'licences' bucket
  signed_at      timestamptz not null default now(),
  verified_by    uuid references public.profiles (id),
  verified_at    timestamptz                        -- set by staff, required to publish
);

create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  film_id    uuid not null references public.films (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 1000),
  is_hidden  boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.watchlist (
  user_id  uuid not null references public.profiles (id) on delete cascade,
  film_id  uuid not null references public.films (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (user_id, film_id)
);

create table public.watch_history (
  user_id          uuid not null references public.profiles (id) on delete cascade,
  film_id          uuid not null references public.films (id) on delete cascade,
  progress_seconds integer not null default 0 check (progress_seconds >= 0),
  completed        boolean not null default false,
  updated_at       timestamptz not null default now(),
  primary key (user_id, film_id)
);

-- Who did what (role changes, takedowns, publishing). Admin-readable only.
create table public.audit_log (
  id          bigint generated always as identity primary key,
  actor_id    uuid references public.profiles (id) on delete set null,
  action      text not null,
  target_type text not null,
  target_id   text not null,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index films_status_idx       on public.films (status);
create index films_filmmaker_idx    on public.films (filmmaker_id);
create index films_published_idx    on public.films (published_at desc) where status = 'published';
create index film_genres_genre_idx  on public.film_genres (genre_id);
create index film_credits_film_idx  on public.film_credits (film_id);
create index film_reviews_film_idx  on public.film_reviews (film_id);
create index comments_film_idx      on public.comments (film_id, created_at desc);
create index watch_history_user_idx on public.watch_history (user_id, updated_at desc);


-- ---------------------------------------------------------------------
-- 3. HELPER FUNCTIONS (used inside policies)
--    SECURITY DEFINER so they can read profiles without recursing into RLS.
-- ---------------------------------------------------------------------
create or replace function public.current_app_role()
returns public.app_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(public.current_app_role() = 'admin', false);
$$;

-- "Staff" means curator or admin.
create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(public.current_app_role() in ('curator', 'admin'), false);
$$;

create or replace function public.log_action(
  p_action text, p_target_type text, p_target_id text, p_details jsonb default '{}'::jsonb
) returns void
language sql security definer set search_path = public
as $$
  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (auth.uid(), p_action, p_target_type, p_target_id, p_details);
$$;


-- ---------------------------------------------------------------------
-- 4. TRIGGERS
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated      before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger films_updated         before update on public.films
  for each row execute function public.set_updated_at();
create trigger watch_history_updated before update on public.watch_history
  for each row execute function public.set_updated_at();

-- Every new signup gets a 'viewer' profile automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1), ''), 80)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ---------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY: switch it on everywhere
-- ---------------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.genres             enable row level security;
alter table public.films              enable row level security;
alter table public.film_genres        enable row level security;
alter table public.film_credits       enable row level security;
alter table public.film_reviews       enable row level security;
alter table public.licence_agreements enable row level security;
alter table public.comments           enable row level security;
alter table public.watchlist          enable row level security;
alter table public.watch_history      enable row level security;
alter table public.audit_log          enable row level security;



-- ---------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY POLICIES
--    Rule of thumb: policies decide WHICH ROWS, column grants (section 8)
--    decide WHICH COLUMNS, functions (section 7) decide WORKFLOW STEPS.
-- ---------------------------------------------------------------------

-- profiles: public read (anon only sees the columns granted in 8a)
create policy profiles_read on public.profiles
  for select to anon, authenticated using (true);
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- genres: public read, admin write
create policy genres_read on public.genres
  for select to anon, authenticated using (true);
create policy genres_admin_write on public.genres
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- films
create policy films_public_read on public.films
  for select to anon, authenticated using (status = 'published');
create policy films_owner_read on public.films
  for select to authenticated using (filmmaker_id = auth.uid());
create policy films_staff_read on public.films
  for select to authenticated using (public.is_staff());
create policy films_insert on public.films
  for insert to authenticated
  with check (filmmaker_id = auth.uid() and public.current_app_role() in ('filmmaker', 'admin'));
-- filmmakers can edit only while the film is a draft or needs changes
create policy films_owner_update on public.films
  for update to authenticated
  using (filmmaker_id = auth.uid() and status in ('draft', 'changes_requested'))
  with check (filmmaker_id = auth.uid());
create policy films_admin_update on public.films
  for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy films_delete on public.films
  for delete to authenticated
  using ((filmmaker_id = auth.uid() and status = 'draft') or public.is_admin());

-- film_genres and film_credits: visible whenever the film is visible to you
create policy film_genres_read on public.film_genres
  for select to anon, authenticated
  using (exists (select 1 from public.films f where f.id = film_id));
create policy film_genres_write on public.film_genres
  for all to authenticated
  using (exists (select 1 from public.films f
                 where f.id = film_id and f.filmmaker_id = auth.uid()
                   and f.status in ('draft', 'changes_requested')) or public.is_admin())
  with check (exists (select 1 from public.films f
                 where f.id = film_id and f.filmmaker_id = auth.uid()
                   and f.status in ('draft', 'changes_requested')) or public.is_admin());

create policy film_credits_read on public.film_credits
  for select to anon, authenticated
  using (exists (select 1 from public.films f where f.id = film_id));
create policy film_credits_write on public.film_credits
  for all to authenticated
  using (exists (select 1 from public.films f
                 where f.id = film_id and f.filmmaker_id = auth.uid()
                   and f.status in ('draft', 'changes_requested')) or public.is_admin())
  with check (exists (select 1 from public.films f
                 where f.id = film_id and f.filmmaker_id = auth.uid()
                   and f.status in ('draft', 'changes_requested')) or public.is_admin());

-- film_reviews: staff and the film's own filmmaker (writes only via review_film)
create policy film_reviews_read on public.film_reviews
  for select to authenticated
  using (public.is_staff()
         or exists (select 1 from public.films f where f.id = film_id and f.filmmaker_id = auth.uid()));

-- licence_agreements: owner and staff read; owner edits until staff verify it
create policy licences_read on public.licence_agreements
  for select to authenticated
  using (filmmaker_id = auth.uid() or public.is_staff());
create policy licences_insert on public.licence_agreements
  for insert to authenticated
  with check (filmmaker_id = auth.uid()
              and exists (select 1 from public.films f where f.id = film_id and f.filmmaker_id = auth.uid()));
create policy licences_update on public.licence_agreements
  for update to authenticated
  using (filmmaker_id = auth.uid() and verified_at is null)
  with check (filmmaker_id = auth.uid());

-- comments: logged-in users see visible comments on published films
create policy comments_read on public.comments
  for select to authenticated
  using ((not is_hidden and exists (select 1 from public.films f
                                    where f.id = film_id and f.status = 'published'))
         or user_id = auth.uid()
         or public.is_staff());
create policy comments_insert on public.comments
  for insert to authenticated
  with check (user_id = auth.uid()
              and exists (select 1 from public.films f where f.id = film_id and f.status = 'published'));
create policy comments_delete on public.comments
  for delete to authenticated
  using (user_id = auth.uid() or public.is_staff());

-- watchlist and watch_history: strictly private to each user
create policy watchlist_own on public.watchlist
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid()
              and exists (select 1 from public.films f where f.id = film_id and f.status = 'published'));
create policy watch_history_own on public.watch_history
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- audit_log: admin read only (rows are written by functions)
create policy audit_log_admin_read on public.audit_log
  for select to authenticated using (public.is_admin());


-- ---------------------------------------------------------------------
-- 7. WORKFLOW FUNCTIONS (the only way to change roles, status, featuring)
--    All are SECURITY DEFINER and check the caller's role themselves.
--    Film life cycle:
--    draft -> submitted -> approved -> published (-> archived)
--                       -> changes_requested -> (edit) -> submitted
--                       -> rejected
-- ---------------------------------------------------------------------

-- Any signed-in viewer can become a filmmaker (beginner-friendly, no gatekeeping).
create or replace function public.become_filmmaker()
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sign in first' using errcode = '28000';
  end if;
  update public.profiles set role = 'filmmaker' where id = auth.uid() and role = 'viewer';
end;
$$;

-- Admin only. You can't change your own role (protects the last admin).
create or replace function public.set_user_role(p_user_id uuid, p_role public.app_role)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'You can''t change your own role';
  end if;
  update public.profiles set role = p_role where id = p_user_id;
  if not found then
    raise exception 'User not found';
  end if;
  perform public.log_action('set_role', 'profile', p_user_id::text,
                            jsonb_build_object('role', p_role));
end;
$$;

-- Filmmaker submits their own film for review.
create or replace function public.submit_film(p_film_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  f public.films;
begin
  select * into f from public.films
   where id = p_film_id and filmmaker_id = auth.uid() for update;
  if not found then
    raise exception 'Film not found';
  end if;
  if f.status not in ('draft', 'changes_requested') then
    raise exception 'A film with status % can''t be submitted', f.status;
  end if;
  if f.video_ref is null or f.poster_url is null then
    raise exception 'Add a video and a poster before submitting';
  end if;
  if not exists (select 1 from public.licence_agreements where film_id = f.id) then
    raise exception 'Sign the licence agreement before submitting';
  end if;
  update public.films set status = 'submitted' where id = f.id;
end;
$$;

-- Staff decision on a submitted film. Feedback is mandatory unless approving.
create or replace function public.review_film(
  p_film_id uuid, p_decision public.review_decision, p_notes text default null
) returns void
language plpgsql security definer set search_path = public
as $$
declare
  f public.films;
begin
  if not public.is_staff() then
    raise exception 'Curators only' using errcode = '42501';
  end if;
  select * into f from public.films where id = p_film_id for update;
  if not found then
    raise exception 'Film not found';
  end if;
  if f.status <> 'submitted' then
    raise exception 'Only submitted films can be reviewed (current status: %)', f.status;
  end if;
  if f.filmmaker_id = auth.uid() and not public.is_admin() then
    raise exception 'You can''t review your own film';
  end if;

  insert into public.film_reviews (film_id, reviewer_id, decision, notes)
  values (f.id, auth.uid(), p_decision, p_notes);

  update public.films
     set status = (case p_decision
                     when 'approved'          then 'approved'
                     when 'changes_requested' then 'changes_requested'
                     else 'rejected'
                   end)::public.film_status
   where id = f.id;
end;
$$;

-- Staff confirm the licence and music clearance are in order.
create or replace function public.verify_licence(p_film_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'Curators only' using errcode = '42501';
  end if;
  update public.licence_agreements
     set verified_by = auth.uid(), verified_at = now()
   where film_id = p_film_id and music_cleared;
  if not found then
    raise exception 'No licence with music clearance declared for this film';
  end if;
  perform public.log_action('verify_licence', 'film', p_film_id::text);
end;
$$;

-- Staff publish an approved film. Needs a verified licence.
create or replace function public.publish_film(p_film_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  f public.films;
begin
  if not public.is_staff() then
    raise exception 'Curators only' using errcode = '42501';
  end if;
  select * into f from public.films where id = p_film_id for update;
  if not found then
    raise exception 'Film not found';
  end if;
  if f.status <> 'approved' then
    raise exception 'Only approved films can be published (current status: %)', f.status;
  end if;
  if not exists (select 1 from public.licence_agreements
                  where film_id = f.id and verified_at is not null) then
    raise exception 'Verify the licence before publishing';
  end if;
  update public.films set status = 'published', published_at = now() where id = f.id;
  perform public.log_action('publish', 'film', f.id::text);
end;
$$;

-- Admin only: pick what appears in the homepage hero.
create or replace function public.feature_film(p_film_id uuid, p_featured boolean)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  update public.films set is_featured = p_featured
   where id = p_film_id and status = 'published';
  if not found then
    raise exception 'Only published films can be featured';
  end if;
  perform public.log_action('feature', 'film', p_film_id::text,
                            jsonb_build_object('featured', p_featured));
end;
$$;

-- Admin only: remove a film from the platform (licence or legal issue).
create or replace function public.takedown_film(p_film_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  update public.films set status = 'archived', is_featured = false
   where id = p_film_id and status <> 'archived';
  if not found then
    raise exception 'Film not found or already archived';
  end if;
  perform public.log_action('takedown', 'film', p_film_id::text);
end;
$$;

-- Staff moderation: hide (or restore) a comment without deleting it.
create or replace function public.hide_comment(p_comment_id uuid, p_hidden boolean default true)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'Curators only' using errcode = '42501';
  end if;
  update public.comments set is_hidden = p_hidden where id = p_comment_id;
  if not found then
    raise exception 'Comment not found';
  end if;
  perform public.log_action('hide_comment', 'comment', p_comment_id::text,
                            jsonb_build_object('hidden', p_hidden));
end;
$$;

-- ---------------------------------------------------------------------
-- 8. PRIVILEGES: start from zero, then grant only what each role needs
--    (Supabase grants broad defaults to anon/authenticated; remove them.)
-- ---------------------------------------------------------------------
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;

alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges revoke execute on functions from public;

grant usage on schema public to anon, authenticated;

-- 8a. anon (not logged in): browse the public catalogue only
grant select on public.genres, public.films, public.film_genres, public.film_credits to anon;
-- Explicit columns only: 'role' is not exposed. Clients must list columns, not select *.
grant select (id, display_name, bio, avatar_url, city, website_url, instagram_handle, created_at)
  on public.profiles to anon;

-- 8b. authenticated (all logged-in users; RLS narrows by app role)
grant select on
  public.genres, public.films, public.film_genres, public.film_credits,
  public.film_reviews, public.profiles, public.licence_agreements,
  public.comments, public.watchlist, public.watch_history, public.audit_log
  to authenticated;

-- own profile: cosmetic columns only ('role' can only change via set_user_role)
grant update (display_name, bio, avatar_url, city, website_url, instagram_handle)
  on public.profiles to authenticated;

-- films: filmmakers write content fields. 'status', 'is_featured', 'published_at'
-- are NOT grantable here, so they can only change through the section 7 functions.
grant insert (filmmaker_id, title, slug, synopsis, director_note, runtime_minutes, language,
              release_year, age_rating, poster_url, video_provider, video_ref, is_debut)
  on public.films to authenticated;
grant update (title, slug, synopsis, director_note, runtime_minutes, language,
              release_year, age_rating, poster_url, video_provider, video_ref, is_debut)
  on public.films to authenticated;
grant delete on public.films to authenticated;

grant insert, delete on public.film_genres to authenticated;
grant insert, update, delete on public.film_credits to authenticated;

grant insert (film_id, filmmaker_id, territory, term_months, music_cleared, terms_version, agreement_path)
  on public.licence_agreements to authenticated;
grant update (term_months, music_cleared, terms_version, agreement_path)
  on public.licence_agreements to authenticated;

grant insert (film_id, user_id, body) on public.comments to authenticated;
grant delete on public.comments to authenticated;

grant insert, delete on public.watchlist to authenticated;

grant insert (user_id, film_id, progress_seconds, completed) on public.watch_history to authenticated;
grant update (progress_seconds, completed) on public.watch_history to authenticated;

-- genres are admin-managed (RLS enforces admin-only writes)
grant insert, update, delete on public.genres to authenticated;

-- reviews, audit_log: no direct writes for anyone; functions write them.

-- 8c. functions callable by logged-in users (each one checks the caller's role inside)
grant execute on function
  public.current_app_role(), public.is_admin(), public.is_staff(),
  public.become_filmmaker(), public.submit_film(uuid),
  public.review_film(uuid, public.review_decision, text),
  public.verify_licence(uuid), public.publish_film(uuid),
  public.feature_film(uuid, boolean), public.takedown_film(uuid),
  public.hide_comment(uuid, boolean), public.set_user_role(uuid, public.app_role)
  to authenticated;


-- ---------------------------------------------------------------------
-- 9. STORAGE BUCKETS (Supabase Storage)
--    posters   public   filmmakers upload into their own folder: <user_id>/file.jpg
--    licences  private  signed agreements: owner + staff read, nobody edits
--    Keep video out of Supabase Storage (see the free-tier limits we discussed).
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('posters',  'posters',  true,  5242880,  array['image/jpeg', 'image/png', 'image/webp']),
  ('licences', 'licences', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy posters_upload on storage.objects
  for insert to authenticated
  with check (bucket_id = 'posters'
              and (storage.foldername(name))[1] = auth.uid()::text
              and public.current_app_role() in ('filmmaker', 'admin'));
create policy posters_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'posters' and (storage.foldername(name))[1] = auth.uid()::text);
create policy posters_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'posters' and (storage.foldername(name))[1] = auth.uid()::text);

create policy licences_upload on storage.objects
  for insert to authenticated
  with check (bucket_id = 'licences'
              and (storage.foldername(name))[1] = auth.uid()::text
              and public.current_app_role() in ('filmmaker', 'admin'));
create policy licences_read_own_or_staff on storage.objects
  for select to authenticated
  using (bucket_id = 'licences'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff()));
create policy licences_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'licences' and public.is_admin());


-- ---------------------------------------------------------------------
-- 10. STARTER DATA
-- ---------------------------------------------------------------------
insert into public.genres (name, slug) values
  ('Drama', 'drama'), ('Comedy', 'comedy'), ('Thriller', 'thriller'),
  ('Horror', 'horror'), ('Romance', 'romance'), ('Documentary', 'documentary'),
  ('Animation', 'animation'), ('Experimental', 'experimental'),
  ('Sci-fi', 'sci-fi'), ('Family', 'family');

-- MAKE YOURSELF ADMIN: sign up once in the app, then run this in the SQL Editor
-- (the editor runs as the database owner, so the grants above don't block it):
--
--   update public.profiles set role = 'admin'
--    where id = (select id from auth.users where email = 'you@example.com');
--
-- Then promote curators from your admin screen with:
--   select public.set_user_role('<user uuid>', 'curator');
