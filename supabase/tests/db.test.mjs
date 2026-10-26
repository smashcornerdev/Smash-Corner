// Database checks: runs the migration + seed in PGlite (Postgres in WASM) and exercises the SQL functions.
// npm run test:db
import { PGlite } from "@electric-sql/pglite";
import fs from "fs";
import { fileURLToPath } from "url";

const root = fileURLToPath(new URL("../..", import.meta.url));
let mig = fs.readFileSync(`${root}/supabase/migrations/0001_init.sql`, "utf8");
// Supabase-only bits: roles + storage schema don't exist in plain Postgres
mig = mig.replace("create extension if not exists pgcrypto;", "").replace(/revoke all on function[^\n]*\n/g, "").replace(/insert into storage\.buckets[^\n]*\n/g, "");
const seed = fs.readFileSync(`${root}/supabase/seed.sql`, "utf8");
const db = new PGlite();
const ok = (c, m) => { console.log((c ? "PASS " : "FAIL ") + m); if (!c) process.exitCode = 1; };
const q = (s, p) => db.query(s, p);
const fails = async (s, p, msg) => { try { await q(s, p); return false; } catch (e) { return e.message.includes(msg); } };

await db.exec(mig);
await db.exec(fs.readFileSync(`${root}/supabase/migrations/0003_waitlist_approval.sql`, "utf8"));
await db.exec(fs.readFileSync(`${root}/supabase/migrations/0004_booking_reminders.sql`, "utf8"));
await db.exec(seed);
ok((await q("select count(*)::int n from courts")).rows[0].n === 3, "schema + seed load (3 courts)");

const exp = new Date(Date.now() + 15 * 60e3).toISOString();
const hold = (sess, court, date, hours, wl = null) => q(
  "select create_hold($1,$2,$3,$4,2,'{}'::jsonb,800,0,800,'Ana','ana@x.com','09171234567',$5,$6) id",
  [sess, court, date, hours, exp, wl]);

const h1 = (await hold("s1", "p1", "2030-01-10", [9, 10])).rows[0].id;
ok(!!h1, "create_hold returns an id");
ok((await q("select count(*)::int n from slot_locks where hold_id=$1", [h1])).rows[0].n === 2, "hold locks both hours");
ok(await fails("select create_hold('s2','p1','2030-01-10','{10,11}',2,'{}'::jsonb,800,0,800,'B','b@x.com','0917',$1,null)", [exp], "slot_taken"), "second customer can't hold an hour already held (slot_taken)");
ok((await q("select count(*)::int n from holds where session_id='s2'")).rows[0].n === 0, "failed hold leaves nothing behind (rolled back)");

// expired holds don't block
await q("update holds set expires_at = now() - interval '1 minute' where id=$1", [h1]);
const h2 = (await hold("s2", "p1", "2030-01-10", [10])).rows[0].id;
ok(!!h2 && (await q("select count(*)::int n from holds where id=$1", [h1])).rows[0].n === 0, "expired hold is cleared and the hour can be taken");

// cart → order
await hold("s2", "t1", "2030-01-11", [17]);
const order = (await q("select submit_cart('s2','B','b@x.com','0917',false) id")).rows[0].id;
const bk = (await q("select ref, status, court_id from bookings where order_id=$1 order by date", [order])).rows;
ok(bk.length === 2 && bk.every((b) => b.status === "pending") && bk[0].ref.startsWith("SC-104"), `submit_cart makes one order of pending bookings (${bk.map((b) => b.ref).join(", ")})`);
ok((await q("select count(*)::int n from holds where session_id='s2'")).rows[0].n === 0, "cart emptied");
ok((await q("select count(*)::int n from slot_locks l join bookings b on b.id=l.booking_id where b.order_id=$1", [order])).rows[0].n === 2, "locks moved from holds to bookings");
ok(await fails("select submit_cart('s2','B','b@x.com','0917',false)", [], "cart_empty"), "empty cart refused");

