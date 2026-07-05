-- Add the account/profile, payout-readiness, case messaging, and support
-- records needed to close the finder lifecycle beyond source submission.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  handle text not null default '' check (handle ~ '^[a-z0-9_-]{0,32}$'),
  account_type text not null default 'both' check (account_type in ('both', 'poster', 'finder')),
  region text not null default '' check (char_length(region) <= 80),
  specialty text not null default '' check (char_length(specialty) <= 160),
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 1000),
  identity_status text not null default 'not_started' check (identity_status in ('not_started', 'review_requested', 'verified', 'rejected')),
  profile_completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists profiles_handle_key
  on public.profiles (handle)
  where handle <> '';

create table if not exists public.finder_payout_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  payout_email text not null default '' check (char_length(payout_email) <= 160),
  country text not null default 'US' check (country ~ '^[A-Z]{2}$'),
  status text not null default 'not_started' check (status in ('not_started', 'details_saved', 'review_requested', 'ready', 'blocked')),
  processor_account_id text check (processor_account_id is null or char_length(processor_account_id) <= 160),
  terms_accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.finder_payout_cases (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.source_submissions (id) on delete cascade,
  request_id uuid not null references public.requests (id) on delete cascade,
  finder_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null check (amount >= 0),
  currency text not null default 'USD' check (currency = 'USD'),
  status text not null default 'payable' check (status in ('payable', 'hold', 'processing', 'paid', 'cancelled', 'refunded', 'disputed')),
  release_after timestamptz,
  processor text check (processor is null or processor in ('manual', 'stripe_connect', 'paypal', 'wise', 'other')),
  processor_transfer_id text check (processor_transfer_id is null or char_length(processor_transfer_id) <= 180),
  admin_note text not null default '' check (char_length(admin_note) <= 3000),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (submission_id)
);

create index if not exists finder_payout_cases_finder_created_at_idx
  on public.finder_payout_cases (finder_id, created_at desc);
create index if not exists finder_payout_cases_status_release_idx
  on public.finder_payout_cases (status, release_after);

