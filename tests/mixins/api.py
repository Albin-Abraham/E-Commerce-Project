# tests/mixins/api.py
from rest_framework.test import APIClient
import pytest

class APITestMixin:
    """Mixin for API interaction and authentication."""
    
    @pytest.fixture(autouse=True)
    def setup_api_client(self):
        self.client = APIClient()

    def authenticate(self, user):
        """Helper to authenticate requests with a user."""
        self.client.force_authenticate(user=user)

    def get_api(self, url, **kwargs):
        return self.client.get(url, **kwargs)

    def post_api(self, url, data=None, **kwargs):
        return self.client.post(url, data, format='json', **kwargs)

    def put_api(self, url, data=None, **kwargs):
        return self.client.put(url, data, format='json', **kwargs)

    def patch_api(self, url, data=None, **kwargs):
        return self.client.patch(url, data, format='json', **kwargs)

    def delete_api(self, url, **kwargs):
        return self.client.delete(url, **kwargs)
