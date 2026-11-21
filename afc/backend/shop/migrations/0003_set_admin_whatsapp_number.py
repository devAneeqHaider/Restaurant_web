from django.db import migrations, models


DEFAULT_WHATSAPP_NUMBER = "03454996160"


def set_admin_whatsapp_number(apps, schema_editor):
    SiteSettings = apps.get_model("shop", "SiteSettings")
    SiteSettings.objects.using(schema_editor.connection.alias).filter(pk=1).update(
        whatsapp_number=DEFAULT_WHATSAPP_NUMBER,
    )


class Migration(migrations.Migration):
    dependencies = [
        ("shop", "0002_sitesettings_logo"),
    ]

    operations = [
        migrations.AlterField(
            model_name="sitesettings",
            name="whatsapp_number",
            field=models.CharField(
                blank=True,
                default=DEFAULT_WHATSAPP_NUMBER,
                help_text="Admin WhatsApp number, e.g. 03454996160 or 923454996160",
                max_length=20,
            ),
        ),
        migrations.RunPython(set_admin_whatsapp_number, migrations.RunPython.noop),
    ]
