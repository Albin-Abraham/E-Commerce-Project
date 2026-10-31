/**
 * Customer Presentation: Customer Profile Card
 *
 * Utilizes the core DetailRenderer.Grid for declarative, accessible
 * key-value telemetry without reinventing ad-hoc cards or styles.
 */

import React from "react";
import { Mail, Phone, Hash, CreditCard } from "lucide-react";
import type { CustomerAggregate } from "../domain/aggregates/customer.aggregate";
import { CustomerTierBadge } from "./CustomerTierBadge";
import { DetailRenderer } from "@shared/ui/detail/DetailRenderer";
import type { DetailSchema } from "@shared/ui/detail/detail.types";

export interface CustomerProfileCardProps {
  customer: CustomerAggregate;
}

const customerDetailSchema: DetailSchema<CustomerAggregate> = {
  id: "customer-profile-details",
  fields: [
    {
      id: "customerCode",
      label: "Customer Code",
      icon: <Hash className="w-3.5 h-3.5 text-primary" />,
      format: "mono",
      value: (c) => c.customerCode.value,
    },
    {
      id: "email",
      label: "Official Email",
      icon: <Mail className="w-3.5 h-3.5 text-primary" />,
      format: "text",
      value: (c) => c.email,
    },
    {
      id: "phone",
      label: "Phone Contact",
      icon: <Phone className="w-3.5 h-3.5 text-primary" />,
      format: "text",
      value: (c) => c.phone || "Not Specified",
    },
    {
      id: "creditLimit",
      label: "Commercial Credit",
      icon: <CreditCard className="w-3.5 h-3.5 text-primary" />,
      format: "currency",
      currency: "USD",
      value: (c) => c.creditLimit || 0,
    },
  ],
};

export const CustomerProfileCard: React.FC<CustomerProfileCardProps> = ({ customer }) => {
  return (
    <div className="bg-surface border border-border rounded-2xl p-6 lg:p-8 space-y-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <span className="text-xs font-bold text-muted uppercase tracking-wider block mb-1">
            Enterprise Account Details
          </span>
          <h2 className="text-2xl font-extrabold text-foreground">{customer.displayName}</h2>
          {customer.companyName && (
            <span className="text-sm font-semibold text-primary">{customer.companyName}</span>
          )}
        </div>

        <CustomerTierBadge tier={customer.tier} />
      </div>

      {/* Core DetailRenderer Grid */}
      <DetailRenderer.Grid
        schema={customerDetailSchema}
        data={customer}
        columns={4}
        variant="card"
      />
    </div>
  );
};
