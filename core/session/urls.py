from django.urls import path
from .views import (
    SessionSetCompanyAPIView,
    SessionSetBUAPIView,
    SessionSetBranchAPIView,
    SessionSetCompanyBUAPIView,
    SessionSetBUBranchAPIView,
    SessionClearAPIView
)

urlpatterns = [
    path('set-company/', SessionSetCompanyAPIView.as_view(), name='session-set-company'),
    path('set-bu/', SessionSetBUAPIView.as_view(), name='session-set-bu'),
    path('set-branch/', SessionSetBranchAPIView.as_view(), name='session-set-branch'),
    path('set-company-bu/', SessionSetCompanyBUAPIView.as_view(), name='session-set-company-bu'),
    path('set-bu-branch/', SessionSetBUBranchAPIView.as_view(), name='session-set-bu-branch'),
    path('clear/', SessionClearAPIView.as_view(), name='session-clear'),
]
