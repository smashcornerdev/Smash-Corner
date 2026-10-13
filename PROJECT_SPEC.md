# SmashCorner — Website & Booking System Spec

> Status: **Draft v4.13** · Last updated: 2026-10-13
> Purpose: Agree on scope, page structure, and booking/admin flows before any code is written.

---

## 1. Scope Summary

| Item | Deliverable |
|---|---|
| Pages | 10 public pages (dummy content, Lorem Ipsum) incl. **Book**, **Gallery**, **About Us** |
| Sections | 20 sections spread across the site (dummy content) |
| Animations | **Paused for now: splash screen only** (scroll-reveal, hover motion, page and booking-step transitions on hold; see §4) |
| SEO | Meta tags, Open Graph, sitemap, robots.txt, structured data, performance basics |
| Booking | Customer booking flow with cart, payment proof upload, admin approval |
| Admin Console | Login, Pending / Approved / Rejected / Cancelled / Waitlist views |
| Email | Notifications to admins and customers on every booking state change |
| Revisions | 2 revision rounds |

**Content rule:** all copy is Lorem Ipsum placeholder; all images are placeholders until real assets are supplied.

---

## 2. Sitemap (10 Pages)

| # | Page | Route | Notes |
|---|---|---|---|
| 1 | Home (Landing) | `/` | Main entry; primary CTA → Book |
| 2 | About Us | `/about` | **Required** |
| 3 | Courts | `/courts` | Tennis Court 1, Pickleball Courts 1 & 2 |
| 4 | Book | `/book` | **Required**. Multi-step court booking flow, plus a **Class / event** tab for class registration (see §6) |
| 5 | Gallery | `/gallery` | **Required**. One page with 4 photo sections, each exactly one screen tall; sticky tabs jump to a section; lightbox on click |
| 6 | Pricing / Rates | `/pricing` | Court rates + equipment rental rates |
| 7 | Programs & Coaching | `/programs` | Dummy |
| 8 | Events | `/events` | Dummy |
| 9 | FAQ | `/faq` | Accordion |
| 10 | Contact | `/contact` | Form + map embed |

**Utility pages (not counted in the 10):** Cart, Checkout, Booking Confirmation, Privacy Policy, Terms, 404, Admin Login, Admin Console.

---

## 3. Section Allocation (20 Sections)

| Page | Sections | Count |
|---|---|---|
| Home | Hero (text + CTA: Book Now; no photo/illustration, removed v4.6) · Courts Preview · Why Choose Us · Gallery Teaser · Testimonials · Final CTA Banner | 6 |
| About Us | Our Story · Meet the Team · Mission & Values | 3 |
| Courts | Court Cards (specs/photos) · Facilities & Amenities | 2 |
| Pricing | Rates Table (court rates + equipment rental) | 1 |
| Gallery | Pickleball Courts · Tennis Courts · Bathroom · Amenities | 4 |
| Programs | Programs & Coaches | 1 |
| Events | Upcoming Events List | 1 |
| FAQ | FAQ Accordion | 1 |
| Contact | Contact Form with Map & Hours | 1 |
| **Total** | | **20** |

Global (not counted): Header/Nav, Footer, Cookie banner.

**Gallery page:** all 4 sections (Pickleball Courts, Tennis Courts, Bathroom, Amenities) are on **one page**, one after another. A **sticky tab bar** under the site header jumps to each section. On phones it becomes a **☰ dropdown** showing the current section. **Each section is exactly one screen tall** (the space below the header and tab bar). After a tab jump, the section's heading and all 6 photos are visible without scrolling. Section headings show the name only (no "1 of 4" counter). On desktop the photos are one large plus 5 smaller in a 3-column grid; on phones, a 2-column grid. Scrolling the page normally also works, and the tab for the section on screen stays highlighted. Clicking a photo opens a lightbox (full-size view with next/previous). The Home page gallery teaser opens the Gallery and jumps to the matching section.

> Note: Gallery grew from 1 to 4 sections. To keep the total at 20, Pricing, Programs and Contact were each merged into a single section.

---

## 4. Animations

> **Paused for now (v4.7): the splash screen is the only animation on the site.** Everything else below is on hold: no scroll-reveal, entrance, hover motion, page/step transitions, pop-ins or smooth scrolling. Hover states still change color/outline, just without movement. In the mockup this is one CSS block marked "Animations paused for now" (delete it to bring them back); in the build, leave these out until they're switched back on.

- *(paused)* Scroll-reveal (fade/slide-up) on section entry
- *(paused)* Hero entrance animation
- Landing page highlight band (Tennis · Pickleball · Open 7 AM daily …) under the hero is **static**: no scrolling/carousel effect
- *(paused)* Hover effects on cards, buttons, gallery images (lift/zoom)
- *(paused)* Smooth page transitions and smooth scrolling
- *(paused)* Booking stepper: animated step transitions + progress bar
- *(paused)* Cart badge bump when an item is added
- **Splash screen (restored v4.2, new version from the designer).** It plays when the site first opens. The logo fades in with an empty socket. The ball lobs in from the left, bounces off the bottom of the frame, then flies up into its socket while the black swoosh paints in behind it as its trail. It settles with a small spring, holds for about 0.45 s, then fades out. The whole thing takes about 2.8 s.
  - **Plays on every page load and refresh** (changed v4.4; was once per browser session). It doesn't replay when moving between pages inside the site, since that doesn't reload the page.
  - **Skippable:** a click or tap, Esc, Enter or Space jumps straight to the fade-out (added in the mockup; add the same to the component when building). While it plays, the page behind can't be scrolled or clicked.
  - **Reduced motion:** visitors who prefer reduced motion see only the finished logo, which then fades out.
  - Hidden for visitors without JavaScript, so it never blocks the page.
  - Background `#141118` (near-black with a hint of purple); logo width `min(96px, 19.2vw)` (made 70% smaller in v4.3; was `min(320px, 64vw)`). Uses the exact logo colors (`#BB9AD0`, `#050505`, `#E0DE29`).
  - **Build:** `SplashScreen.tsx` in the project folder is the drop-in component for the Next.js site, with no dependencies and no CSS file. Mount it in `app/layout.tsx` as `<SplashScreen />` before `{children}` (without `oncePerSession`, so it plays on every load/refresh). The mockup runs a plain-JavaScript copy of the same animation (same paths and timing).
- Respect `prefers-reduced-motion` (animations disabled/reduced).

---

## 5. SEO

- Unique `<title>` and meta description per page
- Open Graph + Twitter card tags (shareable previews)
- `sitemap.xml` and `robots.txt` (admin + cart routes excluded / `noindex`)
- Structured data (JSON-LD): `SportsActivityLocation` / `LocalBusiness`, `FAQPage`
- Semantic HTML, one `<h1>` per page, alt text on all images
- Canonical URLs
- Performance: optimized/lazy-loaded images, good Core Web Vitals
- Mobile-first responsive layout

---

## 6. Customer Booking Flow

