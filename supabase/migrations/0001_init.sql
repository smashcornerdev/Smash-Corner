-- Smash Corner · Phase 1 schema (spec §6–§10, §15–§19)
-- All tables have RLS on with no public policies: the browser never talks to Supabase directly.
-- The Next.js server uses the service-role key and checks admin roles itself (src/lib/auth.ts).

create extension if not exists pgcrypto;

-- ---------- Branches (Phase 1 has one; Phase 2 adds more) ----------
create table branches (
  id text primary key,
  name text not null,
  short_name text not null,
  address text not null,
  created_at timestamptz not null default now()
);

-- ---------- Courts, equipment, inventory ----------
create table courts (
  id text primary key,
  branch_id text not null references branches(id) default 'qc',
  name text not null,
  type text not null check (type in ('tennis','pickle')),
  rate integer not null check (rate >= 0),          -- ₱ per hour
  min_players integer not null,
  max_players integer not null,
  note text not null default '',
  surface text not null default '',
  size text not null default '',
  sort_order integer not null default 0
);

create table equipment_items (
  id text primary key,
  name text not null,
  type text not null check (type in ('tennis','pickle')),
  rate integer not null check (rate >= 0),          -- ₱ per item per hour
  sort_order integer not null default 0
);

create table inventory (
  branch_id text not null references branches(id) default 'qc',
  item_id text not null references equipment_items(id),
  owned integer not null default 0 check (owned >= 0),
  out_of_service integer not null default 0 check (out_of_service >= 0),
  primary key (branch_id, item_id),
  check (out_of_service <= owned)
);

-- ---------- Admins (access by verified email, §7 Access) ----------
create table admins (
  email text primary key check (email = lower(email)),
  name text not null,
  role text not null check (role in ('super_admin','admin')),
  created_at timestamptz not null default now()
);

