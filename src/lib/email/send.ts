import "server-only";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { createElement } from "react";
import Mail, { type MailProps } from "./Mail";
import { env } from "../env";
import { SENDER } from "../config";
import { db } from "../supabase";

/* Email delivery through Resend (spec §18, v4.71).
   Without RESEND_API_KEY (or with EMAIL_DRY_RUN=true) emails are printed to the server console instead.
   With EMAIL_TEST_TO set, every email goes to that one address (needed while sending from onboarding@resend.dev,
   which only delivers to the Resend account's own email). */
let resend: Resend | null = null;
const client = () => (resend ??= new Resend(env.resendKey()));

export type Outgoing = { to: string; subject: string; mail: MailProps; key?: string; replyTo?: string };

/** test redirect: real recipient goes into the subject */
function target(to: string, subject: string) {
  const t = env.emailTestTo();
  return t ? { to: t, subject: `[to ${to}] ${subject}` } : { to, subject };
}

type SendResult = { error: { message: string; statusCode?: number | null } | null };
/** retry rate limits (429) and server errors (5xx) with backoff; idempotency keys make retries safe */
async function withRetry(fn: () => Promise<SendResult>): Promise<SendResult> {
  let res = await fn();
  for (let i = 1; i <= 3 && res.error && (res.error.statusCode === 429 || (res.error.statusCode ?? 0) >= 500); i++) {
    await new Promise((r) => setTimeout(r, 500 * 2 ** i));
    res = await fn();
  }
  return res;
}

export async function sendMail(m: Outgoing): Promise<void> {
  const html = await render(createElement(Mail, m.mail));
  const text = await render(createElement(Mail, m.mail), { plainText: true });
  const { to, subject } = target(m.to, m.subject);
  if (env.emailDryRun()) {
    console.info(`\n[email:dry-run] to=${to} subject="${subject}"\n${text}\n`);
    return;
  }
  const { error } = await withRetry(() => client().emails.send(
    { from: SENDER, to, subject, html, text, ...(m.replyTo ? { replyTo: m.replyTo } : {}) },
    m.key ? { idempotencyKey: m.key } : undefined,
  ));
  // An email failing must never undo the booking change that triggered it; log and move on.
  if (error) console.error("[email] send failed", m.subject, error);
}

/** one message per admin (Resend batch), so each admin gets their own copy */
export async function sendToAdmins(subject: string, mail: Omit<MailProps, "audience">, key?: string): Promise<void> {
  const { data } = await db().from("admins").select("email");
  const emails = ((data as { email: string }[] | null) ?? []).map((a) => a.email);
  if (!emails.length) return;
  const full: MailProps = { ...mail, audience: "admin" };
  // dry run or test redirect: one copy is enough
  if (env.emailDryRun() || env.emailTestTo()) {
    await sendMail({ to: `all admins (${emails.join(", ")})`, subject, mail: full, key });
    return;
  }
  const html = await render(createElement(Mail, full));
  const text = await render(createElement(Mail, full), { plainText: true });
  const { error } = await withRetry(() => client().batch.send(
    emails.map((to) => ({ from: SENDER, to, subject, html, text })),
    key ? { idempotencyKey: key } : undefined,
  ));
  if (error) console.error("[email] admin batch failed", subject, error);
}
