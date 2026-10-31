import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ShoppingBag, ArrowLeft, PackageCheck } from "lucide-react";
import { orderRepository, GetCustomerOrdersQuery } from "@features/orders";
import { OrderCard } from "@features/orders/presentation/OrderCard";

const getOrdersQuery = new GetCustomerOrdersQuery(orderRepository);

export const CustomerOrdersPage: React.FC = () => {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["customer", "orders"],
    queryFn: () => getOrdersQuery.execute(),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-1">
            Order Management & Fulfillment
          </span>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Order History & Live Tracking
          </h1>
          <p className="text-sm text-muted mt-1">
            Review past purchases, download commercial invoices, and monitor carrier dispatch milestones in real time.
          </p>
        </div>

        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-muted border border-border text-xs font-bold text-foreground hover:bg-surface-muted/80 self-start sm:self-auto"
        >
          <ShoppingBag className="w-4 h-4 text-primary" />
          <span>Continue Shopping</span>
        </Link>
      </div>

      {/* Orders List Area */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-surface-muted" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-surface border border-dashed border-border rounded-2xl text-center space-y-3">
          <PackageCheck className="w-12 h-12 text-muted" />
          <h3 className="text-base font-bold text-foreground">No Orders Placed Yet</h3>
          <p className="text-sm text-muted max-w-sm">
            When you purchase enterprise hardware or retail products, your dispatch timelines will appear here.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 mt-2"
          >
            <span>Explore Catalog</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerOrdersPage;
