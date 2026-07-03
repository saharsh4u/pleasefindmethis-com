alter table public.requests add column if not exists whop_payment_id text;
alter table public.request_payment_events add column if not exists whop_payment_id text;

alter table public.requests drop constraint if exists requests_payment_provider_check;
alter table public.requests add constraint requests_payment_provider_check
  check (payment_provider in ('pending', 'dodo', 'lemonsqueezy', 'whop'));

alter table public.request_payment_events drop constraint if exists request_payment_events_provider_check;
alter table public.request_payment_events add constraint request_payment_events_provider_check
  check (provider in ('dodo', 'lemonsqueezy', 'whop'));

do $$
begin
  if not exists (
    select 1
    from public.requests
    where whop_payment_id is not null
    group by whop_payment_id
    having count(*) > 1
  ) then
    create unique index if not exists requests_whop_payment_id_key
      on public.requests (whop_payment_id)
      where whop_payment_id is not null;
  else
    raise notice 'Skipped requests_whop_payment_id_key because duplicate Whop payment ids already exist.';
  end if;
end
$$;

create index if not exists request_payment_events_whop_payment_id_idx
  on public.request_payment_events (whop_payment_id)
  where whop_payment_id is not null;

drop policy if exists "Users can create checkout-pending requests" on public.requests;

create policy "Users can create checkout-pending requests"
on public.requests
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and currency = 'USD'
  and status = 'checkout_pending'
  and payment_status = 'unpaid'
  and payout_status = 'not_ready'
  and platform_fee_status = 'unearned'
  and payment_provider = 'pending'
  and finder_payout = reward
  and service_fee = greatest(6, round(reward * 0.12)::integer)
  and protection_reserve = greatest(1, round(reward * 0.03)::integer)
  and total_due = reward + service_fee + protection_reserve
  and checkout_session_id is null
  and checkout_url is null
  and dodo_payment_id is null
  and lemon_squeezy_order_id is null
  and whop_payment_id is null
  and paid_at is null
  and payout_release_after is null
);
