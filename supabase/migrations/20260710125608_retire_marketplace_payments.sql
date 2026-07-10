-- Retire the funded-request marketplace model without destroying historical
-- checkout or source-review records. The active product is now a free,
-- self-serve request board with public clues only.

create schema if not exists private_legacy;
revoke all on schema private_legacy from public, anon, authenticated;
grant usage on schema private_legacy to service_role;

comment on schema private_legacy is
  'Service-role-only record archive for workflows removed from the public request board.';

drop view if exists public.public_request_cards;
drop view if exists public.public_profiles;

drop function if exists public.create_public_request_comment(uuid, text, text, text, text, integer, text);
drop function if exists public.can_submit_source(uuid, uuid) cascade;
drop function if exists public.finder_has_active_source_submission(uuid, uuid) cascade;
drop function if exists public.get_finder_source_submission_details();
drop function if exists public.get_revealed_source_details();
drop function if exists public.is_request_owner(uuid, uuid) cascade;

do $$
begin
  if to_regclass('public.source_reveals') is not null then
    execute 'drop trigger if exists mark_source_submission_revealed on public.source_reveals';
  end if;
  if to_regclass('public.source_reviews') is not null then
    execute 'drop trigger if exists apply_source_review_decision on public.source_reviews';
  end if;
  if to_regclass('public.source_submissions') is not null then
    execute 'drop trigger if exists set_source_submissions_updated_at on public.source_submissions';
  end if;
  if to_regclass('public.source_disputes') is not null then
    execute 'drop trigger if exists set_source_disputes_updated_at on public.source_disputes';
    execute 'drop trigger if exists hold_payout_case_for_dispute on public.source_disputes';
  end if;
  if to_regclass('public.finder_payout_profiles') is not null then
    execute 'drop trigger if exists set_finder_payout_profiles_updated_at on public.finder_payout_profiles';
  end if;
  if to_regclass('public.finder_payout_cases') is not null then
    execute 'drop trigger if exists set_finder_payout_cases_updated_at on public.finder_payout_cases';
  end if;
  if to_regclass('public.source_duplicate_flags') is not null then
    execute 'drop trigger if exists set_source_duplicate_flags_updated_at on public.source_duplicate_flags';
  end if;
  if to_regclass('public.support_tickets') is not null then
    execute 'drop trigger if exists set_support_tickets_updated_at on public.support_tickets';
  end if;
  if to_regclass('public.profiles') is not null then
    execute 'drop trigger if exists set_profiles_updated_at on public.profiles';
  end if;
end
$$;

drop function if exists public.apply_source_review_decision();
drop function if exists public.hold_payout_case_for_dispute();
drop function if exists public.mark_source_submission_revealed();
drop function if exists public.can_access_source_submission(uuid, uuid) cascade;
drop function if exists public.set_source_review_updated_at();
drop function if exists public.set_marketplace_loop_updated_at();

alter table if exists public.profiles drop column if exists account_type;
alter table if exists public.profiles drop column if exists identity_status;
alter table if exists public.profiles drop column if exists profile_completed_at;

-- Refuse destructive cleanup if any settled, disputed, refundable, or payable
-- obligation appeared after the pre-deployment reconciliation.
-- Operational prerequisite: cancel provider-side checkout sessions, disable new
-- checkout creation, drain webhooks, and reconcile the provider dashboards. The
-- migration deliberately aborts while any checkout is still marked active.
-- Lock requests first: event inserts reference this table, so an in-flight
-- webhook must finish its request update before this transaction can proceed.
lock table public.requests in access exclusive mode;

do $$
begin
  if to_regclass('public.request_payment_events') is not null then
    execute 'lock table public.request_payment_events in access exclusive mode';
  end if;
end
$$;

do $$
declare
  obligation_count integer;
  active_checkout_count integer;
  payout_case_count integer := 0;
  payment_event_obligation_count integer := 0;
