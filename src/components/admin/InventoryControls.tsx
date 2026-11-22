"use client";
import { useFormStatus } from "react-dom";
import ModalButton from "@/components/admin/Modal";
import { deleteRentalItemAction, rentalItemAction } from "@/app/actions/admin";

/* Management → Equipment Inventory controls (spec §7, v6.05): + Add item (modal form) and each row's Delete button. */

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button className="btn btn-lime" type="submit" disabled={pending} data-trace>{pending ? "Saving…" : label}</button>;
}

export function AddItemButton() {
  return (
    <ModalButton label="+ Add item" eyebrow="Equipment Inventory" title="Add rental item" trace intro outro>
      <form action={rentalItemAction} className="stack" style={{ gap: 14 }}>
        <label className="f"><span>Name</span><input className="inp" name="name" required maxLength={60} placeholder="e.g. Tennis Racket" /></label>
        <fieldset className="f" style={{ border: 0, padding: 0, margin: 0 }}>
          <span>Sport</span>
          <div className="seg">
            <label><input type="radio" name="type" value="tennis" required defaultChecked /> Tennis</label>
            <label><input type="radio" name="type" value="pickle" /> Pickleball</label>
          </div>
        </fieldset>
        <div className="form-grid">
          <label className="f"><span>Price per item (₱)</span><input className="inp" name="rate" type="number" min={0} step={1} required inputMode="numeric" /></label>
          <label className="f"><span>Charged</span>
            <select className="inp" name="unit" defaultValue="hour"><option value="hour">Per hour</option><option value="session">Per session</option></select>
          </label>
          <label className="f"><span>How many you own</span><input className="inp" name="owned" type="number" min={0} step={1} defaultValue={0} inputMode="numeric" /></label>
        </div>
        <p className="muted" style={{ fontSize: ".86rem" }}><b>Per hour</b>: the price is charged for every hour booked. <b>Per session</b>: charged once per booking, however many hours it is.</p>
        <div className="row"><Submit label="Add item" /></div>
      </form>
    </ModalButton>
  );
}

/** sits inside the Save inventory form: formAction runs deleteRentalItemAction for this item instead of saving the form */
export function DeleteItemBtn({ id, name }: { id: string; name: string }) {
  return (
    <button type="submit" className="btn btn-danger btn-sm" formAction={deleteRentalItemAction.bind(null, id)} formNoValidate data-trace
      onClick={(e) => { if (!window.confirm(`Delete ${name}? Customers will no longer be able to rent it. Past bookings keep showing it.`)) e.preventDefault(); }}>
      Delete
    </button>
  );
}
