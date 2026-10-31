import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, MapPin } from "lucide-react";
import {
  customerRepository,
  GetCustomerProfileQuery,
  SaveCustomerAddressCommand,
  type CustomerAddressEntity,
} from "@features/customers";
import { CustomerProfileCard } from "@features/customers/presentation/CustomerProfileCard";
import { AddressCard } from "@features/customers/presentation/AddressCard";

const getProfileQuery = new GetCustomerProfileQuery(customerRepository);
const saveAddressCmd = new SaveCustomerAddressCommand(customerRepository);

export const CustomerProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [formRecipient, setFormRecipient] = useState("");
  const [formStreet, setFormStreet] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formPostal, setFormPostal] = useState("");

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
      setFormRecipient("");
      setFormStreet("");
      setFormCity("");
      setFormPostal("");
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

  const handleSaveNewAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRecipient || !formStreet || !formCity || !formPostal) return;

    addAddressMutation.mutate({
      recipientName: formRecipient,
      street1: formStreet,
      city: formCity,
      state: "Tokyo",
      postalCode: formPostal,
      country: "Japan",
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

      {/* Customer Account Summary Card */}
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
            <Plus className="w-4 h-4" />
            <span>Add New Address</span>
          </button>
        </div>

        {/* Inline Add Address Form Modal */}
        {isAddingAddress && (
          <form
            onSubmit={handleSaveNewAddress}
            className="p-5 rounded-xl border border-primary/40 bg-surface shadow-md space-y-4 max-w-xl"
          >
            <h4 className="text-sm font-bold text-foreground">New Delivery Address</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-muted font-semibold mb-1">Recipient Name</label>
                <input
                  type="text"
                  required
                  value={formRecipient}
                  onChange={(e) => setFormRecipient(e.target.value)}
                  placeholder="e.g. John Doe / Receiving Dept"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-muted font-semibold mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={formStreet}
                  onChange={(e) => setFormStreet(e.target.value)}
                  placeholder="e.g. 100 Main St"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-muted font-semibold mb-1">City</label>
                <input
                  type="text"
                  required
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  placeholder="e.g. Tokyo"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-muted font-semibold mb-1">Postal Code</label>
                <input
                  type="text"
                  required
                  value={formPostal}
                  onChange={(e) => setFormPostal(e.target.value)}
                  placeholder="e.g. 100-0001"
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingAddress(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-muted hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addAddressMutation.isPending}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {addAddressMutation.isPending ? "Saving..." : "Save Address"}
              </button>
            </div>
          </form>
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
