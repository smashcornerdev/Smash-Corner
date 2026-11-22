/* Email for the Edge Functions: the same layout as the website's React Email template (src/lib/email/Mail.tsx: white
   paper, violet SMASH CORNER bar, label/value tables, lime button) as plain HTML, plus sending through Resend's HTTP API
   with the same rules as src/lib/email/send.ts (dry run, EMAIL_TEST_TO redirect, retries, idempotency keys).
   Imports only other _shared files. Values marked "html" must already be escaped with esc(). */
import { SITE_INFO } from "./site.ts";

const C = { violet: "#330c65", lime: "#bdf86c", ink: "#141218", muted: "#5d5866", line: "#ece9f0" };

export const esc = (v: unknown) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const bold = (v: unknown) => `<b>${esc(v)}</b>`;

export type MailRow = [label: string, html: string];
export type MailProps = {
  preview: string; title: string; greeting?: string; intro: string; // intro/extra/after are html
  tables?: { heading?: string; rows: MailRow[] }[]; extra?: string; button?: { label: string; href: string }; after?: string;
  audience: "customer" | "admin";
};

const strip = (html: string) => html.replace(/<br\s*\/?>/g, "\n").replace(/<\/p>/g, "\n").replace(/<[^>]+>/g, "")
  .replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim();

export function renderMail(p: MailProps): { html: string; text: string } {
  const footer = p.audience === "customer"
    ? `To cancel or reschedule, contact us: ${esc(SITE_INFO.phone)} · ${esc(SITE_INFO.email)}. Online cancellation is not available.<br>`
    : "Sent to all Smash Corner admin accounts.<br>";
  const tables = (p.tables ?? []).map((t) => `<div style="margin:12px 0">
${t.heading ? `<p style="font-weight:700;margin:12px 0 4px;font-size:14px">${esc(t.heading)}</p>` : ""}
<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px"><tbody>
${t.rows.map(([k, v]) => `<tr><td style="padding:6px 10px 6px 0;border-bottom:1px solid ${C.line};color:${C.muted};width:38%;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;border-bottom:1px solid ${C.line};vertical-align:top;white-space:pre-line">${v}</td></tr>`).join("\n")}
</tbody></table></div>`).join("\n");
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(p.title)}</title></head>
<body style="background:#f4f3f6;margin:0;font-family:'Lexend Deca','Segoe UI',Arial,sans-serif;color:${C.ink}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(p.preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3f6"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff">
<tr><td style="background:${C.violet};padding:16px 24px"><p style="margin:0;color:${C.lime};font-weight:900;letter-spacing:0.04em;font-size:16px">SMASH CORNER</p></td></tr>
<tr><td style="padding:8px 24px 24px">
<h2 style="font-size:20px;margin:20px 0 8px;color:${C.ink}">${esc(p.title)}</h2>
<p style="font-size:15px;line-height:22px;margin:8px 0">${p.greeting ? `Hi ${esc(p.greeting)}, ` : ""}${p.intro}</p>
${tables}
${p.extra ? `<div style="font-size:14px;line-height:21px">${p.extra}</div>` : ""}
${p.button ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:12px"><tr><td style="background:${C.lime}"><a href="${esc(p.button.href)}" style="display:inline-block;padding:12px 20px;color:${C.violet};font-weight:700;font-size:15px;text-decoration:none">${esc(p.button.label)}</a></td></tr></table>` : ""}
${p.after ? `<div style="font-size:13px;color:${C.muted};margin-top:12px">${p.after}</div>` : ""}
<hr style="border:none;border-top:1px solid ${C.line};margin:24px 0 12px">
<p style="font-size:12px;color:${C.muted};margin:0;line-height:18px">${footer}${esc(SITE_INFO.name)} · ${esc(SITE_INFO.address)} · ${esc(SITE_INFO.domain)}</p>
</td></tr></table></td></tr></table></body></html>`;
  const text = [
    "SMASH CORNER", "", p.title, "", strip((p.greeting ? `Hi ${esc(p.greeting)}, ` : "") + p.intro),
    ...(p.tables ?? []).flatMap((t) => ["", ...(t.heading ? [t.heading] : []), ...t.rows.map(([k, v]) => `${k}: ${strip(v)}`)]),
    ...(p.extra ? ["", strip(p.extra)] : []), ...(p.button ? ["", `${p.button.label}: ${p.button.href}`] : []), ...(p.after ? ["", strip(p.after)] : []),
    "", "---", strip(footer), `${SITE_INFO.name} · ${SITE_INFO.address} · ${SITE_INFO.domain}`,
  ].join("\n");
  return { html, text };
}

export type MailConfig = { apiKey?: string; from: string; testTo?: string; dryRun?: boolean };
export type Outgoing = { to: string; subject: string; mail: MailProps; key?: string };

/** never throws: an email failing must not undo the change that triggered it (same as the website) */
export async function sendMail(cfg: MailConfig, m: Outgoing): Promise<void> {
  const { html, text } = renderMail(m.mail);
  const to = cfg.testTo || m.to, subject = cfg.testTo ? `[to ${m.to}] ${m.subject}` : m.subject;
  if (cfg.dryRun || !cfg.apiKey) {
    console.info(`\n[email:dry-run] to=${to} subject="${subject}"\n${text}\n`);
    return;
  }
  try {
    const send = () => fetch("https://api.resend.com/emails", {
      method: "POST", signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json", ...(m.key ? { "Idempotency-Key": m.key } : {}) },
      body: JSON.stringify({ from: cfg.from, to, subject, html, text }),
    });
    let res = await send();
    // retry rate limits (429) and server errors (5xx) with backoff; the idempotency key makes retries safe
    for (let i = 1; i <= 3 && (res.status === 429 || res.status >= 500); i++) {
      await new Promise((r) => setTimeout(r, 500 * 2 ** i));
      res = await send();
    }
    if (!res.ok) console.error("[email] send failed", m.subject, res.status, (await res.text()).slice(0, 300));
  } catch (e) {
    console.error("[email] send failed", m.subject, e);
  }
}
