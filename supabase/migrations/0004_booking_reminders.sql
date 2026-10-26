-- Smash Corner · reminder emails (spec §10, v4.88; class sessions v4.90)
-- The every-minute job emails each confirmed booking and each confirmed class registration once,
-- 24 hours before it starts.
-- reminded_at marks a booking as done: set when the reminder goes out, or at confirmation when the
-- booking starts within 24 hours (the confirmation email already covers it). Cleared when an edit
-- moves the booking more than 24 hours out, so the new time gets its own reminder.

alter table bookings add column if not exists reminded_at timestamptz;
create index if not exists bookings_remind_idx on bookings (branch_id, date) where status = 'approved' and reminded_at is null;

alter table class_registrations add column if not exists reminded_at timestamptz;
create index if not exists class_regs_remind_idx on class_registrations (class_id) where status = 'approved' and reminded_at is null;
