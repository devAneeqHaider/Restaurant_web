import os

from django.contrib.auth import get_user_model
from django.db import migrations


def create_superuser(apps, schema_editor):
    username = os.environ.get("DJANGO_SUPERUSER_USERNAME")
    email = os.environ.get("DJANGO_SUPERUSER_EMAIL")
    password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")
    if username and email and password:
        User = get_user_model()
        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(
                username=username, email=email, password=password
            )


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0003_set_admin_whatsapp_number"),
    ]

    operations = [
        migrations.RunPython(create_superuser, migrations.RunPython.noop),
    ]
