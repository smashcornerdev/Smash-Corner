// GSAP hook collection (stored only, not used yet; gsap isn't installed).
// Plain .js so the typecheck skips it until gsap is added.

// Draws an SVG circle's stroke from empty to target% when it scrolls into view.
// ring is the <circle> element, radius its r, target a percentage (0–100).
export function progressRing(ring, radius, target) {
  const circumference = 2 * Math.PI * radius;
  gsap.set(ring, { strokeDasharray: circumference, strokeDashoffset: circumference });
  gsap.to(ring, {
    strokeDashoffset: circumference * (1 - target/100),
    duration: 1.5,
    scrollTrigger: ring
  });
}
