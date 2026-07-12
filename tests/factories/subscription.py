# tests/factories/subscription.py
import factory
from faker import Faker
from core.admin.models.subscriptions import Subscription

fake = Faker()

class SubscriptionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Subscription

    name = factory.Faker("word")
    description = factory.Faker("sentence")
    licenses = factory.LazyFunction(
        lambda: {
            "max_users": fake.random_int(5, 100),
            "max_business_units": fake.random_int(1, 10),
            "storage_gb": fake.random_int(10, 500)
        }
    )
    modules = factory.LazyFunction(lambda: ["accounting", "crm"])
    pricing = factory.LazyFunction(
        lambda: {"currency": "USD", "monthly": fake.random_int(10, 200)}
    )
    is_active = True
