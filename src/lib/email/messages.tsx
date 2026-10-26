import "server-only";
import { sendMail, sendToAdmins } from "./send";
import type { MailRow } from "./Mail";
import { SITE } from "../config";
import { peso } from "../format";
import { fmtDateLong, fmtH, fmtRange, fmtTs } from "../time";
import type { PaymentMethod } from "../types";

/* Every email in spec §10, built from plain data so the flows stay readable. */

export type BookingView = { id: string; ref: string; court: string; date: string; hours: number[]; players: number; equipment: string; total: number };
export type RegView = { id: string; ref: string; title: string; court: string; date: string; start: number; end: number; name: string; nickname: string; age: number; rental: string; total: number };
type Person = { name: string; email: string; nickname?: string };

const first = (p: Person) => p.nickname || p.name.trim().split(/\s+/)[0];
const plural = (n: number, w: string) => (n > 1 ? `${w}s` : w);
const refsOf = (l: { ref: string }[]) => l.map((b) => b.ref).join(", ");
const sum = (l: { total: number }[]) => l.reduce((a, b) => a + b.total, 0);

const bookingRows = (b: BookingView): MailRow[] => [
  ["Reference", <b key="r">{b.ref}</b>], ["Court", b.court], ["Date", fmtDateLong(b.date)], ["Time", fmtRange(b.hours)],
  ["Players", String(b.players)], ["Equipment", b.equipment], ["Total", <b key="t">{peso(b.total)}</b>],
];
const regRows = (r: RegView): MailRow[] => [
  ["Reference", <b key="r">{r.ref}</b>], ["Class", r.title], ["Court", r.court], ["Date", fmtDateLong(r.date)],
  ["Time", `${fmtH(r.start)} – ${fmtH(r.end)}`], ["Participant", `${r.name} ("${r.nickname}"), age ${r.age}`], ["Rental", r.rental],
  ["Total", <b key="t">{peso(r.total)}</b>],
];
const tablesFor = (l: BookingView[]) => l.map((b) => ({ rows: bookingRows(b) }));
const methodsTable = (methods: PaymentMethod[]) => ({
  heading: "How to pay",
  rows: methods.length ? methods.map((m): MailRow => [m.name, m.details]) : [["", "Please contact us for the payment details."] as MailRow],
});

