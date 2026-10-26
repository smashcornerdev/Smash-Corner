import "server-only";
import { cookies } from "next/headers";

/* Anonymous cart session (httpOnly cookie set by the middleware). Holds belong to this id. */
export const CART_COOKIE = "sc_cart";
export async function sessionId(): Promise<string | null> {
  return (await cookies()).get(CART_COOKIE)?.value ?? null;
}
export async function requireSession(): Promise<string> {
  const s = await sessionId();
  if (!s) throw new Error("Your browser blocked the cart cookie. Please enable cookies and try again.");
  return s;
}
