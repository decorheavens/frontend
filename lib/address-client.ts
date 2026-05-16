"use client";

import type { SavedAddress } from "./types";

const ADDRESS_META_PREFIX = "__meta__:";
const LEGACY_COMPANY_PREFIX = "__company__:";

export function buildAddressMetaNotes(isDefault: boolean) {
  if (!isDefault) {
    return "";
  }

  const payload = {
    isDefault,
  };

  return `${ADDRESS_META_PREFIX}${JSON.stringify(payload)}`;
}

export function extractAddressMeta(notes?: string) {
  const trimmedNotes = notes?.trim() ?? "";

  if (trimmedNotes.startsWith(ADDRESS_META_PREFIX)) {
    try {
      const parsed = JSON.parse(trimmedNotes.slice(ADDRESS_META_PREFIX.length)) as {
        isDefault?: boolean;
      };

      return {
        isDefault: Boolean(parsed.isDefault),
      };
    } catch {
      return {
        isDefault: false,
      };
    }
  }

  const hasLegacyCompany = trimmedNotes.startsWith(LEGACY_COMPANY_PREFIX);
  void hasLegacyCompany;

  return {
    isDefault: false,
  };
}

export function hydrateSavedAddress(address: SavedAddress) {
  const meta = extractAddressMeta(address.notes);

  return {
    ...address,
    isDefault: meta.isDefault,
  };
}
