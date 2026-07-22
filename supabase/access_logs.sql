create table if not exists public.access_logs (
  id uuid primary key default gen_random_uuid(),
  _openid text not null,
  "accessTime" timestamp without time zone not null,
  created_at timestamp without time zone not null
);

create index if not exists access_logs_openid_idx
  on public.access_logs (_openid);

create index if not exists access_logs_access_time_idx
  on public.access_logs ("accessTime");

alter table public.access_logs enable row level security;

drop policy if exists "access_logs_insert_anon" on public.access_logs;
create policy "access_logs_insert_anon"
  on public.access_logs
  for insert
  to anon
  with check (_openid is not null and "accessTime" is not null);
