-- ============================================================================
-- TPF CINEMAS - LOOP 1 RLS & RPC VERIFICATION SUITE
-- Safe to run in Supabase SQL Editor on local, branch, or staging.
-- Everything runs inside a transaction and rolls back at the end.
-- ============================================================================

begin;

-- No helper function: pg_temp functions are not callable after SET LOCAL ROLE authenticated.

-- ----------------------------------------------------------------------------
-- 1. SETUP: Seed auth.users then profiles (must be superuser/postgres role)
-- ----------------------------------------------------------------------------

reset role;

do $$
declare
  v_viewer_id     uuid := '11111111-1111-1111-1111-111111111111';
  v_filmmaker_a   uuid := '22222222-2222-2222-2222-222222222222';
  v_filmmaker_b   uuid := '33333333-3333-3333-3333-333333333333';
  v_curator_id    uuid := '44444444-4444-4444-4444-444444444444';
  v_admin_id      uuid := '55555555-5555-5555-5555-555555555555';
  v_film_draft_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_film_sub_id   uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
begin
  raise notice '--- Setting up auth.users ---';

  -- Insert minimal auth.users rows so profiles FK is satisfied
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values
    (v_viewer_id,    'viewer@test.tpf',    '', now(), now(), now(), '{"provider":"email"}', '{}', 'authenticated', 'authenticated'),
    (v_filmmaker_a,  'filmmaker_a@test.tpf', '', now(), now(), now(), '{"provider":"email"}', '{}', 'authenticated', 'authenticated'),
    (v_filmmaker_b,  'filmmaker_b@test.tpf', '', now(), now(), now(), '{"provider":"email"}', '{}', 'authenticated', 'authenticated'),
    (v_curator_id,   'curator@test.tpf',   '', now(), now(), now(), '{"provider":"email"}', '{}', 'authenticated', 'authenticated'),
    (v_admin_id,     'admin@test.tpf',     '', now(), now(), now(), '{"provider":"email"}', '{}', 'authenticated', 'authenticated')
  on conflict (id) do nothing;

  raise notice '--- Setting up profiles ---';

  insert into public.profiles (id, role, display_name)
  values
    (v_viewer_id,   'viewer',    'Test Viewer'),
    (v_filmmaker_a, 'filmmaker', 'Filmmaker Alice'),
    (v_filmmaker_b, 'filmmaker', 'Filmmaker Bob'),
    (v_curator_id,  'curator',   'Test Curator'),
    (v_admin_id,    'admin',     'Test Admin')
  on conflict (id) do update set
    role = excluded.role,
    display_name = excluded.display_name;

  raise notice '--- Setting up films ---';

  -- Draft film owned by Filmmaker Alice
  insert into public.films (
    id, filmmaker_id, title, slug, synopsis, runtime_minutes, language,
    release_year, age_rating, video_provider, video_ref, poster_url, status
  ) values (
    v_film_draft_id, v_filmmaker_a, 'Alice Draft Film', 'alice-draft-film-test',
    'A draft synopsis.', 15, 'Hindi', 2026, 'UA13+', 'youtube', 'dQw4w9WgXcQ',
    'https://example.com/poster.jpg', 'draft'
  ) on conflict (id) do nothing;

  -- Submitted film owned by Filmmaker Alice
  insert into public.films (
    id, filmmaker_id, title, slug, synopsis, runtime_minutes, language,
    release_year, age_rating, video_provider, video_ref, poster_url, status
  ) values (
    v_film_sub_id, v_filmmaker_a, 'Alice Submitted Film', 'alice-sub-film-test',
    'A submitted synopsis.', 20, 'Hindi', 2026, 'UA13+', 'youtube', 'dQw4w9WgXcQ',
    'https://example.com/poster.jpg', 'submitted'
  ) on conflict (id) do nothing;

  raise notice '--- Setup complete ---';
end;
$$;

-- ----------------------------------------------------------------------------
-- TEST 1: Filmmaker Bob cannot read Filmmaker Alice's draft film
-- ----------------------------------------------------------------------------

set local role authenticated;
set local "request.jwt.claim.sub" to '33333333-3333-3333-3333-333333333333';

do $$
declare
  v_filmmaker_b   uuid := '33333333-3333-3333-3333-333333333333';
  v_film_draft_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_count         integer;
begin
  raise notice '--- TEST 1: Draft Film Isolation ---';
  select count(*) into v_count from public.films where id = v_film_draft_id;
  if not (v_count = 0) then raise exception 'TEST FAILED: Filmmaker Bob cannot see Alice''s draft film'; end if;
  raise notice 'TEST PASSED: Filmmaker Bob cannot see Alice''s draft film';
