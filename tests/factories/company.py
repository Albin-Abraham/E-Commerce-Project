# tests/factories/company.py
import factory
from faker import Faker
from core.admin.models.company import Company
from .subscription import SubscriptionFactory

fake = Faker()

class CompanyFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Company

    name = factory.Faker("company")
    email = factory.LazyAttribute(lambda o: f"{o.name.lower().replace(' ', '_')}@example.com")
    code = factory.LazyAttribute(lambda o: o.name[:3].upper() + fake.pystr(min_chars=2, max_chars=2))
    subscription = factory.SubFactory(SubscriptionFactory)
