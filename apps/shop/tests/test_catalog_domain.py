import pytest
from rest_framework.test import APIRequestFactory, force_authenticate

from apps.shop.infrastructure.models.product import Product
from apps.shop.infrastructure.models.variant import ProductVariant
from apps.shop.infrastructure.models.catalog import (
    Catalog,
    CatalogItem,
    CatalogCollection,
    CatalogPublication,
)
from apps.shop.interface.views.catalog_views import (
    CatalogViewSet,
    CatalogItemViewSet,
    CatalogCollectionViewSet,
    CatalogPublicationViewSet,
)
from tests.factories.user import UserFactory


@pytest.mark.django_db
class TestCatalogDomainModels:
    def test_catalog_creation_and_auto_slug(self):
        cat = Catalog.objects.create(name="Summer Catalog 2026", code="SUMMER-26")
        assert cat.slug == "summer-catalog-2026"
        assert str(cat) == "Summer Catalog 2026 (SUMMER-26)"

    def test_catalog_item_overrides_and_badges(self):
        cat = Catalog.objects.create(name="Primary Storefront", code="MAIN")
        prod = Product.objects.create(name="Standard Laptop", sku="LAP-001", price="1000.00")
        
        item = CatalogItem.objects.create(
            catalog=cat,
            product=prod,
            override_name="Custom Pro Laptop",
            override_price="899.99",
            is_new_arrival=True,
            is_budget_friendly=False,
        )
        assert item.display_name == "Custom Pro Laptop"
        assert float(item.effective_price) == 899.99
        assert item.is_new_arrival is True

    def test_catalog_collection_new_arrivals_and_budget_friendly(self):
        cat = Catalog.objects.create(name="Featured Storefront", code="FEAT")
        prod1 = Product.objects.create(name="Budget Phone", sku="PH-001", price="49.99")
        prod2 = Product.objects.create(name="Flagship Phone", sku="PH-002", price="999.99")

        item1 = CatalogItem.objects.create(
            catalog=cat,
            product=prod1,
            is_budget_friendly=True,
            is_new_arrival=True,
        )
        item2 = CatalogItem.objects.create(
            catalog=cat,
            product=prod2,
            is_new_arrival=True,
            is_budget_friendly=False,
        )

        # 1. New Arrivals Collection
        new_arrivals_col = CatalogCollection.objects.create(
            catalog=cat,
            name="New Arrivals",
            collection_type=CatalogCollection.CollectionType.NEW_ARRIVALS,
        )
        new_items = list(new_arrivals_col.get_effective_items())
        assert len(new_items) == 2
        assert item1 in new_items and item2 in new_items

        # 2. Budget Friendly Collection with threshold
        budget_col = CatalogCollection.objects.create(
            catalog=cat,
            name="Budget Friendly",
            collection_type=CatalogCollection.CollectionType.BUDGET_FRIENDLY,
            max_budget_price="100.00",
        )
        budget_items = list(budget_col.get_effective_items())
        assert len(budget_items) == 1
        assert budget_items[0] == item1

    def test_catalog_publication_workflow(self):
        cat = Catalog.objects.create(name="Omni Catalog", code="OMNI")
        pub = CatalogPublication.objects.create(
            catalog=cat,
            channel=CatalogPublication.Channel.WHATSAPP,
        )
        assert pub.published_at is None
        pub.publish()
        assert pub.published_at is not None
        assert pub.is_active is True
        assert "WhatsApp" in str(pub)

    def test_gfk_entity_tagging(self):
        from django.contrib.contenttypes.models import ContentType
        from apps.shop.infrastructure.models.catalog import TagDefinition, EntityTag

        cat = Catalog.objects.create(name="Tag Test Catalog", code="TAG-01")
        prod = Product.objects.create(name="Dynamic Phone", sku="DP-001", price="75.00")
        item = CatalogItem.objects.create(catalog=cat, product=prod)

        tag_def = TagDefinition.objects.create(
            code="BUDGET_FRIENDLY",
            name="Budget Friendly",
            badge_label="Best Value",
            badge_color="#28a745",
        )

        ct = ContentType.objects.get_for_model(CatalogItem)
        etag = EntityTag.objects.create(
            tag_definition=tag_def,
            content_type=ct,
            object_id=str(item.id),
        )

        assert etag.is_currently_active() is True

        col = CatalogCollection.objects.create(
            catalog=cat,
            name="Budget Friendly Specials",
            collection_type=CatalogCollection.CollectionType.BUDGET_FRIENDLY,
            max_budget_price="100.00",
        )
        effective = list(col.get_effective_items())
        assert len(effective) == 1
        assert effective[0] == item


@pytest.mark.django_db
class TestCatalogAPIViewSets:
    def setup_method(self):
        self.factory = APIRequestFactory()
        self.user = UserFactory(is_superuser=True)

    def _post(self, view_cls, url, data):
        view = view_cls.as_view()
        request = self.factory.post(url, data, format="json")
        request.session = {}
        force_authenticate(request, user=self.user)
        return view(request)

    def _get(self, view_cls, url, **kwargs):
        view = view_cls.as_view()
        request = self.factory.get(url, kwargs)
        request.session = {}
        force_authenticate(request, user=self.user)
        return view(request)

    def test_create_and_list_catalog_api(self):
        data = {"name": "B2B Catalog", "code": "B2B-01"}
        res = self._post(CatalogViewSet, "/api/v1/shop/catalogs/", data)
        assert res.status_code in (200, 201)
        assert res.data["data"]["code"] == "B2B-01"

        res_list = self._get(CatalogViewSet, "/api/v1/shop/catalogs/")
        assert res_list.status_code == 200

    def test_catalog_item_api(self):
        cat = Catalog.objects.create(name="Store", code="STR")
        prod = Product.objects.create(name="Widget", sku="W-01", price="10.00")
        data = {
            "catalog": cat.pk,
            "product": prod.pk,
            "is_new_arrival": True,
            "is_budget_friendly": True,
        }
        res = self._post(CatalogItemViewSet, "/api/v1/shop/catalog-items/", data)
        assert res.status_code in (200, 201)
        assert res.data["data"]["is_new_arrival"] is True

    def test_catalog_collection_api(self):
        cat = Catalog.objects.create(name="Store", code="STR2")
        data = {
            "catalog": cat.pk,
            "name": "Deals under $50",
            "collection_type": "BUDGET_FRIENDLY",
            "max_budget_price": "50.00",
        }
        res = self._post(CatalogCollectionViewSet, "/api/v1/shop/catalog-collections/", data)
        assert res.status_code in (200, 201)
        assert res.data["data"]["collection_type"] == "BUDGET_FRIENDLY"