```
Landing Page
  → Book
  → Step 1: Select Court
  → Step 2: Select Date (month calendar, up to 1 month ahead)
  → Step 3: Select Time (start/end time slots)
  → Step 4: Customer Details & Equipment
  → Add to Cart
  → Pay (upload proof of payment)
  → Submit
  → Admins notified by email
  → Admin approves/rejects after checking proof of payment
  → Customer notified by email
```

> Step order follows the §11 recommendation (court first), as built in the mockup. A progress bar at the top shows the 4 steps; customers can jump back to any completed step. A booking summary with the running price stays beside the steps.

### Step 1 — Select Court
- Tennis Court 1
- Pickleball Court 1
- Pickleball Court 2

### Step 2 — Select Date
- Month calendar view (Mon–Sun), with previous/next month arrows
- **Bookable up to 1 month in advance** (e.g. on 10/10/2026, up to 11/10/2026). Dates before today or beyond 1 month are greyed out.
- Each date shows how many hours are still open; today is outlined
- Fully booked dates show **"Full"** and can still be opened to **Join Waitlist** (see §9)
- Days an admin has fully closed (see §7 Closures) show **"Closed"** and are greyed out

### Step 3 — Select Time
Section title: **"Choose time slot"**. Customers pick straight from the grid of hours (no dropdowns):
1. **Click a start time.** Open hours show "Start here"; a hint above the grid says "Click your start time".
2. **The start time is highlighted and the grid stays put** (changed v4.12). Every chip keeps its own time and position; nothing is relabelled. The start chip shows "Your start", hours before it are dimmed, and the hours after it become end-time choices showing the duration (e.g. after picking 8:00 AM: 9:00 AM · End here · 1 hr, 10:00 AM · End here · 2 hrs). End choices only go up to the next booked hour, so a time slot is always one unbroken block; that booked hour itself (or **10:00 PM closing**, added as the last chip) can be the end time. Hovering an end time highlights the range. A **Change start time** link resets the start.
3. **Click the time you finish at** (e.g. 9:00 AM for 8–9 AM) and the time slot is added (e.g. Time slot 1 · 7:00 AM – 10:00 AM · 3 hrs) with a Remove link.
4. To book more time on the same court and date, click **+ Add time slot**, then click a start time and an end time again (e.g. 1:00 PM – 4:00 PM). **Cancel** stops adding.
- Booked hours stay in the grid with a **Join waitlist** link; hours in the cart and hours that have passed are shown but can't be picked
- Hours closed by an admin (see §7 Closures) show as **"Closed"** and cannot be picked or waitlisted
- **Continue** is enabled once at least one time slot is added and no end time is still pending
- Slots that are Pending or Approved are unavailable

### Step 4 — Customer Details & Equipment
| Field | Type | Validation |
|---|---|---|
| Name | Text | Required |
| Number | Phone | Required, valid PH mobile format |
| Email | Email | Required, valid format |
| Number of Players | Number | Required, Tennis 1–4, Pickleball 2–4 |
| Rent Equipment? | Yes / No | Required |
| ↳ Equipment for the chosen court | Quantity (+/−) | Shown only if **Yes**. Tennis: rackets, balls. Pickleball: paddles, balls. Each item shows how many are free for the chosen hours. |

### Cart
- Customer can add multiple bookings (different courts/dates/times) before paying
- Selected slots are **held for 15 minutes** while in the cart to prevent double-booking; hold expires automatically
- Cart shows line items: court, date, time, players, equipment, subtotal, total

### Pay
- Customer picks a payment method (BDO, BPI, GCash, Maya; see §16) and sees its account details + QR code
- Customer uploads **proof of payment** (image/PDF) and enters the payment reference number
- Customer must tick "I agree to the Booking Policy" (§17) before submitting
- On submit: booking status → **Pending**; slot stays blocked until admin decides
- Confirmation page shows a booking reference number and a **Back to home** button (v4.13)

### Customer Accounts
- **Customers cannot sign in or create accounts.** Booking is guest-only (name, number, email).
- Customers **cannot cancel or reschedule** online. Emails and the confirmation page say: "To cancel or reschedule, contact us" with a link to the Contact page. An admin then makes the change in the Admin Console.

### Class / Event Registration
The Book page has two tabs at the top: **Court booking** (the flow above) and **Class / event**. The Class / event tab shows how many classes are open. Both tabs share the same page heading ("Book a court or class"), so the switch stays in the same place when moving between them.

- **Closed by default.** Classes appear only after an admin opens registration for them (see §7, "Classes & Events"). When none are open, the tab shows **"Class registration is closed"**, with buttons to book a court instead or see Programs.
- **Choosing a class:** open classes are listed as cards showing title, court, date and time, registration deadline, fee, and slots left. Full classes are shown but cannot be picked. If only one class is open, it is selected automatically.
- **Registration form (one participant per registration):**
  - Full name
  - Nickname
  - Age
  - Email
  - Contact number
  - **Rent a paddle or a tennis racket?** (Yes / No). The item depends on the class court: pickleball courts rent a **paddle**, the tennis court rents a **racket**. The question only appears if the admin offered rentals for that class, and Yes is disabled when none are left.
  - Payment method (the same admin-managed list as the Pay page, §16, with details, QR and "Copy details")
  - Payment reference number
  - Upload proof of payment (JPG, PNG or PDF, max 5 MB)
  - Agree to the Booking & Refund Policy
- **No cart and no 15-minute hold.** Classes are paid and submitted in one step. A summary beside the form shows class fee + rental = total.
- **On submit:** registration status is **Pending** and gets a reference like **CL-2001**. The participant gets a "received" email, and all 5 admins get a "new class registration" email. An admin then approves or rejects it (see §7).
- **Checks:** every field is required. Age must be a whole number from 1 to 100. Registration is refused if the deadline has passed or the class filled up while the form was open. The same name + email can't register twice for the same class.
- Pending and approved registrations both count toward capacity and rentals. A rejected or cancelled registration frees its slot (and its rental).

---

## 7. Admin Console

Route: `/admin` (hidden from navigation, `noindex`, excluded from sitemap).

### Access
- **Only admins can sign in.** There is no public sign-up page and no customer login.
- **5 admin accounts**, created at setup (seeded). All 5 have the same permissions.
- Login: email + password. Password reset by email. Sessions expire after inactivity (e.g. 8 hours).
- Login is rate-limited (lock for 15 minutes after 5 failed attempts).
- **All 5 admins receive every admin notification email.**
- **Activity log:** every approve, reject, cancel and edit records which admin did it and when.

### Admin Flows

All flows start: **Log-in → Admin Console**

| Action | Path | Result | Customer Email |
|---|---|---|---|
| Approve | Pending → Approve | Status → Approved; slot confirmed | ✅ Booking approved |
| Reject | Pending → Reject (reason **optional**) | Status → Rejected; slot released → waitlist triggered | ✅ Booking rejected + reason (if given) |
| Cancel | Approved → Cancel (reason required) | Status → Cancelled; slot released → waitlist triggered | ✅ Booking cancelled + reason + refund info |
| Edit / Reschedule | Approved → Edit → Finish | Changes saved (court/date/time/players/equipment); old slot released if changed → waitlist triggered | ✅ Booking updated (shows old vs new) |

