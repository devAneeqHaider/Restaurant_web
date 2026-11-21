import { Link } from "react-router-dom";
import { ArrowRight, Banknote, Clock, CreditCard, Headphones, MessageCircle, Phone } from "lucide-react";
import { useCart } from "../CartContext";
import Logo from "./Logo";

export default function Footer() {
  const { cfg } = useCart();
  const contact = cfg.contact_number || "03357898714";
  const whatsapp = cfg.whatsapp_number || "03454996160";
  const waDigits = whatsapp.replace(/\D/g, "");
  const waNumber = waDigits.startsWith("0") ? `92${waDigits.slice(1)}` : waDigits;

  return (
    <footer className="footer" id="footer">
      <div className="wrap">
        <div className="f-cta">
          <div><h3>Craving something hot &amp; fresh?</h3><p>Order now — delivered to your door in 30-40 minutes.</p></div>
          <Link to="/menu" className="btn btn-white">Order Now <ArrowRight size={18} /></Link>
        </div>

        <div className="f-grid">
          <div className="f-col f-brand">
            <Logo light size={58} />
            <p>Fresh pizza, burgers &amp; shawarma — made hot and delivered to your door.</p>
          </div>
          <div className="f-col">
            <h4>Explore</h4>
            <Link to="/">Home</Link><Link to="/menu">Menu</Link><Link to="/deals">Deals</Link><Link to="/track">Track Order</Link>
          </div>
          <div className="f-col">
            <h4><Headphones size={16} /> Need help?</h4>
            <a className="f-line f-contact-line" href={`tel:${contact}`}><Phone size={15} /><span><small>Call support</small><b>{contact}</b></span></a>
            <a className="f-line f-contact-line" href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer"><MessageCircle size={15} /><span><small>WhatsApp</small><b>{whatsapp}</b></span></a>
            <p className="f-line f-delivery-line"><Clock size={15} /><span>Delivery in 30–40 minutes</span></p>
          </div>
          <div className="f-col">
            <h4>Payment</h4>
            <span className="f-pay on"><Banknote size={16} /> Cash on Delivery</span>
            <span className="f-pay"><CreditCard size={16} /> Card / Online <em>Coming Soon</em></span>
          </div>
        </div>

        <div className="f-bottom">
          <span>© {new Date().getFullYear()} AFC Ahmad Food Center. All rights reserved.</span>
        </div>
      </div>
      <button className="foot-credit" title="Replay intro" onClick={() => window.dispatchEvent(new Event("afc:splash"))}>Developed by Engineer M. Aneeq Haider</button>
    </footer>
  );
}
