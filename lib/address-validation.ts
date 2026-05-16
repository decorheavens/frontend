import { getAddressCountryOption } from "./address-options";

type AddressValidationInput = {
  country: string;
  state: string;
  postalCode: string;
};

type StatePostalValidator = (postalCode: string) => boolean;

const INDIA_STATE_POSTAL_VALIDATORS: Record<string, StatePostalValidator> = {
  "Andaman and Nicobar Islands": (postalCode) => /^744\d{3}$/.test(postalCode),
  "Andhra Pradesh": (postalCode) => /^(515|516|517|518|519|52\d|53[0-5])\d{3}$/.test(postalCode),
  "Arunachal Pradesh": (postalCode) => /^(790|791|792)\d{3}$/.test(postalCode),
  Assam: (postalCode) => /^(781|782|783|784|785|786|787|788)\d{3}$/.test(postalCode),
  Bihar: (postalCode) => /^(80\d|81\d|82\d|83\d|84\d|85[0-5])\d{3}$/.test(postalCode),
  Chandigarh: (postalCode) => /^160\d{3}$/.test(postalCode),
  Chhattisgarh: (postalCode) => /^49\d{4}$/.test(postalCode),
  "Dadra and Nagar Haveli and Daman and Diu": (postalCode) => /^(3625|3962)\d{2}$/.test(postalCode),
  Delhi: (postalCode) => /^110\d{3}$/.test(postalCode),
  Goa: (postalCode) => /^403\d{3}$/.test(postalCode),
  Gujarat: (postalCode) => /^(36\d|37\d|38\d|39\d)\d{3}$/.test(postalCode),
  Haryana: (postalCode) => /^(12\d|13\d)\d{3}$/.test(postalCode),
  "Himachal Pradesh": (postalCode) => /^17[1-8]\d{3}$/.test(postalCode),
  "Jammu and Kashmir": (postalCode) => /^(18[0-5]|19[0-3])\d{3}$/.test(postalCode),
  Jharkhand: (postalCode) => /^(81\d|82\d|83[0-5])\d{3}$/.test(postalCode),
  Karnataka: (postalCode) => /^(56\d|57\d|58\d|59\d)\d{3}$/.test(postalCode),
  Kerala: (postalCode) => /^(67\d|68\d|69\d)\d{3}$/.test(postalCode) && !/^682\d{3}$/.test(postalCode),
  Ladakh: (postalCode) => /^194\d{3}$/.test(postalCode),
  Lakshadweep: (postalCode) => /^682\d{3}$/.test(postalCode),
  "Madhya Pradesh": (postalCode) => /^(45\d|46\d|47\d|48\d)\d{3}$/.test(postalCode),
  Maharashtra: (postalCode) => /^(40\d|41\d|42\d|43\d|44\d)\d{3}$/.test(postalCode),
  Manipur: (postalCode) => /^795\d{3}$/.test(postalCode),
  Meghalaya: (postalCode) => /^(793|794)\d{3}$/.test(postalCode),
  Mizoram: (postalCode) => /^796\d{3}$/.test(postalCode),
  Nagaland: (postalCode) => /^(797|798)\d{3}$/.test(postalCode),
  Odisha: (postalCode) => /^(75\d|76\d|77\d)\d{3}$/.test(postalCode),
  Puducherry: (postalCode) => /^605\d{3}$/.test(postalCode),
  Punjab: (postalCode) => /^(14\d|15\d)\d{3}$/.test(postalCode),
  Rajasthan: (postalCode) => /^(30\d|31\d|32\d|33\d|34\d)\d{3}$/.test(postalCode),
  Sikkim: (postalCode) => /^737\d{3}$/.test(postalCode),
  "Tamil Nadu": (postalCode) => /^(60\d|61\d|62\d|63\d|64\d)\d{3}$/.test(postalCode) && !/^605\d{3}$/.test(postalCode),
  Telangana: (postalCode) => /^50\d{4}$/.test(postalCode),
  Tripura: (postalCode) => /^799\d{3}$/.test(postalCode),
  "Uttar Pradesh": (postalCode) =>
    /^(20\d|21\d|22\d|23\d|24\d|25\d|26\d|27\d|28\d)\d{3}$/.test(postalCode) &&
    !/^(246|247|248|249|262|263)\d{3}$/.test(postalCode),
  Uttarakhand: (postalCode) => /^(246|247|248|249|262|263)\d{3}$/.test(postalCode),
  "West Bengal": (postalCode) => /^(70\d|71\d|72\d|73\d|74[0-3])\d{3}$/.test(postalCode),
};

const POSTAL_CODE_PATTERNS: Record<string, RegExp> = {
  Australia: /^\d{4}$/,
  Canada: /^[A-Z]\d[A-Z][ -]?\d[A-Z]\d$/,
  India: /^\d{6}$/,
  "United Kingdom": /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
  "United States": /^\d{5}(?:-\d{4})?$/,
};

export function normalizePostalCode(country: string, postalCode: string) {
  const collapsed = postalCode.trim().replace(/\s+/g, " ");
  return country === "Canada" || country === "United Kingdom"
    ? collapsed.toUpperCase()
    : collapsed.replace(/\s+/g, "");
}

export function getPostalCodeFieldLabel(country: string) {
  if (country === "India") {
    return "PIN code";
  }

  if (country === "United States") {
    return "ZIP code";
  }

  return "Postal code";
}

export function validateAddressPostalCode(input: AddressValidationInput) {
  const country = input.country.trim();
  const state = input.state.trim();
  const postalCode = normalizePostalCode(country, input.postalCode);
  const countryOption = getAddressCountryOption(country);

  if (countryOption.states.length > 0 && !countryOption.states.includes(state)) {
    return "Select a valid state for the chosen country.";
  }

  const pattern = POSTAL_CODE_PATTERNS[country];

  if (pattern && !pattern.test(postalCode)) {
    return `${getPostalCodeFieldLabel(country)} format looks invalid for ${country}.`;
  }

  if (!pattern && !/^[A-Z0-9][A-Z0-9 -]{2,11}$/i.test(postalCode)) {
    return "Postal code format looks invalid.";
  }

  if (country === "India") {
    const validator = INDIA_STATE_POSTAL_VALIDATORS[state];

    if (validator && !validator(postalCode)) {
      return `${getPostalCodeFieldLabel(country)} does not match ${state}.`;
    }
  }

  return null;
}
