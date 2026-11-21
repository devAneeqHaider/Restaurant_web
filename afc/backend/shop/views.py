import csv
import math
import re
from datetime import timedelta

from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db.models import Count, Max, Q, Sum
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, parser_classes, permission_classes, throttle_classes
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from .models import Category, MenuItem, Order, OrderItem, PromoCode, SiteSettings
from .serializers import (CategorySerializer, MenuItemSerializer, OrderSerializer, PromoSerializer,
                          SettingsSerializer)
from .throttles import LoginRateThrottle
from .whatsapp import build_admin_message, send_via_api, wa_link

RIDERS = ["Hassan", "Bilal", "Usman", "Ali", "Hamza"]
STEPS = [("pending", "Order Placed"), ("preparing", "Preparing"), ("out_for_delivery", "Out for Delivery"),
         ("delivered", "Delivered")]


def to_int(v, default):
    try:
        return int(v)
    except (TypeError, ValueError):
        return default


def digits(s):
    return re.sub(r"\D", "", s or "")


# ───────────── Public ─────────────
@api_view(["GET"])
def categories(request):
    return Response(CategorySerializer(Category.objects.filter(is_active=True), many=True).data)


@api_view(["GET"])
def menu(request):
    qs = MenuItem.objects.filter(is_available=True, category__is_active=True).select_related("category")
    if request.GET.get("category"):
        qs = qs.filter(category__slug=request.GET["category"])
    if request.GET.get("search"):
        s = request.GET["search"]
        qs = qs.filter(Q(name__icontains=s) | Q(description__icontains=s) | Q(category__name__icontains=s))
    if request.GET.get("best"):
        qs = qs.filter(is_best_seller=True)
    return Response(MenuItemSerializer(qs, many=True).data)


@api_view(["GET"])
def public_settings(request):
    s = SiteSettings.get()
    return Response({
        "delivery_fee": s.delivery_fee,
        "free_delivery_over": s.free_delivery_over,
        "contact_number": s.contact_number,
        "whatsapp_number": s.whatsapp_number,
        "logo": s.logo.url if s.logo else None,
    })


def promo_percent(code):
    if not code:
        return 0
    p = PromoCode.objects.filter(code__iexact=code.strip(), is_active=True).first()
    return p.percent if p else 0


@api_view(["POST"])
def validate_promo(request):
    pct = promo_percent(request.data.get("code"))
    if not pct:
        return Response({"valid": False, "detail": "Invalid or expired promo code"}, status=400)
    return Response({"valid": True, "percent": pct})


@api_view(["POST"])
def create_order(request):
    d = request.data
    name, phone, address = (d.get("customer_name") or "").strip(), (d.get("phone") or "").strip(), (d.get("address") or "").strip()
    errors = {}
    if len(name) < 2: errors["customer_name"] = "Please enter your full name"
    if len(digits(phone)) < 10: errors["phone"] = "Enter a valid phone number"
    if not address: errors["address"] = "Please enter your delivery address"
    lines = d.get("items") or []
    if not lines: errors["items"] = "Your cart is empty"
    if errors:
        return Response(errors, status=400)

    s = SiteSettings.get()
    subtotal, rows = 0, []
    for ln in lines:
        if not isinstance(ln, dict):
            return Response({"items": "Invalid cart"}, status=400)
        item = MenuItem.objects.filter(pk=to_int(ln.get("id"), 0), is_available=True).first()
        qty = max(1, min(to_int(ln.get("qty"), 1), 50))
        if not item:
            return Response({"items": "An item in your cart is no longer available"}, status=400)
        subtotal += item.price * qty
        rows.append((item, qty))

    discount = subtotal * promo_percent(d.get("promo")) // 100
    fee = s.delivery_fee
    order = Order.objects.create(
        customer_name=name, phone=phone, address=address, landmark=(d.get("landmark") or "").strip(),
        payment_method="COD", subtotal=subtotal, discount=discount, delivery_fee=fee,
        total=subtotal - discount + fee)
    for item, qty in rows:
        OrderItem.objects.create(order=order, item=item, name=item.name, price=item.price, qty=qty)

    message = build_admin_message(order)
    result = send_via_api(s, message)  # 'demo' unless WhatsApp Business API is configured
    return Response({
        "order": OrderSerializer(order).data,
        "whatsapp": {"message": message, "url": wa_link(s.whatsapp_number, message),
                     "api_status": result, "admin_number_set": bool(s.whatsapp_number)},
    }, status=201)


