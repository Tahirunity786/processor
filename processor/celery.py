import os
from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'processor.settings')

# Create an instance of the Celery application.
app = Celery('processor')

# Load task-related settings with the prefix 'CELERY_' from settings.py.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Define the periodic task schedule.
app.conf.beat_schedule = {
    'expire-bookings-every-5-minutes': {
        'task': 'core_posts.tasks.expire_bookings',  # Replace 'bookings' with your app name
        'schedule': crontab(minute='*/1'),        # Runs every 5 minutes
    },
}

# Auto-discover tasks in installed apps.
app.autodiscover_tasks()
