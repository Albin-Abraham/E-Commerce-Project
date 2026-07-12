from rest_framework.views import APIView
from core.admin.permissions.drf_permissions import CustomPermissionClass

class BaseApiView(APIView):
    """
    Standardized Base API View for the ERP System.
    
    Attributes:
        model: Mandatory or Optional model class for Permission Orchestration.
    """
    model = None
    permission_classes = [CustomPermissionClass]

    def get_serializer_context(self):
        """
        Extra context provided to the serializer class.
        Includes the current validation mode and user.
        """
        context = super().get_serializer_context() if hasattr(super(), 'get_serializer_context') else {}
        context.update({
            'request': getattr(self, 'request', None),
            'view': self,
            'user': getattr(self.request, 'user', None) if hasattr(self, 'request') else None
        })
        return context
