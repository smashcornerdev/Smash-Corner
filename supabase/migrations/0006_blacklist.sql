-- Smash Corner · blacklist (spec §7 Blacklist, v6.13)
-- Super-admins list people by full name, phone number and/or email (Management → Blacklist). A booking request whose name, phone
-- or email matches any entry is shown in its own "Blacklisted" group on Court Bookings → Requests. Matching is done when the
-- Requests tab is shown (ignoring case, spacing and phone formatting), so adding someone also flags their requests already waiting.

create table if not exists public.blacklist (
  id uuid primary key default gen_random_uuid(),
  branch_id text not null references public.branches(id) default 'qc',
  name text not null default '',
  phone text not null default '',
  email text not null default '',
  note text not null default '',
  added_by text not null default '',
  created_at timestamptz not null default now(),
  check (name <> '' or phone <> '' or email <> '')
);
create index if not exists blacklist_branch_idx on public.blacklist (branch_id);
alter table public.blacklist enable row level security;
