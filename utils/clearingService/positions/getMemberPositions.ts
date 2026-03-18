import { getRequest } from "@utils/apiUtils";
import { config } from "../../../test.config";
import { expect } from "@playwright/test";

/**
 * Get member positions (assets) from the ledger
 */
export async function getMemberPositions(
  memberXmi: string,
  operatorToken: string,
): Promise<any[]> {
  const { response, body } = await getRequest(
    `/api/v1/ledger-admin/members/${memberXmi}/positions`,
    operatorToken,
    config.backofficeBaseUrl,
  );

  expect(response.status()).toBe(200);
  expect(Array.isArray(body)).toBe(true);

  console.log(`Found ${body.length} positions for member ${memberXmi}`);

  // Log each position with details (using correct field names)
  body.forEach((position: any, index: number) => {
    console.log(`Position ${index + 1}:`);
    console.log(`  - Code: ${position.code}`);
    console.log(`  - Settlement Type: ${position.settlement_type}`);
    console.log(`  - Available Balance (clr_amount): ${position.clr_amount}`);
    console.log(`  - Reserved: ${position.reserved}`);
    console.log(`  - Set Amount: ${position.set_amount}`);
  });

  return body;
}
