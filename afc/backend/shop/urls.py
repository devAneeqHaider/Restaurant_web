from django.urls import include, path
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("admin/categories", views.CategoryViewSet)
router.register("admin/items", views.MenuItemViewSet)
router.register("admin/promos", views.PromoViewSet)

urlpatterns = [
    path("categories/", views.categories),
    path("menu/", views.menu),
    path("settings/", views.public_settings),
    path("promo/validate/", views.validate_promo),
    path("orders/", views.create_order),
    path("orders/track/", views.track_order),
    path("admin/login/", views.admin_login),
    path("admin/profile/", views.admin_profile),
    path("admin/change-username/", views.admin_change_username),
    path("admin/change-password/", views.admin_change_password),
    path("admin/stats/", views.admin_stats),
    path("admin/orders/", views.admin_orders),
    path("admin/orders/export/", views.admin_orders_export),
    path("admin/orders/<int:pk>/", views.admin_order_delete),
    path("admin/orders/<int:pk>/status/", views.admin_order_status),
    path("admin/orders/<int:pk>/whatsapp/", views.admin_order_whatsapp),
    path("admin/customers/", views.admin_customers),
    path("admin/customers/delete/", views.admin_customer_delete),
    path("admin/settings/", views.admin_settings),
    path("", include(router.urls)),
]
