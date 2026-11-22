"use client";
import { useEffect, useState } from "react";
import { proofLinkAction } from "@/app/actions/admin";
import { fmtTs } from "@/lib/time";

/* Proof of payment inside a preloaded booking card (spec §7, v5.76). Receipt links expire after 10 minutes, so instead of
   being made when the page loads, the link is fetched when the card opens; the rest of the card is already there. */
export default function ProofImage({ orderId, paidAt }: { orderId: string; paidAt?: string | null }) {
  const [p, setP] = useState<{ url: string | null; pdf: boolean } | null>(null);
  useEffect(() => {
    let on = true;
    proofLinkAction(orderId).then((r) => { if (on) setP(r); }).catch(() => { if (on) setP({ url: null, pdf: false }); });
    return () => { on = false; };
  }, [orderId]);
  if (!p) return <div className="proof-wait muted" role="status">Loading proof of payment…</div>;
  if (!p.url) return <div className="banner">No receipt on file.</div>;
  return (
    <div className="stack" style={{ gap: 8 }}>
      {p.pdf ? <iframe className="proof-frame" src={p.url} title="Proof of payment" /> : <img className="proof-img" src={p.url} alt="Proof of payment" />}
      <a href={p.url} target="_blank" rel="noreferrer" style={{ fontSize: ".86rem" }}>Open full size{paidAt ? ` · uploaded ${fmtTs(paidAt)}` : ""}</a>
    </div>
  );
}
