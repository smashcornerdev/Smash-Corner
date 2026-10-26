// GSAP hook collection (stored only, not used yet; gsap isn't installed).
// Plain .js so the typecheck skips it until gsap is added.

// Counts the `.text` element up from 0 to 99,999 over 2 s, with thousands separators.
// Markup it was written for (monospace keeps the digits from jumping around):
//   <h3 class="text" style="font-family:monospace;">00,000</h3>
export function countUp() {
  const el = document.querySelector(".text");
  let obj = { val: 0 };

  gsap.to(obj, {
    val: 99999, duration: 2, ease: "power2.out",
    onUpdate: () => {
      el.textContent = Math.round(obj.val).toLocaleString();
    }
  });
}
