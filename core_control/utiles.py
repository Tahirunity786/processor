from django.conf import settings
from typing import Dict
from django.core.mail import EmailMessage
from http.client import HTTPSConnection
import json
from django.template.loader import render_to_string
import logging
# Initialize logger
logger = logging.getLogger(__name__)

import http.client

conn = http.client.HTTPSConnection("nakiese.ipzmarketing.com")

class EmailAgent:
    def send_smtp_email(self, data: dict, is_client: bool) -> bool:
        """
        Sends an SMTP email.

        Args:
            data (dict): Data to render in the email templates.
            is_client (bool): Whether the email is for the client or the owner.

        Returns:
            bool: True if the email is sent successfully, False otherwise.
        """
        try:

            if is_client:
                template = "email/en/confirmation-client.html"
                subject = "Booking Confirmation"
            else:
                template = "email/en/confirmation-owner.html"
                subject = "Booking Alert"
            
            
            # Render email content
            body = render_to_string(template, data)
            
            # Prepare and send the email
            sender = EmailMessage(
                subject=subject,
                body=body,
                from_email=settings.EMAIL_REALY_HOST,
                to=[data["email"]],
            )
            sender.content_subtype = "html"  # Set content type as HTML
            sender.send(fail_silently=False)
            return True
        except Exception as e:
            logger.error(f"Email Sending Error ({template}): {str(e)}")
            return False
    
    def send_by_api(self, data: dict, is_client: bool) -> bool:
        """
        Sends an email via a third-party API.

        :param data: Dictionary containing email details (e.g., recipient email).
        :param is_client: Boolean indicating whether the email is for the client or the owner.
        :return: Boolean indicating success or failure of the email sending process.
        """
        try:
            # Determine email template and subject based on recipient type
            template = "email/en/confirmation-client.html" if is_client else "email/en/confirmation-owner.html"
            subject = "Booking Confirmation" if is_client else "Booking Alert"

            # Render email content
            body = render_to_string(template, data)

            # Prepare API payload
            payload = {
                "from": {
                    "email": settings.EMAIL_REALY_HOST,  # Ensure this is set in your Django settings
                    "name": "Nakiese"
                },
                "to": [
                    {
                        "email": data.get("email"),
                        "name": data.get("name", "")
                    }
                ],
                "subject": subject,
                "html_part": body,
                "text_part_auto": True
            }

            # API headers
            headers = {
                "Content-Type": "application/json",
                "x-auth-token": settings.EMAIL_REALY_CREDENTIALS  # Replace with your actual API token
            }

            # Send the request
            conn = HTTPSConnection("nakiese.ipzmarketing.com")  # Replace with actual API host
            conn.request("POST", "/api/v1/send_emails", json.dumps(payload), headers)

            # Get the response
            res = conn.getresponse()
            response_data = res.read()

            # Check the response status
            if res.status == 200:
                logger.info(f"Email sent successfully: {response_data}")
                return True
            else:
                logger.error(f"Email sending failed with status {res.status}: {response_data}")
                return False

        except Exception as e:
            # Log any exceptions
            logger.error(f"Email Sending Error ({template}): {str(e)}")
            return False