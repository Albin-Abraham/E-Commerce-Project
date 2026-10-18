from rest_framework import serializers
from core.base_serializers.base_serializers import BaseModelSerializer
from apps.procurement_pos.models.pos import POSRegister, POSSession, POSTransaction, POSTransactionItem


class POSRegisterSerializer(BaseModelSerializer):
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)

    class Meta:
        model = POSRegister
        fields = ["id", "name", "code", "warehouse", "warehouse_name", "branch", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]


class POSSessionSerializer(BaseModelSerializer):
    cashier_username = serializers.CharField(source="cashier.username", read_only=True)
    register_name = serializers.CharField(source="register.name", read_only=True)

    class Meta:
        model = POSSession
        fields = [
            "id", "register", "register_name", "cashier", "cashier_username",
            "opened_at", "closed_at", "opening_balance", "closing_balance",
            "total_sales", "status", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class POSTransactionItemSerializer(BaseModelSerializer):
    variant_sku = serializers.CharField(source="variant.sku", read_only=True)

    class Meta:
        model = POSTransactionItem
        fields = ["id", "transaction", "variant", "variant_sku", "quantity", "unit_price", "discount", "total_price"]
        read_only_fields = ["id", "total_price"]


class POSTransactionItemInputSerializer(serializers.Serializer):
    variant_id = serializers.CharField(required=True)
    quantity = serializers.IntegerField(min_value=1, default=1)
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    discount = serializers.DecimalField(max_digits=12, decimal_places=2, default=0.0)


class POSTransactionSerializer(BaseModelSerializer):
    items = POSTransactionItemSerializer(many=True, read_only=True)
    cart_items = POSTransactionItemInputSerializer(many=True, write_only=True, required=False)
    idempotency_key = serializers.CharField(max_length=120, required=False, allow_null=True, allow_blank=True)
    payment_status = serializers.CharField(max_length=30, required=False, default="PAID")

    class Meta:
        model = POSTransaction
        fields = [
            "id", "session", "transaction_number", "customer",
            "payment_method", "total_amount", "tax_amount", "discount_amount",
            "status", "payment_status", "idempotency_key", "items", "cart_items", "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        cart_items = (
            validated_data.pop("cart_items", None)
            or self.initial_data.get("items", [])
            or self.initial_data.get("cart_items", [])
        )
        if cart_items:
            from apps.procurement_pos.workflows.pos_checkout_workflow import POSCheckoutWorkflow
            request = self.context.get("request")
            user = request.user if request else None
            return POSCheckoutWorkflow.process_checkout(
                session=validated_data["session"],
                customer=validated_data.get("customer"),
                payment_method=validated_data.get("payment_method", "CASH"),
                items_data=cart_items,
                idempotency_key=validated_data.get("idempotency_key"),
                discount_amount=validated_data.get("discount_amount", 0.0),
                tax_amount=validated_data.get("tax_amount"),
                user=user,
            )
        return super().create(validated_data)
