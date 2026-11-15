import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Marketing Cron Scheduler API"
    DATABASE_URL: str = "sqlite:///./scheduler.db"
    
    # WhatsApp Business Cloud API Settings
    WHATSAPP_API_URL: str = "https://graph.facebook.com/v21.0"
    WHATSAPP_PHONE_NUMBER_ID: str = ""
    WHATSAPP_TOKEN: str = ""
    WHATSAPP_BUSINESS_ACCOUNT_ID: str = ""
    
    # Email SMTP Settings
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAIL_FROM: str = "marketing@example.com"
    EMAIL_FROM_NAME: str = "Marketing Alerts"
    
    # Fallback to simulated delivery if credentials not configured
    MOCK_DISPATCH: bool = True
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
