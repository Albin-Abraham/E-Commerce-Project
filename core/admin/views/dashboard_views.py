from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from core.base_models.system_models import SystemModule

class TestDashboardView(LoginRequiredMixin, UserPassesTestMixin, TemplateView):
    """
    Renders the Premium Test Dashboard with dynamic module orchestration.
    """
    template_name = "test_dashboard.html"
    
    def test_func(self):
        return self.request.user.is_staff

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Fetch active modules for the dynamic orchestration sidebar
        context['modules'] = SystemModule.objects.filter(is_active=True).order_by('name')
        return context
