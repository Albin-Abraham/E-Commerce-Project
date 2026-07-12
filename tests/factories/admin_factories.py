import factory
from faker import Faker
from core.admin.models.company import Company
from core.admin.models.subscriptions import Subscription
from core.admin.models.business_unit import BusinessUnit

fake = Faker()

class SubscriptionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Subscription

    name = factory.Faker("word")
    pricing = factory.LazyFunction(
        lambda: {"currency": "USD", "monthly": fake.random_int(10, 200)}
    )
    licenses = factory.LazyFunction(lambda: {"max_users": 10})

class CompanyFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Company

    name = factory.Faker("company")
    email = factory.Sequence(lambda n: f"company_{n}@test.com")
    code = factory.LazyAttribute(lambda o: o.name[:8].upper())
    subscription = factory.SubFactory(SubscriptionFactory)

class BusinessUnitFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = BusinessUnit

    name = factory.Faker("department")
    code = factory.LazyAttribute(lambda o: o.name[:4].upper())
    description = factory.Faker("catch_phrase")
    company = factory.SubFactory(CompanyFactory)
