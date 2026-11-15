import re
import json
import logging
import httpx
from typing import Tuple
from app.config import settings

logger = logging.getLogger("dispatcher.whatsapp")

def sanitize_phone_number(phone: str) -> str:
    """Strip all non-digits, keep leading plus or add if needed."""
    cleaned = re.sub(r"[^\d+]", "", phone.strip())
    if cleaned.startswith("+"):
        cleaned = cleaned[1:]
    return cleaned

async def send_whatsapp_message(to_number: str, message: str, business_name: str) -> Tuple[bool, str]:
    """
    Dispatches a WhatsApp message using Meta WhatsApp Business Cloud API.
    Falls back to mock mode if credentials are missing or MOCK_DISPATCH is enabled.
    Returns (success: bool, response_or_error_text: str)
    """
    recipient = sanitize_phone_number(to_number)
    
    # Check if live credentials exist
    has_credentials = bool(settings.WHATSAPP_TOKEN and settings.WHATSAPP_PHONE_NUMBER_ID)
    
    if not has_credentials or settings.MOCK_DISPATCH:
        logger.info(
            f" [MOCK WHATSAPP DISPATCH] From: {business_name} | To: +{recipient}\n"
            f"   Message: {message}\n"
            f"   Note: Set WHATSAPP_TOKEN & WHATSAPP_PHONE_NUMBER_ID in .env for live API dispatch."
        )
        return True, json.dumps({
            "mode": "mock",
            "status": "delivered",
            "recipient": recipient,
            "business_name": business_name,
            "preview": message[:100] + "..." if len(message) > 100 else message
        })

    # Live Meta Graph API Call
    url = f"{settings.WHATSAPP_API_URL}/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": recipient,
        "type": "text",
        "text": {
            "preview_url": False,
            "body": message
        }
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, headers=headers, json=payload)
            if resp.status_code in (200, 201):
                logger.info(f"WhatsApp sent successfully to {recipient}: {resp.text}")
                return True, resp.text
            else:
                logger.error(f"WhatsApp API failed with status {resp.status_code}: {resp.text}")
                return False, f"API Error {resp.status_code}: {resp.text}"
    except Exception as e:
        logger.exception(f"Exception during WhatsApp dispatch to {recipient}: {e}")
        return False, f"Connection/Network Exception: {str(e)}"
