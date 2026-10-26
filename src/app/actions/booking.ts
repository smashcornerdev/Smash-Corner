"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { BRANCH_ID, HOURS } from "@/lib/config";
import { db } from "@/lib/supabase";
import { requireSession } from "@/lib/session";
import { readToken } from "@/lib/links";
import { courtById } from "@/lib/catalog";
import { dayStates } from "@/lib/availability";
import { maxBookKey, todayKey } from "@/lib/time";
import { validPhone } from "@/lib/format";
import { FlowError, addToCart, removeFromCart, submitPayment, submitRequest } from "@/lib/flows/bookings";
import { register, submitClassPayment } from "@/lib/flows/classes";
import { mailAdminWaitlistApplied, mailWaitlistApplied } from "@/lib/email/messages";

export type ActionResult = { ok: boolean; error?: string };
const fail = (e: unknown): ActionResult => {
  if (e instanceof FlowError) return { ok: false, error: e.message };
  console.error(e);
  return { ok: false, error: "Something went wrong. Please try again." };
};

const person = {
  name: z.string().trim().min(1, "Enter your name.").max(120),
  phone: z.string().trim().refine(validPhone, "Enter a valid mobile number, e.g. 0917 123 4567."),
  email: z.string().trim().email("Enter a valid email address.").max(200),
};
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((d) => d >= todayKey() && d <= maxBookKey(), "You can book up to 1 month ahead.");

const cartSchema = z.object({
  ...person,
  courtId: z.string(), date: dateKey,
  hours: z.array(z.number().int().refine((h) => HOURS.includes(h))).min(1, "Choose at least one time slot."),
  players: z.number().int(),
  equipment: z.record(z.string(), z.number().int().min(0).max(50)),
  claim: z.string().optional(),
});

/* Step 4 → Add to cart (15-minute hold) */
export async function addToCartAction(input: z.input<typeof cartSchema>): Promise<ActionResult> {
  const p = cartSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Check your details." };
  try {
    const t = p.data.claim ? readToken(p.data.claim) : null;
    if (p.data.claim && (!t || t.k !== "claim")) return { ok: false, error: "This claim link has expired." };
    await addToCart(await requireSession(), { ...p.data, claimToken: t ? { waitlistId: t.id } : undefined });
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function removeFromCartAction(holdId: string) {
  await removeFromCart(await requireSession(), holdId);
  revalidatePath("/cart");
}

/* "Send booking request" (no payment yet, spec §6 Send request) */
export async function submitRequestAction(_: ActionResult, fd: FormData): Promise<ActionResult> {
  if (fd.get("agree") !== "on") return { ok: false, error: "You need to agree to the policy to book." };
  let orderId: string;
  try {
    orderId = (await submitRequest(await requireSession())).orderId;
  } catch (e) {
    return fail(e);
  }
  redirect(`/done?o=${orderId}`);
}

/* Apply for the waitlist on a taken hour (spec §9): an admin approves it before it enters the line */
const waitSchema = z.object({ ...person, courtId: z.string(), date: dateKey, hour: z.number().int(), players: z.number().int() });
export async function joinWaitlistAction(input: z.input<typeof waitSchema>): Promise<ActionResult> {
  const p = waitSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Check your details." };
  const d = p.data;
  const court = await courtById(d.courtId);
  if (!court) return { ok: false, error: "Choose a court." };
  if (d.players < court.min_players || d.players > court.max_players) return { ok: false, error: `Players must be between ${court.min_players} and ${court.max_players}.` };
  const st = (await dayStates(court.id, d.date, null))[d.hour];
  if (st !== "taken" && st !== "reserved") return { ok: false, error: "This hour is open now. Pick it in the time grid instead." };
  const ins = await db().from("waitlist").insert({ branch_id: BRANCH_ID, court_id: court.id, date: d.date, hour: d.hour, name: d.name, email: d.email, phone: d.phone, players: d.players, status: "applied" }).select("id").single();
  if (ins.error) return { ok: false, error: ins.error.code === "23505" ? "This email has already applied for the waitlist for this slot." : "Something went wrong. Please try again." };
  const slot = { court: court.name, date: d.date, hour: d.hour };
  await mailWaitlistApplied(d, slot);
  await mailAdminWaitlistApplied(d, slot, (ins.data as { id: string }).id);
  return { ok: true };
}

/* Class / event registration (spec §6): no payment until approved */
const classSchema = z.object({
  classId: z.string().uuid(), ...person,
  nickname: z.string().trim().min(1, "Enter a nickname.").max(60),
  age: z.number().int().min(1, "Enter your age as a number.").max(100, "Enter your age as a number."),
  rent: z.boolean(),
});
export async function registerClassAction(input: z.input<typeof classSchema>): Promise<ActionResult & { ref?: string; email?: string }> {
  const p = classSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Check your details." };
  try {
    const r = await register(p.data);
    return { ok: true, ref: r.ref, email: r.email };
  } catch (e) {
    return fail(e);
  }
}

/* Payment page (after approval): method + proof + reference */
export async function payAction(token: string, _: ActionResult, fd: FormData): Promise<ActionResult> {
  const t = readToken(token);
  if (!t || (t.k !== "pay-court" && t.k !== "pay-class")) return { ok: false, error: "This payment link is no longer valid." };
  const method = String(fd.get("method") ?? ""), ref = String(fd.get("payRef") ?? ""), file = fd.get("proof");
  if (!method) return { ok: false, error: "Choose how you paid." };
  if (!(file instanceof File) || !file.size) return { ok: false, error: "Upload your proof of payment." };
  try {
    if (t.k === "pay-court") await submitPayment(t.id, method, ref, file);
    else await submitClassPayment(t.id, method, ref, file);
  } catch (e) {
    if (e instanceof Error && /Upload|5 MB|JPG/.test(e.message)) return { ok: false, error: e.message };
    return fail(e);
  }
  revalidatePath(`/pay/${token}`);
  return { ok: true };
}
