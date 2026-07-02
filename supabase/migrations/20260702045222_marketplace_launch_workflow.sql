-- Public marketplace feed and protected source access hardening.
-- Supabase's 2026 Data API defaults require explicit grants; keep every
-- browser-facing object grant deliberate and pair table access with RLS.

create or replace view public.public_request_cards
with (security_barrier = true)
as
select
  requests.id,
  requests.item_name,
  requests.category,
  requests.details,
  requests.reward,
  requests.duration_days,
  requests.status,
  requests.payment_status,
  requests.created_at,
  requests.paid_at,
  requests.created_at + make_interval(days => requests.duration_days) as closes_at,
  greatest(
    0,
    ceil(
      extract(
        epoch
        from requests.created_at + make_interval(days => requests.duration_days) - timezone('utc', now())
      ) / 86400
    )::integer
  ) as days_remaining,
  coalesce(
    nullif(requests.reference_images -> 0 ->> 'url', ''),
    '/find-requests/duck-wall-art.jpg'
  ) as primary_image_url,
  coalesce(
    (
      select count(*)::integer
      from public.source_submissions
      where source_submissions.request_id = requests.id
        and source_submissions.status not in ('withdrawn', 'invalid')
    ),
    0
  ) as submission_count
from public.requests
where requests.status in ('paid', 'disputed')
  and requests.payment_status in ('paid', 'disputed')
  and requests.paid_at is not null;

comment on view public.public_request_cards is
  'Sanitized public request feed. Intentionally exposes only non-payment, non-customer request fields for paid requests.';

revoke all on public.public_request_cards from public;
grant select on public.public_request_cards to anon, authenticated;

alter table public.request_payment_events add column if not exists provider_event_id text;
alter table public.request_payment_events add column if not exists provider_environment text not null default 'unknown';

do $$
begin
  if not exists (
    select 1
    from public.requests
    where dodo_payment_id is not null
    group by dodo_payment_id
    having count(*) > 1
  ) then
    create unique index if not exists requests_dodo_payment_id_key
      on public.requests (dodo_payment_id)
      where dodo_payment_id is not null;
  else
    raise notice 'Skipped requests_dodo_payment_id_key because duplicate Dodo payment ids already exist.';
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from public.request_payment_events
    where provider_event_id is not null
    group by provider, provider_event_id
    having count(*) > 1
  ) then
    create unique index if not exists request_payment_events_provider_event_id_key
      on public.request_payment_events (provider, provider_event_id)
      where provider_event_id is not null;
  else
    raise notice 'Skipped request_payment_events_provider_event_id_key because duplicate provider event ids already exist.';
  end if;
end
$$;

create or replace function public.can_submit_source(request_uuid uuid, user_uuid uuid)
returns boolean
language sql
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.requests
    where id = request_uuid
      and user_id <> user_uuid
      and status = 'paid'
      and payment_status = 'paid'
      and created_at + make_interval(days => duration_days) > timezone('utc', now())
  );
$$;

revoke all on function public.can_submit_source(uuid, uuid) from public;
grant execute on function public.can_submit_source(uuid, uuid) to authenticated;

-- Keep protected source details hidden until a reveal record exists. Posters can
-- still list safe previews for their own requests through the table RLS policy.
revoke select on public.source_submissions from authenticated;
grant select (
  id,
  request_id,
  finder_id,
  source_type,
  price_or_terms,
  match_notes,
  status,
  first_valid_rank,
  revealed_at,
  accepted_at,
  rejected_at,
  awarded_at,
  created_at,
  updated_at
) on public.source_submissions to authenticated;
grant insert on public.source_submissions to authenticated;

do $$
begin
  if not exists (
    select 1
    from public.source_reviews
    group by submission_id
    having count(*) > 1
  ) then
    create unique index if not exists source_reviews_submission_once_key
      on public.source_reviews (submission_id);
  else
    raise notice 'Skipped source_reviews_submission_once_key because duplicate source reviews already exist.';
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from public.source_disputes
    where status in ('open', 'needs_evidence')
    group by submission_id
    having count(*) > 1
  ) then
    create unique index if not exists source_disputes_submission_open_key
      on public.source_disputes (submission_id)
      where status in ('open', 'needs_evidence');
  else
    raise notice 'Skipped source_disputes_submission_open_key because duplicate open source disputes already exist.';
  end if;
