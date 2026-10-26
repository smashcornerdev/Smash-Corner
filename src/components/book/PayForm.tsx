"use client";
import { useActionState, useState } from "react";
import { payAction, type ActionResult } from "@/app/actions/booking";
import { peso } from "@/lib/format";

type Method = { id: string; name: string; details: string; qr_url: string | null };

/* Payment page form (spec §6 Pay, §16): method → details/QR → proof upload + reference */
export default function PayForm({ token, methods, total, refs }: { token: string; methods: Method[]; total: number; refs: string[] }) {
  const [state, action, pending] = useActionState<ActionResult, FormData>(payAction.bind(null, token), { ok: false });
  const [method, setMethod] = useState<string | null>(null);
  const [file, setFile] = useState<{ name: string; url: string | null } | null>(null);
  const [fileErr, setFileErr] = useState("");
  const [copied, setCopied] = useState(false);
  const m = methods.find((x) => x.id === method);

  const onFile = (f: File | undefined) => {
    setFileErr("");
    if (!f) return setFile(null);
    if (f.size > 5 * 1024 * 1024) { setFileErr("That file is over 5 MB. Upload a smaller image or PDF."); return; }
    if (!/^image\//.test(f.type) && f.type !== "application/pdf") { setFileErr("Upload a JPG, PNG or PDF."); return; }
    setFile({ name: f.name, url: f.type.startsWith("image/") ? URL.createObjectURL(f) : null });
  };

  return (
    <form className="panel" action={action}>
      <div className="refs">{refs.map((r) => <span className="ref" key={r}>{r}</span>)}</div>
      <div className="stack" style={{ gap: 10 }}>
        <h3>1. Choose a payment method</h3>
        <div className="methods">
          {methods.length ? methods.map((x) => (
            <button type="button" key={x.id} className={"method" + (method === x.id ? " sel" : "")} aria-pressed={method === x.id} onClick={() => setMethod(x.id)}>{x.name}</button>
          )) : <div className="banner">No payment methods are available right now. Please contact us.</div>}
        </div>
        <input type="hidden" name="method" value={method ?? ""} />
      </div>
      {m ? (
        <div className={"pay-box" + (m.qr_url ? "" : " no-qr")}>
          {m.qr_url ? <img className="qr-img" src={m.qr_url} alt={`${m.name} QR code`} /> : null}
          <div className="stack" style={{ gap: 8 }}>
            <b className="acct">{m.name}</b>
            <div className="pm-details">{m.details}</div>
            <div className="row">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard?.writeText(m.details).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}>{copied ? "Copied" : "Copy details"}</button>
            </div>
            <span>Amount: <b className="lime tabnum">{peso(total)}</b></span>
          </div>
        </div>
      ) : null}
      <div className="stack" style={{ gap: 10 }}>
        <h3>2. Upload proof of payment</h3>
        <label className="drop" htmlFor="proofIn">
          {file ? (<>{file.url ? <img src={file.url} alt="Uploaded receipt preview" /> : null}<b>{file.name}</b><span className="muted" style={{ fontSize: ".85rem" }}>Click to replace</span></>)
            : (<><b>Drop your receipt here or click to upload</b><span className="muted" style={{ fontSize: ".85rem" }}>JPG, PNG or PDF · max 5 MB</span></>)}
        </label>
        <input type="file" id="proofIn" name="proof" accept="image/*,application/pdf" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        {fileErr ? <em className="err">{fileErr}</em> : null}
        <label className="f"><span>Payment reference number</span><input className="inp" name="payRef" placeholder="e.g. 1234 5678 9012" minLength={4} required /></label>
      </div>
      {state.error ? <em className="err">{state.error}</em> : null}
      <div className="row"><button className="btn btn-lime" type="submit" disabled={pending || !!fileErr}>{pending ? "Uploading…" : "Submit payment"}</button></div>
    </form>
  );
}
