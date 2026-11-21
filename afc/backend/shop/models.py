from django.db import models
from django.utils import timezone
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(max_length=60, unique=True)
    slug = models.SlugField(max_length=70, unique=True, blank=True)
    tagline = models.CharField(max_length=40, blank=True, help_text="e.g. 50+ Items or Up to 30% OFF")
    position = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["position", "id"]
        verbose_name_plural = "categories"

    def save(self, *a, **kw):
        if not self.pk and self.position == 0 and Category.objects.exists():
            self.position = (Category.objects.aggregate(m=models.Max("position"))["m"] or 0) + 1
        if not self.slug:
            base = slugify(self.name) or "category"
            slug, n = base, 1
            while Category.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                n += 1
                slug = f"{base}-{n}"
            self.slug = slug
        super().save(*a, **kw)

    def __str__(self):
        return self.name


class MenuItem(models.Model):
    category = models.ForeignKey(Category, related_name="items", on_delete=models.CASCADE)
    name = models.CharField(max_length=120)
    description = models.CharField(max_length=300, blank=True)
    price = models.PositiveIntegerField(help_text="PKR")
    image = models.ImageField(upload_to="items/", blank=True, null=True)
    rating = models.DecimalField(max_digits=2, decimal_places=1, default=4.7)
    reviews = models.CharField(max_length=10, default="1.2k")
    is_best_seller = models.BooleanField(default=False)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["category__position", "id"]

    def __str__(self):
        return self.name


class PromoCode(models.Model):
    code = models.CharField(max_length=30, unique=True)
    percent = models.PositiveIntegerField(default=10)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.code} ({self.percent}%)"


class SiteSettings(models.Model):
    logo = models.ImageField(upload_to="branding/", blank=True, null=True)
    delivery_fee = models.PositiveIntegerField(default=100)
    free_delivery_over = models.PositiveIntegerField(default=1000, help_text="Deprecated – no longer used")
    contact_number = models.CharField(
        max_length=20,
        blank=True,
        default="03357898714",
        help_text="Public customer support contact number",
    )
    whatsapp_number = models.CharField(
        max_length=20,
        blank=True,
        default="03454996160",
        help_text="Admin WhatsApp number, e.g. 03454996160 or 923454996160",
    )
    wa_api_enabled = models.BooleanField(default=False)
    wa_phone_number_id = models.CharField(max_length=60, blank=True)
    wa_business_account_id = models.CharField(max_length=60, blank=True)
    wa_access_token = models.CharField(max_length=500, blank=True)

    class Meta:
        verbose_name_plural = "site settings"

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class Order(models.Model):
    PENDING, PREPARING, OUT, DELIVERED = "pending", "preparing", "out_for_delivery", "delivered"
    STATUS = [(PENDING, "Pending"), (PREPARING, "Preparing"), (OUT, "Out for Delivery"), (DELIVERED, "Delivered")]

    order_id = models.CharField(max_length=20, unique=True, blank=True)
    customer_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    address = models.TextField()
    landmark = models.CharField(max_length=200, blank=True)
    payment_method = models.CharField(max_length=20, default="COD")
    subtotal = models.PositiveIntegerField(default=0)
    discount = models.PositiveIntegerField(default=0)
    delivery_fee = models.PositiveIntegerField(default=0)
    total = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS, default=PENDING)
    rider_name = models.CharField(max_length=60, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    preparing_at = models.DateTimeField(null=True, blank=True)
    out_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def save(self, *a, **kw):
        super().save(*a, **kw)
        if not self.order_id:
            self.order_id = f"AFC-{1000 + self.pk}"
            super().save(update_fields=["order_id"])

    def __str__(self):
        return self.order_id


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    item = models.ForeignKey(MenuItem, null=True, blank=True, on_delete=models.SET_NULL)
    name = models.CharField(max_length=120)
    price = models.PositiveIntegerField()
    qty = models.PositiveIntegerField(default=1)
