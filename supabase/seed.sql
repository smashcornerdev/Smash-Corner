-- Smash Corner · starter data (dummy values from spec §15, §16). Replace before launch.

insert into branches (id, name, short_name, address) values
  ('qc', 'Smash Corner QC', 'QC', 'Lorem Ipsum St., Quezon City');

insert into courts (id, name, type, rate, min_players, max_players, note, surface, size, sort_order) values
  ('t1', 'Tennis Court 1',     'tennis', 1200, 1, 4, 'Includes ball boy',   'Hard court',        '23.77 × 10.97 m', 1),
  ('p1', 'Pickleball Court 1', 'pickle',  800, 2, 6, 'Up to 6 people only', 'Cushioned acrylic', '13.41 × 6.10 m',  2),
  ('p2', 'Pickleball Court 2', 'pickle',  800, 2, 6, 'Up to 6 people only', 'Cushioned acrylic', '13.41 × 6.10 m',  3);

insert into equipment_items (id, name, type, rate, sort_order) values
  ('racket', 'Tennis Racket',           'tennis', 150, 1),
  ('tball',  'Tennis Balls (can of 3)', 'tennis',  80, 2),
  ('paddle', 'Pickleball Paddle',       'pickle', 100, 3),
  ('pball',  'Pickleball Ball',         'pickle',  30, 4);

insert into inventory (item_id, owned, out_of_service) values
  ('racket', 10, 0), ('tball', 12, 0), ('paddle', 16, 0), ('pball', 30, 0);

insert into payment_methods (name, details, sort_order) values
  ('BDO',   E'Account name: Smash Corner QC (dummy)\nAccount number: 0000-0000-0000\nBank transfer / InstaPay', 1),
  ('BPI',   E'Account name: Smash Corner QC (dummy)\nAccount number: 0000-0000-00\nBank transfer / InstaPay', 2),
  ('GCash', E'Account name: Smash Corner QC (dummy)\nNumber: 0917-000-0000\nE-wallet · scan the QR code', 3),
  ('Maya',  E'Account name: Smash Corner QC (dummy)\nNumber: 0918-000-0000\nE-wallet · scan the QR code', 4);

-- The 5 admin emails (§7 Access): 2 super-admins + 3 admins. Placeholders until the real ones are supplied.
-- Spec plans 2 super-admins + 3 admins; add the other 4 when their emails are known
-- (each also needs a Clerk invitation, see README → Clerk).
insert into admins (email, name, role) values
  ('smashcorner.dev@gmail.com', 'Smash Corner Admin', 'super_admin');
