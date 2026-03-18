import { expect } from "@playwright/test";
import { MemberResponse } from "../../../modules/core/memberResponse";
import { Contact } from "../../../modules/core/contact";
import { Country } from "../../../modules/core/country";
import { Region } from "../../../modules/core/region";

// Validation helpers
export async function validateMemberStructure(
  member: MemberResponse,
  expectedXmi?: string,
  options: {
    requireDomesticCurrency?: boolean;
    requireAsset?: boolean;
  } = {}) {
  const { requireDomesticCurrency = false, requireAsset = false } = options;
  // Top-level required fields
  const requiredFields = [
    "xmi",
    "name",
    "country",
    "status",
    "region",
    "address",
    "main_contact",
    "alt_contact",
    "branch_name",
  ];

  // Add conditional fields based on options
  if (requireDomesticCurrency) {
    requiredFields.push("domestic_currency");
  }
  if (requireAsset) {
    requiredFields.push("asset");
  }
  requiredFields.forEach((field) => {
    expect(member, `Missing required field: ${field}`).toHaveProperty(field);
  });

  // XMI validation
  if (expectedXmi) {
    expect(member.xmi, "XMI should match authenticated member").toBe(
      expectedXmi,
    );
  }

  // Status validation
  const validStatuses = ["active", "inactive", "pending", "suspended"];
  expect(
    validStatuses,
    `Status should be one of: ${validStatuses.join(", ")}`,
  ).toContain(member.status);

  // Contact validation
  validateContactStructure(member.main_contact, "main_contact");
  validateContactStructure(member.alt_contact, "alt_contact");

  // Country and Region validation
  validateCountryRegionStructure(member.country, "country");
  validateCountryRegionStructure(member.region, "region");
}

export async function validateContactStructure(
  contact: Contact,
  contactType: string,
) {
  expect(contact, `${contactType} should have first_name`).toHaveProperty(
    "first_name",
  );
  expect(contact, `${contactType} should have last_name`).toHaveProperty(
    "last_name",
  );
  expect(contact, `${contactType} should have phone`).toHaveProperty("phone");
  expect(contact, `${contactType} should have email`).toHaveProperty("email");

  // Validate email format
  expect(contact.email, `${contactType} email should be valid`).toMatch(
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  );
}

export async function validateCountryRegionStructure(
  obj: Country | Region,
  objType: string,
) {
  expect(obj, `${objType} should have code`).toHaveProperty("code");
  expect(obj, `${objType} should have name`).toHaveProperty("name");
  expect(typeof obj.code, `${objType}.code should be string`).toBe("string");
  expect(typeof obj.name, `${objType}.name should be string`).toBe("string");
}