-- ---------- Payment methods (§16) ----------
create table payment_methods (
  id uuid primary key default gen_random_uuid(),
  branch_id text not null references branches(id) default 'qc',
  name text not null,
  details text not null,
  qr_url text,
  qr_path text,
  active boolean not null default true,
  deleted boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ---------- Statuses shared by bookings and class registrations (§8) ----------
-- pending   = request waiting for an admin
-- awaiting  = approved, customer has 24 h to pay
-- verify    = paid, proof waiting for an admin
-- approved  = confirmed
-- rejected / cancelled / unpaid = closed
create domain request_status as text
  check (value in ('pending','awaiting','verify','approved','rejected','cancelled','unpaid'));

create sequence booking_ref_seq start 1042;
create sequence class_reg_ref_seq start 2001;

-- ---------- Orders: bookings requested (and paid) together (§7 Orders) ----------
create table orders (
  id uuid primary key default gen_random_uuid(),
  branch_id text not null references branches(id) default 'qc',
  name text not null,
  email text not null,
  phone text not null,
  free boolean not null default false,               -- ₱0 order: no payment step
  method_id uuid references payment_methods(id),
  method_name text,                                  -- snapshot of the method's name
  pay_ref text,
  proof_path text,                                   -- private "receipts" bucket
  approved_at timestamptz,
  pay_due_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default ('SC-' || nextval('booking_ref_seq')),
  branch_id text not null references branches(id) default 'qc',
  order_id uuid not null references orders(id),
  court_id text not null references courts(id),
  date date not null,
  hours integer[] not null check (cardinality(hours) > 0),   -- start hours, e.g. {9,10} = 9–11 AM
  players integer not null,
  equipment jsonb not null default '{}'::jsonb,              -- { "paddle": 2 }
  court_fee integer not null,
  equipment_fee integer not null,
  total integer not null,
  status request_status not null default 'pending',
  name text not null,
  email text not null,
  phone text not null,
  reason text not null default '',
  refund_pct integer,
  edited boolean not null default false,
  waitlist_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index bookings_date_idx on bookings (branch_id, date);
create index bookings_status_idx on bookings (branch_id, status);
create index bookings_order_idx on bookings (order_id);

-- ---------- Cart holds (15 min) ----------
create table holds (
  id uuid primary key default gen_random_uuid(),
  branch_id text not null references branches(id) default 'qc',
  session_id text not null,                           -- httpOnly cookie
  court_id text not null references courts(id),
  date date not null,
  hours integer[] not null,
  players integer not null,
  equipment jsonb not null default '{}'::jsonb,
  court_fee integer not null,
  equipment_fee integer not null,
  total integer not null,
  name text not null,
  email text not null,
  phone text not null,
  waitlist_id uuid,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index holds_session_idx on holds (session_id);

-- ---------- Waitlist (§9) ----------
create table waitlist (
  id uuid primary key default gen_random_uuid(),
  branch_id text not null references branches(id) default 'qc',
  court_id text not null references courts(id),
  date date not null,
  hour integer not null,
  name text not null,
  email text not null,
  phone text not null,
  players integer not null,
  status text not null default 'waiting' check (status in ('waiting','notified','claimed','expired','removed')),
  claim_expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index waitlist_slot_idx on waitlist (court_id, date, hour, status);
create unique index waitlist_one_per_email on waitlist (court_id, date, hour, lower(email)) where status in ('waiting','notified');

-- ---------- Slot locks: one row per court-hour that is taken ----------
-- The unique index is the double-booking guard (§18): a booking, a cart hold or a
-- waitlist claim must own the lock row, so two customers can never hold the same hour.
create table slot_locks (
  court_id text not null references courts(id),
  date date not null,
  hour integer not null,
  booking_id uuid references bookings(id) on delete cascade,
  hold_id uuid references holds(id) on delete cascade,
  waitlist_id uuid references waitlist(id) on delete cascade,
  primary key (court_id, date, hour),
  check (num_nonnulls(booking_id, hold_id, waitlist_id) = 1)
);
create index slot_locks_booking_idx on slot_locks (booking_id);
create index slot_locks_hold_idx on slot_locks (hold_id);

-- closed bookings give their hours back
create function release_booking_locks() returns trigger language plpgsql as $$
begin
  if new.status in ('rejected','cancelled','unpaid') then
    delete from slot_locks where booking_id = new.id;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger bookings_release before update of status on bookings
  for each row execute function release_booking_locks();

-- ---------- Classes & events (§6, §7) ----------
create table classes (
  id uuid primary key default gen_random_uuid(),
  branch_id text not null references branches(id) default 'qc',
  title text not null,
  court_id text not null references courts(id),
  date date not null,
  start_hour integer not null,
  end_hour integer not null check (end_hour > start_hour),
  deadline timestamptz not null,
  capacity integer not null check (capacity >= 1),
  fee integer not null check (fee >= 0),
  rental_fee integer,                                  -- null = no rentals
  rental_qty integer not null default 0,
  status text not null default 'open' check (status in ('open','closed','cancelled')),
  created_by text not null,
  created_at timestamptz not null default now()
);

create table class_registrations (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default ('CL-' || nextval('class_reg_ref_seq')),
  class_id uuid not null references classes(id),
  name text not null,
  nickname text not null,
  age integer not null check (age between 1 and 100),
  email text not null,
  phone text not null,
  rent boolean not null default false,
  total integer not null,
  status request_status not null default 'pending',
  method_id uuid references payment_methods(id),
  method_name text,
  pay_ref text,
  proof_path text,
  approved_at timestamptz,
  pay_due_at timestamptz,
  paid_at timestamptz,
  reason text not null default '',
  refund_pct integer,
  created_at timestamptz not null default now()
);
create index class_regs_class_idx on class_registrations (class_id, status);

-- ---------- Closures (§7) ----------
create table closures (
  id uuid primary key default gen_random_uuid(),
  branch_id text not null references branches(id) default 'qc',
  court_ids text[] not null,
  starts_on date not null,
  ends_on date,                                        -- null = repeats with no end date
  repeat_days integer[],                               -- weekdays 0 Sun … 6 Sat; null = every day
  all_day boolean not null default true,
  start_hour integer not null,
  end_hour integer not null,
  category text not null,
  note text not null default '',
  cancelled_count integer not null default 0,
  created_by text not null,
  created_at timestamptz not null default now()
);

-- ---------- Activity log ----------
create table activity_log (
  id bigint generated always as identity primary key,
  branch_id text not null default 'qc',
  at timestamptz not null default now(),
  admin_email text,
  admin_name text not null,
  action text not null,
  ref text not null default '',
  note text not null default ''
);
create index activity_log_at_idx on activity_log (branch_id, at desc);

-- ---------- RLS: on everywhere, no public policies ----------
alter table branches enable row level security;
alter table courts enable row level security;
alter table equipment_items enable row level security;
alter table inventory enable row level security;
alter table admins enable row level security;
alter table payment_methods enable row level security;
alter table orders enable row level security;
alter table bookings enable row level security;
alter table holds enable row level security;
alter table waitlist enable row level security;
alter table slot_locks enable row level security;
alter table classes enable row level security;
alter table class_registrations enable row level security;
alter table closures enable row level security;
alter table activity_log enable row level security;

-- ---------- Atomic operations (called with the service role) ----------

-- Put a court-hour range in the cart. Fails with 'slot_taken' if any hour is locked.
-- p_waitlist_id: a waitlist claim; its reserved hour is handed over to the hold.
create function create_hold(
  p_session text, p_court text, p_date date, p_hours integer[], p_players integer,
  p_equipment jsonb, p_court_fee integer, p_equipment_fee integer, p_total integer,
  p_name text, p_email text, p_phone text, p_expires timestamptz, p_waitlist_id uuid
) returns uuid language plpgsql as $$
declare v_id uuid; h integer;
begin
  delete from holds where expires_at <= now();
  if p_waitlist_id is not null then
    delete from slot_locks where waitlist_id = p_waitlist_id;
  end if;
  insert into holds (session_id, court_id, date, hours, players, equipment, court_fee, equipment_fee, total, name, email, phone, waitlist_id, expires_at)
  values (p_session, p_court, p_date, p_hours, p_players, p_equipment, p_court_fee, p_equipment_fee, p_total, p_name, p_email, p_phone, p_waitlist_id, p_expires)
  returning id into v_id;
  foreach h in array p_hours loop
    begin
      insert into slot_locks (court_id, date, hour, hold_id) values (p_court, p_date, h, v_id);
    exception when unique_violation then
      raise exception 'slot_taken' using errcode = 'P0001';
    end;
  end loop;
  return v_id;
end $$;

-- Turn a session's cart into one order of pending bookings. Returns the order id.
create function submit_cart(
  p_session text, p_name text, p_email text, p_phone text, p_free boolean
) returns uuid language plpgsql as $$
declare v_order uuid; r holds%rowtype; v_booking uuid;
begin
  delete from holds where expires_at <= now();
  if not exists (select 1 from holds where session_id = p_session) then
    raise exception 'cart_empty' using errcode = 'P0001';
  end if;
  insert into orders (name, email, phone, free) values (p_name, p_email, p_phone, p_free) returning id into v_order;
  for r in select * from holds where session_id = p_session order by date, hours[1] loop
    insert into bookings (order_id, court_id, date, hours, players, equipment, court_fee, equipment_fee, total, name, email, phone, waitlist_id)
    values (v_order, r.court_id, r.date, r.hours, r.players, r.equipment, r.court_fee, r.equipment_fee, r.total, r.name, r.email, r.phone, r.waitlist_id)
    returning id into v_booking;
    update slot_locks set booking_id = v_booking, hold_id = null where hold_id = r.id;
    if r.waitlist_id is not null then
      update waitlist set status = 'claimed' where id = r.waitlist_id;
    end if;
  end loop;
  delete from holds where session_id = p_session;
  return v_order;
end $$;

-- Register for a class; the class row is locked so two people can't take the last slot.
create function register_class(
  p_class uuid, p_name text, p_nickname text, p_age integer, p_email text, p_phone text, p_rent boolean
) returns uuid language plpgsql as $$
declare k classes%rowtype; v_taken integer; v_rented integer; v_id uuid;
begin
  select * into k from classes where id = p_class for update;
  if not found or k.status <> 'open' or now() >= k.deadline then
    raise exception 'class_closed' using errcode = 'P0001';
  end if;
  select count(*), count(*) filter (where rent) into v_taken, v_rented
    from class_registrations where class_id = p_class and status in ('pending','awaiting','verify','approved');
  if v_taken >= k.capacity then raise exception 'class_full' using errcode = 'P0001'; end if;
  if p_rent and (k.rental_fee is null or v_rented >= k.rental_qty) then
    raise exception 'rental_gone' using errcode = 'P0001';
  end if;
  if exists (select 1 from class_registrations where class_id = p_class
             and status in ('pending','awaiting','verify','approved')
             and lower(email) = lower(p_email) and lower(trim(name)) = lower(trim(p_name))) then
    raise exception 'already_registered' using errcode = 'P0001';
  end if;
  insert into class_registrations (class_id, name, nickname, age, email, phone, rent, total)
  values (p_class, trim(p_name), trim(p_nickname), p_age, p_email, p_phone, p_rent,
          k.fee + case when p_rent then coalesce(k.rental_fee, 0) else 0 end)
  returning id into v_id;
  return v_id;
end $$;


-- Admin edit / reschedule: swap a booking's locks to new hours in one step. Fails with 'slot_taken'.
create function move_booking(p_booking uuid, p_court text, p_date date, p_hours integer[]) returns void language plpgsql as $$
declare h integer;
begin
  delete from holds where expires_at <= now();
  delete from slot_locks where booking_id = p_booking;
  foreach h in array p_hours loop
    begin
      insert into slot_locks (court_id, date, hour, booking_id) values (p_court, p_date, h, p_booking);
    exception when unique_violation then
      raise exception 'slot_taken' using errcode = 'P0001';
    end;
  end loop;
  update bookings set court_id = p_court, date = p_date, hours = p_hours, edited = true, updated_at = now() where id = p_booking;
end $$;

-- These functions are only for the server (service role).
revoke all on function create_hold from public, anon, authenticated;
revoke all on function submit_cart from public, anon, authenticated;
revoke all on function register_class from public, anon, authenticated;
revoke all on function move_booking from public, anon, authenticated;

-- ---------- Storage ----------
insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('payment-qr', 'payment-qr', true) on conflict do nothing;
