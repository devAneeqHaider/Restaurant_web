from django.contrib import admin
from .models import Category, MenuItem, Order, OrderItem, PromoCode, SiteSettings

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["order_id", "customer_name", "phone", "total", "status", "created_at"]
    list_filter = ["status"]
    inlines = [OrderItemInline]

admin.site.register([Category, MenuItem, PromoCode, SiteSettings])
