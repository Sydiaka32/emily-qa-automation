import { Collateral } from "../../../modules/core/collaterals";
import { getMemberCollaterals } from "@utils/coreService/members/getMemberCollaterals";

/**
 * Find a member with collaterals by trying multiple members
 */
export async function findMemberWithCollaterals(
  operatorToken: string,
  membersXmi: string[],
  maxAttempts: number = 5,
): Promise<{ xmi: string; collaterals: Collateral[] } | null> {
  console.log(
    `Looking for a member with collaterals among ${membersXmi.length} members...`,
  );

  // Try up to maxAttempts members or until we find one with collaterals
  const attempts = Math.min(maxAttempts, membersXmi.length);

  for (let i = 0; i < attempts; i++) {
    const xmi = membersXmi[i];
    console.log(`Checking member ${i + 1}/${attempts}: ${xmi}`);

    try {
      const collaterals = await getMemberCollaterals(operatorToken, xmi);

      if (collaterals.length > 0) {
        console.log(
          `Found member ${xmi} with ${collaterals.length} collateral(s)`,
        );
        return { xmi, collaterals };
      } else {
        console.log(`Member ${xmi} has no collaterals`);
      }
    } catch (error: any) {
      console.log(`Failed to get collaterals for ${xmi}: ${error.message}`);
      // Continue to next member
    }
  }

  console.log(`No member with collaterals found after ${attempts} attempts`);
  return null;
}
