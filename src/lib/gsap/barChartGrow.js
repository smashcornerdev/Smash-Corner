// GSAP hook collection (stored only, not used yet; gsap isn't installed).
// Plain .js so the typecheck skips it until gsap is added.

// Grows each `.bar-fill` to its percentage, one after another, when `.chart` scrolls into view.
// data is an array of percentages (0–100), one per bar, in DOM order.
export function barChartGrow(data) {
  gsap.to(".bar-fill", {
    height: (i) => data[i] + "%",
    duration: 0.8, stagger: 0.1,
    ease: "power2.out",
    scrollTrigger: ".chart"
  });
}
