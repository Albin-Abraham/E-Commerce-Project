import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { useQuery } from "@tanstack/react-query";

export const fetchProductById = async (id: string): Promise<any> => {
  const res = await fetch(`https://dummyjson.com/products/${id}`);
  if (!res.ok) throw new Error("Failed to fetch product");
  return res.json();
};

const ProductDetailComponent: React.FC = () => {
  const { t } = useTranslation("screens/products");
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProductById(id!),
    enabled: !!id,
  });

  if (isLoading)
    return <div className="p-10 animate-pulse">{t("detail.loading")}</div>;
  if (error)
    return (
      <div className="p-10 text-red-500">{t("detail.error")}</div>
    );

  return (
    <div className="p-10 max-w-4xl mx-auto">
      <h1 className="text-4xl font-black mb-4">{data.title}</h1>
      <p className="text-xl text-muted-foreground mb-8">{data.description}</p>
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-sm inline-block">
        <span className="text-sm font-bold uppercase tracking-widest opacity-60 block mb-2">
          {t("detail.retailPrice")}
        </span>
        <span className="text-3xl font-black text-primary">${data.price}</span>
      </div>
    </div>
  );
};

export default ProductDetailComponent;
