// GSAP hook collection (stored only, not used yet; gsap isn't installed).
// Plain .js so the typecheck skips it until gsap is added.

// Reveals `.image` elements by animating their clip-path to the full box when scrolled into view.
export function clipPathReveal() {
  gsap.to(".image", {
    clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
    duration: 1.2,
    ease: "power3.inOut",
    scrollTrigger: ".image"
  });
}
