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
   - SQL editor → run `supabase/migrations/0001_init.sql`, then `supabase/migrations/0003_waitlist_approval.sql` (waitlist applications), then `supabase/migrations/0004_booking_reminders.sql` (24-hour booking and class reminder emails), then `supabase/migrations/0005_rental_items.sql` (admin-managed rental items, per hour or per session), then `supabase/migrations/0006_blacklist.sql` (blacklist), then `supabase/seed.sql` (dummy courts, rates, payment methods and the 5 admin emails: replace with real ones).
   - Project Settings → API Keys → put the project URL in `NEXT_PUBLIC_SUPABASE_URL` and a **secret key** (`sb_secret_…`) in `SUPABASE_SECRET_KEY` in `.env.local` (the legacy `SUPABASE_SERVICE_ROLE_KEY` also works). The service key stays on the server; every table has RLS on with no public policies, so the browser can't read anything directly.
2. **Clerk** — create an application with email + password, turn on email verification, and (Phase 1) **restrict sign-ups to an allowlist** of the admin emails. Set the sign-in URL to `/admin/sign-in`. Copy the publishable and secret keys. Admin access itself comes from the `admins` table (verified email → role).
3. **Resend** — add and verify the `smashcorner-qc.com` domain (SPF + DKIM records in Hostinger DNS, plus DMARC), create an API key, set `EMAIL_FROM`.
4. **Secrets** — generate `LINK_SECRET` (signs payment / claim links; the website **and** the tick Edge Function), `CRON_SECRET` (pg_cron → Edge Functions) and `SHEETS_SECRET` (website → record-to-sheets), each with:
   `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
5. **Supabase Edge Functions** (Supabase CLI: `npx supabase login`, then `npx supabase link --project-ref <PROJECT_REF>` in this folder)
   - Deploy all three (each checks its own secret, so JWT verification is off):
     `npx supabase functions deploy tick --no-verify-jwt`
     `npx supabase functions deploy monthly-report --no-verify-jwt`
     `npx supabase functions deploy record-to-sheets --no-verify-jwt`
   - Set their secrets (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided by Supabase):
     `npx supabase secrets set CRON_SECRET=… LINK_SECRET=<same as the website> RESEND_API_KEY=… SITE_URL=https://smashcorner-qc.com EMAIL_FROM="Smash Corner <noreply@smashcorner-qc.com>"`
     Google Sheets (optional): `npx supabase secrets set SHEETS_SECRET=<same as the website> GOOGLE_SHEETS_ID=… SERVICE_ACCOUNT_KEY="$(cat service-account.json)"`
     Testing: add `EMAIL_TEST_TO=you@example.com` (every email goes there) or `EMAIL_DRY_RUN=true` (emails only appear in the function logs).
   - SQL editor: edit the placeholders in `supabase/migrations/0002_cron.sql` (every-minute **tick**: cart holds, waitlist claims, unpaid requests, 24-hour reminders) and run it, then `supabase/migrations/0007_monthly_report.sql` (monthly report email, 1st at 8:00 AM Manila). Both are safe to run again.
   - Check: `curl -X POST https://<PROJECT_REF>.supabase.co/functions/v1/tick -H "Authorization: Bearer $CRON_SECRET"` returns counts like `{"holds":0,"claims":0,"orders":0,"regs":0,"reminders":0}`; Supabase → Integrations → Cron shows both jobs and their runs. To try a monthly report: `curl -X POST …/functions/v1/monthly-report -H "Authorization: Bearer $CRON_SECRET" -d '{"month":"2026-10"}'` (add `"force":true` to send a month again).

## Scripts

| | |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` | TypeScript |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Runs the real flows against the Supabase project in `.env.local` (cart → request → approve → pay → confirm, reschedule, reject → waitlist claim, unpaid expiry, class registration). Uses test emails `e2e.*@example.com` and deletes its data afterwards |
| `npm run test:cleanup` | Deletes test data left by browser runs (`e2e.ui.*@example.com`) and by `test:e2e` |
| `npm run test:db` | Runs the migration in PGlite (Postgres in WASM) and checks the booking SQL: double-booking guard, cart → order, waitlist hand-off, reschedule, class capacity |

## Browser testing (Playwright CLI)

[Playwright CLI](https://www.npmjs.com/package/@playwright/cli) drives a real browser from the terminal. Claude Code uses it through the skill in `.claude/skills/playwright-cli`.

```bash
npm install -g @playwright/cli@latest     # once per machine
npm run dev                               # with EMAIL_DRY_RUN=true, so payment links print to the terminal
playwright-cli -s=smash open http://localhost:3000 --headed
playwright-cli -s=smash snapshot          # element refs (e12…) for click / fill
playwright-cli -s=smash screenshot --filename=test-artifacts/home.png
npm run test:cleanup                      # afterwards
```

- Book with `e2e.ui.<anything>@example.com` so `test:cleanup` can find and delete the rows. `.env.local` points at a real Supabase project.
- Admin pages: sign in yourself once in a headed session, then `playwright-cli -s=smash state-save .playwright-cli/admin-state.json`. Later sessions use `state-load`.
- `.playwright-cli/` (sessions, may hold sign-in cookies) and `test-artifacts/` are gitignored.

## Where things are

| Path | What |
|---|---|
| `src/app/(site)` | Public pages: Home, Courts, Book (court + class tabs), Gallery, Programs & Events, Contact + FAQ, Cart, Request, Done, Pay (`/pay/<signed link>`), Policy, Privacy, Terms |
| `src/app/admin` | Admin Console (Clerk sign-in, role checks on every request) |
| `src/app/actions` | Server actions (booking, contact, admin) |
| `src/app/api` | Availability, cart count, calendar feed, Excel export |
| `src/lib/flows` | Booking / class / closure / waitlist lifecycles (approve → pay → verify, spec §6–§9) |
| `src/lib/email` | React Email layout, Resend sender, every email in spec §10 |
| `supabase/` | Schema, seed, cron jobs, DB tests; Edge Functions `functions/tick` (every-minute jobs), `functions/monthly-report` (super-admin email) and `functions/record-to-sheets` (Google Sheets); `functions/_shared/` business rules, time helpers, slot states, record columns, Reports maths and the email layout, shared with the app |
