import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from shop.models import Category, MenuItem, Order, OrderItem, PromoCode, SiteSettings

CATS = [("Pizza", "50+ Items"), ("Burger", "40+ Items"), ("Shawarma", "30+ Items"), ("Deals", "Up to 30% OFF")]
ITEMS = [  # category, name, description, price, best seller
    ("Pizza", "Classic Pepperoni Pizza", "Crispy crust, mozzarella, pepperoni, fresh herbs", 499, True),
    ("Pizza", "Chicken Tikka Pizza", "Spicy chicken tikka with mozzarella, onions, and fresh herbs on classic crust", 550, False),
    ("Pizza", "Fajita Pizza", "Fajita chicken, capsicum, onions and olives with extra cheese", 599, False),
    ("Pizza", "Cheese Lover Pizza", "Triple cheese blend on a golden hand-tossed base", 520, False),
    ("Burger", "Cheesy Beef Burger", "Beef patty, cheese, lettuce, special sauce", 650, True),
    ("Burger", "Zinger Burger", "Crispy fried chicken fillet with lettuce, mayo and spices in toasted bun", 450, False),
    ("Burger", "Classic Burger", "Beef patty, lettuce, tomato and house sauce", 425, False),
    ("Burger", "Double Patty Burger", "Two juicy patties, double cheese, caramelised onions", 780, False),
    ("Shawarma", "Chicken Shawarma Wrap", "Grilled chicken, garlic sauce, veggies, pita", 499, True),
    ("Shawarma", "Chicken Shawarma", "Grilled chicken wrapped with garlic sauce, fresh salad, pickles in pita bread", 350, False),
    ("Shawarma", "Beef Shawarma", "Slow-roasted beef strips, tahini, pickles and fries inside", 420, False),
    ("Shawarma", "Zinger Shawarma", "Crispy zinger strips, coleslaw and spicy mayo", 380, False),
    ("Deals", "Family Feast Deal", "1 Large Pizza + 4 Zinger Burgers + 1.5L Drink", 2899, False),
    ("Deals", "Couple Deal", "2 Burgers + Fries + 2 Drinks", 1299, False),
    ("Deals", "Shawarma Duo Deal", "2 Chicken Shawarmas + Fries + 2 Drinks", 999, False),
]
NAMES = ["Fatima Ali", "Ahmed Raza", "Sarah Khan", "Bilal Hassan", "Ayesha Noor", "Usman Tariq", "Hira Malik", "Zain Abbas"]
PHONES = ["03001234567", "03211234567", "03331234567", "03451234567", "03121234567", "03001112223", "03219998877", "03355556666"]


class Command(BaseCommand):
    help = "Create categories, menu, settings and promo code. Use --demo to also add fake demo orders (development only). Admin user: python manage.py createsuperuser"

    def add_arguments(self, parser):
        parser.add_argument("--demo", action="store_true", help="also create fake demo orders (never use in production)")

    def handle(self, *a, **kw):
        cats = {}
        for i, (n, t) in enumerate(CATS):
            cats[n], _ = Category.objects.get_or_create(name=n, defaults={"tagline": t, "position": i})
        for c, n, d, p, best in ITEMS:
            MenuItem.objects.get_or_create(name=n, defaults={"category": cats[c], "description": d, "price": p, "is_best_seller": best})

        s = SiteSettings.get()
        s.delivery_fee = s.delivery_fee or 100
        s.whatsapp_number = s.whatsapp_number or "03454996160"
        s.save()
        PromoCode.objects.get_or_create(code="AFC20", defaults={"percent": 20})

        if kw.get("demo") and not Order.objects.exists():
            items = list(MenuItem.objects.all())
            statuses = ["pending", "preparing", "out_for_delivery", "delivered"]
            now = timezone.now()
            for i in range(24):
                st = "delivered" if i > 7 else statuses[i % 4]
                created = now - timedelta(minutes=25 * i + 5) if i < 8 else now - timedelta(days=i // 3, hours=i)
                chosen = random.sample(items, random.randint(1, 3))
                sub = sum(x.price for x in chosen)
                fee = 100
                o = Order.objects.create(customer_name=NAMES[i % 8], phone=PHONES[i % 8],
                                         address=f"House {10 + i}, Street {i + 2}, Sector F-{6 + i % 4}, Islamabad",
                                         subtotal=sub, delivery_fee=fee, total=sub + fee, status=st, created_at=created,
                                         preparing_at=created + timedelta(minutes=5) if st != "pending" else None,
                                         out_at=created + timedelta(minutes=20) if st in ("out_for_delivery", "delivered") else None,
                                         delivered_at=created + timedelta(minutes=38) if st == "delivered" else None,
                                         rider_name="Hassan" if st in ("out_for_delivery", "delivered") else "")
                for x in chosen:
                    OrderItem.objects.create(order=o, item=x, name=x.name, price=x.price, qty=1)
        self.stdout.write(self.style.SUCCESS("Seed done. Create the admin user with: python manage.py createsuperuser"))
