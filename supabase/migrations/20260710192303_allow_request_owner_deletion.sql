revoke delete on table public.requests from anon;
grant delete on table public.requests to authenticated;

drop policy if exists "Users can delete their own requests" on public.requests;

create policy "Users can delete their own requests"
on public.requests
for delete
to authenticated
using ((select auth.uid()) = user_id);
