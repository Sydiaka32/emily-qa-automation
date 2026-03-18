import { MemberSettlementAsset } from "../../../../modules/clearing/memberSettlementAsset";
import { expect } from "@playwright/test";
import { SettlementAssetTypes } from "../../../../consts/clearing/settlementAssetTypes";

/**
 * Verify member settlement assets structure and content
 */
export function verifyMemberSettlementAssets(
  assets: MemberSettlementAsset[],
  memberXmi: string,
): void {
  console.log(`Verifying settlement assets for member: ${memberXmi}`);
  console.log(`Found ${assets.length} settlement assets`);

  // Get valid types from SettlementAssetTypes
  const validTypes = Object.values(SettlementAssetTypes);

  assets.forEach((asset, index) => {
    console.log(
      `\n  Asset ${index + 1}: ${asset.asset.code} (${asset.asset.name})`,
    );

    // Required fields
    expect(asset.asset).toBeDefined();
    expect(asset.asset.code).toBeDefined();
    expect(typeof asset.asset.code).toBe("string");
    expect(asset.asset.name).toBeDefined();
    expect(typeof asset.asset.name).toBe("string");

    expect(asset.settlement_asset_type).toBeDefined();
    expect(typeof asset.settlement_asset_type).toBe("string");
    expect(validTypes).toContain(asset.settlement_asset_type);

    // Parent can be null
    if (asset.parent !== null) {
      expect(asset.parent.xmi).toBeDefined();
      expect(asset.parent.name).toBeDefined();
    }

    // Custodian should be defined
    expect(asset.custodian).toBeDefined();
    expect(asset.custodian!.xmi).toBeDefined();
    expect(asset.custodian!.name).toBeDefined();

    // Settlement system should be defined
    expect(asset.settlement_system).toBeDefined();
    expect(asset.settlement_system!.code).toBeDefined();
    expect(asset.settlement_system!.name).toBeDefined();
    expect(asset.settlement_system!.rtgs_support).toBeDefined();
    expect(asset.settlement_system!.adapter).toBeDefined();

    // Domestic flag
    expect(typeof asset.domestic).toBe("boolean");

    // Account numbers can be null
    if (asset.account_number !== null) {
      expect(typeof asset.account_number).toBe("string");
    }

    if (asset.external_account_number !== null) {
      expect(typeof asset.external_account_number).toBe("string");
    }

    console.log(
      `    Type: ${asset.settlement_asset_type}, Domestic: ${asset.domestic}`,
    );
    console.log(
      `    Custodian: ${asset.custodian!.name} (${asset.custodian!.xmi})`,
    );
    console.log(
      `    System: ${asset.settlement_system!.name} (${asset.settlement_system!.code})`,
    );
  });

  console.log("\n✓ All settlement assets verified");
}