begin
  if to_regclass('public.finder_payout_cases') is not null then
    execute 'lock table public.finder_payout_cases in access exclusive mode';
  end if;

  select count(*)
  into obligation_count
  from public.requests
  where status in ('paid', 'refund_due', 'refunded', 'disputed')
     or payment_status in ('paid', 'refund_pending', 'refunded', 'disputed')
     or payout_status in ('pending_acceptance', 'payable', 'paid', 'disputed');

  select count(*)
  into active_checkout_count
  from public.requests as requests
  where status = 'checkout_started'
     or payment_status = 'checkout_started'
     or (
       status = 'checkout_pending'
       and (
         checkout_session_id is not null
         or checkout_url is not null
         or dodo_payment_id is not null
         or lemon_squeezy_order_id is not null
         or nullif(to_jsonb(requests) ->> 'whop_payment_id', '') is not null
         or nullif(to_jsonb(requests) ->> 'paddle_transaction_id', '') is not null
         or nullif(to_jsonb(requests) ->> 'razorpay_payment_id', '') is not null
         or nullif(to_jsonb(requests) ->> 'razorpay_payment_link_id', '') is not null
       )
     );

  if to_regclass('public.finder_payout_cases') is not null then
    execute 'select count(*) from public.finder_payout_cases where status in (''payable'', ''hold'', ''processing'', ''paid'', ''disputed'')'
      into payout_case_count;
  end if;

  if to_regclass('public.request_payment_events') is not null then
    execute $query$
      select count(*)
      from public.request_payment_events
      where lower(event_type) in (
        'payment.succeeded',
        'payment.captured',
        'payment_link.paid',
        'order_created',
        'order_refunded',
        'transaction.completed',
        'transaction.paid',
        'transaction.refunded'
      )
         or lower(event_type) like 'refund.%'
         or lower(event_type) like 'dispute.%'
    $query$
      into payment_event_obligation_count;
  end if;

  if obligation_count > 0
     or active_checkout_count > 0
     or payout_case_count > 0
     or payment_event_obligation_count > 0 then
    raise exception using
      errcode = 'P0001',
      message = 'retired_financial_obligations_require_manual_reconciliation',
      detail = format(
        'request obligations: %s; active checkouts: %s; payout cases: %s; payment events: %s',
        obligation_count,
        active_checkout_count,
        payout_case_count,
        payment_event_obligation_count
      );
  end if;
end
$$;

-- Preserve the complete pre-pivot request rows before removing their payment
-- columns. This archive is not exposed through the Data API.
create table if not exists private_legacy.retired_request_snapshots (
  request_id uuid primary key,
  snapshot jsonb not null,
  archived_at timestamptz not null default timezone('utc', now())
);

insert into private_legacy.retired_request_snapshots (request_id, snapshot)
select requests.id, to_jsonb(requests)
from public.requests as requests
on conflict (request_id) do nothing;

revoke all on private_legacy.retired_request_snapshots from public, anon, authenticated;
grant select on private_legacy.retired_request_snapshots to service_role;

-- The two abandoned checkout sessions and failed/unpaid attempts remain in the
-- archive, but cannot re-enter the active request lifecycle.
alter table public.requests drop constraint if exists requests_status_check;

update public.requests as requests
set status = 'archived'
where status not in ('draft', 'open', 'closed', 'cancelled', 'archived')
   or reward <> 0
   or service_fee <> 0
   or protection_reserve <> 0
   or total_due <> 0
   or finder_payout <> 0
   or payment_status <> 'free'
   or payout_status <> 'not_ready'
   or platform_fee_status <> 'unearned'
   or checkout_session_id is not null
   or checkout_url is not null
   or dodo_payment_id is not null
   or lemon_squeezy_order_id is not null
   or nullif(to_jsonb(requests) ->> 'whop_payment_id', '') is not null
   or nullif(to_jsonb(requests) ->> 'paddle_transaction_id', '') is not null
   or nullif(to_jsonb(requests) ->> 'razorpay_payment_id', '') is not null
   or nullif(to_jsonb(requests) ->> 'razorpay_payment_link_id', '') is not null
   or paid_at is not null
   or payout_release_after is not null;

update public.requests
set status = 'closed'
where status = 'open'
  and created_at + make_interval(days => duration_days) <= timezone('utc', now());

