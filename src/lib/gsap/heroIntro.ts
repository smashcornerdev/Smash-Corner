import { gsap } from "gsap";
import { textShine } from "./textShine";

// Landing-page entrance (spec §4), restrained and deliberate: one long deceleration (expo.out) for everything, no springs or pops.
// The header is left alone (v5.18); the hero has no eyebrow (removed v5.25). The first two headline lines rise out from
// behind their own baseline (a clip-path mask moving with it) and "Play it." glides in from off the left edge of the screen
// (v5.22), then gets its shine; the lead slides in from the right; the search bar glides up, then the facts row item by item; the ticker
// band wipes in left to right. When the ticker's words wrap onto several rows (phones, v5.54, v5.55) it reads in order instead:
// the band wipes in left to right one row at a time (1st row, then the 2nd, …), each row's words fading in as the wipe passes. heroIntro() sets the start state (call it while the splash still covers the page) and returns
// `play`. Everything is cleared afterwards so CSS takes over again.
export function heroIntro(scope: Element) {
  const q = gsap.utils.selector(scope);
  const play1 = q(".hero h1 .shine")[0] as HTMLElement | undefined; // "Play it."
  const lines = q(".hero h1 .ln").filter((l) => l !== play1);
  // start just past the left edge of the screen (measured from where it sits now)
  const fromLeft = play1 ? -Math.ceil(play1.getBoundingClientRect().right + 24) : 0;
  // ticker words grouped into the rows they wrap onto (DOM order is already left to right, top to bottom)
  const words = q(".ticker-track span") as HTMLElement[];
  const rows: HTMLElement[][] = [];
  words.forEach((w) => { const r = rows[rows.length - 1]; if (r && r[0].offsetTop === w.offsetTop) r.push(w); else rows.push([w]); });
  const wrapped = rows.length > 1;
  // phones: the band's rows, as y bands (boundaries halfway between word rows), for the row-by-row wipe
  const band = q(".ticker")[0] as HTMLElement | undefined;
  const cuts: number[] = [];
  if (wrapped && band) {
    const top = band.getBoundingClientRect().top;
    const mids = rows.map((r) => { const b = r[0].getBoundingClientRect(); return b.top - top + b.height / 2; });
    cuts.push(0, ...mids.slice(1).map((m, i) => (m + mids[i]) / 2), band.offsetHeight);
  }
  // revealed shape: rows above row i in full, row i up to fraction p of the width
  const rowClip = (i: number, p: number) => {
    const x = `${(p * 100).toFixed(2)}%`, a = `${cuts[i]}px`, b = `${cuts[i + 1]}px`;
    return `polygon(0 0, 100% 0, 100% ${a}, ${x} ${a}, ${x} ${b}, 0 ${b})`;
  };
  const ctx = gsap.context(() => {
    gsap.set(lines, { yPercent: 100, clipPath: "inset(0% 0% 100% 0%)" });
    if (play1) gsap.set(play1, { x: fromLeft, autoAlpha: 0 });
    gsap.set(q(".hero .lead"), { autoAlpha: 0, x: 80 }); // the paragraph comes in from the right (v5.28)
    gsap.set(q(".hero .quick"), { autoAlpha: 0, y: 20 });
    gsap.set(q(".hero-facts li"), { autoAlpha: 0, y: 10 });
    if (wrapped && band) band.style.clipPath = rowClip(0, 0);
    else gsap.set(q(".ticker"), { clipPath: "inset(0% 100% 0% 0%)" });
    gsap.set(words, wrapped ? { autoAlpha: 0, x: -16 } : { autoAlpha: 0 });
  }, scope);
  const play = () => ctx.add(() => {
    const tl = gsap.timeline({ defaults: { ease: "expo.out", clearProps: "transform,opacity,visibility,filter,clipPath" } })
      .to(lines, { yPercent: 0, clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, stagger: 0.16 }, 0.35)
      .to(play1 ?? [], { x: 0, duration: 1.4, clearProps: "transform" }, 0.62) // each tween clears only its own props,
      .to(play1 ?? [], { autoAlpha: 1, duration: 0.5, ease: "power1.out", clearProps: "opacity,visibility" }, 0.62) // so the fade can't wipe the glide
      .to(q(".hero .lead"), { autoAlpha: 1, x: 0, duration: 1.2 }, 0.95)
      .to(q(".hero .quick"), { autoAlpha: 1, y: 0, duration: 1.2 }, 1.15) // search bar (v5.29; replaced the two buttons + old form)
      .to(q(".hero-facts li"), { autoAlpha: 1, y: 0, duration: 1, stagger: 0.08 }, 1.35)
    if (wrapped && band) {
      const ROW = 0.38; // each row's wipe
      rows.forEach((r, i) => {
        const at = 1.35 + i * ROW, wipe = { p: 0 };
        tl.to(wipe, { p: 1, duration: ROW, ease: "power1.inOut", clearProps: "",
          onUpdate: () => { band.style.clipPath = rowClip(i, wipe.p); } }, at)
          .to(r, { autoAlpha: 1, x: 0, duration: 0.4, stagger: ROW / (r.length + 1), ease: "power2.out" }, at + 0.05);
      });
      tl.call(() => { band.style.clipPath = ""; }, [], 1.35 + rows.length * ROW); // back to the CSS slanted shape
    } else {
      tl.to(q(".ticker"), { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.inOut" }, 1.35)
        .to(words, { autoAlpha: 1, duration: 0.8, stagger: 0.06, ease: "power2.out" }, 1.75);
    }
    // once everything has landed, light glints across "Play it." (once)
    if (play1) textShine(play1, { delay: tl.duration() - 0.3 });
  });
  return { play, revert: () => { ctx.revert(); if (band) band.style.clipPath = ""; } };
}
