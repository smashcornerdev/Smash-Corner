"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Link from "next/link";
import { Ph, TONES, courtArt } from "@/components/art";
import Countdown from "./Countdown";
import { removeFromCartAction } from "@/app/actions/booking";
import { peso } from "@/lib/format";
import { fmtDate, fmtRange } from "@/lib/time";

export type CartLine = { id: string; court: string; courtType: string; date: string; hours: number[]; players: number; equipment: string; total: number; expires: string; claim: boolean };

export default function CartList({ lines }: { lines: CartLine[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const remove = (id: string) => start(async () => { await removeFromCartAction(id); window.dispatchEvent(new Event("cart-changed")); router.refresh(); });
  return (
    <div className="stack">
      {lines.map((c, i) => (
        <div className="cart-item" key={c.id}>
          <Ph kind={courtArt(c.courtType)} tone={TONES[i % 3]} label={c.court} />
          <div className="stack" style={{ gap: 4 }}>
            <h3>{c.court}</h3>
            <span>{fmtDate(c.date)} · {fmtRange(c.hours)}</span>
            <span className="muted" style={{ fontSize: ".88rem" }}>{c.players} players · Equipment: {c.equipment}</span>
            <span className="hold">{c.claim ? "Waitlist claim · " : ""}Held for <Countdown until={c.expires} onEnd={() => router.refresh()} /></span>
          </div>
          <div className="ci-r">
            <b className="lime tabnum">{peso(c.total)}</b>
            <button className="linkbtn" disabled={pending} onClick={() => remove(c.id)}>Remove</button>
          </div>
        </div>
      ))}
      <div className="row"><Link href="/book" className="btn btn-ghost">Add another booking</Link></div>
    </div>
  );
}
