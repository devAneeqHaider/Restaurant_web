from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("shop", "0005_alter_sitesettings_free_delivery_over"),
    ]

    operations = [
        migrations.AddField(
            model_name="sitesettings",
            name="contact_number",
            field=models.CharField(
                blank=True,
                default="03357898714",
                help_text="Public customer support contact number",
                max_length=20,
            ),
        ),
    ]
