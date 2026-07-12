from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from apps.core_documents.models import DocumentDefinition, Document, DocumentVersion
from apps.core_documents.services.document_service import DocumentService
from core.admin.models.company import Company
from apps.users.models.users import UserModel

from django.test import override_settings

@override_settings(BYPASS_VALIDATION_GUARD=True)
class DocumentServiceTest(TestCase):
    def setUp(self):
        # Create a user for uploading
        self.user = UserModel.objects.create_user(
            email="test@user.com", 
            username="testuser", 
            password="password"
        )
        # Create a company to attach documents to
        self.company = Company.objects.create(
            name="Test Co", 
            email="test@co.com", 
            code="TCO"
        )
        # Create a global document definition
        self.definition = DocumentDefinition.objects.create(
            key="test_doc",
            label="Test Document",
            is_global=True
        )

    def test_upload_document_success(self):
        """Test uploading a file via DocumentService."""
        file_content = b"hello world"
        file_obj = SimpleUploadedFile("test.txt", file_content)
        
        # ACT
        version = DocumentService.upload_document(
            entity=self.company,
            definition_key="test_doc",
            file_obj=file_obj,
            uploaded_by=self.user,
            metadata={"source": "test_upload"}
        )
        
        # ASSERT
        self.assertEqual(version.version, 1)
        self.assertEqual(version.document.definition, self.definition)
        self.assertEqual(version.document.content_object, self.company)
        self.assertEqual(version.metadata_snapshot["source"], "test_upload")
        
        # TEST VERSIONING
        file_obj_2 = SimpleUploadedFile("test2.txt", b"new content")
        version_2 = DocumentService.upload_document(
            entity=self.company,
            definition_key="test_doc",
            file_obj=file_obj_2,
            uploaded_by=self.user
        )
        self.assertEqual(version_2.version, 2)
        self.assertEqual(version_2.document.current_version, 2)
        self.assertEqual(version_2.document.versions.count(), 2)

    def test_upload_invalid_definition(self):
        """Test that uploading with a non-existent definition key fails."""
        file_obj = SimpleUploadedFile("test.txt", b"content")
        with self.assertRaises(ValueError):
            DocumentService.upload_document(
                entity=self.company,
                definition_key="non_existent",
                file_obj=file_obj,
                uploaded_by=self.user
            )

    def test_get_documents_for_entity(self):
        """Test retrieving documents attached to an entity."""
        file_obj = SimpleUploadedFile("test.txt", b"content")
        DocumentService.upload_document(self.company, "test_doc", file_obj, self.user)
        
        docs = DocumentService.get_documents_for_entity(self.company)
        self.assertEqual(docs.count(), 1)
        self.assertEqual(docs[0].definition, self.definition)
