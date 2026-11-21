from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.static import serve as static_serve
from afc_backend.views import health

urlpatterns = [
    path("health/", health, name="health"),
    path("api/", include("shop.urls")),
]

# Media files in production: django.conf.urls.static.static() returns an
# empty list when DEBUG=False, so /media/ had NO route at all in production
# and every uploaded file 404d even though it was saved on disk (Railway
# Volume at /app/media). Serve /media/ explicitly with the built-in
# django.views.static.serve view, which only serves files under MEDIA_ROOT
# (it rejects paths escaping document_root), so there is no traversal risk.
# Only add the route when MEDIA_URL is a local path (not an R2/public URL).
if settings.MEDIA_URL.startswith("/"):
    urlpatterns += [
        re_path(r"^media/(?P<path>.*)$", static_serve, {"document_root": settings.MEDIA_ROOT}),
    ]

# Django ka built-in admin: local development mein /django-admin/ par chalta hai.
# Production mein band rehta hai, jab tak .env mein DJANGO_ADMIN_URL (jaise "x7k2-manage/") set na ho.
if settings.DEBUG:
    urlpatterns.insert(0, path("django-admin/", admin.site.urls))
elif settings.DJANGO_ADMIN_URL:
    urlpatterns.insert(0, path(settings.DJANGO_ADMIN_URL, admin.site.urls))
