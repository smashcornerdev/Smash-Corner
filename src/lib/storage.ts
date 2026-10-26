import "server-only";
import { db } from "./supabase";

const MAX = 5 * 1024 * 1024;
const OK_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];

/** proof of payment → private "receipts" bucket (spec §18). Returns the storage path. */
export async function uploadReceipt(file: File, prefix: string): Promise<string> {
  if (!file || file.size === 0) throw new Error("Upload your proof of payment.");
  if (file.size > MAX) throw new Error("That file is over 5 MB. Upload a smaller image or PDF.");
  if (!OK_TYPES.includes(file.type)) throw new Error("Upload a JPG, PNG or PDF.");
  const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1];
  const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
  const { error } = await db().storage.from("receipts").upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type });
  if (error) throw new Error("Upload failed. Please try again.");
  return path;
}

/** short-lived link for admins to view a receipt */
export async function receiptUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await db().storage.from("receipts").createSignedUrl(path, 60 * 10);
  return data?.signedUrl ?? null;
}

/** payment-method QR code → public "payment-qr" bucket */
export async function uploadQr(file: File): Promise<{ path: string; url: string }> {
  if (file.size > MAX) throw new Error("That image is over 5 MB.");
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) throw new Error("Upload a PNG, JPG or WebP image.");
  const path = `${crypto.randomUUID()}.${file.type.split("/")[1]}`;
  const { error } = await db().storage.from("payment-qr").upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type });
  if (error) throw new Error("Upload failed. Please try again.");
  return { path, url: db().storage.from("payment-qr").getPublicUrl(path).data.publicUrl };
}