end
$$;

drop policy if exists "Finders can create protected source submissions" on public.source_submissions;
drop policy if exists "Posters can reveal sources for their requests" on public.source_reveals;
drop policy if exists "Posters can review revealed sources" on public.source_reviews;
drop policy if exists "Posters and finders can open source disputes" on public.source_disputes;

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
  and not exists (
    select 1
    from public.source_submissions existing_submission
    where existing_submission.request_id = source_submissions.request_id
      and existing_submission.finder_id = (select auth.uid())
      and existing_submission.status not in ('withdrawn', 'invalid')
  )
);

create policy "Posters can reveal sources for their requests"
on public.source_reveals
for insert
to authenticated
with check (
  poster_id = (select auth.uid())
  and reveal_terms_accepted = true
  and public.is_request_owner(request_id, (select auth.uid()))
  and exists (
    select 1
    from public.source_submissions
    join public.requests
      on requests.id = source_submissions.request_id
    where source_submissions.id = source_reveals.submission_id
      and source_submissions.request_id = source_reveals.request_id
      and source_submissions.status = 'submitted'
      and requests.status = 'paid'
      and requests.payment_status = 'paid'
  )
);

create policy "Posters can review revealed sources"
on public.source_reviews
for insert
to authenticated
with check (
  reviewer_id = (select auth.uid())
  and public.is_request_owner(request_id, (select auth.uid()))
  and (
    decision = 'accepted'
    or reason_code is not null
  )
  and not exists (
    select 1
    from public.source_reviews existing_review
    where existing_review.submission_id = source_reviews.submission_id
  )
  and exists (
    select 1
    from public.source_reveals
    join public.source_submissions
      on source_submissions.id = source_reveals.submission_id
    where source_reveals.submission_id = source_reviews.submission_id
      and source_reveals.request_id = source_reviews.request_id
      and source_reveals.poster_id = (select auth.uid())
      and source_submissions.status = 'revealed'
  )
);

create policy "Posters and finders can open source disputes"
on public.source_disputes
for insert
to authenticated
with check (
  opened_by = (select auth.uid())
  and status = 'open'
  and resolution_note = ''
  and exists (
    select 1
    from public.source_submissions
    where source_submissions.id = source_disputes.submission_id
      and source_submissions.request_id = source_disputes.request_id
      and (
        (opened_by_role = 'finder' and source_submissions.finder_id = (select auth.uid()))
        or (opened_by_role = 'poster' and public.is_request_owner(source_submissions.request_id, (select auth.uid())))
      )
      and (
        exists (
          select 1
          from public.source_reveals
          where source_reveals.submission_id = source_disputes.submission_id
        )
        or exists (
          select 1
          from public.source_reviews
          where source_reviews.submission_id = source_disputes.submission_id
        )
      )
  )
);

drop view if exists public.finder_source_submission_details;
drop view if exists public.revealed_source_details;

