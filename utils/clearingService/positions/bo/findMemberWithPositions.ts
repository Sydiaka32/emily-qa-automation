import { getMemberPositionDetailsBo } from "./getMemberPositionDetailsBo";
import { getAllPositions } from "@utils/clearingService/positions/getAllPositions";

/**
 * Find a member with non-empty positions by trying multiple XMIs
 */
export async function findMemberWithPositions(
  operatorToken: string,
  maxAttempts: number = 5,
): Promise<{ xmi: string; name: string; positions: any[] }> {
  console.log(
    `Looking for a member with non-empty positions (max attempts: ${maxAttempts})...`,
  );

  // Get list of members
  const allPositions = await getAllPositions(operatorToken, 0, 20);

  if (!allPositions.content || allPositions.content.length === 0) {
    throw new Error("No members found in the system");
  }

  console.log(`Found ${allPositions.total_elements} total members`);
  console.log(
    `Checking first ${Math.min(maxAttempts, allPositions.content.length)} members...`,
  );

  // Try multiple members until we find one with positions
  for (let i = 0; i < Math.min(maxAttempts, allPositions.content.length); i++) {
    const member = allPositions.content[i];
    const xmi = member.xmi;

    console.log(`Attempt ${i + 1}: Checking ${xmi} (${member.name})...`);

    try {
      const positions = await getMemberPositionDetailsBo(operatorToken, xmi);

      if (positions && positions.length > 0) {
        console.log(`✓ Found member ${xmi} with ${positions.length} positions`);
        return {
          xmi,
          name: member.name,
          positions,
        };
      } else {
        console.log(`✗ Member ${xmi} has no positions (empty array)`);
      }
    } catch (error: any) {
      console.log(`✗ Error checking ${xmi}: ${error.message}`);
    }
  }

  throw new Error(
    `Could not find a member with positions after ${maxAttempts} attempts`,
  );
}
