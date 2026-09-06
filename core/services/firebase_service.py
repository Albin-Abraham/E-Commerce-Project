import json
import logging
from core.base_models.system_models import SystemConfig

logger = logging.getLogger(__name__)


class FirebaseNotificationService:
    """
    Google Firebase Cloud Messaging (FCM) Push Notification Service.
    Loads service account JSON credentials dynamically from SystemConfig ('FIREBASE_CREDENTIALS_JSON').
    Dispatches FCM multicast push notifications and automatically cleans up expired device tokens.
    """

    _firebase_import_error: str | None = None

    @classmethod
    def _firebase(cls):
        """
        Lazily imports the firebase_admin SDK so the module and any downstream
        workers/autoresponders load cleanly even when firebase-admin is not
        installed (CI/test/dev). Raises later only if a push is actually attempted.
        """
        if cls._firebase_import_error is not None:
            return None
        if cls.__dict__.get("_firebase_admin"):
            return cls._firebase_admin
        try:
            import firebase_admin
            from firebase_admin import credentials, messaging  # noqa: F401 (re-exposed via _firebase_admin)
            cls._firebase_admin = {
                "app": firebase_admin,
                "credentials": credentials,
                "messaging": messaging,
            }
            return cls._firebase_admin
        except Exception as exc:  # ModuleNotFoundError or init failure
            cls._firebase_import_error = str(exc)
            logger.warning(f"firebase_admin unavailable; FCM push disabled: {cls._firebase_import_error}")
            return None

    @classmethod
    def _initialize_firebase(cls):
        """Initializes firebase_admin app singleton if not already initialized."""
        fb = cls._firebase()
        if fb is None:
            return False
        firebase_admin, credentials = fb["app"], fb["credentials"]
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

        fb = cls._firebase()
        if fb is None:
            return {"success": 0, "failure": len(tokens), "error": "Firebase SDK not installed"}
        messaging = fb["messaging"]

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
