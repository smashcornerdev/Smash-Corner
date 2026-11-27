-- Smash Corner · class or event, and a description (spec §7 Classes & Events, v6.55)
-- The Open registration form now says whether a registration is a Class (listed under Programs on the Programs & Events page)
-- or an Event (listed under Events), and takes an optional short description shown on that page. Existing rows become classes.

alter table public.classes add column if not exists kind text not null default 'class';
alter table public.classes add column if not exists description text not null default '';
do $$ begin
  alter table public.classes add constraint classes_kind_check check (kind in ('class', 'event'));
exception when duplicate_object then null;
end $$;
