alter table public.requests drop constraint if exists requests_reward_check;
alter table public.requests add constraint requests_reward_check check (reward >= 10);
