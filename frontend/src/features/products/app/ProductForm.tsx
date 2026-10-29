import React from "react";

import { Form } from "@ui/form/Form";
import { FormAutoGenerator } from "@ui/form/utils/FormAutoGenerator";

import { type Product } from "@features/products/services/product.repository";

/**
 * ProductForm - A Schema-Driven Feature Component
 *
 * Demonstrates the "Perfect 10.0" architecture where the UI is derived
 * directly from domain metadata.
 */
export const ProductForm: React.FC<{
  initialData?: Partial<Product>;
  onSubmit?: (data: Product) => void;
}> = ({ initialData, onSubmit }) => {
  // 1. Define Domain Metadata (The Single Source of Truth)
  const productSchema = FormAutoGenerator.generate<Product>({
    id: "product_feature_form",
    title: "Product Management",
    description:
      "Update product details and inventory levels with atomic validation.",
    groups: {
      identity: { title: "Basic Information", columns: 12 },
      pricing: { title: "Pricing & Stock", columns: 2 },
      classification: { title: "Classification", columns: 2 },
    },
    fields: {
      title: {
        group: "identity",
        required: true,
        placeholder: "e.g. iPhone 15 Pro",
        gridCols: 8,
      },
      brand: {
        group: "identity",
        gridCols: 4,
        placeholder: "e.g. Apple",
      },
      description: {
        group: "identity",
        type: "textarea",
        gridCols: 12,
        placeholder: "Provide a detailed product description...",
      },
      price: {
        group: "pricing",
        type: "number",
        required: true,
        defaultValue: 0,
      },
      discountPercentage: {
        group: "pricing",
        type: "number",
        label: "Discount (%)",
      },
      stock: {
        group: "pricing",
        type: "number",
        label: "Inventory Level",
      },
      category: {
        group: "classification",
        type: "select",
        options: [
          { label: "Smartphones", value: "smartphones" },
          { label: "Laptops", value: "laptops" },
          { label: "Fragrances", value: "fragrances" },
          { label: "Skincare", value: "skincare" },
        ],
      },
      rating: {
        group: "classification",
        type: "number",
        disabled: true, // Rating is typically read-only
      },
    },
  });

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="app-card overflow-hidden shadow-2xl border-none">
        <Form<Product>
          definition={productSchema}
          initialData={initialData}
          onSubmit={async (data) => {
            // Submit to repository
            onSubmit?.(data as Product);
          }}
          debug={true} // Enabled for architectural demonstration
        />
      </div>
    </div>
  );
};
