import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import GalleryPreload from "@/components/site/GalleryPreload";
import { GALLERY, driveImg } from "@/lib/gallery";

// the first 20 Gallery photos, fetched in the background on the first page opened (v6.69); same size as the Gallery grid's
const PRELOAD = GALLERY.slice(0, 20).map((g) => driveImg(g.id, 800));

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      <GalleryPreload urls={PRELOAD} />
    </>
  );
}
