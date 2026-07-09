create or replace function public.finder_has_active_source_submission(request_uuid uuid, user_uuid uuid)
returns boolean
language sql
security definer
set search_path = public, pg_catalog
as $$
  select user_uuid = (select auth.uid())
    and exists (
      select 1
      from public.source_submissions
      where request_id = request_uuid
        and finder_id = user_uuid
        and status not in ('withdrawn', 'invalid')
    );
$$;

revoke all on function public.finder_has_active_source_submission(uuid, uuid) from public;
grant execute on function public.finder_has_active_source_submission(uuid, uuid) to authenticated;

drop policy if exists "Finders can create protected source submissions" on public.source_submissions;

create policy "Finders can create protected source submissions"
on public.source_submissions
for insert
to authenticated
with check (
  finder_id = (select auth.uid())
  and public.can_submit_source(request_id, (select auth.uid()))
  and status = 'submitted'
  and source_fingerprint is not null
  and case
    when jsonb_typeof(proof) = 'array' then jsonb_array_length(proof) <= 6
    else false
  end
  and revealed_at is null
  and accepted_at is null
  and rejected_at is null
  and awarded_at is null
  and not public.finder_has_active_source_submission(request_id, (select auth.uid()))
);
