"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { gsap } from "gsap";
import { menuIn, menuOut } from "@/lib/gsap/navMenu";
import { navHover } from "@/lib/gsap/navHover";
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
      <span className="brand-logo" aria-hidden="true" />
      <span className="brand-word">SMASH<br />CORNER</span>
    </Link>
  );
}

/* Header nav (spec §2): links collapse into a hamburger below 1100 px (§14 Mobile navigation). */
export default function SiteHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false); // panel in the page: stays true while the close animation plays
  const nav = useRef<HTMLElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const head = useRef<HTMLElement>(null);
  const anim = useRef<gsap.core.Timeline>(null);
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
  // open/close animation (spec §4), only for the collapsed (hamburger) menu and without reduced motion
  useLayoutEffect(() => {
    const el = nav.current!;
    const animate = window.matchMedia("(max-width:1100px) and (prefers-reduced-motion: no-preference)").matches;
    anim.current?.kill(); // e.g. reopened mid-close: don't let the close finish and hide it
    if (open) { setShown(true); if (animate) anim.current = menuIn(el); }
    else if (shown) { if (!animate) setShown(false); else anim.current = menuOut(el, () => flushSync(() => setShown(false))); }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  // hover / press motion on the nav tabs and the shopping-bag buttons (spec §4, v5.49)
  useEffect(() => navHover(nav.current!, pill.current!, Array.from(head.current!.querySelectorAll<HTMLElement>(".cart-btn, .nav-cart"))), []);
  // the full-screen menu stops the page behind it from scrolling
  useEffect(() => {
    document.documentElement.classList.toggle("menu-on", shown);
    return () => document.documentElement.classList.remove("menu-on");
  }, [shown]);
  return (
    <header className="site-head" ref={head}>
      <div className="wrap head-row">
        <Brand />
        <nav ref={nav} className={"main-nav" + (shown ? " open" : "")} id="mainNav" aria-label="Main">
          <span ref={pill} className="nav-pill" aria-hidden="true" />
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={(n.href === "/" ? path === "/" : path.startsWith(n.href)) ? "on" : ""}>{n.label}</Link>
          ))}
          {/* phone menu only (v5.17): Cart and Book move from the header bar into the menu */}
          <div className="nav-extra">
            <Link href="/book" className="btn btn-lime no-edge">Book Now</Link>
            <Link href="/cart" className={"nav-cart" + (path === "/cart" ? " on" : "")} aria-label={`Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}>
              <CartIcon />{cartCount ? <span className="cart-count tabnum" aria-hidden="true">{cartCount}</span> : null}
            </Link>
          </div>
        </nav>
        <div className="head-actions">
          <Link href="/cart" className="cart-btn" aria-label={`Cart, ${cartCount} item${cartCount === 1 ? "" : "s"}`}>
            <CartIcon />
            <span className="cart-count tabnum" data-n={cartCount}>{cartCount}</span>
          </Link>
          <Link href="/book" className="btn btn-lime btn-sm no-edge">Book Now</Link>
          <button className="menu-btn" aria-expanded={open} aria-controls="mainNav" aria-label={cartCount ? `Menu, cart has ${cartCount} item${cartCount === 1 ? "" : "s"}` : "Menu"} onClick={() => setOpen((o) => !o)}>
            <span className="burger" aria-hidden="true"><i /><i /><i /></span>
            {cartCount && !open ? <span className="cart-count tabnum" aria-hidden="true">{cartCount}</span> : null}
          </button>
        </div>
      </div>
    </header>
  );
}