drop policy if exists "Users can create checkout-pending requests" on public.requests;
drop policy if exists "Users can create free open requests" on public.requests;

alter table public.requests alter column status set default 'open';
alter table public.requests add constraint requests_status_check
  check (status in ('draft', 'open', 'closed', 'cancelled', 'archived'));

alter table public.requests drop column if exists currency;
alter table public.requests drop column if exists reward;
alter table public.requests drop column if exists service_fee;
alter table public.requests drop column if exists protection_reserve;
alter table public.requests drop column if exists total_due;
alter table public.requests drop column if exists finder_payout;
alter table public.requests drop column if exists payment_status;
alter table public.requests drop column if exists payout_status;
alter table public.requests drop column if exists platform_fee_status;
alter table public.requests drop column if exists payment_provider;
alter table public.requests drop column if exists customer_email;
alter table public.requests drop column if exists customer_name;
alter table public.requests drop column if exists checkout_session_id;
alter table public.requests drop column if exists checkout_url;
alter table public.requests drop column if exists dodo_payment_id;
alter table public.requests drop column if exists lemon_squeezy_order_id;
alter table public.requests drop column if exists whop_payment_id;
alter table public.requests drop column if exists paddle_payment_id;
alter table public.requests drop column if exists paddle_transaction_id;
alter table public.requests drop column if exists razorpay_payment_id;
alter table public.requests drop column if exists razorpay_payment_link_id;
alter table public.requests drop column if exists paid_at;
alter table public.requests drop column if exists payout_release_after;

revoke all on public.requests from anon, authenticated;
grant select on public.requests to authenticated;
grant insert (
  id,
  user_id,
  item_name,
  category,
  details,
  duration_days,
  reference_images
) on public.requests to authenticated;

drop policy if exists "Users can view their own requests" on public.requests;
drop policy if exists "Users can create their own requests" on public.requests;

create policy "Users can view their own requests"
on public.requests
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create free open requests"
on public.requests
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and status = 'open'
);

-- Snapshot every retired row as independent JSON before dropping the old
-- relational workflow. This avoids archive foreign keys that could later
-- cascade-delete historical records when an account or request is removed.
create table if not exists private_legacy.retired_records (
  source_table text not null,
  record_key text not null,
  snapshot jsonb not null,
  archived_at timestamptz not null default timezone('utc', now()),
  primary key (source_table, record_key)
);

do $$
declare
  source_table text;
begin
  foreach source_table in array array[
    'request_payment_events',
    'payout_case_events',
    'finder_payout_cases',
    'finder_payout_profiles',
    'source_dispute_events',
    'source_duplicate_flag_events',
    'source_duplicate_flags',
    'source_messages',
    'support_ticket_events',
    'support_ticket_messages',
    'support_tickets',
    'source_reveals',
    'source_reviews',
    'source_disputes',
    'source_submissions'
  ]
  loop
    if to_regclass(format('public.%I', source_table)) is not null then
      execute format('lock table public.%I in access exclusive mode', source_table);
      execute format(
        'insert into private_legacy.retired_records (source_table, record_key, snapshot)
         select %L, coalesce(snapshot ->> ''id'', snapshot ->> ''user_id'', md5(snapshot::text)), snapshot
         from (select to_jsonb(source_row) as snapshot from public.%I as source_row) as archived
         on conflict (source_table, record_key) do nothing',
        source_table,
        source_table
      );
    end if;
  end loop;
end
$$;

revoke all on private_legacy.retired_records from public, anon, authenticated;
grant select on private_legacy.retired_records to service_role;

drop table if exists public.payout_case_events cascade;
drop table if exists public.source_dispute_events cascade;
drop table if exists public.source_duplicate_flag_events cascade;
drop table if exists public.source_messages cascade;
drop table if exists public.support_ticket_events cascade;
drop table if exists public.support_ticket_messages cascade;
drop table if exists public.finder_payout_cases cascade;
drop table if exists public.finder_payout_profiles cascade;
drop table if exists public.source_duplicate_flags cascade;
drop table if exists public.support_tickets cascade;
drop table if exists public.source_reveals cascade;
drop table if exists public.source_reviews cascade;
drop table if exists public.source_disputes cascade;
drop table if exists public.source_submissions cascade;
drop table if exists public.request_payment_events cascade;

