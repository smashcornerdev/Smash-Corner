# SmashCorner — Website & Booking System Spec

> Status: **Draft v6.67** · Last updated: 2026-11-27
> Purpose: Agree on scope, page structure, and booking/admin flows before any code is written.

---

## 1. Scope Summary

| Item | Deliverable |
|---|---|
| Pages | 10 public pages (draft copy) incl. **Book**, **Gallery**, **About Us** |
| Sections | 20 sections spread across the site (draft copy) |
| Animations | **Paused for now: splash screen only** (scroll-reveal, hover motion, page and booking-step transitions on hold; see §4) |
| SEO | Meta tags, Open Graph, sitemap, robots.txt, structured data, performance basics |
| Booking | Customer booking flow with cart, payment proof upload, admin approval |
| Admin Console | Login, Pending / Approved / Rejected / Cancelled / Waitlist views |
| Email | Notifications to admins and customers on every booking state change |
| Revisions | 2 revision rounds |

**Content rule:** all copy is realistic draft wording written for Smash Corner (no Lorem Ipsum, v6.24), for the client to review and replace before launch; the Privacy Policy, Terms and Booking Policy in particular need the client's final review. Coach names, event names and the address are sample values. All images are placeholders until real assets are supplied.

---

## 2. Sitemap (10 Pages)

| # | Page | Route | Notes |
|---|---|---|---|
| 1 | Home (Landing) | `/` | Main entry; primary CTA → Book |
| 2 | About Us | `/about` | **Required** |
| 3 | Courts | `/courts` | Tennis Court 1, Pickleball Courts 1 & 2 |
| 4 | Book | `/book` | **Required**. Multi-step court booking flow, plus a **Class / event** tab for class registration (see §6) |
| 5 | Gallery | `/gallery` | **Required**. One page with every photo in a single uncropped masonry layout (no sections or tabs, v6.52); lightbox on click |
| 6 | Pricing / Rates | `/pricing` | Court rates + equipment rental rates |
| 7 | Programs & Coaching | `/programs` | Dummy |
| 8 | Events | `/events` | Dummy |
| 9 | FAQ | `/faq` | Accordion |
| 10 | Contact | `/contact` | Form + Google Maps embed with a pin at 98 Maria Clara St., Sto. Domingo, Quezon City (v6.26) |

**Utility pages (not counted in the 10):** Cart, Checkout, Booking Confirmation, Privacy Policy, Terms, 404, Admin Login, Admin Console.

---

## 3. Section Allocation (20 Sections)

