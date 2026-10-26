/* Gallery sections (spec §3): 4 sections × 6 photos, placeholders until real photos arrive */
export const GALLERY = [
  { id: "pickleball", name: "Pickleball Courts", kind: "pickle" },
  { id: "tennis", name: "Tennis Courts", kind: "tennis" },
  { id: "bathroom", name: "Bathroom", kind: "bath" },
  { id: "amenities", name: "Amenities", kind: "amen" },
] as const;
export const GALLERY_TONES = ["lime", "dark", "lav", "dark2", "dark", "lime"] as const;
