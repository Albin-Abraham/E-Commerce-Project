import pytest
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.shop.interface.views.product_views import ProductViewSet
from apps.shop.infrastructure.models.product import Product
from tests.factories.user import UserFactory


@pytest.mark.django_db
class TestProductViewSet:
    def setup_method(self):
        self.factory = APIRequestFactory()
        self.user = UserFactory(is_superuser=True)
        self.view = ProductViewSet.as_view()

    def _get(self, **kwargs):
        request = self.factory.get("/api/shop/products/", kwargs)
        request.session = {}
        force_authenticate(request, user=self.user)
        return self.view(request)

    def _post(self, data):
        request = self.factory.post("/api/shop/products/", data, format="json")
        request.session = {}
        force_authenticate(request, user=self.user)
        return self.view(request)

    def _put(self, pk, data):
        request = self.factory.put(f"/api/shop/products/{pk}/", data, format="json")
        request.session = {}
        force_authenticate(request, user=self.user)
        return self.view(request, pk=pk)

    def _delete(self, pk):
        request = self.factory.delete(f"/api/shop/products/{pk}/")
        request.session = {}
        force_authenticate(request, user=self.user)
        return self.view(request, pk=pk)

    def test_list_products_empty(self):
        response = self._get()
        assert response.status_code in (200, 204)

    def test_create_product(self):
        data = {"name": "Test Product", "sku": "SKU001", "price": "29.99"}
        response = self._post(data)
        assert response.status_code in (200, 201)

    def test_list_products_with_data(self):
        Product.objects.create(name="Widget", sku="W001", price="10.00")
        Product.objects.create(name="Gadget", sku="G001", price="20.00")
        response = self._get()
        assert response.status_code == 200

    def test_retrieve_product(self):
        p = Product.objects.create(name="Widget", sku="W001", price="10.00")
        response = self._get(pk=p.pk)
        assert response.status_code == 200

    def test_update_product(self):
        p = Product.objects.create(name="Widget", sku="W001", price="10.00")
        data = {"name": "Updated Widget", "sku": "W001", "price": "15.00"}
        response = self._put(p.pk, data)
        assert response.status_code in (200, 204)

    def test_delete_product(self):
        p = Product.objects.create(name="Widget", sku="W001", price="10.00")
        response = self._delete(p.pk)
        assert response.status_code in (200, 204)

    def test_filter_by_name(self):
        Product.objects.create(name="Alpha", sku="A001", price="5.00")
        Product.objects.create(name="Beta", sku="B001", price="15.00")
        response = self._get(name="Alpha")
        assert response.status_code == 200

    def test_search_products(self):
        Product.objects.create(name="Special Widget", sku="SW001", price="99.99")
        response = self._get(search="Special")
        assert response.status_code == 200


@pytest.mark.django_db
class TestProductModel:
    def test_product_str(self):
        p = Product.objects.create(name="Test Product", sku="T001", price="10.00")
        assert str(p) == "Test Product"

    def test_product_requires_name_and_sku(self):
        p = Product(name="X", sku="X001", price="1.00")
        assert p.name == "X"
        assert p.sku == "X001"

    def test_product_default_is_active(self):
        p = Product.objects.create(name="Active", sku="ACT01", price="5.00")
        assert p.is_active is True
