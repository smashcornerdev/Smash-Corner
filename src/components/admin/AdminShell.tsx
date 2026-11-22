"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { gsap } from "gsap";
import { menuIn, menuOut } from "@/lib/gsap/navMenu";
import { dropIn, dropOut } from "@/lib/gsap/dropMenu";
import { SignOutButton } from "@clerk/nextjs";
import { Arrow } from "@/components/art";
import ExportButton from "@/components/admin/ExportForm";
import type { Group } from "@/lib/adminNav";

/** which tab a path belongs to: longest matching href wins */
function currentTab(groups: Group[], path: string) {
  let best: { g: Group; href: string } | null = null;
  for (const g of groups) for (const t of g.tabs) {
    const hit = t.href === "/admin" ? path === "/admin" : path === t.href || path.startsWith(t.href + "/");
    if (hit && (!best || t.href.length > best.href.length)) best = { g, href: t.href };
  }
  if (!best && path.startsWith("/admin/bookings")) best = { g: groups.find((g) => g.id === "court")!, href: "" };
  if (!best && path.startsWith("/admin/classes")) best = { g: groups.find((g) => g.id === "class")!, href: "" };
  return best;
}

/* Sidebar (sections) + top tabs (spec §7 Console Sections; §14 Mobile navigation). Below 860 px the sidebar becomes a top bar with
   only the logo and a ☰ button that opens a full-screen menu: same design and open/close animation as the public site's phone menu (v5.69). */
export default function AdminShell({ groups, who, courts, children }: { groups: Group[]; who: { name: string; role: string }; courts: { id: string; name: string }[]; children: React.ReactNode }) {
  const path = usePathname();
  const sp = useSearchParams();
  const [menu, setMenu] = useState(false);
  const [shown, setShown] = useState(false); // phone menu in the page: stays true while the close animation plays
  const [sub, setSub] = useState(false);
  const [subShown, setSubShown] = useState(false); // tab list in the page: stays true while its close animation plays
  const subList = useRef<HTMLDivElement>(null);
  const subAnim = useRef<gsap.core.Timeline>(null);
  const panel = useRef<HTMLElement>(null);
  const anim = useRef<gsap.core.Timeline>(null);
  useEffect(() => { setMenu(false); setSub(false); }, [path]);
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);
  // open/close animation (spec §4), same as the public site's phone menu; only when collapsed and without reduced motion
  useLayoutEffect(() => {
    const el = panel.current!;
    const animate = window.matchMedia("(max-width:860px) and (prefers-reduced-motion: no-preference)").matches;
    anim.current?.kill();
    if (menu) { setShown(true); if (animate) anim.current = menuIn(el); }
    else if (shown) { if (!animate) setShown(false); else anim.current = menuOut(el, () => flushSync(() => setShown(false))); }
  }, [menu]); // eslint-disable-line react-hooks/exhaustive-deps
  // section tab dropdown on phones (v5.82): unrolls open / rolls shut; only in dropdown mode and without reduced motion
  useLayoutEffect(() => {
    const el = subList.current;
    if (!el) return;
    const animate = window.matchMedia("(max-width:700px) and (prefers-reduced-motion: no-preference)").matches;
    subAnim.current?.kill();
    if (sub) { setSubShown(true); if (animate) subAnim.current = dropIn(el); }
    else if (subShown) { if (!animate) setSubShown(false); else subAnim.current = dropOut(el, () => flushSync(() => setSubShown(false))); }
  }, [sub]); // eslint-disable-line react-hooks/exhaustive-deps
  // the full-screen menu stops the page behind it from scrolling
  useEffect(() => {
    document.documentElement.classList.toggle("menu-on", shown);
    return () => document.documentElement.classList.remove("menu-on");
  }, [shown]);
  const cur = currentTab(groups, path);
  const G = cur?.g ?? groups[0];
  const curTab = G.tabs.find((t) => t.href === cur?.href);
  const waiting = groups.reduce((a, g) => a + (g.badge || 0), 0);
  const msg = sp.get("msg"), kind = sp.get("k");
  return (
    <div className="adm">
      <aside className={"adm-side" + (shown ? " open" : "")}>
        <div className="adm-brandrow">
          <Link href="/" className="brand"><span className="brand-mark" aria-hidden="true" /><span className="brand-word">SMASH<br />CORNER</span></Link>
          <button type="button" className="menu-btn" aria-expanded={menu} aria-controls="admPanel" aria-label={waiting ? `Menu, ${waiting} waiting` : "Menu"} onClick={() => setMenu((m) => !m)}>
            <span className="burger" aria-hidden="true"><i /><i /><i /></span>
            {waiting && !menu ? <span className="cart-count tabnum" aria-hidden="true">{waiting}</span> : null}
          </button>
        </div>
        <nav ref={panel} className="adm-panel" id="admPanel" aria-label="Admin">
          {groups.map((g) => (
            <Link key={g.id} href={g.tabs[0].href} className={"adm-nav" + (G.id === g.id ? " on" : "")} aria-current={G.id === g.id ? "page" : undefined}>
              <span>{g.label}</span>{g.badge ? <span className="c">{g.badge}</span> : null}
            </Link>
          ))}
          <div className="adm-who">
            <span>Signed in as<br /><b>{who.name}</b><br /><small className="muted">{who.role}</small></span>
            <div className="row" style={{ gap: 8 }}>
              <Link href="/" className="btn btn-ghost btn-sm">View site</Link>
              <SignOutButton redirectUrl="/admin/sign-in"><button className="btn btn-ghost btn-sm">Sign out</button></SignOutButton>
            </div>
          </div>
        </nav>
      </aside>
      <section className="adm-main">
        {/* title, Export and section tabs share one grid (v5.83): Export sits beside the title on wider screens and beside the tab
            dropdown on phones; Court Bookings and (v5.95) Classes & Events on phones show it in the table's search row instead (TableExport) */}
        <div className="adm-top">
          <h1>{G.label}</h1>
          {G.id === "court" || G.id === "class" ? <div className="adm-exp exp-court"><ExportButton key={G.id} kind={G.id} courts={courts} /></div> : null}
          {G.tabs.length > 1 ? (
            <div className={"hm hm-sub" + (["court", "class", "mgmt"].includes(G.id) ? " hm-court" : "") + (subShown ? " open" : "")}>
              {/* phones (v5.80): a small button on the right with just the current tab's name and a ▾ arrow; the counts are in the list */}
              <button type="button" className="hm-btn" aria-expanded={sub} aria-label={`${curTab?.label ?? G.label}, choose a tab`} onClick={() => setSub((x) => !x)}>
                <span className="hm-cur">{curTab?.label ?? G.label}</span><span className="hm-car" aria-hidden="true"><Arrow dir="d" /></span>
              </button>
              <div ref={subList} className="subnav hm-list" role="tablist" aria-label={G.label}>
                {G.tabs.map((t) => (
                  <Link key={t.href} href={t.href} role="tab" aria-selected={curTab?.href === t.href} className={"subtab" + (curTab?.href === t.href ? " on" : "")}>
                    <span>{t.label}</span>{t.count != null ? <span className="c">{t.count}</span> : null}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        {msg ? <div className={"banner" + (kind === "err" ? " err" : "")} role="status">{msg}</div> : null}
        {children}
      </section>
    </div>
  );
}
