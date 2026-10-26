import type { Metadata } from "next";
import { PageTop } from "@/components/ui";
import { L } from "@/lib/config";

export const metadata: Metadata = { title: "Privacy Policy", description: "How Smash Corner collects and uses your personal data.", alternates: { canonical: "/privacy" } };

/* Placeholder: final wording to be supplied by Smash Corner (Data Privacy Act of 2012 compliance for privacy). */
export default function Page() {
  return (
    <>
      <PageTop eyebrow="Privacy" title="Privacy Policy" lead="Placeholder wording. The final text will be supplied by Smash Corner." />
      <section className="sec wrap stack" style={{ paddingTop: 12, maxWidth: 820 }}>
        {L.map((p) => <p className="muted" key={p}>{p}</p>)}
      </section>
    </>
  );
}
