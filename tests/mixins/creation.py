# tests/mixins/creation.py

class CreationMixin:
    """Mixin for factory-based object creation."""
    factory_class = None

    def create(self, **overrides):
        assert self.factory_class, f"factory_class must be defined in {self.__class__.__name__}"
        return self.factory_class.create(**overrides)

    def build(self, **overrides):
        """Build (but not save) an instance."""
        assert self.factory_class, f"factory_class must be defined in {self.__class__.__name__}"
        return self.factory_class.build(**overrides)
