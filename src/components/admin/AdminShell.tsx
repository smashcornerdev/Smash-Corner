"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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

/* Sidebar (sections) + top tabs (spec §7 Console Sections; §14 Mobile navigation: ☰ below 860 / 700 px) */
export default function AdminShell({ groups, who, courts, children }: { groups: Group[]; who: { name: string; role: string }; courts: { id: string; name: string }[]; children: React.ReactNode }) {
  const path = usePathname();
  const sp = useSearchParams();
  const [menu, setMenu] = useState(false);
  const [sub, setSub] = useState(false);
  useEffect(() => { setMenu(false); setSub(false); }, [path]);
  const cur = currentTab(groups, path);
  const G = cur?.g ?? groups[0];
  const curTab = G.tabs.find((t) => t.href === cur?.href);
  const waiting = groups.reduce((a, g) => a + (g.badge || 0), 0);
  const msg = sp.get("msg"), kind = sp.get("k");
  return (
    <div className="adm">
      <aside className={"adm-side hm" + (menu ? " open" : "")}>
        <div className="adm-brandrow">
          <Link href="/" className="brand"><span className="brand-mark" aria-hidden="true" /><span className="brand-word">SMASH<br />CORNER</span></Link>
          <button type="button" className="hm-btn" aria-expanded={menu} aria-controls="admPanel" onClick={() => setMenu((m) => !m)}>
            <span className="hm-ic" aria-hidden="true">☰</span><span className="hm-cur">{G.label}</span>
            {waiting ? <span className="c">{waiting}</span> : null}<span className="hm-car" aria-hidden="true"><Arrow dir="d" /></span>
          </button>
        </div>
        <div className="hm-list adm-panel" id="admPanel">
          <nav aria-label="Admin">
            {groups.map((g) => (
              <Link key={g.id} href={g.tabs[0].href} className={"adm-nav" + (G.id === g.id ? " on" : "")} aria-current={G.id === g.id ? "page" : undefined}>
                <span>{g.label}</span>{g.badge ? <span className="c">{g.badge}</span> : null}
              </Link>
            ))}
          </nav>
          <div className="adm-who">
            <span>Signed in as<br /><b>{who.name}</b><br /><small className="muted">{who.role}</small></span>
            <div className="row" style={{ gap: 8 }}>
              <Link href="/" className="btn btn-ghost btn-sm">View site</Link>
              <SignOutButton redirectUrl="/admin/sign-in"><button className="btn btn-ghost btn-sm">Sign out</button></SignOutButton>
            </div>
          </div>
        </div>
      </aside>
      <section className="adm-main">
        <div className="adm-top"><div><p className="eyebrow">Admin Console</p><h1 style={{ marginTop: 6 }}>{G.label}</h1></div>{G.id === "court" || G.id === "class" ? <ExportButton key={G.id} kind={G.id} courts={courts} /> : null}</div>
        {G.tabs.length > 1 ? (
          <div className={"hm hm-sub" + (sub ? " open" : "")}>
            <button type="button" className="hm-btn" aria-expanded={sub} onClick={() => setSub((x) => !x)}>
              <span className="hm-ic" aria-hidden="true">☰</span><span className="hm-cur">{curTab?.label ?? G.label}</span>
              {curTab?.count != null ? <span className="c">{curTab.count}</span> : null}<span className="hm-car" aria-hidden="true"><Arrow dir="d" /></span>
            </button>
            <div className="subnav hm-list" role="tablist" aria-label={G.label}>
              {G.tabs.map((t) => (
                <Link key={t.href} href={t.href} role="tab" aria-selected={curTab?.href === t.href} className={"subtab" + (curTab?.href === t.href ? " on" : "")}>
                  <span>{t.label}</span>{t.count != null ? <span className="c">{t.count}</span> : null}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
        {msg ? <div className={"banner" + (kind === "err" ? "" : " lime")} role="status" style={kind === "err" ? { borderLeftColor: "var(--error)" } : undefined}>{msg}</div> : null}
        {children}
      </section>
    </div>
  );
}
