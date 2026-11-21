import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { api } from "../api";
import { avatarColor, initials, rs } from "../util";
import PageHead from "./PageHead";

export default function Customers() {
  const [rows, setRows] = useState([]);
  const [busyPhone, setBusyPhone] = useState("");
  const [message, setMessage] = useState("");
  const load = useCallback(() => api.customers().then(setRows).catch(() => {}), []);
  useEffect(() => { load(); }, [load]);
  const remove = async (customer) => {
    if (!window.confirm(`Delete ${customer.name} (${customer.phone}) and all ${customer.orders} associated order(s)? This also removes their order history.`)) return;
    setBusyPhone(customer.phone);
    setMessage("");
    try {
      await api.deleteCustomer(customer.phone);
      await load();
    } catch (error) {
      setMessage(error.detail || "Could not delete this customer.");
    } finally {
      setBusyPhone("");
    }
  };
  return (
    <>
      <PageHead title="Customers" subtitle="Everyone who has ordered from AFC" />
      {message && <p className="alert-err" role="alert">{message}</p>}
      <section className="live"><div className="table-wrap">
        <table className="orders">
          <thead><tr><th>Customer</th><th>Phone</th><th>Last Address</th><th>Orders</th><th>Total Spent</th><th>Last Order</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.phone} className={busyPhone === r.phone ? "busy" : ""}>
                <td><span className="cust"><span className="av" style={{ background: avatarColor(r.name) }}>{initials(r.name)}</span><b>{r.name}</b></span></td>
                <td>{r.phone}</td><td>{r.address}</td><td>{r.orders}</td><td className="tot">{rs(r.spent)}</td>
                <td>{new Date(r.last_order).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</td>
                <td><button className="act delete" title="Delete customer and order history" aria-label={`Delete customer ${r.name}`} onClick={() => remove(r)} disabled={busyPhone === r.phone}><Trash2 size={14} /> Delete</button></td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan="7" className="empty-row">No customers yet.</td></tr>}
          </tbody>
        </table>
      </div></section>
    </>
  );
}