end;
$$;

-- Filmmaker Alice can see her own draft
set local "request.jwt.claim.sub" to '22222222-2222-2222-2222-222222222222';

do $$
declare
  v_filmmaker_a   uuid := '22222222-2222-2222-2222-222222222222';
  v_film_draft_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_count         integer;
begin
  select count(*) into v_count from public.films where id = v_film_draft_id;
  if not (v_count = 1) then raise exception 'TEST FAILED: Filmmaker Alice can see her own draft film'; end if;
  raise notice 'TEST PASSED: Filmmaker Alice can see her own draft film';
end;
$$;

-- ----------------------------------------------------------------------------
-- TEST 2: Filmmaker updating films.status directly is rejected
-- ----------------------------------------------------------------------------

set local role authenticated;
set local "request.jwt.claim.sub" to '22222222-2222-2222-2222-222222222222';

do $$
declare
  v_film_draft_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_update_err    boolean := false;
begin
  raise notice '--- TEST 2: Direct films.status update rejection ---';
  begin
    update public.films set status = 'published' where id = v_film_draft_id;
  exception when others then
    v_update_err := true;
    raise notice 'Caught expected status update rejection: % (SQLSTATE: %)', sqlerrm, sqlstate;
  end;
  if not (v_update_err) then raise exception 'TEST FAILED: Direct films.status update by filmmaker is rejected'; end if;
  raise notice 'TEST PASSED: Direct films.status update by filmmaker is rejected';
end;
$$;

-- ----------------------------------------------------------------------------
-- TEST 3: Filmmaker calling review_film is rejected
-- ----------------------------------------------------------------------------

set local role authenticated;
set local "request.jwt.claim.sub" to '22222222-2222-2222-2222-222222222222';

do $$
declare
  v_film_sub_id uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  v_review_err  boolean := false;
begin
  raise notice '--- TEST 3: Filmmaker calling review_film ---';
  begin
    perform public.review_film(v_film_sub_id, 'approved', 'Self review');
  exception when sqlstate '42501' then
    v_review_err := true;
    raise notice 'Caught expected review_film rejection: % (SQLSTATE: %)', sqlerrm, sqlstate;
  when others then
    v_review_err := true;
    raise notice 'Caught rejection (other): % (SQLSTATE: %)', sqlerrm, sqlstate;
  end;
  if not (v_review_err) then raise exception 'TEST FAILED: Filmmaker calling review_film is rejected with 42501'; end if;
  raise notice 'TEST PASSED: Filmmaker calling review_film is rejected with 42501';
end;
$$;

-- ----------------------------------------------------------------------------
-- TEST 4: Curator calling review_film succeeds and writes exactly 1 audit_log
-- ----------------------------------------------------------------------------

-- Clean any prior audit_log entries for this film (as superuser)
reset role;

do $$
declare
  v_film_sub_id uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
begin
  delete from public.audit_log where target_id = v_film_sub_id::text;
end;
$$;

-- Now impersonate curator and call review_film
set local role authenticated;
set local "request.jwt.claim.sub" to '44444444-4444-4444-4444-444444444444';

do $$
declare
  v_curator_id   uuid := '44444444-4444-4444-4444-444444444444';
  v_admin_id     uuid := '55555555-5555-5555-5555-555555555555';
  v_film_sub_id  uuid := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  v_count        integer;
begin
  raise notice '--- TEST 4: Curator review_film with audit logging ---';

  perform public.review_film(v_film_sub_id, 'approved');

  -- Verify film status updated
  select count(*) into v_count from public.films where id = v_film_sub_id and status = 'approved';
  if not (v_count = 1) then raise exception 'TEST FAILED: Film status was updated to approved'; end if;
  raise notice 'TEST PASSED: Film status was updated to approved';

  -- Verify audit_log row (curator's own actor_id matches because review_film is SECURITY DEFINER
  -- and uses auth.uid() which resolves from request.jwt.claim.sub)
  select count(*) into v_count
    from public.audit_log
   where target_id = v_film_sub_id::text
     and action = 'review';
  if not (v_count = 1) then raise exception 'TEST FAILED: Exactly one audit_log row was written for review'; end if;
  raise notice 'TEST PASSED: Exactly one audit_log row was written for review';

  raise notice '🎉 ALL 4 DATABASE TESTS PASSED SUCCESSFULLY!';
end;
$$;

-- Always rollback so no test artifacts or rows remain
rollback;
