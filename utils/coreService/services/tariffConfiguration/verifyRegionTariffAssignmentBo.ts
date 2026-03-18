import { getAllRegions } from "@utils/coreService/regions/getAllRegions";

/**
 * Verify that a tariff is assigned to a region
 */
export async function verifyRegionTariffAssignmentBo(
  operatorToken: string,
  regionCode: string,
  tariffCode: string,
): Promise<boolean> {
  console.log(`Verifying tariff assignment for region ${regionCode}`);

  try {
    const regions = await getAllRegions(operatorToken);
    const targetRegion = regions.find((region) => region.code === regionCode);

    if (!targetRegion) {
      console.log(`Region ${regionCode} not found`);
      return false;
    }

    if (targetRegion.tariff === null) {
      console.log(`Region ${regionCode} has no tariff assigned`);
      return false;
    }

    const isAssigned = targetRegion.tariff.code === tariffCode;

    if (isAssigned) {
      console.log(
        `Tariff ${tariffCode} is correctly assigned to region ${regionCode}`,
      );
      console.log(`Region name: ${targetRegion.name}`);
      console.log(`Region asset: ${targetRegion.asset}`);
    } else {
      console.log(
        `Region has different tariff assigned: ${targetRegion.tariff.code}`,
      );
    }

    return isAssigned;
  } catch (error: any) {
    console.log(`Error verifying region tariff assignment: ${error.message}`);
    return false;
  }
}
