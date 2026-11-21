from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from afc_backend.views import health

urlpatterns = [
    path("health/", health, name="health"),
    path("api/", include("shop.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Django ka built-in admin: local development mein /django-admin/ par chalta hai.
# Production mein band rehta hai, jab tak .env mein DJANGO_ADMIN_URL (jaise "x7k2-manage/") set na ho.
if settings.DEBUG:
    urlpatterns.insert(0, path("django-admin/", admin.site.urls))
elif settings.DJANGO_ADMIN_URL:
    urlpatterns.insert(0, path(settings.DJANGO_ADMIN_URL, admin.site.urls))
