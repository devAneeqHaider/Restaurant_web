import { useState } from "react";
import PageHead from "./PageHead";
import LiveOrders from "./LiveOrders";

export default function OrdersPage() {
  const [q, setQ] = useState("");
  return (
    <>
      <PageHead title="Orders" subtitle="Update order status — customers see changes live" search={q} onSearch={setQ} />
      <LiveOrders pageSize={10} q={q} />
    </>
  );
}
