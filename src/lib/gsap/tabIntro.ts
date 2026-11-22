import { gsap } from "gsap";

const CLEAR = "transform,opacity,visibility";

/** Court Bookings, Classes & Events and Management tab contents (spec §4 / §7, v5.78; Classes & Events v5.88; Management v5.98, where payment method cards count as rows), each time a tab is opened: the tab's note slides in from the left, then
 *  the table (or the "nothing here" box) comes in from the top left like the Dashboard's tables, and the rows on show
 *  fade up one after another. tabIntro() hides everything (call before paint) and returns `play`. */
export function tabIntro(parts: HTMLElement[], notesOnly = false) {
  // v5.99: a note that shares a row with a button (Closures, Payment Methods) slides in from the left on its own; the row's
  // other children (the button) come in as blocks. `notesOnly`: just the notes animate (Waitlist, Admin Accounts).
  const split = parts.flatMap((p) => (p.matches(".row") && p.querySelector(":scope > p") ? Array.from(p.children as HTMLCollectionOf<HTMLElement>) : [p]))
    .filter((p) => !p.matches(".tab-data")); // v6.02: data (and its skeleton) just appears
  const note = split.filter((p) => p.matches("p"));
  const blocks = notesOnly ? [] : split.filter((p) => !p.matches("p"));
  const rows = blocks.flatMap((b) => Array.from(b.querySelectorAll<HTMLElement>("tbody > tr, .pm-card"))).filter((r) => r.getClientRects().length > 0); // not in a closed <details>
  const ctx = gsap.context(() => {
    if (note.length) gsap.set(note, { autoAlpha: 0, x: -40 });
    if (blocks.length) gsap.set(blocks, { autoAlpha: 0, x: -60, y: -40 });
    if (rows.length) gsap.set(rows, { autoAlpha: 0, y: 12 });
  });
  const play = () => ctx.add(() => {
    const tl = gsap.timeline({ defaults: { ease: "expo.out", clearProps: CLEAR } });
    if (note.length) tl.to(note, { autoAlpha: 1, x: 0, duration: 0.8 }, 0);
    if (blocks.length) tl.to(blocks, { autoAlpha: 1, x: 0, y: 0, duration: 0.9, stagger: 0.08 }, 0.1); // one after another when there are several (v5.88)
    if (rows.length) tl.to(rows, { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.05, ease: "power2.out" }, 0.35);
  });
  return { play, revert: () => ctx.revert() };
}
