// GSAP hook collection (stored only, not used yet; gsap isn't installed).
// Plain .js so the typecheck skips it until gsap is added.

// Odometer-style number roll: slides a vertical `.digit-strip` (0–9 stacked) up to show targetDigit.
// digitHeight is the height of one digit in px.
export function digitRoll(targetDigit, digitHeight) {
  gsap.to(".digit-strip", {
    y: -targetDigit * digitHeight,
    duration: 1.5,
    ease: "power2.out"
  });
}
