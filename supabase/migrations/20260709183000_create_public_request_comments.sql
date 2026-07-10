create table if not exists public.request_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  body text not null check (char_length(body) between 2 and 700),
  source_url text check (source_url is null or char_length(source_url) <= 1000),
  helper_alias text not null check (char_length(helper_alias) between 3 and 60),
  helper_seed_hash text not null check (helper_seed_hash ~ '^[0-9a-f]{64}$'),
  request_fingerprint_hash text not null check (request_fingerprint_hash ~ '^[0-9a-f]{64}$'),
  helper_avatar_tone integer not null default 0 check (helper_avatar_tone between 0 and 7),
  status text not null default 'visible' check (status in ('visible', 'hidden', 'flagged')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.request_comments
  add column if not exists request_fingerprint_hash text;

update public.request_comments
set request_fingerprint_hash = helper_seed_hash
where request_fingerprint_hash is null;

alter table public.request_comments
  alter column request_fingerprint_hash set not null;

do $$
begin
  if not exists (
    select 1
    from pg_catalog.pg_constraint
    where conname = 'request_comments_request_fingerprint_hash_check'
      and conrelid = 'public.request_comments'::regclass
  ) then
    alter table public.request_comments
      add constraint request_comments_request_fingerprint_hash_check
      check (request_fingerprint_hash ~ '^[0-9a-f]{64}$');
  end if;
end;
$$;

create index if not exists request_comments_request_created_at_idx
  on public.request_comments (request_id, created_at desc)
  where status = 'visible';

create index if not exists request_comments_status_created_at_idx
  on public.request_comments (status, created_at desc);

create index if not exists request_comments_fingerprint_rate_limit_idx
  on public.request_comments (request_id, request_fingerprint_hash, created_at desc)
  where status = 'visible';

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
revoke all on public.request_comments from service_role;

grant select on public.request_comments to service_role;

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
security definer
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
      and (
        (status = 'open' and payment_status = 'free')
        or (
          status in ('paid', 'disputed')
          and payment_status in ('paid', 'disputed')
          and paid_at is not null
        )
      )
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

revoke all on function public.create_public_request_comment(uuid, text, text, text, text, integer, text) from public;
revoke all on function public.create_public_request_comment(uuid, text, text, text, text, integer, text) from anon;
revoke all on function public.create_public_request_comment(uuid, text, text, text, text, integer, text) from authenticated;
grant execute on function public.create_public_request_comment(uuid, text, text, text, text, integer, text) to service_role;

comment on table public.request_comments is
  'Public request discussion comments. The server API owns public reads and writes, stores generated helper aliases, and persists only keyed hashes of request signals.';

comment on column public.request_comments.request_fingerprint_hash is
  'Keyed server hash used for anonymous abuse throttling. Raw network addresses and request signals are never stored.';

comment on function public.create_public_request_comment(uuid, text, text, text, text, integer, text) is
  'Atomically rate-limits and inserts an anonymous public comment. Callable only through the service-role server boundary.';
