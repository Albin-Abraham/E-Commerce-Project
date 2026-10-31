/**
 * Customer Presentation: Address Card
 */

import React from "react";
import { MapPin, Phone, Check } from "lucide-react";
import type { CustomerAddressEntity } from "../domain/entities/customer-address.entity";

export interface AddressCardProps {
  address: CustomerAddressEntity;
  onEdit?: (address: CustomerAddressEntity) => void;
  onDelete?: (id: string) => void;
}

export const AddressCard: React.FC<AddressCardProps> = ({
  address,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 space-y-3 relative flex flex-col justify-between hover:border-primary/40 transition-colors">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h4 className="font-bold text-foreground text-sm">{address.recipientName}</h4>
            {address.companyName && (
              <span className="text-xs text-muted block">{address.companyName}</span>
            )}
          </div>

          <div className="flex flex-wrap gap-1">
            {address.isDefaultShipping && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                <Check className="w-3 h-3" />
                Shipping
              </span>
            )}
            {address.isDefaultBilling && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-surface-muted text-foreground border border-border">
                Billing
              </span>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2 text-xs text-muted leading-relaxed">
          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted" />
          <span>{address.formatInline()}</span>
        </div>

        {address.phone && (
          <div className="flex items-center gap-2 text-xs text-muted mt-2">
            <Phone className="w-3.5 h-3.5 shrink-0 text-muted" />
            <span className="tabular-nums">{address.phone}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/40 text-xs font-semibold">
        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(address)}
            className="text-primary hover:underline"
          >
            Edit
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(address.id)}
            className="text-rose-500 hover:underline"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
};
