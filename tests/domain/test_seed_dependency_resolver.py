import pytest

from core.base_models.seed_data.engine.base import BaseSeedModule
from core.base_models.seed_data.engine.context import SeedContext
from core.base_models.seed_data.engine.resolver import (
    CircularDependencyError,
    DependencyResolver,
    MissingDependencyError,
)


class DummyModule(BaseSeedModule):
    def execute(self, context: SeedContext, raw_data: any) -> None:
        pass


def test_resolver_orders_dependencies_correctly():
    m_brands = DummyModule(name="brands", section="catalog", depends_on=[])
    m_cats = DummyModule(name="categories", section="catalog", depends_on=[])
    m_prods = DummyModule(name="products", section="catalog", depends_on=["brands", "categories"])
    m_variants = DummyModule(name="variants", section="catalog", depends_on=["products"])
    m_wh = DummyModule(name="warehouses", section="inventory", depends_on=[])
    m_stock = DummyModule(name="stock", section="inventory", depends_on=["variants", "warehouses"])

    all_modules = [m_stock, m_variants, m_prods, m_wh, m_cats, m_brands]
    ordered = DependencyResolver.resolve(all_modules)

    names = [m.name for m in ordered]

    # Verify order constraints
    assert names.index("brands") < names.index("products")
    assert names.index("categories") < names.index("products")
    assert names.index("products") < names.index("variants")
    assert names.index("warehouses") < names.index("stock")
    assert names.index("variants") < names.index("stock")


def test_resolver_detects_circular_dependency():
    m_a = DummyModule(name="A", section="s", depends_on=["B"])
    m_b = DummyModule(name="B", section="s", depends_on=["C"])
    m_c = DummyModule(name="C", section="s", depends_on=["A"])

    with pytest.raises(CircularDependencyError) as exc_info:
        DependencyResolver.resolve([m_a, m_b, m_c])

    assert "Circular dependency detected" in str(exc_info.value)


def test_resolver_detects_missing_dependency():
    m_a = DummyModule(name="A", section="s", depends_on=["NON_EXISTENT"])

    with pytest.raises(MissingDependencyError) as exc_info:
        DependencyResolver.resolve([m_a])

    assert "depends on 'NON_EXISTENT', which is not registered" in str(exc_info.value)


def test_resolver_sub_dag_resolution():
    m_brands = DummyModule(name="brands", section="catalog", depends_on=[])
    m_prods = DummyModule(name="products", section="catalog", depends_on=["brands"])
    m_wh = DummyModule(name="warehouses", section="inventory", depends_on=[])
    m_stock = DummyModule(name="stock", section="inventory", depends_on=["products", "warehouses"])
    m_unrelated = DummyModule(name="unrelated", section="other", depends_on=[])

    all_modules = [m_brands, m_prods, m_wh, m_stock, m_unrelated]

    # Request only 'stock'
    ordered = DependencyResolver.resolve(all_modules, target_names=["stock"])
    names = [m.name for m in ordered]

    # Must include stock and all its dependencies
    assert "stock" in names
    assert "products" in names
    assert "brands" in names
    assert "warehouses" in names
    # Unrelated must NOT be included
    assert "unrelated" not in names
