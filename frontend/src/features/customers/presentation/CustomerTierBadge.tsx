/**
 * Customer Presentation: Commercial Tier Badge
 */

import React from "react";
import { Building2, Award, User } from "lucide-react";
import type { CustomerType } from "../domain/value-objects/customer-type.vo";

export interface CustomerTierBadgeProps {
  tier: CustomerType;
}

export const CustomerTierBadge: React.FC<CustomerTierBadgeProps> = ({ tier }) => {
  if (tier.value === "ENTERPRISE_VIP") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-xs">
        <Award className="w-3.5 h-3.5" />
        <span>Enterprise VIP Tier</span>
      </span>
    );
  }

  if (tier.value === "COMMERCIAL_B2B") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-xs">
        <Building2 className="w-3.5 h-3.5" />
        <span>Commercial B2B Verified</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-muted text-muted border border-border">
      <User className="w-3.5 h-3.5" />
      <span>Retail Consumer</span>
    </span>
  );
};