create or replace function public.get_finder_source_submission_details()
returns table (
  id uuid,
  request_id uuid,
  finder_id uuid,
  source_type text,
  source_url text,
  source_contact text,
  contact_email text,
  price_or_terms text,
  match_notes text,
  proof jsonb,
  status text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public, pg_catalog
as $$
  select
    source_submissions.id,
    source_submissions.request_id,
    source_submissions.finder_id,
    source_submissions.source_type,
    source_submissions.source_url,
    source_submissions.source_contact,
    source_submissions.contact_email,
    source_submissions.price_or_terms,
    source_submissions.match_notes,
    source_submissions.proof,
    source_submissions.status,
    source_submissions.created_at,
    source_submissions.updated_at
  from public.source_submissions
  where source_submissions.finder_id = (select auth.uid());
$$;

create or replace function public.get_revealed_source_details()
returns table (
  id uuid,
  request_id uuid,
  finder_id uuid,
  source_type text,
  source_url text,
  source_contact text,
  contact_email text,
  price_or_terms text,
  match_notes text,
  proof jsonb,
  status text,
  revealed_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  awarded_at timestamptz,
  poster_id uuid,
  revealed_log_created_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public, pg_catalog
as $$
  select
    source_submissions.id,
    source_submissions.request_id,
    source_submissions.finder_id,
    source_submissions.source_type,
    source_submissions.source_url,
    source_submissions.source_contact,
    source_submissions.contact_email,
    source_submissions.price_or_terms,
    source_submissions.match_notes,
    source_submissions.proof,
    source_submissions.status,
    source_submissions.revealed_at,
    source_submissions.accepted_at,
    source_submissions.rejected_at,
    source_submissions.awarded_at,
    source_reveals.poster_id,
    source_reveals.created_at as revealed_log_created_at,
    source_submissions.created_at,
    source_submissions.updated_at
  from public.source_submissions
  join public.source_reveals
    on source_reveals.submission_id = source_submissions.id
  where source_reveals.poster_id = (select auth.uid())
    or source_submissions.finder_id = (select auth.uid());
$$;

comment on function public.get_revealed_source_details() is
  'Full source details after a poster accepts reveal terms, restricted by the current auth.uid().';

revoke all on function public.get_finder_source_submission_details() from public;
revoke all on function public.get_revealed_source_details() from public;
grant execute on function public.get_finder_source_submission_details() to authenticated;
grant execute on function public.get_revealed_source_details() to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can view their request reference images'
  ) then
    create policy "Authenticated users can view their request reference images"
    on storage.objects
    for select
    to authenticated
    using (
      bucket_id = 'request-reference-images'
      and (storage.foldername(name))[1] = (select auth.uid()::text)
    );
  end if;

  if not exists (
    select 1
    from storage.buckets
    where id = 'source-submission-proof'
  ) then
    insert into storage.buckets (
      id,
      name,
      public,
      file_size_limit,
      allowed_mime_types
    )
    values (
      'source-submission-proof',
      'source-submission-proof',
      false,
      10485760,
      array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']
    );
  end if;
end
$$;

drop policy if exists "Finders can upload source proof files" on storage.objects;
drop policy if exists "Participants can view source proof files" on storage.objects;
drop policy if exists "Finders can delete unrevealed source proof files" on storage.objects;

create policy "Finders can upload source proof files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'source-submission-proof'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Participants can view source proof files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'source-submission-proof'
  and (
    (storage.foldername(name))[1] = (select auth.uid()::text)
    or exists (
      select 1
      from public.source_submissions
      join public.source_reveals
        on source_reveals.submission_id = source_submissions.id
      where source_submissions.id::text = (storage.foldername(name))[2]
        and public.is_request_owner(source_submissions.request_id, (select auth.uid()))
    )
  )
);

create policy "Finders can delete unrevealed source proof files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'source-submission-proof'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and not exists (
    select 1
    from public.source_reveals
    where source_reveals.submission_id::text = (storage.foldername(name))[2]
  )
);

create or replace function public.apply_source_review_decision()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  update public.source_submissions
  set
    status = case
      when new.decision = 'accepted' then 'accepted'
      when new.decision = 'rejected' then 'rejected'
      when new.decision = 'sent_to_review' then 'in_review'
      else status
    end,
    accepted_at = case when new.decision = 'accepted' then coalesce(accepted_at, new.created_at) else accepted_at end,
    rejected_at = case when new.decision = 'rejected' then coalesce(rejected_at, new.created_at) else rejected_at end,
    awarded_at = case when new.decision = 'accepted' then coalesce(awarded_at, new.created_at) else awarded_at end
  where id = new.submission_id;

  if new.decision = 'accepted' then
    update public.requests
    set
      payout_status = case
        when payout_status in ('not_ready', 'pending_acceptance') then 'payable'
        else payout_status
      end,
      payout_release_after = coalesce(payout_release_after, new.created_at + interval '48 hours')
    where id = new.request_id
      and payment_status = 'paid';
  end if;

  return new;
end;
$$;

revoke all on function public.apply_source_review_decision() from public;
