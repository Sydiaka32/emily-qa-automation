import { getTariffFeesBo } from "./getTariffFeesBo";

/**
 * Verify that a fee has been successfully deleted
 */
export async function verifyFeeDeletionBo(
  operatorToken: string,
  tariffCode: string,
  feeCode: string,
): Promise<boolean> {
  console.log(`Verifying deletion of fee ${feeCode} from tariff ${tariffCode}`);

  try {
    const feesResult = await getTariffFeesBo(operatorToken, tariffCode);

    if (feesResult.response.status() !== 200) {
      console.log(
        `Failed to get fees list. Status: ${feesResult.response.status()}`,
      );
      return false;
    }

    const fees = feesResult.body;

    // Check if the fee still exists in the list
    const feeExists = fees.some((fee: any) => fee.code === feeCode);

    if (feeExists) {
      console.log(`Fee ${feeCode} still exists in tariff ${tariffCode}`);
      console.log(`Found ${fees.length} fees total`);
    } else {
      console.log(
        `Fee ${feeCode} successfully deleted from tariff ${tariffCode}`,
      );
      console.log(`Remaining fees: ${fees.length}`);
    }

    return !feeExists;
  } catch (error: any) {
    console.log(`Error verifying fee deletion: ${error.message}`);
    return false;
  }
}
