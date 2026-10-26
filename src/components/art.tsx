/* Icons and photo placeholders, ported from the mockup (spec §14: thick arrowheads, solid line art). */

/** the one arrow shape used everywhere: a thick chevron, rotated for direction */
export function Arrow({ dir }: { dir?: "l" | "u" | "d" }) {
  return (
    <svg className={"ah" + (dir ? " ah-" + dir : "")} viewBox="0 0 10 16" aria-hidden="true">
      <path d="M2.5 2.5 8 8l-5.5 5.5" />
    </svg>
  );
}

const ART: Record<string, string> = {
  tennis: '<rect x="40" y="40" width="320" height="220"/><line x1="40" y1="67" x2="360" y2="67"/><line x1="40" y1="233" x2="360" y2="233"/><line x1="200" y1="28" x2="200" y2="272" stroke-width="6"/><line x1="120" y1="67" x2="120" y2="233"/><line x1="280" y1="67" x2="280" y2="233"/><line x1="120" y1="150" x2="280" y2="150"/><line x1="40" y1="150" x2="50" y2="150"/><line x1="350" y1="150" x2="360" y2="150"/><circle class="f" cx="300" cy="105" r="10"/>',
  pickle: '<rect x="70" y="55" width="260" height="190"/><line x1="200" y1="43" x2="200" y2="257" stroke-width="6"/><line x1="160" y1="55" x2="160" y2="245"/><line x1="240" y1="55" x2="240" y2="245"/><line x1="70" y1="150" x2="160" y2="150"/><line x1="240" y1="150" x2="330" y2="150"/><circle cx="112" cy="100" r="11"/><circle class="f" cx="108" cy="97" r="2"/><circle class="f" cx="116" cy="103" r="2"/><circle class="f" cx="113" cy="94" r="1.6"/>',
  bath: '<rect x="60" y="45" width="120" height="150" rx="4"/><line x1="60" y1="225" x2="340" y2="225"/><path d="M80 225 v-20 q40 18 80 0 v20"/><path d="M120 205 v-16 h14"/><line x1="220" y1="45" x2="220" y2="225"/><line x1="280" y1="45" x2="280" y2="225"/><line x1="340" y1="45" x2="340" y2="225"/><line x1="220" y1="105" x2="340" y2="105"/><line x1="220" y1="165" x2="340" y2="165"/><circle class="f" cx="100" cy="85" r="5"/>',
  amen: '<rect x="50" y="50" width="70" height="180"/><rect x="120" y="50" width="70" height="180"/><line x1="70" y1="80" x2="100" y2="80"/><line x1="140" y1="80" x2="170" y2="80"/><circle class="f" cx="108" cy="140" r="4"/><circle class="f" cx="178" cy="140" r="4"/><line x1="220" y1="190" x2="350" y2="190" stroke-width="8"/><line x1="235" y1="190" x2="235" y2="230"/><line x1="335" y1="190" x2="335" y2="230"/><rect x="290" y="110" width="26" height="62" rx="6"/><line x1="296" y1="104" x2="310" y2="104"/>',
  coach: '<circle cx="160" cy="110" r="40"/><path d="M80 280 q80 -130 160 0"/><ellipse cx="290" cy="120" rx="34" ry="44" transform="rotate(25 290 120)"/><line x1="272" y1="160" x2="252" y2="215" stroke-width="8"/>',
};
export type Tone = "lime" | "lav" | "dark" | "dark2";
export type ArtKind = keyof typeof ART | "tennis" | "pickle";

/** "Photo placeholder" until real photos are supplied (spec §1 content rule) */
export function Ph({ kind, tone, label, style }: { kind: string; tone: Tone; label: string; style?: React.CSSProperties }) {
  return (
    <div className={`ph t-${tone}`} role="img" aria-label={label} style={style}>
      <svg viewBox="0 0 400 300" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round"
        preserveAspectRatio="xMidYMid meet" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ART[kind] ?? ART.tennis }} />
      <span className="ph-tag">Photo placeholder</span>
    </div>
  );
}
export const courtArt = (type: string) => (type === "tennis" ? "tennis" : "pickle");
export const TONES: Tone[] = ["lime", "lav", "dark"];

const ICONS: Record<string, string> = {
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z" stroke-linejoin="round"/>',
  cal: '<rect x="3" y="5" width="18" height="16"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  light: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
  shield: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" stroke-linejoin="round"/><path d="m9 12 2 2 4-4"/>',
  park: '<rect x="3" y="3" width="18" height="18"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
  shower: '<path d="M4 20V8a4 4 0 0 1 8 0"/><path d="M9 8h6M10 12v1M13 12v1M16 12v1M10 16v1M13 16v1M16 16v1"/>',
  wifi: '<path d="M2 9a15 15 0 0 1 20 0M5 13a10 10 0 0 1 14 0M8.5 16.5a5 5 0 0 1 7 0"/><circle cx="12" cy="20" r="1"/>',
  cup: '<path d="M5 8h12v7a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z"/><path d="M17 10h2a2 2 0 0 1 0 4h-2M8 3v2M12 3v2"/>',
  lock: '<rect x="5" y="10" width="14" height="11"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  seat: '<path d="M3 11h18M5 11v8M19 11v8M4 7h16"/>',
};
export function Icon({ name, className }: { name: keyof typeof ICONS | string; className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[name] ?? "" }} />;
}

export function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 8h14l-1.2 12H6.2z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
