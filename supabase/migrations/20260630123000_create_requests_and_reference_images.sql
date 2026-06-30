create extension if not exists pgcrypto with schema extensions;

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_name text not null check (char_length(item_name) <= 120),
  category text not null check (char_length(category) <= 80),
  details text not null default '' check (char_length(details) <= 500),
  currency text not null default 'USD' check (currency = 'USD'),
  reward integer not null check (reward >= 25),
  service_fee integer not null default 0 check (service_fee >= 0),
  protection_reserve integer not null default 0 check (protection_reserve >= 0),
  total_due integer not null default 0 check (total_due >= 0),
  finder_payout integer not null default 0 check (finder_payout >= 0),
  duration_days integer not null check (duration_days in (14, 30, 60)),
  status text not null default 'draft' check (status in ('draft', 'checkout_pending', 'checkout_started', 'checkout_failed', 'paid', 'cancelled', 'refund_due', 'refunded', 'disputed')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'checkout_started', 'paid', 'failed', 'cancelled', 'refund_pending', 'refunded', 'disputed')),
  payout_status text not null default 'not_ready' check (payout_status in ('not_ready', 'pending_acceptance', 'payable', 'paid', 'cancelled', 'refunded', 'disputed')),
  platform_fee_status text not null default 'unearned' check (platform_fee_status in ('unearned', 'earned', 'refunded', 'disputed')),
  payment_provider text not null default 'pending' check (payment_provider in ('pending', 'dodo', 'lemonsqueezy')),
  customer_email text,
  customer_name text,
  reference_images jsonb not null default '[]'::jsonb,
  checkout_session_id text,
  checkout_url text,
  dodo_payment_id text,
  lemon_squeezy_order_id text,
  paid_at timestamptz,
  payout_release_after timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.requests add column if not exists currency text not null default 'USD';
alter table public.requests add column if not exists service_fee integer not null default 0;
alter table public.requests add column if not exists protection_reserve integer not null default 0;
alter table public.requests add column if not exists total_due integer not null default 0;
alter table public.requests add column if not exists finder_payout integer not null default 0;
alter table public.requests add column if not exists payment_status text not null default 'unpaid';
alter table public.requests add column if not exists payout_status text not null default 'not_ready';
alter table public.requests add column if not exists platform_fee_status text not null default 'unearned';
alter table public.requests add column if not exists payment_provider text not null default 'pending';
alter table public.requests add column if not exists dodo_payment_id text;
alter table public.requests add column if not exists lemon_squeezy_order_id text;
alter table public.requests add column if not exists paid_at timestamptz;
alter table public.requests add column if not exists payout_release_after timestamptz;

update public.requests
set
  currency = 'USD',
  payment_provider = case
    when lemon_squeezy_order_id is not null then 'lemonsqueezy'
    when dodo_payment_id is not null then 'dodo'
    else payment_provider
  end,
  finder_payout = case when finder_payout = 0 then reward else finder_payout end,
  total_due = case when total_due = 0 then reward + service_fee + protection_reserve else total_due end
where currency is distinct from 'USD'
  or payment_provider not in ('pending', 'dodo', 'lemonsqueezy')
  or finder_payout = 0
  or total_due = 0;

alter table public.requests drop constraint if exists requests_status_check;
alter table public.requests add constraint requests_status_check check (status in ('draft', 'checkout_pending', 'checkout_started', 'checkout_failed', 'paid', 'cancelled', 'refund_due', 'refunded', 'disputed'));
alter table public.requests drop constraint if exists requests_currency_check;
alter table public.requests add constraint requests_currency_check check (currency = 'USD');
alter table public.requests drop constraint if exists requests_service_fee_check;
alter table public.requests add constraint requests_service_fee_check check (service_fee >= 0);
alter table public.requests drop constraint if exists requests_protection_reserve_check;
alter table public.requests add constraint requests_protection_reserve_check check (protection_reserve >= 0);
alter table public.requests drop constraint if exists requests_total_due_check;
alter table public.requests add constraint requests_total_due_check check (total_due >= reward);
alter table public.requests drop constraint if exists requests_finder_payout_check;
alter table public.requests add constraint requests_finder_payout_check check (finder_payout = reward);
alter table public.requests drop constraint if exists requests_payment_status_check;
alter table public.requests add constraint requests_payment_status_check check (payment_status in ('unpaid', 'checkout_started', 'paid', 'failed', 'cancelled', 'refund_pending', 'refunded', 'disputed'));
alter table public.requests drop constraint if exists requests_payout_status_check;
alter table public.requests add constraint requests_payout_status_check check (payout_status in ('not_ready', 'pending_acceptance', 'payable', 'paid', 'cancelled', 'refunded', 'disputed'));
alter table public.requests drop constraint if exists requests_platform_fee_status_check;
alter table public.requests add constraint requests_platform_fee_status_check check (platform_fee_status in ('unearned', 'earned', 'refunded', 'disputed'));
alter table public.requests drop constraint if exists requests_payment_provider_check;
alter table public.requests add constraint requests_payment_provider_check check (payment_provider in ('pending', 'dodo', 'lemonsqueezy'));

