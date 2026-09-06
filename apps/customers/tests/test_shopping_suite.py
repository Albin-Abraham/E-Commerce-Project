from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.customers.models.customer import Customer, CustomerAddress
from apps.customers.models.shopping import Cart, CartItem, Wishlist, WishlistItem, ProductLike
from apps.customers.services.cart_service import CustomerCartService
from apps.customers.services.wishlist_service import CustomerWishlistService
from apps.customers.services.recommendation_service import CustomerRecommendationService
from apps.customers.workflows.checkout_workflow import CustomerCheckoutService
from apps.shop.infrastructure.models.product import Product
from apps.shop.infrastructure.models.facility import Facility, FacilityInventory
from apps.shop.infrastructure.models.polymorphic import Review, ProductComment
from apps.shop.services.feedback_service import ProductFeedbackService
from apps.customers.services.registration_service import CustomerRegistrationService
from apps.customers.services.oauth_service import SocialOAuthAuthService
from core.base_models.system_models import SystemConfig
from core.admin.models.company import Company

User = get_user_model()


class CustomerShoppingSuiteTestCase(TestCase):
    """
    Automated Unit Test Suite for Customer Shopping Engine, Split Cart/Wishlist,
    Atomic Checkout, 0.5 Half-Star Reviews, GFK Threaded Comments, and Recommendations.
    """

    def setUp(self):
        SystemConfig.objects.create(key="GOOGLE_STORAGE_BUCKET_NAME", value="yafei-platform-avatars")
        SystemConfig.objects.create(key="GOOGLE_API_KEY", value="AIzaSyTestApiKey12345")
        self.company = Company.objects.create(name="Test Acme Corp", code="ACME")
        self.user = User.objects.create_user(username="testcustomer", email="cust@example.com", password="password123")
        self.customer = Customer.objects.create(
            customer_code="CUST-001",
            user=self.user,
            name="John Doe",
            company=self.company,
        )
        self.address = CustomerAddress.objects.create(
            customer=self.customer,
            title="Home",
            address_line_1="123 Main St",
            city="New York",
            postal_code="10001",
            pincode="10001",
        )

        self.facility = Facility.objects.create(
            company=self.company,
            facility_code="FC-NY-01",
            name="New York Fulfillment Center",
            serviceable_pincodes=["10001", "10002"],
        )

        self.product1 = Product.objects.create(
            company=self.company,
            sku="PROD-LAPTOP",
            name="High Performance Laptop",
            slug="high-performance-laptop",
            price=Decimal("1200.00"),
            is_active=True,
            status="ACTIVE",
        )

        self.product2 = Product.objects.create(
            company=self.company,
            sku="PROD-MOUSE",
            name="Wireless Ergonomic Mouse",
            slug="wireless-ergonomic-mouse",
            price=Decimal("50.00"),
            is_active=True,
            status="ACTIVE",
        )

        # Stock setup: Product 1 has 10 units in ATP; Product 2 has 0 units (Out of Stock)
        FacilityInventory.objects.create(
            facility=self.facility,
            product=self.product1,
            quantity_on_hand=10,
            quantity_reserved=0,
        )
        FacilityInventory.objects.create(
            facility=self.facility,
            product=self.product2,
            quantity_on_hand=0,
            quantity_reserved=0,
        )

    def test_cart_split_active_and_disabled_items(self):
        """
        Tests that out-of-stock items are automatically separated into disabled_items with OUT_OF_STOCK reason code.
        """
        # Add available product1 and out-of-stock product2
        item1 = CustomerCartService.add_item(self.customer.id, self.product1.id, quantity=1)
        item2 = CustomerCartService.add_item(self.customer.id, self.product2.id, quantity=1)

        breakdown = CustomerCartService.get_cart_breakdown(self.customer.id)

        self.assertEqual(breakdown["active_count"], 1)
        self.assertEqual(breakdown["disabled_count"], 1)
        self.assertEqual(breakdown["subtotal"], Decimal("1200.00"))
        self.assertEqual(breakdown["disabled_items"][0]["disable_reason"], "OUT_OF_STOCK")

    def test_wishlist_breakdown_and_move_to_cart(self):
        """
        Tests wishlist creation, availability resolution, and transferring items to active cart.
        """
        wish_item = CustomerWishlistService.add_to_wishlist(self.customer.id, self.product1.id)
        breakdown = CustomerWishlistService.get_wishlist_breakdown(self.customer.id)

        self.assertEqual(breakdown["available_count"], 1)
        self.assertEqual(breakdown["available_items"][0]["product_name"], "High Performance Laptop")

        # Move to cart
        cart_item = CustomerWishlistService.move_wishlist_item_to_cart(self.customer.id, wish_item.id, quantity=2)
        self.assertEqual(cart_item.quantity, 2)
        self.assertFalse(WishlistItem.objects.filter(pk=wish_item.id).exists())

    def test_checkout_workflow_number_series(self):
        """
        Tests atomic checkout workflow from Cart to SalesOrder and SalesInvoice with NumberSeries generation.
        """
        CustomerCartService.add_item(self.customer.id, self.product1.id, quantity=1)
        cart = Cart.objects.get(customer=self.customer, status="ACTIVE")

        sales_order, sales_invoice = CustomerCheckoutService.process_checkout(
            cart_id=cart.id,
            delivery_address_id=self.address.id,
        )

        cart.refresh_from_db()
        self.assertEqual(cart.status, "CHECKED_OUT")
        self.assertTrue(sales_order.order_number.startswith("SO-"))
        self.assertTrue(sales_invoice.invoice_number.startswith("INV-"))
        self.assertEqual(sales_invoice.grand_total, Decimal("1200.00"))

    def test_half_star_reviews_and_nested_comments(self):
        """
        Tests 0.5 half-star rating reviews, seller replies, and nested Q&A comments bound via GFK polymorphism.
        """
        # Post a 4.5 star review
        review = ProductFeedbackService.add_review(
            customer_user=self.user,
            target_entity_or_id=self.product1,
            rating=Decimal("4.5"),
            title="Great purchase",
            comment="Really satisfied!",
        )
        self.assertEqual(review.rating, Decimal("4.5"))

        # Post seller reply to review
        ProductFeedbackService.add_seller_reply_to_review(review.id, "Thank you for your review!")
        review.refresh_from_db()
        self.assertEqual(review.seller_reply, "Thank you for your review!")

        # Post Q&A comment and seller answer reply
        q_comment = ProductFeedbackService.add_comment(
            author_user=self.user,
            target_entity_or_id=self.product1,
            content="Is RAM upgradeable?",
        )
        a_comment = ProductFeedbackService.add_comment(
            author_user=self.user,
            target_entity_or_id=self.product1,
            content="Yes, supports up to 64GB DDR5.",
            parent_comment_id=q_comment.id,
            is_seller_reply=True,
        )

        summary = ProductFeedbackService.get_product_feedback_summary(self.product1)
        self.assertEqual(summary["average_rating"], 4.5)
        self.assertEqual(summary["total_reviews_count"], 1)
        self.assertEqual(summary["star_breakdown"]["4.5"], 1)
        self.assertEqual(len(summary["comment_threads"]), 1)
        self.assertEqual(summary["comment_threads"][0]["replies"][0]["content"], "Yes, supports up to 64GB DDR5.")

    def test_recommendation_service(self):
        """
        Tests personalized product suggestions and toggle product likes.
        """
        CustomerWishlistService.toggle_product_like(self.customer.id, self.product1.id)
        self.assertEqual(CustomerWishlistService.get_product_like_count(self.product1.id), 1)

        suggestions = CustomerRecommendationService.get_suggested_products_for_customer(self.customer.id, limit=5)
        self.assertTrue(len(suggestions) > 0)

    def test_customer_self_registration(self):
        """
        Tests self-registration for retail individual and commercial business customers.
        """
        user, customer = CustomerRegistrationService.register_customer(
            username="jane_smith",
            email="jane@example.com",
            password="securepassword123",
            full_name="Jane Smith",
            customer_type="INDIVIDUAL",
            phone="+1234567890",
            address_data={
                "address_line_1": "456 Park Ave",
                "city": "New York",
                "postal_code": "10022",
            },
        )
        self.assertEqual(user.username, "jane_smith")
        self.assertEqual(customer.name, "Jane Smith")
        self.assertTrue(customer.customer_code.startswith("CUST-"))
        self.assertEqual(customer.address_lines.count(), 1)
        self.assertTrue(hasattr(customer, "preferences"))

    def test_social_oauth_authentication(self):
        """
        Tests Social OAuth sign-in and auto-account creation with Google / GitHub / Apple.
        """
        user, customer, social_acc, created = SocialOAuthAuthService.authenticate_or_register_social_user(
            provider="GOOGLE",
            provider_uid="google_uid_98765",
            email="google_user@example.com",
            full_name="Google Social User",
            avatar_url="https://lh3.googleusercontent.com/photo.jpg",
        )

        self.assertTrue(created)
        self.assertEqual(social_acc.provider, "GOOGLE")
        self.assertEqual(social_acc.uid, "google_uid_98765")
        self.assertEqual(customer.name, "Google Social User")

        # Second login should match existing social account
        user2, customer2, social_acc2, created2 = SocialOAuthAuthService.authenticate_or_register_social_user(
            provider="GOOGLE",
            provider_uid="google_uid_98765",
            email="google_user@example.com",
            full_name="Google Social User",
        )

        self.assertFalse(created2)
        self.assertEqual(user.id, user2.id)
        self.assertEqual(social_acc.id, social_acc2.id)
