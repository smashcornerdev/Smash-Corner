import type { Metadata } from "next";
import { PageTop } from "@/components/ui";
import { L } from "@/lib/config";

export const metadata: Metadata = { title: "Terms of Use", description: "Terms of use for the Smash Corner website and online booking.", alternates: { canonical: "/terms" } };

/* Placeholder: final wording to be supplied by Smash Corner (Data Privacy Act of 2012 compliance for terms). */
export default function Page() {
  return (
    <>
      <PageTop eyebrow="Terms" title="Terms of Use" lead="Placeholder wording. The final text will be supplied by Smash Corner." />
      <section className="sec wrap stack" style={{ paddingTop: 12, maxWidth: 820 }}>
        {L.map((p) => <p className="muted" key={p}>{p}</p>)}
      </section>
    </>
  );
}
