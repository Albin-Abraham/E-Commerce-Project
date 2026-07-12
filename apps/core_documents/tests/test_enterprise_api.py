from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate
from rest_framework import serializers
from apps.core_documents.models import DocumentDefinition
from core.base_views.api_views import BaseAPIView
from core.base_serializers.base_serializers import BaseModelSerializer
from apps.users.models.users import UserModel
import json

# 1. Test Serializer
class DocDefSerializer(BaseModelSerializer):
    class Meta:
        model = DocumentDefinition
        fields = ['id', 'key', 'label', 'is_global']

# 2. Test View with Hooks
class DocDefAPIView(BaseAPIView):
    model = DocumentDefinition
    serializer_class = DocDefSerializer
    entity_name = "Document Definition"
    permission_classes = []  # Bypass for testing
    search_fields = ['key', 'label']
    orderby = "key"
    paginate = True  # Enable pagination for testing
    
    pre_create_called = False
    post_create_called = False
    
    @classmethod
    def reset_hooks(cls):
        cls.pre_create_called = False
        cls.post_create_called = False
    
    def pre_create(self, request, data):
        DocDefAPIView.pre_create_called = True
        return super().pre_create(request, data)
    
    def post_create(self, instance):
        DocDefAPIView.post_create_called = True
        super().post_create(instance)

from django.test import override_settings

@override_settings(BYPASS_VALIDATION_GUARD=True, CELERY_TASK_ALWAYS_EAGER=True)
class EnterpriseAPITest(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.user = UserModel.objects.create_superuser(
            email="admin@test.com", username="admin", password="password"
        )
        DocDefAPIView.reset_hooks()

    def test_hooks_execution(self):
        """Verify pre_create and post_create hooks are executed."""
        data = {"key": "hook_test", "label": "Hook Test", "is_global": True}
        request = self.factory.post('/api/doc-defs/', data, format='json')
        request.session = {}
        force_authenticate(request, user=self.user)
        
        view = DocDefAPIView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, 201)
        self.assertTrue(DocDefAPIView.pre_create_called)
        self.assertTrue(DocDefAPIView.post_create_called)

    def test_bulk_create(self):
        """Verify bulk creation (List in POST)."""
        data = [
            {"key": "bulk_1", "label": "Bulk 1"},
            {"key": "bulk_2", "label": "Bulk 2"}
        ]
        request = self.factory.post('/api/doc-defs/', data, format='json')
        request.session = {}
        force_authenticate(request, user=self.user)
        
        view = DocDefAPIView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(DocumentDefinition.objects.filter(key__startswith="bulk_").count(), 2)

    def test_dynamic_fields(self):
        """Verify ?fields= pruning."""
        obj = DocumentDefinition.objects.create(key="field_test", label="Field Test")
        request = self.factory.get('/api/doc-defs/', {'fields': 'key,label'})
        request.session = {}
        force_authenticate(request, user=self.user)
        
        view = DocDefAPIView()
        drf_request = view.initialize_request(request)
        view.request = drf_request
        
        serializer = view.init_serializer(obj)
        self.assertIn('key', serializer.data)
        self.assertIn('label', serializer.data)
        self.assertNotIn('is_global', serializer.data)

    def test_advanced_filtering_and_sorting(self):
        """Verify __iexact lookup and dynamic sorting."""
        DocumentDefinition.objects.create(key="B_FIELD", label="B")
        DocumentDefinition.objects.create(key="A_FIELD", label="A")
        
        # Test Sort (ascending)
        request = self.factory.get('/api/doc-defs/', {'sort': 'key'})
        request.session = {}
        force_authenticate(request, user=self.user)
        
        view_instance = DocDefAPIView()
        drf_request = view_instance.initialize_request(request)
        view_instance.request = drf_request
        
        qs = view_instance._get_queryset()
        self.assertEqual(qs[0].key, "A_FIELD")
        
        # Test Descending Sort
        request_desc = self.factory.get('/api/doc-defs/', {'sort': '-key'})
        request_desc.session = {}
        force_authenticate(request_desc, user=self.user)
        drf_request_desc = view_instance.initialize_request(request_desc)
        view_instance.request = drf_request_desc
        qs_desc = view_instance._get_queryset()
        self.assertEqual(qs_desc[0].key, "B_FIELD")

    def test_enhanced_pagination_metadata(self):
        """Verify rich metadata and range info."""
        for i in range(25):
            DocumentDefinition.objects.create(key=f"pag_{i:02d}", label=f"Label {i}")
            
        request = self.factory.get('/api/doc-defs/', {'page': 1, 'page_size': 10})
        request.session = {}
        force_authenticate(request, user=self.user)
        
        view = DocDefAPIView.as_view()
        response = view(request)
        
        self.assertEqual(response.status_code, 200)
        data = response.data
        self.assertTrue(data['success'])
        self.assertEqual(data['count'], 25)
        self.assertEqual(data['total_pages'], 3)
        self.assertEqual(data['range'], "showing 1-10 of 25")
        self.assertTrue(data['has_next'])
        self.assertIn('next_url', data)

    def test_cursor_pagination(self):
        """Verify switching to cursor pagination."""
        for i in range(5):
            DocumentDefinition.objects.create(key=f"cur_{i}", label=f"Cursor {i}")
            
        # Request with cursor (empty for initial page)
        request = self.factory.get('/api/doc-defs/', {'cursor': '', 'page_size': 2})
        request.session = {}
        force_authenticate(request, user=self.user)
        
        view = DocDefAPIView.as_view()
        response = view(request)
        
        # Cursor pagination results don't have 'count' or 'total_pages'
        self.assertIn('results', response.data)
        self.assertNotIn('count', response.data)
        self.assertIn('next_url', response.data)

    def test_bulk_delete(self):
        """Verify bulk deletion (List of IDs in DELETE)."""
        d1 = DocumentDefinition.objects.create(key="del_1", label="Del 1")
        d2 = DocumentDefinition.objects.create(key="del_2", label="Del 2")
        
        data = [d1.id, d2.id]
        request = self.factory.delete('/api/doc-defs/', data, format='json')
        request.session = {}
        force_authenticate(request, user=self.user)
        
        view = DocDefAPIView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, 202)
        self.assertEqual(DocumentDefinition.objects.filter(key__startswith="del_").count(), 0)