/* ---------- court bookings ---------- */
export async function mailRequestReceived(p: Person, l: BookingView[], free: boolean) {
  await sendMail({
    to: p.email, subject: `We received your booking request – ${refsOf(l)}`, key: `received:${l[0].id}`,
    mail: { audience: "customer", preview: "Your booking request is pending review.", title: "Booking request received", greeting: first(p),
      intro: <>thanks! Your booking request is <b>pending</b> while an admin reviews it. {free ? "Nothing to pay: we will email you once it is confirmed." : "Nothing to pay yet: once it is approved, we will email you the amount and payment details, and you will have 24 hours to pay."}</>,
      tables: tablesFor(l) },
  });
}
export async function mailAdminNewRequest(p: Person, l: BookingView[]) {
  await sendToAdmins(`New booking request: ${refsOf(l)}`, {
    preview: `${p.name} requested ${l.length} ${plural(l.length, "booking")}.`, title: "New booking request to review",
    intro: <>{p.name} requested {l.length > 1 ? `${l.length} bookings` : "a booking"}. Nothing has been paid yet: approve it to email them the payment details (they get 24 hours to pay), or reject it.</>,
    tables: tablesFor(l), button: { label: "Review in Admin Console", href: `${SITE.url}/admin/bookings/pending` },
  }, `admin-new:${l[0].id}`);
}
export async function mailPleasePay(kind: "court" | "class", p: Person, l: BookingView[] | RegView[], dueAt: string, methods: PaymentMethod[], link: string) {
  const total = sum(l), what = kind === "class" ? "class registration" : "booking request";
  await sendMail({
    to: p.email, subject: `Approved: please pay for ${refsOf(l)}`, key: `approved:${l[0].id}`,
    mail: { audience: "customer", preview: `Pay ${peso(total)} by ${fmtTs(dueAt)} to confirm.`, title: "Your request is approved", greeting: first(p),
      intro: <>good news! Your {what}{l.length > 1 ? "s are" : " is"} approved. To confirm {l.length > 1 ? "them" : "it"}, please pay <b>{peso(total)}</b> by <b>{fmtTs(dueAt)}</b> (within 24 hours).</>,
      tables: [...(kind === "class" ? (l as RegView[]).map((r) => ({ rows: regRows(r) })) : tablesFor(l as BookingView[])), methodsTable(methods)],
      extra: <>After paying, open the payment page and upload your receipt with its reference number. We will check it and email your confirmation.</>,
      button: { label: "Pay now & upload receipt", href: link },
      after: <>If we don&apos;t receive your payment by then, the request expires and the {kind === "class" ? "slot" : "time"} is released.</> },
  });
}
export async function mailPaymentReceived(kind: "court" | "class", p: Person, l: BookingView[] | RegView[]) {
  await sendMail({
    to: p.email, subject: `Payment received: ${refsOf(l)}`, key: `paid:${l[0].id}`,
    mail: { audience: "customer", preview: "We're checking your payment.", title: "Payment received", greeting: first(p),
      intro: <>thanks! We received your payment details. An admin is checking your payment now, and we will email you once your {kind === "class" ? "slot" : "booking"} is confirmed.</>,
      tables: kind === "class" ? (l as RegView[]).map((r) => ({ rows: regRows(r) })) : tablesFor(l as BookingView[]) },
  });
}
export async function mailAdminVerify(kind: "court" | "class", p: Person, l: BookingView[] | RegView[], method: string, payRef: string) {
  await sendToAdmins(`Payment to verify: ${refsOf(l)} · ${p.name}`, {
    preview: `${p.name} paid ${peso(sum(l))}.`, title: "Payment to verify",
    intro: <>{p.name} paid <b>{peso(sum(l))}</b> for an approved {kind === "class" ? "class registration" : "booking request"} and uploaded proof of payment. Payment: {method} · Ref {payRef}.</>,
    tables: kind === "class" ? (l as RegView[]).map((r) => ({ rows: regRows(r) })) : tablesFor(l as BookingView[]),
    button: { label: "Verify in Admin Console", href: `${SITE.url}/admin/${kind === "class" ? "classes/verify" : "bookings/verify"}` },
  }, `admin-paid:${l[0].id}`);
}
export async function mailConfirmed(p: Person, l: BookingView[], paid: boolean) {
  await sendMail({
    to: p.email, subject: `Booking${l.length > 1 ? "s" : ""} confirmed – ${refsOf(l)}`, key: `confirmed:${l[0].id}`,
    mail: { audience: "customer", preview: "See you on court!", title: "You are booked!", greeting: first(p),
      intro: <>{paid ? "your payment was verified and your booking" : "your booking"}{l.length > 1 ? "s are" : " is"} confirmed. Please arrive 10 minutes early.</>,
      tables: [...tablesFor(l), { rows: [["Venue", SITE.address], ["Hours", SITE.hours]] }] },
  });
}
export async function mailRejected(p: Person, l: BookingView[], reason: string, paid: boolean) {
  await sendMail({
    to: p.email, subject: `Booking${l.length > 1 ? "s" : ""} not approved – ${refsOf(l)}`,
    mail: { audience: "customer", preview: "Your booking was not approved.", title: "Booking not approved", greeting: first(p),
      intro: paid ? <>we could not verify your payment, so your booking{l.length > 1 ? "s" : ""} could not be confirmed.</> : <>we could not approve your booking request{l.length > 1 ? "s" : ""}.</>,
      tables: tablesFor(l),
      extra: <>{reason ? <p><b>Reason:</b> {reason}</p> : null}<p>{paid ? "Your payment will be refunded in full within 3–5 business days to your original payment method." : "No payment was taken."}</p></> },
  });
}
export async function mailExpired(p: Person, l: BookingView[]) {
  await sendMail({
    to: p.email, subject: `Booking request expired: ${refsOf(l)}`, key: `expired:${l[0].id}`,
    mail: { audience: "customer", preview: "We didn't receive payment in time.", title: "Your request expired", greeting: first(p),
      intro: <>we did not receive your payment within 24 hours, so your booking request has expired and the time was released.</>,
      tables: tablesFor(l), button: { label: "Book again", href: `${SITE.url}/book` } },
  });
}
export async function mailCancelled(p: Person, b: BookingView, reason: string, refundPct: number) {
  await sendMail({
    to: p.email, subject: `Booking cancelled – ${b.ref}`,
    mail: { audience: "customer", preview: "Your booking has been cancelled.", title: "Booking cancelled", greeting: first(p),
      intro: <>your booking has been cancelled.</>, tables: tablesFor([b]),
      extra: <><p><b>Reason:</b> {reason}</p><p><b>Refund:</b> {refundPct}% ({peso(Math.round((b.total * refundPct) / 100))}), sent to your original payment method within 3–5 business days.</p></> },
  });
}
export async function mailReminder(p: Person, b: BookingView, key: string) {
  await sendMail({
    to: p.email, subject: `Reminder: you're booked ${fmtDateLong(b.date)} – ${b.ref}`, key,
    mail: { audience: "customer", preview: `${b.court}, ${fmtRange(b.hours)}. See you on court!`, title: "See you on court soon", greeting: first(p),
      intro: <>a reminder that your booking starts within the next 24 hours. Please arrive 10 minutes early.</>,
      tables: [...tablesFor([b]), { rows: [["Venue", SITE.address], ["Hours", SITE.hours]] }] },
  });
}
export async function mailEdited(p: Person, b: BookingView, old: { court: string; date: string; hours: number[]; total: number }) {
  const diff = b.total - old.total;
  await sendMail({
    to: p.email, subject: `Booking updated – ${b.ref}`,
    mail: { audience: "customer", preview: "An admin updated your booking.", title: "Your booking was updated", greeting: first(p),
      intro: <>an admin updated your booking. Here are the new details.</>,
      tables: [{ rows: bookingRows(b) }, { heading: "Previous booking", rows: [["Court", old.court], ["Date", fmtDateLong(old.date)], ["Time", fmtRange(old.hours)], ["Total", peso(old.total)]] }],
      extra: diff ? <p><b>Price difference:</b> {diff > 0 ? `balance due ${peso(diff)}` : `refund of ${peso(-diff)}`}</p> : undefined },
  });
}
export async function mailClosureCancelled(p: Person, b: BookingView, label: string, paid: boolean) {
  await sendMail({
    to: p.email, subject: `Booking cancelled: court closed – ${b.ref}`,
    mail: { audience: "customer", preview: "Your court is closed at your booking time.", title: "Your court is closed", greeting: first(p),
      intro: <>we are sorry, {b.court} is closed at your booking time ({label}), so your booking has been cancelled.</>, tables: tablesFor([b]),
      extra: <p>{paid ? <><b>Refund:</b> 100% ({peso(b.total)}), sent to your original payment method within 3–5 business days.</> : "No payment was taken."}</p>,
      button: { label: "Book another time", href: `${SITE.url}/book` } },
  });
}

