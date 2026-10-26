// GSAP hook collection (stored only, not used yet; gsap isn't installed).
// Plain .js so the typecheck skips it until gsap is added.

// Fires 30 confetti pieces upward with Physics2DPlugin; they arc and fall under gravity.
// Needs a createConfetti() that builds and returns one piece (not written yet).
export function confettiBurst() {
  for (let i = 0; i < 30; i++) {
    const piece = createConfetti();
    gsap.to(piece, {
      physics2D: {
        velocity: gsap.utils.random(300, 600),
        angle: gsap.utils.random(250, 290),
        gravity: 400
      }
    });
  }
}