// rejecting releases hours (trigger)
await q("update bookings set status='rejected' where order_id=$1", [order]);
ok((await q("select count(*)::int n from slot_locks l join bookings b on b.id=l.booking_id where b.order_id=$1", [order])).rows[0].n === 0, "rejected booking releases its locks");
ok(!!(await hold("s3", "p1", "2030-01-10", [10])).rows[0].id, "released hour can be booked again");

// waitlist claim hands its lock to the hold
const w = (await q("insert into waitlist (court_id,date,hour,name,email,phone,players,status) values ('t1','2030-01-12',8,'W','w@x.com','0917',2,'notified') returning id")).rows[0].id;
await q("insert into slot_locks (court_id,date,hour,waitlist_id) values ('t1','2030-01-12',8,$1)", [w]);
ok(await fails("select create_hold('s4','t1','2030-01-12','{8}',2,'{}'::jsonb,1200,0,1200,'X','x@x.com','0917',$1,null)", [exp], "slot_taken"), "a reserved waitlist hour blocks others");
ok(!!(await hold("s5", "t1", "2030-01-12", [8], w)).rows[0].id, "the claimant can take it (lock handed over)");

// move_booking
await hold("s6", "p2", "2030-01-13", [7, 8]);
const o2 = (await q("select submit_cart('s6','C','c@x.com','0917',false) id")).rows[0].id;
const b2 = (await q("select id from bookings where order_id=$1", [o2])).rows[0].id;
await q("select move_booking($1,'p2','2030-01-13','{12,13}')", [b2]);
const locks = (await q("select hour from slot_locks where booking_id=$1 order by hour", [b2])).rows.map((r) => r.hour);
ok(JSON.stringify(locks) === "[12,13]", "move_booking swaps the locks to the new hours");
ok(await fails("select move_booking($1,'p1','2030-01-10','{10}')", [b2], "slot_taken"), "move onto a taken hour is refused");
ok(JSON.stringify((await q("select hour from slot_locks where booking_id=$1 order by hour", [b2])).rows.map((r) => r.hour)) === "[12,13]", "failed move keeps the old hours");

// class capacity + duplicates + rentals
const k = (await q("insert into classes (title,court_id,date,start_hour,end_hour,deadline,capacity,fee,rental_fee,rental_qty,created_by) values ('Clinic','p1','2030-02-01',9,11,now()+interval '10 days',2,500,100,1,'A') returning id")).rows[0].id;
const reg = (name, email, rent) => q("select register_class($1,$2,'n',20,$3,'0917',$4) id", [k, name, email, rent]);
const r1 = (await reg("Ana Cruz", "a@x.com", true)).rows[0].id;
ok((await q("select total from class_registrations where id=$1", [r1])).rows[0].total === 600, "registration total = fee + rental (₱600)");
ok(await fails("select register_class($1,'Ana Cruz','n',20,'A@X.com','0917',false)", [k], "already_registered"), "same name + email can't register twice");
ok(await fails("select register_class($1,'Ben','n',20,'b@x.com','0917',true)", [k], "rental_gone"), "no rentals left → refused");
await reg("Ben", "b@x.com", false);
ok(await fails("select register_class($1,'Cy','n',20,'c@x.com','0917',false)", [k], "class_full"), "full class refuses a third participant");
await q("update class_registrations set status='unpaid' where id=$1", [r1]);
ok(!!(await reg("Cy", "c@x.com", true)).rows[0].id, "an unpaid registration frees its slot and rental");
await q("update classes set status='closed' where id=$1", [k]);
ok(await fails("select register_class($1,'Di','n',20,'d@x.com','0917',false)", [k], "class_closed"), "closed class refuses registrations");

// refs
ok((await q("select ref from class_registrations order by created_at limit 1")).rows[0].ref === "CL-2001", "class refs start at CL-2001");
