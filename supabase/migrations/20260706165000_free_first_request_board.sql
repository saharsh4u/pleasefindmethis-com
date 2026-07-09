-- Shift the core product from funded marketplace requests to free public
-- request-board posts. Keep legacy payment columns for older records and
-- future paid visibility tools, but allow new requests with no user-to-user
-- reward or payout.

alter table public.requests drop constraint if exists requests_reward_check;
alter table public.requests add constraint requests_reward_check check (reward >= 0);

alter table public.requests drop constraint if exists requests_details_check;
alter table public.requests add constraint requests_details_check check (char_length(details) <= 5000);

alter table public.requests drop constraint if exists requests_duration_days_check;
alter table public.requests add constraint requests_duration_days_check check (duration_days in (7, 14, 30, 60));

alter table public.requests drop constraint if exists requests_status_check;
alter table public.requests add constraint requests_status_check check (
  status in ('draft', 'open', 'checkout_pending', 'checkout_started', 'checkout_failed', 'paid', 'cancelled', 'refund_due', 'refunded', 'disputed')
);

alter table public.requests drop constraint if exists requests_payment_status_check;
alter table public.requests add constraint requests_payment_status_check check (
  payment_status in ('free', 'unpaid', 'checkout_started', 'paid', 'failed', 'cancelled', 'refund_pending', 'refunded', 'disputed')
);

alter table public.requests drop constraint if exists requests_total_due_check;
alter table public.requests add constraint requests_total_due_check check (total_due >= 0);

alter table public.requests drop constraint if exists requests_finder_payout_check;
alter table public.requests add constraint requests_finder_payout_check check (finder_payout >= 0);

drop policy if exists "Users can create free open requests" on public.requests;

create policy "Users can create free open requests"
on public.requests
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and currency = 'USD'
  and status = 'open'
  and payment_status = 'free'
  and payout_status = 'not_ready'
  and platform_fee_status = 'unearned'
  and payment_provider = 'pending'
  and reward = 0
  and service_fee = 0
  and protection_reserve = 0
  and total_due = 0
  and finder_payout = 0
  and checkout_session_id is null
  and checkout_url is null
  and dodo_payment_id is null
  and lemon_squeezy_order_id is null
  and paid_at is null
  and payout_release_after is null
);

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
where (
    requests.status = 'open'
    and requests.payment_status = 'free'
  )
  or (
    requests.status in ('paid', 'disputed')
    and requests.payment_status in ('paid', 'disputed')
    and requests.paid_at is not null
  );

comment on view public.public_request_cards is
  'Sanitized public request feed. Exposes free open requests and legacy paid requests without customer or payment fields.';

revoke all on public.public_request_cards from public;
grant select on public.public_request_cards to anon, authenticated;

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
      and (
        (status = 'open' and payment_status = 'free')
        or (status = 'paid' and payment_status = 'paid')
      )
      and created_at + make_interval(days => duration_days) > timezone('utc', now())
  );
$$;

revoke all on function public.can_submit_source(uuid, uuid) from public;
grant execute on function public.can_submit_source(uuid, uuid) to authenticated;
