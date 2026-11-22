import ExportButton from "@/components/admin/ExportForm";

/* Court Bookings (v5.85) and Classes & Events (v5.95) on phones (spec §7): the Export to Excel icon at the right end of the table's search row (DataTable `tools`;
   the header's Export button is hidden there on phones). Not shown on wider screens, where Export stays beside the title. */
export default function TableExport({ courts, kind = "court" }: { courts: { id: string; name: string }[]; kind?: "court" | "class" }) {
  return <div className="tbl-exp"><ExportButton kind={kind} courts={courts.map((c) => ({ id: c.id, name: c.name }))} /></div>;
}
