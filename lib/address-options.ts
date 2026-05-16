import { COUNTRY_DATA } from "./address-country-data";

export type AddressCountryOption = {
  code: string;
  value: string;
  label: string;
  dialCode: string;
  states: string[];
};

const DEFAULT_COUNTRY = "India";

const COUNTRY_DIAL_CODES: Record<string, string> = {
  Afghanistan: "+93",
  Albania: "+355",
  Algeria: "+213",
  Argentina: "+54",
  Armenia: "+374",
  Australia: "+61",
  Austria: "+43",
  Azerbaijan: "+994",
  Bahrain: "+973",
  Bangladesh: "+880",
  Belgium: "+32",
  Brazil: "+55",
  Canada: "+1",
  China: "+86",
  Cyprus: "+357",
  Czechia: "+420",
  Denmark: "+45",
  Egypt: "+20",
  Finland: "+358",
  France: "+33",
  Germany: "+49",
  Greece: "+30",
  "Hong Kong": "+852",
  Hungary: "+36",
  India: "+91",
  Indonesia: "+62",
  Ireland: "+353",
  Israel: "+972",
  Italy: "+39",
  Japan: "+81",
  Jordan: "+962",
  Kenya: "+254",
  Kuwait: "+965",
  Malaysia: "+60",
  Mexico: "+52",
  Nepal: "+977",
  Netherlands: "+31",
  "New Zealand": "+64",
  Nigeria: "+234",
  Norway: "+47",
  Oman: "+968",
  Pakistan: "+92",
  Philippines: "+63",
  Poland: "+48",
  Portugal: "+351",
  Qatar: "+974",
  Romania: "+40",
  "Saudi Arabia": "+966",
  Singapore: "+65",
  "South Africa": "+27",
  Spain: "+34",
  "Sri Lanka": "+94",
  Sweden: "+46",
  Switzerland: "+41",
  Thailand: "+66",
  Turkiye: "+90",
  "United Arab Emirates": "+971",
  "United Kingdom": "+44",
  "United States": "+1",
  "Viet Nam": "+84",
};

const COUNTRY_STATE_OPTIONS: Record<string, string[]> = {
  India: [
    "Andaman and Nicobar Islands",
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chandigarh",
    "Chhattisgarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Ladakh",
    "Lakshadweep",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Puducherry",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
  ],
  "United Arab Emirates": ["Abu Dhabi", "Ajman", "Dubai", "Fujairah", "Ras Al Khaimah", "Sharjah", "Umm Al Quwain"],
  "Saudi Arabia": [
    "Al Bahah",
    "Al Jawf",
    "Al Madinah",
    "Al Qassim",
    "Asir",
    "Eastern Province",
    "Ha'il",
    "Jazan",
    "Makkah",
    "Najran",
    "Northern Borders",
    "Riyadh",
    "Tabuk",
  ],
  Qatar: ["Ad Dawhah", "Al Daayen", "Al Khor", "Al Rayyan", "Al Wakrah", "Madinat ash Shamal", "Umm Salal"],
  Kuwait: ["Ahmadi", "Al Asimah", "Farwaniya", "Hawalli", "Jahra", "Mubarak Al-Kabeer"],
  Oman: [
    "Ad Dakhiliyah",
    "Ad Dhahirah",
    "Al Batinah North",
    "Al Batinah South",
    "Al Buraimi",
    "Al Wusta",
    "Ash Sharqiyah North",
    "Ash Sharqiyah South",
    "Dhofar",
    "Musandam",
    "Muscat",
  ],
  Bahrain: ["Capital", "Muharraq", "Northern", "Southern"],
  "United States": [
    "Alabama",
    "Alaska",
    "Arizona",
    "Arkansas",
    "California",
    "Colorado",
    "Connecticut",
    "Delaware",
    "District of Columbia",
    "Florida",
    "Georgia",
    "Hawaii",
    "Idaho",
    "Illinois",
    "Indiana",
    "Iowa",
    "Kansas",
    "Kentucky",
    "Louisiana",
    "Maine",
    "Maryland",
    "Massachusetts",
    "Michigan",
    "Minnesota",
    "Mississippi",
    "Missouri",
    "Montana",
    "Nebraska",
    "Nevada",
    "New Hampshire",
    "New Jersey",
    "New Mexico",
    "New York",
    "North Carolina",
    "North Dakota",
    "Ohio",
    "Oklahoma",
    "Oregon",
    "Pennsylvania",
    "Rhode Island",
    "South Carolina",
    "South Dakota",
    "Tennessee",
    "Texas",
    "Utah",
    "Vermont",
    "Virginia",
    "Washington",
    "West Virginia",
    "Wisconsin",
    "Wyoming",
  ],
  "United Kingdom": ["England", "Northern Ireland", "Scotland", "Wales"],
  Canada: [
    "Alberta",
    "British Columbia",
    "Manitoba",
    "New Brunswick",
    "Newfoundland and Labrador",
    "Northwest Territories",
    "Nova Scotia",
    "Nunavut",
    "Ontario",
    "Prince Edward Island",
    "Quebec",
    "Saskatchewan",
    "Yukon",
  ],
  Australia: [
    "Australian Capital Territory",
    "New South Wales",
    "Northern Territory",
    "Queensland",
    "South Australia",
    "Tasmania",
    "Victoria",
    "Western Australia",
  ],
  Singapore: ["Central Region", "East Region", "North Region", "North-East Region", "West Region"],
};

export const ADDRESS_COUNTRY_OPTIONS: AddressCountryOption[] = COUNTRY_DATA.map(({ code, name }) => ({
  code,
  value: name,
  label: name,
  dialCode: COUNTRY_DIAL_CODES[name] ?? "",
  states: [...(COUNTRY_STATE_OPTIONS[name] ?? [])].sort((left, right) => left.localeCompare(right)),
})).sort((left, right) => left.label.localeCompare(right.label));

export function getAddressCountryOption(country: string) {
  return (
    ADDRESS_COUNTRY_OPTIONS.find((option) => option.value === country) ??
    ADDRESS_COUNTRY_OPTIONS.find((option) => option.value === DEFAULT_COUNTRY) ??
    ADDRESS_COUNTRY_OPTIONS[0]!
  );
}

export function getPhoneCodeOptions() {
  return ADDRESS_COUNTRY_OPTIONS.reduce<Array<{ label: string; value: string }>>((items, option) => {
    if (!option.dialCode || items.some((item) => item.value === option.dialCode)) {
      return items;
    }

    items.push({
      label: `${option.dialCode} ${option.label}`,
      value: option.dialCode,
    });

    return items;
  }, []);
}

export function composePhoneNumber(dialCode: string, localNumber: string) {
  const cleanedNumber = localNumber.trim().replace(/\s+/g, " ");
  return `${dialCode.trim()} ${cleanedNumber}`.trim();
}

export function splitPhoneNumber(phone: string, fallbackCountry = "India") {
  const trimmedPhone = phone.trim();
  const defaultCountry = getAddressCountryOption(fallbackCountry);

  if (!trimmedPhone) {
    return {
      dialCode: defaultCountry.dialCode || "+91",
      localNumber: "",
    };
  }

  const matchedOption = ADDRESS_COUNTRY_OPTIONS.find(
    (option) => option.dialCode && trimmedPhone.startsWith(option.dialCode),
  );

  if (!matchedOption) {
    return {
      dialCode: defaultCountry.dialCode || "+91",
      localNumber: trimmedPhone,
    };
  }

  return {
    dialCode: matchedOption.dialCode,
    localNumber: trimmedPhone.slice(matchedOption.dialCode.length).trim(),
  };
}
