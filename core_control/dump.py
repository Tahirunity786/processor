from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from django.conf import settings
from typing import Dict

API_KEY = settings.API_KEY
SENDER_EMAIL = settings.SENDER_EMAIL
SENDER_NAME = settings.SENDER_NAME

def send_transactional_email(user_detail: Dict[str, str], subject: str) -> bool:
    print(user_detail)

    """
    Sends a single transactional email using Brevo's API.
    
    Args:
        user_detail (Dict[str, str]): Dictionary containing client name, email, and phone number.
        subject (str): Subject of the email.
    
    Returns:
        bool: True if the email was sent successfully, False otherwise.
    """
    # Configure Brevo API
    message = Mail(
    from_email=SENDER_EMAIL,
    to_emails='tahirunity786@gmail.com',
    subject='Sending with Twilio SendGrid is Fun',
    html_content='<strong>and easy to do anywhere, even with Python</strong>')

    try:
        sg = SendGridAPIClient(API_KEY)
        response = sg.send(message)
        print(response.status_code)
        print(response.body)
        print(response.headers)
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False