create table if not exists public.payout_case_events (
  id uuid primary key default gen_random_uuid(),
  payout_case_id uuid not null references public.finder_payout_cases (id) on delete cascade,
  request_id uuid not null references public.requests (id) on delete cascade,
  submission_id uuid not null references public.source_submissions (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null check (action in ('hold', 'processing', 'paid', 'note')),
  from_status text not null check (from_status in ('payable', 'hold', 'processing', 'paid', 'cancelled', 'refunded', 'disputed')),
  to_status text not null check (to_status in ('payable', 'hold', 'processing', 'paid', 'cancelled', 'refunded', 'disputed')),
  processor text check (processor is null or processor in ('manual', 'stripe_connect', 'paypal', 'wise', 'other')),
  processor_transfer_id text check (processor_transfer_id is null or char_length(processor_transfer_id) <= 180),
  note text not null default '' check (char_length(note) <= 3000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists payout_case_events_case_created_at_idx
  on public.payout_case_events (payout_case_id, created_at desc);
create index if not exists payout_case_events_actor_created_at_idx
  on public.payout_case_events (actor_id, created_at desc);

create table if not exists public.source_dispute_events (
  id uuid primary key default gen_random_uuid(),
  dispute_id uuid not null references public.source_disputes (id) on delete cascade,
  request_id uuid not null references public.requests (id) on delete cascade,
  submission_id uuid not null references public.source_submissions (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null check (action in ('needs_evidence', 'finder_wins', 'poster_wins', 'closed', 'note')),
  from_status text not null check (from_status in ('open', 'needs_evidence', 'finder_wins', 'poster_wins', 'closed')),
  to_status text not null check (to_status in ('open', 'needs_evidence', 'finder_wins', 'poster_wins', 'closed')),
  note text not null default '' check (char_length(note) <= 3000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists source_dispute_events_dispute_created_at_idx
  on public.source_dispute_events (dispute_id, created_at desc);
create index if not exists source_dispute_events_actor_created_at_idx
  on public.source_dispute_events (actor_id, created_at desc);

create table if not exists public.source_duplicate_flags (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  finder_id uuid not null references auth.users (id) on delete cascade,
  source_fingerprint text not null check (char_length(source_fingerprint) <= 128),
  existing_submission_id uuid references public.source_submissions (id) on delete set null,
  source_type text not null check (source_type in ('source-link', 'private-source', 'finder-has-it')),
  normalized_source text not null default '' check (char_length(normalized_source) <= 500),
  status text not null default 'open' check (status in ('open', 'reviewed', 'linked', 'dismissed')),
  admin_note text not null default '' check (char_length(admin_note) <= 3000),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists source_duplicate_flags_request_created_at_idx
  on public.source_duplicate_flags (request_id, created_at desc);
create index if not exists source_duplicate_flags_status_created_at_idx
  on public.source_duplicate_flags (status, created_at desc);
create unique index if not exists source_duplicate_flags_open_finder_key
  on public.source_duplicate_flags (request_id, finder_id, source_fingerprint)
  where status = 'open';

create table if not exists public.source_duplicate_flag_events (
  id uuid primary key default gen_random_uuid(),
  duplicate_flag_id uuid not null references public.source_duplicate_flags (id) on delete cascade,
  request_id uuid not null references public.requests (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null check (action in ('reviewed', 'linked', 'dismissed', 'note')),
  from_status text not null check (from_status in ('open', 'reviewed', 'linked', 'dismissed')),
  to_status text not null check (to_status in ('open', 'reviewed', 'linked', 'dismissed')),
  note text not null default '' check (char_length(note) <= 3000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists source_duplicate_flag_events_flag_created_at_idx
  on public.source_duplicate_flag_events (duplicate_flag_id, created_at desc);
create index if not exists source_duplicate_flag_events_actor_created_at_idx
  on public.source_duplicate_flag_events (actor_id, created_at desc);

create table if not exists public.source_messages (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.source_submissions (id) on delete cascade,
  request_id uuid not null references public.requests (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 3000),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists source_messages_submission_created_at_idx
  on public.source_messages (submission_id, created_at);
create index if not exists source_messages_sender_created_at_idx
  on public.source_messages (sender_id, created_at desc);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null default 'other' check (category in ('source-review', 'payment', 'payout', 'safety', 'account', 'other')),
  subject text not null check (char_length(subject) between 1 and 160),
  status text not null default 'open' check (status in ('open', 'in_review', 'waiting_on_user', 'resolved', 'closed')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  related_request_id uuid references public.requests (id) on delete set null,
  related_submission_id uuid references public.source_submissions (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists support_tickets_user_created_at_idx
  on public.support_tickets (user_id, created_at desc);
create index if not exists support_tickets_status_priority_idx
  on public.support_tickets (status, priority, created_at);
create index if not exists support_ticket_messages_ticket_created_at_idx
  on public.support_ticket_messages (ticket_id, created_at);

create table if not exists public.support_ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null check (action in ('in_review', 'waiting_on_user', 'resolved', 'closed', 'note')),
  from_status text not null check (from_status in ('open', 'in_review', 'waiting_on_user', 'resolved', 'closed')),
  to_status text not null check (to_status in ('open', 'in_review', 'waiting_on_user', 'resolved', 'closed')),
  note text not null default '' check (char_length(note) <= 3000),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists support_ticket_events_ticket_created_at_idx
  on public.support_ticket_events (ticket_id, created_at desc);
create index if not exists support_ticket_events_actor_created_at_idx
  on public.support_ticket_events (actor_id, created_at desc);

create or replace function public.set_marketplace_loop_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_marketplace_loop_updated_at();

drop trigger if exists set_finder_payout_profiles_updated_at on public.finder_payout_profiles;
create trigger set_finder_payout_profiles_updated_at
before update on public.finder_payout_profiles
for each row
execute function public.set_marketplace_loop_updated_at();

drop trigger if exists set_finder_payout_cases_updated_at on public.finder_payout_cases;
create trigger set_finder_payout_cases_updated_at
before update on public.finder_payout_cases
for each row
execute function public.set_marketplace_loop_updated_at();

drop trigger if exists set_source_duplicate_flags_updated_at on public.source_duplicate_flags;
create trigger set_source_duplicate_flags_updated_at
before update on public.source_duplicate_flags
for each row
execute function public.set_marketplace_loop_updated_at();

drop trigger if exists set_support_tickets_updated_at on public.support_tickets;
create trigger set_support_tickets_updated_at
before update on public.support_tickets
for each row
execute function public.set_marketplace_loop_updated_at();

create or replace function public.can_access_source_submission(submission_uuid uuid, user_uuid uuid)
returns boolean
language sql
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1
    from public.source_submissions
    join public.requests
      on requests.id = source_submissions.request_id
    where source_submissions.id = submission_uuid
      and (
        source_submissions.finder_id = user_uuid
        or requests.user_id = user_uuid
      )
  );
$$;

revoke all on function public.can_access_source_submission(uuid, uuid) from public;
grant execute on function public.can_access_source_submission(uuid, uuid) to authenticated;

create or replace view public.public_profiles
with (security_barrier = true)
as
select
  id,
  display_name,
  handle,
  account_type,
  region,
  specialty,
  identity_status,
  profile_completed_at,
  created_at
from public.profiles
where handle <> ''
  and display_name <> '';

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.finder_payout_profiles enable row level security;
alter table public.finder_payout_profiles force row level security;
alter table public.finder_payout_cases enable row level security;
alter table public.finder_payout_cases force row level security;
alter table public.payout_case_events enable row level security;
alter table public.payout_case_events force row level security;
alter table public.source_dispute_events enable row level security;
alter table public.source_dispute_events force row level security;
alter table public.source_duplicate_flags enable row level security;
alter table public.source_duplicate_flags force row level security;
alter table public.source_duplicate_flag_events enable row level security;
alter table public.source_duplicate_flag_events force row level security;
alter table public.source_messages enable row level security;
alter table public.source_messages force row level security;
alter table public.support_tickets enable row level security;
alter table public.support_tickets force row level security;
alter table public.support_ticket_messages enable row level security;
alter table public.support_ticket_messages force row level security;
alter table public.support_ticket_events enable row level security;
alter table public.support_ticket_events force row level security;

revoke all on public.profiles from anon;
revoke all on public.finder_payout_profiles from anon;
revoke all on public.finder_payout_cases from anon;
revoke all on public.payout_case_events from anon;
revoke all on public.payout_case_events from authenticated;
revoke all on public.source_dispute_events from anon;
revoke all on public.source_dispute_events from authenticated;
revoke all on public.source_duplicate_flags from anon;
revoke all on public.source_duplicate_flag_events from anon;
revoke all on public.source_duplicate_flag_events from authenticated;
revoke all on public.source_messages from anon;
revoke all on public.support_tickets from anon;
revoke all on public.support_ticket_messages from anon;
revoke all on public.support_ticket_events from anon;
revoke all on public.support_ticket_events from authenticated;
grant select on public.public_profiles to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.finder_payout_profiles to authenticated;
grant select on public.finder_payout_cases to authenticated;
grant select, insert on public.source_duplicate_flags to authenticated;
grant select, insert on public.source_messages to authenticated;
grant select, insert on public.support_tickets to authenticated;
grant select, insert on public.support_ticket_messages to authenticated;

drop policy if exists "Users can manage their own profile" on public.profiles;
drop policy if exists "Users can manage their own payout profile" on public.finder_payout_profiles;
drop policy if exists "Participants can view finder payout cases" on public.finder_payout_cases;
drop policy if exists "Participants can view duplicate source flags" on public.source_duplicate_flags;
drop policy if exists "Finders can record duplicate source flags" on public.source_duplicate_flags;
drop policy if exists "Source participants can view messages" on public.source_messages;
drop policy if exists "Source participants can send messages" on public.source_messages;
drop policy if exists "Users can view their support tickets" on public.support_tickets;
drop policy if exists "Users can open support tickets" on public.support_tickets;
drop policy if exists "Users can view their support ticket messages" on public.support_ticket_messages;
drop policy if exists "Users can add support ticket messages" on public.support_ticket_messages;

create policy "Users can manage their own profile"
on public.profiles
for all
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "Users can manage their own payout profile"
on public.finder_payout_profiles
for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Participants can view finder payout cases"
on public.finder_payout_cases
for select
to authenticated
using (
  finder_id = (select auth.uid())
  or public.is_request_owner(request_id, (select auth.uid()))
);

create policy "Participants can view duplicate source flags"
on public.source_duplicate_flags
for select
to authenticated
using (
  finder_id = (select auth.uid())
  or public.is_request_owner(request_id, (select auth.uid()))
);

create policy "Finders can record duplicate source flags"
on public.source_duplicate_flags
for insert
to authenticated
with check (
  finder_id = (select auth.uid())
  and status = 'open'
  and admin_note = ''
  and public.can_submit_source(request_id, (select auth.uid()))
);

create policy "Source participants can view messages"
on public.source_messages
for select
to authenticated
using (public.can_access_source_submission(submission_id, (select auth.uid())));

create policy "Source participants can send messages"
on public.source_messages
for insert
to authenticated
with check (
  sender_id = (select auth.uid())
  and public.can_access_source_submission(submission_id, (select auth.uid()))
  and exists (
    select 1
    from public.source_submissions
    where source_submissions.id = source_messages.submission_id
      and source_submissions.request_id = source_messages.request_id
      and source_submissions.status in ('revealed', 'accepted', 'in_review', 'awarded')
  )
);

create policy "Users can view their support tickets"
on public.support_tickets
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can open support tickets"
on public.support_tickets
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'open'
);

create policy "Users can view their support ticket messages"
on public.support_ticket_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.support_tickets
    where support_tickets.id = support_ticket_messages.ticket_id
      and support_tickets.user_id = (select auth.uid())
  )
);

create policy "Users can add support ticket messages"
on public.support_ticket_messages
for insert
to authenticated
with check (
  sender_id = (select auth.uid())
  and exists (
    select 1
    from public.support_tickets
    where support_tickets.id = support_ticket_messages.ticket_id
      and support_tickets.user_id = (select auth.uid())
      and support_tickets.status in ('open', 'in_review', 'waiting_on_user')
  )
);

create or replace function public.apply_source_review_decision()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  payout_release_at timestamptz;
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
    payout_release_at := new.created_at + interval '48 hours';

    update public.requests
    set
      payout_status = case
        when payout_status in ('not_ready', 'pending_acceptance') then 'payable'
        else payout_status
      end,
      payout_release_after = coalesce(payout_release_after, payout_release_at)
    where id = new.request_id
      and payment_status = 'paid';

    insert into public.finder_payout_cases (
      submission_id,
      request_id,
      finder_id,
      amount,
      currency,
      status,
      release_after
    )
    select
      new.submission_id,
      new.request_id,
      source_submissions.finder_id,
      requests.finder_payout,
      requests.currency,
      'payable',
      coalesce(requests.payout_release_after, payout_release_at)
    from public.source_submissions
    join public.requests
      on requests.id = source_submissions.request_id
    where source_submissions.id = new.submission_id
      and requests.id = new.request_id
      and requests.payment_status = 'paid'
    on conflict (submission_id)
    do update set
      amount = excluded.amount,
      currency = excluded.currency,
      release_after = coalesce(finder_payout_cases.release_after, excluded.release_after),
      status = case
        when finder_payout_cases.status in ('cancelled', 'refunded', 'paid') then finder_payout_cases.status
        else excluded.status
      end;
  end if;

  return new;
end;
$$;

revoke all on function public.apply_source_review_decision() from public;

create or replace function public.hold_payout_case_for_dispute()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  update public.finder_payout_cases
  set
    status = case
      when status in ('paid', 'cancelled', 'refunded') then status
      else 'disputed'
    end,
    admin_note = case
      when admin_note = '' then 'Dispute opened; payout requires review.'
      else admin_note
    end
  where submission_id = new.submission_id;

  update public.requests
  set payout_status = case
    when payout_status in ('paid', 'cancelled', 'refunded') then payout_status
    else 'disputed'
  end
  where id = new.request_id;

  return new;
end;
$$;

revoke all on function public.hold_payout_case_for_dispute() from public;

drop trigger if exists hold_payout_case_for_dispute on public.source_disputes;
create trigger hold_payout_case_for_dispute
after insert on public.source_disputes
for each row
execute function public.hold_payout_case_for_dispute();
