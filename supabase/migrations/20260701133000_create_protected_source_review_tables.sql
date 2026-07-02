create or replace function public.is_request_owner(request_uuid uuid, user_uuid uuid)
returns boolean
language sql
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.requests
    where id = request_uuid
      and user_id = user_uuid
  );
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
  );
$$;

revoke all on function public.is_request_owner(uuid, uuid) from public;
revoke all on function public.can_submit_source(uuid, uuid) from public;
grant execute on function public.is_request_owner(uuid, uuid) to authenticated;
grant execute on function public.can_submit_source(uuid, uuid) to authenticated;

create table if not exists public.source_submissions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  finder_id uuid not null references auth.users (id) on delete cascade,
  source_type text not null check (source_type in ('source-link', 'private-source', 'finder-has-it')),
  source_url text check (source_url is null or char_length(source_url) <= 1000),
  source_contact text check (source_contact is null or char_length(source_contact) <= 500),
  contact_email text not null check (char_length(contact_email) <= 160),
  price_or_terms text check (price_or_terms is null or char_length(price_or_terms) <= 240),
  match_notes text not null default '' check (char_length(match_notes) <= 2000),
  proof jsonb not null default '[]'::jsonb,
  source_fingerprint text,
  status text not null default 'submitted' check (status in ('submitted', 'revealed', 'accepted', 'rejected', 'in_review', 'awarded', 'invalid', 'withdrawn')),
  first_valid_rank integer check (first_valid_rank is null or first_valid_rank > 0),
  revealed_at timestamptz,
  accepted_at timestamptz,
  rejected_at timestamptz,
  awarded_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists source_submissions_request_created_at_idx on public.source_submissions (request_id, created_at);
create index if not exists source_submissions_finder_created_at_idx on public.source_submissions (finder_id, created_at desc);
create index if not exists source_submissions_status_idx on public.source_submissions (status);
create unique index if not exists source_submissions_request_fingerprint_key
  on public.source_submissions (request_id, source_fingerprint)
  where source_fingerprint is not null;

create table if not exists public.source_reveals (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.source_submissions (id) on delete cascade,
  request_id uuid not null references public.requests (id) on delete cascade,
  poster_id uuid not null references auth.users (id) on delete cascade,
  reveal_terms_accepted boolean not null default false,
  reveal_notice text not null default 'Poster understands a valid revealed source may still be payable after review.',
  created_at timestamptz not null default timezone('utc', now()),
  unique (submission_id, poster_id)
);

create index if not exists source_reveals_request_created_at_idx on public.source_reveals (request_id, created_at desc);
create index if not exists source_reveals_poster_created_at_idx on public.source_reveals (poster_id, created_at desc);

create table if not exists public.source_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.source_submissions (id) on delete cascade,
  request_id uuid not null references public.requests (id) on delete cascade,
  reviewer_id uuid not null references auth.users (id) on delete cascade,
  decision text not null check (decision in ('accepted', 'rejected', 'sent_to_review')),
  reason_code text check (
    reason_code is null
    or reason_code in ('wrong-item', 'unavailable', 'fake-seller', 'condition', 'price', 'duplicate', 'other')
  ),
  note text not null default '' check (char_length(note) <= 2000),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists source_reviews_submission_created_at_idx on public.source_reviews (submission_id, created_at desc);
create index if not exists source_reviews_request_created_at_idx on public.source_reviews (request_id, created_at desc);