def tracking_payload(o):
    order = ["pending", "preparing", "out_for_delivery", "delivered"]
    idx = order.index(o.status)
    times = {"pending": o.created_at, "preparing": o.preparing_at, "out_for_delivery": o.out_at,
             "delivered": o.delivered_at}
    local = lambda t: timezone.localtime(t).isoformat() if t else None
    eta = {"pending": "30-40 min", "preparing": "25-30 min", "out_for_delivery": "10-15 min", "delivered": "Delivered"}
    return {
        **OrderSerializer(o).data,
        "eta": eta[o.status],
        "steps": [{"key": k, "label": lbl, "done": i <= idx, "current": i == idx, "time": local(times[k])}
                  for i, (k, lbl) in enumerate(STEPS)],
    }


@api_view(["POST"])
def track_order(request):
    oid = (request.data.get("order_id") or "").strip().upper()
    ph = digits(request.data.get("phone"))
    o = Order.objects.filter(order_id=oid).first()
    if not o or len(ph) < 7 or digits(o.phone)[-10:] != ph[-10:]:
        return Response({"detail": "No order found for this Order ID and phone number"}, status=404)
    return Response(tracking_payload(o))


# ───────────── Admin ─────────────
@api_view(["POST"])
@throttle_classes([LoginRateThrottle])
def admin_login(request):
    user = authenticate(username=request.data.get("username"), password=request.data.get("password"))
    if not user or not user.is_staff:
        return Response({"detail": "Wrong username or password"}, status=400)
    # har login par naya token (purana token 24h expiry ke hisaab se kaam karta hai)
    Token.objects.filter(user=user).delete()
    token = Token.objects.create(user=user)
    return Response({"token": token.key, "username": user.username})


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_profile(request):
    user = request.user
    return Response({
        "username": user.username,
        "full_name": user.get_full_name().strip(),
        "email": user.email,
    })


@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_change_username(request):
    user = request.user
    current_password = request.data.get("current_password") or ""
    if not user.check_password(current_password):
        return Response({"detail": "Current password is wrong"}, status=400)

    raw_username = request.data.get("new_username")
    new_username = raw_username.strip() if isinstance(raw_username, str) else ""
    if not new_username:
        return Response({"detail": "Enter a username"}, status=400)
    if new_username == user.username:
        return Response({"detail": "New username is the same as the current one"}, status=400)

    username_field = user._meta.get_field("username")
    try:
        username_field.run_validators(new_username)
    except ValidationError as e:
        return Response({"detail": " ".join(e.messages)}, status=400)

    user_model = user._meta.model
    if user_model.objects.filter(username__iexact=new_username).exclude(pk=user.pk).exists():
        return Response({"detail": "That username is already in use"}, status=400)

    user.username = new_username
    user.save(update_fields=["username"])
    return Response({
        "username": user.username,
        "full_name": user.get_full_name().strip(),
        "email": user.email,
    })


@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_change_password(request):
    old = request.data.get("old_password") or ""
    new = request.data.get("new_password") or ""
    user = request.user
    if not user.check_password(old):
        return Response({"detail": "Current password is wrong"}, status=400)
    if old == new:
        return Response({"detail": "New password must be different from the current one"}, status=400)
    try:
        validate_password(new, user)
    except ValidationError as e:
        return Response({"detail": " ".join(e.messages)}, status=400)
    user.set_password(new)
    user.save()
    # purana token delete, naya token do (doosre devices logout ho jayen)
    Token.objects.filter(user=user).delete()
    token = Token.objects.create(user=user)
    return Response({"token": token.key})


def pct_change(cur, prev):
    if not prev:
        return 100.0 if cur else 0.0
    return round((cur - prev) / prev * 100, 1)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_stats(request):
    now = timezone.localtime()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yday = today - timedelta(days=1)
    this_m = today.replace(day=1)
    last_m = (this_m - timedelta(days=1)).replace(day=1)
    qs = Order.objects.all()
    rev = lambda a, b: qs.filter(created_at__gte=a, created_at__lt=b).aggregate(t=Sum("total"))["t"] or 0
    cnt = lambda a, b, **f: qs.filter(created_at__gte=a, created_at__lt=b, **f).count()
    far = now + timedelta(days=1)
    return Response({
        "total_orders": qs.count(),
        "total_orders_change": pct_change(cnt(this_m, far), cnt(last_m, this_m)),
        "today_revenue": rev(today, far),
        "today_revenue_change": pct_change(rev(today, far), rev(yday, today)),
        "pending_orders": qs.filter(status="pending").count(),
        "delivered_orders": qs.filter(status="delivered").count(),
        "delivered_change": pct_change(cnt(this_m, far, status="delivered"), cnt(last_m, this_m, status="delivered")),
    })


