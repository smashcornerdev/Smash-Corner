import { inventoryAction } from "@/app/actions/admin";
import { requireAdmin } from "@/lib/auth";
import { getEquipment, getInventory } from "@/lib/catalog";
import { peso } from "@/lib/format";

/* Management → Equipment Inventory (super-admins, spec §7 Equipment Inventory Rules) */
export default async function InventoryPage() {
  await requireAdmin({ superOnly: true });
  const [items, inv] = await Promise.all([getEquipment(), getInventory()]);
  return (
    <>
      <p className="muted" style={{ maxWidth: "70ch" }}>Enter how many of each item you own. Items out of service are not offered. Customers can only rent what is free for their chosen hour.</p>
      <form action={inventoryAction} className="stack">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Item</th><th>Rate</th><th>Owned</th><th>Out of service</th><th className="num">Available</th></tr></thead>
            <tbody>
              {items.map((e) => {
                const v = inv.find((x) => x.item_id === e.id) ?? { owned: 0, out_of_service: 0 };
                return (
                  <tr key={e.id}>
                    <td><b>{e.name}</b><br /><small className="muted">{e.type === "tennis" ? "Tennis" : "Pickleball"}</small></td>
                    <td>{peso(e.rate)} / item / hr</td>
                    <td><input className="inp" type="number" min={0} name={`own-${e.id}`} defaultValue={v.owned} style={{ width: 90 }} /></td>
                    <td><input className="inp" type="number" min={0} name={`out-${e.id}`} defaultValue={v.out_of_service} style={{ width: 90 }} /></td>
                    <td className="num">{Math.max(0, v.owned - v.out_of_service)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="row"><button className="btn btn-lime" type="submit">Save inventory</button></div>
      </form>
    </>
  );
}
