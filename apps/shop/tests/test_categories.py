import pytest
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.shop.interface.views.category_views import CategoryViewSet
from apps.shop.infrastructure.models.category import Category
from tests.factories.user import UserFactory


@pytest.mark.django_db
class TestCategoryViewSet:
    def setup_method(self):
        self.factory = APIRequestFactory()
        self.user = UserFactory(is_superuser=True)
        self.view = CategoryViewSet.as_view()

    def _get(self, **kwargs):
        request = self.factory.get("/api/shop/categories/", kwargs)
        request.session = {}
        force_authenticate(request, user=self.user)
        return self.view(request)

    def _post(self, data):
        request = self.factory.post("/api/shop/categories/", data, format="json")
        request.session = {}
        force_authenticate(request, user=self.user)
        return self.view(request)

    def _delete(self, pk):
        request = self.factory.delete(f"/api/shop/categories/{pk}/")
        request.session = {}
        force_authenticate(request, user=self.user)
        return self.view(request, pk=pk)

    def test_list_categories_empty(self):
        response = self._get()
        assert response.status_code in (200, 204)

    def test_create_category(self):
        data = {"name": "Electronics"}
        response = self._post(data)
        assert response.status_code in (200, 201)

    def test_list_categories_with_data(self):
        Category.objects.create(name="Books")
        Category.objects.create(name="Clothing")
        response = self._get()
        assert response.status_code == 200

    def test_retrieve_category(self):
        c = Category.objects.create(name="Sports")
        response = self._get(pk=c.pk)
        assert response.status_code == 200

    def test_delete_category(self):
        c = Category.objects.create(name="Temp")
        response = self._delete(c.pk)
        assert response.status_code in (200, 204)

    def test_filter_by_name(self):
        Category.objects.create(name="Sports")
        Category.objects.create(name="Music")
        response = self._get(name="Sports")
        assert response.status_code == 200

    def test_category_parent_child(self):
        parent = Category.objects.create(name="Electronics")
        child = Category.objects.create(name="Phones", parent=parent)
        assert child.parent == parent
        assert child in parent.children.all()


@pytest.mark.django_db
class TestCategoryModel:
    def test_category_str(self):
        c = Category.objects.create(name="Books")
        assert str(c) == "Books"

    def test_category_ordering(self):
        Category.objects.create(name="Zebra")
        Category.objects.create(name="Alpha")
        cats = list(Category.objects.values_list("name", flat=True))
        assert cats == ["Alpha", "Zebra"]
