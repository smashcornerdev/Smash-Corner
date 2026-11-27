import data from "@/data/gallery.json";

/* Gallery photos (spec §3, v6.52): one list, no sections. The photos live in the client's public Google Drive folder
   (`source` in src/data/gallery.json); each entry is a Drive file id plus the photo's pixel size
   (w, h; only the shape matters), so the masonry is laid out before any photo loads (v6.62). To add a photo, add its id, file
   and size to the JSON. */
export type GalleryPhoto = { id: string; file: string; w: number; h: number };
export const GALLERY_SOURCE = data.source;
export const GALLERY: GalleryPhoto[] = data.photos;

/** image URL for a Drive file at a given width (Google serves a resized JPEG) */
export const driveImg = (id: string, w: number) => `https://lh3.googleusercontent.com/d/${id}=w${w}`;
