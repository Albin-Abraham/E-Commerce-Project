# tests/factories/user.py
import factory
from apps.users.models.users import UserModel

class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = UserModel

    email = factory.Sequence(lambda n: f"user_{n}@test.com")
    username = factory.Faker("user_name")
    full_name = factory.Faker("name")
    is_active = True
    is_staff = False

    @factory.post_generation
    def password(self, create, extracted, **kwargs):
        password = extracted or "password123"
        self.set_password(password)
        if create:
            self.save()
