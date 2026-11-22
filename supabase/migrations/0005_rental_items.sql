-- Smash Corner · rental items managed by admins (spec §7 Equipment Inventory, v6.05)
-- unit: how an item's rate is charged: 'hour' = per item, per booked hour; 'session' = per item, once per booking (any length).
-- deleted: admins delete items from Management → Equipment Inventory. The row is kept (hidden) because past bookings, holds and
-- receipts refer to the item by id in their equipment JSON and still need its name.

alter table public.equipment_items add column if not exists unit text not null default 'hour' check (unit in ('hour', 'session'));
alter table public.equipment_items add column if not exists deleted boolean not null default false;
