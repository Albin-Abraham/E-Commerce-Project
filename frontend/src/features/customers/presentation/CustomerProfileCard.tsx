/**
 * Customer Presentation: Customer Profile Card
 */

import React from "react";
import { Mail, Phone, Hash, CreditCard } from "lucide-react";
import type { CustomerAggregate } from "../domain/aggregates/customer.aggregate";
import { CustomerTierBadge } from "./CustomerTierBadge";

export interface CustomerProfileCardProps {
  customer: CustomerAggregate;
}

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="p-3.5 rounded-xl bg-surface-muted/50 border border-border/60 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-muted">
            <Hash className="w-3.5 h-3.5 text-primary" />
            <span>Customer Code</span>
          </div>
          <span className="font-mono font-bold text-foreground text-sm">
            {customer.customerCode.value}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-muted/50 border border-border/60 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-muted">
            <Mail className="w-3.5 h-3.5 text-primary" />
            <span>Official Email</span>
          </div>
          <span className="font-medium text-foreground truncate block text-sm">
            {customer.email}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-muted/50 border border-border/60 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-muted">
            <Phone className="w-3.5 h-3.5 text-primary" />
            <span>Phone Contact</span>
          </div>
          <span className="font-medium text-foreground text-sm tabular-nums">
            {customer.phone || "Not Specified"}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-muted/50 border border-border/60 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-muted">
            <CreditCard className="w-3.5 h-3.5 text-primary" />
            <span>Commercial Credit</span>
          </div>
          <span className="font-bold text-foreground text-sm tabular-nums">
            ${customer.creditLimit ? customer.creditLimit.toLocaleString() : "0"} USD
          </span>
        </div>
      </div>
    </div>
  );
};
