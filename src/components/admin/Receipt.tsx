import ProofImage from "@/components/admin/ProofImage";
import { receiptUrl } from "@/lib/storage";
import { fmtTs } from "@/lib/time";

/* Proof of payment viewer: short-lived signed link from the private bucket (spec §18).
   `lazyOrder` (preloaded booking cards, v5.76): the link is fetched when the card opens instead of now, so it can't have expired. */
export default async function Receipt({ path, status, free, dueAt, paidAt, lazyOrder }: { path: string | null; status: string; free?: boolean; dueAt?: string | null; paidAt?: string | null; lazyOrder?: string }) {
  if (free) return <div className="banner lime">No payment needed for this booking.</div>;
  if (status === "pending") return <div className="banner">Nothing paid yet. The customer pays after the request is approved.</div>;
  if (status === "awaiting") return <div className="banner">Not paid yet.{dueAt ? <> Payment is due by <b>{fmtTs(dueAt)}</b>.</> : null}</div>;
  if (status === "unpaid") return <div className="banner">Not paid. The request expired 24 hours after it was approved.</div>;
  if (lazyOrder) return path ? <ProofImage orderId={lazyOrder} paidAt={paidAt} /> : <div className="banner">No receipt on file.</div>;
  const url = await receiptUrl(path);
  if (!url) return <div className="banner">No receipt on file.</div>;
  const pdf = path?.endsWith(".pdf");
  return (
    <div className="stack" style={{ gap: 8 }}>
      {pdf ? <iframe className="proof-frame" src={url} title="Proof of payment" /> : <img className="proof-img" src={url} alt="Proof of payment" />}
      <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: ".86rem" }}>Open full size{paidAt ? ` · uploaded ${fmtTs(paidAt)}` : ""}</a>
    </div>
  );
}
