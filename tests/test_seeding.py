import pytest
from core.base_models.system_models import SystemModule, SystemConfig
from tests.base import BaseTest
from tests.mixins.seeding_mixins import SeedingMixin
from tests.mixins.core_mixins import AssertionMixin

@pytest.mark.django_db
class TestSeedingOrchestration(BaseTest, SeedingMixin, AssertionMixin):
    
    def test_seed_system_config_set(self):
        """Test seeding using the formal 'Set-Config' alias."""
        output = self.run_seed_command('Set-Config')
        assert "SystemConfig" in output
        
        # Verify specific key from system_config.yaml (e.g., system_timezone)
        config = SystemConfig.objects.get(key='system_timezone')
        assert config.value is not None
        assert "America/New_York" in config.value or "UTC" in config.value

    def test_seed_modules_set(self):
        """Test seeding using the formal 'Set-Module' alias."""
        output = self.run_seed_command('Set-Module')
        assert "Module" in output
        
        # Verify at least one module exists (e.g., HRM or Payroll from module_config.yaml)
        count = SystemModule.objects.count()
        assert count > 0
        
        # Verify HRM module specifically if it exists in the yaml
        hrm = SystemModule.objects.filter(code='HRM').first()
        if hrm:
            self.assert_field(hrm, 'code', 'HRM')

    def test_seed_master_data(self):
        """Test seeding master data (Brands, Categories, CategoryEdges, Products, ProductVariants)."""
        from apps.shop.infrastructure.models.brand import Brand
        from apps.shop.infrastructure.models.category import Category, CategoryEdge
        from apps.shop.infrastructure.models.product import Product
        from apps.shop.infrastructure.models.variant import ProductVariant

        output = self.run_seed_command('master_data')
        assert "Created Brand" in output or "Updated Brand" in output
        assert "Created Category" in output or "Updated Category" in output
        assert "Created Product" in output or "Updated Product" in output

        assert Brand.objects.filter(slug='apex-electronics').exists()
        assert Category.objects.filter(slug='computers-laptops').exists()
        assert Product.objects.filter(sku='PROD-APX-LAPTOP-15').exists()
        assert ProductVariant.objects.filter(sku='VAR-APX-LAP-15-SLV-512').exists()

