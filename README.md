# Smash Corner — website & booking system (Phase 1)

Next.js (App Router, TypeScript) · Tailwind · Supabase (Postgres + Storage + pg_cron) · Clerk (admin sign-in) · Resend + React Email · FullCalendar · SheetJS.
The spec is `mockup/PROJECT_SPEC.md`; `mockup/index.html` is the approved clickable mockup the UI is ported from.

## Run it locally

```bash
npm install
cp .env.example .env.local   # fill in the values (see below)
npm run dev                   # http://localhost:3000
```

Without `RESEND_API_KEY` (or with `EMAIL_DRY_RUN=true`) emails are printed to the terminal instead of sent. With `EMAIL_TEST_TO` set, every email goes to that one address (the real recipient is shown in the subject). That is required while sending from `onboarding@resend.dev`, which only delivers to the Resend account email.

## One-time setup

1. **Supabase** (region: Southeast Asia / Singapore; one project for staging, one for production)
   - SQL editor → run `supabase/migrations/0001_init.sql`, then `supabase/migrations/0003_waitlist_approval.sql` (waitlist applications), then `supabase/migrations/0004_booking_reminders.sql` (24-hour booking and class reminder emails), then `supabase/seed.sql` (dummy courts, rates, payment methods and the 5 admin emails: replace with real ones).
   - After the site is deployed: edit the two placeholders in `supabase/migrations/0002_cron.sql` and run it (every-minute job that expires cart holds, waitlist claims and unpaid requests, and sends the 24-hour booking and class reminders).
   - Project Settings → API Keys → put the project URL in `NEXT_PUBLIC_SUPABASE_URL` and a **secret key** (`sb_secret_…`) in `SUPABASE_SECRET_KEY` in `.env.local` (the legacy `SUPABASE_SERVICE_ROLE_KEY` also works). The service key stays on the server; every table has RLS on with no public policies, so the browser can't read anything directly.
2. **Clerk** — create an application with email + password, turn on email verification, and (Phase 1) **restrict sign-ups to an allowlist** of the admin emails. Set the sign-in URL to `/admin/sign-in`. Copy the publishable and secret keys. Admin access itself comes from the `admins` table (verified email → role).
3. **Resend** — add and verify the `smashcorner-qc.com` domain (SPF + DKIM records in Hostinger DNS, plus DMARC), create an API key, set `EMAIL_FROM`.
4. **Secrets** — generate `LINK_SECRET` (signs payment / claim links) and `CRON_SECRET` (shared with the pg_cron job):
   `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`

## Scripts

| | |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Runs the real flows against the Supabase project in `.env.local` (cart → request → approve → pay → confirm, reschedule, reject → waitlist claim, unpaid expiry, class registration). Uses test emails `e2e.*@example.com` and deletes its data afterwards |
| `npm run test:db` | Runs the migration in PGlite (Postgres in WASM) and checks the booking SQL: double-booking guard, cart → order, waitlist hand-off, reschedule, class capacity |

## Where things are

| Path | What |
|---|---|
| `src/app/(site)` | Public pages: Home, Courts, Book (court + class tabs), Gallery, Programs & Events, Contact + FAQ, Cart, Request, Done, Pay (`/pay/<signed link>`), Policy, Privacy, Terms |
| `src/app/admin` | Admin Console (Clerk sign-in, role checks on every request) |
| `src/app/actions` | Server actions (booking, contact, admin) |
| `src/app/api` | Availability, cart count, calendar feed, Excel export, cron tick |
| `src/lib/flows` | Booking / class / closure / waitlist lifecycles (approve → pay → verify, spec §6–§9) |
| `src/lib/email` | React Email layout, Resend sender, every email in spec §10 |
| `supabase/` | Schema, seed, cron job, DB tests |
