import { expect } from "@playwright/test";
import { getRegionByCode } from "./getRegionByCode";

/**
 * Get region limits for member
 */
export async function getRegionLimitsForMember(
  memberInfo: any,
  operatorToken: string,
): Promise<any> {
  const regionCode = memberInfo.region.code;
  console.log(
    `Getting region limits for region: ${regionCode} (${memberInfo.region.name})`,
  );

  const regionDetails = await getRegionByCode(regionCode, operatorToken);

  expect(regionDetails).toHaveProperty("limits");
  console.log(
    `Region limits: ${JSON.stringify(regionDetails.limits, null, 2)}`,
  );

  return regionDetails.limits;
}
