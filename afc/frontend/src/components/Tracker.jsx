import { Bike, Check, Truck } from "lucide-react";
import { fmtDay, fmtTime } from "../util";

const LABELS = ["Order Placed", "Preparing", "Out for Delivery", "Delivered"];

// order = tracking payload from API, or null for the inactive preview
export default function Tracker({ order }) {
  const steps = order?.steps || LABELS.map((label) => ({ label, done: false, current: false }));
  const chip = order
    ? order.status === "delivered" ? "Delivered" : order.status === "out_for_delivery" ? "Out for Delivery · Arriving soon" : order.status === "preparing" ? "Preparing · Cooking fresh" : "Order Placed · Awaiting confirmation"
    : "Place your order to start tracking";
  return (
    <section className="card tracker" aria-label="Live Order Tracking">
      <div className="tracker-head">
        <h3><Truck size={22} className="c-green" /> Live Order Tracking</h3>
        <span className={`chip ${order ? "chip-green" : "chip-gray"}`}>{chip}</span>
      </div>
      <ol className="steps">
        {steps.map((s, i) => (
          <li key={s.label} className={`step ${s.done ? "done" : ""} ${s.current ? "current" : ""}`}>
            <span className="step-dot">
              {s.done ? (i === 2 && s.current && order?.status !== "delivered" ? <Truck size={20} /> : <Check size={22} strokeWidth={3} />) : null}
            </span>
            <b>{s.label}</b>
            <small>
              {s.done && s.time ? `${fmtDay(s.time)}, ${fmtTime(s.time)}` : s.done ? "Done" : "Pending"}
            </small>
            {i === 2 && order?.rider_name && s.done && <small className="rider"><Bike size={13} /> Rider: {order.rider_name}</small>}
          </li>
        ))}
      </ol>
      {order && <p className="tracker-eta">Estimated delivery: <b>{order.eta}</b>{order.rider_name ? <> · Rider: <b>{order.rider_name}</b></> : null}</p>}
    </section>
  );
}
