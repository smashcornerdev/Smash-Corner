/** Runs `play` once the splash overlay has left the page (straight away when there's none, e.g. after client navigation).
 *  The splash is in the page from the first frame until it has faded out. Returns a cleanup that stops waiting. */
export function afterSplash(play: () => void) {
  const splash = document.querySelector("[data-splash]");
  if (!splash?.parentNode) { play(); return () => {}; }
  const mo = new MutationObserver(() => { if (!splash.isConnected) { mo.disconnect(); play(); } });
  mo.observe(splash.parentNode, { childList: true });
  return () => mo.disconnect();
}
