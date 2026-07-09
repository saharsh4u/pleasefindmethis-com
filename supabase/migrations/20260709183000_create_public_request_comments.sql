create table if not exists public.request_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  body text not null check (char_length(body) between 2 and 700),
  source_url text check (source_url is null or char_length(source_url) <= 1000),
  helper_alias text not null check (char_length(helper_alias) between 3 and 60),
  helper_seed_hash text not null check (helper_seed_hash ~ '^[0-9a-f]{64}$'),
  helper_avatar_tone integer not null default 0 check (helper_avatar_tone between 0 and 7),
  status text not null default 'visible' check (status in ('visible', 'hidden', 'flagged')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists request_comments_request_created_at_idx
  on public.request_comments (request_id, created_at desc)
  where status = 'visible';

create index if not exists request_comments_status_created_at_idx
  on public.request_comments (status, created_at desc);

drop trigger if exists set_request_comments_updated_at on public.request_comments;

create trigger set_request_comments_updated_at
before update on public.request_comments
for each row
execute function public.set_requests_updated_at();

alter table public.request_comments enable row level security;
alter table public.request_comments force row level security;

revoke all on public.request_comments from public;
revoke all on public.request_comments from anon;
revoke all on public.request_comments from authenticated;

grant select, insert, update on public.request_comments to service_role;

comment on table public.request_comments is
  'Public request discussion comments. The server API owns public reads and writes, stores generated helper aliases, and hides visitor seeds.';
