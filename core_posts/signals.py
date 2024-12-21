from django.db.models.signals import m2m_changed
from django.dispatch import receiver
from django.core.exceptions import ValidationError
from core_posts.models import Hotel

@receiver(m2m_changed, sender=Hotel.images.through)
def restrict_image_upload(sender, instance, action, **kwargs):
    """
    This signal will enforce that exactly 4 images are associated with a hotel.
    """
    if action == 'pre_add' or action == 'pre_remove':
        if instance.images.count() + len(kwargs.get('pk_set', [])) > 4:
            raise ValidationError("You can only upload exactly 4 images.")
        if instance.images.count() + len(kwargs.get('pk_set', [])) < 4 and action == 'post_add':
            raise ValidationError("You must upload exactly 4 images.")