def filtered_orders(request):
    qs = Order.objects.prefetch_related("items")
    if request.GET.get("status"):
        qs = qs.filter(status=request.GET["status"])
    if request.GET.get("q"):
        q = request.GET["q"]
        qs = qs.filter(Q(order_id__icontains=q) | Q(customer_name__icontains=q) | Q(phone__icontains=q))
    return qs


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_orders(request):
    qs = filtered_orders(request)
    size = max(1, min(to_int(request.GET.get("page_size"), 5), 100))
    page = max(1, to_int(request.GET.get("page"), 1))
    count = qs.count()
    rows = qs[(page - 1) * size: page * size]
    return Response({"count": count, "page": page, "page_size": size, "pages": max(1, math.ceil(count / size)),
                     "results": OrderSerializer(rows, many=True).data})


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_orders_export(request):
    resp = HttpResponse(content_type="text/csv")
    resp["Content-Disposition"] = 'attachment; filename="afc-orders.csv"'
    w = csv.writer(resp)
    w.writerow(["Order ID", "Customer", "Phone", "Address", "Items", "Subtotal", "Discount", "Delivery", "Total", "Status", "Placed at"])
    for o in filtered_orders(request):
        w.writerow([o.order_id, o.customer_name, o.phone, o.address,
                    "; ".join(f"{i.name} x{i.qty}" for i in o.items.all()),
                    o.subtotal, o.discount, o.delivery_fee, o.total, o.get_status_display(),
                    timezone.localtime(o.created_at).strftime("%Y-%m-%d %H:%M")])
    return resp


@api_view(["PATCH"])
@permission_classes([IsAdminUser])
def admin_order_status(request, pk):
    try:
        o = Order.objects.get(pk=pk)
    except Order.DoesNotExist:
        return Response({"detail": "Order not found"}, status=404)
    new = request.data.get("status")
    if new not in dict(Order.STATUS):
        return Response({"detail": "Invalid status"}, status=400)
    now = timezone.now()
    o.status = new
    if new in ("preparing", "out_for_delivery", "delivered") and not o.preparing_at:
        o.preparing_at = now
    if new in ("out_for_delivery", "delivered") and not o.out_at:
        o.out_at = now
    if new == "delivered" and not o.delivered_at:
        o.delivered_at = now
    if new in ("out_for_delivery", "delivered") and not o.rider_name:
        o.rider_name = request.data.get("rider_name") or RIDERS[o.pk % len(RIDERS)]
    if request.data.get("rider_name"):
        o.rider_name = request.data["rider_name"]
    if new == "pending":
        o.preparing_at = o.out_at = o.delivered_at = None
    o.save()
    return Response(OrderSerializer(o).data)


@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def admin_order_delete(request, pk):
    try:
        order = Order.objects.get(pk=pk)
    except Order.DoesNotExist:
        return Response({"detail": "Order not found"}, status=404)
    order.delete()
    return Response(status=204)


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_order_whatsapp(request, pk):
    try:
        o = Order.objects.get(pk=pk)
    except Order.DoesNotExist:
        return Response({"detail": "Order not found"}, status=404)
    msg = build_admin_message(o)
    return Response({"message": msg, "url": wa_link(SiteSettings.get().whatsapp_number, msg)})


@api_view(["GET"])
@permission_classes([IsAdminUser])
def admin_customers(request):
    rows = (Order.objects.values("phone")
            .annotate(orders=Count("id"), spent=Sum("total"), last=Max("created_at"))
            .order_by("-last"))
    out = []
    for r in rows:
        last = Order.objects.filter(phone=r["phone"]).first()
        out.append({"phone": r["phone"], "name": last.customer_name, "address": last.address,
                    "orders": r["orders"], "spent": r["spent"], "last_order": r["last"]})
    return Response(out)


@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def admin_customer_delete(request):
    phone = (request.query_params.get("phone") or "").strip()
    if not phone:
        return Response({"detail": "Customer phone number is required"}, status=400)
    orders = Order.objects.filter(phone=phone)
    if not orders.exists():
        return Response({"detail": "Customer not found"}, status=404)
    deleted_orders = orders.count()
    orders.delete()
    return Response({"deleted_orders": deleted_orders})


@api_view(["GET", "PUT"])
@permission_classes([IsAdminUser])
def admin_settings(request):
    s = SiteSettings.get()
    if request.method == "PUT":
        ser = SettingsSerializer(s, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
    return Response(SettingsSerializer(s).data)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUser]


class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.select_related("category").all()
    serializer_class = MenuItemSerializer
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]


class PromoViewSet(viewsets.ModelViewSet):
    queryset = PromoCode.objects.all()
    serializer_class = PromoSerializer
    permission_classes = [IsAdminUser]
