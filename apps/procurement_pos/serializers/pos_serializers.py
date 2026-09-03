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


class POSTransactionSerializer(BaseModelSerializer):
    items = POSTransactionItemSerializer(many=True, read_only=True)

    class Meta:
        model = POSTransaction
        fields = [
            "id", "session", "transaction_number", "customer",
            "payment_method", "total_amount", "tax_amount", "discount_amount",
            "status", "items", "created_at",
        ]
        read_only_fields = ["id", "created_at"]
