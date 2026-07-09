create or replace view public.public_request_cards
with (security_invoker = true, security_barrier = true)
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
  'Sanitized public request feed for the server API. Exposes free open requests and legacy paid requests without customer or payment fields.';

revoke all on public.public_request_cards from public;
revoke all on public.public_request_cards from anon;
revoke all on public.public_request_cards from authenticated;
grant select on public.public_request_cards to service_role;

revoke execute on function public.apply_source_review_decision() from public, anon, authenticated;
revoke execute on function public.mark_source_submission_revealed() from public, anon, authenticated;

revoke execute on function public.can_submit_source(uuid, uuid) from anon;
revoke execute on function public.finder_has_active_source_submission(uuid, uuid) from anon;
revoke execute on function public.get_finder_source_submission_details() from anon;
revoke execute on function public.get_revealed_source_details() from anon;
revoke execute on function public.is_request_owner(uuid, uuid) from anon;
