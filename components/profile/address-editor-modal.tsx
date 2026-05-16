"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  ADDRESS_COUNTRY_OPTIONS,
  composePhoneNumber,
  getAddressCountryOption,
  getPhoneCodeOptions,
  splitPhoneNumber,
} from "@/lib/address-options";
import {
  getPostalCodeFieldLabel,
  normalizePostalCode,
  validateAddressPostalCode,
} from "@/lib/address-validation";
import { buildAddressMetaNotes, extractAddressMeta } from "@/lib/address-client";
import type { Address, SavedAddress } from "@/lib/types";
import { authApi } from "@/services/client-api";
import { Button } from "@/components/shared/button";

type AddressEditorModalProps = {
  initialValue: Address | SavedAddress;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (address: SavedAddress, message: string) => void;
};

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

function toAddressForm(value: Address | SavedAddress): Address {
  const meta = extractAddressMeta(value.notes);

  return {
    fullName: value.fullName,
    phone: value.phone,
    line1: value.line1,
    line2: value.line2 || "",
    city: value.city,
    state: value.state,
    postalCode: value.postalCode,
    country: value.country,
    notes: value.notes || "",
    isDefault: value.isDefault ?? meta.isDefault,
  };
}

export function AddressEditorModal({
  initialValue,
  isOpen,
  onClose,
  onSaved,
}: AddressEditorModalProps) {
  const { token } = useAuth();
  const [form, setForm] = useState<Address>(toAddressForm(initialValue));
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneCountryCode, setPhoneCountryCode] = useState(
    getAddressCountryOption(toAddressForm(initialValue).country).dialCode,
  );
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const phoneCodeOptions = getPhoneCodeOptions();
  const selectedCountry = getAddressCountryOption(form.country);
  const hasStateOptions = selectedCountry.states.length > 0;
  const postalCodeLabel = getPostalCodeFieldLabel(form.country);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const nextForm = toAddressForm(initialValue);
    const normalizedCountry = getAddressCountryOption(nextForm.country);
    const normalizedForm = {
      ...nextForm,
      country: normalizedCountry.value,
      state:
        normalizedCountry.states.length === 0
          ? nextForm.state
          : normalizedCountry.states.includes(nextForm.state)
            ? nextForm.state
            : normalizedCountry.states[0] ?? "",
    };
    const nameParts = splitName(normalizedForm.fullName);
    const phone = splitPhoneNumber(normalizedForm.phone, normalizedForm.country);

    setForm(normalizedForm);
    setFirstName(nameParts.firstName);
    setLastName(nameParts.lastName);
    setPhoneCountryCode(phone.dialCode);
    setPhoneNumber(phone.localNumber);
    setError("");
  }, [initialValue, isOpen]);

  if (!isOpen) {
    return null;
  }

  const editingAddressId = "id" in initialValue ? initialValue.id : null;

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      setError("Login to save an address.");
      return;
    }

    setError("");
    setIsPending(true);

    try {
      const normalizedPostalValue = normalizePostalCode(form.country, form.postalCode);
      const postalCodeError = validateAddressPostalCode({
        country: form.country,
        state: form.state,
        postalCode: normalizedPostalValue,
      });

      if (postalCodeError) {
        setError(postalCodeError);
        setIsPending(false);
        return;
      }

      const payload = {
        ...form,
        fullName: [firstName.trim(), lastName.trim()].filter(Boolean).join(" ").trim(),
        phone: composePhoneNumber(phoneCountryCode || selectedCountry.dialCode || "+91", phoneNumber),
        postalCode: normalizedPostalValue,
        notes: buildAddressMetaNotes(Boolean(form.isDefault)),
      };

      const response = editingAddressId
        ? await authApi.updateAddress(token, editingAddressId, payload)
        : await authApi.createAddress(token, payload);

      onSaved(
        {
          ...response.address,
          isDefault: Boolean(form.isDefault),
          notes: payload.notes,
        },
        response.message,
      );
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save address.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-0 sm:px-4 py-0 sm:py-10 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-panel flex max-h-[100dvh] sm:max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[1.8rem] sm:rounded-[2.2rem] p-4 sm:p-8" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <h3 className="text-xl sm:text-3xl font-semibold text-stone-50">
              {editingAddressId ? "Edit address" : "Add address"}
            </h3>
          </div>
          <button
            aria-label="Close address modal"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-stone-100 transition hover:bg-white/10"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="mt-4 sm:mt-8 flex-1 overflow-y-auto space-y-4 pr-1" onSubmit={submitForm}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs text-white/45">Country/region</span>
              <select
                className="w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3.5 text-sm text-stone-100 outline-none focus:border-amber-300"
                onChange={(event) => {
                  const nextCountry = getAddressCountryOption(event.target.value);

                  setForm((current) => ({
                    ...current,
                    country: nextCountry.value,
                    state:
                      nextCountry.states.length === 0
                        ? ""
                        : nextCountry.states.includes(current.state)
                          ? current.state
                          : nextCountry.states[0] ?? "",
                  }));
                  setPhoneCountryCode((currentCode) =>
                    nextCountry.dialCode && (currentCode === selectedCountry.dialCode || !currentCode)
                      ? nextCountry.dialCode
                      : currentCode,
                  );
                }}
                value={form.country}
              >
                {ADDRESS_COUNTRY_OPTIONS.map((option) => (
                  <option className="bg-[#171a20] text-stone-100" key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs text-white/45">First name</span>
              <input
                className="w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3.5 text-sm text-stone-100 outline-none placeholder:text-white/30 focus:border-amber-300"
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="First name"
                required
                value={firstName}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs text-white/45">Last name</span>
              <input
                className="w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3.5 text-sm text-stone-100 outline-none placeholder:text-white/30 focus:border-amber-300"
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Last name"
                value={lastName}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs text-white/45">Address</span>
              <input
                className="w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3.5 text-sm text-stone-100 outline-none placeholder:text-white/30 focus:border-amber-300"
                onChange={(event) => setForm((current) => ({ ...current, line1: event.target.value }))}
                placeholder="Address"
                required
                value={form.line1}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-xs text-white/45">Apartment, suite, etc (optional)</span>
              <input
                className="w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3.5 text-sm text-stone-100 outline-none placeholder:text-white/30 focus:border-amber-300"
                onChange={(event) => setForm((current) => ({ ...current, line2: event.target.value }))}
                placeholder="Apartment, suite, etc (optional)"
                value={form.line2}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs text-white/45">City</span>
              <input
                className="w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3.5 text-sm text-stone-100 outline-none placeholder:text-white/30 focus:border-amber-300"
                onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
                placeholder="City"
                required
                value={form.city}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs text-white/45">State</span>
              {hasStateOptions ? (
                <select
                  className="w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3.5 text-sm text-stone-100 outline-none focus:border-amber-300"
                  onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))}
                  required
                  value={form.state}
                >
                  {selectedCountry.states.map((state) => (
                    <option className="bg-[#171a20] text-stone-100" key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3.5 text-sm text-stone-100 outline-none placeholder:text-white/30 focus:border-amber-300"
                  onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))}
                  placeholder="State / province"
                  required
                  value={form.state}
                />
              )}
            </label>

            <label className="space-y-2">
              <span className="text-xs text-white/45">{postalCodeLabel}</span>
              <input
                className="w-full rounded-[1.2rem] border border-white/10 bg-white/6 px-4 py-3.5 text-sm text-stone-100 outline-none placeholder:text-white/30 focus:border-amber-300"
                onChange={(event) => setForm((current) => ({ ...current, postalCode: event.target.value }))}
                placeholder={postalCodeLabel}
                required
                value={form.postalCode}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs text-white/45">Phone</span>
              <div className="flex overflow-hidden rounded-[1.2rem] border border-white/10 bg-white/6 focus-within:border-amber-300">
                <select
                  className="min-w-[5rem] border-r border-white/10 bg-transparent px-3 py-3.5 text-sm text-stone-100 outline-none"
                  onChange={(event) => setPhoneCountryCode(event.target.value)}
                  value={phoneCountryCode}
                >
                  {phoneCodeOptions.map((option) => (
                    <option className="bg-[#171a20] text-stone-100" key={option.label} value={option.value}>
                      {option.value}
                    </option>
                  ))}
                </select>
                <input
                  className="w-full bg-transparent px-4 py-3.5 text-sm text-stone-100 outline-none placeholder:text-white/30"
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="Phone"
                  required
                  type="tel"
                  value={phoneNumber}
                />
              </div>
            </label>

            <label className="sm:col-span-2 flex items-center gap-3 pt-1 text-sm text-stone-100">
              <input
                checked={Boolean(form.isDefault)}
                className="h-4 w-4 rounded border-white/20 bg-transparent accent-amber-300"
                onChange={(event) => setForm((current) => ({ ...current, isDefault: event.target.checked }))}
                type="checkbox"
              />
              <span>This is my default address</span>
            </label>

          </div>

          {error ? (
            <div className="rounded-[1.2rem] border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button disabled={isPending} onClick={onClose} size="lg" type="button" variant="secondary">
              Cancel
            </Button>
            <Button disabled={isPending} size="lg" type="submit">
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
