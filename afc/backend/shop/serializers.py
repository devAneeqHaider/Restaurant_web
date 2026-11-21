from rest_framework import serializers
from .models import Category, MenuItem, Order, OrderItem, PromoCode, SiteSettings


class CategorySerializer(serializers.ModelSerializer):
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "tagline", "position", "is_active", "item_count"]
        read_only_fields = ["slug"]

    def get_item_count(self, obj):
        return obj.items.filter(is_available=True).count()


class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    remove_image = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = MenuItem
        fields = ["id", "category", "category_name", "category_slug", "name", "description", "price",
                  "image", "rating", "reviews", "is_best_seller", "is_available", "remove_image"]
        extra_kwargs = {"image": {"required": False, "allow_null": True}}

    def to_representation(self, inst):
        data = super().to_representation(inst)
        # None => frontend shows the matching default photo (never a broken image)
        data["image"] = inst.image.url if inst.image else None
        return data

    def update(self, instance, validated):
        if validated.pop("remove_image", False):
            instance.image = None
        return super().update(instance, validated)

    def create(self, validated):
        validated.pop("remove_image", None)
        return super().create(validated)


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ["name", "price", "qty"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Order
        fields = ["id", "order_id", "customer_name", "phone", "address", "landmark", "payment_method",
                  "subtotal", "discount", "delivery_fee", "total", "status", "status_label", "rider_name",
                  "created_at", "items"]


class PromoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromoCode
        fields = ["id", "code", "percent", "is_active"]


class SettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        exclude = ["id"]
