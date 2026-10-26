import Link from "next/link";
import { SITE } from "@/lib/config";

export default function SiteFooter() {
  return (
    <footer className="site-foot">
      <div className="wrap">
        <div className="foot-grid">
          <div className="stack">
            <Link href="/" className="brand"><span className="brand-mark" aria-hidden="true" /><span className="brand-word">SMASH<br />CORNER</span></Link>
            <p className="muted">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Tennis and pickleball courts in Quezon City.</p>
          </div>
          <div><h4>Visit</h4><ul><li>{SITE.address}</li><li>Daily 7:00 AM – 10:00 PM</li><li>{SITE.phone}</li><li>{SITE.email}</li></ul></div>
          <div><h4>Explore</h4><ul><li><Link href="/courts">Courts</Link></li><li><Link href="/gallery">Gallery</Link></li><li><Link href="/programs">Programs &amp; Events</Link></li></ul></div>
          <div>
            <h4>Help</h4>
            <ul>
              <li><Link href="/book">Book a Court</Link></li>
              <li><Link href="/contact#faq-sec">FAQ</Link></li>
              <li><Link href="/policy">Booking Policy</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/admin">Admin Login</Link></li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© {new Date().getFullYear()} Smash Corner. All rights reserved.</span>
          <span><Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link></span>
        </div>
      </div>
    </footer>
  );
}