/* ---------- waitlist ---------- */
type Slot = { court: string; date: string; hour: number };
const slotRows = (s: Slot): MailRow[] => [["Court", s.court], ["Date", fmtDateLong(s.date)], ["Time", fmtRange([s.hour])]];
export async function mailWaitlistApplied(p: Person, s: Slot) {
  await sendMail({
    to: p.email, subject: `Waitlist application received – ${s.court}`,
    mail: { audience: "customer", preview: "An admin is reviewing your waitlist application.", title: "Waitlist application received", greeting: first(p),
      intro: <>thanks! Your waitlist application is <b>pending</b> while an admin reviews it. We will email you once you are in line.</>,
      tables: [{ rows: slotRows(s) }] },
  });
}
export async function mailAdminWaitlistApplied(p: Person & { phone: string }, s: Slot, id: string) {
  await sendToAdmins(`New waitlist application: ${s.court}, ${fmtRange([s.hour])} · ${p.name}`, {
    preview: `${p.name} applied for the waitlist.`, title: "New waitlist application to review",
    intro: <>{p.name} wants to join the waitlist for this slot. Approve to put them in line, or decline.</>,
    tables: [{ rows: [...slotRows(s), ["Customer", `${p.name} · ${p.email} · ${p.phone}`]] }],
    button: { label: "Review in Admin Console", href: `${SITE.url}/admin/waitlist` },
  }, `admin-wl:${id}`);
}
export async function mailWaitlistApproved(p: Person, s: Slot, position: number, key: string) {
  await sendMail({
    to: p.email, subject: `You're on the waitlist (#${position}) – ${s.court}`, key,
    mail: { audience: "customer", preview: `You are #${position} in line.`, title: `You are #${position} in line`, greeting: first(p),
      intro: <>your waitlist application was approved. We will email you if this slot frees up. The link in that email holds the slot for 2 hours.</>,
      tables: [{ rows: [...slotRows(s), ["Position", <b key="p">#{position}</b>]] }] },
  });
}
export async function mailWaitlistDeclined(p: Person, s: Slot, key: string) {
  await sendMail({
    to: p.email, subject: `Waitlist update: ${s.court}, ${fmtRange([s.hour])}`, key,
    mail: { audience: "customer", preview: "Your waitlist application was not approved.", title: "Waitlist application not approved", greeting: first(p),
      intro: <>your application to join the waitlist for this slot was not approved.</>,
      tables: [{ rows: slotRows(s) }], button: { label: "Find another time", href: `${SITE.url}/book` } },
  });
}
export async function mailSlotAvailable(p: Person, s: Slot, link: string, expiresAt: string, key: string) {
  await sendMail({
    to: p.email, subject: `A slot opened up: ${s.court}, ${fmtRange([s.hour])}`, key,
    mail: { audience: "customer", preview: "Your waitlisted slot is free for the next 2 hours.", title: "Your waitlisted slot is free", greeting: first(p),
      intro: <>the slot you waited for is available. It is held for you for <b>2 hours</b>, until {fmtTs(expiresAt)}.</>,
      tables: [{ rows: slotRows(s) }], button: { label: "Claim this slot", href: link },
      after: <>If you do not claim it in time, it goes to the next person in line.</> },
  });
}
export async function mailWaitlistClosed(p: Person, s: Slot, label: string) {
  await sendMail({
    to: p.email, subject: `Waitlist update: ${s.court}, ${fmtRange([s.hour])}`,
    mail: { audience: "customer", preview: "This time is no longer available.", title: "This time is no longer available", greeting: first(p),
      intro: <>{s.court} is closed at this time ({label}), so you have been removed from the waitlist.</>,
      tables: [{ rows: slotRows(s) }], button: { label: "Find another time", href: `${SITE.url}/book` } },
  });
}

/* ---------- classes ---------- */
export async function mailClassReceived(p: Person, r: RegView) {
  await sendMail({
    to: p.email, subject: `We received your class registration – ${r.ref}`, key: `received:${r.id}`,
    mail: { audience: "customer", preview: "Your registration is pending review.", title: "Registration received", greeting: first(p),
      intro: <>thanks! Your registration is <b>pending</b> while an admin reviews it. Nothing to pay yet: once it is approved, we will email you the payment details, and you will have 24 hours to pay.</>,
      tables: [{ rows: regRows(r) }] },
  });
}
export async function mailAdminNewClass(r: RegView) {
  await sendToAdmins(`New class registration request: ${r.ref} · ${r.title}`, {
    preview: `${r.name} registered for ${r.title}.`, title: "New class registration to review",
    intro: <>{r.name} registered for <b>{r.title}</b>. Approve it to email them the payment details (24 hours to pay).</>,
    tables: [{ rows: regRows(r) }], button: { label: "Review in Admin Console", href: `${SITE.url}/admin/classes/pending` },
  }, `admin-new:${r.id}`);
}
export async function mailClassConfirmed(p: Person, r: RegView, paid: boolean) {
  await sendMail({
    to: p.email, subject: `Class registration confirmed – ${r.ref}`, key: `confirmed:${r.id}`,
    mail: { audience: "customer", preview: "You're in!", title: "You're in!", greeting: first(p),
      intro: <>{paid ? "your payment was verified and " : ""}your slot in <b>{r.title}</b> is confirmed. Please arrive 10 minutes early.</>,
      tables: [{ rows: regRows(r) }] },
  });
}
export async function mailClassRejected(p: Person, r: RegView, reason: string, paid: boolean) {
  await sendMail({
    to: p.email, subject: `Class registration not approved – ${r.ref}`,
    mail: { audience: "customer", preview: "Your registration was not approved.", title: "Registration not approved", greeting: first(p),
      intro: <>we could not approve your registration for <b>{r.title}</b>.</>, tables: [{ rows: regRows(r) }],
      extra: <>{reason ? <p><b>Reason:</b> {reason}</p> : null}<p>{paid ? "Your payment will be refunded in full within 3–5 business days to your original payment method." : "No payment was taken."}</p></> },
  });
}
export async function mailClassReminder(p: Person, r: RegView, key: string) {
  await sendMail({
    to: p.email, subject: `Reminder: ${r.title} on ${fmtDateLong(r.date)} – ${r.ref}`, key,
    mail: { audience: "customer", preview: `${r.court}, ${fmtH(r.start)} – ${fmtH(r.end)}. See you there!`, title: "See you in class soon", greeting: first(p),
      intro: <>a reminder that <b>{r.title}</b> starts within the next 24 hours. Please arrive 10 minutes early.</>,
      tables: [{ rows: regRows(r) }, { rows: [["Venue", SITE.address], ["Hours", SITE.hours]] }] },
  });
}
export async function mailClassExpired(p: Person, r: RegView) {
  await sendMail({
    to: p.email, subject: `Class registration expired: ${r.ref}`, key: `expired:${r.id}`,
    mail: { audience: "customer", preview: "We didn't receive payment in time.", title: "Your registration expired", greeting: first(p),
      intro: <>we did not receive your payment within 24 hours, so your registration has expired and the slot was released.</>,
      tables: [{ rows: regRows(r) }], button: { label: "Register again", href: `${SITE.url}/book?mode=class` } },
  });
}
export async function mailClassCancelled(p: Person, r: RegView, paid: boolean) {
  await sendMail({
    to: p.email, subject: `Class cancelled – ${r.ref}`,
    mail: { audience: "customer", preview: `${r.title} has been cancelled.`, title: "Class cancelled", greeting: first(p),
      intro: <>we are sorry, <b>{r.title}</b> has been cancelled.</>, tables: [{ rows: regRows(r) }],
      extra: <p>{paid ? <><b>Refund:</b> 100% ({peso(r.total)}), sent to your original payment method within 3–5 business days.</> : "No payment was taken."}</p> },
  });
}

/* ---------- contact form ---------- */
export async function mailContact(to: string, m: { name: string; email: string; subject: string; message: string }) {
  await sendMail({
    to, replyTo: m.email, subject: `Website message: ${m.subject} · ${m.name}`,
    mail: { audience: "admin", preview: m.message.slice(0, 90), title: "New message from the website",
      intro: <>Reply directly to {m.email}.</>,
      tables: [{ rows: [["Name", m.name], ["Email", m.email], ["Subject", m.subject], ["Message", m.message]] }] },
  });
}
