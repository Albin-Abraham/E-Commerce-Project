from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiParameter, inline_serializer
from rest_framework import serializers
from typing import Any, Optional, TypedDict

from core.session.context import SessionContext

class ProfileDict(TypedDict, total=False):
    company_id: Optional[str]
    branch_id: Optional[str]
    business_unit_id: Optional[str]

class SessionContextDict(TypedDict, total=False):
    company_id: Optional[str]
    business_unit_id: Optional[str]
    branch_id: Optional[str]
    profile: Optional[ProfileDict]

class BaseSessionAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get_current_context(self, request) -> SessionContextDict:
        return {
            "company_id": SessionContext.get_company_id(request),
            "business_unit_id": SessionContext.get_business_unit_id(request),
            "branch_id": SessionContext.get_branch_id(request),
        }

class SessionSetCompanyAPIView(BaseSessionAPIView):
    """Set the active Company in the session."""
    
    @extend_schema(
        tags=["Session Management"], 
        summary="Set Company",
        request=inline_serializer(name="SetCompanyRequest", fields={"company_id": serializers.UUIDField()})
    )
    def post(self, request):
        SessionContext.set_company(request, request.data.get("company_id"))
        return Response({"success": True, "data": self.get_current_context(request)})

class SessionSetBUAPIView(BaseSessionAPIView):
    """Set the active Business Unit in the session."""
    
    @extend_schema(
        tags=["Session Management"], 
        summary="Set Business Unit",
        request=inline_serializer(name="SetBURequest", fields={"business_unit_id": serializers.UUIDField()})
    )
    def post(self, request):
        SessionContext.set_business_unit(request, request.data.get("business_unit_id"))
        return Response({"success": True, "data": self.get_current_context(request)})

class SessionSetBranchAPIView(BaseSessionAPIView):
    """Set the active Branch in the session."""
    
    @extend_schema(
        tags=["Session Management"], 
        summary="Set Branch",
        request=inline_serializer(name="SetBranchRequest", fields={"branch_id": serializers.UUIDField()})
    )
    def post(self, request):
        SessionContext.set_branch(request, request.data.get("branch_id"))
        return Response({"success": True, "data": self.get_current_context(request)})

class SessionSetCompanyBUAPIView(BaseSessionAPIView):
    """Set the active Company and Business Unit in the session."""
    
    @extend_schema(
        tags=["Session Management"], 
        summary="Set Company & BU",
        request=inline_serializer(
            name="SetCompanyBURequest",
            fields={"company_id": serializers.UUIDField(), "business_unit_id": serializers.UUIDField()}
        )
    )
    def post(self, request):
        SessionContext.set_company_bu(request, request.data.get("company_id"), request.data.get("business_unit_id"))
        return Response({"success": True, "data": self.get_current_context(request)})

class SessionSetBUBranchAPIView(BaseSessionAPIView):
    """Set the active Business Unit and Branch in the session."""
    
    @extend_schema(
        tags=["Session Management"], 
        summary="Set BU & Branch",
        request=inline_serializer(
            name="SetBUBranchRequest",
            fields={"business_unit_id": serializers.UUIDField(), "branch_id": serializers.UUIDField()}
        )
    )
    def post(self, request):
        SessionContext.set_bu_branch(request, request.data.get("business_unit_id"), request.data.get("branch_id"))
        return Response({"success": True, "data": self.get_current_context(request)})

class SessionClearAPIView(BaseSessionAPIView):
    """Clear the active session context."""
    
    @extend_schema(tags=["Session Management"], summary="Clear Session")
    def post(self, request):
        SessionContext.clear_context(request)
        return Response({"success": True, "data": self.get_current_context(request)})
