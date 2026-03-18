import { SettlementAsset } from "../../../modules/clearing/settlementAsset";
import { expect } from "@playwright/test";

/**
 * Verify asset details structure and content
 */
export function verifyAssetDetails(
  assetDetails: SettlementAsset,
  expectedAssetCode?: string,
): void {
  console.log(`Verifying asset details for ${assetDetails.asset.code}...`);

  // Verify asset object structure
  expect(assetDetails.asset).toBeDefined();
  expect(assetDetails.asset.code).toBeDefined();
  expect(assetDetails.asset.name).toBeDefined();

  // If expected asset code is provided, verify it matches
  if (expectedAssetCode) {
    expect(assetDetails.asset.code).toBe(expectedAssetCode);
    console.log(`Asset code matches expected: ${expectedAssetCode}`);
  }

  // Verify parent can be null or valid object
  if (assetDetails.parent) {
    expect(assetDetails.parent.xmi).toBeDefined();
    expect(assetDetails.parent.name).toBeDefined();
    console.log(`Parent defined: ${assetDetails.parent.name}`);
  } else {
    console.log("Parent is null (as expected for some asset types)");
  }

  // Verify custodian is defined (should always have a custodian)
  expect(assetDetails.custodian).toBeDefined();
  expect(assetDetails.custodian!.xmi).toBeDefined();
  expect(assetDetails.custodian!.name).toBeDefined();
  console.log(`Custodian defined: ${assetDetails.custodian!.name}`);

  // Verify settlement_system is defined
  expect(assetDetails.settlement_system).toBeDefined();
  expect(assetDetails.settlement_system!.code).toBeDefined();
  expect(assetDetails.settlement_system!.name).toBeDefined();
  console.log(`Settlement system: ${assetDetails.settlement_system!.name}`);

  // Verify domestic is boolean
  expect(typeof assetDetails.domestic).toBe("boolean");
  console.log(`Domestic flag: ${assetDetails.domestic}`);

  // Verify account numbers (can be null for some types like NONE)
  if (assetDetails.account_number !== null) {
    expect(typeof assetDetails.account_number).toBe("string");
    console.log(`Account number present`);
  }

  if (assetDetails.external_account_number !== null) {
    expect(typeof assetDetails.external_account_number).toBe("string");
    console.log(`External account number present`);
  }

  console.log("Asset details verification completed");
}
