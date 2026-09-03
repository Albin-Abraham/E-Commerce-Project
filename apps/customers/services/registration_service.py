import logging
from django.contrib.auth import get_user_model
from django.db import transaction
from apps.customers.models.customer import Customer, CustomerPreference, CustomerAddress
from core.base_models.services.number_series import NumberSeriesService

User = get_user_model()
logger = logging.getLogger(__name__)


class CustomerRegistrationService:
    """
    Customer & User Account Self-Registration Engine.
    Handles onboarding for B2C Retail Customers, B2B Commercial Buyers, and Storefront Users.
    """

    @classmethod
    @transaction.atomic
    def register_customer(
        cls,
        username: str,
        email: str,
        password: str,
        full_name: str,
        customer_type: str = "INDIVIDUAL",
        phone: str | None = None,
        tax_id: str | None = None,
        company_id: str | None = None,
        address_data: dict | None = None,
    ) -> tuple[User, Customer]:
        """
        Atomically registers a new user login and customer profile with default preferences and optional address line.
        """
        username_clean = username.strip().lower()
        email_clean = email.strip().lower()

        if User.objects.filter(username=username_clean).exists():
            raise ValueError(f"Username '{username_clean}' is already taken.")
        if User.objects.filter(email=email_clean).exists():
            raise ValueError(f"Email '{email_clean}' is already registered.")

        # 1. Create Django User Login
        user = User.objects.create_user(
            username=username_clean,
            email=email_clean,
            password=password,
            first_name=full_name.split()[0] if full_name else "",
            last_name=" ".join(full_name.split()[1:]) if full_name and len(full_name.split()) > 1 else "",
        )

        # 2. Auto-generate Customer Code
        customer_code = NumberSeriesService.next(
            document_type="customer",
            company_id=company_id,
        ) or f"CUST-{user.id[:6].upper()}"

        # 3. Create Customer Entity
        customer = Customer.objects.create(
            customer_code=customer_code,
            user=user,
            name=full_name.strip(),
            customer_type=customer_type.upper(),
            email=email_clean,
            phone=phone,
            tax_id=tax_id,
            company_id=company_id,
            is_active=True,
        )

        # 4. Create Customer Preferences Default Profile
        CustomerPreference.objects.create(
            customer=customer,
            preferred_language="en",
            preferred_currency="USD",
            email_notifications=True,
            sms_notifications=bool(phone),
        )

        # 5. Create Default Delivery Address (If provided during signup)
        if address_data and isinstance(address_data, dict):
            CustomerAddress.objects.create(
                customer=customer,
                title=address_data.get("title", "Primary Address"),
                address_type=address_data.get("address_type", "DELIVERY"),
                attention_to=full_name,
                address_line_1=address_data.get("address_line_1", ""),
                address_line_2=address_data.get("address_line_2", ""),
                city=address_data.get("city", ""),
                state=address_data.get("state", ""),
                postal_code=address_data.get("postal_code", ""),
                country=address_data.get("country", "USA"),
                pincode=address_data.get("pincode", address_data.get("postal_code", "")),
                is_default_delivery=True,
                is_default_billing=True,
            )

        logger.info(f"Successfully registered customer '{customer.name}' ({customer.customer_code}) for user {user.username}")

        # Trigger Asynchronous Welcome Task via Celery & Redis
        try:
            from apps.customers.tasks import dispatch_welcome_customer_email_task
            dispatch_welcome_customer_email_task.delay(str(customer.id))
        except Exception as task_exc:
            logger.warning(f"Failed to queue Celery welcome email task: {task_exc}")

        return user, customer
