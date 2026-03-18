import { faker } from "@faker-js/faker";
import { v4 as uuidv4 } from "uuid";
import { UserUpdateRequest } from "../modules/core/userUpdateRequest";

export function generateQuantity(
  min: number = 0.01,
  max: number = 100.0,
): number {
  const random = Math.random() * (max - min) + min;
  return parseFloat(random.toFixed(2));
}

export function generatePrice(min: number = 0.5, max: number = 5.0): number {
  const random = Math.random() * (max - min) + min;
  return parseFloat(random.toFixed(4));
}

export function generateFutureDate(days: number = 30): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function generatePartialQuantity(
  totalQuantity: number,
  minFraction: number = 0.2,
  maxFraction: number = 0.8,
): number {
  const fraction = Math.random() * (maxFraction - minFraction) + minFraction;
  const partial = totalQuantity * fraction;
  return parseFloat(partial.toFixed(2));
}

/**
 * Generate realistic IBAN based on country-specific formats
 */
export function generateRealisticIBAN(countryCode: string = "CD"): string {
  // Common IBAN formats by country (simplified for testing)
  const ibanFormats: { [key: string]: string } = {
    // Format: Country code + check digits + pattern (N=numeric, A=alphabetic, C=alphanumeric)
    CD: "CDkk NNNN NNNN NNNN NNNN NNNN NNNN NNNN", // Congo
    AR: "ARkk NNNN NNNN NNNN NNNN NNNN NNNN", // Argentina
    AT: "ATkk NNNN NNNN NNNN NNNN", // Austria
    BE: "BEkk NNNN NNNN NNNN", // Belgium
    FR: "FRkk NNNN NNNN NNNN NNNN NNNN NNNN NN", // France
    DE: "DEkk NNNN NNNN NNNN NNNN NN", // Germany
    IT: "ITkk AAAA AAAA AAAA AAAA AAAA AAAA", // Italy
    NL: "NLkk AAAA NNNN NNNN NN", // Netherlands
    ES: "ESkk NNNN NNNN NNNN NNNN NNNN", // Spain
    CH: "CHkk NNNN NNNN NNNN NNNN N", // Switzerland
    GB: "GBkk AAAA NNNN NNNN NNNN NN", // United Kingdom
    US: "USkk NNNN NNNN NNNN NNNN NNNN NNNN", // United States
  };

  const format = ibanFormats[countryCode] || ibanFormats["CD"];
  const checkDigits = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, "0");

  let iban = format;
  iban = iban.replace("kk", checkDigits);

  // Replace pattern placeholders with random characters
  iban = iban.replace(/N/g, () => Math.floor(Math.random() * 10).toString());
  iban = iban.replace(/A/g, () =>
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt(Math.floor(Math.random() * 26)),
  );
  iban = iban.replace(/C/g, () => {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    return chars.charAt(Math.floor(Math.random() * chars.length));
  });

  // Remove spaces for the final IBAN
  iban = iban.replace(/\s/g, "");

  console.log(`Generated realistic IBAN: ${iban}`);
  return iban;
}

export const generateMemberData = (
  overrides: Partial<{
    name: string;
    branch_name: string;
    tax_ref: string;
    address: string;
    country_code: string;
    main_contact: {
      first_name: string;
      last_name: string;
      phone: string;
      email: string;
    };
    alt_contact: {
      first_name: string;
      last_name: string;
      phone: string;
      email: string;
    };
    region_code: string;
  }> = {},
) => {
  const randomName = faker.company.name();
  const randomBranch = faker.company.buzzNoun();
  const randomTaxRef = `TAX${faker.string.alphanumeric(8).toUpperCase()}`;
  const randomAddress = faker.location.streetAddress();
  const randomCountryCode = faker.location.countryCode("alpha-2");
  const regionCode = "XR002";

  // Generate contact data using your existing function
  const contactData = generateContactData();

  return {
    name: randomName,
    branch_name: randomBranch,
    tax_ref: randomTaxRef,
    address: randomAddress,
    country_code: randomCountryCode,
    region_code: regionCode,
    main_contact: contactData.main_contact,
    alt_contact: contactData.alt_contact,
    ...overrides,
  };
};

export const generateContactData = (
  overrides: {
    main_contact?: Partial<{
      first_name: string;
      last_name: string;
      phone: string;
      email: string;
    }>;
    alt_contact?: Partial<{
      first_name: string;
      last_name: string;
      phone: string;
      email: string;
    }>;
  } = {},
) => {
  const randomFirstNameMain = faker.person.firstName();
  const randomLastNameMain = faker.person.lastName();
  const randomFirstNameAlt = faker.person.firstName();
  const randomLastNameAlt = faker.person.lastName();
  const randomEmailMain = faker.internet.email({
    firstName: randomFirstNameMain,
    lastName: randomLastNameMain,
  });
  const randomEmailAlt = faker.internet.email({
    firstName: randomFirstNameAlt,
    lastName: randomLastNameAlt,
  });
  const randomPhoneMain = `+55${faker.string.numeric(10)}`;
  const randomPhoneAlt = `+55${faker.string.numeric(10)}`;

  return {
    main_contact: {
      first_name: randomFirstNameMain,
      last_name: randomLastNameMain,
      phone: randomPhoneMain,
      email: randomEmailMain,
      ...overrides.main_contact,
    },
    alt_contact: {
      first_name: randomFirstNameAlt,
      last_name: randomLastNameAlt,
      phone: randomPhoneAlt,
      email: randomEmailAlt,
      ...overrides.alt_contact,
    },
  };
};

export function generateCollateralData() {
  return {
    name: faker.commerce.productName() + " Collateral",
    description: faker.commerce.productDescription(),
    amount: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
    asset: faker.helpers.arrayElement(["GLD", "SAR", "BRL"]),
    contribution_percent: faker.number.int({ min: 1, max: 100 }),
  };
}

/**
 * Generate user data
 */
export const generateUserData = (
  overrides: Partial<UserUpdateRequest> = {},
): UserUpdateRequest => {
  const baseData: UserUpdateRequest = {
    first_name: faker.person.firstName(),
    last_name: faker.person.lastName(),
    phone_number: `+55${faker.string.numeric(10)}`,
  };

  return { ...baseData, ...overrides };
};

export const generateInvalidUserData = {
  emptyFirstName: (): Partial<UserUpdateRequest> => ({ first_name: "" }),
  emptyLastName: (): Partial<UserUpdateRequest> => ({ last_name: "" }),
  invalidPhone: (): Partial<UserUpdateRequest> => ({ phone_number: "invalid" }),
  longFirstName: (): Partial<UserUpdateRequest> => ({
    first_name: "A".repeat(256),
  }),
  missingLastName: (): Partial<UserUpdateRequest> => ({
    last_name: undefined as any,
  }),
};

/**
 * Generate a 35-character transaction ID
 */
export function generateTxId(): string {
  // Generate UUID and truncate/pad to 35 characters
  const uuid = uuidv4().replace(/-/g, "");
  return uuid.substring(0, 35);
}

/**
 * Get current date in YYYY-MM-DD format
 */
export function getCurrentDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get tomorrow's date in YYYY-MM-DD format
 */
export function getTomorrowDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split("T")[0];
}

/**
 * Generate end-to-end ID without dashes (35 characters) - simpler version
 */
export function generateEndToEndId(): string {
  // Generate a 35-character alphanumeric string
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 35; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  console.log(`Generated end_to_end_id: ${result}`);
  return result;
}
