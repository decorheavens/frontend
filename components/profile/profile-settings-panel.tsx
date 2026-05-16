"use client";

import { Info, PencilLine, Plus, Trash2, UserRound } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { hydrateSavedAddress } from "@/lib/address-client";
import type { Address, SavedAddress } from "@/lib/types";
import { authApi } from "@/services/client-api";
import { Button } from "@/components/shared/button";
import { EmptyState } from "@/components/shared/empty-state";
import { AddressEditorModal } from "./address-editor-modal";
import { ProfileEditorModal } from "./profile-editor-modal";

function createEmptyAddress(fullName = ""): Address {
  return {
    fullName,
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    notes: "",
    isDefault: false,
  };
}

export function ProfileSettingsPanel() {
  const { initialized, token, user } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressesError, setAddressesError] = useState("");
  const [notice, setNotice] = useState("");
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false);
  const [isAddressEditorOpen, setIsAddressEditorOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const orderedAddresses = [...addresses].sort((left, right) => Number(Boolean(right.isDefault)) - Number(Boolean(left.isDefault)));

  const loadAddresses = useCallback(async (activeToken: string) => {
    setLoadingAddresses(true);
    setAddressesError("");

    try {
      const response = await authApi.listAddresses(activeToken);
      setAddresses(response.addresses.map(hydrateSavedAddress));
    } catch (caughtError) {
      setAddressesError(caughtError instanceof Error ? caughtError.message : "Unable to load addresses.");
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!token) {
      return;
    }

    void loadAddresses(token);
  }, [initialized, loadAddresses, token]);

  if (!initialized) {
    return <div className="text-sm text-[color:var(--muted)]">Loading your profile...</div>;
  }

  if (!user) {
    return (
      <EmptyState
        actionHref="/login"
        actionLabel="Login to continue"
        description="Your profile and addresses are protected and only available after login."
        title="Sign in to view your profile."
      />
    );
  }

  const openAddressCreator = () => {
    setEditingAddress(null);
    setIsAddressEditorOpen(true);
  };

  const openAddressEditor = (address: SavedAddress) => {
    setEditingAddress(address);
    setIsAddressEditorOpen(true);
  };

  const handleAddressSaved = (address: SavedAddress, message: string) => {
    setAddresses((current) => {
      const nextAddresses = editingAddress
        ? current.map((item) => (item.id === address.id ? address : item))
        : [address, ...current];

      return address.isDefault
        ? nextAddresses.map((item) => ({
            ...item,
            isDefault: item.id === address.id,
          }))
        : nextAddresses;
    });
    setNotice(message);
    setEditingAddress(null);
    setIsAddressEditorOpen(false);
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!token || typeof window === "undefined") {
      return;
    }

    if (!window.confirm("Remove this address?")) {
      return;
    }

    try {
      const response = await authApi.deleteAddress(token, addressId);
      setAddresses((current) => current.filter((address) => address.id !== addressId));
      setNotice(response.message);
      setAddressesError("");
    } catch (caughtError) {
      setAddressesError(caughtError instanceof Error ? caughtError.message : "Unable to remove address.");
    }
  };

  return (
    <>
      <div className="space-y-7">
        {notice ? (
          <div className="rounded-[1.4rem] border border-amber-300/25 bg-amber-400/10 px-5 py-4 text-sm leading-7 text-amber-50">
            {notice}
          </div>
        ) : null}

        <section className="rounded-[2rem] border border-white/8 bg-[#191c22] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] sm:p-7">
          <div className="rounded-[1.5rem] border border-white/8 bg-black/15 p-6">
            <div className="flex items-start gap-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/8 text-amber-300">
                <UserRound className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-xl font-semibold text-white">{user.name}</p>
                  <button
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-amber-300 transition hover:bg-white/8"
                    onClick={() => setIsProfileEditorOpen(true)}
                    type="button"
                  >
                    <PencilLine className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-6 text-sm text-white/45">Email</p>
                <p className="mt-2 break-all text-lg text-stone-100">{user.email}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/8 bg-[#191c22] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-2xl font-semibold text-white">Addresses</p>
            <button
              className="inline-flex items-center gap-2 text-sm font-semibold text-amber-300 transition hover:text-amber-200"
              onClick={openAddressCreator}
              type="button"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>

          <div className="mt-6 rounded-[1.5rem] border border-white/8 bg-black/15 p-5">
            {loadingAddresses ? (
              <p className="text-sm text-white/55">Loading addresses...</p>
            ) : addressesError ? (
              <p className="text-sm text-red-200">{addressesError}</p>
            ) : addresses.length === 0 ? (
              <div className="flex items-center gap-3 rounded-[1.1rem] border border-white/8 bg-white px-5 py-5 text-sm text-slate-900">
                <Info className="h-4 w-4 text-slate-500" />
                <span>No addresses added</span>
              </div>
            ) : (
              <div className="space-y-3">
                {orderedAddresses.map((address) => (
                  <div className="rounded-[1.2rem] border border-white/8 bg-white/5 p-4" key={address.id}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="text-sm leading-7 text-white/65">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-semibold text-white">{address.fullName}</p>
                          {address.isDefault ? (
                            <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-200">
                              Default
                            </span>
                          ) : null}
                        </div>
                        <p>{address.phone}</p>
                        <p>{address.line1}</p>
                        {address.line2 ? <p>{address.line2}</p> : null}
                        <p>
                          {address.city}, {address.state}
                        </p>
                        <p>
                          {address.postalCode}, {address.country}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button onClick={() => openAddressEditor(address)} size="sm" variant="secondary">
                          Edit
                        </Button>
                        <button
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/65 transition hover:border-red-400/40 hover:text-red-200"
                          onClick={() => void handleDeleteAddress(address.id)}
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      <ProfileEditorModal
        isOpen={isProfileEditorOpen}
        onClose={() => setIsProfileEditorOpen(false)}
        onNotice={setNotice}
      />
      <AddressEditorModal
        initialValue={editingAddress ?? createEmptyAddress(user.name)}
        isOpen={isAddressEditorOpen}
        onClose={() => {
          setEditingAddress(null);
          setIsAddressEditorOpen(false);
        }}
        onSaved={handleAddressSaved}
      />
    </>
  );
}
