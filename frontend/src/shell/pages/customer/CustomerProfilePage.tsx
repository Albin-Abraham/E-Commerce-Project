import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, MapPin, X } from "lucide-react";

import { customerRepository } from "@features/customers/infrastructure/repositories/django-customer.repository";
import { GetCustomerProfileQuery } from "@features/customers/application/queries/get-customer-profile.query";
import { SaveCustomerAddressCommand } from "@features/customers/application/commands/save-customer-address.command";
import { CustomerProfileCard } from "@features/customers/presentation/CustomerProfileCard";
import { AddressCard } from "@features/customers/presentation/AddressCard";

import { Form } from "@ui/form/Form";
import type { FormDefinition } from "@ui/form/types";

const getProfileQuery = new GetCustomerProfileQuery(customerRepository);
const saveAddressCmd = new SaveCustomerAddressCommand(customerRepository);

const newAddressFormDef: FormDefinition = {
  id: "customer-new-address-form",
  title: "New Facility or Delivery Address",
  description: "Provide shipping or billing location details.",
  submitLabel: "Save Address",
  sections: [
    {
      id: "address-fields",
      title: "",
      fields: [
        {
          id: "recipientName",
          name: "recipientName",
          type: "text",
          label: "Recipient or Facility Name",
          required: true,
          layout: { columnSpan: 12 },
          properties: { placeholder: "e.g. Acme Receiving Dept / John Doe" },
        },
        {
          id: "street1",
          name: "street1",
          type: "text",
          label: "Street Address",
          required: true,
          layout: { columnSpan: 12 },
          properties: { placeholder: "e.g. 100 Enterprise Way, Suite 400" },
        },
        {
          id: "city",
          name: "city",
          type: "text",
          label: "City",
          required: true,
          layout: { columnSpan: 6 },
          properties: { placeholder: "e.g. San Francisco" },
        },
        {
          id: "state",
          name: "state",
          type: "text",
          label: "State / Province",
          required: true,
          layout: { columnSpan: 6 },
          properties: { placeholder: "e.g. California" },
        },
        {
          id: "postalCode",
          name: "postalCode",
          type: "text",
          label: "Postal Code",
          required: true,
          layout: { columnSpan: 6 },
          properties: { placeholder: "e.g. 94105" },
        },
        {
          id: "country",
          name: "country",
          type: "text",
          label: "Country",
          required: true,
          layout: { columnSpan: 6 },
          properties: { placeholder: "e.g. United States" },
        },
        {
          id: "submit-btn",
          type: "button",
          label: "Save Address",
          layout: { columnSpan: 12 },
          properties: { submit: true },
          meta: {
            ui: {
              classNames: {
                base: "mt-3 inline-flex items-center justify-center font-bold px-4 py-2 text-xs rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all",
              },
            },
          },
        },
      ],
    },
  ],
};

export const CustomerProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAddingAddress, setIsAddingAddress] = useState(false);

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer", "profile"],
    queryFn: () => getProfileQuery.execute(),
  });

  const addAddressMutation = useMutation({
    mutationFn: (input: {
      recipientName: string;
      street1: string;
      city: string;
      postalCode: string;
      country: string;
      state: string;
      isDefaultShipping: boolean;
      isDefaultBilling: boolean;
    }) => saveAddressCmd.execute(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer", "profile"] });
      setIsAddingAddress(false);
    },
  });

  if (isLoading || !customer) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
        <div className="h-8 bg-surface-muted rounded w-48" />
        <div className="h-48 bg-surface-muted rounded-2xl" />
        <div className="h-32 bg-surface-muted rounded-2xl" />
      </div>
    );
  }

  const handleSaveNewAddress = async (formData: Record<string, any>) => {
    await addAddressMutation.mutateAsync({
      recipientName: formData.recipientName,
      street1: formData.street1,
      city: formData.city,
      state: formData.state || "CA",
      postalCode: formData.postalCode,
      country: formData.country || "United States",
      isDefaultShipping: customer.addresses.length === 0,
      isDefaultBilling: customer.addresses.length === 0,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
          Customer Account & Commercial Profile
        </h1>
        <p className="text-sm text-muted mt-1">
          Manage your enterprise customer identity, commercial credit limit, and multi-facility address book.
        </p>
      </div>

      {/* Customer Account Summary Card (rendered via DetailRenderer.Grid) */}
      <CustomerProfileCard customer={customer} />

      {/* Address Book Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Saved Shipping & Billing Addresses</h3>
          </div>

          <button
            type="button"
            onClick={() => setIsAddingAddress(!isAddingAddress)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-xs"
          >
            {isAddingAddress ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{isAddingAddress ? "Cancel" : "Add New Address"}</span>
          </button>
        </div>

        {/* Address Creation Form via ZenOS Form Architecture */}
        {isAddingAddress && (
          <div className="p-6 rounded-2xl border border-primary/40 bg-surface shadow-md max-w-2xl animate-in fade-in duration-300">
            <Form<any>
              definition={newAddressFormDef as any}
              onSubmit={handleSaveNewAddress}
            />
          </div>
        )}

        {/* Addresses Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {customer.addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              onDelete={async (id) => {
                await customerRepository.deleteAddress(id);
                queryClient.invalidateQueries({ queryKey: ["customer", "profile"] });
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomerProfilePage;
