import json
import logging
import firebase_admin
from firebase_admin import credentials, messaging
from core.base_models.system_models import SystemConfig

logger = logging.getLogger(__name__)


class FirebaseNotificationService:
    """
    Google Firebase Cloud Messaging (FCM) Push Notification Service.
    Loads service account JSON credentials dynamically from SystemConfig ('FIREBASE_CREDENTIALS_JSON').
    Dispatches FCM multicast push notifications and automatically cleans up expired device tokens.
    """

    @classmethod
    def _initialize_firebase(cls):
        """Initializes firebase_admin app singleton if not already initialized."""
        if not firebase_admin._apps:
            cred_json_str = SystemConfig.load_val("FIREBASE_CREDENTIALS_JSON")
            if not cred_json_str:
                logger.warning("FIREBASE_CREDENTIALS_JSON is missing in SystemConfig. FCM Push notifications disabled.")
                return False

            try:
                cred_dict = json.loads(cred_json_str)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
                logger.info("Successfully initialized Firebase Admin SDK from SystemConfig")
                return True
            except Exception as exc:
                logger.error(f"Failed to initialize Firebase Admin SDK: {exc}")
                return False
        return True

    @classmethod
    def send_push_to_tokens(cls, tokens: list[str], title: str, body: str, data_payload: dict | None = None) -> dict:
        """
        Dispatches FCM push notification to a list of device tokens using send_each_for_multicast.
        Cleans up invalid tokens automatically.
        """
        if not tokens:
            return {"success": 0, "failure": 0, "message": "No device tokens provided"}

        if not cls._initialize_firebase():
            return {"success": 0, "failure": len(tokens), "error": "Firebase SDK not initialized"}

        try:
            message = messaging.MulticastMessage(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data=data_payload or {},
                tokens=tokens,
            )

            response = messaging.send_each_for_multicast(message)

            # Clean up invalid registration tokens automatically
            invalid_tokens = []
            for idx, resp in enumerate(response.responses):
                if not resp.success:
                    err_str = str(resp.exception)
                    if "registration-token-not-registered" in err_str or "invalid-registration-token" in err_str:
                        invalid_tokens.append(tokens[idx])

            if invalid_tokens:
                from apps.autoresponder.models import UserDeviceToken
                UserDeviceToken.objects.filter(device_token__in=invalid_tokens).update(is_active=False)
                logger.info(f"Deactivated {len(invalid_tokens)} expired FCM device tokens.")

            logger.info(f"FCM Push dispatch: {response.success_count} success, {response.failure_count} failure")
            return {
                "success": response.success_count,
                "failure": response.failure_count,
                "invalid_tokens_count": len(invalid_tokens),
            }

        except Exception as exc:
            logger.error(f"FCM Push notification error: {exc}")
            return {"success": 0, "failure": len(tokens), "error": str(exc)}
