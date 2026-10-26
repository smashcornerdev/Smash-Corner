// GSAP hook collection (stored only, not used yet; gsap isn't installed).
// Plain .js so the typecheck skips it until gsap is added.

// Blurs `.text` elements in proportion to scroll speed (max 8px).
export function scrollVelocityBlur() {
  ScrollTrigger.create({
    onUpdate: (self) => {
      const blur = Math.min(Math.abs(self.getVelocity()) / 200, 8);
      gsap.to(".text", { filter: `blur(${blur}px)`, duration: 0.1 });
    }
  });
}
