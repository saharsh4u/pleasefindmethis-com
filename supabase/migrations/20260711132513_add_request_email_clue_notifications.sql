alter table public.requests
  add column if not exists email_clue_notifications boolean not null default false;

grant insert (
  email_clue_notifications
) on public.requests to authenticated;

comment on column public.requests.email_clue_notifications is
  'Request-scoped owner opt-in for one email notification per newly visible clue.';
