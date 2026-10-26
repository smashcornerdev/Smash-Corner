import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components";
import type { ReactNode } from "react";
import { SITE } from "../config";

/* One layout for every system email: white "paper" with the violet Smash Corner bar (spec §14 email previews). */
export type MailRow = [label: string, value: ReactNode];
export type MailProps = {
  preview: string;
  title: string;
  greeting?: string;
  intro: ReactNode;
  tables?: { heading?: string; rows: MailRow[] }[];
  extra?: ReactNode;
  button?: { label: string; href: string };
  after?: ReactNode;
  audience: "customer" | "admin";
};

const C = { violet: "#330c65", lime: "#bdf86c", lavender: "#b483d2", ink: "#141218", muted: "#5d5866", line: "#ece9f0" };

export default function Mail(p: MailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{p.preview}</Preview>
      <Body style={{ background: "#f4f3f6", margin: 0, fontFamily: "Lexend Deca, Segoe UI, Arial, sans-serif", color: C.ink }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", background: "#ffffff" }}>
          <Section style={{ background: C.violet, padding: "16px 24px" }}>
            <Text style={{ margin: 0, color: C.lime, fontWeight: 900, letterSpacing: "0.04em", fontSize: 16 }}>SMASH CORNER</Text>
          </Section>
          <Section style={{ padding: "8px 24px 24px" }}>
            <Heading as="h2" style={{ fontSize: 20, margin: "20px 0 8px", color: C.ink }}>{p.title}</Heading>
            <Text style={{ fontSize: 15, lineHeight: "22px", margin: "8px 0" }}>
              {p.greeting ? <>Hi {p.greeting}, </> : null}
              {p.intro}
            </Text>
            {p.tables?.map((t, i) => (
              <Section key={i} style={{ margin: "12px 0" }}>
                {t.heading ? <Text style={{ fontWeight: 700, margin: "12px 0 4px", fontSize: 14 }}>{t.heading}</Text> : null}
                <table width="100%" cellPadding={0} cellSpacing={0} style={{ borderCollapse: "collapse", fontSize: 14 }}>
                  <tbody>
                    {t.rows.map(([k, v], j) => (
                      <tr key={j}>
                        <td style={{ padding: "6px 10px 6px 0", borderBottom: `1px solid ${C.line}`, color: C.muted, width: "38%", verticalAlign: "top" }}>{k}</td>
                        <td style={{ padding: "6px 0", borderBottom: `1px solid ${C.line}`, verticalAlign: "top", whiteSpace: "pre-line" }}>{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            ))}
            {p.extra ? <Section style={{ fontSize: 14, lineHeight: "21px" }}>{p.extra}</Section> : null}
            {p.button ? (
              <Button href={p.button.href} style={{ background: C.lime, color: C.violet, fontWeight: 700, padding: "12px 20px", fontSize: 15, marginTop: 12, textDecoration: "none" }}>
                {p.button.label}
              </Button>
            ) : null}
            {p.after ? <Section style={{ fontSize: 13, color: C.muted, marginTop: 12 }}>{p.after}</Section> : null}
            <Hr style={{ borderColor: C.line, margin: "24px 0 12px" }} />
            <Text style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: "18px" }}>
              {p.audience === "customer" ? (
                <>To cancel or reschedule, contact us: {SITE.phone} · {SITE.email}. Online cancellation is not available.<br /></>
              ) : (
                <>Sent to all Smash Corner admin accounts.<br /></>
              )}
              Smash Corner · {SITE.address} · {SITE.domain}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
