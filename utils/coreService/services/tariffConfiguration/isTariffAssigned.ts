import { getTariffsListBo } from "@utils/coreService/services/tariffConfiguration/getTariffsListBo";

/**
 * Check if a specific tariff is assigned
 */
export async function isTariffAssigned(
  operatorToken: string,
  tariffCode: string,
): Promise<boolean> {
  const result = await getTariffsListBo(operatorToken);

  if (result.response.status() !== 200 || !Array.isArray(result.body)) {
    throw new Error(`Failed to get tariffs list or invalid response`);
  }

  const tariff = result.body.find((t: any) => t.code === tariffCode);
  return tariff ? tariff.assigned === true : false;
}
