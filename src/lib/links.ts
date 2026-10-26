import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { env } from "./env";
import { SITE } from "./config";

/* Signed, single-purpose links (spec §6 Pay build note): guests can pay or claim without an account. */
type Payload =
  | { k: "pay-court"; id: string; exp: number } // id = order id
  | { k: "pay-class"; id: string; exp: number } // id = class registration id
  | { k: "claim"; id: string; exp: number }; // id = waitlist id

const b64 = (s: string | Buffer) => Buffer.from(s).toString("base64url");
const sign = (body: string) => createHmac("sha256", env.payLinkSecret()).update(body).digest("base64url");

export function makeToken(p: Payload): string {
  const body = b64(JSON.stringify(p));
  return `${body}.${sign(body)}`;
}
export function readToken(token: string): Payload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const good = Buffer.from(sign(body)), got = Buffer.from(sig);
  if (good.length !== got.length || !timingSafeEqual(good, got)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString()) as Payload;
    return p.exp > Date.now() ? p : null;
  } catch {
    return null;
  }
}

const WEEK = 7 * 86400e3;
/** payment page link; stays readable for a week after the deadline so customers can see what happened */
export const payUrl = (kind: "court" | "class", id: string, dueAt: string | null) =>
  `${SITE.url}/pay/${makeToken({ k: kind === "court" ? "pay-court" : "pay-class", id, exp: (dueAt ? new Date(dueAt).getTime() : Date.now()) + WEEK })}`;
export const claimUrl = (waitlistId: string, expiresAt: string) =>
  `${SITE.url}/book?claim=${makeToken({ k: "claim", id: waitlistId, exp: new Date(expiresAt).getTime() })}`;
