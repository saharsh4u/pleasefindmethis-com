alter table public.requests drop constraint if exists requests_payment_provider_check;
alter table public.requests add constraint requests_payment_provider_check
  check (payment_provider in ('pending', 'dodo', 'lemonsqueezy', 'whop', 'paddle', 'razorpay'));

alter table public.request_payment_events drop constraint if exists request_payment_events_provider_check;
alter table public.request_payment_events add constraint request_payment_events_provider_check
  check (provider in ('dodo', 'lemonsqueezy', 'whop', 'paddle', 'razorpay'));
