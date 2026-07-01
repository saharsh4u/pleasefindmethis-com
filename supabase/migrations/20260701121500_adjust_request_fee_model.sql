drop policy if exists "Users can create checkout-pending requests" on public.requests;

alter table public.requests drop constraint if exists requests_reward_check;
alter table public.requests add constraint requests_reward_check check (reward >= 10);

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
  and paid_at is null
  and payout_release_after is null
);
