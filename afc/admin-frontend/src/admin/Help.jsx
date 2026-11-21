import PageHead from "./PageHead";

export default function Help() {
  return (
    <>
      <PageHead title="Help & Support" subtitle="Quick guide for running AFC" />
      <section className="card help">
        <h3>Daily workflow</h3>
        <ol>
          <li>New orders appear in <b>Live Orders</b> automatically (refreshes every 10 seconds) and as a red badge on the bell.</li>
          <li>Click <b>Preparing → Out for Delivery → Delivered</b>. Customers see each change on their tracker, with the rider name and time.</li>
          <li>Use <b>Menu</b> to add categories (e.g. Cakes) and items. They appear on the customer website immediately.</li>
          <li>Upload a photo on any item. If you don't, AFC shows a matching default photo — never a blank image.</li>
          <li>Set the delivery fee and WhatsApp details in <b>Store Settings</b>.</li>
          <li>Create checkout discounts in <b>Promo Codes</b>. Menu bundles are managed separately under <b>Menu Deals</b>.</li>
        </ol>
        <h3>Contact</h3>
        <p>Developer: <b>Engineer M Aneeq Haider</b></p>
        <p>"Upgrade to Pro" (advanced analytics) is a placeholder for a future version.</p>
      </section>
    </>
  );
}
