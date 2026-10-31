import glob
import os

import yaml
from django.conf import settings
from django.core.management.base import BaseCommand

from core.base_models.system_models import SystemConfig, SystemFeature, SystemModule


class Command(BaseCommand):
    help = "Seeds system data from YAML configuration files."

    def add_arguments(self, parser):
        parser.add_argument(
            "--section",
            type=str,
            help="Section to seed: modules, system_config, superadmin, master_data, or subdomain filter",
            required=False,
            default=None,
        )
        parser.add_argument(
            "--domain",
            type=str,
            help="Domain to seed (e.g. ecommerce)",
            required=False,
            default=None,
        )
        parser.add_argument(
            "--module",
            type=str,
            help="Specific module within domain to seed (e.g. products, stock)",
            required=False,
            default=None,
        )
        parser.add_argument(
            "--scope",
            type=str,
            choices=["global", "tenant"],
            default="global",
            help="Target scope for seed data: global or tenant",
        )
        parser.add_argument(
            "--company",
            type=str,
            help="Company code or ID for tenant-scoped execution",
            required=False,
            default=None,
        )
        parser.add_argument(
            "--validate-only",
            action="store_true",
            help="Validate configuration files and DAG dependencies without writing to the database",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simulate execution in a transaction and rollback at the end",
        )

    def handle(self, *args, **options):
        setattr(settings, "BYPASS_VALIDATION_GUARD", True)
        domain = options.get("domain")
        section = options.get("section")

        # 1. New Modular Domain-Based Engine
        if domain:
            self.handle_domain_seed(domain, options)
            return

        # 2. Legacy Section-Based Seed Handling
        if not section:
            self.stderr.write(
                self.style.ERROR(
                    "Either --domain (e.g. ecommerce) or --section (e.g. modules, superadmin) must be provided."
                )
            )
            return

        config_dir = os.path.join(settings.BASE_DIR, "core", "base_models", "configs")

        if section in ["modules", "Set-Module"]:
            self.seed_modules(config_dir)
        elif section in ["system_config", "Set-Config"]:
            self.seed_system_config(config_dir)
        elif section in ["superadmin", "Set-Admin"]:
            self.seed_superadmin(config_dir)
        elif section in ["master_data", "Set-MasterData", "shop_master_data"]:
            self.seed_master_data(config_dir)
        else:
            self.stderr.write(self.style.ERROR(f"Unknown section: {section}"))

    def handle_domain_seed(self, domain: str, options: dict) -> None:
        # Import domain registry and runners
        import core.base_models.seed_data.domains.ecommerce  # noqa: F401
        from core.admin.models.company import Company
        from core.base_models.seed_data.engine import SeedContext, SeedDomainRegistry

        company_obj = None
        scope = options.get("scope", "global")
        company_arg = options.get("company")

        if scope == "tenant":
            if company_arg:
                company_obj = (
                    Company.objects.filter(code=company_arg).first()
                    or Company.objects.filter(id=company_arg).first()
                )
                if not company_obj:
                    self.stderr.write(
                        self.style.WARNING(
                            f"Company '{company_arg}' not found. Falling back to default system company."
                        )
                    )
            if not company_obj:
                company_obj = (
                    Company.objects.filter(code="sys-001").first() or Company.objects.first()
                )

        context = SeedContext(
            scope=scope,
            company=company_obj,
            dry_run=options.get("dry_run", False),
            validate_only=options.get("validate_only", False),
            stdout=self.stdout,
            stderr=self.stderr,
        )

        target_sections = [options["section"]] if options.get("section") else None
        target_modules = [options["module"]] if options.get("module") else None

        try:
            runner = SeedDomainRegistry.get_runner(domain)
            runner.run(
                context,
                target_sections=target_sections,
                target_modules=target_modules,
            )
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Error executing domain '{domain}' seed: {str(e)}"))
            raise

    def seed_modules(self, config_dir):
        # Support both a monolithic file and sharded files in the 'modules' subdirectory
        sharded_path = os.path.join(config_dir, "modules", "*.yaml")
        monolithic_path = os.path.join(config_dir, "module_config.yaml")

        yaml_files = glob.glob(sharded_path)
        if os.path.exists(monolithic_path):
            yaml_files.append(monolithic_path)

        if not yaml_files:
            self.stderr.write(
                self.style.WARNING(f"No module configuration files found in {config_dir}")
            )
            return

        for file_path in yaml_files:
            self.stdout.write(
                self.style.NOTICE(f"Processing module config: {os.path.basename(file_path)}")
            )
            with open(file_path) as f:
                data = yaml.safe_load(f)

            if not data:
                continue

            modules_data = data.get("modules", {})
            for module_name, m_info in modules_data.items():
                code = m_info.get("code")
                if not code:
                    continue

                module, created = SystemModule.objects.update_or_create(
                    code=code,
                    defaults={
                        "name": module_name,
                        "is_active": m_info.get("is_active", True),
                        "icon": m_info.get("icon"),
                        "color": m_info.get("color"),
                        "description": m_info.get("description"),
                    },
                )

                status = "Created" if created else "Updated"
                self.stdout.write(self.style.SUCCESS(f"{status} Module: {module_name} ({code})"))

                # Seed features
                features = m_info.get("features", [])
                for f_info in features:
                    f_code = f_info.get("code")
                    if not f_code:
                        continue

                    SystemFeature.objects.update_or_create(
                        code=f_code,
                        module=module,
                        defaults={
                            "name": f_info.get("description", f_code),
                            "model_name": str(f_info.get("model", "")),
                            "is_enabled": f_info.get("enable", True),
                            "description": f_info.get("description"),
                            "special_permissions": f_info.get("special", []),
                        },
                    )

    def seed_system_config(self, config_dir):
        file_path = os.path.join(config_dir, "system_config.yaml")
        if not os.path.exists(file_path):
            self.stderr.write(self.style.ERROR(f"File not found: {file_path}"))
            return

        with open(file_path) as f:
            data = yaml.safe_load(f)

        configs = data.get("system_conf_key", [])
        for c_info in configs:
            key = c_info.get("key")
            if not key:
                continue

            config, created = SystemConfig.objects.update_or_create(
                key=key,
                defaults={
                    "value": str(c_info.get("value", "")),
                    "description": c_info.get("description"),
                },
            )
            status = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(f"{status} SystemConfig: {key}"))

    def seed_superadmin(self, config_dir):
        from apps.users.models.users import UserModel, UserProfileModel
        from core.admin.constants import SYSTEM_COMPANY
        from core.admin.models.branch import Branch
        from core.admin.models.company import Company

        file_path = os.path.join(config_dir, "superadmin.yaml")
        if not os.path.exists(file_path):
            self.stderr.write(
                self.style.WARNING(f"Superadmin config not found at {file_path}. Skipping.")
            )
            return

        with open(file_path) as f:
            data = yaml.safe_load(f)

        admins = data.get("superadmins", [])
        for a_info in admins:
            email = a_info.get("email")
            username = a_info.get("username")
            password = a_info.get("password")

            if not email or not username:
                continue

            user = UserModel.objects.filter(email=email).first()
            if not user:
                user = UserModel.objects.create_superuser(
                    email=email,
                    username=username,
                    password=password,
                    full_name=a_info.get("full_name", "System Admin"),
                )
                self.stdout.write(self.style.SUCCESS(f"Created Superuser: {email}"))
            else:
                user.username = username
                if password:
                    user.set_password(password)
                user.full_name = a_info.get("full_name", user.full_name)
                user.is_superuser = True
                user.is_staff = True
                user.save()
                self.stdout.write(self.style.NOTICE(f"Updated Superuser: {email}"))

            # Ensure linkage with System Company, Business Unit and All Branch
            try:
                import datetime

                from core.admin.models.business_unit import BusinessUnit

                system_company, _ = Company.objects.get_or_create(
                    name=SYSTEM_COMPANY,
                    defaults={"email": "system@zenith.local", "code": "sys-001"},
                )

                all_bu, _ = BusinessUnit.objects.get_or_create(
                    code="bu-all",
                    company=system_company,
                    defaults={"name": "All Business", "is_all_bu": True},
                )

                all_branch, _ = Branch.objects.get_or_create(
                    code="br-all",
                    company=system_company,
                    business_unit=all_bu,
                    defaults={
                        "name": "All Branch",
                        "location": "System Hub",
                        "opened_date": datetime.date.today(),
                        "is_all_branch": True,
                    },
                )

                profile, p_created = UserProfileModel.objects.get_or_create(
                    user=user,
                    defaults={
                        "company": system_company,
                        "business_unit": all_bu,
                        "branch": all_branch,
                    },
                )

                if not p_created:
                    profile.company = system_company
                    profile.business_unit = all_bu
                    profile.branch = all_branch
                    profile.save()

                self.stdout.write(self.style.SUCCESS(f"Verified System Linkage for {email}"))
            except Exception as e:
                self.stderr.write(
                    self.style.ERROR(f"Critical Error creating System Company/Branch: {str(e)}")
                )

    def seed_master_data(self, config_dir):
        file_path = os.path.join(config_dir, "master_data.yaml")
        if not os.path.exists(file_path):
            self.stderr.write(self.style.ERROR(f"Master data config not found at {file_path}"))
            return

        with open(file_path) as f:
            data = yaml.safe_load(f)

        if not data:
            self.stderr.write(self.style.WARNING("Master data file is empty."))
            return

        from apps.shop.infrastructure.models.brand import Brand
        from apps.shop.infrastructure.models.category import Category, CategoryEdge
        from apps.shop.infrastructure.models.product import Product
        from apps.shop.infrastructure.models.variant import ProductVariant

        # 1. Seed Brands
        brands_data = data.get("brands", [])
        for b_info in brands_data:
            name = b_info.get("name")
            slug = b_info.get("slug")
            if not name or not slug:
                continue

            brand, created = Brand.objects.update_or_create(
                slug=slug,
                defaults={
                    "name": name,
                    "description": b_info.get("description", ""),
                    "website": b_info.get("website"),
                    "is_active": b_info.get("is_active", True),
                    "metadata": b_info.get("metadata", {}),
                },
            )
            status = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(f"{status} Brand: {name} ({slug})"))

        # 2. Seed Categories
        categories_data = data.get("categories", [])
        sorted_categories = sorted(categories_data, key=lambda c: 0 if not c.get("parent") else 1)

        for c_info in sorted_categories:
            name = c_info.get("name")
            slug = c_info.get("slug")
            if not name or not slug:
                continue

            parent_cat = None
            parent_slug = c_info.get("parent")
            if parent_slug:
                parent_cat = Category.objects.filter(slug=parent_slug).first()

            category, created = Category.objects.update_or_create(
                slug=slug,
                defaults={
                    "name": name,
                    "parent": parent_cat,
                    "is_active": c_info.get("is_active", True),
                    "metadata": c_info.get("metadata", {}),
                },
            )
            status = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(f"{status} Category: {name} ({slug})"))

        # 3. Seed Category Edges
        edges_data = data.get("category_edges", [])
        for e_info in edges_data:
            from_slug = e_info.get("from_category")
            to_slug = e_info.get("to_category")
            rel_type = e_info.get("relation_type", "belongs_to")

            from_cat = Category.objects.filter(slug=from_slug).first() if from_slug else None
            to_cat = Category.objects.filter(slug=to_slug).first() if to_slug else None

            if from_cat and to_cat:
                edge, created = CategoryEdge.objects.update_or_create(
                    from_category=from_cat,
                    to_category=to_cat,
                    relation_type=rel_type,
                    defaults={
                        "weight": e_info.get("weight", 1.0),
                        "metadata": e_info.get("metadata", {}),
                    },
                )
                status = "Created" if created else "Updated"
                self.stdout.write(
                    self.style.SUCCESS(
                        f"{status} CategoryEdge: {from_cat.name} -> {to_cat.name} ({rel_type})"
                    )
                )

        # 4. Seed Products and Variants
        products_data = data.get("products", [])
        for p_info in products_data:
            sku = p_info.get("sku")
            name = p_info.get("name")
            slug = p_info.get("slug")
            if not sku or not name or not slug:
                continue

            brand_obj = None
            brand_slug = p_info.get("brand")
            if brand_slug:
                brand_obj = Brand.objects.filter(slug=brand_slug).first()

            cat_obj = None
            cat_slug = p_info.get("category")
            if cat_slug:
                cat_obj = Category.objects.filter(slug=cat_slug).first()

            product, created = Product.objects.update_or_create(
                sku=sku,
                defaults={
                    "name": name,
                    "slug": slug,
                    "brand": brand_obj,
                    "category": cat_obj,
                    "price": p_info.get("price", 0.0),
                    "status": p_info.get("status", "ACTIVE"),
                    "is_active": p_info.get("is_active", True),
                    "metadata": p_info.get("metadata", {}),
                    "extensions": p_info.get("extensions", {}),
                },
            )
            status = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(f"{status} Product: {name} ({sku})"))

            # Seed Variants for this product
            variants_data = p_info.get("variants", [])
            for v_info in variants_data:
                v_sku = v_info.get("sku")
                if not v_sku:
                    continue

                variant, v_created = ProductVariant.objects.update_or_create(
                    sku=v_sku,
                    defaults={
                        "product": product,
                        "price": v_info.get("price", product.price),
                        "compare_at_price": v_info.get("compare_at_price"),
                        "barcode": v_info.get("barcode"),
                        "status": v_info.get("status", "ACTIVE"),
                        "attributes": v_info.get("attributes", {}),
                        "is_active": v_info.get("is_active", True),
                    },
                )
                v_status = "Created" if v_created else "Updated"
                self.stdout.write(self.style.SUCCESS(f"  {v_status} Variant: {v_sku}"))