| Page | Sections | Count |
|---|---|---|
| Home | Hero (layout from the client's sample, v5.29: headline, then "Tennis and pickleball courts in Quezon City. Book in under a minute.", then a **search bar** and a **facts row** — see "Home hero" below; no eyebrow tag since v5.25; transparent over the site-wide parallax court photo, v6.28) · Courts Preview · Why Choose Us · Gallery Teaser · Final CTA Banner (Why Choose Us cards have no colored top border, v4.92; Testimonials section removed, v6.25) | 5 |
| About Us | Our Story · Meet the Team · Mission & Values | 3 |
| Courts | Court Cards (specs/photos: Players, Lights, Rate, Note; no Surface/Size since v6.50) · Facilities & Amenities (Parking, Shower & Bathrooms, Free Wi-Fi, Waiting Lounge; Lockers and Drinks & Snacks removed v6.50) | 2 |
| Pricing | Rates Table (court rates + equipment rental) | 1 |
| Gallery | Photos (one masonry layout of all photos; the 4 sections were removed in v6.52) | 1 |
| Programs | Programs & Coaches (coaches are text only: name, sport, experience; no photos, v4.91). Programs lists the **classes the admin has open** (v6.55; see "Programs & Events content" below) | 1 |
| Events | Upcoming Events List: the **events the admin has open** (v6.55) | 1 |
| FAQ | FAQ Accordion (on the Contact page; answers slide open/closed, lines wipe in left to right, v5.27/v5.46) | 1 |
| Contact | Contact Form with Map & Hours | 1 |
| **Total** | | **20** |

**Programs & Events content (v6.55):** the Programs and Events sections are no longer fixed text. They list what the admin has opened in Admin → Classes & Events → **Open registration**, split by the form's new **Type**: **Class** → Programs, **Event** → Events. They show exactly the ones the Book page's Class / event tab offers: open, or full but still before the registration deadline. Once registration is closed (by the admin or the deadline), the class/event has started, or it is cancelled, it drops off. The page is built fresh on every visit, so changes show at once.
- **Programs** (cards, 3 across): court-type picture placeholder, title, day/date and time (e.g. "Tue, Dec 1 · 9:00 AM – 11:00 AM"), court · fee (or "Free") · spots left ("5 of 12 spots left", or "Full"), the optional description, and **Register** (opens Book on the Class / event tab); a full one shows a disabled **Full** button instead.
- **Events** (list, soonest first): date block (month + day), title, time · court · fee · spots left, the optional description, and **Join** (Book → Class / event), or **Full**.
- **Nothing open:** the section and its jump tab stay, with a short message, "No classes open right now. Check back soon." (or "No events …") and a **Book a court** button.
- Mockup: same, from the mockup's sample classes (Pickleball Social Night: Doubles Mixer is a sample event).

Global (not counted): Header/Nav, Footer, Cookie banner.

**Gallery page (v6.52):** one page, **no sections and no tabs**. It shows every photo from the client's public Google Drive folder (https://drive.google.com/drive/folders/1KyuiLHgtCH3Ji0WJC0ikWwnIiUPVoOu7, 157 photos). The photo list is **`src/data/gallery.json`** (`source` = the folder link, `photos` = one `{ id, file, w, h }` per Drive file, in the folder's order; `w`/`h` are the photo's pixel size, v6.62); to add or remove photos, edit that file (a new photo needs its size too). Images load straight from Google (`https://lh3.googleusercontent.com/d/<id>=w<width>`: 800 px wide in the grid, 2000 px in the lightbox), lazily as they near the screen. **Every photo is shown whole, nothing cropped**: a masonry layout where photos stack in columns at their own shape (4 columns on desktop, 3 on tablets below 900 px, 2 on phones below 640 px), rounded corners, 10 px gaps (8 px on phones); every tile has its photo's real shape from the first frame, before any photo has loaded (sizes from `gallery.json`, v6.62), so the layout never reshuffles as photos arrive (v6.56–v6.61 used a 4:3 placeholder until each photo's size was known, which made photos jump between columns while loading). Only photos near the screen download (within 600 px of it); the rest start as you scroll. Since v6.63 the Gallery starts each download itself (photos are rendered without a source and get one as they near the screen) instead of relying on the browser's `loading="lazy"`: arriving from another page, the browser ignored "lazy" for photos built before they were put in the page and downloaded all 157 at once (v6.56 had tried to fix this by attribute order, which wasn't enough). Clicking a photo opens a lightbox with the whole photo, "N of 157", Previous / Next (arrow keys too) and close (✕, Escape or clicking outside). The **Home gallery teaser** shows the first 4 photos (cropped 4:3 tiles), each opening the Gallery. (Until v6.51 the Gallery had 4 one-screen sections, Pickleball Courts, Tennis Courts, Bathroom and Amenities, with sticky jump tabs and placeholder art.)

> Note: Gallery grew from 1 to 4 sections. To keep the total at 20, Pricing, Programs and Contact were each merged into a single section.

---

## 4. Animations

> **Paused for now (v4.7): only the animations listed with a version number below are on (splash, landing entrance and "Play it." shine, page entrances, scroll reveals, button border trace, phone menu, admin Dashboard entrance, parallax background).** Everything else is on hold: no other scroll-reveal, entrance, hover motion, page/step transitions, pop-ins or smooth scrolling. Hover states still change color/outline, just without movement. In the mockup this is one CSS block marked "Animations paused for now" (delete it to bring them back); in the build, leave these out until they're switched back on.

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
  - Background `#000000` (black since v4.19; `#0E0B12` in v4.18; was violet `#330C65` in v4.17, Indian Wells Green in v4.15–v4.16, deep violet in v4.14, `#141118` before); logo width `min(96px, 19.2vw)` (made 70% smaller in v4.3; was `min(320px, 64vw)`). Uses the exact logo colors (`#BB9AD0`, `#050505`, `#E0DE29`).
  - **Build:** `SplashScreen.tsx` in the project folder is the drop-in component for the Next.js site, with no dependencies and no CSS file. Mount it in `app/layout.tsx` as `<SplashScreen />` before `{children}` (without `oncePerSession`, so it plays on every load/refresh). The mockup runs a plain-JavaScript copy of the same animation (same paths and timing).
- **Landing page entrance (v5.06; made restrained and "professional" in v5.07; GSAP `heroIntro`)**, on Home, right after the splash has faded out (straight away when arriving from another page, since there's no splash then). The feel is calm and deliberate, like entering a pro venue: every part uses one long, smooth deceleration (`expo.out`), with no bounces, springs or pops. About 2.7 s, in this order:
  - **The header is not animated** (v5.18; it settled in as step 1 in v5.07–v5.17): the logo, navigation, Book Now / ☰ are in place from the first frame; only the page content below it animates.
  1. *(Removed v5.25: the hero no longer has the "Tennis · Pickleball · Quezon City" eyebrow above the headline, so its letter-spacing animation is gone too. The hero now starts with the headline.)*
  2. The first two headline lines ("It all begins with a ball.", "Life's a court.") rise up out of their own baselines (masked), 0.16 s apart (0.35 s). **"Play it." comes in from the left side instead** (v5.22; it rose like the others before): it starts just past the left edge of the screen and glides into place, fading in over its first 0.5 s (0.62 s, 1.4 s long, `expo.out`, so it arrives fast and settles gently), then gets its shine (step 6).
  3. The lead paragraph **slides in from the right** while fading in (0.95 s; v5.28, it came into focus from a blur before).
  4. The search bar glides up and fades in (1.15 s), then the three facts one after another (from 1.35 s, 0.08 s apart). (Before v5.29: the "Book a Court" / "See the Courts" buttons, then the old quick-book form.)
  5. The ticker band wipes in left to right, then its words fade in (1.35–2.7 s). On phones, where its words wrap onto several rows (v5.54, v5.55), it reads in order instead: the band wipes in left to right one row at a time (1st row left to right, then the 2nd row, and so on; 0.38 s per row), each row's words fading in from the left as the wipe passes them.
  6. **"Play it." shine (v5.08; once and slower since v5.09; repeating every 3 s since v6.61; GSAP `textShine`):** once the entrance has finished, a band of white light sweeps across "Play it." left to right, like light catching a polished surface. Each sweep takes 2 s (`power1.inOut`), slow enough to notice, and it **repeats every 3 s** (a new sweep starts 3 s after the last one started, i.e. 1 s pause between sweeps; v6.61, it played once in v5.09–v6.60). Built as a chartreuse gradient with a white band clipped to the letters (`background-clip:text`), so at rest it looks exactly like the plain chartreuse text. Off with reduced motion (the text just stays chartreuse).
  - The page is hidden while the splash covers it, so nothing flickers. Without JavaScript, or with reduced motion, it just appears.
- **Parallax background (v6.28; photo `scbgphoto3.jpg` v6.33; full width v6.35; PNG v6.36; starts at the top v6.37; new JPG v6.38; darker + 30% start v6.39; phone framing v6.44; GSAP `quickTo`, `ParallaxBackground` in the root layout)**, on every page: the court photo `public/images/scbgphoto3.jpg` (landscape 2048×1365, v6.38; was a 1676×769 PNG in v6.36–v6.37) sits fixed behind all content under a 45% black scrim (v6.39; 33% in v6.31–v6.38; **65% in the admin console**, v6.59, so the photo is a bit darker there) and a black gradient falling from the top of the screen (50% at the top edge, 20% midway, clear at the bottom; v6.60, it rose from the bottom in v6.31–v6.59) so text stays readable (v6.31). **The whole width of the photo always shows** (v6.35): it's scaled to the screen width at its own proportions and sits at the top of the screen, and its bottom third fades into the black page, since on most screens a wide photo is shorter than the screen (on phones it's a band across the top). At the top of the page the top 30% of the photo is above the screen (v6.39; it started from its top edge in v6.37–v6.38). Scrolling to the bottom of the page drifts the photo up, in step with scroll progress, until its bottom edge meets the bottom of the screen, or by a further 15% of its height when it's too short for that (the usual case); it eases into place over 0.4 s (`power2.out`) and re-fits on window resize. Sections with their own background (header, cards, violet bands, footer) still cover it. Reduced motion: the photo stays still at its starting position.
  - **Phones (below 700 px wide, v6.44; own photo v6.45; photo `scbgphoto1.jpg` v6.47; fills + pans v6.48; start setting v6.49):** phones use a **different photo, `public/images/scbgphoto1.jpg`** (a player serving on court, portrait 1365×2048; only this one is downloaded on phones). **It fills the whole screen** and is at least 1.25 screens tall (and at least the screen's width), centred sideways, so its sides are trimmed a little. At the top of the page the photo's top edge is at the top of the screen (adjustable since v6.49: `MOBILE.start` = how much of the photo's height starts above the screen, default 0); **scrolling to the bottom of the page pans it up until its bottom edge meets the bottom of the screen**, so by the end the whole height of the photo has been seen (same 0.4 s `power2.out` easing). No fades. Reduced motion: it stays at the top. (v6.46–v6.47 showed the whole photo, uncropped but smaller than the screen, with black above and below.)
- **Home scroll reveals (v5.23; GSAP `sectionReveal`)**, on Home below the hero, each playing once as it **just starts to come into view** (its top reaches about 88% down the screen):
  - **Section headings** ("Three courts. One corner.", "Why choose us", "Take a look around", "Players say"): the eyebrow and title **slide in from the left** and fade in (1 s, `expo.out`, 0.12 s apart), followed by the button if there is one (Court details, Full gallery); the **intro paragraph under the title slides in from the right** (from 0.2 s; v5.28, it came from the left with the title before).
  - **The lime line under each section title draws out left to right** (0.7 s, starting 0.35 s into the heading).
  - **Cards** (court cards, Why choose us features, gallery teasers) **rise in one at a time, left card first** (0.15 s apart, 0.8 s each). On phones, where the cards stack, each one plays as it reaches the screen.
  - The "Ready to play?" band slides in from the left like the headings.
  - With reduced motion (or without JavaScript) everything is simply there.
  - **Loading partway down the page** (refresh with the scroll position restored, or jumping via a link) works: anything already scrolled past plays straight away, and nothing errors (fixed v5.24: the first version crashed with "Cannot read properties of undefined (reading 'end')" in that case).
- **Same motion on every other public page (v5.26; GSAP `pageIntro` + `sectionReveal`, mounted through `PageTop`)**: Courts, Gallery, Programs & Events, Contact, Book, Cart, Booking request, Pay, Policy, Privacy, Terms.
  - **Page entrance**, right after the splash (straight away when arriving from another page, e.g. through the navigation): like the section headings, the eyebrow and the page title **slide in from the left** and fade in (1 s, `expo.out`, 0.12 s apart; v5.33, the title rose out from behind its own baseline before), and the lead paragraph **slides in from the right** (from 0.2 s; v5.28).
  - **Sub tabs appear one by one, left first** (v5.33), right after the title (from 0.4 s, 0.1 s apart, 0.8 s each, sliding in a little from the left): the Programs / Upcoming events / Coaches jump buttons on Programs & Events, the Court booking / Class tabs on Book, and the section tabs on Gallery (the Book and Gallery sliding highlights fade in with their tab).
  - **Scroll reveals**, exactly as on Home: section headings (and the Gallery's section titles) slide in from the left, the lime line under each section title draws out, and cards rise in one at a time, left to right: court cards, amenities, programs, coaches, event cards, FAQ items, gallery photos, and the Contact page's two blocks. Things already on screen when the splash leaves play straight away.
  - **Gallery photos (v6.53):** every photo in the masonry starts hidden 40 px low and **rises in from the bottom** (0.8 s, `expo.out`) as it comes into view near the bottom of the screen, so scrolling down keeps bringing photos up. Photos that come into view together rise one after another in reading order on screen (row by row, left to right; not the masonry's column-by-column page order), 0.15 s apart. Since v6.56 the Gallery runs its own rise-in (not the shared ScrollTrigger reveal): photo positions are read live on every scroll, resize and photo load, so photos that move as others load never get stuck hidden. Each photo remembers on the page whether it has already risen in, so the rise-in also plays when arriving from another page, where the page can be set up twice in quick succession (v6.57). A big batch (e.g. jumping far down) is squeezed into 0.6 s instead of 0.15 s per photo. **On arrival** (first visit or coming from another page) every photo you can see anywhere on the screen, right down to the bottom edge, rises in as one batch (v6.62; before, only photos above the 88% line did, and the layout was still shifting as photos loaded); every photo below stays hidden until you scroll to it, then rises in as it passes 88% of the way down the screen. The Gallery waits until the page has been laid out and scrolled back to the top before it first looks (v6.58). Photos already scrolled past (e.g. jumping to the bottom of the page) simply appear instead of queueing up, on every page. Off with reduced motion. Not in the mockup (the mockup has no scroll reveals).
  - Booking-flow content (court/date/time steps, cart items, forms) isn't animated beyond the page top, so nothing gets in the way of booking. Reduced motion: everything is simply there.
- **(Removed v6.52: the Gallery has no tabs now.)** **Gallery tabs (v5.56; `GalleryView.tsx`)**: (type, v5.63: same as the Programs & Events tabs, Lexend Deca regular at .8rem, was semi-bold .88rem) clicking a tab glides the page to its section (GSAP ScrollToPlugin, 0.8 s, `power3.inOut`; it lands with the section top just under the tab bar; touching the screen, the mouse wheel or a scroll key mid-glide stops it so the visitor takes over). Fix v5.59: on iPhones the glide used to move a little and stop (GSAP's autoKill misreads iOS Safari's scrolling as the visitor taking over), so it no longer uses autoKill. One violet highlight slides from tab to tab (0.45 s, `power3.out`) whenever the section on screen changes, in one smooth move with no double bounce (fixed v5.57). Fix v5.60: on iPhones (Safari) the highlight was hidden behind the grey tab backgrounds; those are now drawn as separate shapes under the highlight. Fix v5.61: the actual cause on iPhones was the row resizing during the page entrance (toolbars settling, fonts loading), which cancelled the highlight's fade-in and left it invisible; resizes now only move it. It follows the scroll, so during a glide it passes over the tabs in between rather than jumping straight to the clicked one. Reduced motion: the jump is instant and the highlight just moves.
- **Programs & Events tabs (v5.58; `PeTabs.tsx`, shared `tabMotion.ts` with the Gallery)**: the Programs / Upcoming events / Coaches tabs now behave like the Gallery tabs. The row **sticks under the site header** while you scroll the page. On phones it stays one row, side by side, every label on **one line** ("Upcoming events" included) and **centered** in its tab. Clicking a tab glides the page to its section (0.8 s), landing just under the tab row. One highlight, the same design as the Gallery tabs' (dark violet with a 2 px lavender outline, white text; v5.64, was plain lavender with dark text), slides from tab to tab (0.45 s) as the section on screen changes, also during a glide (passing the tabs in between). Built the same way as the Gallery tabs, so the page-entrance animation is identical: the tabs slide in one by one while the highlight and the grey tab backgrounds fade in in place (v5.65; before, the first tab showed grey/white for about a second before its highlight appeared). Still plain `#` links underneath, so they work without JavaScript. Reduced motion: instant jump, highlight just moves.
- **Sticky tab row has no background (v6.54; v6.51 gave it one while pinned)**: the Programs & Events tab row has no background of its own at any time, at rest or pinned under the site header, so there is no black bar across the row; only the tab buttons themselves (grey, with the violet highlight) show, and page content scrolls past visibly in the gaps around them.
- **Sticky bars stay on top while gliding (v5.62)**: the site header and the Gallery / Programs & Events tab rows each get their own compositing layer (`translateZ(0)`; the header only while the phone menu is closed, so the full-screen menu isn't squashed). Without it iOS Safari could flash page content over them for a split second during a long tab glide.
- **Tapped tab doesn't stay highlighted (v5.58; Gallery and Programs & Events)**: only the tab of the section on screen is highlighted. On touch screens the tapped tab no longer keeps its hover look (lime text / outline) after the page has moved on, because hover looks on these tabs are for mouse pointers only.
- **Header hover & press motion (v5.49, v5.51; `navHover.ts`)**: on desktop (mouse, wider than 1100 px) a single grey hover pill glides smoothly from tab to tab under the pointer, stretching to each tab's width (0.35 s, `power3.out`); it grows in when the pointer enters the nav and fades out when it leaves. The tab's text color fades instead of snapping. Pressing any nav tab (desktop or phone menu) dips it slightly (to 95 %), then it settles back with just a small overshoot (0.3 s), subtle rather than bouncy (v5.51). Shopping-bag button (header and phone menu): on hover the bag lifts and swings on its handle (0.7 s); pressing squashes it a little, then it settles back with a small overshoot (0.3 s) and the cart-count badge pops slightly (v5.51). Off with reduced motion.
- **Request-sent page entrance (v5.47, v5.48; `DoneIntro.tsx`)**: after the splash (straight away on client navigation), the whole page comes in at once, with no top-to-bottom stagger: the header ("Submitted" eyebrow and "Request sent" title) slides in from the left while the content below it (reference numbers, status text, booking list, the cancel/reschedule note, Back to home) slides in from the right, all together (0.9 s, `expo.out`). No background confetti on this page any more, and the "To cancel or reschedule…" note has no violet left edge (v5.47). Off with reduced motion.
- **FAQ accordion (v5.27, v5.46; Contact page, `FaqList.tsx`)**: opening a question slides its answer down from nothing to full height (0.3 s, `power3.out`) while the answer's text appears line by line, each line wiping in from left to right (GSAP SplitText; lines follow one another quickly, whole reveal ≈0.45 s however long the answer). The chevron on the right flips from ▾ to ▴ with a small overshoot (0.3 s). Closing slides the answer back up and fades it (0.25 s) while the chevron flips back. Clicking again mid-animation reverses it from where it is. Still a plain `<details>`/`<summary>` underneath, so it works by keyboard (Enter/Space), without JavaScript and with screen readers; with reduced motion it opens and closes instantly.
- **Button border trace (v5.09; site-wide since v5.11; `BorderTrace.tsx`)**: hovering (or keyboard-focusing) any lime or lavender-outlined ("ghost" / "lav") button on the public site (Book Now, Book a Court, See the Courts, See open times, Continue, Add to cart, Back, and so on; lavender-outline "lav" buttons added v5.19) draws a 2 px line in the button's text color around the button, 4 px inside its edge. It follows the button's real shape (cut top-left corner, rounded others), starting at the cut corner and running clockwise (0.7 s), and retracts faster (0.35 s) when the pointer leaves. Buttons that appear later (booking steps, forms) get it too. Not on disabled buttons, and not in the admin console. Hover only on devices with a mouse; with reduced motion the line appears instantly. It's a CSS transition exempted from the site-wide "no animations" switch.
- **Loading spinners (v5.91; sign-in added v5.92)**: every loading spinner spins: the Export to Excel preview spinner, the sign-in page's "Signing you in…" spinner, the "Loading the admin console…" spinner, and the sign-in form's own (Clerk) spinner on its buttons while it checks the email or code. Exempted from the site-wide "no animations" switch; ours spin slower with reduced motion.
  - **Admin console (v5.72):** the same hover border trace is on the **View**, **Approve / Confirm payment** and **Reject** buttons everywhere they appear in the admin: the Dashboard and Court Bookings tables, the booking card / page (Approve request, Confirm payment, Reject), Classes & Events registration tables and registration page, and the Waitlist's Approve. Other admin buttons don't have it. On **Reject** the outline is the only hover change (its text and red background stay as they are; before v5.73 the link version's text turned purple) and the line is drawn in the **Approve button's lime** instead of the text color (v5.73).
- **No hover underline on buttons (v5.11):** link-styled buttons no longer pick up the underline that plain links get on hover (text-style buttons keep theirs).
- **No violet bottom edge on any button (v5.71; site-wide, public site and admin console)**: lime and OK buttons (e.g. Book Now, Approve request, Confirm payment) are flat with no violet edge underneath. Before v5.71 only some buttons had it removed: Book Now / Book a Court (v5.10), on the booking flow's Continue (Step 3) and Add to cart (Step 4) (v5.40), on the Cart page's Continue to request (v5.41), on the Booking request page's Send booking request (v5.43), on the empty Cart page's Book a court and the request-sent page's Back to home (v5.44), and on the Contact page's Send message (v5.50):** these lime buttons don't have the 4 px violet inset shadow along their bottom (other lime buttons keep it). The keyboard focus ring still shows.
- **No purple edge on notes (v5.71; site-wide)**: info notes (e.g. "Nothing paid yet. The customer pays after the request is approved.", "No payment needed for this booking.", the booking flow's time hint, the admin's result banners, the Payment Methods pop-up messages) are plain grey boxes with no purple left edge. Error notes keep their red left edge so they still stand out.
- **Confetti on Send booking request (v5.43; was on the Cart page's Continue to request in v5.42; GSAP `confettiBurst` with Physics2DPlugin):** clicking **Send booking request** on the Booking request page, with the policy box ticked, fires 30 small confetti pieces (brand lime, chartreuse, lavender and white; squares, strips and dots) upward out of the button; they spin, arc and fall under gravity, fading out over about 1.5–2 s, and keep falling over the confirmation page as it opens. No confetti when the policy box isn't ticked (that click only shows the error). With reduced motion there's no confetti. Continue to request on the Cart page is a plain link again.
- **Contact form "paper plane" send (v5.45; GSAP `paperPlane` with MotionPathPlugin; our own take on the idea of Aceternity's Pro "Paper Plane Send", whose code isn't public):** once the server has accepted the message, a paper sheet appears over the Message field and the message prints onto it from the top down (~0.7 s); the sheet folds into a paper plane (its outline morphs, a crease shows); the plane pulls back a little, then flies in an arc into the Send button (~1 s), which takes the hit; the button then **opens into a receipt** filling the card: "Message sent", Sent to · Smash Corner front desk, "We read every message and reply by email, usually within a day", and the subject, reply-to email and time sent, with a **Write another** button that brings back an empty form. About 3.5 s in all. Only after a successful send (errors show as before); the button reads "Sending…" throughout. Reduced motion: straight to the receipt.
- **Phone menu open/close (v5.12; full-screen since v5.15; GSAP `navMenu`)**: below 1100 px the ☰ menu opens as a **full-screen panel** that comes down from the top of the screen (0.45 s), followed by the links fading in one after another (0.05 s apart), **0.8 s for the whole animation**; the ☰ morphs into ✕. The header bar (logo and ✕) stays on top of the panel, and the page behind can't scroll while it's open (it keeps its scroll position). Links are large condensed caps. Closing (✕, Esc, or tapping a link) rolls it back up (about 0.35 s) and the panel is gone the moment it finishes, with no flash of the open menu (fixed v5.20). Reopening mid-close is handled. With reduced motion it just appears and disappears.
- **Admin Dashboard entrance (v5.70; GSAP `dashIntro`, `DashIntro.tsx`)**: after the splash (straight away on client navigation), the **"Dashboard" title slides in from the right**; the **4 stat cards** (To review, Bookings today, On waitlist, Approved · next 7 days / Class registrations to review) **come in from the top left one at a time, row by row, left to right** (one row on desktop; two rows of two on phones). Then each section, **Requests to review**, **Payments to verify** and **Today on court**: its **header slides in from the right**, then its **table (or the "nothing here" box) comes in from the top left**. Sections below the fold play as they scroll into view. The admin ☰ menu on phones uses the same open/close animation as the public site's (v5.69). Off with reduced motion.
- **Dashboard booking card opening (v5.75; GSAP `cardIn`)**: clicking **View** on a Dashboard row fades the dark backdrop in (0.25 s), the card rises 40 px and grows from 96% to full size into place (0.55 s), then its parts (title, details, the Approve / Reject / Edit / Cancel sections) fade up one after another. Off with reduced motion.
- **Export to Excel (v5.77; Court Bookings and Classes & Events)**: the **Export to Excel** button has the hover border trace; clicking it opens the export window with the **same opening animation as the booking card** (backdrop fades in, window rises and grows into place, its parts fade up one by one). In the window, **Download .xlsx** and **Cancel** have the hover border trace, and while the pointer is on Download (or it has keyboard focus) its **⤓ arrow dips down and back over and over** (GSAP `arrowDip`), settling back when the pointer leaves. **Closing** (v5.79): however it's closed (×, Cancel, Esc or clicking outside), the window plays the reverse, quicker than opening (about 0.3 s): its contents fade, it sinks and shrinks slightly as it fades out, and the backdrop fades away. Closing while it's still opening works too. Off with reduced motion; a disabled Download (nothing to export) doesn't move.
- **Court Bookings tab contents (v5.78; GSAP `tabIntro`)**: each time a tab is opened (Requests, Awaiting payment, Verify payment, Approved, Rejected, Cancelled, Unpaid), the **tab's note slides in from the left**, then the **table (or the "nothing here" box) comes in from the top left** like the Dashboard's tables, and the **rows on show fade up one after another**. About 0.8 s. Starts after the splash on a fresh load; off with reduced motion.
- **Classes & Events tab contents (v5.88; same `tabIntro` as Court Bookings)**: each time a tab is opened (Registration Controls, Pending, Awaiting payment, Verify payment, Approved, Rejected, Cancelled, …), the note slides in from the left, then the blocks (on Registration Controls: the intro row with + Open registration, the open/closed banner, Upcoming, and Past & cancelled) come in from the top left **one after another**, and the table rows on show fade up one by one. Starts after the splash on a fresh load. **Only the tab's own contents animate** (v5.89): the page title ("Classes & Events" / "Court Bookings"), the tabs, Export to Excel and any message banner stay still when switching tabs (before v5.89 the Classes & Events request tabs also replayed the title, tabs and Export).
- **Management (v5.98; same motion as Court Bookings)**: Closures, Payment Methods and Equipment Inventory get Court Bookings' animations and effects. **Tab entrance** (`tabIntro`): each time a tab is opened, the note slides in from the left, the blocks (intro row with its button, tables, the payment method list) come in from the top left one after another, and the table rows (and payment method cards) fade up one by one; starts after the splash, off with reduced motion. **Hover border trace** on every button: + Close courts, Reopen, Close courts / Back (close courts window); + Add payment method, Edit, Hide / Show, Delete, Upload / Replace image, Save / Add payment method, Cancel; Save inventory. **Windows** (Close courts, Add / Edit payment method) open and close with the booking card's animations (v5.77 / v5.79).
- **Page notes slide in from the left (v5.99)**: on every admin tab with an intro note, the note slides in from the left when the tab opens. Where the note shares a row with a button (Closures with + Close courts, Payment Methods with + Add payment method) the note now slides in on its own from the left and the button comes in from the top left (before v5.99 the whole row came in from the top left). **Waitlist** and **Admin Accounts** get just the note slide-in (their tables stay still). Starts after the splash; off with reduced motion.
- **Admin Calendar (v6.00; GSAP `calMotion`)**: **First display (removed in v6.08)**: the court filters and legend slide in from the left, the calendar comes in from the top left, and the note under it slides in from the left (about 0.9 s; after the splash on a fresh load). **Month / Week / Day / List**: the calendar body rises in and fades up, and the title fades in. **◀ ▶ arrows and Today**: the body (and the date title) slides in from the left going back, from the right going forward (about 0.55 s). **Court filter**: the body rises in quickly (about 0.45 s). **Bookings (fade-up removed in v6.09: they just appear)**: every time they load (first display, a new date range, a new filter) they stay hidden until ready, then fade up one after another (the whole set within about 0.6 s). **Loading spinner (v6.03; removed in v6.09)**: while bookings load, a small pill in the middle of the calendar shows a **spinning** lime ring and "Loading bookings…"; it disappears as soon as they've loaded (spins slower with reduced motion). **Loading shade (v6.07; removed in v6.09)**: while bookings load, the **whole calendar** (toolbar, grid and bookings) is dimmed under a dark, slightly blurred shade (fades in 0.2 s, out 0.3 s), with a larger card in the middle of the screen holding a bigger spinning lime ring and "Loading bookings…". The card stays in the middle of the screen even when the tall Week grid is scrolled. The buttons can still be clicked through the shade. **Booking hover (v6.07)**: hovering a booking (mouse) lifts it slightly, grows it a little and gives it a soft glow in its court color, above the bookings next to it (0.25 s); it settles back when the pointer leaves. In List view the row's text nudges right instead. **Booking click (v6.07)**: pressing a booking dips it (to 95 %); on release it springs back with a small overshoot and a lime ring flashes outward around it, then the booking opens. Holds and closures (not clickable) don't move. Hover and click motion are off with reduced motion; the shade then appears and disappears without fading. Off with reduced motion (everything shows at once).
- **Calendar: opens at once with a skeleton (v6.08)**: clicking the Calendar tab opens it straight away, without waiting for the courts or the calendar's code (a large download). Until they arrive, a **skeleton of the whole calendar** shows in its place with the same shimmer as the other admin skeletons: grey pill-shaped court filters, the real colour legend, the toolbar (arrow, Today and view buttons, date title) as grey bars, a week grid (day headers, hour labels, grid lines) with a few grey booking blocks, and the real note under it. Then the calendar replaces it **without an entrance animation** (the v6.00 first-display entrance is dropped, as with the other admin tabs in v6.02); View changes, arrows, Today and court filters animate as before. **Booking details card (v6.12, like Google Calendar)**: bookings have **no hover or press motion** (the v6.07 lift/glow and dip-and-spring are removed). **Clicking a booking or class opens a larger details card beside it**: to its right when there's room, otherwise to its left (or below it if neither side fits); on phones it opens full width just below the booking. The card keeps clear of the screen edges and the header. It shows a colour square for the court, the customer's name (or class title), the reference and status (e.g. "BK-1042 · Confirmed", "Pending approval", "Awaiting payment"), the date and full time range, then Court, Players, Equipment, Total, Phone and Email (classes: Court, Capacity, Fee, Rentals, and whether registration is open), and an **Open booking** / **Open class** button that opens the full booking or class page (where it can be approved, edited or cancelled). It pops in quickly (slight scale and fade, 0.14 s; instant with reduced motion). It closes with ×, Esc, clicking the same booking again, clicking anywhere outside it, or changing the dates, view or court filter; clicking another booking moves the card to that one. Holds and closures don't open a card. **Skeleton is the only loading state (v6.09)**: the skeleton stays until the calendar's first bookings have loaded too, then the calendar appears **with its bookings already in place**, all at once. The "Loading bookings…" spinner (v6.03), the dark loading shade (v6.07) and the bookings' fade-up (v6.00) are **removed**: when the bookings change later (arrows, Today, views, court filters) they simply appear. Booking hover and click motion (v6.07) stay (removed in v6.12, replaced by the details card).
- **Tab switching: text first, then data (v6.01)**: on every admin tab (Court Bookings tabs incl. Waitlist, Classes & Events tabs incl. Registration Controls, Management: Closures / Payment Methods / Equipment Inventory, Admin: Activity Log / Admin Accounts) the tab's text (title, tabs, note, and buttons that need no data such as + Add payment method) shows **at once**, without waiting for the database. The data (tables, payment method cards, the open/closed banner, buttons whose form needs data such as + Close courts / + Open registration) loads after it. While it loads, a **skeleton** shows in its place: grey bars shaped like the table (header, search row, rows) or cards, with a soft **shimmer** sweeping across (exempt from the "no animations" switch; still with reduced motion). **Smooth shimmer loop (v6.11, all skeletons: admin tabs, Calendar, Book page)**: a narrow soft highlight sweeps left to right across each grey bar at a steady speed (1.6 s per sweep); it starts and ends fully outside the bar, so each new sweep begins without a visible jump back. When the data arrives it simply **appears** in place of the skeleton, with **no entrance animation** (v6.02; v6.01 played the tab entrance on it). The skeleton itself also appears without sliding in. The tab entrance now moves only the text (the note) and buttons that need no data (+ Add payment method).
- **Past & cancelled (v5.88; Registration Controls, GSAP `expand`)**: still a plain expandable section, now with its own **arrow** (instead of the browser's triangle). **Opening**: the section grows from nothing to its full height while fading in, the arrow flips up with a small overshoot, then the table comes in from the top left and its rows fade up one after another (about 0.8 s). **Closing**: the section fades and shrinks away and the arrow flips back (about 0.3 s). Clicking again mid-animation turns it around from where it is. Off with reduced motion (opens and closes instantly; the arrow still flips).
- **Booking and class cards closing (v5.87)**: the cards opened by **View** (Dashboard, Court Bookings) and by **Registrations (n) / Cancel class** (Registration Controls) now also animate when they close, the same way as the Export window (contents fade, card sinks and shrinks as it fades, backdrop fades out; about 0.3 s), however they're closed: ×, Esc, clicking outside, the browser's Back button, or the automatic close after an action. **Reopening** plays the opening animation again every time, even if the card is reopened (e.g. browser Forward) while it's still closing. Off with reduced motion.
- **Registration Controls (v5.86; Classes & Events)**: hover border trace on **+ Open registration**, and on each class's **Registrations (n)**, **Close / Reopen registration** and **Cancel class**. The **Open registration** window opens and closes with the booking card / Export animation; inside it, **Open registration** and **Cancel** have the hover border trace. **Rentals switch**: the option picked (Offer paddle/racket rental, No rentals) gives a small springy pop; choosing No rentals makes the rental fee and quantity fields fade and shrink away (about 0.3 s), choosing Offer again makes them grow back open and fade in (about 0.4 s). The Registrations / Cancel class card plays the booking card's opening animation (backdrop fades in, card rises into place, its parts fade up one by one). Off with reduced motion.
- Respect `prefers-reduced-motion` (animations disabled/reduced).

---

### Home hero (v5.29; date calendar v5.30; steady size + animations v5.31)
Laid out from the client's sample, centred:
- **Split layout (v6.40; positions v6.41–v6.43; screens 700 px and wider):** the headline sits **15% of the hero's height down from its top** (v6.42; 30% in v6.41) and the lead line, search bar and facts row sit **5% of the hero's height up from its bottom** (v6.43; 10% in v6.41–v6.42), with a clear gap (at least 15% of the screen height, 60–140 px) between them so the wall mural in the background photo (the logo and "SMASH CORNER") isn't covered. On phones the hero stays one centred block.
- **Background (v6.28):** the hero has no background of its own; the site-wide parallax court photo (§4, "Parallax background") shows through it. (v6.27 had the photo on the hero band only, under a 72% black overlay.)
1. Headline "It all begins with a ball. / Life's a court. / Play it." (unchanged), then the line **"Tennis and pickleball courts in Quezon City. Book in under a minute."**
2. **Search bar**: one rounded bar holding, left to right (stacked full-width on phones, below 700 px):
   - **Sport toggle**: Tennis (ball icon) / Pickleball (paddle icon); the chosen one is lavender. Real radio buttons (arrow keys work). Switching slides the lavender highlight across to the other option (0.45 s, `power3.out`) while the label colours swap as it arrives (v5.31). The highlight always matches the chosen option's exact size and position (fixed v5.32: it came out taller than the option and hung below it).
   - **Date**: a button reading "Date **Today, Tue Nov 3**" (then "Tomorrow, Wed Nov 4", "Thu Nov 5", …; this short form is used here only, everywhere else dates stay mm/dd/yyyy). Clicking it opens a **month calendar** (v5.30; was a dropdown list in v5.29): Monday-first, today outlined, the picked day lavender, days outside today → 1 month ahead greyed out, ‹ › to switch months within the window. Picking a day closes it; Esc or a click outside closes it too. It opens upward when there isn't room below it on screen. **The date button is always the same width** (as wide as its longest possible label), so the bar never changes size when the date changes, and the new date **rolls up into place** (0.4 s) (v5.31).
   - **Check availability →** (lime): goes to the Book page with the sport and date (`/book?sport=tennis&date=…`). Works without JavaScript (the date is then today).
   - Reduced motion: the highlight and the date change without animating.
3. **Facts row** under the bar, small and muted with lavender icons: 📍 Quezon City · 🕖 Open 7 AM daily · 📦 Rackets and balls for rent.
- Replaces the "Book a Court" / "See the Courts" buttons and the Court + Date + "See open times" quick form. The ticker band below stays.
- **Book page with `?sport=`**: a sport with one court (Tennis) opens straight at that court's **Time** step for the chosen date; a sport with several courts (Pickleball) opens at **Choose a court** with the date kept, and picking a court goes straight to its Time step.

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

> Step order follows the §11 recommendation (court first), as built in the mockup. A progress bar at the top shows the 4 steps; customers can jump back to any completed step. A booking summary with the running price stays beside the steps. **Moving between steps is animated** (v5.33): the new step slides in and fades in (0.6 s, `expo.out`), from the right when going forward and from the left when going back (via the progress bar or Back). Off with reduced motion. **The booking summary animates too** (v5.34; Court booking and Class registration): a row that's added (the court price line, each rented item, the class rental) unfolds and fades in from the left, a row that's removed fades out to the right and folds shut, and a value that changes (court, date, time, a price, the total) drops into place. Nothing animates when the summary first appears. Off with reduced motion. **Switching between the Court booking and Class / event tabs is animated** (v5.35): a violet highlight slides from the old tab to the new one (0.45 s), and the new tab's panel slides in and fades in, from the right when moving to the later tab and from the left when going back. Without JavaScript the active tab is simply violet; with reduced motion the highlight jumps and the panel just appears.

### Step 1 — Select Court
- Tennis Court 1
- Pickleball Court 1
- Pickleball Court 2

### Step 2 — Select Date
- Month calendar view (Mon–Sun), with previous/next month arrows
- **Bookable up to 1 month in advance** (e.g. on 10/10/2026, up to 11/10/2026). Dates before today or beyond 1 month are greyed out.
- **Each date shows only its number** (v5.13; before, it also showed how many hours were open, "Full" or "Closed"). Status is told by shade alone, explained in the legend under the calendar; screen readers still hear it (e.g. "Tuesday, 11/10/2026, Full, waitlist available"). Today is outlined.
- Fully booked dates have a **dark red shade** and can still be opened to **Join Waitlist** (see §9)
- Days an admin has fully closed (see §7 Closures) are **greyed out with a dashed outline**, the same as dates outside the booking window
- Legend: Selected · Today · Full (waitlist available) · Closed / not bookable

### Step 3 — Select Time
Section title: **"Choose time slot"**. Customers pick straight from the grid of hours (no dropdowns):
1. **Click a start time.** Open hours show "Start here"; a hint above the grid says "Click your start time".
2. **The start time is highlighted and the grid stays put** (changed v4.12). Every chip keeps its own time and position; nothing is relabelled. The start chip shows "Your start", hours before it are dimmed, and the hours after it become end-time choices showing the duration (e.g. after picking 8:00 AM: 9:00 AM · End here · 1 hr, 10:00 AM · End here · 2 hrs). End choices only go up to the next booked hour, so a time slot is always one unbroken block; that booked hour itself (or **10:00 PM closing**, added as the last chip) can be the end time. Hovering an end time highlights the range. A **Change start time** link resets the start.
3. **Click the time you finish at** (e.g. 9:00 AM for 8–9 AM) and the time slot is added (e.g. Time slot 1 · 7:00 AM – 10:00 AM · 3 hrs) as a card with an **✕ button in its top-right corner** to remove it (v5.16; was a "Remove" link; screen-reader label "Remove time slot 1, 7:00 AM – 10:00 AM"). **The card animates** (v5.33): a new time slot card drops in and fades in (0.55 s), and so does a card that grows when a new pick joins it; removing one with ✕ fades it out sliding right, then folds it shut so the cards below close the gap. Cards already there when Step 3 opens just come in with the step. Off with reduced motion. **The hint card above the grid animates when its message changes** (v5.36; "1 Click your start time" → "2 Start: … Now click your end time" → "Your time is added…", and back with Change start time): the card stays in place, the new message slides in from the left and fades in, the step number pops in, and the card's height eases to fit if the message wraps differently. Not when the step first opens; off with reduced motion. **The buttons under the grid animate when they become available** (v5.38): when **Continue** becomes clickable (a time slot is added and no end time is pending) it settles from slightly smaller with a short brightness flash as it turns lime; when **+ Add time slot** becomes clickable it lights up the same way, and when **Cancel** takes its place while adding another slot (or it comes back) the button slides in from the left and fades in. **Becoming unavailable is animated too** (v5.39): when Continue or + Add time slot stops being clickable (e.g. the last time slot is removed) its colours fade to the shaded look while it settles back slightly, instead of switching at once. Not when the step first opens; off with reduced motion. **Step 4: choosing Yes for "Rent equipment?" reveals the equipment list animated** (v5.37): the list unfolds (0.45 s) and the items rise in and fade in one by one, top first (0.09 s apart). Coming back to Step 4 with Yes already chosen just shows the list with the step. Off with reduced motion.
4. To book more time on the same court and date, click **+ Add time slot**, then click a start time and an end time again (e.g. 1:00 PM – 4:00 PM). **Cancel** stops adding. **+ Add time slot is always shown** next to Continue (v5.39): shaded and not clickable, like Continue, until the first time slot is added (and when the day has no open times left); while adding another slot, Cancel takes its place.
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
The Book page has two tabs at the top: **Court booking** (the flow above) and **Class / event**. The Class / event tab shows how many classes are open. Both tabs share the same page heading ("Book a court or class"), so the switch stays in the same place when moving between them. **Switching tabs only swaps the content below the tabs** (v4.93): the page, heading and header do not reload, scroll position is kept, and anything half-filled in the other tab is still there when you switch back. The URL updates (`/book` or `/book?mode=class`) so links, refresh and the browser Back button land on the right tab. The future **Coach** tab (Phase 2) is added to the same switch and behaves the same way. **Tab data loading** (v4.94): only the tab the Book page opens on comes with its data. Normally that is Court booking: every court’s date and time availability for the whole booking window (today to 1 month ahead) arrives with the page, so the Date and Time steps open instantly with no loading. Every other tab (Class / event, and later Coach session) loads nothing until the customer first clicks it; its dates and times load then, once, and stay loaded when switching back and forth. (Opening `/book?mode=class` directly flips this: the class list comes with the page and Court booking loads on first click.) The "N open" count on the Class / event tab is still shown from the start. **Text first, then data (v6.04)**: opening the Book page (e.g. from the header's Book Now) shows the page text at once (eyebrow, title, lead and the tabs), without waiting for the database. The open tab's data (courts, equipment, date/time availability, or the class list) and the "N open" count load right after it. While it loads, a **skeleton** shows in its place, with the same soft shimmer as the admin skeletons (v6.01): for Court booking, the step bar (step names shown, the line under each a grey bar), a "Choose a court" panel with three court cards (grey picture box and bars) and the Booking summary box with grey lines; for Class / event, a "Choose a class" panel with three class rows (date block, title, fee) and the Registration summary box. The same Class / event skeleton shows while that tab's classes load on first click (replacing the old "Loading classes…" text). The "N open" badge appears on the tab when its count arrives. When the data arrives it simply appears in place of the skeleton. Availability shown from the page is refreshed quietly in the background when the customer reaches the Date or Time step, so it stays current without a loading state; the server still re-checks every slot when it is added to the cart.

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
- **Sign-in hand-off** (v5.66): as soon as the sign-in (and any email code) is accepted, the sign-in form is replaced by a "Signing you in…" screen with a spinner, and a "Loading the admin console…" screen shows while the console loads. All of these spinners animate (v5.92), including the sign-in form's own button spinner. The admin is taken straight to the console; if that hasn't happened after 6 seconds the page reloads into `/admin`, so the admin is never left on a blank page with only "Back to website". Opening the sign-in page while already signed in also goes straight to the console.
- **5 admin accounts**, created at setup (seeded), in **two roles**:

  | Role | Accounts | Can see and use |
  |---|---|---|
  | **Super-admin** | 2 | Everything: Dashboard, **Reports**, Court Bookings, Classes & Events, **Management**, Calendar, **Activity Log**, **Admin Accounts** |
  | **Admin** | 3 | Managing bookings: Dashboard, Court Bookings (approve, reject, cancel, edit/reschedule, waitlist, export), Classes & Events (registration controls, approve/reject registrations, export), Calendar |

  - **Only super-admins** see the **Activity Log** and **Reports (analytics)**. Management (Closures, Payment Methods, Equipment Inventory) and Admin Accounts are also super-admin only.
  - For admins, those sections are **hidden from the sidebar**, and the server refuses them too (role checked in Supabase RLS / API routes, not just hidden in the page).
  - Admins' Dashboard doesn't show revenue ("Approved · next 7 days" ₱); it shows "Class registrations to review" instead.
  - Admins' actions are still recorded in the Activity Log; only super-admins can read it.
  - The sidebar shows the signed-in person's role under their name.
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
| **Management** | **Closures** · Payment Methods · Equipment Inventory · Blacklist (v6.13) |
| Calendar | (none) |
| **Admin** | **Activity Log** · Admin Accounts |

Admins (not super-admins) only see Dashboard, Court Bookings, Classes & Events and Calendar (see Access above).

On phones (see §14 "Mobile navigation"), the sidebar becomes a sticky top bar with only the logo and a **☰ hamburger button** (v5.69), the **same design and animation as the public site's phone menu**: the three-line icon turns into ✕, and the full-screen menu rolls down from the top with the sections (big uppercase rows, current one in lavender with a chartreuse bar) fading in one after another, then the signed-in admin, View site and Sign out. It closes on ✕, Escape or choosing a section. The ☰ shows the number waiting for review as a small lime badge. Each section's tabs (e.g. Court Bookings: Requests, Awaiting payment, …) also become a dropdown: since v5.80 a **small button on the right** showing only the **current tab's name and a ▾ arrow** (no ☰ icon or count); tapping it opens the list of tabs, with their counts, right-aligned under it. **Court Bookings** (v5.82; a 4 × 2 grid of tab buttons in v5.81) **Classes & Events** (same design since v5.95) and **Management** (since v5.97): the dropdown sits on the **left**, and the button has the **page's black background with a lavender outline** (current tab's name + ▾); the list of tabs (Court Bookings: Requests, Awaiting payment, Verify payment, Approved, Rejected, Cancelled, Unpaid, Waitlist; Classes & Events: Registration Controls and its registration tabs; Management: its tabs) with counts opens left-aligned under it. **The tab list animates** in every section's dropdown (v5.82, GSAP `dropMenu`): opening, it unrolls downward from the button and the tabs fade in one after another (about 0.45 s); closing, the tabs fade and the list rolls back up (about 0.25 s). The ▾ flips as soon as it's tapped. Off with reduced motion. On phones the **Export to Excel** button (Court Bookings, Classes & Events) is **just a ⤓ download icon** (v5.81) that opens the same export window. Where it sits on phones: on **Court Bookings** (v5.85; above the table's top-right corner in v5.84) and **Classes & Events** (v5.95; was beside the tab dropdown, v5.83), at the **right end of the table's search row**, after the search box and row count, on every tab (Court Bookings including Waitlist); on Classes & Events' **Registration Controls** it sits instead **right beside + Open registration, on its right** (v5.96); when a tab has no search box (5 rows or fewer) or is empty, the icon sits alone at the right directly above the table. On wider screens it stays at the top right beside the title.

| Section | What it does |
|---|---|
| **Dashboard** | Today's bookings, pending count, quick links. The stat cards (To review, Bookings today, On waitlist, Approved · next 7 days) are plain cards with a thin grey outline: no colored top edge or lavender outline (v5.69). **View** on any Dashboard row (Requests to review, Payments to verify, Today on court) opens that booking as a **card over the Dashboard** (v5.70) instead of going to Court Bookings: the same details, proof of payment and actions as the booking page (Approve / Confirm payment, Reject, Edit / Reschedule, Cancel), with the booking reference and status as its title. **Opens instantly** (v5.74): the card for every booking listed on the Dashboard is loaded with the page, so clicking View shows it straight away with no loading or trip to the server. It **opens with an animation** (v5.75): the dark backdrop fades in, the card rises and grows slightly into place, then its parts (title, details, actions) fade up one after another (about 0.7 s; off with reduced motion). The address becomes `/admin?view=<id>` (so refresh keeps it open); ×, Esc, clicking outside or the browser's Back button closes it and keeps the scroll position. After an action the card closes and the Dashboard shows the result banner. The rows' **Reject** button still opens the booking page at the reject form. |
| **Reports** | Analytics dashboard with 8 KPIs, charts and a per-court table (see §19) |
| **Pending** | New bookings awaiting review; view/download proof of payment |
| **Approved** | Upcoming confirmed bookings; cancel or edit/reschedule |
| **Rejected / Cancelled** | History |
| **Classes & Events → Registration Controls** (v5.86) | Every class's registrations are loaded with the page, so **Registrations (n)** and **Cancel class** open that class's card **instantly** over the page (same card and opening animation as the booking cards): the class's court, date, time and slots taken, its registrations table, and the Cancel class section. **Cancel class** opens the same card scrolled to its cancel section. The address becomes `/admin/classes?view=<class id>`; ×, Esc, clicking outside or Back closes it. The separate class page still exists for direct links. |
| **View on Court Bookings tabs** (v5.76) | On every Court Bookings tab (Requests, Awaiting payment, Verify payment, Approved, Rejected, Cancelled, Unpaid), the card for every booking in the list is loaded with the tab, so **View opens that booking's card instantly** over the list, the same card and opening animation as the Dashboard's (details, proof of payment, and the actions for its stage), instead of going to a separate booking page. The address becomes `/admin/bookings/<tab>?view=<id>`; ×, Esc, clicking outside or Back closes it. The proof-of-payment image is the one part fetched when the card opens (receipt links expire after 10 minutes, so it can't be made in advance); "Loading proof of payment…" shows meanwhile. After an action the card closes and the tab shows the result banner. The rows' **Reject** button still opens the booking page at its reject form. Switching between tabs still loads each tab when it's opened. |
| **Waitlist** | All waitlist entries and their status; manually notify or remove |
| **Calendar** | **FullCalendar** view of all 3 courts: Month, Week, Day and List views. **Day view has one column per court** (Tennis Court 1, Pickleball Court 1, Pickleball Court 2) side by side. Bookings are colour-coded by court, pending bookings outlined, filter by court. Click a booking to view, approve, edit or cancel it. Classes show as striped blocks with slots taken (e.g. 3/12); click one to see its registrations. Opens on **Week** view on desktop and on **Day** view on phones (below 700 px), where the three court columns fit the screen; admins can still switch views. On narrow screens the toolbar (date range, Today, view buttons) always fits the screen; only the Week and Month grids scroll sideways. |
| **Classes & events → Registration controls** | Open, close, reopen and cancel class registration, and see each class's registrations; see "Classes & Events" below |
| **Classes & events → Pending / Approved / Rejected / Cancelled** | Class registrations across all classes, by status (Pending oldest first). Each row shows the class, participant, contact, rental, payment and total. View shows full details and proof of payment. Pending rows can be approved or rejected right from the list |
| **Closures** | Close courts for dates or hours; see "Closures" below |
| **Payment Methods** | Add, edit, hide/show, drag to reorder, and delete the payment options customers see (name, details, QR image); see §16 |
| **Equipment Inventory** | Admin adds and deletes rental items, sets each item's name, price and whether it is charged **per hour** or **per session** (v6.05), and enters and updates stock for each item (starting set: Tennis Rackets, Pickleball Paddles, Tennis Balls, Pickleball Balls). The booking form only offers what is available for that hour. |
| **Blacklist** (v6.13) | Super-admins list people who shouldn't book: **Full name, Phone number and Email** (at least one), plus an optional reason only admins see. A court booking request that matches **any** of a person's details goes to its own **Blacklisted** group on Court Bookings → Requests (see Blacklist Rules). |
| **Activity Log** | Who did what, when (super-admins only) |

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
- **Live preview** before downloading: how many records match, their total, and the first 5 rows. The download button is disabled when nothing matches. Every time a filter changes, the preview table shows a loading state (rows dim, spinner with "Loading records…"; placeholder rows if there was nothing to show yet) until the new results arrive. The spinner animates (it is an exception to the site-wide "no animations" rule in §4; it spins slower when the device asks for reduced motion).

**The file** is a real Excel workbook (`.xlsx`), named after the filters (e.g. `smashcorner_court-bookings_2026-10-01_to_2026-10-31.xlsx`):
- **Sheet 1, one row per record.** Header filters are on. Dates are real Excel dates formatted mm/dd/yyyy, and money is formatted in ₱.
  - **Court bookings:** reference, status, customer, email, contact number, court, booking date, time, hours, players, equipment, court fee, equipment fee, total, payment method, payment reference, submitted, reason, refund %, refund amount, edited by admin.
  - **Classes & events:** reference, status, class/event, court, class date, time, full name, nickname, age, email, contact number, rental, class fee, rental fee, total, payment method, payment reference, submitted, reason, refund %, refund amount.
- **Summary sheet:** when and by which admin it was exported, the filters used, and the count, total and refunded amount for each status.
- Every export is recorded in the Activity Log (what was exported, filters and number of records).
- Build note: generate the file with SheetJS (`xlsx`) on the server, from a Next.js route that only signed-in admins can call. Customer personal data never goes to a public URL.

### Google Sheets Sync (confirmed customer records, v6.18, v6.20)
Confirmed customer records are recorded to the **Smash Corner Records** Google Sheet by the **`record-to-sheets` Supabase Edge Function**. The website calls it **at the moment a record changes** (v6.20), not on a schedule:
- **Approved** (court booking, including free ones, or class registration): its row is written.
- **Edited** (admin reschedules or changes a confirmed booking): its row is rewritten in place.
- **Cancelled** (by an admin, by a court closure, or because the class was cancelled): its row is removed. Any notes on that row go with it.

- **Tabs:** `Court Bookings` and `Class Registrations`, using the same columns as Export to Excel (A to U). Row 1 is the header.
- **What is recorded:** approved records only. Rows are found by reference number (column A), so recording the same record again updates its row instead of adding a duplicate.
- **One-way:** the website is the official record. Corrections are made in the Admin Console; a manual change in columns A to U is overwritten the next time that record is recorded.
- **Staff notes:** columns V onward are never written, and rows may be sorted freely. Rows whose column A isn't a booking or registration reference (`SC-…` / `CL-…`) are left alone.
- **Failures:** a Google problem never fails the admin's action: the booking is already saved and the customer already emailed. The error is logged (website logs and Edge Function logs) with the reference numbers affected. There is no automatic retry, so a missed row is fixed by recording that record again or adding it by hand.
- **Setup:** a Google service account, shared on the spreadsheet as an Editor. Its JSON key (`SERVICE_ACCOUNT_KEY`), `GOOGLE_SHEETS_ID` and `SHEETS_SECRET` are **Supabase Edge Function secrets**; the website only holds the same `SHEETS_SECRET`, and the function only answers calls carrying it. Recording is off when `SHEETS_SECRET` isn't set on the website.
- **Same columns as Export to Excel:** both use one shared definition of the record columns, so the sheet and the Excel file can't drift apart. Access to the sheet stays Restricted because it holds customer personal data.

### Classes & Events (class registration)
- **Class registration is closed by default.** Nothing appears on the Book page until an admin opens registration.
- **Registration Controls layout (v5.96):** the "closed by default" note sits at the top, with the **+ Open registration** button under it; on phones the Export to Excel ⤓ icon sits right beside it, on its right (on wider screens Export stays beside the page title).
- **Open registration** form:
  - **Type** (v6.55): **Class** or **Event** (two-option switch, Class selected to start). Classes are listed under Programs, events under Events on the Programs & Events page (§2). Stored as `classes.kind` (migration `0008_class_kind.sql`; existing rows are classes).
  - Title
  - **Description** (v6.55, optional, up to 300 characters): one or two sentences shown on the Programs & Events page. Stored as `classes.description`.
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
  - If a check fails, the form stays open with the error shown at the top and everything the admin typed kept, so they can fix it and try again.
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
- The class list shows each one's type under its title ("Class · Pickleball Court 1" / "Event · …", v6.55); the Activity Log says "Event registration opened" for events.
- The tab badge counts registrations waiting for review. A banner says whether registration is open (and for how many classes) or closed.
- Upcoming classes are listed first. Past and cancelled classes are in a collapsible list.
- Every open, close, reopen, cancel, approve and reject is recorded in the Activity Log.

### Blacklist Rules (v6.13)
- **Management → Blacklist** (super-admins only): **+ Add to blacklist** opens a form with Full name, Phone number, Email (at least one is required) and an optional Reason (only admins see it). The list shows every person with the date and who added them, can be searched, and each row has **Remove** (asks to confirm). Adding and removing are recorded in the Activity Log.
- **Matching**: a booking request matches a person when **any one** of the details filled in for that person equals the request's: full name (ignoring capital letters, extra spaces, punctuation and accents), phone number (digits only; +63 / 63 is treated as 0, so +63 917 123 4567 = 0917-123-4567) or email (ignoring capital letters).
- **Court Bookings → Requests**: matching requests are taken out of the normal list and shown below it in a separate red-outlined **Blacklisted** group with its own count. Each one shows the customer's phone, a **Blacklisted · <which details matched>** tag (e.g. "Blacklisted · phone, email") and the reason. They can still be viewed, approved or rejected as usual.
- Matching happens whenever the Requests tab is shown, so adding someone also moves their requests that are already waiting, and removing them puts those requests back in the normal list.
- Customers never see the blacklist and can still send requests; nothing changes for them. (Class registrations aren't checked.)

### Equipment Inventory Rules
- Admin sets the total quantity owned for each item (e.g. 10 rackets).
- Availability is counted **per hour**: quantity owned minus quantity in Pending/Approved bookings for that hour.
- If an item is out of stock for the chosen hour, it is greyed out ("Not available for this time").
- Availability is loaded as soon as the details step opens. Until it arrives, items say "Checking availability…" (never "Not available" by mistake).
- Admin can mark items as damaged/out of service to reduce stock.
- **Add / delete items, per hour or per session (v6.05)**: **+ Add item** (top right of the tab) opens a form: name, sport (Tennis or Pickleball), price per item (whole pesos), **Charged: Per hour or Per session**, and how many are owned. In the table every item's name, price, Charged (per hour / per session), owned and out of service can be edited, then saved with one **Save inventory**. **Per hour**: price × quantity × hours booked. **Per session**: price × quantity, charged once per booking however many hours it is. Customers see "₱X per item, per hour" or "₱X per item, per session" on the Details step, and the Booking summary shows per-session items without the hours (e.g. "2 × Ball Hopper (per session)"). Each row has a **Delete** button (asks to confirm): the item is no longer offered to customers or shown in the table, but past bookings, carts, receipts and exports still show its name. The class rental items (Tennis Racket, Pickleball Paddle) show "Can't delete: rented in class registrations" instead of Delete (v6.06; was "Used for classes"), since class registrations rent them; set their owned count to 0 to stop offering them. If a sport has no rental items left, the Details step skips the "Rent equipment?" question. Item names must be unique. Adding and deleting items are recorded in the Activity Log.

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
- [x] Admin accounts: **5**, all receive notification emails: **2 super-admins** (everything) + **3 admins** (bookings only; no Reports, Activity Log, Management or Admin Accounts)
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
- [ ] The 5 admins' names and email addresses, and which 2 are super-admins
- [ ] Admin role details: should admins also manage Closures, Payment Methods or Equipment Inventory (currently super-admin only)? Should they be able to Export to Excel (currently yes)?
- [ ] Hostinger plan: Node.js web-app hosting (recommended) or VPS (see §18)?
- [ ] Class rentals: in the mockup each class has its own rental count. Should class rentals also come out of the shared Equipment Inventory for those hours?
- [ ] Should class fees count in Reports (§19)? The mockup only reports court bookings. (The monthly report email shows classes in a separate section, v6.21; the Reports page and its KPIs are still court bookings only.)
- [ ] Should admins be able to edit a class after opening registration (e.g. change time or capacity)? The mockup supports close, reopen and cancel only.
- [ ] Is age only for information, or should classes have an age range (e.g. Junior Clinic 7–15) that the form enforces?

---

## 13. Revision Rounds

- **Round 1:** after first full build (design, pages, booking flow) is delivered
- **Round 2:** after Round 1 feedback is applied
- Changes outside agreed scope (new pages, new features) are handled separately

---

## 14. Design & Color Theme

### Brand Palette (v4.19: black dark theme)

All colors are CSS custom properties on `:root` in the mockup (Tailwind theme tokens in the build), so a hex changes in one place.

**Brand colors**

| Token | Hex | Name | Role |
|---|---|---|---|
| `brand-violet` | `#330c65` | Indian Wells Blue Violet | Feature bands (ticker, CTA band, footer), selected states, active tabs. **Never as text on dark.** |
| `brand-lime` | `#bdf86c` | Pickleball Green | Main call to action only (**Book Now**, **Book a Court**, Pay); focus rings; selected-state border |
| `brand-chartreuse` | `#d4d62a` | Smash Corner Yellow Green | Primary-button hover; sparing accent (rating stars, Waitlist/Full badges, Tennis court color) |
| `brand-lavender` | `#b483d2` | Smash Corner Purple | Links, eyebrows, highlighted heading words, secondary buttons, pending states, prices |
| `brand-olive` | `#60744f` | Indian Wells Green | Borders, dividers, icons, large text only (slot borders, stepper progress) |

**Brand color integrity:** brand colors are only ever used at 100% of their exact hex. No opacity/alpha variants, no tints, no darken/lighten or `color-mix()`, no filters or blend modes, and no gradients involving a brand color. Anything that should look darker or subtler uses a neutral token instead.

**Dark neutrals (no color tint)**

| Token | Hex | Role |
|---|---|---|
| `bg` | `#000000` | Page background |
| `surface` | `#121212` | Cards, inputs, calendar cells |
| `surface-raised` | `#1e1e1e` | Modals, drawers, dropdowns, hover states, toasts |
| `border` | `#2e2e2e` | Default subtle borders |
| `text` | `#f5f5f5` | Headings and body text |
| `text-muted` | `#a3a3a3` | Captions, helper text, timestamps |
| `text-disabled` | `#666666` | Unavailable items |
| `error` | `#ff6b6b` | Errors and validation (not a brand color) |

Text on lime, chartreuse and lavender fills is black (`#000`); the primary lime/chartreuse button uses violet text.

Previous themes: `#5800FF` / `#E900FF` / `#FFC600` (v0.2); black / lime / lavender (v0.5 – v4.13); dark violet, olive background (v4.14 – v4.16); light off-white (v4.17); violet-tinted near-black with tinted accents (v4.18).

### Layout & Balance
- **About 70% black, 20% violet and dark neutral surfaces, 10% bright accents.**
- Navbar: `bg` with a 1px `border` bottom line. Hero: plain black; brand color appears only as solid elements (highlighted words, the primary button).
- Violet bands: the ticker strip under the hero and the "Ready to play?" CTA band. Footer: violet.
- Cards and panels: `surface` with `border` borders (court cards keep the lavender badge outline).
- **Never** lime, chartreuse or lavender as large backgrounds. Photo placeholders use `surface-raised` (or solid violet) with solid accent line art.
- **Court images (v6.64):** Tennis Court 1, Pickleball Court 1 and Pickleball Court 2 show the client's court layout images (`public/images/courts/t1.png`, `p1.png`, `p2.png`, picked by court id) instead of placeholder art, on the court cards (Home and Courts), the Book page's court picker and the cart. Each image is shown **whole** (never cropped), centred in a box with the **tennis image's shape** (462 × 482; v6.67, was 2:3 portrait in v6.65–v6.66 and the 4:3 placeholder box before; the cart thumbnails use the same shape), so **all three images are the same height**: the tennis image fills its box exactly, and the taller pickleball images are scaled to that height, narrower, with **blank** space at their sides (v6.66: the card's own dark background shows through; v6.64–v6.65 filled it with the images' green `#4acc5f`). The two pickleball images are uniform: same size (380 × 700) and the same layout in the same position, only the "Court 1" / "Court 2" label differs. A court with no image (e.g. one added later in the admin) keeps the placeholder art.
- **Lime discipline:** at most one or two lime elements per viewport. Per-card "Book this court" buttons are secondary (lavender outline); active tabs/nav use violet, not lime.

### Text Colors
- Headings and body: `text`. Captions/helper: `text-muted`.
- Highlighted heading words, eyebrows, small callouts: lavender (lime is kept for actions).
- On violet bands: `text` for body, lavender or lime for highlights.

### Buttons
- **Primary:** lime background, violet text; hover chartreuse.
- **Secondary:** transparent, lavender border and text; hover solid lavender with black text.
- **Disabled:** `surface-raised` background, `text-disabled` text (no opacity).
- **Ghost/tertiary** (`.btn-text`): text color, underlined; hover `surface-raised`.
- **Focus:** 2px lime outline with offset. Clipped-corner buttons use an inset 2px lime ring + `bg` gap ring instead, because `clip-path` cuts off an outer outline.

### Booking Calendar / Time Slots
| State | Look |
|---|---|
| Available | `surface`, olive border, `text` |
| Hover (available) | `surface-raised`, lavender border |
| Selected (day, start, range) | violet background, 2px lime border, `text` (lime sub-label) |
| Pending / in cart / held | `surface`, lavender border and text |
| Booked / unavailable / past | `surface`, dashed `border` border, `text-disabled`, struck-through, not clickable (no opacity) |
| Full (waitlist) | `surface` with dashed olive border; count in error red |
| Errors | error red for text, borders, icons |

Admin calendar court colors (`surface-raised` event + solid colored left bar + colored text): Tennis 1 chartreuse, Pickleball 1 lime, Pickleball 2 lavender.

### Other Components
- **Tags/badges:** solid accent with black text, solid violet with `text`, or outlined (transparent, accent border and text).
- **Inputs:** `surface`, `border` border, `text`; on focus lavender border + lime focus ring.
- **Dividers/icons:** `border` or olive; feature icons alternate lavender / olive.
- **Links:** lavender, underlined on hover.
- **Charts:** single series in lavender; hover `text`.
- **Arrows:** every arrow is the same thick arrowhead (a chevron with no shaft, heavy stroke, square ends) in the current text color, rotated for left/right/up/down. Used for link and caption arrows, Back/Next/Previous buttons, month and day navigation, dropdown carets, KPI up/down trend markers and the Demo bar tab. No arrow characters (→ ← ‹ › ▾ ▲ ▼).
- **Email previews** stay on white "paper" (they mimic a real email).

### Accessibility: Contrast Rules (WCAG AA)

| Combination | Ratio | Use |
|---|---|---|
| `text` on `bg` | ~19:1 | ✅ |
| Lime on `bg` | ~17:1 | ✅ |
| Black on lime / chartreuse / lavender | ~17 / 13 / 7:1 | ✅ Badges, secondary hover |
| Violet on chartreuse | ~10:1 | ✅ Primary button hover |
| White on olive | ~5:1 | ✅ |
| Chartreuse on `bg` | ~13:1 | ✅ |
| `text-muted` on `bg`/`surface` | ~7–8:1 | ✅ |
| Error red on `bg` | ~7.5:1 | ✅ |
| Lavender on `bg` | ~7:1 | ✅ |
| Off-white on violet | ~15:1 | ✅ |
| Lime on violet / violet on lime | ~12:1 | ✅ |
| Lavender on violet | ~5:1 | ✅ |
| Violet text on `bg`/`surface` | ~1.4:1 | ❌ Never |
| Olive for body/small text on black | ~4:1 | ❌ Borders, icons, large text only |
| White text on lime / chartreuse / lavender | — | ❌ Never |
| Tinted, transparent or gradient brand colors | — | ❌ Never |
| Lime and chartreuse as large adjacent blocks | — | ❌ Never |

### Usage Guidelines
- **Logo-inspired styling:** lavender outer borders on featured cards (like the logo badge) and **one clipped corner** on cards and buttons.
- **Animations:** *(paused for now, see §4)* lavender glow/outline on hover, CTA micro-bounce, ball-bounce loader on booking steps.
- The logo itself keeps its own colors (`#BB9AD0`, `#050505`, `#E0DE29`).

### Admin Console Status Colors
| Status | Color |
|---|---|
| Pending | Solid lavender, black text |
| Approved / Claimed | Solid lime, black text |
| Open | Lime outline + lime text |
| Waitlist | Solid chartreuse, black text |
| Full | Chartreuse outline + chartreuse text |
| Rejected / Cancelled | Error-red outline + error text |
| Notified | Violet with lavender outline and text |
| Edited | Outline badge |

### Logo Reference

The badge logo is used in the **splash screen** (§4), animated. The header and footer still use a text wordmark placeholder ("SMASH CORNER" in the heading font, lime on black).

**What the logo shows:**
- **Shape language:** a rounded badge with one cut corner (the "corner" in SmashCorner), thick black outline, lavender outer border, a bold check/swoosh and a ball.
- **Colors:** lime yellow, soft lavender and black. The site palette is now the designer palette above; the logo keeps its own colors.

### Mobile navigation
**Rule: no navigation bar ever scrolls sideways on a phone.** Any nav that would not fit collapses into a **hamburger menu** instead: a full-width ☰ button showing the current page or tab (plus its count, if any) that opens a dropdown list. Tapping an item, tapping outside or pressing Escape closes it.

| Navigation | Desktop | Phone |
|---|---|---|
| Public site header | Links in the header | ☰ hamburger icon button (three lines, no "Menu" text; screen-reader label "Menu") below 1100 px. It turns into an ✕ while open, and the links open in a full-screen panel under the header bar (v5.15), starting at the top, just below the bar (vertical centering tried in v5.52, reverted v5.53). **Cart and Book Now are inside the menu** (v5.17; v5.14–v5.16 kept a shortened "Book" button and the cart icon in the header bar): the bar shows only the logo and ☰. In the menu, after the page links, comes one row: the lime **Book Now** button filling the row, and a square **shopping-bag cart button** on its **right** (v5.21; it was on the left in v5.19–v5.20; no "Cart" text since v5.19; item-count badge when not empty; screen-reader label "Cart, 2 items"). While the menu is closed, the ☰ shows a small lime badge with the cart count when the cart isn't empty (screen-reader label "Menu, cart has 2 items"). |
| Admin sidebar (sections) | Left sidebar, always in view (stays put while the page scrolls) | Logo + ☰ hamburger in a sticky top bar (below 860 px), opening a full-screen menu with the same design and animation as the public site's phone menu (v5.69); the menu also holds signed-in admin, View site, Sign out |
| Admin section tabs (e.g. Pending / Approved / …) | Tab bar on one line, sized so every tab fits at common desktop widths; if a narrow window can't fit them, only a thin sideways scrollbar appears (never a vertical one) | Dropdown (below 700 px): a small right-aligned button with the current tab's name and ▾ (v5.80; was a full-width "☰ Tab (count) ▾" button); the list of tabs with counts opens under it. Court Bookings', Classes & Events' and Management's dropdowns are on the left, with a black button and lavender outline (Court Bookings v5.82, was a 4 × 2 grid of tab buttons in v5.81; Classes & Events v5.95; Management v5.97); the tab list unrolls open and rolls shut (v5.82) |
| Gallery section tabs | — | Removed in v6.52 (the Gallery has no sections); photos are 2 columns below 640 px |

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
- [x] Brand colors: resolved in v4.14. The site now uses the designer palette (§14); the logo SVG keeps its own colors (`#E0DE29`, `#BB9AD0`, `#050505`).
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

### Equipment Rental (per item, per hour or per session; starting set, admin-editable v6.05)
| Item | Rate | Available for |
|---|---|---|
| Tennis Racket | ₱150 / item / hour | Tennis |
| Pickleball Paddle | ₱100 / item / hour | Pickleball |
| Tennis Balls (can of 3) | ₱80 / item / hour | Tennis |
| Pickleball Ball | ₱30 / item / hour | Pickleball |

**Price example:** Pickleball Court 1, 2 hours, 4 paddles, 2 balls
= (₱350 × 2) + (₱100 × 4 × 2) + (₱30 × 2 × 2) = ₱700 + ₱800 + ₱120 = **₱1,620**

If an item is set to **per session** (v6.05), its price is charged once per booking: e.g. a ₱50 per-session item × 2 on a 3-hour booking = ₱100.

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
- **Delete** a method, after confirming ("Delete GCash? …"). Customers stop seeing it; past bookings paid with it still show its name
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
| Styling | **Tailwind CSS** | Fast to build the custom dark theme (brand tokens in the Tailwind config) |
| Animations | **Framer Motion** | Scroll-reveal, page transitions, stepper animations; supports reduced motion. *Not needed while animations are paused (§4); the splash has no dependencies* |
| Database | **Supabase (PostgreSQL)**, accessed with `@supabase/supabase-js` / `@supabase/ssr` | Decided; bookings, slots, waitlist, inventory, admins, activity log |
| Admin auth | **Supabase Auth** (email + password), **public sign-ups disabled**; the 5 admins are invited from the Supabase dashboard. Role (`super_admin` or `admin`) is stored in an `admins` table (user_id, name, email, role) | Admin-only login, no customer accounts. RLS policies and API routes check the role, so Reports, Activity Log, Management and Admin Accounts data can only be read by super-admins |
| Data security | **Row Level Security (RLS)** on every table | Public visitors can only see availability and create bookings; only signed-in admins can read customer data |
| File uploads (proof of payment) | **Supabase Storage**, **private** bucket; admins view receipts through short-lived signed links | Payment receipts contain personal data and are never public |
| Classes & registrations | **Supabase Postgres** | `classes` table (title, court, date, start, end, deadline, capacity, fee, rental_fee, rental_qty, status) and `class_registrations` table (class_id, ref, full_name, nickname, age, email, phone, rent, method, pay_ref, proof_path, total, status, reason). Proofs go in the same private receipts bucket. Capacity is checked inside a transaction so two people can't take the last slot |
| Payment method QR codes | **Supabase Storage**, separate **public** bucket (QR codes are meant to be shown to customers); uploaded by admins in Payment Methods | Name and details are stored in a `payment_methods` table (name, details, qr_url, active, sort_order, deleted) |
| Double-booking protection | Database unique constraint on court + date + time for active bookings | Two customers can never hold the same slot, even if they click at the same moment |
| Scheduled jobs | **Supabase `pg_cron`** + **Supabase Edge Functions** (v6.22) | **Every minute:** calls the `tick` **Edge Function**: expires 15-minute cart holds and 2-hour waitlist claims (and waitlist entries whose slot has started), sends the next waitlist email, expires court requests and class registrations not paid within 24 hours (customer emailed, hours released), sends the 24-hour reminders. Each job runs on its own, so one failing doesn't stop the others. Nothing scheduled runs in the website app. **1st of the month, 8:00 AM Manila:** calls the `monthly-report` **Supabase Edge Function**, which emails super-admins last month's report (§19). (Google Sheets is not a scheduled job: the `record-to-sheets` Edge Function is called when a record changes, §7) |
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

### Testing
- `npm run test:db`: booking SQL in PGlite. `npm run test:e2e`: booking, payment, waitlist and class flows against the Supabase project, no browser.
- **Phone testing over VS Code port forwarding** (v5.67): in development only, `next.config.ts` trusts `*.devtunnels.ms` (`allowedDevOrigins`) and lets server actions through when the tunnel's address and `localhost:3000` disagree (server actions `allowedOrigins`: `localhost:3000`, `*.devtunnels.ms`; fixed v5.68 — the tunnel rewrites the browser's Origin to `localhost:3000` while forwarding the tunnel address as the host). Without it, server actions from the phone (e.g. admin **Sign out**) fail with "Invalid Server Actions request". Production builds don't trust any extra origins.
- **Browser testing: Playwright CLI** (`@playwright/cli`, installed globally). Claude Code drives a real browser against `npm run dev` using the project skill in `.claude/skills/playwright-cli`. Test runs cover the public pages, court booking (cart → request → done), class registration, admin approval → customer payment → verify, and edge cases (bad pay links, empty cart, signed-out admin).
- Browser test bookings use `e2e.ui.*@example.com` emails. `npm run test:cleanup` deletes them. Admin sign-in for tests is done by hand once and saved as a local storage state, never committed.

---

## 19. Reports (Admin Analytics)

A **Reports** tab in the Admin Console, **visible to super-admins only** (§7 Access). Super-admins pick a date range (Last 7 days, Last 30 days, Month to date, Next 14 days, or **Custom**) and a court (All or one court). Every KPI shows the change versus the previous period of the same length.

**Custom range (v6.14, v6.15):** the **Custom** chip opens From and To date boxes **instantly, without loading anything**, pre-filled with the dates currently shown. The report keeps showing its current data until **Apply** is clicked, and then the whole page updates. Picking a preset instead closes the boxes. Past and future dates are both allowed, and a single day works. If From is after To, the two dates are swapped. A custom range covers at most **366 days** (the chart draws one bar per day); a longer range is shortened from the From date and a note says so. The chosen dates and court stay in the page link, so a custom view can be bookmarked or shared with another super-admin.

**Custom opening animation (v6.17, GSAP):** clicking **Custom** slides the date row open, pushing the report down smoothly, while From, To and Apply fade up one after another (about 0.5 s). It plays only when Custom is clicked, not when a page opens on a custom range or after Apply. Reduced motion shows the row straight away.

**Filter loading (v6.16):** clicking a date range or court highlights it instantly. The data then loads, with a shimmering **skeleton** shaped like the report (date line, KPI cards, daily chart, utilization and busiest-hours bars, per-court table) in its place until the new figures arrive. **Custom** loads nothing until **Apply** is clicked, then shows the same skeleton. Clicking the filter that is already showing does nothing.

**Card look (v5.94):** KPI cards are plain, like the Dashboard stat cards: a thin border all round, no colored (olive-green) top edge.

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

**KPI number animation (GSAP):** when the cards come into view, money and percentages count up from 0 to their value (`countUp`, 2 s, eases out; money with thousands separators at any size, e.g. ₱0 → ₱12,345,678; percentages to one decimal). **Total Bookings** rolls like an odometer instead: each digit's 0–9 strip slides to its place (`digitRoll`, 1.5 s). Changing the date range or court counts or rolls on from the previous numbers. The final value is what screen readers hear and it reserves the card width, so nothing shifts while counting; the number shrinks with a narrow card so 7–8 digit amounts stay on one line. Reduced motion shows the final numbers straight away.

**Definitions**
- Bookings count toward the period by **play date** (not the date they were submitted).
- **Available court-hours** = number of courts × 15 open hours (7 AM–10 PM) × days, **minus hours closed in Closures** (see §7).
- Revenue includes court fees **and** equipment rental.

### Charts
- **Net revenue by day:** column chart, with a tooltip per day showing net, total, refunds, bookings and court-hours. Date labels stay small text however wide the chart is, and the first and last labels are kept inside the chart edges. When the chart scrolls into view, all bars grow up from the baseline together (GSAP `barChartGrow`, 2 s, no stagger, `power2.inOut` easing: starts slow, speeds up, then settles); with reduced motion they appear at full height straight away. **Click a bar** (or focus it and press Enter) to open that day's details under the chart: net revenue, total revenue, refunds, bookings, court-hours used and utilization, then every booking that day (ref linking to the booking, court, time, customer, total, status). The chosen bar is highlighted; click it again, press Esc or × to close. **Click animation (GSAP):** the clicked bar springs (a quick squash and bounce from its base); the panel slides open while the figure cards and booking rows fade up one after another, and slides shut when closed. Picking another day while the panel is open only replays the fade-up. Reduced motion turns these off
- **Utilization by court:** horizontal bars per court
- **Busiest hours:** utilization % for each hour of the day, with the peak hour called out (or "No confirmed bookings in this range." when there are none)
- **By court:** table with every KPI per court plus an all-courts total (this also serves as the accessible table view of the charts)

### Monthly report email (v6.21)
On the **1st of every month at 8:00 AM** (Manila time), every **super-admin** is emailed the report for the **previous calendar month** (e.g. on December 1, the November report).

- **Recipients:** every account in Admin Accounts with the super-admin role, one email each. Admins without the super-admin role don't get it. Adding or removing a super-admin changes who gets the next one automatically.
- **Court bookings:** the 8 KPIs above for the whole month, all courts, each compared with the **month before** (▲/▼ and the % change; "new" when the month before was zero; "—" when both are zero). Same rules and numbers as the Reports page for that month (by play date, closures subtracted).
- **Classes & events (separate section):** confirmed registrations, class revenue (approved + cancelled with a refund, before refunds), refunds and net class revenue, for classes held that month, each compared with the month before. These are **not** added to the court KPIs.
- **Link:** an "Open Reports for <month>" button opens the Reports page already set to that month (Custom range).
- **Excel attachment:** one workbook, `smashcorner_monthly-report_YYYY-MM.xlsx`, with that month's **confirmed (approved) records only**: a Court bookings sheet (by booking date), a Class registrations sheet (by class date) and a Summary sheet. Same columns and formats as Export to Excel. The email reminds super-admins it holds customer personal data.
- **Empty month:** the email is still sent, showing zeros, with no attachment (the email says so).
- **Activity Log:** each send is logged as "Monthly report sent" (System), with the month as the reference and the recipients in the note. A month already in the log is not sent again, so a repeated or retried call can't email twice.
- **How it runs:** the `monthly-report` **Supabase Edge Function**, called by its own `pg_cron` job (`0 0 1 * *` UTC = 8:00 AM Manila). The KPI maths is one shared file used by both the Reports page and the function, so the email can't drift from the page. The function can also be called by hand for a given month (`{"month": "2026-10"}`), and with `"force": true` to send a month again.

### Implementation notes
- Computed in Supabase with SQL views or RPC functions, so the numbers come from one source of truth.
- Charts are a single series in brand lavender. The brand colors don't pass the colorblind-safety check as a three-color set, so courts are identified by labels, not colors.
- Optional later: CSV export of the table.

---

## 20. Mockup Demo

- **File:** `mockup/index.html` (single static HTML page, no build step)
- **Live preview:** https://claude.ai/artifact/B12bUVmSg1uH2ErZJs8dEJ (private until shared from the page's Share menu)
- **Demo admin login:** admin1@ to admin5@smashcorner-qc.com · password `demo1234`. **admin1@ and admin2@ are super-admins**; admin3@ to admin5@ are admins (bookings only)
- A "Demo" bar shows the emails the system would send and can reset the sample data. It is **collapsible** (v4.10): click "Demo ‹" to collapse it into just a small › arrow tab attached to the left edge of the screen (v4.11), click the arrow to open it again; the browser remembers which way you left it.
- **Sample classes / events (demo only).** On the live site, class registration still starts closed (§7). Dates are relative to today, and each class is placed in a free time on its court so it never clashes with sample bookings:
  | Class | Court | When | Capacity / fee | Rentals | Status |
  |---|---|---|---|---|---|
  | Pickleball 101: Beginners Clinic | Pickleball Court 1 | +4 days, 2 hrs | 12 · ₱500 | Paddle ₱100 (8) | Open: 5 approved, 2 pending, 1 rejected |
  | Junior Tennis Clinic (Ages 7–15) | Tennis Court 1 | +6 days, 2 hrs | 8 · ₱800 | Racket ₱150 (6) | Open: 3 approved, 1 pending |
  | Pickleball Social Night: Doubles Mixer | Pickleball Court 2 | +9 days, 3 hrs (evening) | 8 · ₱350 | Paddle ₱100 (6) | Full: 6 approved, 2 pending |
  | Adult Tennis Drills (Intermediate) | Tennis Court 1 | +12 days, 2 hrs | 6 · ₱600 | None | Closed by admin: 2 approved |
  | Friday Pickleball Open Play | Pickleball Court 1 | 5 days ago, 3 hrs | 10 · ₱300 | Paddle ₱100 (6) | Finished: 7 approved |
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
| v4.14 | Theme switched to the designer palette: Indian Wells Blue Violet `#330C65` base (background `#1A0733`), Smash Corner Yellow Green `#D4D62A` (primary), Smash Corner Purple `#B483D2` (secondary), Pickleball Green `#BDF86C` (success/approved), Indian Wells Green `#60744F` (reserved). Text on accents is deep violet; splash background now `#1A0733`; §14 updated |
| v4.15 | Page background changed to Indian Wells Green `#60744F` (sticky header and splash screen too); cards/panels stay Blue Violet; muted text lightened to `#E4DCEE`; §14 contrast rules updated for the green background |
| v4.16 | Exact brand hex codes from the designer replace the sampled ones: Indian Wells Green `#60744F`, Indian Wells Blue Violet `#330C65`, Smash Corner Purple `#B483D2`, Pickleball Green `#BDF86C`, Smash Corner Yellow Green `#D4D62A` |
| v4.17 | Light theme: off-white `#FAF9F6` page with violet header, footer, hero and CTA band; all colors moved to named `--brand-*` / semantic tokens on `:root`. Pickleball Green is now the primary CTA (hover Yellow Green); headings/links violet on light, lime on violet; captions olive. New slot states (available white/olive border, selected violet, pending lavender, booked gray). Status colors reassigned (Pending lavender, Waitlist/Full chartreuse). Error red `#C62828`. Splash background now violet. §14 rewritten |
| v4.18 | Dark theme: near-black `#0E0B12` page, `#17131D` surfaces, `#211B29` raised, off-white text, `#A8A3AF` muted, error `#FF6B6B`. Header is near-black with a border line; hero has a radial violet glow; ticker, CTA band and footer are violet. Lime reserved for main CTAs (court-card buttons now secondary; active tabs violet). Secondary buttons lavender outline; links lavender; badges and pending states are 15% accent tints; selected slots violet with lime border; booked `#1C1922`. Splash background `#0E0B12`. §14 rewritten |
| v4.19 | Black dark theme: `#000000` page, neutral grays (`#121212`, `#1e1e1e`, `#2e2e2e`, text `#f5f5f5`, muted `#a3a3a3`, disabled `#666666`). Brand-color integrity rule: brand colors only at their exact hex, no tints/alpha/gradients/filters. Removed the hero glow and all 15% tints; badges are solid (black text) or outlined; pending = lavender outline on surface; booked = dashed border + disabled text (no opacity); disabled buttons use neutrals; secondary hover is solid lavender with black text. Splash background `#000000` |
| v4.20 | All arrow symbols replaced with one thick arrowhead icon (chevron, no shaft), rotated per direction: links/captions, Back/Next/Previous, month/day nav, dropdown carets, KPI trend markers; Demo bar tab chevron thickened. §14 Other Components updated |
| v4.21 | Bug fix: mockup showed raw JavaScript as page text when opened with a dev server that injects a reload script (e.g. VS Code Live Server). Cause: the new arrowhead icon wrote an unescaped closing svg tag inside a script string; it is now escaped like the rest of the file. Rule: closing tags inside script strings are always written escaped |
| v4.22 | Admin roles: 2 **super-admins** (everything) + 3 **admins** (manage bookings: Dashboard, Court Bookings, Classes & Events, Calendar). Only super-admins see Reports (analytics) and the Activity Log; Management and Admin Accounts are also super-admin only. Hidden sections are blocked server-side too (role in an `admins` table, checked by RLS). Admins' dashboard hides revenue. Mockup: admin1@/admin2@ are super-admins; role shown in the sidebar and Admin Accounts |
| v4.91 | Coaches no longer have photos: removed the coach photo placeholder from the Programs & Events "Our coaches" cards and from the Phase 2 "Choose a coach" picker on Book; cards now show name, sport/experience (and in Phase 2 rate, hours and Book button) only. Unused coach illustration removed from the placeholder art (mockup and art.tsx) |
| v4.92 | Home: removed the thick colored top border from the "Why choose us" cards (lavender/olive) and the "Players say" testimonial cards (chartreuse); they are now plain surface cards with the thin line border. Admin stat/KPI cards keep theirs |
| v4.93 | Book page: switching between Court booking and Class / event (and the future Coach tab) no longer reloads the whole page; only the tab content swaps, scroll and half-filled forms are kept, and the URL (`?mode=class`) still updates for links/refresh/Back. "Book a court instead" on a closed Class tab switches tabs the same way. §6 updated |
| v4.94 | Book page tab data: the tab the page opens on (normally Court booking) gets its date/time data with the page, so Date and Time steps show instantly; other tabs (Class / event, future Coach session) load their data only on first click, once. Class / event "N open" count still shown up front. Court availability refreshes silently on the Date/Time steps. §6 updated |
| v4.95 | Browser testing with Playwright CLI: installed, Claude Code skill added to the project, `npm run test:cleanup` removes browser-test data (`e2e.ui.*@example.com`). §18 Testing added |
| v4.96 | Admin layout fixes found in browser testing: Calendar toolbar/date range no longer cut off on phones (only the grid scrolls sideways); Court Bookings / Classes tab bars fit on one line at desktop width with no stray vertical scrollbar; phone admin top bar no longer stretches into an empty band on short pages; Reports chart date labels no longer oversized or clipped, and Busiest hours no longer names a "peak" when nothing is booked. §7, §14 Mobile navigation, §19 updated |
| v4.97 | Admin Calendar opens on Day view (one column per court) on phones below 700 px instead of Week view; desktop still opens on Week. Day and List views no longer scroll sideways on phones. §7 updated |
| v4.98 | Booking form: equipment availability loads when the details step opens and shows "Checking availability…" until it arrives, instead of briefly saying "Not available". Payment Methods: Delete asks for confirmation. Open registration: a failed check keeps the form open with the error and the typed values. §7, §16 updated |
| v4.99 | Reports: Net revenue by day bars grow in one after another when the chart scrolls into view (GSAP `barChartGrow`; gsap added as a dependency); reduced motion skips the animation. §19 updated |
| v5.00 | Reports: click a Net revenue by day bar to open that day's details (figures plus every booking that day, linked); all bars now grow up together instead of one after another. §19 updated |
| v5.01 | Reports: Net revenue by day bar animation lengthened from 0.8 s to 2 s. §19 updated |
| v5.02 | Reports: Net revenue by day bars use `power2.inOut` easing (slow start, faster middle, gentle stop) so the motion fills the 2 s. §19 updated |
| v5.03 | Reports: clicking a Net revenue by day bar is animated (bar springs; details panel slides open with cards and rows fading up, slides shut on close; switching days replays the fade-up). Off with reduced motion. §19 updated |
| v5.04 | Reports KPI cards: money and percentages count up (GSAP `countUp`, works for millions), Total Bookings rolls like an odometer (GSAP `digitRoll`); range/court changes animate from the previous values; numbers shrink to stay on one line in narrow cards. §19 updated |
| v5.05 | Public site: scroll blur (GSAP `scrollBlur`): text blurs, fades and slides in as it enters from the bottom 15% of the screen and blurs out over the top 15%, following the scroll position; header, dialogs, forms, buttons and images unaffected; not in the Admin Console; off with reduced motion. §4 updated |
| v5.06 | Home: entrance animation right after the splash (GSAP `heroIntro`: eyebrow, masked headline lines, lead, buttons, quick-book form, ticker; ~2.6 s; off with reduced motion). Scroll blur (v5.05) removed from the whole site. §4 updated |
| v5.07 | Home entrance made restrained and professional: one long `expo.out` deceleration throughout, no springs or pops; header settles in first, eyebrow letters track in, slower masked headline rise, lead comes into focus, buttons and form glide up, ticker wipes in left to right (~2.7 s). §4 updated |
| v5.08 | "Play it." shine on Home: after the entrance finishes, a band of light sweeps across the words, repeating every 5 s (GSAP `textShine`, gradient clipped to the text). Off with reduced motion. §4 updated |
| v5.09 | "Play it." shine now plays once, slower (2 s) so it's noticeable. New hover border trace on Book Now, Book a Court and See the Courts: a line draws around the button's outline (`BorderTrace.tsx`, `.trace`). §4 updated |
| v5.10 | Removed the violet bottom shadow from the lime Book Now and Book a Court buttons. §4 updated |
| v5.11 | Hover border trace now on every lime and ghost button across the public site (auto-applied, incl. buttons that appear later; not disabled buttons or admin). Removed the hover underline on link-buttons. §4 updated |
| v5.12 | Phone menu animates: dropdown unrolls from the header with links dropping in one by one, ☰ morphs to ✕; rolls back up on close. §4 updated |
| v5.13 | Booking Date step: days show only the date number (no "N open" / "Full" / "Closed" text); full days get a dark red shade, closed days are greyed with a dashed outline; legend adds Closed; status still read out to screen readers. §6 updated |
| v5.14 | Phone header keeps the Book button (shortened to "Book" at 420 px and below; was hidden). §14 Mobile navigation updated |
| v5.15 | Phone menu is now a full-screen panel: comes down from the top, then the links fade in one by one (0.8 s total); header bar stays on top; page scroll locked while open. §4 and §14 updated |
| v5.16 | Booking Time step: each time slot card's "Remove" link replaced by an ✕ button in the card's top-right corner. §6 updated |
| v5.17 | Phone header (below 1100 px): Cart and Book Now moved from the header bar into the ☰ menu (Cart row with count + full-width Book Now); ☰ shows a cart-count badge while closed. §4 and §14 updated |
| v5.18 | Landing entrance no longer animates the header; only the page content below it animates after the splash. §4 updated |
| v5.19 | Hover border trace also on lavender-outline buttons (e.g. "See open times"). Phone menu: "Cart" row replaced by a shopping-bag button to the left of Book Now, on one row. §4 and §14 updated |
| v5.20 | Fix: closing the phone menu no longer flashes the fully open menu for a frame at the end of the close animation. §4 updated |
| v5.21 | Phone menu: shopping-bag cart button moved to the right of Book Now. §14 updated |
| v5.22 | Landing entrance: "Play it." now glides in from off the left edge of the screen (fading in) instead of rising; the shine still follows. §4 updated |
| v5.23 | Home scroll reveals: section headings slide in from the left as they start to come into view, the lime line under each title draws out left to right, cards rise in one at a time left to right; "Ready to play?" band slides in. §4 updated |
| v5.24 | Fix: Home scroll reveals crashed ("Cannot read properties of undefined (reading 'end')") when the page loaded already scrolled past a section; they now play straight away instead. §4 updated |
| v5.25 | Home hero: removed the "Tennis · Pickleball · Quezon City" eyebrow tag above the headline (and its entrance animation). §3 and §4 updated |
| v5.26 | Landing-page motion on every other public page: page-top entrance (eyebrow, masked title rise, lead into focus) after the splash, plus the same scroll reveals (headings from the left, title line draws out, cards one at a time left to right). Scroll reveals now also wait for the splash. §4 updated |
| v5.27 | Contact FAQ: answers slide open/closed with a fade, chevron turns (replaces the browser marker). §3 and §4 updated |
| v5.28 | Intro paragraphs (Home hero lead, page-top leads, section intros) now slide in from the right; titles and eyebrows still come from the left. §4 updated |
| v5.29 | Home hero relaid out from the client's sample: new lead line, search bar (Tennis/Pickleball toggle, date, Check availability →) and facts row (Quezon City · Open 7 AM daily · Rackets and balls for rent); replaces the two hero buttons and the old quick form. Book page accepts `?sport=`. Content area clips sideways overflow so right-sliding paragraphs can't be panned to on phones. §3, §4 updated, "Home hero" added |
| v5.30 | Home search bar: date picked on a pop-up month calendar instead of a dropdown (opens upward when there's no room below). "Home hero" updated |
| v5.31 | Home search bar: date button fixed width so the bar never resizes; new date rolls into place; Tennis/Pickleball highlight slides between options. "Home hero" updated |
| v5.32 | Fix: Home search bar sport highlight was taller than the chosen option and sat lower than it; it now matches the option exactly. "Home hero" updated |
| v5.33 | Page-top entrance on every public page except Home (Courts, Gallery, Programs & Events, Contact, Book, …): the eyebrow and title now slide in from the left like the section headings, instead of the title rising from its baseline; lead still from the right. Sub tabs (Programs & Events jump buttons, Book tabs, Gallery section tabs) then appear one by one from the left. Book › Court booking: moving between steps is animated (forward from the right, back from the left), and Step 3 time slot cards animate in when added and out when removed. §4 and §6 updated |
| v5.34 | Book: the booking summary (Court booking and Class registration) animates when rows are added or removed and when a value changes. §6 updated |
| v5.35 | Book: switching between the Court booking and Class / event tabs is animated (sliding highlight; panel slides in from the side you moved toward). §6 updated |
| v5.36 | Book › Court booking Step 3: the hint card ("1 Click your start time" etc.) animates its new message each time it changes. §6 updated |
| v5.37 | Book › Court booking Step 4: choosing Yes for Rent equipment? unfolds the equipment list with the items appearing one by one. §6 updated |
| v5.38 | Book › Court booking Step 3: Continue animates as it becomes clickable, and + Add time slot / Cancel slide in when they appear. §6 updated |
| v5.39 | Book › Court booking Step 3: + Add time slot is always shown (shaded until the first time slot is added); Continue and + Add time slot fade back to shaded, animated, when they stop being clickable (e.g. the last time slot is removed). §6 updated |
| v5.40 | Book › Court booking: removed the violet bottom shadow from the Continue (Step 3) and Add to cart (Step 4) buttons. §4 updated |
| v5.41 | Cart: removed the violet bottom shadow from the Continue to request button. §4 updated |
| v5.42 | Cart: clicking Continue to request fires a GSAP confetti burst (confettiBurst, Physics2DPlugin) from the button, then opens the Booking request page. §4 updated |
| v5.43 | Booking request: removed the violet bottom shadow from Send booking request, and the confetti burst moved here from the Cart page's Continue to request (fires when the request is sent with the policy box ticked). §4 updated |
| v5.44 | Removed the violet bottom shadow from Book a court on the empty Cart page and Back to home on the request-sent page. §4 updated |
| v5.45 | Contact: sending the form plays a paper-plane animation (message printed on a sheet, folded into a plane that flies into the Send button) and the button opens into a receipt with Write another. §4 updated |
| v5.46 | Contact FAQ: the chevron now actually animates (flips with a small overshoot; it was snapping because CSS transitions are switched off site-wide), and an opened answer's text appears line by line, each line wiping in left to right; open/close made faster (≈0.45 s / 0.25 s). §2 and §4 updated |
| v5.47 | Request-sent page: header (eyebrow + title) slides in from the left, then the content slides in from the right, block by block; background confetti removed; "To cancel or reschedule…" note loses its violet left edge. §4 updated |
| v5.48 | Request-sent page entrance: everything now comes in at once (header from the left, content from the right, same moment) instead of one block after another. §4 updated |
| v5.49 | Header: smooth gliding hover pill across the nav tabs, press squash-and-spring on tabs, shopping-bag button swings on hover and squashes/springs on click (badge pops). §4 updated |
| v5.50 | Contact: removed the violet bottom shadow from the Send message button. §4 updated |
| v5.51 | Header: click animation on the nav tabs and shopping-bag button toned down: smaller dip, short settle with a small overshoot instead of the elastic bounce; smaller badge pop. §4 updated |
| v5.52 | Phone menu: the links and the Book Now / cart row are now vertically centered in the open menu (below the header bar) instead of starting at the top; on short screens it still scrolls from the first link. §14 updated |
| v5.53 | Phone menu: reverted v5.52; the links and Book Now / cart row start from the top again, just below the header bar. §14 updated |
| v5.54 | Home entrance on phones: the ticker band (words wrapped onto several rows) now opens top to bottom and its words slide in from the left, left to right, row by row; desktop keeps the left-to-right wipe. §4 updated |
| v5.55 | Fix to v5.54: on phones the ticker band now wipes in left to right row by row (1st row, then 2nd, …) instead of opening top to bottom. §4 updated |
| v5.56 | Gallery: on phones the 4 section tabs are side by side in one row (no ☰ dropdown); clicking a tab glides smoothly to its section; the violet highlight slides between tabs as the section on screen changes (also while gliding, passing the tabs in between). §2, §4 and §14 updated |
| v5.57 | Fix: Gallery tab highlight no longer bounces twice when it moves to the next tab while scrolling (it was snapped to the end mid-slide, then pulled back). §4 updated |
| v5.58 | Programs & Events tabs get the Gallery tab behavior: sticky under the header, one row on phones with one-line centered labels, smooth glide to the section on click, sliding lavender highlight that follows the section on screen. Gallery and Programs & Events: a tapped tab no longer stays highlighted on touch screens. §4 updated |
| v5.59 | Fix: on iPhone (Safari), clicking a Gallery or Programs & Events tab only moved the page a little and stopped; the glide now runs all the way to the section (stopped only by a real touch, wheel or scroll key). §4 updated |
| v5.60 | Fix: on iPhone (Safari) the Gallery tabs' sliding highlight was invisible (the grey tab backgrounds were painted over it); the grey backgrounds are now separate shapes drawn under the highlight. §4 updated |
| v5.61 | Fix: Gallery tab highlight still invisible on iPhone. A resize of the tab row during the page entrance cancelled the highlight's fade-in, leaving it hidden; resizes now only reposition it (also applies to the Programs & Events tabs). §4 updated |
| v5.62 | Fix (iPhone/Safari): during a long tab glide on the Gallery (e.g. Amenities → Pickleball Courts), bits of the page flashed over the header and tab bar for a split second; the sticky header and tab rows now each get their own compositing layer so they stay on top (the header only while the phone menu is closed). §4 updated |
| v5.63 | Gallery tabs use the same type as the Programs & Events tabs: Lexend Deca, regular weight, .8rem (were semi-bold, .88rem; .78rem on phones). §4 updated |
| v5.64 | Programs & Events tabs: highlight now matches the Gallery tabs: dark violet with a lavender outline and white text (was a plain lavender pill with dark text). §4 updated |
| v5.65 | Programs & Events tabs: page-entrance animation now identical to the Gallery tabs (grey tab backgrounds are separate shapes under the highlight); fixes the first tab showing grey/white for a moment before being highlighted. §4 updated |
| v5.66 | Admin sign-in: after the code is accepted the page no longer looks frozen (only "Back to website" was left showing). It now shows "Signing you in…", then a console loading screen, and goes straight to the console (forced reload after 6 s as a fallback). §7 Access updated |
| v5.67 | Dev only: server actions (e.g. admin Sign out) now work when testing on a phone through VS Code port forwarding (`*.devtunnels.ms`); fixes "Invalid Server Actions request". §18 updated |
| v5.68 | Fix to v5.67: VS Code port forwarding rewrites the browser's Origin to `localhost:3000` (the tunnel address arrives as the forwarded host), so dev server actions now also trust `localhost:3000`. Admin Sign out on a phone works through the tunnel. §18 updated |
| v5.69 | Admin console: removed the "Admin Console" pill above each page title; Dashboard stat cards no longer have the colored (olive / lavender) top edge and lavender outline; on phones the top bar is just the logo + ☰ hamburger, opening a full-screen menu identical in design and animation to the public site's phone menu (was a "☰ Section ▾" dropdown). §7 Console Sections, §14 Mobile navigation updated |
| v5.70 | Admin Dashboard: entrance animation (title from the right; stat cards from the top left one by one, row by row, left to right; each section header from the right, then its table from the top left). "View" on a Dashboard row now opens the booking as a card over the Dashboard (`?view=<id>`) instead of going to Court Bookings; the booking page and the card share one component. §4, §7 Console Sections updated |
| v5.71 | Removed the violet bottom edge from every button and the purple left edge from every note/banner across the public site and admin (e.g. Approve request, "Nothing paid yet…"); error notes keep a red edge. §4 updated |
| v5.72 | Admin console: View, Approve / Confirm payment and Reject buttons get the landing page's hover border trace (bookings, booking card/page, class registrations, waitlist). §4 updated |
| v5.73 | Admin Reject button: hover now only draws the outline (text no longer turns purple), and the outline is lime like the Approve button's background. §4 updated |
| v5.74 | Dashboard: every listed booking's card is loaded with the page, so View opens it instantly (no server trip); browser Back also closes it. §7 Console Sections updated |
| v5.75 | Dashboard booking card: opening animation (backdrop fades in, card rises and grows into place, then its parts fade up one by one). §4, §7 updated |
| v5.76 | Court Bookings tabs: every booking's card is loaded with the tab, so View opens it instantly over the list (same card and animation as the Dashboard); the proof-of-payment image link is fetched when the card opens. §7 Console Sections updated |
| v5.77 | Export to Excel: hover border trace on the Export, Download .xlsx and Cancel buttons; the export window opens with the booking card's animation; the Download arrow dips while hovered. §4 updated |
| v5.78 | Court Bookings: each tab's contents animate in when opened (note from the left, table from the top left, rows fading up one by one). §4 updated |
| v5.79 | Export to Excel window: closing animation (contents fade, window sinks and shrinks as it fades, backdrop fades out; about 0.3 s) on ×, Cancel, Esc or clicking outside. §4 updated |
| v5.80 | Admin section tabs on phones (Court Bookings and the other sections with tabs): the dropdown button is now small and right-aligned, showing only the current tab's name and a ▾ arrow (was full width with ☰ and the count); the list opens right-aligned under it. §7, §14 Mobile navigation updated |
| v5.81 | Admin on phones: Export to Excel is just a ⤓ download icon at the top right beside the page title; Court Bookings tabs are buttons in a 4 × 2 grid instead of a dropdown. §7, §14 Mobile navigation updated |
| v5.82 | Court Bookings on phones: tabs back in a dropdown (replacing the 4 × 2 grid), on the left, with a black button and lavender outline; every admin section's tab dropdown now animates (unrolls open, rolls shut). §4, §7, §14 Mobile navigation updated |
| v5.83 | Admin on phones: the Export to Excel icon moved from beside the page title to the right of the section tab dropdown (same row). §7 updated |
| v5.84 | Court Bookings on phones: the Export to Excel icon now sits just above the top-right corner of the tab's table (every tab, including Waitlist) instead of in the page head. §7 updated |
| v5.85 | Court Bookings on phones: the Export to Excel icon moved into the table's search row (right end, after the search box and row count); alone at the right above the table when there's no search box. §7 updated |
| v5.86 | Classes & Events → Registration Controls: hover border trace on Open registration, Registrations (n), Close/Reopen registration, Cancel class and the Open registration window's buttons; the window opens/closes with animation; the Rentals switch animates (option pops, rental fields slide open/shut); every class's registrations load with the page so Registrations (n) and Cancel class open an animated card instantly (Cancel class scrolls to its cancel section). §4, §7 updated |
| v5.87 | Booking and class cards (View, Registrations, Cancel class): closing animation on ×, Esc, outside click, browser Back and after an action; reopening always replays the opening animation. §4 updated |
| v5.88 | Classes & Events: every tab's contents animate in when opened (note from the left, blocks from the top left one after another, rows fading up); Registration Controls' "Past & cancelled" expands and collapses with animation (grows/shrinks, arrow flips, table and rows come in). §4 updated |
| v5.89 | Classes & Events: switching tabs now animates only the tab's contents; the title, tabs and Export to Excel no longer replay their entrance. §4 updated |
| v5.90 | Export to Excel: the preview table shows a loading state (dimmed rows + spinner, or placeholder rows) on every filter change until the new results load. §7 Export to Excel updated |
| v5.91 | Export to Excel: the preview loading spinner now spins (exception to the "no animations" rule; slower with reduced motion). §4 and §7 Export to Excel updated |
| v5.92 | Admin sign-in: the loading spinners now spin ("Signing you in…", "Loading the admin console…", and the sign-in form's own button spinner). All loading spinners are now exempt from the "no animations" switch. §4 and §7 Access updated |
| v5.93 | Fix: v5.92 accidentally switched off the exempted hover/transition effects (button border trace, ☰ menu morph, FAQ arrow, header nav and Programs & Events tab color fades). Restored; loading spinners still spin. §4 unchanged |
| v5.94 | Reports: removed the olive-green top edge from the KPI cards; they now match the plain Dashboard stat cards. §19 updated |
| v5.95 | Classes & Events on phones now matches Court Bookings: the tab dropdown sits on the left with a black button and lavender outline (list opens left-aligned), and the Export to Excel icon moved from beside the dropdown to the right end of the table's search row (Upcoming table on Registration Controls). §7, §14 Mobile navigation updated |
| v5.96 | Classes & Events → Registration Controls: the note now sits above + Open registration (was beside/under it); on phones the Export to Excel ⤓ icon moved from the Upcoming table's search row to right beside + Open registration, on its right. §7, §14 Mobile navigation updated |
| v5.97 | Management on phones: the tab dropdown now matches Court Bookings and Classes & Events (on the left, black button with lavender outline, list opens left-aligned). §7, §14 Mobile navigation updated |
| v5.98 | Management (Closures, Payment Methods, Equipment Inventory) gets Court Bookings' animations and effects: tab contents animate in when opened, hover border trace on every button, and the Close courts / payment method windows open and close with the booking card's animations. §4 updated |
| v5.99 | Admin: every tab's intro note slides in from the left, including Closures and Payment Methods (note beside a button; was coming in from the top left with the button) and Waitlist / Admin Accounts (note only). §4 updated |
| v6.00 | Admin Calendar animations: entrance on first display; the calendar slides or rises in on Month / Week / Day / List, the ◀ ▶ arrows, Today and court filter changes; bookings fade up one after another each time they load. §4 updated |
| v6.01 | Admin tabs open instantly: the text (title, tabs, note) shows at once and the data loads after it, with a shimmering skeleton (table or card shapes) in its place until it arrives, then animates in. §4 updated |
| v6.02 | Admin tabs: tables, cards, banners and buttons that load data (anything with a skeleton) no longer animate in; the skeleton shows in place and the data just appears when ready. Only the text (notes) and buttons that need no data keep the slide-in. §4 updated |
| v6.03 | Admin Calendar: a spinning "Loading bookings…" indicator shows in the middle of the calendar while bookings load (first display, arrows, view and filter changes). §4 updated |
| v6.04 | Book page opens instantly: the title, lead and tabs show at once and the tab's data (courts, availability, classes, "N open" count) loads after it, with a shimmering skeleton shaped like the court picker or class list in its place until it arrives. The Class / event tab's first-click load uses the same skeleton. §6 updated |
| v6.05 | Management → Equipment Inventory: admins can add rental items (name, sport, price, owned) and delete them (kept for past bookings; class rental items can't be deleted), and choose for each item whether its price is charged per hour or per session (once per booking). Booking Details step, summary and cart totals follow. Needs `supabase/migrations/0005_rental_items.sql`. §7 and §15 updated |
| v6.06 | Equipment Inventory: the label on Tennis Racket and Pickleball Paddle (instead of Delete) now reads "Can't delete: rented in class registrations" (was "Used for classes"). §7 updated |
| v6.07 | Admin Calendar: while bookings load, the whole calendar dims under a dark shade with a larger spinner card that stays in the middle of the screen; bookings lift, grow slightly and glow on hover (List view: text nudges right) and dip, spring back and flash a lime ring when clicked. §4 updated |
| v6.08 | Admin Calendar opens instantly: a skeleton of the whole calendar (filters, real legend, toolbar, week grid with booking blocks, real note) shows while the courts and the calendar's code load, then the calendar replaces it without an entrance animation. §4 updated |
| v6.09 | Admin Calendar: the skeleton is the only loading state; it stays until the first bookings have loaded, then the calendar appears with its bookings at once. Removed the "Loading bookings…" spinner, the dark loading shade and the bookings' fade-up (bookings just appear on every load). §4 updated |
| v6.10 | Fix: Admin Calendar bookings now show the instant the skeleton goes away (before, the grid could sit empty for about a second). The skeleton now waits for the latest bookings request, not just the first one to finish (an earlier, discarded request could finish first: on phones the Week is fetched before the switch to Day, and in development the calendar is built twice). The calendar also no longer drops and re-fetches its bookings on every re-render. §4 unchanged |
| v6.11 | All loading skeletons (admin tabs, Admin Calendar, Book page): the shimmer now loops smoothly, as a narrow highlight that sweeps fully across each bar at a steady speed and restarts out of sight (before, it jumped back to the start and slowed at each end). §4 updated |
| v6.12 | Admin Calendar: no hover or press animation on bookings. Clicking a booking or class now opens a larger details card beside it, like Google Calendar (name, reference, status, date and time, court, players, equipment, total, phone, email; classes: capacity, fee, rentals), with an Open booking / Open class button for the full page. Closes with ×, Esc, a click outside or the same booking again. §4 and §7 updated |
| v6.13 | New Management → Blacklist tab: add people by full name, phone and/or email (plus an optional reason) and remove them. Court booking requests matching any of those details (ignoring case, spacing and phone format) are moved into their own Blacklisted group on Court Bookings → Requests, tagged with which details matched. Needs `supabase/migrations/0006_blacklist.sql`. §7 updated |
| v6.14 | Reports: new Custom date range with From and To boxes and an Apply button (up to 366 days; swapped dates are put in order). Reports now read every booking in the range, so long ranges are not cut off. "vs previous day" wording for one-day ranges. §19 updated |
| v6.15 | Reports: the Custom chip now shows the From, To and Apply controls instantly with no page load; report data only reloads after Apply, which reads "Loading…" meanwhile. §19 updated |
| v6.16 | Reports: clicking a date range, court or Custom Apply highlights the filter instantly and shows a shimmering skeleton shaped like the report until the new data arrives. §19 updated |
| v6.17 | Reports: clicking Custom now animates the date row in: it slides open while From, To and Apply fade up one after another (GSAP `customRangeIn`, about 0.5 s). Off with reduced motion. §19 updated |
| v6.18 | Google Sheets sync: approved court bookings and class registrations are copied to the Smash Corner Records sheet every minute, one-way from the website; rows are removed when a record stops being approved. §7 and §18 updated |
| v6.19 | Google Sheets sync moved out of the website app into a Supabase Edge Function (`sheets-sync`) with its own every-minute `pg_cron` job; Google settings are now Supabase secrets. Record columns shared with Export to Excel from one definition. §7 and §18 updated |
| v6.20 | Google Sheets: instead of an every-minute job, the website calls the `record-to-sheets` Supabase Edge Function when a record is approved, edited or cancelled; it writes, rewrites or removes that record's row (found by reference). Google key is one `SERVICE_ACCOUNT_KEY` JSON secret; calls are protected by `SHEETS_SECRET`. §7 and §18 updated |
| v6.21 | Monthly report email: on the 1st at 8:00 AM Manila, every super-admin gets last month's 8 KPIs vs the month before, a separate classes & events section, a link to Reports for that month and an Excel file of the month's confirmed court bookings and class registrations; sent even when empty (no attachment), logged in the Activity Log, never sent twice. Runs as the `monthly-report` Supabase Edge Function on a monthly `pg_cron` job; KPI maths shared with the Reports page. §18 and §19 updated |
| v6.22 | Every-minute jobs moved from the website (`/api/cron/tick`) to the `tick` Supabase Edge Function on the same `pg_cron` schedule: cart holds, waitlist claims, unpaid requests and registrations, 24-hour reminders. Same rules, wording and email keys; a failing job no longer stops the others. Business rules, time helpers and slot states are now one shared copy used by the website and the Edge Functions. §18 updated |
| v6.23 | Deploy fix: the monthly-report Edge Function now uses a copy of SheetJS 0.20.3 (the same version as the website) stored with the functions, because Supabase's deploy bundler can't download from cdn.sheetjs.com. No change to the email or Excel file |
| v6.24 | Replaced all Lorem Ipsum and placeholder copy with draft Smash Corner wording: Home (courts lead, court card blurbs per court type, Why Choose Us, testimonials, final CTA), Courts (lead, amenity descriptions), Gallery and Contact leads, Programs & Events (lead, program and event descriptions; "Lorem Ipsum Open" is now "Smash Corner Tennis Open"; coaches are Coach Paolo, Bea and Miguel), FAQ answers, footer blurb, Booking Policy lead, and full draft Privacy Policy (Data Privacy Act of 2012) and Terms of Use. Site address now matches the seed branch address (98 Maria Clara St. corner Sto. Domingo Ave., Quezon City). Same changes in the mockup. §1 updated |
| v6.25 | Home: removed the Testimonials ("Players say") section; the Gallery teaser is now followed directly by the final "Ready to play?" banner. Same change in the mockup. §3 updated |
| v6.26 | Contact details: phone is now (02) 8332 1900 and email smash.corner2026@gmail.com (Contact page, footer and email footers, from the shared site details). Contact page: the map placeholder is replaced by a Google Maps embed pinned at 98 Maria Clara St., Sto. Domingo, Quezon City (14.627726, 121.005311); `NEXT_PUBLIC_MAP_EMBED_URL` can still override it. Same change in the mockup. §2 updated |
| v6.27 | Home hero: background is now the court photo (`public/images/scbgphoto3.jpg`) under a 72% black overlay. Site photos moved from `public/fonts/images/` to `public/images/`. Same change in the mockup. §3 and "Home hero" updated |
| v6.28 | Site-wide parallax background: the court photo now sits behind every page (fixed, 130% tall, 65% black scrim + bottom-up black gradient) and drifts up as the page scrolls (GSAP `quickTo`, 0.4 s `power2.out`); still with reduced motion. The Home hero band is now transparent instead of carrying its own copy of the photo. Same change in the mockup. §3, §4 and "Home hero" updated |
| v6.29 | Parallax background photo switched from `scbgphoto3.jpg` to `scbgphoto1.jpg`. Same change in the mockup. §4 updated |
| v6.30 | Parallax background framing: the photo now keeps its own proportions at full width (min 125% of the screen tall), starts at 20% of its height at the top of the page, and reaches its bottom edge at the bottom of the page. Reduced motion holds it at the 20% start. Same change in the mockup. §4 updated |
| v6.31 | Parallax background lighter: overlay darkness halved (scrim 65% → 33%; bottom gradient solid black → 50%, midpoint 40% → 20%). Same change in the mockup. §4 updated |
| v6.32 | Parallax background starts at 30% of the photo's height instead of 20% (minimum height raised from 125% to ~143% of the screen to match), so the player's upper body is in view when the site opens. Same change in the mockup. §4 updated |
| v6.33 | Parallax background photo switched back to `scbgphoto3.jpg` (landscape, 1676×931) and the start point back to 20% of the photo's height (minimum height 125% of the screen). Same change in the mockup. §4 updated |
| v6.34 | Fix: the parallax background didn't move with the landscape `scbgphoto3.jpg` (its 20%-to-bottom part was exactly one screen tall, leaving nothing to scroll through). Minimum photo height raised from 125% to 162.5% of the screen so that part is at least 1.3 screens tall; the photo's sides are trimmed a bit more as a result. Same change in the mockup. §4 updated |
| v6.35 | Parallax background shows the photo's full width: no more minimum height or side trimming; the photo sits at the top of the screen at its own proportions with its bottom third fading into black, starts with its top 20% above the screen, and drifts up a further 15% of its height by the bottom of the page (or until its bottom edge meets the screen's bottom, if it's tall enough). Same change in the mockup. §4 updated |
| v6.36 | Parallax background photo is now `scbgphoto3.png` (1676×769, replacing the 1676×931 JPG), and starts with only its top 8% above the screen (was 20%). Same change in the mockup. §4 updated |
| v6.37 | Parallax background starts from the top edge of the photo (nothing above the screen at the top of the page; was 8%). Same change in the mockup. §4 updated |
| v6.38 | Parallax background photo is now the new `scbgphoto3.jpg` (2048×1365, 405 KB) instead of `scbgphoto3.png`; still full width, starting at its top edge. Same change in the mockup. §4 updated |
| v6.39 | Parallax background a bit darker: black scrim 33% → 45% (bottom gradient unchanged). Start point now 30% of the photo's height (was its top edge). Same change in the mockup. §4 updated |
| v6.40 | Home hero split (700 px and wider): headline moved up near the top, lead + search bar + facts moved down near the bottom, leaving the middle clear so the background photo's wall mural shows. Phones unchanged. Same change in the mockup. "Home hero" updated |
| v6.41 | Home hero split positions: headline moved down to 30% of the hero's height from the top, search block up to 10% from the bottom; minimum gap between them now 15% of the screen height (60–140 px). Same change in the mockup. "Home hero" updated |
| v6.42 | Home hero: headline moved up to 15% of the hero's height from the top (was 30%). Same change in the mockup. "Home hero" updated |
| v6.43 | Home hero: search block (lead, search bar, facts) moved down to 5% of the hero's height from the bottom (was 10%). Same change in the mockup. "Home hero" updated |
| v6.44 | Parallax background on phones (below 700 px): photo zoomed to fill the screen and centred on the wall logo, which rises from 70% down the screen to about the middle as the page scrolls. Desktop unchanged. Same change in the mockup. §4 updated |
| v6.45 | Parallax background on phones now uses its own photo, `scbgphoto2.jpg` (pickleball on a paddle), zoomed to 1.4× the screen height and centred on the ball, which starts 40% down the screen. Desktop keeps `scbgphoto3.jpg`. Same change in the mockup. §4 updated |
| v6.46 | Parallax background on phones shows the whole `scbgphoto2.jpg`: fitted to the screen width without cropping, centred, top and bottom edges fading to black; drifts up 15% of its height through the centre while scrolling. Zoom/focus/start settings removed. Same change in the mockup. §4 updated |
| v6.47 | Parallax background on phones now uses `scbgphoto1.jpg` (a player serving) instead of `scbgphoto2.jpg`; same whole-photo framing. Same change in the mockup. §4 updated |
| v6.48 | Parallax background on phones fills the whole screen (photo at least 1.25 screens tall, sides trimmed) and pans from its top edge to its bottom edge as the page scrolls from top to bottom. Same change in the mockup. §4 updated |
| v6.49 | Parallax background on phones: new `start` setting for where the photo starts at the top of the page (fraction of its height above the screen; default 0 = its top edge, so no visible change). Same change in the mockup. §4 updated |
| v6.50 | Courts page: removed the Surface and Size rows from the court cards (now Players, Lights, Rate, Note) and removed Lockers and Drinks & Snacks from Facilities & Amenities (now Parking, Shower & Bathrooms, Free Wi-Fi, Waiting Lounge). Page lead and meta description no longer mention surfaces/sizes. Same change in the mockup. §2 updated |
| v6.51 | Fix: the Gallery and Programs & Events tab rows showed a black bar across the whole row over the parallax background photo. The rows are now transparent at rest and only get the black page background (and the Gallery's bottom line) while pinned under the site header, so content scrolling under them stays hidden. Same change in the mockup (Gallery). §4 updated |
| v6.52 | Gallery: sections (Pickleball Courts, Tennis Courts, Bathroom, Amenities) and their sticky tabs removed; the page now shows all 157 photos from the client's public Google Drive folder in one masonry layout where every photo is shown whole (no cropping; 4/3/2 columns), with the lightbox kept. Photo list lives in `src/data/gallery.json` (Drive file ids); images load from Google. Home gallery teaser now shows the first 4 photos and links to the Gallery. Same change in the mockup. §2, §4, §14 updated |
| v6.53 | Gallery photos rise in from the bottom as they scroll into view (site scroll reveal, `sectionReveal`), in on-screen reading order; reveal points re-measured as photos load. Fix on all pages: cards already scrolled past appear at once instead of being staggered (they were delaying the on-screen ones). Mockup unchanged (no scroll reveals there). §4 updated |
| v6.54 | Fix: Programs & Events tab row showed a black bar across the screen once it stuck under the header; the row now never has a background (only the tab buttons show, content scrolls past around them). The v6.51 pinned-background code is removed. Leftover v6.51 code removed from the mockup. §4 updated |
| v6.55 | Programs & Events now follows the admin: Programs lists the open classes and Events the open events (same ones as the Book page's Class / event tab), with date, time, court, fee, spots left, description and Register / Join (or Full); empty sections show "No classes/events open right now" with Book a court. Open registration form gets **Type** (Class / Event) and an optional **Description**; new migration `0008_class_kind.sql` adds `classes.kind` and `classes.description`. Admin class list shows the type. Same change in the mockup. §2, §7 updated |
| v6.56 | Fix (Gallery): coming back to the Gallery from another page, photos loaded slowly and showed stretched, and some stayed hidden after scrolling. Arriving from another page started all 157 downloads at once (the lazy-loading setting was applied after the photo address), so the on-screen ones were slow; now only photos near the screen load. Loading photos are cropped by their placeholder instead of stretched, and take their real shape as soon as their size is known. The rise-in reads photo positions live instead of saved trigger points that went stale as photos loaded. §2, §4 updated |
| v6.57 | Fix (Gallery): the photos' rise-in animation was lost when arriving from another page (the page is set up, torn down and set up again in quick succession, which snapped photos visible and left others hidden until later); whether a photo has risen in is now kept on the photo itself. Large batches rise within 0.6 s. §4 updated |
| v6.58 | Fix (Gallery): coming back from another page while scrolled down, every photo was marked shown at once (only a few visibly animated, none as you scrolled), because the Gallery looked before the new page was laid out and scrolled to the top. It now waits for that, so on arrival only the on-screen photos rise in and the rest rise in as you scroll. §4 updated |
| v6.59 | Admin console: the background photo is a bit darker (black overlay 65% instead of the public site's 45%). Same change in the mockup. §4 updated |
| v6.60 | Parallax background: the dark readability gradient now falls from the top of the screen instead of rising from the bottom (same 50% → 20% → clear). The fade where the desktop photo's bottom edge melts into the black page is unchanged. Same change in the mockup. §4 updated |
| v6.61 | Home: the "Play it." shine now repeats every 3 s (2 s sweep, then a 1 s pause) instead of playing once. Still off with reduced motion. Not in the mockup (it has no shine). §4 updated |
| v6.62 | Gallery: on arrival, the first screenful of photos (everything visible, down to the bottom edge) rises in together, then the rest rise in as you scroll. Each photo's size is now stored in `gallery.json`, so the masonry has its final layout from the first frame instead of reshuffling between columns as photos load (which used to make the first batch not match what was on screen). §3, §4 updated |
| v6.63 | Fix (Gallery): arriving from another page downloaded all 157 photos at once. The Gallery now starts each photo's download itself when it comes within 600 px of the screen (about 25 photos on arrival instead of 157), on first visits and when coming from another page alike. §3 updated |
| v6.64 | Courts: Tennis Court 1 and Pickleball Courts 1 and 2 now show the client's court layout images (court cards on Home and Courts, Book court picker, cart), shown whole on the images' green. The two pickleball images were cropped to the same size and position so they match. Not in the mockup. §14 updated |
| v6.65 | Courts: the court image boxes are now portrait (2:3) instead of landscape (4:3), so the tall pickleball layouts fill their cards with little space at the sides; applies to the court cards (Home, Courts), the Book court picker and the cart thumbnails. §14 updated |
| v6.66 | Courts: the space around the court images is now blank (the card's dark background) instead of green. §14 updated |
| v6.67 | Courts: the pickleball court images are now the same height as the tennis court image (every court image box has the tennis image's 462 × 482 shape; the pickleball images are narrower, with blank space at their sides). §14 updated |
