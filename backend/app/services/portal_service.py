import os
import hmac
import hashlib
import time
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

class HackathonPortalService:
    def __init__(self):
        self.app_id = os.getenv("APP_ID", "")
        self.app_secret = os.getenv("APP_SECRET", "")

    def get_portal_status(self) -> Dict[str, Any]:
        has_credentials = bool(self.app_id and self.app_secret)
        return {
            "connected": has_credentials,
            "app_id": self.app_id if self.app_id else "Not Configured",
            "app_id_preview": f"{self.app_id[:8]}...{self.app_id[-4:]}" if len(self.app_id) > 12 else self.app_id,
            "has_secret": bool(self.app_secret),
            "portal_name": "University Cloud Hackathon Portal",
            "auth_type": "HMAC-SHA256 OAuth / App Secret",
            "last_synced": time.strftime("%Y-%m-%d %H:%M:%S") if has_credentials else None
        }

    def generate_portal_signature(self, payload: str) -> str:
        """Generates an HMAC-SHA256 signature using the app secret to securely sign requests to the hackathon portal."""
        if not self.app_secret:
            return ""
        return hmac.new(
            self.app_secret.encode("utf-8"),
            payload.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

portal_service = HackathonPortalService()
