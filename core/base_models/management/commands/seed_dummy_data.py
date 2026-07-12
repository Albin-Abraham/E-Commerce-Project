import os
import yaml
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils import timezone
from core.admin.models.company import Company
from core.admin.models.branch import Branch
from apps.users.models.users import UserModel, UserProfileModel

class Command(BaseCommand):
    help = 'Seeds dummy multi-tenant data for development.'

    def handle(self, *args, **options):
        setattr(settings, 'BYPASS_VALIDATION_GUARD', True)
        config_path = os.path.join(settings.BASE_DIR, 'core', 'base_models', 'configs', 'dummy_data.yaml')
        
        if not os.path.exists(config_path):
            self.stderr.write(self.style.ERROR(f"Dummy data config not found at {config_path}"))
            return

        with open(config_path, 'r') as f:
            data = yaml.safe_load(f)

        tenants = data.get('tenants', [])
        now = timezone.now()

        for t_info in tenants:
            # 1. Seed Company
            company, created = Company.objects.update_or_create(
                code=t_info['code'],
                defaults={
                    'name': t_info['name'],
                    'email': t_info['email'],
                    'updated_at': now,
                }
            )
            status = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(f"{status} Company: {company.name} ({company.code})"))

            # 2. Seed Branches
            branches_data = t_info.get('branches', [])
            for b_info in branches_data:
                branch, b_created = Branch.objects.update_or_create(
                    company=company,
                    code=b_info['code'],
                    defaults={
                        'name': b_info['name'],
                        'location': b_info.get('location', 'Unknown'),
                        'opened_date': '2026-01-01',
                        'updated_at': now,
                    }
                )
                b_status = "Created" if b_created else "Updated"
                self.stdout.write(self.style.SUCCESS(f"  {b_status} Branch: {branch.name}"))

                # 3. Seed Users for this Branch
                users_data = b_info.get('users', [])
                for u_info in users_data:
                    email = u_info['email']
                    user = UserModel.objects.filter(email=email).first()
                    
                    if not user:
                        user = UserModel.objects.create_user(
                            email=email,
                            username=u_info['username'],
                            password='password123',
                            full_name=u_info.get('full_name', ''),
                            is_staff=u_info.get('is_staff', False)
                        )
                        self.stdout.write(self.style.SUCCESS(f"    Created User: {email}"))
                    else:
                        user.full_name = u_info.get('full_name', user.full_name)
                        user.is_staff = u_info.get('is_staff', user.is_staff)
                        user.save()
                        self.stdout.write(self.style.NOTICE(f"    Updated User: {email}"))

                    # Link Profile
                    profile, p_created = UserProfileModel.objects.get_or_create(user=user)
                    profile.company = company
                    profile.branch = branch
                    profile.save()
                    self.stdout.write(self.style.SUCCESS(f"    Linked Profile to {company.code}/{branch.code}"))

        self.stdout.write(self.style.SUCCESS("Dummy data seeding completed successfully!"))
