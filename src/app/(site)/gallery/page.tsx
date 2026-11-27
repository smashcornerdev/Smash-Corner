import type { Metadata } from "next";
import GalleryView from "@/components/site/GalleryView";
import { PageTop } from "@/components/ui";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos of the Smash Corner pickleball and tennis courts, bathrooms and amenities.",
  alternates: { canonical: "/gallery" },
};

export default function GalleryPage() {
  return (
    <>
      <PageTop eyebrow="Gallery" title="On the court" lead="Where the game comes to life." />
      <GalleryView />
    </>
  );
}
