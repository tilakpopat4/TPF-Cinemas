-- Migration: 20260930000001_review_film_audit_log.sql
-- Description: Recreate public.review_film with audit logging via public.log_action and enforce notes requirement

create or replace function public.review_film(
  p_film_id uuid,
  p_decision public.review_decision,
  p_notes text default null
) returns void
language plpgsql security definer set search_path = public
as $$
declare
  f public.films;
begin
  -- 1. Curators/Staff check
  if not public.is_staff() then
    raise exception 'Curators only' using errcode = '42501';
  end if;

  -- 2. Lock film row and check existence
  select * into f from public.films where id = p_film_id for update;
  if not found then
    raise exception 'Film not found';
  end if;

  -- 3. Only submitted films can be reviewed
  if f.status <> 'submitted' then
    raise exception 'Only submitted films can be reviewed (current status: %)', f.status;
  end if;

  -- 4. Self-review guard (admins can review anything, curators cannot review their own film)
  if f.filmmaker_id = auth.uid() and not public.is_admin() then
    raise exception 'You can''t review your own film';
  end if;

  -- 5. Feedback notes required for non-approval decisions
  if p_decision <> 'approved' and (p_notes is null or length(trim(p_notes)) = 0) then
    raise exception 'Feedback notes are required for this decision';
  end if;

  -- 6. Insert review entry
  insert into public.film_reviews (film_id, reviewer_id, decision, notes)
  values (f.id, auth.uid(), p_decision, p_notes);

  -- 7. Update film status
  update public.films
     set status = (case p_decision
                     when 'approved'          then 'approved'
                     when 'changes_requested' then 'changes_requested'
                     else 'rejected'
                   end)::public.film_status
   where id = f.id;

  -- 8. Audit log recording
  perform public.log_action(
    'review',
    'film',
    f.id::text,
    jsonb_build_object('decision', p_decision::text)
  );
end;
$$;

grant execute on function public.review_film(uuid, public.review_decision, text) to authenticated;
