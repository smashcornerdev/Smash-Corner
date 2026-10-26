"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CartIcon } from "./art";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/courts", label: "Courts" },
  { href: "/gallery", label: "Gallery" },
  { href: "/programs", label: "Programs & Events" },
  { href: "/contact", label: "Contact" },
];

export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Smash Corner home">
      <span className="brand-mark" aria-hidden="true" />
      <span className="brand-word">SMASH<br />CORNER</span>
    </Link>
  );
}

/* Header nav (spec §2): links collapse into a hamburger below 1100 px (§14 Mobile navigation). */
export default function SiteHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  useEffect(() => setOpen(false), [path]);
  // cart count is per visitor, fetched so the marketing pages can stay static
  useEffect(() => {
    const load = () => fetch("/api/cart", { cache: "no-store" }).then((r) => (r.ok ? r.json() : { count: 0 })).then((d) => setCartCount(d.count ?? 0)).catch(() => {});
    load();
    window.addEventListener("cart-changed", load);
    return () => window.removeEventListener("cart-changed", load);
  }, [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  return (
    <header className="site-head">
      <div className="wrap head-row">
        <Brand />
        <nav className={"main-nav" + (open ? " open" : "")} id="mainNav" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={(n.href === "/" ? path === "/" : path.startsWith(n.href)) ? "on" : ""}>{n.label}</Link>
          ))}
        </nav>
        <div className="head-actions">
          <Link href="/cart" className="cart-btn" aria-label={`Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}>
            <CartIcon />
            <span className="cart-count tabnum" data-n={cartCount}>{cartCount}</span>
          </Link>
          <Link href="/book" className="btn btn-lime btn-sm">Book Now</Link>
          <button className="menu-btn" aria-expanded={open} aria-controls="mainNav" aria-label="Menu" onClick={() => setOpen((o) => !o)}>
            <span className="burger" aria-hidden="true"><i /><i /><i /></span>
          </button>
        </div>
      </div>
    </header>
  );
}
