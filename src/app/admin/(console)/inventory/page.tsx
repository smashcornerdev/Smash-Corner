import { inventoryAction } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { getEquipment, getInventory } from "@/lib/catalog";
import { RENT_ITEM } from "@/lib/config";
import { AddItemButton, DeleteItemBtn } from "@/components/admin/InventoryControls";
import TabIntro from "@/components/admin/TabIntro";
import TabData from "@/components/admin/TabData";
import { SkelTable } from "@/components/admin/Skeleton";

/* Management → Equipment Inventory (super-admins, spec §7 Equipment Inventory Rules): add / delete rental items (v6.05), and set
   each item's name, price, per hour or per session, and how many are owned / out of service */
export default function InventoryPage() {
  // v6.01: the note shows at once; the table streams in after it (skeleton until then)
  return (
    <>
      <TabIntro tab="inventory" />
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <p className="muted" style={{ maxWidth: "70ch" }}>Add the items customers can rent, set each one&apos;s price <b>per hour</b> (charged for every hour booked) or <b>per session</b> (charged once per booking), and enter how many you own. Items out of service are not offered. Customers can only rent what is free for their chosen hour.</p>
        <AddItemButton />
      </div>
      <TabData tab="inventory" fallback={<SkelTable cols={8} rows={4} search={false} />}><InventoryData /></TabData>
    </>
  );
}

async function InventoryData() {
  await requireAdmin({ superOnly: true });
  const [items, inv] = await Promise.all([getEquipment(), getInventory()]);
  return (
    <>
      <form action={inventoryAction} className="stack">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Item</th><th>Sport</th><th>Price (₱ per item)</th><th>Charged</th><th>Owned</th><th>Out of service</th><th className="num">Available</th><th></th></tr></thead>
            <tbody>
              {!items.length ? <tr><td colSpan={8} className="muted">No rental items yet. Use + Add item.</td></tr> : null}
              {items.map((e) => {
                const v = inv.find((x) => x.item_id === e.id) ?? { owned: 0, out_of_service: 0 };
                const forClasses = Object.values(RENT_ITEM).includes(e.id);
                return (
                  <tr key={e.id}>
                    <td><input className="inp" name={`name-${e.id}`} defaultValue={e.name} required maxLength={60} aria-label="Item name" style={{ minWidth: 180 }} /></td>
                    <td>{e.type === "tennis" ? "Tennis" : "Pickleball"}</td>
                    <td><input className="inp" type="number" min={0} step={1} name={`rate-${e.id}`} defaultValue={e.rate} aria-label={`${e.name} price`} style={{ width: 100 }} /></td>
                    <td><select className="inp" name={`unit-${e.id}`} defaultValue={e.unit} aria-label={`${e.name} charged`} style={{ width: 140 }}><option value="hour">Per hour</option><option value="session">Per session</option></select></td>
                    <td><input className="inp" type="number" min={0} name={`own-${e.id}`} defaultValue={v.owned} aria-label={`${e.name} owned`} style={{ width: 90 }} /></td>
                    <td><input className="inp" type="number" min={0} name={`out-${e.id}`} defaultValue={v.out_of_service} aria-label={`${e.name} out of service`} style={{ width: 90 }} /></td>
                    <td className="num">{Math.max(0, v.owned - v.out_of_service)}</td>
                    <td>{forClasses ? <small className="muted" style={{ display: "block", maxWidth: 160, lineHeight: 1.35 }}>Can&apos;t delete: rented in class registrations</small> : <DeleteItemBtn id={e.id} name={e.name} />}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="row"><button className="btn btn-lime" type="submit" data-trace>Save inventory</button></div>
      </form>
    </>
  );
}
