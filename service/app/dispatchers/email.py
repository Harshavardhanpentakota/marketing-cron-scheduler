import json
import logging
import smtplib
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Tuple
from app.config import settings

logger = logging.getLogger("dispatcher.email")

def _send_smtp_sync(to_email: str, subject: str, body: str, business_name: str) -> Tuple[bool, str]:
    msg = MIMEMultipart()
    from_header = f"{business_name or settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>"
    msg["From"] = from_header
    msg["To"] = to_email
    msg["Subject"] = subject
    
    # Attach plain text
    msg.attach(MIMEText(body, "plain", "utf-8"))
    
    try:
        if settings.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
            server.ehlo()
            server.starttls()
            server.ehlo()

        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            
        server.sendmail(settings.EMAIL_FROM, [to_email], msg.as_string())
        server.quit()
        logger.info(f"Email sent successfully to {to_email}")
        return True, f"Sent via SMTP server {settings.SMTP_HOST} to {to_email}"
    except Exception as e:
        logger.exception(f"SMTP error while sending email to {to_email}: {e}")
        return False, f"SMTP Error: {str(e)}"

async def send_email_message(to_email: str, subject: str, body: str, business_name: str) -> Tuple[bool, str]:
    """
    Dispatches an email via SMTP.
    Falls back to mock mode if credentials are missing or MOCK_DISPATCH is enabled.
    Returns (success: bool, response_or_error_text: str)
    """
    recipient = to_email.strip()
    has_credentials = bool(settings.SMTP_HOST and settings.SMTP_USER)
    
    if not has_credentials or settings.MOCK_DISPATCH:
        logger.info(
            f" [MOCK EMAIL DISPATCH] From: {business_name} <{settings.EMAIL_FROM}> | To: {recipient}\n"
            f"   Subject: {subject}\n"
            f"   Body: {body}\n"
            f"   Note: Set SMTP_HOST, SMTP_PORT, SMTP_USER & SMTP_PASSWORD in .env for live SMTP dispatch."
        )
        return True, json.dumps({
            "mode": "mock",
            "status": "delivered",
            "recipient": recipient,
            "subject": subject,
            "business_name": business_name,
            "preview": body[:100] + "..." if len(body) > 100 else body
        })

    # Run blocking SMTP in thread pool to preserve async responsiveness
    return await asyncio.to_thread(_send_smtp_sync, recipient, subject, body, business_name)
