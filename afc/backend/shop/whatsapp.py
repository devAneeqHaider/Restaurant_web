import re
import requests
from urllib.parse import quote


def normalize_pk_number(num: str) -> str:
    """03001234567 / +92 300 1234567 -> 923001234567"""
    digits = re.sub(r"\D", "", num or "")
    if digits.startswith("0"):
        digits = "92" + digits[1:]
    return digits


def build_admin_message(order) -> str:
    lines = [f"🔔 *New Order – AFC Ahmad Food Center*", "", f"*Order ID:* {order.order_id}", "", "*Items:*"]
    for it in order.items.all():
        lines.append(f"• {it.name} x{it.qty} – Rs. {it.price * it.qty:,}")
    lines.append("")
    if order.discount:
        lines.append(f"Discount: -Rs. {order.discount:,}")
    lines.append(f"Delivery Fee: Rs. {order.delivery_fee:,}")
    lines.append(f"*Total:* Rs. {order.total:,} PKR")
    lines += ["", f"*Customer:* {order.customer_name}", f"*Phone:* {order.phone}",
              f"*Address:* {order.address}"]
    if order.landmark:
        lines.append(f"*Landmark:* {order.landmark}")
    lines += ["", "*Payment:* Cash on Delivery (COD)"]
    return "\n".join(lines)


def wa_link(number: str, message: str) -> str:
    n = normalize_pk_number(number)
    return f"https://wa.me/{n}?text={quote(message)}" if n else ""


def send_via_api(settings_obj, message: str) -> str:
    """Returns 'sent' | 'failed' | 'demo'. Real sending only when API is enabled & configured."""
    if not (settings_obj.wa_api_enabled and settings_obj.wa_phone_number_id and settings_obj.wa_access_token
            and settings_obj.whatsapp_number):
        return "demo"
    try:
        r = requests.post(
            f"https://graph.facebook.com/v19.0/{settings_obj.wa_phone_number_id}/messages",
            headers={"Authorization": f"Bearer {settings_obj.wa_access_token}"},
            json={"messaging_product": "whatsapp", "to": normalize_pk_number(settings_obj.whatsapp_number),
                  "type": "text", "text": {"body": message}},
            timeout=10,
        )
        return "sent" if r.ok else "failed"
    except requests.RequestException:
        return "failed"