create index if not exists requests_user_id_created_at_idx on public.requests (user_id, created_at desc);
create unique index if not exists requests_checkout_session_id_key on public.requests (checkout_session_id) where checkout_session_id is not null;
create unique index if not exists requests_lemon_squeezy_order_id_key on public.requests (lemon_squeezy_order_id) where lemon_squeezy_order_id is not null;
create index if not exists requests_payment_status_idx on public.requests (payment_status);
create index if not exists requests_payout_status_idx on public.requests (payout_status);
create index if not exists requests_payment_provider_idx on public.requests (payment_provider);

create table if not exists public.request_payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'dodo' check (provider in ('dodo', 'lemonsqueezy')),
  request_id uuid not null references public.requests (id) on delete cascade,
  event_type text not null,
  dodo_payment_id text,
  lemon_squeezy_order_id text,
  checkout_session_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.request_payment_events add column if not exists provider text not null default 'dodo';
alter table public.request_payment_events add column if not exists lemon_squeezy_order_id text;
alter table public.request_payment_events drop constraint if exists request_payment_events_provider_check;
alter table public.request_payment_events add constraint request_payment_events_provider_check check (provider in ('dodo', 'lemonsqueezy'));

create index if not exists request_payment_events_request_id_created_at_idx on public.request_payment_events (request_id, created_at desc);
create index if not exists request_payment_events_event_type_idx on public.request_payment_events (event_type);
create index if not exists request_payment_events_provider_idx on public.request_payment_events (provider);

create or replace function public.set_requests_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_requests_updated_at on public.requests;

create trigger set_requests_updated_at
before update on public.requests
for each row
execute function public.set_requests_updated_at();

alter table public.requests enable row level security;
alter table public.requests force row level security;

grant usage on schema public to authenticated;
revoke insert, update on public.requests from authenticated;
grant select on public.requests to authenticated;
grant insert (
  id,
  user_id,
  item_name,
  category,
  details,
  currency,
  reward,
  service_fee,
  protection_reserve,
  total_due,
  finder_payout,
  duration_days,
  status,
  payment_status,
  payout_status,
  platform_fee_status,
  customer_email,
  customer_name,
  reference_images
) on public.requests to authenticated;
grant select on public.request_payment_events to authenticated;
revoke all on public.requests from anon;
revoke all on public.request_payment_events from anon;

drop policy if exists "Users can view their own requests" on public.requests;
drop policy if exists "Users can create their own requests" on public.requests;
drop policy if exists "Users can create checkout-pending requests" on public.requests;
drop policy if exists "Users can update their own requests" on public.requests;

do $$
begin
  create policy "Users can view their own requests"
  on public.requests
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

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
    and service_fee = greatest(12, round(reward * 0.08)::integer)
    and protection_reserve = round(reward * 0.03)::integer
    and total_due = reward + service_fee + protection_reserve
    and checkout_session_id is null
    and checkout_url is null
    and dodo_payment_id is null
    and lemon_squeezy_order_id is null
    and paid_at is null
    and payout_release_after is null
  );
end
$$;

alter table public.request_payment_events enable row level security;
alter table public.request_payment_events force row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'request_payment_events'
      and policyname = 'Users can view payment events for their own requests'
  ) then
    create policy "Users can view payment events for their own requests"
    on public.request_payment_events
    for select
    to authenticated
    using (
      exists (
        select 1
        from public.requests
        where requests.id = request_payment_events.request_id
          and requests.user_id = (select auth.uid())
      )
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from storage.buckets
    where id = 'request-reference-images'
  ) then
    insert into storage.buckets (
      id,
      name,
      public,
      file_size_limit,
      allowed_mime_types
    )
    values (
      'request-reference-images',
      'request-reference-images',
      true,
      10485760,
      array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can upload request reference images'
  ) then
    create policy "Authenticated users can upload request reference images"
    on storage.objects
    for insert
    to authenticated
    with check (
      bucket_id = 'request-reference-images'
      and (storage.foldername(name))[1] = (select auth.uid()::text)
    );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can update request reference images'
  ) then
    create policy "Authenticated users can update request reference images"
    on storage.objects
    for update
    to authenticated
    using (
      bucket_id = 'request-reference-images'
      and (storage.foldername(name))[1] = (select auth.uid()::text)
    )
    with check (
      bucket_id = 'request-reference-images'
      and (storage.foldername(name))[1] = (select auth.uid()::text)
    );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Authenticated users can delete request reference images'
  ) then
    create policy "Authenticated users can delete request reference images"
    on storage.objects
    for delete
    to authenticated
    using (
      bucket_id = 'request-reference-images'
      and (storage.foldername(name))[1] = (select auth.uid()::text)
    );
  end if;
end
$$;
