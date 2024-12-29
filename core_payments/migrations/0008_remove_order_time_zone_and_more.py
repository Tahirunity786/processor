# Generated by Django 5.1 on 2024-12-29 08:16

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core_payments', '0007_order_time_zone'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='order',
            name='time_zone',
        ),
        migrations.AddField(
            model_name='orderplacementstorage',
            name='time_zone',
            field=models.CharField(blank=True, db_index=True, default='UTC', max_length=50, null=True),
        ),
    ]
