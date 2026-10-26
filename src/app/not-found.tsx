import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="wrap sec stack" style={{ alignItems: "flex-start" }}>
        <p className="eyebrow">404</p>
        <h1>Out of bounds</h1>
        <p className="lead">We couldn&apos;t find that page.</p>
        <div className="row"><Link href="/" className="btn btn-lime">Back to home</Link><Link href="/book" className="btn btn-ghost">Book a court</Link></div>
      </main>
      <SiteFooter />
    </>
  );
}
