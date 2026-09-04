# Generated initial squashed migration for apps.customers

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models
import core.base_models.fields.short_ui_fields
import core.base_models.fields.char_fields


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('core_admin', '0001_initial'),
        ('shop', '0002_brand_remove_category_description_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]


    operations = [
        migrations.CreateModel(
            name='Customer',
            fields=[
                ('created_at', models.DateTimeField(db_index=True, editable=False)),
                ('updated_at', models.DateTimeField(db_index=True, editable=False)),
                ('version', models.IntegerField(default=1)),
                ('id', core.base_models.fields.short_ui_fields.CustomShortUUIDField(editable=False, max_length=37, prefix='cust_', primary_key=True, serialize=False)),
                ('customer_code', core.base_models.fields.char_fields.CustomCharField(max_length=50, unique=True)),
                ('name', core.base_models.fields.char_fields.CustomCharField(max_length=200)),
                ('customer_type', models.CharField(choices=[('INDIVIDUAL', 'Retail Individual Buyer'), ('COMMERCIAL', 'Commercial Business Buyer'), ('WHOLESALE', 'Wholesale Bulk Buyer')], default='INDIVIDUAL', max_length=30)),
                ('email', core.base_models.fields.char_fields.CustomEmailField(blank=True, max_length=254, null=True)),
                ('phone', models.CharField(blank=True, max_length=30, null=True)),
                ('tax_id', models.CharField(blank=True, max_length=50, null=True)),
                ('credit_limit', models.DecimalField(decimal_places=2, default=0.0, max_digits=12)),
                ('is_active', models.BooleanField(default=True)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('company', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='%(class)s_related', to='core_admin.company')),
                ('user', models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='customer_account', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Customer',
                'verbose_name_plural': 'Customers',
                'db_table': 'customers_customer',
                'ordering': ['-created_at'],
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='CustomerAddress',
            fields=[
                ('created_at', models.DateTimeField(db_index=True, editable=False)),
                ('updated_at', models.DateTimeField(db_index=True, editable=False)),
                ('version', models.IntegerField(default=1)),
                ('id', core.base_models.fields.short_ui_fields.CustomShortUUIDField(editable=False, max_length=37, prefix='caddr_', primary_key=True, serialize=False)),
                ('title', models.CharField(default='Default Address', max_length=100)),
                ('address_type', models.CharField(choices=[('DELIVERY', 'Delivery / Shipping Address'), ('BILLING', 'Billing Address'), ('BOTH', 'Delivery & Billing Address')], default='DELIVERY', max_length=30)),
                ('attention_to', models.CharField(blank=True, max_length=100, null=True)),
                ('address_line_1', models.CharField(max_length=255)),
                ('address_line_2', models.CharField(blank=True, max_length=255, null=True)),
                ('city', models.CharField(max_length=100)),
                ('state', models.CharField(blank=True, max_length=100, null=True)),
                ('postal_code', models.CharField(max_length=20)),
                ('country', models.CharField(default='USA', max_length=100)),
                ('pincode', models.CharField(db_index=True, max_length=20)),
                ('latitude', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ('longitude', models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ('is_default_delivery', models.BooleanField(default=False)),
                ('is_default_billing', models.BooleanField(default=False)),
                ('customer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='address_lines', to='customers.customer')),
            ],
            options={
                'verbose_name': 'Customer Address',
                'verbose_name_plural': 'Customer Addresses',
                'db_table': 'customers_address',
                'ordering': ['-is_default_delivery', '-created_at'],
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='CustomerContact',
            fields=[
                ('created_at', models.DateTimeField(db_index=True, editable=False)),
                ('updated_at', models.DateTimeField(db_index=True, editable=False)),
                ('version', models.IntegerField(default=1)),
                ('id', core.base_models.fields.short_ui_fields.CustomShortUUIDField(editable=False, max_length=37, prefix='ccon_', primary_key=True, serialize=False)),
                ('contact_name', models.CharField(max_length=150)),
                ('designation', models.CharField(blank=True, max_length=100, null=True)),
                ('contact_type', models.CharField(choices=[('PRIMARY', 'Primary Point of Contact'), ('BILLING', 'Accounts / Finance Contact'), ('SHIPPING', 'Logistics / Warehouse Contact'), ('MANAGEMENT', 'Executive / Procurement Manager')], default='PRIMARY', max_length=30)),
                ('email', core.base_models.fields.char_fields.CustomEmailField(blank=True, max_length=254, null=True)),
                ('phone', models.CharField(blank=True, max_length=30, null=True)),
                ('mobile', models.CharField(blank=True, max_length=30, null=True)),
                ('is_primary', models.BooleanField(default=False)),
                ('customer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='contact_lines', to='customers.customer')),
            ],
            options={
                'verbose_name': 'Customer Contact',
                'verbose_name_plural': 'Customer Contacts',
                'db_table': 'customers_contact',
                'ordering': ['-is_primary', 'contact_name'],
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='CustomerPreference',
            fields=[
                ('created_at', models.DateTimeField(db_index=True, editable=False)),
                ('updated_at', models.DateTimeField(db_index=True, editable=False)),
                ('version', models.IntegerField(default=1)),
                ('id', core.base_models.fields.short_ui_fields.CustomShortUUIDField(editable=False, max_length=37, prefix='cpref_', primary_key=True, serialize=False)),
                ('preferred_language', models.CharField(default='en', max_length=10)),
                ('preferred_currency', models.CharField(default='USD', max_length=10)),
                ('newsletter_opt_in', models.BooleanField(default=True)),
                ('sms_notifications', models.BooleanField(default=True)),
                ('email_notifications', models.BooleanField(default=True)),
                ('whatsapp_notifications', models.BooleanField(default=False)),
                ('default_payment_method', models.CharField(default='CARD', max_length=50)),
                ('custom_settings', models.JSONField(blank=True, default=dict)),
                ('customer', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='preferences', to='customers.customer')),
            ],
            options={
                'verbose_name': 'Customer Preference',
                'verbose_name_plural': 'Customer Preferences',
                'db_table': 'customers_preference',
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='SocialAccount',
            fields=[
                ('created_at', models.DateTimeField(db_index=True, editable=False)),
                ('updated_at', models.DateTimeField(db_index=True, editable=False)),
                ('version', models.IntegerField(default=1)),
                ('id', core.base_models.fields.short_ui_fields.CustomShortUUIDField(editable=False, max_length=37, prefix='soc_', primary_key=True, serialize=False)),
                ('provider', models.CharField(max_length=30)),
                ('uid', models.CharField(max_length=255)),
                ('avatar_url', models.URLField(blank=True, max_length=500, null=True)),
                ('extra_data', models.JSONField(blank=True, default=dict)),
                ('last_login_at', models.DateTimeField(blank=True, null=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='social_accounts', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Social Account',
                'verbose_name_plural': 'Social Accounts',
                'db_table': 'customer_social_accounts',
                'ordering': ['-created_at'],
                'unique_together': {('provider', 'uid')},
            },
        ),
        migrations.CreateModel(
            name='Cart',
            fields=[
                ('created_at', models.DateTimeField(db_index=True, editable=False)),
                ('updated_at', models.DateTimeField(db_index=True, editable=False)),
                ('version', models.IntegerField(default=1)),
                ('id', core.base_models.fields.short_ui_fields.CustomShortUUIDField(editable=False, max_length=37, prefix='cart_', primary_key=True, serialize=False)),
                ('status', models.CharField(choices=[('ACTIVE', 'Active Cart Session'), ('ABANDONED', 'Abandoned Cart'), ('CHECKED_OUT', 'Successfully Checked Out'), ('MERGED', 'Merged into Another Session')], default='ACTIVE', max_length=20)),
                ('currency', models.CharField(default='USD', max_length=10)),
                ('total_amount', models.DecimalField(decimal_places=2, default=0.0, max_digits=12)),
                ('customer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='carts', to='customers.customer')),
            ],
            options={
                'verbose_name': 'Shopping Cart',
                'verbose_name_plural': 'Shopping Carts',
                'db_table': 'customers_cart',
                'ordering': ['-created_at'],
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Wishlist',
            fields=[
                ('created_at', models.DateTimeField(db_index=True, editable=False)),
                ('updated_at', models.DateTimeField(db_index=True, editable=False)),
                ('version', models.IntegerField(default=1)),
                ('id', core.base_models.fields.short_ui_fields.CustomShortUUIDField(editable=False, max_length=37, prefix='wish_', primary_key=True, serialize=False)),
                ('name', models.CharField(default='My Favorites', max_length=100)),
                ('is_public', models.BooleanField(default=False)),
                ('customer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='wishlists', to='customers.customer')),
            ],
            options={
                'verbose_name': 'Customer Wishlist',
                'verbose_name_plural': 'Customer Wishlists',
                'db_table': 'customers_wishlist',
                'ordering': ['-created_at'],
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='CartItem',
            fields=[
                ('created_at', models.DateTimeField(db_index=True, editable=False)),
                ('updated_at', models.DateTimeField(db_index=True, editable=False)),
                ('version', models.IntegerField(default=1)),
                ('id', core.base_models.fields.short_ui_fields.CustomShortUUIDField(editable=False, max_length=37, prefix='ci_', primary_key=True, serialize=False)),
                ('quantity', models.PositiveIntegerField(default=1)),
                ('unit_price', models.DecimalField(decimal_places=2, max_digits=12)),
                ('total_price', models.DecimalField(decimal_places=2, max_digits=12)),
                ('is_disabled', models.BooleanField(default=False)),
                ('disable_reason', models.CharField(blank=True, choices=[('OUT_OF_STOCK', 'Item is currently out of stock'), ('SELLER_INACTIVE', 'Seller is not currently offering this product'), ('PRICE_CHANGED', 'Product price has changed'), ('UNSERVICEABLE', 'Location unserviceable by seller')], max_length=50, null=True)),
                ('cart', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='customers.cart')),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='cart_occurrences', to='shop.product')),
                ('variant', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='cart_occurrences', to='shop.productvariant')),
            ],
            options={
                'verbose_name': 'Cart Item',
                'verbose_name_plural': 'Cart Items',
                'db_table': 'customers_cart_item',
                'unique_together': {('cart', 'product', 'variant')},
            },
        ),
        migrations.CreateModel(
            name='WishlistItem',
            fields=[
                ('created_at', models.DateTimeField(db_index=True, editable=False)),
                ('updated_at', models.DateTimeField(db_index=True, editable=False)),
                ('version', models.IntegerField(default=1)),
                ('id', core.base_models.fields.short_ui_fields.CustomShortUUIDField(editable=False, max_length=37, prefix='wi_', primary_key=True, serialize=False)),
                ('notes', models.TextField(blank=True, null=True)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='wishlist_occurrences', to='shop.product')),
                ('variant', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='wishlist_occurrences', to='shop.productvariant')),
                ('wishlist', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='customers.wishlist')),
            ],
            options={
                'verbose_name': 'Wishlist Item',
                'verbose_name_plural': 'Wishlist Items',
                'db_table': 'customers_wishlist_item',
                'unique_together': {('wishlist', 'product', 'variant')},
            },
        ),
        migrations.CreateModel(
            name='ProductLike',
            fields=[
                ('created_at', models.DateTimeField(db_index=True, editable=False)),
                ('updated_at', models.DateTimeField(db_index=True, editable=False)),
                ('version', models.IntegerField(default=1)),
                ('id', core.base_models.fields.short_ui_fields.CustomShortUUIDField(editable=False, max_length=37, prefix='plike_', primary_key=True, serialize=False)),
                ('customer', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='liked_products', to='customers.customer')),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='likes', to='shop.product')),
            ],
            options={
                'verbose_name': 'Product Like',
                'verbose_name_plural': 'Product Likes',
                'db_table': 'customers_product_like',
                'unique_together': {('customer', 'product')},
            },
        ),
    ]