create table if not exists public.source_disputes (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.source_submissions (id) on delete cascade,
  request_id uuid not null references public.requests (id) on delete cascade,
  opened_by uuid not null references auth.users (id) on delete cascade,
  opened_by_role text not null check (opened_by_role in ('poster', 'finder')),
  reason_code text not null check (reason_code in ('used-valid-source', 'wrong-rejection', 'bad-source', 'handoff-issue', 'payment-release', 'other')),
  evidence_summary text not null default '' check (char_length(evidence_summary) <= 3000),
  status text not null default 'open' check (status in ('open', 'needs_evidence', 'finder_wins', 'poster_wins', 'closed')),
  resolution_note text not null default '' check (char_length(resolution_note) <= 3000),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists source_disputes_submission_created_at_idx on public.source_disputes (submission_id, created_at desc);
create index if not exists source_disputes_request_status_idx on public.source_disputes (request_id, status);
create index if not exists source_disputes_opened_by_created_at_idx on public.source_disputes (opened_by, created_at desc);

create or replace function public.set_source_review_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_source_submissions_updated_at on public.source_submissions;
create trigger set_source_submissions_updated_at
before update on public.source_submissions
for each row
execute function public.set_source_review_updated_at();

drop trigger if exists set_source_disputes_updated_at on public.source_disputes;
create trigger set_source_disputes_updated_at
before update on public.source_disputes
for each row
execute function public.set_source_review_updated_at();

create or replace function public.mark_source_submission_revealed()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  update public.source_submissions
  set
    status = case when status = 'submitted' then 'revealed' else status end,
    revealed_at = coalesce(revealed_at, new.created_at)
  where id = new.submission_id;

  return new;
end;
$$;

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
    rejected_at = case when new.decision = 'rejected' then coalesce(rejected_at, new.created_at) else rejected_at end
  where id = new.submission_id;

  return new;
end;
$$;

revoke all on function public.mark_source_submission_revealed() from public;
revoke all on function public.apply_source_review_decision() from public;

drop trigger if exists mark_source_submission_revealed on public.source_reveals;
create trigger mark_source_submission_revealed
after insert on public.source_reveals
for each row
execute function public.mark_source_submission_revealed();

drop trigger if exists apply_source_review_decision on public.source_reviews;
create trigger apply_source_review_decision
after insert on public.source_reviews
for each row
execute function public.apply_source_review_decision();

alter table public.source_submissions enable row level security;
alter table public.source_submissions force row level security;
alter table public.source_reveals enable row level security;
alter table public.source_reveals force row level security;
alter table public.source_reviews enable row level security;
alter table public.source_reviews force row level security;
alter table public.source_disputes enable row level security;
alter table public.source_disputes force row level security;

grant select, insert on public.source_submissions to authenticated;
grant select, insert on public.source_reveals to authenticated;
grant select, insert on public.source_reviews to authenticated;
grant select, insert on public.source_disputes to authenticated;
revoke all on public.source_submissions from anon;
revoke all on public.source_reveals from anon;
revoke all on public.source_reviews from anon;
revoke all on public.source_disputes from anon;

drop policy if exists "Posters and finders can view source submissions" on public.source_submissions;
drop policy if exists "Finders can create protected source submissions" on public.source_submissions;
drop policy if exists "Posters and finders can view source reveals" on public.source_reveals;
drop policy if exists "Posters can reveal sources for their requests" on public.source_reveals;
drop policy if exists "Posters and finders can view source reviews" on public.source_reviews;
drop policy if exists "Posters can review revealed sources" on public.source_reviews;
drop policy if exists "Posters and finders can view source disputes" on public.source_disputes;
drop policy if exists "Posters and finders can open source disputes" on public.source_disputes;

create policy "Posters and finders can view source submissions"
on public.source_submissions
for select
to authenticated
using (
  finder_id = (select auth.uid())
  or public.is_request_owner(request_id, (select auth.uid()))
);

create policy "Finders can create protected source submissions"
on public.source_submissions
for insert
to authenticated
with check (
  finder_id = (select auth.uid())
  and public.can_submit_source(request_id, (select auth.uid()))
  and status = 'submitted'
  and revealed_at is null
  and accepted_at is null
  and rejected_at is null
  and awarded_at is null
);

create policy "Posters and finders can view source reveals"
on public.source_reveals
for select
to authenticated
using (
  poster_id = (select auth.uid())
  or exists (
    select 1
    from public.source_submissions
    where source_submissions.id = source_reveals.submission_id
      and source_submissions.finder_id = (select auth.uid())
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
    where source_submissions.id = source_reveals.submission_id
      and source_submissions.request_id = source_reveals.request_id
  )
);

create policy "Posters and finders can view source reviews"
on public.source_reviews
for select
to authenticated
using (
  reviewer_id = (select auth.uid())
  or public.is_request_owner(request_id, (select auth.uid()))
  or exists (
    select 1
    from public.source_submissions
    where source_submissions.id = source_reviews.submission_id
      and source_submissions.finder_id = (select auth.uid())
  )
);

create policy "Posters can review revealed sources"
on public.source_reviews
for insert
to authenticated
with check (
  reviewer_id = (select auth.uid())
  and public.is_request_owner(request_id, (select auth.uid()))
  and exists (
    select 1
    from public.source_reveals
    where source_reveals.submission_id = source_reviews.submission_id
      and source_reveals.request_id = source_reviews.request_id
      and source_reveals.poster_id = (select auth.uid())
  )
);

create policy "Posters and finders can view source disputes"
on public.source_disputes
for select
to authenticated
using (
  opened_by = (select auth.uid())
  or public.is_request_owner(request_id, (select auth.uid()))
  or exists (
    select 1
    from public.source_submissions
    where source_submissions.id = source_disputes.submission_id
      and source_submissions.finder_id = (select auth.uid())
  )
);

create policy "Posters and finders can open source disputes"
on public.source_disputes
for insert
to authenticated
with check (
  opened_by = (select auth.uid())
  and exists (
    select 1
    from public.source_submissions
    where source_submissions.id = source_disputes.submission_id
      and source_submissions.request_id = source_disputes.request_id
      and (
        (opened_by_role = 'finder' and source_submissions.finder_id = (select auth.uid()))
        or (opened_by_role = 'poster' and public.is_request_owner(source_submissions.request_id, (select auth.uid())))
      )
  )
);
