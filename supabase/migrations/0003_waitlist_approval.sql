-- Smash Corner · waitlist applications (spec §9, v4.78)
-- Joining the waitlist is now an application: it starts as 'applied' and only enters the line
-- ('waiting') once an admin approves it. The line is ordered by approval time.

alter table waitlist drop constraint if exists waitlist_status_check;
alter table waitlist add constraint waitlist_status_check
  check (status in ('applied','declined','waiting','notified','claimed','expired','removed'));
alter table waitlist alter column status set default 'applied';
alter table waitlist add column if not exists approved_at timestamptz;

-- entries already in line keep their place
update waitlist set approved_at = created_at where approved_at is null and status in ('waiting','notified','claimed');

drop index if exists waitlist_one_per_email;
create unique index waitlist_one_per_email on waitlist (court_id, date, hour, lower(email)) where status in ('applied','waiting','notified');
