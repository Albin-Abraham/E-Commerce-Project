from rest_framework import serializers
from core.base_serializers.base_serializers import BaseModelSerializer
from apps.procurement_pos.models.procurement import Supplier, PurchaseOrder, PurchaseOrderItem, GoodsReceivedNote


class SupplierSerializer(BaseModelSerializer):
    class Meta:
        model = Supplier
        fields = ["id", "name", "code", "contact_person", "email", "phone", "address", "tax_id", "is_active", "metadata", "created_at"]
        read_only_fields = ["id", "created_at"]


class PurchaseOrderItemSerializer(BaseModelSerializer):
    variant_sku = serializers.CharField(source="variant.sku", read_only=True)

    class Meta:
        model = PurchaseOrderItem
        fields = ["id", "purchase_order", "variant", "variant_sku", "quantity_ordered", "quantity_received", "unit_cost", "total_cost"]
        read_only_fields = ["id", "total_cost"]


class PurchaseOrderSerializer(BaseModelSerializer):
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    items = PurchaseOrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = ["id", "po_number", "supplier", "supplier_name", "status", "total_amount", "expected_delivery_date", "created_by", "items", "created_at"]
        read_only_fields = ["id", "created_at"]


class GoodsReceivedNoteSerializer(BaseModelSerializer):
    po_number = serializers.CharField(source="purchase_order.po_number", read_only=True)
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)

    class Meta:
        model = GoodsReceivedNote
        fields = ["id", "grn_number", "purchase_order", "po_number", "warehouse", "warehouse_name", "received_by", "status", "received_at", "created_at"]
        read_only_fields = ["id", "created_at"]