revoke all on all tables in schema private_legacy from public, anon, authenticated;
grant select on all tables in schema private_legacy to service_role;

-- Retire browser access to private proof uploads while preserving stored files
-- for historical audit.
drop policy if exists "Finders can upload source proof files" on storage.objects;
drop policy if exists "Participants can view source proof files" on storage.objects;
drop policy if exists "Finders can delete unrevealed source proof files" on storage.objects;

update storage.buckets
set public = false
where id = 'source-submission-proof';

-- The public feed is read only through the server's service-role boundary. The
-- invoker view does not bypass RLS for callers that lack direct access.
create view public.public_request_cards
with (security_invoker = true, security_barrier = true)
as
select
  requests.id,
  requests.item_name,
  requests.category,
  requests.details,
  requests.duration_days,
  requests.status,
  requests.created_at,
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
    '/og/pleasefindmethis-request-board.png'
  ) as primary_image_url,
  coalesce(
    (
      select count(*)::integer
      from public.request_comments
      where request_comments.request_id = requests.id
        and request_comments.status = 'visible'
    ),
    0
  ) as submission_count
from public.requests
where requests.status = 'open'
  and requests.created_at + make_interval(days => requests.duration_days) > timezone('utc', now());

comment on view public.public_request_cards is
  'Server-read sanitized feed of free open requests and public clue counts.';

revoke all on public.public_request_cards from public, anon, authenticated;
grant select on public.public_request_cards to service_role;

create or replace function public.create_public_request_comment(
  p_request_id uuid,
  p_body text,
  p_source_url text,
  p_helper_alias text,
  p_helper_seed_hash text,
  p_helper_avatar_tone integer,
  p_request_fingerprint_hash text
)
returns public.request_comments
language plpgsql
security invoker
set search_path = pg_catalog, pg_temp
as $$
declare
  inserted_comment public.request_comments;
  recent_comment_count integer;
begin
  if not exists (
    select 1
    from public.requests
    where id = p_request_id
      and status = 'open'
      and created_at + make_interval(days => duration_days) > timezone('utc', now())
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'public_request_not_open';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_request_id::text || ':' || p_request_fingerprint_hash,
      0
    )
  );

  select count(*)
  into recent_comment_count
  from public.request_comments
  where request_id = p_request_id
    and request_fingerprint_hash = p_request_fingerprint_hash
    and status = 'visible'
    and created_at >= pg_catalog.clock_timestamp() - interval '5 minutes';

  if recent_comment_count >= 3 then
    raise exception using
      errcode = 'P0001',
      message = 'public_comment_rate_limit';
  end if;

  insert into public.request_comments (
    request_id,
    body,
    source_url,
    helper_alias,
    helper_seed_hash,
    helper_avatar_tone,
    request_fingerprint_hash,
    status
  )
  values (
    p_request_id,
    p_body,
    p_source_url,
    p_helper_alias,
    p_helper_seed_hash,
    p_helper_avatar_tone,
    p_request_fingerprint_hash,
    'visible'
  )
  returning * into inserted_comment;

  return inserted_comment;
end;
$$;

revoke all on function public.create_public_request_comment(uuid, text, text, text, text, integer, text) from public, anon, authenticated;
grant select, insert on public.request_comments to service_role;
grant execute on function public.create_public_request_comment(uuid, text, text, text, text, integer, text) to service_role;

comment on function public.create_public_request_comment(uuid, text, text, text, text, integer, text) is
  'Atomically rate-limits and inserts a public clue on a free open request. Service-role server only.';

create or replace function public.is_free_request_board_ready()
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog
as $$
  select true;
$$;

revoke all on function public.is_free_request_board_ready() from public, anon, authenticated;
grant execute on function public.is_free_request_board_ready() to service_role;

-- Keep ordinary profile timestamps working after retiring the marketplace
-- helper tables.
do $$
begin
  if to_regclass('public.profiles') is not null then
    execute 'create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_requests_updated_at()';
  end if;
end
$$;