Cancel and reschedule are **admin-only** (customers request them via Contact).

### Console Sections
The sidebar lists **sections only** and **always stays in view**: it doesn't scroll away with the page. Clicking a section opens it, with its first tab showing. Sections with several pages have a **mini nav bar (tabs) at the top of the screen** to move between them. Tab counts show how many items each one has, and the sidebar badge shows items waiting for review.

| Sidebar section | Tabs at the top of the screen (first one opens by default) |
|---|---|
| Dashboard | (none) |
| Reports | (none) |
| **Court Bookings** | **Pending** · Approved · Rejected · Cancelled · Waitlist |
| **Classes & Events** | **Registration Controls** · Pending · Approved · Rejected · Cancelled |
| **Management** | **Closures** · Payment Methods · Equipment Inventory |
| Calendar | (none) |
| **Admin** | **Activity Log** · Admin Accounts |

On phones (see §14 "Mobile navigation"), the sidebar becomes a **☰ menu button** in a sticky top bar. The button shows the current section and the number waiting for review, and opens a dropdown with the sections plus the signed-in admin, View site and Sign out. Each section's tabs also become a **☰ dropdown** that shows the current tab and its count.

| Section | What it does |
|---|---|
| **Dashboard** | Today's bookings, pending count, quick links |
| **Reports** | Analytics dashboard with 8 KPIs, charts and a per-court table (see §19) |
| **Pending** | New bookings awaiting review; view/download proof of payment |
| **Approved** | Upcoming confirmed bookings; cancel or edit/reschedule |
| **Rejected / Cancelled** | History |
| **Waitlist** | All waitlist entries and their status; manually notify or remove |
| **Calendar** | **FullCalendar** view of all 3 courts: Month, Week, Day and List views. **Day view has one column per court** (Tennis Court 1, Pickleball Court 1, Pickleball Court 2) side by side. Bookings are colour-coded by court, pending bookings outlined, filter by court. Click a booking to view, approve, edit or cancel it. Classes show as striped blocks with slots taken (e.g. 3/12); click one to see its registrations. |
| **Classes & events → Registration controls** | Open, close, reopen and cancel class registration, and see each class's registrations; see "Classes & Events" below |
| **Classes & events → Pending / Approved / Rejected / Cancelled** | Class registrations across all classes, by status (Pending oldest first). Each row shows the class, participant, contact, rental, payment and total. View shows full details and proof of payment. Pending rows can be approved or rejected right from the list |
| **Closures** | Close courts for dates or hours; see "Closures" below |
| **Payment Methods** | Add, edit, hide/show, drag to reorder, and delete the payment options customers see (name, details, QR image); see §16 |
| **Equipment Inventory** | Admin enters and updates stock for each item (Tennis Rackets, Pickleball Paddles, Tennis Balls, Pickleball Balls). The booking form only offers what is available for that hour. |
| **Activity Log** | Who did what, when |

Search & filter everywhere by name, email, reference number, court, date.

### Closures (closing dates / courts)
- **Closures** tab: admins close one or more courts for a whole day, a date range, or specific hours (e.g. Pickleball Court 2, 11/01/2026, 7 AM – 12 PM).
- Form fields: courts (checkboxes); **dates picked on a month calendar** (like the booking page): click one date to close that single day, or click a second, later date to close the whole range in between (clicking again starts over). Each day shows how many bookings it has for the chosen courts, and fully closed days show "Closed". Then **Hours**: Whole day (7 AM – 10 PM) or Specific hours (from/to time). Reason (Maintenance, Weather, Private event, Holiday, Other) and an optional note shown to customers.
- **Live preview before confirming:** how many court-hours close, which bookings will be cancelled (approved and pending, listed), and how many waitlist entries are removed.
- On confirm:
  - Closed hours show as **"Closed"** on the booking page (a fully closed day is greyed out in the date calendar) and cannot be booked or waitlisted.
  - Bookings already on those hours are **cancelled with a 100% refund** (per §17: "If Smash Corner cancels, you get a full refund") and each customer is emailed with a "Book another time" link.
  - Waitlist entries on those hours are removed and notified.
  - Logged in the Activity Log.
- The list shows upcoming and active closures (with a "closed now" tag) and a collapsible list of past closures. **Reopen** removes a closure; bookings it cancelled stay cancelled.
- Closed hours appear in the admin **Calendar** as red striped blocks (in their court column in Day view).
- Reports subtract closed hours from available court-hours.

### Export to Excel (customer records)
An **Export to Excel** button sits at the top right of the **Court Bookings** and **Classes & Events** sections. It opens an export window where the admin chooses exactly what to export:

- **Records:** Court bookings, or Classes & events (class registrations).
- **Status:** Pending, Approved, Rejected, Cancelled. Any mix; Approved, Rejected and Cancelled are on by default.
- **Courts** (court bookings only): any of the 3 courts.
- **Dates:** quick picks (This month, Last month, Last 30 days, Next 30 days, This year, All dates) or a custom **From / To** range. "Date means" switches between the **booking date** (the day they play; the class date for classes) and the **date submitted**.
- **Classes / events** (classes only): a checklist of the classes in the date range, with Select all / Clear, so the admin can export **one specific event, a few, or all**.
- **Live preview** before downloading: how many records match, their total, and the first 5 rows. The download button is disabled when nothing matches.

**The file** is a real Excel workbook (`.xlsx`), named after the filters (e.g. `smashcorner_court-bookings_2026-10-01_to_2026-10-31.xlsx`):
- **Sheet 1, one row per record.** Header filters are on. Dates are real Excel dates formatted mm/dd/yyyy, and money is formatted in ₱.
  - **Court bookings:** reference, status, customer, email, contact number, court, booking date, time, hours, players, equipment, court fee, equipment fee, total, payment method, payment reference, submitted, reason, refund %, refund amount, edited by admin.
  - **Classes & events:** reference, status, class/event, court, class date, time, full name, nickname, age, email, contact number, rental, class fee, rental fee, total, payment method, payment reference, submitted, reason, refund %, refund amount.
- **Summary sheet:** when and by which admin it was exported, the filters used, and the count, total and refunded amount for each status.
- Every export is recorded in the Activity Log (what was exported, filters and number of records).
- Build note: generate the file with SheetJS (`xlsx`) on the server, from a Next.js route that only signed-in admins can call. Customer personal data never goes to a public URL.

