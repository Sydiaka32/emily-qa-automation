// @utils/clearingService/members/bo/verifyMemberSettlementProfile.ts
import { MemberSettlementProfile } from "../../../../modules/clearing/memberSettlementProfile";
import { expect } from "@playwright/test";

/**
 * Verify member settlement profile structure and content
 */
export function verifyMemberSettlementProfile(
  profile: MemberSettlementProfile,
): void {
  console.log(
    `Verifying member settlement profile: ${profile.xmi} (${profile.name})`,
  );

  // Required fields
  expect(profile.xmi).toBeDefined();
  expect(typeof profile.xmi).toBe("string");
  expect(profile.xmi.length).toBeGreaterThan(0);
  expect(profile.xmi).toMatch(/^X(MBER|XABT)\d+[A-Z]{4}$/); // XMI pattern

  expect(profile.name).toBeDefined();
  expect(typeof profile.name).toBe("string");
  expect(profile.name.length).toBeGreaterThan(0);

  // Country object
  expect(profile.country).toBeDefined();
  expect(profile.country.code).toBeDefined();
  expect(profile.country.name).toBeDefined();

  expect(profile.status).toBeDefined();
  expect(typeof profile.status).toBe("string");
  expect(["active", "inactive", "suspended"]).toContain(
    profile.status.toLowerCase(),
  );

  // KYB status can be null
  if (profile.kyb_status !== null) {
    expect(typeof profile.kyb_status).toBe("string");
  }

  // Branch name and tax ref
  expect(typeof profile.branch_name).toBe("string");
  expect(typeof profile.tax_ref).toBe("string");

  // Contact objects
  expect(profile.main_contact).toBeDefined();
  expect(profile.main_contact.first_name).toBeDefined();
  expect(profile.main_contact.last_name).toBeDefined();
  expect(profile.main_contact.phone).toBeDefined();
  expect(profile.main_contact.email).toBeDefined();

  expect(profile.alt_contact).toBeDefined();
  expect(profile.alt_contact.first_name).toBeDefined();
  expect(profile.alt_contact.last_name).toBeDefined();
  expect(profile.alt_contact.phone).toBeDefined();
  expect(profile.alt_contact.email).toBeDefined();

  // Language can be null
  if (profile.language !== null) {
    expect(typeof profile.language).toBe("string");
  }

  expect(typeof profile.address).toBe("string");

  // Region object
  expect(profile.region).toBeDefined();
  expect(profile.region.code).toBeDefined();
  expect(profile.region.name).toBeDefined();

  // Tariff can be null
  if (profile.tariff !== null) {
    expect(profile.tariff.code).toBeDefined();
    expect(profile.tariff.name).toBeDefined();
  }

  expect(profile.asset).toBeDefined();
  expect(typeof profile.asset).toBe("string");
  expect(profile.asset.length).toBe(3); // Currency codes are typically 3 chars

  console.log(
    `  Status: ${profile.status}, Asset: ${profile.asset}, Country: ${profile.country.code}`,
  );
}
