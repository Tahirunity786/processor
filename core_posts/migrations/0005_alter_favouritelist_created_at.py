# Generated by Django 5.1 on 2024-12-14 12:58

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core_posts', '0004_remove_favouritelist_name_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='favouritelist',
            name='created_at',
            field=models.DateField(auto_created=True),
        ),
    ]