### Classes & Events (class registration)
- **Class registration is closed by default.** Nothing appears on the Book page until an admin opens registration.
- **Open registration** form:
  - Title
  - Court
  - Date (picked on a month calendar; each day shows bookings on the chosen court)
  - Start time and End time
  - Registration deadline (date + time)
  - Capacity (participants)
  - Fee per participant (₱)
  - Rentals: offer paddle (pickleball court) or racket (tennis court) rental, or no rentals. If offered: rental fee per item for the whole class, and how many to rent out (defaults to the item's rate and available stock).
- **Checks when opening:**
  - The class time can't have started yet.
  - The deadline must be in the future and before the class starts.
  - Capacity is at least 1, and the fee is 0 or more (0 = free class).
  - The court can't be closed at that time (§7 Closures) or already used by another class.
  - It can't already have court bookings at that time. The form lists their reference numbers so the admin can move them first.
- **The class court is blocked** for court bookings during the class. The booking page shows those hours as "Class".
- **Status:**
  - **Open**: on the Book page.
  - **Full**: on the Book page but can't be picked.
  - **Closed**: closed by the admin, or the deadline passed. Shown with the reason.
  - **Finished**: the class has started.
  - **Cancelled**

  Registration closes on its own at the deadline or when every slot is taken. It reopens on its own if a slot frees up before the deadline.
- **Actions per class:**
  - **Registrations (n)**: a list with participant, nickname, age, contact, rental, payment and status. Each row has View (full details + proof of payment), **Approve** and **Reject** (reason optional, full refund).
  - **Close registration**: removes the class from the Book page; the class still happens and the court stays blocked.
  - **Reopen registration**: only before the deadline.
  - **Cancel class**: every pending/approved registration is cancelled with a **100% refund**, and each participant is emailed. The court becomes bookable again.
- The tab badge counts registrations waiting for review. A banner says whether registration is open (and for how many classes) or closed.
- Upcoming classes are listed first. Past and cancelled classes are in a collapsible list.
- Every open, close, reopen, cancel, approve and reject is recorded in the Activity Log.

### Equipment Inventory Rules
- Admin sets the total quantity owned for each item (e.g. 10 rackets).
- Availability is counted **per hour**: quantity owned minus quantity in Pending/Approved bookings for that hour.
- If an item is out of stock for the chosen hour, it is greyed out ("Not available for this time").
- Admin can mark items as damaged/out of service to reduce stock.

---

## 8. Booking Status Lifecycle

```
            (cart hold, 15 min)
  In Cart ───────────────────────► Expired
     │
     │ submit + proof of payment
     ▼
  Pending ──── reject ───► Rejected ──► slot released → Waitlist
     │
     │ approve
     ▼
  Approved ── cancel ───► Cancelled ──► slot released → Waitlist
     │
     └── edit ──► Approved (updated)
```

**Class registrations** use the same statuses without the cart: Submitted → **Pending** → **Approved** or **Rejected** (full refund). Pending/Approved → **Cancelled** (100% refund) if the admin cancels the class.

---

## 9. Waitlist (Recommended Approach)

**Summary:** if a time slot is already taken, the customer can join a first-come, first-served waitlist for it. When that slot frees up (because a booking was rejected, cancelled or moved), the first person in line gets an email with a link that's valid for 2 hours. The link takes them straight into booking with the slot already picked and held for them. If they don't use it in time, the next person gets the email. If nobody takes it, the slot goes back on public sale. This runs on its own, so admins don't have to do anything.

**When:** a customer wants a date/time slot that is already Pending or Approved.

**Flow:**
1. On a full slot, customer clicks **Join Waitlist** and enters Name, Email, Number, Number of Players.
2. Customer receives a "You're on the waitlist (position #N)" email.
3. When the slot is released (Rejected, Cancelled, or Edited away), the system emails the **first person in line** a **claim link valid for 2 hours**.
4. Claim link drops them straight into the booking flow with the slot pre-filled and held → they pay and submit as normal (status → Pending).
5. If not claimed within 2 hours, the link expires and the **next person** is notified.
6. If nobody claims, the slot returns to normal public availability.

**Rules:**
- First-come, first-served (FIFO) per court + date + time slot
- One waitlist entry per email per slot
- Waitlist entries auto-expire once the slot's start time passes
- Admin can view, manually notify, or remove waitlist entries

**Why this approach:** fair, fully automatic (no admin work), and the time-limited claim prevents a slot sitting empty while waiting on an unresponsive customer.

---

## 10. Email Notifications

| Trigger | Recipient | Content |
|---|---|---|
| Booking submitted | All 5 admins | New pending booking + link to console |
| Booking submitted | Customer | "Received, awaiting approval" + reference # |
| Approved | Customer | Confirmation, details, venue info |
| Rejected | Customer | Reason (if the admin gave one) + full-refund note |
| Cancelled | Customer | Reason + refund note (per §17) |
| Edited | Customer | Old vs new details |
| Joined waitlist | Customer | Position in line |
| Slot available | Waitlisted customer | Claim link (2 hr expiry) |
| Reminder (optional) | Customer | 24 hrs before booking |
| Booking cancelled because a court was closed | Customer | Closure reason, 100% refund, "Book another time" button |
| Waitlisted slot closed | Waitlisted customer | Removed from the waitlist because the court is closed; "Find another time" button |
| Class registration submitted | All 5 admins | New pending class registration + participant details + link to console |
| Class registration submitted | Participant | "Received, awaiting approval" + CL reference # |
| Class registration approved | Participant | "You're in!" + class details |
| Class registration rejected | Participant | Reason (if given) + full-refund note |
| Class cancelled | Each registered participant | Class cancelled + 100% refund |

All emails are sent from **noreply@smashcorner-qc.com**. Every customer email includes "To cancel or reschedule, contact us" and the contact details.

---

## 11. Recommendations / Notes on Current Flow

1. **Order of steps (adopted, see §6):** **Court → Date → Time → Details & Equipment → Cart → Pay**. Choosing court first lets us filter equipment and validate player count.
2. **Player limits:** suggest Tennis 1–4, Pickleball 2–4 (to confirm).
3. **Equipment stock:** managed by admins in the Admin Console (see §7).
4. **Pending blocks the slot:** prevents two customers paying for the same slot.
5. **Reasons:** a reason is **optional when rejecting** and **required when cancelling**. When given, it is included in the customer email.

---

## 12. Decisions & Open Questions

### Decided
- [x] Opening hours: **7:00 AM**; slot length **1 hour** (see §15)
- [x] Rates: dummy court rates per hour + equipment rates per item (see §15)
- [x] Payment methods: BDO, BPI, GCash, Maya, with dummy details (see §16)
- [x] Policy: dummy booking & refund policy (see §17)
- [x] Cancel/reschedule: **admin only**
- [x] Admin accounts: **5**, all receive notification emails
- [x] Equipment inventory: entered and managed by admins in the Admin Console
- [x] Customer accounts: **none**, only admins can sign in
- [x] Waitlist claim window: **2 hours**
- [x] Domain: **smashcorner-qc.com**; email sender: **noreply@smashcorner-qc.com**
- [x] Stack: **Next.js** on **Hostinger**, **Supabase** database (see §18)
- [x] Class / event registration: **closed by default**, opened per class by an admin; registrations are paid up front with proof of payment and approved by an admin (see §6, §7)

### Still Open
- [ ] Closing time (dummy: 10:00 PM, last slot 9–10 PM)?
- [ ] Player limits per court (suggested: Tennis 1–4, Pickleball 2–4)?
- [ ] Real rates, real payment account details and final policy wording (replace the dummy values)
- [ ] The 5 admins' names and email addresses
- [ ] Hostinger plan: Node.js web-app hosting (recommended) or VPS (see §18)?
- [ ] Class rentals: in the mockup each class has its own rental count. Should class rentals also come out of the shared Equipment Inventory for those hours?
- [ ] Should class fees count in Reports (§19)? The mockup only reports court bookings.
- [ ] Should admins be able to edit a class after opening registration (e.g. change time or capacity)? The mockup supports close, reopen and cancel only.
- [ ] Is age only for information, or should classes have an age range (e.g. Junior Clinic 7–15) that the form enforces?

---

## 13. Revision Rounds

- **Round 1:** after first full build (design, pages, booking flow) is delivered
- **Round 2:** after Round 1 feedback is applied
- Changes outside agreed scope (new pages, new features) are handled separately

---

## 14. Design & Color Theme

### Brand Palette (matched to the logo)

| Swatch | Hex | Name | Role |
|---|---|---|---|
| ⬛ | `#000000` | Black | Main background (dark theme), outlines, text on lime/lavender |
| 🟨 | `#E1E12B` | Smash Lime | Primary brand color + call to action: **Book Now**, Add to Cart, Pay, headings, key prices |
| 🟪 | `#B894D8` | Corner Lavender | Secondary accent: badge outlines, secondary buttons, hover states, highlights, active tabs |

> Hex values were sampled from the logo image and are approximate. Get the exact values from the designer if possible.

**Supporting shades (to be finalized):**
- White `#FFFFFF` for body text on black
- Greys: `#111111` / `#1E1E1E` for cards and surfaces, `#A0A0A0` for muted text
- Lime hover/pressed: slightly darker lime, e.g. `#C9C921`
- Lavender hover/pressed: slightly darker lavender, e.g. `#A57FC9`

The previous palette (`#5800FF`, `#E900FF`, `#FFC600`) has been **dropped** in favour of the logo colors.

### Accessibility: Contrast Rules (WCAG AA)

| Combination | Ratio | Use |
|---|---|---|
| White on Black | 21:1 | ✅ All text |
| Lime `#E1E12B` on Black | ~15:1 | ✅ All text, headings |
| Black text on Lime | ~15:1 | ✅ Primary CTA buttons |
| Lavender `#B894D8` on Black | ~8.3:1 | ✅ All text, links |
| Black text on Lavender | ~8.3:1 | ✅ Secondary buttons, badges |
| White text on Lavender | ~2.5:1 | ❌ Never; use black text on lavender |
| Lime on Lavender (or reverse) | ~1.8:1 | ❌ Never for text; side-by-side blocks need a black outline between them (like the logo) |
| Lime on White | ~1.4:1 | ❌ Never |

**Rule of thumb:** text on lime or lavender is always **black**; text on black is white, lime or lavender.

### Usage Guidelines
- **Dark-first design:** black background with lime and lavender pops gives the same bold, sporty look as the logo.
- **Lime is the hero color:** big all-caps headings and every primary action button.
- **Lavender is the supporting color:** outlines, secondary buttons, tags, hover states. Use it less than lime.
- **Logo-inspired styling:** thick black outlines, lavender outer borders on featured cards (like the logo badge), and **one clipped corner** on cards and buttons.
- **Animations:** *(paused for now, see §4: hover keeps the lavender glow/outline but no motion)* lavender glow/outline on hover, lime CTA micro-bounce, ball-bounce loader on booking steps.

### Admin Console Status Colors
| Status | Color |
|---|---|
| Pending | Lime `#E1E12B` (black text) |
| Approved | Green (supporting color, e.g. `#22C55E`) |
| Rejected / Cancelled | Red (supporting color, e.g. `#EF4444`) |
| Waitlist | Lavender `#B894D8` (black text) |
| Edited | Grey outline badge with white text |

> Green and red aren't in the brand palette, but they're recommended for admin status badges so meaning is instantly clear.

### Logo Reference

The badge logo is used in the **splash screen** (§4), animated. The header and footer still use a text wordmark placeholder ("SMASH CORNER" in the heading font, lime on black).

**What the logo shows:**
- **Shape language:** a rounded badge with one cut corner (the "corner" in SmashCorner), thick black outline, lavender outer border, a bold check/swoosh and a ball.
- **Colors:** lime yellow, soft lavender and black, now the site palette above.

### Mobile navigation
**Rule: no navigation bar ever scrolls sideways on a phone.** Any nav that would not fit collapses into a **hamburger menu** instead: a full-width ☰ button showing the current page or tab (plus its count, if any) that opens a dropdown list. Tapping an item, tapping outside or pressing Escape closes it.

| Navigation | Desktop | Phone |
|---|---|---|
| Public site header | Links in the header | ☰ hamburger icon button (three lines, no "Menu" text; screen-reader label "Menu") below 1100 px. It turns into an ✕ while open, and the links drop down below the header |
| Admin sidebar (sections) | Left sidebar, always in view (stays put while the page scrolls) | ☰ button in a sticky top bar (below 860 px); dropdown also holds signed-in admin, View site, Sign out |
| Admin section tabs (e.g. Pending / Approved / …) | Tab bar | ☰ dropdown (below 700 px) |
| Gallery section tabs | Sticky tab bar | ☰ dropdown in the same sticky bar (below 700 px) |

Small sets of buttons that already fit, like the Book page's Court booking / Class switch, stay as they are.

### Typography

| Use | Font | Notes |
|---|---|---|
| Headings / display | **Monument Extended**: Ultrabold for H1/hero, Bold for H2–H3. ALL CAPS | Matches the extra-wide "SMASH CORNER" lettering |
| Body text, forms, UI | **Lexend Deca**: Regular (400) for body, Medium/SemiBold (500–600) for labels, buttons, nav, badges | Clean and very readable; used for everything that isn't a heading |

**Font loading:**
- **Lexend Deca:** free on Google Fonts.
- **Monument Extended:** by Pangram Pangram, **not on Google Fonts**. Self-host the font files (`.woff2`) with the site. Its free version is for personal use only, so a **commercial license is needed** for the live business site.
- Fallback stack for headings while it loads: `"Monument Extended", "Lexend Deca", sans-serif`.

**Usage notes:**
- Monument Extended is very wide. Keep headings short and reduce sizes on mobile so words don't overflow.
- Don't use Monument Extended for paragraphs, form fields or small text.

### Open Design Questions
- [ ] Brand colors: the logo SVG (smash-corner-logo.svg) uses lime `#E0DE29`, lavender `#BB9AD0`, black `#050505`. The site palette currently uses the sampled `#E1E12B` / `#B894D8`. Switch the site to the exact logo values?
- [ ] Monument Extended commercial license: purchased, or does the client already own one?
- [ ] FullCalendar Scheduler commercial license (needed for the per-court Day view): purchase, or build a custom per-court day grid instead?
- [ ] Dark-only site, or a light mode too?

---

## 15. Opening Hours & Rates (Dummy)

> All values below are **placeholders** for development. Replace them with real values before launch.

### Hours
- **Opens:** 7:00 AM daily
- **Closes:** 10:00 PM (dummy, to confirm)
- **Slot length:** 1 hour, so 15 slots per court per day (7–8 AM … 9–10 PM)
- Timezone: **Asia/Manila (PHT)**
- **Date format: mm/dd/yyyy everywhere** (booking pages, cart, emails, admin console, reports, calendar titles), e.g. 10/31/2026. Long form adds the weekday: Saturday, 10/31/2026. Timestamps: 10/31/2026 3:05 PM. Chart axis labels use mm/dd to save space.
- Native date pickers (the browser's built-in date fields in forms) display in the visitor's own browser/OS format. If they must also show mm/dd/yyyy for every visitor, replace them with a custom date picker in the build.

### Court Rates (per hour)
| Court | Rate |
|---|---|
| Tennis Court 1 | ₱500 / hour |
| Pickleball Court 1 | ₱350 / hour |
| Pickleball Court 2 | ₱350 / hour |

### Equipment Rental (per item, per hour)
| Item | Rate | Available for |
|---|---|---|
| Tennis Racket | ₱150 / item / hour | Tennis |
| Pickleball Paddle | ₱100 / item / hour | Pickleball |
| Tennis Balls (can of 3) | ₱80 / item / hour | Tennis |
| Pickleball Ball | ₱30 / item / hour | Pickleball |

**Price example:** Pickleball Court 1, 2 hours, 4 paddles, 2 balls
= (₱350 × 2) + (₱100 × 4 × 2) + (₱30 × 2 × 2) = ₱700 + ₱800 + ₱120 = **₱1,620**

---

## 16. Payment Methods (Dummy starting set, admin-editable)

> Account names and numbers below are **fake placeholders**.

| Method | Account Name | Account Number | Extra |
|---|---|---|---|
| BDO | Smash Corner QC (dummy) | 0000-0000-0000 | Bank transfer / InstaPay |
| BPI | Smash Corner QC (dummy) | 0000-0000-00 | Bank transfer / InstaPay |
| GCash | Smash Corner QC (dummy) | 0917-000-0000 | QR code (placeholder image) |
| Maya | Smash Corner QC (dummy) | 0918-000-0000 | QR code (placeholder image) |

**Managed by admins:** the methods above are only the starting set. In the Admin Console → **Payment Methods**, admins can:
- **Add** or **Edit** a method: **Name** (e.g. GCash), **Details** (free text shown to customers, e.g. account name, account number, instructions; line breaks kept) and an optional **QR code image** upload (PNG/JPG/WebP, max 5 MB; replace or remove anytime)
- **Show / Hide** a method on the Pay page without deleting it
- **Reorder** methods by **dragging** a payment method card up or down (on phones, drag the ⠿ handle; keyboard users focus the handle and press ↑ / ↓). Customers see them in this order. Each reorder is logged with the old and new order.
- **Delete** a method (customers stop seeing it; past bookings paid with it still show its name)
- Every change is recorded in the Activity Log

**Customer steps on the Pay page:**
1. Choose a method; its details and QR code (if uploaded) are shown, with a "Copy details" button.
2. Pay the exact total shown in the cart.
3. Upload a screenshot/photo of the receipt (JPG, PNG or PDF, max 5 MB) and enter the payment reference number.
4. Submit → status becomes **Pending** until an admin checks the payment.

---

## 17. Booking & Refund Policy (Dummy)

> Placeholder wording. Final policy to be supplied by the client. Shown on the Book/Pay page (must be accepted), in the FAQ, and linked from the footer.

**Bookings**
1. A booking is only confirmed once an admin approves it. You will receive a confirmation email.
2. Items in the cart are held for 15 minutes. Unpaid holds are released automatically.
3. Pay the exact amount shown and upload a clear proof of payment. Bookings with invalid or unclear proof may be rejected.
4. Admins review bookings within 24 hours (usually much sooner).

**Cancellations & Rescheduling**
5. Customers cannot cancel or reschedule online. Please contact us; an admin will make the change.
6. Rescheduling is free once per booking if requested **at least 24 hours** before the start time, subject to availability.
7. Refunds for cancellations requested by the customer:
   - **48 hours or more** before start: 100% refund
   - **24–48 hours** before start: 50% refund
   - **Less than 24 hours** or no-show: no refund
8. If Smash Corner cancels (maintenance, weather, emergencies), you get a full refund or a free reschedule.
9. Rejected bookings are refunded in full within 3–5 business days, to the original payment method.

**On the Court**
10. Please arrive 10 minutes early. Late arrival does not extend your booked time.
11. Proper court shoes are required (non-marking soles).
12. Rented equipment must be returned at the end of the booking; damaged or lost items will be charged.
13. Maximum players per court as stated on the booking form.

---

## 18. Tech Stack & Hosting

**Decided:** **Next.js** on **Hostinger**, **Supabase** for the database. Domain **smashcorner-qc.com**.

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js** (App Router) + **TypeScript** | Decided; SEO-friendly server rendering, pages + API in one project |
| Styling | **Tailwind CSS** | Fast to build the custom lime/lavender/black theme |
| Animations | **Framer Motion** | Scroll-reveal, page transitions, stepper animations; supports reduced motion. *Not needed while animations are paused (§4); the splash has no dependencies* |
| Database | **Supabase (PostgreSQL)**, accessed with `@supabase/supabase-js` / `@supabase/ssr` | Decided; bookings, slots, waitlist, inventory, admins, activity log |
| Admin auth | **Supabase Auth** (email + password), **public sign-ups disabled**; the 5 admins are invited from the Supabase dashboard | Admin-only login, no customer accounts |
| Data security | **Row Level Security (RLS)** on every table | Public visitors can only see availability and create bookings; only signed-in admins can read customer data |
| File uploads (proof of payment) | **Supabase Storage**, **private** bucket; admins view receipts through short-lived signed links | Payment receipts contain personal data and are never public |
| Classes & registrations | **Supabase Postgres** | `classes` table (title, court, date, start, end, deadline, capacity, fee, rental_fee, rental_qty, status) and `class_registrations` table (class_id, ref, full_name, nickname, age, email, phone, rent, method, pay_ref, proof_path, total, status, reason). Proofs go in the same private receipts bucket. Capacity is checked inside a transaction so two people can't take the last slot |
| Payment method QR codes | **Supabase Storage**, separate **public** bucket (QR codes are meant to be shown to customers); uploaded by admins in Payment Methods | Name and details are stored in a `payment_methods` table (name, details, qr_url, active, sort_order, deleted) |
| Double-booking protection | Database unique constraint on court + date + time for active bookings | Two customers can never hold the same slot, even if they click at the same moment |
| Scheduled jobs | **Supabase `pg_cron`** (every minute) | Expires 15-minute cart holds and 2-hour waitlist claims, sends the next waitlist email, sends reminders |
| Admin calendar | **FullCalendar** via `@fullcalendar/react` with the daygrid, timegrid, list and interaction plugins, **plus FullCalendar Scheduler** (`@fullcalendar/resource-timegrid`) for the per-court Day view | Month/week/list views of all bookings; Day view uses courts as resources (one column each). **Scheduler is a premium add-on: a paid commercial licence key is required for the live site.** The mockup uses the free non-commercial evaluation key. |
| Forms & validation | **React Hook Form** + **Zod** | Same validation rules in the browser and on the server |
| Email | **Nodemailer** via Hostinger SMTP from `noreply@smashcorner-qc.com` + **React Email** templates. Supabase Auth's password-reset emails also use this SMTP. | One sender address for everything; set up SPF, DKIM and DMARC so emails don't land in spam |
| Fonts | Lexend Deca (Google Fonts via `next/font`), Monument Extended (self-hosted via `next/font/local`) | See §14 |
| SEO | Next.js Metadata API, `sitemap.ts`, `robots.ts`, JSON-LD | See §5 |

### Supabase Setup Notes
- **Region:** Southeast Asia (Singapore), the closest to Quezon City, for faster loading.
- **Plan:** the Free plan is fine for development. **Use the Pro plan for the live site**: free projects pause after a period of inactivity and have limited backups.
- **Keys:** the `service_role` key stays on the server only (environment variables), never in the browser.
- **Projects:** a separate Supabase project for staging and for production.

### Hosting: Hostinger
Supabase now handles the database, file storage, login and scheduled jobs, so Hostinger only needs to **run the Next.js app**. That makes both options workable:

| Option | Pros | Cons |
|---|---|---|
| **Hostinger Node.js web-app hosting** (Business/Cloud plans), recommended | Simpler: deploy from GitHub, SSL and domain managed for you | Less control; verify Next.js support on the chosen plan at purchase |
| **Hostinger VPS** (e.g. KVM 2) | Full control (Node.js + PM2 + Nginx + Let's Encrypt) | You manage server updates and security yourself |

**Recommendation:** start with **Node.js web-app hosting**; move to a VPS only if you hit its limits.

### Environments
- **Local** (development) → **Staging** (e.g. `staging.smashcorner-qc.com`, for client revisions) → **Production** (`smashcorner-qc.com`)
- Each environment has its own Supabase project.

---

## 19. Reports (Admin Analytics)

A **Reports** tab in the Admin Console. Admins pick a date range (Last 7 days, Last 30 days, Month to date, Next 14 days) and a court (All or one court). Every KPI shows the change versus the previous period of the same length.

### KPIs

| KPI | Formula |
|---|---|
| **Total Revenue** | Sum of payments for **approved + cancelled** bookings, before refunds. Pending and rejected are excluded. |
| **Net Revenue** | Total Revenue − refunds paid on cancellations |
| **Total Bookings** | Approved + cancelled + pending bookings (rejected excluded) |
| **Court Utilization %** | Booked court-hours (approved) ÷ available court-hours × 100 |
| **Cancellation Rate** | Cancelled ÷ (approved + cancelled) × 100 |
| **Average Booking Value** | Total Revenue ÷ (approved + cancelled bookings) |
| **Revenue per Available Court-Hour** | Net Revenue ÷ available court-hours |
| **Revenue per Occupied Court-Hour** | Net Revenue ÷ booked (approved) court-hours |

**Definitions**
- Bookings count toward the period by **play date** (not the date they were submitted).
- **Available court-hours** = number of courts × 15 open hours (7 AM–10 PM) × days, **minus hours closed in Closures** (see §7).
- Revenue includes court fees **and** equipment rental.

### Charts
- **Net revenue by day:** column chart, with a tooltip per day showing net, total, refunds, bookings and court-hours
- **Utilization by court:** horizontal bars per court
- **Busiest hours:** utilization % for each hour of the day, with the peak hour called out
- **By court:** table with every KPI per court plus an all-courts total (this also serves as the accessible table view of the charts)

### Implementation notes
- Computed in Supabase with SQL views or RPC functions, so the numbers come from one source of truth.
- Charts are a single series in brand lime. The brand colors don't pass the colorblind-safety check as a three-color set, so courts are identified by labels, not colors.
- Optional later: CSV export of the table.

---

## 20. Mockup Demo

- **File:** `mockup/index.html` (single static HTML page, no build step)
- **Live preview:** https://claude.ai/artifact/B12bUVmSg1uH2ErZJs8dEJ (private until shared from the page's Share menu)
- **Demo admin login:** admin1@ to admin5@smashcorner-qc.com · password `demo1234`
- A "Demo" bar shows the emails the system would send and can reset the sample data. It is **collapsible** (v4.10): click "Demo ‹" to collapse it into just a small › arrow tab attached to the left edge of the screen (v4.11), click the arrow to open it again; the browser remembers which way you left it.
- **Sample classes / events (demo only).** On the live site, class registration still starts closed (§7). Dates are relative to today, and each class is placed in a free time on its court so it never clashes with sample bookings:
  | Class | Court | When | Capacity / fee | Rentals | Status |
  |---|---|---|---|---|---|
  | Pickleball 101: Beginners Clinic | Pickleball Court 1 | +4 days, 2 hrs | 12 · ₱500 | Paddle ₱100 (8) | Open: 5 approved, 2 pending, 1 rejected |
  | Junior Tennis Clinic (Ages 7–15) | Tennis Court 1 | +6 days, 2 hrs | 8 · ₱800 | Racket ₱150 (6) | Open: 3 approved, 1 pending |
  | Pickleball Social Night: Doubles Mixer | Pickleball Court 2 | +9 days, 3 hrs (evening) | 8 · ₱350 | Paddle ₱100 (6) | Full: 6 approved, 2 pending |
  | Adult Tennis Drills (Intermediate) | Tennis Court 1 | +12 days, 2 hrs | 6 · ₱600 | None | Closed by admin: 2 approved |
  | Lorem Ipsum Pickleball Open Play | Pickleball Court 1 | 5 days ago, 3 hrs | 10 · ₱300 | Paddle ₱100 (6) | Finished: 7 approved |
  | Rainy Day Footwork Clinic | Pickleball Court 2 | +7 days, 2 hrs | 10 · ₱400 | None | Cancelled: 2 registrations refunded |

---

## Changelog

| Version | Change |
|---|---|
| v0.1 | Initial spec: scope, sitemap, booking and admin flows, waitlist recommendation |
| v0.2 | Color theme (first palette) |
| v0.3 | Waitlist summary; Gallery split into 4 sections; section total kept at 20 |
| v0.4 | Logo reference and typography notes |
| v0.5 | Palette switched to logo colors: black, lime #E1E12B, lavender #B894D8 |
| v0.6 | Fonts: Monument Extended (headings) + Lexend Deca (body) |
| v0.7 | Hours, dummy rates, payment methods, policy, admin-only console, domain, Next.js + Hostinger |
| v0.8 | Supabase for database, auth, storage and scheduled jobs |
| v0.9 | FullCalendar for the admin calendar |
| v1.0 | Reports tab (8 KPIs, charts, per-court table) |
| v1.1 | Time step: start/end time slots with "Book another time slot" |
| v1.2 | Date step: month calendar, bookable up to 1 month ahead |
| v1.3 | Start/end time pickers start blank; changing start clears end |
| v1.4 | §6 step order corrected to match the mockup (Court → Date → Time → Details); mockup section and changelog added |
| v1.5 | Landing page: removed the scrolling (carousel) effect from the highlight band under the hero; band is now static |
| v1.6 | Time step: start/end dropdowns replaced by click-to-pick grid titled "Choose time slot" (click start, then end; "+ Add time slot" for another) |
| v1.7 | Splash screen added (bouncing-ball logo animation, click/Escape to skip); logo now used in the splash only; open question on exact logo hex values |
| v1.8 | Splash screen replaced with the updated version: ball flies in along the swoosh (its flight path), bounces once and stops in the corner |
| v1.9 | Splash: corner spot where the ball lands is solid yellow before the ball arrives (was black); also added to SplashScreen.tsx |
| v2.0 | Splash: landing spot changed from yellow to a round black circle (ball-sized) before the ball arrives; also in SplashScreen.tsx |
| v2.1 | Splash: black landing circle now has a smooth round edge (moved above the yellow swoosh covers, which were cutting a straight line into it); also in SplashScreen.tsx |
| v2.2 | Splash: updated to the latest SplashScreen.tsx / .module.css / logo SVG from the designer (round pocket and swoosh band built into the component; reshaped swoosh edges near the corner) |
| v2.3 | Splash screen removed from the site (component files kept in the project folder, unused) |
| v2.4 | Admin calendar Day view: one column per court (FullCalendar Scheduler resource view); Scheduler licence added to open questions |
| v2.5 | Rejecting a booking: reason is now optional (cancel still requires one); email omits the reason line when none is given |
| v2.6 | Admin Console: Closures tab to close courts for dates or hours (preview, auto-cancel affected bookings with 100% refund, emails, calendar shading, reports adjust available hours) |
| v2.7 | Dates shown as mm/dd/yyyy everywhere (long form: weekday, mm/dd/yyyy; timestamps mm/dd/yyyy h:mm AM/PM); FullCalendar titles and headers match |
| v2.8 | Closures form: from/to date fields replaced by a click-to-select month calendar (one click = one day, second click = range); Whole day / Specific hours choice |
| v2.9 | Admin Console: Payment Methods tab (add/edit name, details, QR image upload; show/hide; reorder; delete). Pay page reads from it |
| v3.0 | Payment Methods: reorder by dragging the method card (⠿ handle on phones, arrow keys for keyboard); ↑/↓ buttons removed; reorders now logged |
| v3.1 | Class / event registration: Book page gets a Court booking / Class / event switch; class form (full name, nickname, age, email, contact number, paddle/racket rental, payment method, reference number, proof upload). Admin Console gets a Classes & Events tab: registration closed by default, "Open registration" form (title, court, date, start/end time, registration deadline, capacity, fee, rentals), approve/reject registrations, close/reopen/cancel class; class blocks its court; calendar shows classes; new emails |
| v3.2 | Book page: Court booking and Class / event share one heading so the switch no longer moves when changing tabs |
| v3.3 | Admin Console sidebar grouped: Court bookings (Pending, Approved, Rejected, Cancelled, Waitlist), Classes & events (Registration controls, Pending, Approved, Rejected, Cancelled), Management (Closures, Payment Methods, Equipment Inventory), Calendar, Admin (Activity Log, Admin Accounts); new class registration lists by status |
| v3.4 | Admin Console navigation simplified: the sidebar shows sections only (Dashboard, Reports, Court Bookings, Classes & Events, Management, Calendar, Admin); each section opens on its first tab, with a mini nav bar of tabs at the top of the screen for the rest |
| v3.5 | Mockup: 6 sample classes / events with sample registrations, one per status (open, full, closed, finished, cancelled), so every Classes & Events tab has data. Added for browsers that already have demo data too |
| v3.6 | Gallery: tabs show one section at a time (no scrolling between sections); the 6 photos are sized to fit the screen; Home teaser opens the matching tab |
| v3.7 | Gallery back on one page (all 4 sections stacked) with sticky tabs; each section is sized to exactly one screen, so a tab jump shows the whole section without scrolling; active tab follows scrolling |
| v3.8 | Gallery: removed the "1 of 4" style counters from section headings |
| v3.9 | Admin Console: Export to Excel for Court Bookings and Classes & Events. Filter by status, courts, date range (booking or submitted date) and specific classes/events; live preview; .xlsx with a records sheet + Summary sheet; exports logged |
| v4.0 | Mobile: navbars that would scroll sideways become hamburger (☰) dropdowns: admin sidebar, admin section tabs, gallery tabs; §14 Mobile navigation rule added |
| v4.1 | Public site header on phones: the "Menu" text button is now a ☰ hamburger icon that animates to ✕ when open |
| v4.2 | Splash screen restored with the designer's new SplashScreen.tsx: ball lobs in, bounces, flies into its socket while the swoosh paints in; once per session, click/Esc to skip, reduced-motion shows the final logo; added to the mockup |
| v4.3 | Splash logo made 70% smaller: width `min(96px, 19.2vw)` (was `min(320px, 64vw)`); in SplashScreen.tsx and the mockup |
| v4.4 | Splash now plays on every page load and refresh (was once per browser session); still not replayed on in-site page changes; mockup and SplashScreen.tsx usage updated |
| v4.5 | Mockup fix: `</svg>` inside JavaScript strings is now written `<\/svg>` so the page works under VS Code Live Server (its reload script was being injected into the scripts, breaking the splash and the app) |
| v4.6 | Landing page: removed the hero photo placeholder (tennis-court illustration) along with the bouncing ball and "Next open slot" chip on it; hero is now text and buttons only |
| v4.7 | All website animation paused for now: the splash screen is the only animation (scroll-reveal, entrance, hover lift/zoom, pop-ins, step transitions, cart bump and smooth scrolling off); §4 updated |
| v4.8 | Admin console (desktop): the page no longer scrolls when a section fits on screen (the browser's default 8px page margin was adding 16px of empty scroll; page margin is now 0). The sidebar only scrolls if its own content is taller than the window |
| v4.9 | Admin console: the sidebar (Dashboard, Reports, Court Bookings, Classes & Events, Management, Calendar, Admin) now stays in view while the page scrolls; it was scrolling away because the hamburger-menu style overrode its sticky position |
| v4.10 | Mockup: the bottom-left Demo bar (Emails, Admin Console, Reset) is collapsible via its "Demo" label; open/collapsed is remembered per browser |
| v4.11 | Mockup: collapsed Demo bar is now just a small › arrow tab attached to the left edge of the screen (no "Demo" text) |
| v4.12 | Book → time step: after clicking a start time the grid no longer relabels/shifts to end times; times stay in place, the start is highlighted, and you click the time you finish at (e.g. 9:00 AM for 8–9). 10:00 PM closing added as the last end choice when reachable |
| v4.13 | Booking received (confirmation) screen: added a "Back to home" button |
